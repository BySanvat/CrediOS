import "server-only";

import { DEFAULT_PERSONAL_CATEGORIES } from "@/domain/personal-finance";
import type { AppContext } from "./context";

export async function ensurePersonalCategories(ctx: Extract<AppContext, { configured: true }>) {
  const { data: existing, error } = await ctx.supabase
    .from("personal_categories")
    .select("name")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null);

  if (error) throw new Error(error.message);
  const existingNames = new Set((existing ?? []).map((category) => category.name.trim().toLowerCase()));
  const missing = DEFAULT_PERSONAL_CATEGORIES.filter(
    (category) => !existingNames.has(category.name.trim().toLowerCase()),
  );
  if (!missing.length) return;

  const { error: insertError } = await ctx.supabase.from("personal_categories").insert(
    missing.map((category) => ({
      workspace_id: ctx.workspace.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color_token: category.colorToken,
      is_default: true,
    })),
  );

  if (insertError) throw new Error(insertError.message);
}

export async function getPersonalCategories(ctx: Extract<AppContext, { configured: true }>) {
  await ensurePersonalCategories(ctx);
  const { data, error } = await ctx.supabase
    .from("personal_categories")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .not("name", "ilike", "qa categoria%")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).filter((category) => !isQaCategory(category.name));
}

function isQaCategory(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .startsWith("qa categoria");
}
