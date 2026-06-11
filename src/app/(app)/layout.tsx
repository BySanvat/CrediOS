import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { ConfigNotice } from "@/components/ui/config-notice";
import { UserIntentOnboarding } from "@/features/onboarding/user-intent-onboarding";
import { parseUsageMode, USAGE_MODE_COOKIE } from "@/lib/usage-mode";
import { getAppContext } from "@/server/context";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAppContext();
  const cookieStore = await cookies();
  const usageMode = parseUsageMode(cookieStore.get(USAGE_MODE_COOKIE)?.value);

  if (!ctx.configured) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <ConfigNotice />
        </div>
      </div>
    );
  }

  return (
    <AppShell workspaceName={ctx.workspace.name} usageMode={usageMode}>
      {children}
      <UserIntentOnboarding initialMode={usageMode} />
    </AppShell>
  );
}
