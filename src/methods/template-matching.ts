export const TEMPLATE_MATCHER_VERSION = "sequence-v2";

export type TemplateMatchStatus =
  | "matched"
  | "review"
  | "unmatched";

export type TemplateCandidate = {
  templateId: string;
  templateName: string;
  sourceKind: "email" | "text";
  content: string;
  subject: string | null;
  normalizedContent: string;
  normalizedSubject: string | null;
};

export type TemplateMatch = {
  templateId: string | null;
  status: TemplateMatchStatus;
  score: number | null;
  runnerUpScore: number | null;
  method: string;
  matchedFragment: string | null;
  evidence: {
    subjectMatch: boolean;
    matchedTokens: number;
    templateTokens: number;
    coverage: number;
    candidateCount: number;
  };
};

type Segment = {
  text: string;
  normalized: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "have",
  "i",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "we",
  "will",
  "with",
  "you",
  "your",
]);

export function normalizeCommunication(value: string): string {
  return normalize(value);
}

export function normalize(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\{\{[^}]+\}\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-zA-Z0-9$%+@#'-]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTekionDynamicTags(value: string): {
  literal: string;
  segments: Segment[];
} {
  const segments: Segment[] = [];

  const pattern =
    /<span[^>]*class=["'][^"']*dynamic_tag[^"']*["'][^>]*>[\s\S]*?<\/span>/gi;

  let last = 0;

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;

    if (start > last) {
      const raw = value.slice(last, start);
      const normalized = normalize(raw);

      if (normalized) {
        segments.push({
          text: raw,
          normalized,
        });
      }
    }

    last = start + match[0].length;
  }

  if (last < value.length) {
    const raw = value.slice(last);
    const normalized = normalize(raw);

    if (normalized) {
      segments.push({
        text: raw,
        normalized,
      });
    }
  }

  return {
    literal: segments.map((segment) => segment.text).join(" "),
    segments,
  };
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter(Boolean);
}

function usefulTokens(value: string): string[] {
  return tokenize(value).filter(
    (token) => token.length >= 3 && !STOP_WORDS.has(token),
  );
}

function longestOrderedMatch(
  templateTokens: string[],
  communicationTokens: string[],
): {
  count: number;
  fragment: string | null;
} {
  if (!templateTokens.length || !communicationTokens.length) {
    return {
      count: 0,
      fragment: null,
    };
  }

  /*
   * Tekion substitutes dynamic values into templates:
   *
   *   "Hi John, your 2025 Honda Civic..."
   *
   * while the stored template contains:
   *
   *   "Hi {{customer_first_name}}, your {{vehicle_year}}..."
   *
   * A contiguous substring matcher therefore breaks as soon as
   * Tekion inserts one of those values.
   *
   * Instead, find the longest ordered sequence of template tokens
   * appearing in the communication. This allows arbitrary dynamic
   * values between template words while still requiring the template
   * language to appear in the correct order.
   */
  const rows = templateTokens.length + 1;
  const cols = communicationTokens.length + 1;

  const dp = Array.from(
    { length: rows },
    () => new Uint16Array(cols),
  );

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (templateTokens[i - 1] === communicationTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matched: string[] = [];
  let i = templateTokens.length;
  let j = communicationTokens.length;

  while (i > 0 && j > 0) {
    if (templateTokens[i - 1] === communicationTokens[j - 1]) {
      matched.push(templateTokens[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  matched.reverse();

  return {
    count: matched.length,
    fragment: matched.length ? matched.join(" ") : null,
  };
}

function scoreTemplate(
  communication: string,
  subject: string | null,
  template: TemplateCandidate,
): TemplateMatch & { rank: number } {
  const communicationNormalized = normalize(communication);
  const communicationTokens = usefulTokens(communicationNormalized);

  const templateTokens = usefulTokens(template.normalizedContent);

  const longest = longestOrderedMatch(
    templateTokens,
    communicationTokens,
  );

  const matchedTokens = longest.count;
  const templateTokenCount = templateTokens.length;

  const coverage =
    templateTokenCount > 0
      ? matchedTokens / templateTokenCount
      : 0;

  const normalizedSubject = subject
    ? normalize(subject)
    : "";

  const subjectMatch =
    Boolean(
      normalizedSubject &&
        template.normalizedSubject &&
        normalizedSubject === template.normalizedSubject,
    );

  let score = coverage;

  if (subjectMatch) {
    score = Math.min(1, score + 0.35);
  }

  /*
   * The match must contain a genuinely useful portion of the
   * template. This prevents generic templates such as BLANK from
   * matching everything.
   */
  const hasEnoughEvidence =
    matchedTokens >= 8 &&
    longest.count >= Math.min(12, Math.max(8, templateTokenCount));

  const strongEnough =
    (subjectMatch && matchedTokens >= 8) ||
    (coverage >= 0.55 && matchedTokens >= 10) ||
    (coverage >= 0.70 && matchedTokens >= 8);

  let status: TemplateMatchStatus = "unmatched";

  if (hasEnoughEvidence && strongEnough) {
    status = "matched";
  } else if (
    matchedTokens >= 6 &&
    (coverage >= 0.30 || subjectMatch)
  ) {
    status = "review";
  }

  return {
    templateId:
      status === "unmatched"
        ? null
        : template.templateId,
    status,
    score: status === "unmatched" ? null : Number(score.toFixed(5)),
    runnerUpScore: null,
    method: subjectMatch
      ? "subject-plus-body-portion"
      : "body-portion",
    matchedFragment: longest.fragment,
    evidence: {
      subjectMatch,
      matchedTokens,
      templateTokens: templateTokenCount,
      coverage: Number(coverage.toFixed(5)),
      candidateCount: 1,
    },
    rank: score,
  };
}

export function matchCommunicationToTemplates(
  communication: string,
  subject: string | null,
  templates: TemplateCandidate[],
): TemplateMatch {
  const candidates = templates
    .map((template) =>
      scoreTemplate(communication, subject, template),
    )
    .filter((candidate) => candidate.status !== "unmatched")
    .sort((a, b) => b.rank - a.rank);

  if (!candidates.length) {
    return {
      templateId: null,
      status: "unmatched",
      score: null,
      runnerUpScore: null,
      method: "no-sufficient-evidence",
      matchedFragment: null,
      evidence: {
        subjectMatch: false,
        matchedTokens: 0,
        templateTokens: 0,
        coverage: 0,
        candidateCount: 0,
      },
    };
  }

  const best = candidates[0];
  const second = candidates[1];

  const margin =
    second ? best.rank - second.rank : best.rank;

  /*
   * Near-ties are intentionally sent to review.
   */
  if (
    second &&
    margin < 0.08 &&
    best.evidence.coverage < 0.9
  ) {
    return {
      templateId: null,
      status: "review",
      score: Number(best.rank.toFixed(5)),
      runnerUpScore: Number(second.rank.toFixed(5)),
      method: "ambiguous-portion-match",
      matchedFragment: best.matchedFragment,
      evidence: {
        ...best.evidence,
        candidateCount: candidates.length,
      },
    };
  }

  return {
    templateId: best.templateId,
    status: best.status,
    score: Number(best.rank.toFixed(5)),
    runnerUpScore: second
      ? Number(second.rank.toFixed(5))
      : null,
    method: best.method,
    matchedFragment: best.matchedFragment,
    evidence: {
      ...best.evidence,
      candidateCount: candidates.length,
    },
  };
}
