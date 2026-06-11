"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { createClient, type SupabaseBrowserConfig } from "@/lib/supabase/client";

export function AuthForm({
  mode,
  supabaseConfig,
}: {
  mode: "login" | "signup";
  supabaseConfig: SupabaseBrowserConfig;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);

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
        router.push(params.get("next") ?? "/dashboard");
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
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setMessage("Cuenta creada. Si tu proyecto requiere confirmacion, revisa el correo antes de ingresar.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la autenticacion.");
    } finally {
      setLoading(false);
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
