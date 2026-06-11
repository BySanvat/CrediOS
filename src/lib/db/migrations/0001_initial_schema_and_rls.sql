create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  default_currency text not null default 'COP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  document_id text,
  phone text,
  email text,
  address text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_type text not null default 'fixed_installment_credit',
  principal_cents bigint not null check (principal_cents > 0),
  rate_value text not null,
  rate_type text not null,
  term_months integer not null check (term_months > 0),
  start_date date not null,
  monthly_fee_cents bigint not null default 0,
  monthly_insurance_cents bigint not null default 0,
  upfront_fee_cents bigint not null default 0,
  notes text,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_simulation_id uuid references public.simulations(id) on delete set null,
  name text not null,
  type text not null default 'fixed_installment_credit',
  status text not null default 'active' check (status in ('draft','active','late','paid','cancelled','archived')),
  principal_cents bigint not null check (principal_cents >= 0),
  current_balance_cents bigint not null check (current_balance_cents >= 0),
  rate_value text not null,
  rate_type text not null,
  term_months integer not null check (term_months > 0),
  start_date date not null,
  monthly_fee_cents bigint not null default 0,
  monthly_insurance_cents bigint not null default 0,
  summary jsonb not null,
  notes text,
  is_personal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_account_id uuid not null references public.credit_accounts(id) on delete cascade,
  installment_number integer not null,
  due_date date not null,
  principal_cents bigint not null default 0,
  interest_cents bigint not null default 0,
  fees_cents bigint not null default 0,
  total_cents bigint not null default 0,
  remaining_balance_cents bigint not null default 0,
  status text not null default 'pending' check (status in ('pending','partial','paid','late','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_account_id uuid not null references public.credit_accounts(id) on delete cascade,
  installment_id uuid references public.installments(id) on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  principal_cents bigint not null default 0,
  interest_cents bigint not null default 0,
  fees_cents bigint not null default 0,
  payment_date date not null,
  method text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.extra_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_account_id uuid not null references public.credit_accounts(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  payment_date date not null,
  strategy text not null check (strategy in ('reduce_term','reduce_payment','simulation_only','applied_reduce_term','applied_reduce_payment')),
  previous_summary jsonb,
  new_summary jsonb,
  interest_savings_cents bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_account_id uuid references public.credit_accounts(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  limit_cents bigint not null default 0,
  used_balance_cents bigint not null default 0,
  monthly_rate text not null default '0',
  cut_day integer not null default 1,
  payment_due_day integer not null default 15,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_id);
create index if not exists workspace_members_workspace_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists clients_workspace_idx on public.clients(workspace_id);
create index if not exists clients_status_idx on public.clients(workspace_id, status);
create index if not exists simulations_workspace_idx on public.simulations(workspace_id);
create index if not exists simulations_created_idx on public.simulations(workspace_id, created_at desc);
create index if not exists credit_accounts_workspace_idx on public.credit_accounts(workspace_id);
create index if not exists credit_accounts_client_idx on public.credit_accounts(client_id);
create index if not exists credit_accounts_status_idx on public.credit_accounts(workspace_id, status);
create index if not exists installments_workspace_due_idx on public.installments(workspace_id, due_date);
create index if not exists installments_credit_idx on public.installments(credit_account_id);
create index if not exists installments_status_idx on public.installments(workspace_id, status);
create index if not exists payments_workspace_date_idx on public.payments(workspace_id, payment_date desc);
create index if not exists payments_credit_idx on public.payments(credit_account_id);
create index if not exists extra_payments_credit_idx on public.extra_payments(credit_account_id);
create index if not exists reminders_workspace_due_idx on public.reminders(workspace_id, due_date);
create index if not exists reminders_status_idx on public.reminders(workspace_id, status);
create index if not exists audit_events_workspace_idx on public.audit_events(workspace_id, created_at desc);
create index if not exists audit_events_entity_idx on public.audit_events(workspace_id, entity_type, entity_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists set_simulations_updated_at on public.simulations;
create trigger set_simulations_updated_at before update on public.simulations for each row execute function public.set_updated_at();
drop trigger if exists set_credit_accounts_updated_at on public.credit_accounts;
create trigger set_credit_accounts_updated_at before update on public.credit_accounts for each row execute function public.set_updated_at();
drop trigger if exists set_installments_updated_at on public.installments;
create trigger set_installments_updated_at before update on public.installments for each row execute function public.set_updated_at();
drop trigger if exists set_reminders_updated_at on public.reminders;
create trigger set_reminders_updated_at before update on public.reminders for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.simulations enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.extra_payments enable row level security;
alter table public.reminders enable row level security;
alter table public.credit_cards enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles_select_self" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces_select_members" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspaces_insert_owner" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "workspaces_update_owner" on public.workspaces for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "workspace_members_select_members" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "workspace_members_insert_self_owner" on public.workspace_members for insert with check (user_id = auth.uid() and role = 'owner');
create policy "workspace_members_update_owner" on public.workspace_members for update using (
  exists (
    select 1 from public.workspace_members owner_member
    where owner_member.workspace_id = workspace_members.workspace_id
      and owner_member.user_id = auth.uid()
      and owner_member.role in ('owner','admin')
  )
);

create policy "clients_workspace_access" on public.clients for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "simulations_workspace_access" on public.simulations for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "credit_accounts_workspace_access" on public.credit_accounts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "installments_workspace_access" on public.installments for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "payments_workspace_access" on public.payments for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "extra_payments_workspace_access" on public.extra_payments for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "reminders_workspace_access" on public.reminders for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "credit_cards_workspace_access" on public.credit_cards for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "audit_events_workspace_access" on public.audit_events for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
