import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FireCalculator } from "@/components/modules/goals/fire-calculator";
import { GoalsList } from "@/components/modules/goals/goals-list";
import {
  getFireSettings,
  getGoals,
  getGoalsAutoData,
} from "@/lib/services/goals";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const [settings, goals, autoData] = await Promise.all([
    getFireSettings(),
    getGoals(),
    getGoalsAutoData(),
  ]);

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="FIRE calculator and financial milestones"
      />

      <div className="px-4 pb-8 md:px-6">
        <Tabs defaultValue="fire">
          <TabsList className="mb-6">
            <TabsTrigger value="fire">FIRE Calculator</TabsTrigger>
            <TabsTrigger value="goals">My Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="fire">
            <FireCalculator settings={settings} autoData={autoData} />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsList initialGoals={goals} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
