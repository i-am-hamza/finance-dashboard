import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoansView } from "@/components/modules/debts/loans-view";
import { EmiHistory } from "@/components/modules/debts/emi-history";
import { getLoans, getEmiPayments, getEmiTrend } from "@/lib/services/debts";
import { formatCompact } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const [loans, payments, trendData] = await Promise.all([
    getLoans(),
    getEmiPayments(),
    getEmiTrend(),
  ]);

  const totalOutstanding = loans
    .filter(l => l.status !== "Closed")
    .reduce((s, l) => s + l.outstanding * l.rate_at_entry, 0);

  const totalMonthlyEmi = loans
    .filter(l => l.status === "Active")
    .reduce((s, l) => s + l.emi_amount * l.rate_at_entry, 0);

  const activeCount  = loans.filter(l => l.status === "Active").length;
  const totalPaidAll = payments.reduce((s, p) => s + p.amount_paid * p.rate_at_entry, 0);

  // Build loan filter options for the history tab
  const loanOptions = loans.map(l => ({
    id:    l.id,
    label: `${l.lender} — ${l.loan_type}`,
  }));

  return (
    <div>
      <PageHeader title="Debts" subtitle="EMI & debt tracker" />

      <div className="space-y-5 px-4 pb-8 md:px-6">
        {/* Summary stats — always visible above tabs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Outstanding"
            value={formatCompact(totalOutstanding)}
            sub={`${activeCount} active loan${activeCount !== 1 ? "s" : ""}`}
          />
          <StatCard
            label="Monthly EMI"
            value={formatCompact(totalMonthlyEmi)}
            sub="Active loans only"
          />
          <StatCard
            label="Total Loans"
            value={String(loans.length)}
            sub={`${loans.filter(l => l.status === "Closed").length} closed`}
          />
          <StatCard
            label="Total Repaid"
            value={formatCompact(totalPaidAll)}
            sub="Across all loans"
          />
        </div>

        {/* Tabbed content */}
        <Tabs defaultValue="loans">
          <TabsList className="mb-5">
            <TabsTrigger value="loans">Active Loans</TabsTrigger>
            <TabsTrigger value="history">EMI History</TabsTrigger>
          </TabsList>

          <TabsContent value="loans">
            <LoansView loans={loans} />
          </TabsContent>

          <TabsContent value="history">
            <EmiHistory
              payments={payments}
              trendData={trendData}
              loanOptions={loanOptions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
