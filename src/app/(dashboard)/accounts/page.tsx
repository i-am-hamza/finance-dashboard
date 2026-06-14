import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashAccountsTab } from "@/components/modules/accounts/cash-accounts-tab";
import { IncomeTab } from "@/components/modules/accounts/income-tab";
import {
  getAccounts,
  getTotalLiquidAssets,
  getCurrentMonthIncome,
  getIncomeLast6Months,
  getIncomeLog,
} from "@/lib/services/accounts";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, total, thisMonthIncome, incomeChart, incomeLog] = await Promise.all([
    getAccounts(),
    getTotalLiquidAssets(),
    getCurrentMonthIncome(),
    getIncomeLast6Months(),
    getIncomeLog(),
  ]);

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Cash, savings & income" />

      <div className="px-4 pb-8 md:px-6">
        <Tabs defaultValue="cash">
          <TabsList className="mb-5">
            <TabsTrigger value="cash">Cash & Savings</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="cash">
            <CashAccountsTab accounts={accounts} total={total} />
          </TabsContent>

          <TabsContent value="income">
            <IncomeTab
              entries={incomeLog}
              chartData={incomeChart}
              thisMonth={thisMonthIncome}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
