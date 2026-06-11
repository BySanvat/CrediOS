create table if not exists public.personal_debts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null,
  initial_balance_cents bigint not null,
  current_balance_cents bigint not null,
  currency text not null default 'COP',
  opened_at date not null,
  notes text,
  status text not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.personal_debt_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  personal_debt_id uuid not null references public.personal_debts(id),
  direction text not null,
  amount_cents bigint not null,
  movement_date date not null,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists personal_debts_workspace_idx on public.personal_debts(workspace_id);
create index if not exists personal_debts_status_idx on public.personal_debts(workspace_id, status);
create index if not exists personal_debts_opened_idx on public.personal_debts(workspace_id, opened_at);
create index if not exists personal_debt_movements_workspace_idx on public.personal_debt_movements(workspace_id, movement_date desc);
create index if not exists personal_debt_movements_debt_idx on public.personal_debt_movements(personal_debt_id);

drop trigger if exists set_personal_debts_updated_at on public.personal_debts;
create trigger set_personal_debts_updated_at before update on public.personal_debts for each row execute function public.set_updated_at();

alter table public.personal_debts enable row level security;
alter table public.personal_debt_movements enable row level security;

drop policy if exists "personal_debts_select_workspace" on public.personal_debts;
drop policy if exists "personal_debts_insert_workspace" on public.personal_debts;
drop policy if exists "personal_debts_update_workspace" on public.personal_debts;
create policy "personal_debts_select_workspace" on public.personal_debts for select using (public.is_workspace_member(workspace_id));
create policy "personal_debts_insert_workspace" on public.personal_debts for insert with check (public.is_workspace_member(workspace_id));
create policy "personal_debts_update_workspace" on public.personal_debts for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "personal_debt_movements_select_workspace" on public.personal_debt_movements;
drop policy if exists "personal_debt_movements_insert_workspace" on public.personal_debt_movements;
create policy "personal_debt_movements_select_workspace" on public.personal_debt_movements for select using (public.is_workspace_member(workspace_id));
create policy "personal_debt_movements_insert_workspace" on public.personal_debt_movements for insert with check (public.is_workspace_member(workspace_id));

create or replace function public.increase_credit_balance_with_schedule(
  p_workspace_id uuid,
  p_credit_account_id uuid,
  p_amount_cents bigint,
  p_movement_date date,
  p_expected_current_balance_cents bigint,
  p_new_summary jsonb,
  p_new_term_months integer,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credit record;
  v_new_balance bigint;
  v_schedule jsonb := coalesce(p_new_summary -> 'schedule', '[]'::jsonb);
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'AMOUNT_MUST_BE_POSITIVE';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'WORKSPACE_ACCESS_DENIED';
  end if;

  select *
  into v_credit
  from public.credit_accounts
  where id = p_credit_account_id
    and workspace_id = p_workspace_id
    and archived_at is null
  for update;

  if not found then
    raise exception 'CREDIT_ACCOUNT_NOT_FOUND';
  end if;

  if v_credit.current_balance_cents <> p_expected_current_balance_cents then
    raise exception 'CREDIT_BALANCE_CHANGED_RELOAD_REQUIRED';
  end if;

  if p_new_summary is null or jsonb_typeof(v_schedule) <> 'array' then
    raise exception 'NEW_SCHEDULE_REQUIRED';
  end if;

  v_new_balance := v_credit.current_balance_cents + p_amount_cents;

  update public.installments
  set status = 'cancelled'
  where workspace_id = p_workspace_id
    and credit_account_id = p_credit_account_id
    and status in ('pending', 'partial');

  insert into public.installments (
    workspace_id,
    credit_account_id,
    installment_number,
    due_date,
    principal_cents,
    interest_cents,
    fees_cents,
    total_cents,
    remaining_balance_cents,
    status
  )
  select
    p_workspace_id,
    p_credit_account_id,
    coalesce((item.value ->> 'installmentNumber')::integer, item.ordinality::integer),
    (item.value ->> 'dueDate')::date,
    (item.value ->> 'principalCents')::bigint,
    (item.value ->> 'interestCents')::bigint,
    (item.value ->> 'feesCents')::bigint,
    (item.value ->> 'totalCents')::bigint,
    (item.value ->> 'remainingBalanceCents')::bigint,
    'pending'
  from jsonb_array_elements(v_schedule) with ordinality as item(value, ordinality);

  update public.credit_accounts
  set principal_cents = principal_cents + p_amount_cents,
      current_balance_cents = v_new_balance,
      summary = p_new_summary,
      term_months = greatest(1, p_new_term_months),
      status = 'active',
      notes = concat_ws(E'\n', notes, nullif(p_notes, ''))
  where id = p_credit_account_id
    and workspace_id = p_workspace_id;

  insert into public.audit_events (
    workspace_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    p_workspace_id,
    v_actor_id,
    'credit_account',
    p_credit_account_id,
    'credit_balance_increased',
    jsonb_build_object(
      'amountCents', p_amount_cents,
      'movementDate', p_movement_date,
      'newBalanceCents', v_new_balance,
      'notes', nullif(p_notes, '')
    )
  );

  return jsonb_build_object('newBalanceCents', v_new_balance);
end;
$$;

grant execute on function public.increase_credit_balance_with_schedule(
  uuid,
  uuid,
  bigint,
  date,
  bigint,
  jsonb,
  integer,
  text
) to authenticated;
