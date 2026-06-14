import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currentMonthKey } from "@/lib/utils/date";
import {
  processOverdueSubscriptions,
  getBudgetData,
  getSubscriptions,
} from "@/lib/services/spending";
import { BudgetTab } from "@/components/modules/spending/budget-tab";
import { SubscriptionsTab } from "@/components/modules/spending/subscriptions-tab";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function SpendingPage({ searchParams }: Props) {
  const { month: rawMonth } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "") ? rawMonth! : currentMonthKey();

  await processOverdueSubscriptions();

  const [{ categories, expenses, summary }, subscriptions] = await Promise.all([
    getBudgetData(month),
    getSubscriptions(),
  ]);

  const monthlyCost = subscriptions
    .filter(s => s.status === "Active")
    .reduce((sum, s) => sum + s.monthly_base, 0);
  const annualCost = monthlyCost * 12;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Spending</h1>
        <p className="text-sm text-muted-foreground">Budget tracking and subscriptions</p>
      </div>

      <Tabs defaultValue="budget">
        <TabsList className="w-full">
          <TabsTrigger value="budget"        className="flex-1">Budget</TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex-1">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-5">
          <BudgetTab
            month={month}
            categories={categories}
            expenses={expenses}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-5">
          <SubscriptionsTab
            subscriptions={subscriptions}
            monthlyCost={monthlyCost}
            annualCost={annualCost}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
