import "server-only";

import { DEFAULT_PERSONAL_CATEGORIES } from "@/domain/personal-finance";
import type { AppContext } from "./context";

export async function ensurePersonalCategories(ctx: Extract<AppContext, { configured: true }>) {
  const { count, error } = await ctx.supabase
    .from("personal_categories")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null);

  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const { error: insertError } = await ctx.supabase.from("personal_categories").insert(
    DEFAULT_PERSONAL_CATEGORIES.map((category) => ({
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
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
