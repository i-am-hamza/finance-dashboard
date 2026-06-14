"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  parseRawCsv, autoMapColumns, detectColumnDateFormat,
  applyMapping, generateTemplateCsv, downloadCsv,
} from "@/lib/csv/parser";
import type { FieldDef, ImportRow } from "@/lib/csv/types";
import type { DateFmt } from "@/lib/csv/parser";

const NONE = "__none__";

const DATE_FMT_LABELS: Record<DateFmt, string> = {
  "auto":       "Auto-detect",
  "YYYY-MM-DD": "YYYY-MM-DD",
  "DD/MM/YYYY": "DD/MM/YYYY (Indian)",
  "MM/DD/YYYY": "MM/DD/YYYY (US)",
  "DD-MM-YYYY": "DD-MM-YYYY",
  "DD.MM.YYYY": "DD.MM.YYYY",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schema: FieldDef[];
  onImport: (rows: ImportRow[]) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
  templateFilename?: string;
  title?: string;
}

export function CsvImporter({
  open,
  onOpenChange,
  schema,
  onImport,
  onSuccess,
  templateFilename = "template.csv",
  title = "Import CSV",
}: Props) {
  const fileRef                           = useRef<HTMLInputElement>(null);
  const [fileName, setFileName]           = useState("");
  const [headers,  setHeaders]            = useState<string[]>([]);
  const [rawRows,  setRawRows]            = useState<string[][]>([]);
  const [mapping,  setMapping]            = useState<Record<string, string | null>>({});
  const [dateFmt,  setDateFmt]            = useState<DateFmt>("auto");
  const [isPending, startTransition]      = useTransition();

  const hasFile     = rawRows.length > 0;
  const hasDateField = schema.some(f => f.type === "date");
  const requiredFields = schema.filter(f => f.required);

  const parsedRows  = hasFile ? applyMapping(rawRows, headers, mapping, schema, dateFmt) : [];
  const validRows   = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setDateFmt("auto");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseRawCsv(text);
      setHeaders(h);
      setRawRows(r);
      const autoMap = autoMapColumns(h, schema);
      setMapping(autoMap);
      const dateField = schema.find(f => f.type === "date");
      if (dateField && autoMap[dateField.key]) {
        setDateFmt(detectColumnDateFormat(r, h, autoMap[dateField.key]!));
      } else {
        setDateFmt("auto");
      }
    };
    reader.readAsText(file);
  };

  const setFieldMapping = (key: string, value: string | null) =>
    setMapping(prev => ({ ...prev, [key]: value }));

  const handleImport = () => {
    if (!validRows.length) return;
    startTransition(async () => {
      const result = await onImport(validRows.map(r => r.cells));
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${validRows.length} row${validRows.length !== 1 ? "s" : ""} imported`);
        onOpenChange(false);
        reset();
        onSuccess?.();
      }
    });
  };

  const handleDownloadTemplate = () =>
    downloadCsv(templateFilename, generateTemplateCsv(schema));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={13} />
              {hasFile ? "Replace file" : "Choose CSV file"}
            </Button>
            {hasFile && (
              <>
                <span className="text-xs text-muted-foreground truncate">
                  {fileName} — {rawRows.length} rows
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto shrink-0 text-xs"
                  onClick={reset}
                >
                  Clear
                </Button>
              </>
            )}
            {!hasFile && (
              <span className="text-xs text-muted-foreground">
                Download the template below to see the expected format.
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {hasFile && (
            <>
              {/* Column mapping */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Column Mapping
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground w-2/5">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          CSV Column
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {schema.map(field => (
                        <tr key={field.key}>
                          <td className="px-3 py-1.5 text-foreground">
                            {field.label}
                            {field.required && (
                              <span className="text-destructive ml-0.5">*</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            <Select
                              value={mapping[field.key] ?? NONE}
                              onValueChange={(v: string | null) =>
                                setFieldMapping(field.key, v === NONE || !v ? null : v)
                              }
                            >
                              <SelectTrigger size="sm" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE}>— Not mapped —</SelectItem>
                                {headers.map(h => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Date format picker */}
              {hasDateField && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground shrink-0">Date format</span>
                  <Select
                    value={dateFmt}
                    onValueChange={(v: string | null) => { if (v) setDateFmt(v as DateFmt); }}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DATE_FMT_LABELS) as DateFmt[]).map(fmt => (
                        <SelectItem key={fmt} value={fmt}>
                          {DATE_FMT_LABELS[fmt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Preview */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Preview (first {Math.min(5, parsedRows.length)} rows)
                </p>
                <div className="max-h-[200px] overflow-auto rounded-lg border border-border">
                  <table className="w-full min-w-max text-xs">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                      <tr>
                        {requiredFields.map(f => (
                          <th
                            key={f.key}
                            className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {f.label}
                          </th>
                        ))}
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.slice(0, 5).map(row => (
                        <tr
                          key={row.index}
                          className={row.errors.length ? "bg-destructive/5" : ""}
                        >
                          {requiredFields.map(f => (
                            <td
                              key={f.key}
                              className="px-2 py-1.5 max-w-[150px] truncate"
                            >
                              {row.cells[f.key] ? (
                                row.cells[f.key]
                              ) : (
                                <span className="text-muted-foreground italic">—</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {row.errors.length > 0 ? (
                              <span className="text-destructive">{row.errors[0]}</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle size={12} />
                    {invalidRows.length} with errors (will be skipped)
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleDownloadTemplate}
          >
            <Download size={13} />
            Template
          </Button>
          {hasFile && (
            <Button
              type="button"
              size="sm"
              disabled={!validRows.length || isPending}
              onClick={handleImport}
              className="gap-1.5"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Import{validRows.length > 0 ? ` (${validRows.length})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
