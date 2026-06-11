import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AuthForm } from "@/features/auth/auth-form";
import { ACCENT_COLOR_COOKIE, parseAccentColor } from "@/lib/accent-theme";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isGoogleAuthEnabled,
  isGoogleAuthProviderReady,
} from "@/lib/supabase/env";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const initialAccent = parseAccentColor(cookieStore.get(ACCENT_COLOR_COOKIE)?.value) ?? "apple-green";

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
            initialAccent={initialAccent}
            supabaseConfig={{
              url: getSupabaseUrl(),
              publishableKey: getSupabasePublishableKey(),
              googleEnabled: isGoogleAuthEnabled(),
              googleProviderReady: isGoogleAuthProviderReady(),
            }}
          />
        </Suspense>
      </div>
    </main>
  );
}
