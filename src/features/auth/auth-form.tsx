"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { AuthAccentPicker } from "@/features/personalization/accent-color-picker";
import type { AccentColorId } from "@/lib/accent-theme";
import { createClient, type SupabaseBrowserConfig } from "@/lib/supabase/client";

export function AuthForm({
  mode,
  supabaseConfig,
  initialAccent,
}: {
  mode: "login" | "signup";
  supabaseConfig: SupabaseBrowserConfig;
  initialAccent: AccentColorId;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(() => params.get("auth_error"));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const configured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
  const googleEnabled = Boolean(supabaseConfig.googleEnabled);
  const googleProviderReady = Boolean(supabaseConfig.googleProviderReady);
  const googleReady = googleEnabled && googleProviderReady;

  function friendlyAuthError(caught: unknown) {
    const message = caught instanceof Error ? caught.message : "";
    const lower = message.toLowerCase();
    if (
      lower.includes("unsupported provider") ||
      lower.includes("provider is not enabled") ||
      lower.includes("validation_failed")
    ) {
      return "Google aun no esta configurado para este proyecto. Puedes ingresar con correo y contrasena mientras se activa esta opcion.";
    }

    return message || "No se pudo completar la autenticacion.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (!configured) {
        throw new Error("Supabase no esta configurado. Completa las variables locales para autenticar.");
      }

      const supabase = createClient(supabaseConfig);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push(params.get("next") ?? "/finanzas");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.push("/finanzas");
          router.refresh();
          return;
        }
        setMessage("Cuenta creada. Si tu proyecto requiere confirmacion, revisa el correo antes de ingresar.");
      }
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    if (loading || googleLoading) return;

    setError(null);
    setMessage(null);
    setGoogleLoading(true);

    try {
      if (!googleReady) {
        throw new Error("Google aun no esta configurado para este proyecto. Puedes ingresar con correo y contrasena mientras se activa esta opcion.");
      }

      if (!configured) {
        throw new Error("Supabase no esta configurado. Completa las variables locales para autenticar.");
      }

      const supabase = createClient(supabaseConfig);
      const next = params.get("next") ?? "/finanzas";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (oauthError) throw oauthError;
      if (!data.url) {
        throw new Error("No se pudo iniciar Google Auth. Usa correo y contrasena mientras revisamos la configuracion.");
      }
      window.location.assign(data.url);
    } catch (caught) {
      setGoogleLoading(false);
      setError(friendlyAuthError(caught));
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Ingresar a CrediOS" : "Crear cuenta"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Accede a tus simulaciones, deudas, clientes y recordatorios."
            : "Crea tu espacio para simular y administrar informacion financiera."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Correo">
            <Input name="email" type="email" autoComplete="email" required placeholder="tu@email.com" />
          </Field>
          <Field label="Contrasena">
            <Input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </Field>
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {message}
            </p>
          ) : null}
          <Button type="submit" disabled={loading} aria-busy={loading} className="min-w-36">
            {loading ? <AppIcon name="spinner" /> : null}
            {loading ? (mode === "login" ? "Ingresando..." : "Creando cuenta...") : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          Tambien puedes continuar con Google
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || googleLoading || !googleReady}
          aria-busy={googleLoading}
          onClick={handleGoogleAuth}
          className="w-full"
        >
          {googleLoading ? <AppIcon name="spinner" /> : <AppIcon name="google" />}
          {googleLoading ? "Abriendo Google..." : "Continuar con Google"}
        </Button>
        {!googleReady ? (
          <p className="mt-2 rounded-2xl border border-border bg-surface-warm px-3 py-2 text-xs leading-5 text-muted">
            Google estara disponible cuando el provider quede activo en Supabase. Mientras tanto, usa correo y contrasena.
          </p>
        ) : null}
        <div className="mt-5">
          <AuthAccentPicker initialAccent={initialAccent} />
        </div>
        <p className="mt-5 text-sm text-muted">
          {mode === "login" ? "Aun no tienes cuenta?" : "Ya tienes cuenta?"}{" "}
          <Link className="font-medium text-accent" href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Crear cuenta" : "Ingresar"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
