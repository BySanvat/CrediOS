-- Allow a workspace owner to read the workspace during first-user bootstrap.
-- Without this, a new user can insert a workspace but cannot return/select it
-- until membership exists, and membership creation also depends on seeing it.

drop policy if exists "workspaces_select_members" on public.workspaces;

create policy "workspaces_select_members_or_owner" on public.workspaces
for select
using (
  owner_id = auth.uid()
  or public.is_workspace_member(id)
);
