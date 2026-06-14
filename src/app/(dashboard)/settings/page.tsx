import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/modules/settings/profile-form";
import { ThemeSection } from "@/components/modules/settings/theme-section";
import { CurrencyForm } from "@/components/modules/settings/currency-form";
import { DangerZone } from "@/components/modules/settings/danger-zone";
import { getSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

function Section({
  heading,
  description,
  children,
}: {
  heading: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const settings = await getSettings();
  if (!settings) redirect("/login");

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, appearance, and preferences" />

      <div className="space-y-8 px-4 pb-10 md:px-6 max-w-xl">

        {/* ── Profile ───────────────────────────────────────────────── */}
        <Section
          heading="Profile"
          description="Your name shown across the dashboard"
        >
          <ProfileForm
            email={settings.email}
            displayName={settings.displayName}
          />
        </Section>

        <Separator />

        {/* ── Appearance ────────────────────────────────────────────── */}
        <Section
          heading="Appearance"
          description="Choose light, dark, or follow your system setting"
        >
          <ThemeSection />
        </Section>

        <Separator />

        {/* ── Base Currency ─────────────────────────────────────────── */}
        <Section
          heading="Base Currency"
          description="The currency used for all totals and calculations"
        >
          <CurrencyForm baseCurrency={settings.baseCurrency} />
        </Section>

        <Separator />

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <Section heading="Danger Zone">
          <DangerZone />
        </Section>

      </div>
    </div>
  );
}
