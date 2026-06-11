import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

export type AppWorkspace = {
  id: string;
  name: string;
  default_currency: string;
  owner_id: string;
};

export type AppContext =
  | {
      configured: false;
      supabase: null;
      user: null;
      workspace: null;
    }
  | {
      configured: true;
      supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
      user: User;
      workspace: AppWorkspace;
    };

async function ensureProfileAndWorkspace(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  user: User,
) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" },
  );

  const { data: existingMembership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.workspace_id) {
    return existingMembership.workspace_id as string;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: "Mi espacio CrediOS",
      owner_id: user.id,
      default_currency: "COP",
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "No se pudo crear el workspace personal.");
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  return workspace.id as string;
}

export async function getAppContext(): Promise<AppContext> {
  const supabase = await createClient();

  if (!supabase) {
    return { configured: false, supabase: null, user: null, workspace: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await ensureProfileAndWorkspace(supabase, user);
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id,name,default_currency,owner_id")
    .eq("id", workspaceId)
    .single();

  if (error || !workspace) {
    throw new Error(error?.message ?? "No se pudo cargar el workspace.");
  }

  return {
    configured: true,
    supabase,
    user,
    workspace: workspace as AppWorkspace,
  };
}
