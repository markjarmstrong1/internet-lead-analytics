import type {
  TekionCommunicationChannel,
  TekionCommunicationDirection,
} from "./normalized-timeline-event";

type CommunicationSemantics = {
  channel: TekionCommunicationChannel;
  direction: TekionCommunicationDirection;
};

export function communicationSemanticsForType(
  rawType: string,
): CommunicationSemantics | undefined {
  switch (rawType) {
    case "Email Sent":
      return { channel: "email", direction: "outbound" };
    case "Email Received":
      return { channel: "email", direction: "inbound" };
    case "Text Sent":
      return { channel: "text", direction: "outbound" };
    case "Text Received":
      return { channel: "text", direction: "inbound" };
    case "Outbound Call":
      return { channel: "phone", direction: "outbound" };
    case "Inbound Call":
      return { channel: "phone", direction: "inbound" };
    case "Outbound Voicemail":
      return { channel: "voicemail", direction: "outbound" };
    case "Missed Call":
      return { channel: "phone", direction: "unknown" };
    case "Call Attempt":
      return { channel: "phone", direction: "outbound" };
    case "Call Back":
      return { channel: "phone", direction: "unknown" };
    default:
      return undefined;
  }
}
