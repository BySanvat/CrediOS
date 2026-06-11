import { AppShell } from "@/components/layout/app-shell";
import { ConfigNotice } from "@/components/ui/config-notice";
import { getAppContext } from "@/server/context";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAppContext();

  if (!ctx.configured) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <ConfigNotice />
        </div>
      </div>
    );
  }

  return <AppShell workspaceName={ctx.workspace.name}>{children}</AppShell>;
}
