function hash(value: string): string {
  let result = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return (result >>> 0).toString(16).padStart(8, "0");
}

export function sourceEventId(
  sourceFile: string,
  rawType: string,
  occurredAt: string,
  actor: string,
  details: string,
): string {
  const evidence = [
    sourceFile,
    rawType,
    occurredAt,
    actor,
    details,
  ].join("\u001f");

  return `tekion:${hash(evidence)}`;
}
