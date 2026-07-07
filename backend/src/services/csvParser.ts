import { parse } from "csv-parse/sync";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  total: number;
}

/**
 * Parses a CSV buffer into headers + rows.
 * Trims whitespace from keys and values.
 */
export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    cast: false,
  }) as Record<string, string>[];

  if (!records || records.length === 0) {
    return { headers: [], rows: [], total: 0 };
  }

  // Sanitise headers (trim keys)
  const sanitised = records.map((row) => {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim().replace(/\uFEFF/g, ""); // strip BOM
      clean[cleanKey] = String(value ?? "").trim();
    }
    return clean;
  });

  const headers = Object.keys(sanitised[0] ?? {});

  return {
    headers,
    rows: sanitised,
    total: sanitised.length,
  };
}

/**
 * Splits an array into chunks of a given size.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
