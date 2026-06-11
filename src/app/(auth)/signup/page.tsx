import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full justify-items-center gap-6">
        <Link href="/" className="text-center">
          <p className="text-sm font-semibold text-accent">CrediOS by Sanvat</p>
          <h1 className="mt-1 text-2xl font-semibold">Crea tu espacio financiero</h1>
        </Link>
        <Suspense fallback={null}>
          <AuthForm
            mode="signup"
            supabaseConfig={{
              url: getSupabaseUrl(),
              publishableKey: getSupabasePublishableKey(),
            }}
          />
        </Suspense>
      </div>
    </main>
  );
}
