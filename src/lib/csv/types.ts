export type FieldType = "text" | "number" | "date" | "select";

export interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  type: FieldType;
  /** Valid enum values for 'select' type */
  options?: readonly string[];
  /** Lowercase aliases for auto-mapping CSV headers */
  aliases: string[];
  /** Example value shown in the downloadable template */
  example?: string;
  /** Fallback when column is not mapped (optional fields only) */
  defaultValue?: string;
}

/** One fully-normalised import row passed to onImport.
 *  All values are strings: dates → "YYYY-MM-DD", numbers → "1234.56". */
export type ImportRow = Record<string, string>;

export interface ParsedRow {
  index: number;
  cells: ImportRow;                  // fieldKey → normalised value
  rawCells: Record<string, string>;  // csvHeader → raw CSV value
  errors: string[];
}
