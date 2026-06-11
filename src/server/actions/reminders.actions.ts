"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAppContext } from "@/server/context";

const reminderSchema = z.object({
  title: z.string().min(2),
  dueDate: z.string().min(8),
  creditId: z.string().uuid().optional().or(z.literal("")),
  clientId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createReminderAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = reminderSchema.parse(Object.fromEntries(formData));
  const { error } = await ctx.supabase.from("reminders").insert({
    workspace_id: ctx.workspace.id,
    credit_account_id: parsed.creditId || null,
    client_id: parsed.clientId || null,
    title: parsed.title,
    due_date: parsed.dueDate,
    status: "pending",
    notes: parsed.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/recordatorios");
  revalidatePath("/dashboard");
}

export async function completeReminderAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("reminders")
    .update({ status: "completed" })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/recordatorios");
  revalidatePath("/dashboard");
}
