export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

    if (character === "\r") {
      if (content[index + 1] === "\n") {
        index += 1;
      }

      row.push(value.trim());
      value = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    if (character === "\n") {
      row.push(value.trim());
      value = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    value += character;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());

    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function parseImportCsv(content: string): ParsedCsv {
  const normalized = content.replace(/^\uFEFF/, "");
  const rows = parseCsv(normalized);

  if (rows.length === 0) {
    return {
      headers: [],
      rows: [],
    };
  }

  return {
    headers: rows[0],
    rows: rows.slice(1),
  };
}
