import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./card";

export function ConfigNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
      <CardContent className="flex gap-3 p-4 text-amber-900 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Supabase todavia no esta configurado.</p>
          <p className="mt-1 text-sm leading-6">
            Completa `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`,
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `DATABASE_URL`, luego aplica la migracion SQL.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
