import type { FieldDef, ImportRow, ParsedRow } from "./types";

// ─── Raw CSV parsing ──────────────────────────────────────────────────────────

/** Parse a CSV string respecting quoted fields. */
export function parseRawCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let inQuotes = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  }

  const headers = parseLine(lines[0]);
  const rows    = lines.slice(1).filter(l => l.trim()).map(parseLine);
  return { headers, rows };
}

// ─── Auto column mapping ──────────────────────────────────────────────────────

/** Return a mapping of { fieldKey → best-matching CSV header | null }. */
export function autoMapColumns(
  headers: string[],
  fields: FieldDef[],
): Record<string, string | null> {
  const lower = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9 _]/g, ""));
  const mapping: Record<string, string | null> = {};
  for (const f of fields) {
    let found: string | null = null;
    for (const alias of f.aliases) {
      const idx = lower.indexOf(alias.toLowerCase());
      if (idx >= 0) { found = headers[idx]; break; }
    }
    mapping[f.key] = found;
  }
  return mapping;
}

// ─── Date format detection ────────────────────────────────────────────────────

export type DateFmt =
  | "YYYY-MM-DD"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "DD-MM-YYYY"
  | "DD.MM.YYYY"
  | "auto";

const DATE_PATTERNS: { fmt: DateFmt; re: RegExp }[] = [
  { fmt: "YYYY-MM-DD", re: /^\d{4}-\d{2}-\d{2}$/ },
  { fmt: "DD/MM/YYYY", re: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
  { fmt: "DD-MM-YYYY", re: /^\d{1,2}-\d{1,2}-\d{4}$/ },
  { fmt: "DD.MM.YYYY", re: /^\d{1,2}\.\d{1,2}\.\d{4}$/ },
];

/** Detect the date format from a list of sample date strings. */
export function detectDateFormat(samples: string[]): DateFmt {
  const clean = samples.filter(Boolean).slice(0, 30);
  if (!clean.length) return "auto";

  for (const { fmt, re } of DATE_PATTERNS) {
    if (clean.every(s => re.test(s.trim()))) {
      // For slash format: if any day-part > 12, it must be DD/MM
      if (fmt === "DD/MM/YYYY") {
        const anyDayFirst = clean.some(s => parseInt(s.split("/")[0]) > 12);
        if (!anyDayFirst) {
          // Ambiguous — default to Indian convention DD/MM/YYYY
          return "DD/MM/YYYY";
        }
      }
      return fmt;
    }
  }
  return "auto";
}

/** Normalise a raw date string to YYYY-MM-DD.  Returns null if unparseable. */
export function normalizeDate(raw: string, fmt: DateFmt): string | null {
  const s = raw.trim();
  if (!s) return null;

  if (fmt === "YYYY-MM-DD")
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;

  if (fmt === "DD/MM/YYYY") {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
  }
  if (fmt === "DD-MM-YYYY") {
    const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
  }
  if (fmt === "DD.MM.YYYY") {
    const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
  }

  // "auto" — try in order
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

// ─── Number format detection + normalisation ──────────────────────────────────

/** Strip currency symbols, detect thousands/decimal separators, return number or null. */
export function normalizeNumber(raw: string): number | null {
  const s = raw.trim().replace(/[₹$€£¥₩\s%]/g, "");
  if (!s) return null;

  const hasComma  = s.includes(",");
  const hasPeriod = s.includes(".");
  let normalized  = s;

  if (hasComma && hasPeriod) {
    const lastComma  = s.lastIndexOf(",");
    const lastPeriod = s.lastIndexOf(".");
    if (lastComma > lastPeriod) {
      // EU: 1.234,56
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      // US: 1,234.56
      normalized = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Only comma — thousands (1,000) or decimal (1,5)?
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[1])) {
      normalized = s.replace(",", ""); // thousands
    } else {
      normalized = s.replace(",", "."); // decimal
    }
  }

  normalized = normalized.replace(/[^\d.\-]/g, "");
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

// ─── Detect date format from a specific column across all rows ────────────────

export function detectColumnDateFormat(
  rows: string[][],
  headers: string[],
  columnName: string,
): DateFmt {
  const idx = headers.indexOf(columnName);
  if (idx < 0) return "auto";
  const samples = rows.slice(0, 30).map(r => r[idx] ?? "").filter(Boolean);
  return detectDateFormat(samples);
}

// ─── Apply mapping + validate ─────────────────────────────────────────────────

export function applyMapping(
  rawRows: string[][],
  headers: string[],
  mapping: Record<string, string | null>,
  fields: FieldDef[],
  dateFormat: DateFmt,
): ParsedRow[] {
  return rawRows.map((row, index) => {
    const rawCells: Record<string, string> = {};
    headers.forEach((h, i) => { rawCells[h] = row[i] ?? ""; });

    const cells: ImportRow = {};
    const errors: string[] = [];

    for (const field of fields) {
      const csvColumn = mapping[field.key] ?? null;
      let raw = csvColumn !== null ? (rawCells[csvColumn] ?? "").trim() : "";

      // Fall back to default
      if (!raw && field.defaultValue !== undefined) raw = field.defaultValue;

      if (field.required && !raw) {
        errors.push(`${field.label} is required`);
        cells[field.key] = "";
        continue;
      }

      if (!raw) { cells[field.key] = field.defaultValue ?? ""; continue; }

      switch (field.type) {
        case "date": {
          const d = normalizeDate(raw, dateFormat);
          if (!d) errors.push(`${field.label}: cannot parse date "${raw}"`);
          cells[field.key] = d ?? raw;
          break;
        }
        case "number": {
          const n = normalizeNumber(raw);
          if (n === null) errors.push(`${field.label}: invalid number "${raw}"`);
          cells[field.key] = n !== null ? String(n) : raw;
          break;
        }
        case "select": {
          if (!field.options) { cells[field.key] = raw; break; }
          const match = field.options.find(o => o.toLowerCase() === raw.toLowerCase());
          if (match) {
            cells[field.key] = match;
          } else if (field.defaultValue) {
            cells[field.key] = field.defaultValue;
          } else {
            errors.push(`${field.label}: "${raw}" not valid (${field.options.join(", ")})`);
            cells[field.key] = raw;
          }
          break;
        }
        default:
          cells[field.key] = raw;
      }
    }

    return { index, cells, rawCells, errors };
  });
}

// ─── Template generation ──────────────────────────────────────────────────────

export function generateTemplateCsv(
  fields: FieldDef[],
  sampleRows: Array<Record<string, string>> = [],
): string {
  const quote = (v: string) => (v.includes(",") ? `"${v}"` : v);
  const header = fields.map(f => quote(f.label)).join(",");

  const dataRows = sampleRows.length
    ? sampleRows.map(row => fields.map(f => quote(row[f.key] ?? f.example ?? "")).join(","))
    : [fields.map(f => quote(f.example ?? (f.options ? f.options[0] : "") ?? "")).join(",")];

  return [header, ...dataRows].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
