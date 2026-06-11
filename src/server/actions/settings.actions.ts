"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAppContext } from "@/server/context";

const settingsSchema = z.object({
  fullName: z.string().optional(),
  workspaceName: z.string().min(2),
  defaultCurrency: z.string().default("COP"),
});

export async function updateSettingsAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = settingsSchema.parse(Object.fromEntries(formData));

  const profileUpdate = ctx.supabase
    .from("profiles")
    .update({ full_name: parsed.fullName || null })
    .eq("id", ctx.user.id);
  const workspaceUpdate = ctx.supabase
    .from("workspaces")
    .update({ name: parsed.workspaceName, default_currency: parsed.defaultCurrency })
    .eq("id", ctx.workspace.id)
    .eq("owner_id", ctx.user.id);

  const [{ error: profileError }, { error: workspaceError }] = await Promise.all([
    profileUpdate,
    workspaceUpdate,
  ]);

  if (profileError || workspaceError) {
    throw new Error(profileError?.message ?? workspaceError?.message ?? "No se pudo actualizar configuracion.");
  }

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
}
