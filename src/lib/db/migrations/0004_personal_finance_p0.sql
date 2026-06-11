-- Personal finance P0 for CrediOS.
-- Additive only: creates tables, indexes, triggers and RLS policies.

create table if not exists public.personal_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'circle',
  color_token text not null default 'sand',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.personal_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  category_id uuid references public.personal_categories(id),
  type text not null check (type in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'COP',
  note_raw text not null,
  note_normalized text not null,
  occurred_at date not null,
  source text not null default 'manual' check (source in ('manual', 'voice', 'import_stub')),
  linked_credit_account_id uuid references public.credit_accounts(id),
  duplicate_hash text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.personal_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  category_id uuid not null references public.personal_categories(id),
  period_type text not null default 'monthly' check (period_type in ('monthly', 'quarterly')),
  amount_cents bigint not null check (amount_cents > 0),
  rollover boolean not null default false,
  active_from date not null,
  active_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  category_id uuid references public.personal_categories(id),
  type text not null check (type in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'COP',
  note_template text not null,
  frequency text not null default 'monthly' check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count integer not null default 1 check (interval_count > 0),
  starts_at date not null,
  ends_at date,
  next_run_at date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_categories_workspace_idx on public.personal_categories(workspace_id);
create index if not exists personal_categories_type_idx on public.personal_categories(workspace_id, type);
create unique index if not exists personal_categories_workspace_name_type_active_idx
  on public.personal_categories(workspace_id, lower(name), type)
  where archived_at is null;

create index if not exists personal_transactions_workspace_date_idx on public.personal_transactions(workspace_id, occurred_at desc);
create index if not exists personal_transactions_category_idx on public.personal_transactions(workspace_id, category_id);
create index if not exists personal_transactions_type_idx on public.personal_transactions(workspace_id, type);
create index if not exists personal_transactions_duplicate_idx on public.personal_transactions(workspace_id, duplicate_hash);

create index if not exists personal_budgets_workspace_idx on public.personal_budgets(workspace_id);
create index if not exists personal_budgets_category_idx on public.personal_budgets(workspace_id, category_id);
create index if not exists personal_budgets_period_idx on public.personal_budgets(workspace_id, period_type, active_from);

create index if not exists recurring_rules_workspace_idx on public.recurring_rules(workspace_id);
create index if not exists recurring_rules_next_run_idx on public.recurring_rules(workspace_id, next_run_at, active);
create index if not exists recurring_rules_category_idx on public.recurring_rules(workspace_id, category_id);

drop trigger if exists set_personal_categories_updated_at on public.personal_categories;
create trigger set_personal_categories_updated_at before update on public.personal_categories for each row execute function public.set_updated_at();

drop trigger if exists set_personal_transactions_updated_at on public.personal_transactions;
create trigger set_personal_transactions_updated_at before update on public.personal_transactions for each row execute function public.set_updated_at();

drop trigger if exists set_personal_budgets_updated_at on public.personal_budgets;
create trigger set_personal_budgets_updated_at before update on public.personal_budgets for each row execute function public.set_updated_at();

drop trigger if exists set_recurring_rules_updated_at on public.recurring_rules;
create trigger set_recurring_rules_updated_at before update on public.recurring_rules for each row execute function public.set_updated_at();

alter table public.personal_categories enable row level security;
alter table public.personal_transactions enable row level security;
alter table public.personal_budgets enable row level security;
alter table public.recurring_rules enable row level security;

drop policy if exists "personal_categories_select_workspace" on public.personal_categories;
drop policy if exists "personal_categories_insert_workspace" on public.personal_categories;
drop policy if exists "personal_categories_update_workspace" on public.personal_categories;
create policy "personal_categories_select_workspace" on public.personal_categories for select using (public.is_workspace_member(workspace_id));
create policy "personal_categories_insert_workspace" on public.personal_categories for insert with check (public.is_workspace_member(workspace_id));
create policy "personal_categories_update_workspace" on public.personal_categories for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "personal_transactions_select_workspace" on public.personal_transactions;
drop policy if exists "personal_transactions_insert_workspace" on public.personal_transactions;
drop policy if exists "personal_transactions_update_workspace" on public.personal_transactions;
create policy "personal_transactions_select_workspace" on public.personal_transactions for select using (public.is_workspace_member(workspace_id));
create policy "personal_transactions_insert_workspace" on public.personal_transactions for insert with check (public.is_workspace_member(workspace_id));
create policy "personal_transactions_update_workspace" on public.personal_transactions for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "personal_budgets_select_workspace" on public.personal_budgets;
drop policy if exists "personal_budgets_insert_workspace" on public.personal_budgets;
drop policy if exists "personal_budgets_update_workspace" on public.personal_budgets;
create policy "personal_budgets_select_workspace" on public.personal_budgets for select using (public.is_workspace_member(workspace_id));
create policy "personal_budgets_insert_workspace" on public.personal_budgets for insert with check (public.is_workspace_member(workspace_id));
create policy "personal_budgets_update_workspace" on public.personal_budgets for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "recurring_rules_select_workspace" on public.recurring_rules;
drop policy if exists "recurring_rules_insert_workspace" on public.recurring_rules;
drop policy if exists "recurring_rules_update_workspace" on public.recurring_rules;
create policy "recurring_rules_select_workspace" on public.recurring_rules for select using (public.is_workspace_member(workspace_id));
create policy "recurring_rules_insert_workspace" on public.recurring_rules for insert with check (public.is_workspace_member(workspace_id));
create policy "recurring_rules_update_workspace" on public.recurring_rules for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
