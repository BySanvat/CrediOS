"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAppContext } from "@/server/context";

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(2),
  documentId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = clientSchema.parse(Object.fromEntries(formData));
  const { error } = await ctx.supabase.from("clients").insert({
    workspace_id: ctx.workspace.id,
    full_name: parsed.fullName,
    document_id: parsed.documentId || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    address: parsed.address || null,
    notes: parsed.notes || null,
    status: "active",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function updateClientAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = clientSchema.extend({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const { error } = await ctx.supabase
    .from("clients")
    .update({
      full_name: parsed.fullName,
      document_id: parsed.documentId || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      notes: parsed.notes || null,
    })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function archiveClientAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("clients")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}
