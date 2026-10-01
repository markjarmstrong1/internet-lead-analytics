export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value.trim());

  return values;
}

export function parseImportCsv(content: string): ParsedCsv {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
    };
  }

  const headers = parseCsvLine(lines[0]);

  const rows = lines.slice(1).map(parseCsvLine);

  return {
    headers,
    rows,
  };
}
