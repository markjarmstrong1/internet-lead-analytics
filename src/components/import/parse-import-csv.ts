export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function splitTekionLogicalRows(content: string): string[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const rows: string[] = [];
  let current: string[] = [];

  const isLeadRowStart = (line: string) =>
    /^"[^"]*","[^"]*"/.test(line);

  for (const line of lines) {
    if (isLeadRowStart(line)) {
      if (current.length > 0) {
        rows.push(current.join(" "));
      }

      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    } else if (line.trim()) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    rows.push(current.join(" "));
  }

  return rows;
}

function parseCsvRow(content: string): string[] {
  const row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (quoted) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        value += character;
      }

      continue;
    }

    if (character === '"') {
      quoted = true;
      continue;
    }

    if (character === ",") {
      row.push(value.trim());
      value = "";
      continue;
    }

    value += character;
  }

  row.push(value.trim());

  return row;
}

export function parseImportCsv(content: string): ParsedCsv {
  const normalized = content.replace(/^\uFEFF/, "");
  const logicalRows = splitTekionLogicalRows(normalized);

  if (logicalRows.length === 0) {
    return {
      headers: [],
      rows: [],
    };
  }

  return {
    headers: parseCsvRow(logicalRows[0]),
    rows: logicalRows
      .slice(1)
      .map(parseCsvRow)
      .filter((row) => row.some((cell) => cell.length > 0)),
  };
}
