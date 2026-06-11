"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export type SupabaseBrowserConfig = {
  url?: string;
  publishableKey?: string;
  googleEnabled?: boolean;
  googleProviderReady?: boolean;
};

export function createClient(config?: SupabaseBrowserConfig) {
  const url = config?.url ?? getSupabaseUrl();
  const key = config?.publishableKey ?? getSupabasePublishableKey();

  if (!url || !key) {
    throw new Error("Supabase no esta configurado. Completa .env.local para usar autenticacion.");
  }

  return createBrowserClient(url, key);
}
