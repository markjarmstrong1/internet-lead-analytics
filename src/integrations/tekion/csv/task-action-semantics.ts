import type { TekionCommunicationChannel } from "../timeline/normalized-timeline-event";

export type TekionTaskActionChannel =
  | TekionCommunicationChannel;

export type TekionTaskActionSemantics = {
  rawAction: string;
  channels: TekionTaskActionChannel[];
  unknownTokens: string[];
};

const ACTION_CHANNELS: Record<
  string,
  TekionTaskActionChannel
> = {
  call: "phone",
  mail: "email",
  text: "text",
};

const CHANNEL_ORDER: TekionTaskActionChannel[] = [
  "email",
  "text",
  "phone",
  "voicemail",
];

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function parseTaskAction(
  action: string,
): TekionTaskActionSemantics {
  const rawAction = action.trim();

  if (!rawAction) {
    return {
      rawAction,
      channels: [],
      unknownTokens: [],
    };
  }

  const channels = new Set<TekionTaskActionChannel>();
  const unknownTokens: string[] = [];

  for (const rawToken of rawAction.split(",")) {
    const normalizedToken = normalizeToken(rawToken);

    if (!normalizedToken) {
      continue;
    }

    const channel = ACTION_CHANNELS[normalizedToken];

    if (channel) {
      channels.add(channel);
    } else {
      unknownTokens.push(rawToken.trim());
    }
  }

  return {
    rawAction,
    channels: CHANNEL_ORDER.filter((channel) =>
      channels.has(channel),
    ),
    unknownTokens,
  };
}
