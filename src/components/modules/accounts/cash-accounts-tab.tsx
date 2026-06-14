"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Landmark, Wallet, Banknote, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { deleteAccount, bulkImportAccounts } from "@/lib/actions/accounts";
import { AccountForm } from "./account-form";
import { CsvImporter } from "@/components/csv/csv-importer";
import { ACCOUNT_FIELDS } from "@/lib/csv/schemas";
import type { CashAccount } from "@/lib/services/accounts";

const TYPE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  Savings:      "outline",
  Current:      "secondary",
  FixedDeposit: "default",
  Wallet:       "secondary",
  Cash:         "outline",
};

function AccountIcon({ type }: { type: string }) {
  if (type === "Wallet") return <Wallet size={16} className="text-muted-foreground" />;
  if (type === "Cash")   return <Banknote size={16} className="text-muted-foreground" />;
  return <Landmark size={16} className="text-muted-foreground" />;
}

interface Props {
  accounts: CashAccount[];
  total: number;
}

export function CashAccountsTab({ accounts, total }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen,   setFormOpen]    = useState(false);
  const [editing,    setEditing]     = useState<CashAccount | undefined>();
  const [importOpen, setImportOpen]  = useState(false);

  const openAdd  = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (a: CashAccount) => { setEditing(a); setFormOpen(true); };

  const handleDelete = (a: CashAccount) => {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteAccount(a.id);
      if ("error" in result && result.error) toast.error(result.error);
      else { toast.success("Account deleted"); router.refresh(); }
    });
  };

  return (
    <>
      <AccountForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
      />
      <CsvImporter
        open={importOpen}
        onOpenChange={setImportOpen}
        schema={ACCOUNT_FIELDS}
        onImport={bulkImportAccounts}
        onSuccess={router.refresh}
        templateFilename="accounts-template.csv"
        title="Import Accounts"
      />

      <div className="space-y-4">
        {/* Stat header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Liquid Assets</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatCompact(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5 rounded-lg">
              <Upload size={14} />
              Import CSV
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-1.5 rounded-lg">
              <Plus size={14} />
              Add Account
            </Button>
          </div>
        </div>

        {/* Account list */}
        {accounts.length === 0 ? (
          <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No accounts yet</p>
            <Button size="sm" variant="outline" onClick={openAdd}>
              <Plus size={14} />
              Add your first account
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {accounts.map(a => {
              const baseValue = a.balance * a.rate_at_entry;
              const showBase  = a.currency !== "INR";
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/40 transition-colors">
                  <AccountIcon type={a.account_type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">{a.name}</span>
                      <Badge variant={TYPE_BADGE[a.account_type] ?? "outline"}>
                        {a.account_type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {a.bank_name && (
                        <span className="text-xs text-muted-foreground">{a.bank_name}</span>
                      )}
                      {a.account_type === "FixedDeposit" && a.fd_maturity_date && (
                        <span className="text-xs text-muted-foreground">
                          Matures {formatDate(a.fd_maturity_date)}
                          {a.fd_interest_rate != null && ` · ${a.fd_interest_rate}% p.a.`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm tabular-nums">
                      {formatCurrency(a.balance, a.currency)}
                    </p>
                    {showBase && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        ≈ {formatCompact(baseValue)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => openEdit(a)}
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(a)}
                      disabled={isPending}
                      aria-label="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
