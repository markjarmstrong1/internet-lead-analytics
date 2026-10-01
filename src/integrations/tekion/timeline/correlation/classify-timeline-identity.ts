import type { TimelineIdentityEvidence } from "./timeline-identity-evidence";

type TimelineIdentityInput = {
  timelineIdentity: string;
  candidateIdentity: string;
};

function normalize(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  let previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index,
  );

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];

    for (let column = 1; column <= b.length; column += 1) {
      current.push(
        Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] +
            (a[row - 1] === b[column - 1] ? 0 : 1),
        ),
      );
    }

    previous = current;
  }

  return previous[b.length];
}

function tokenSimilarity(a: string, b: string): number {
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);
}

function identitySimilarity(
  timelineTokens: string[],
  candidateTokens: string[],
): number {
  if (timelineTokens.length !== candidateTokens.length) {
    return 0;
  }

  const unused = [...candidateTokens];
  let total = 0;

  for (const timelineToken of timelineTokens) {
    let bestIndex = 0;
    let bestScore = 0;

    for (let index = 0; index < unused.length; index += 1) {
      const score = tokenSimilarity(
        timelineToken,
        unused[index],
      );

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    total += bestScore;
    unused.splice(bestIndex, 1);
  }

  return timelineTokens.length === 0
    ? 0
    : total / timelineTokens.length;
}

export function classifyTimelineIdentity(
  input: TimelineIdentityInput,
): TimelineIdentityEvidence {
  const timelineTokens = normalize(input.timelineIdentity);
  const candidateTokens = normalize(input.candidateIdentity);

  if (
    timelineTokens.length === candidateTokens.length &&
    timelineTokens.length > 0 &&
    timelineTokens.every((token) =>
      candidateTokens.includes(token),
    )
  ) {
    return {
      status: "direct_match",
      similarity: 1,
    };
  }

  const similarity = identitySimilarity(
    timelineTokens,
    candidateTokens,
  );

  return {
    status:
      similarity >= 0.85
        ? "unresolved_variant"
        : "no_match",
    similarity,
  };
}
