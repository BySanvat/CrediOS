-- Beta hardening for CrediOS.
-- Safe to apply after 0001. It does not drop tables or delete data.

create or replace function public.is_workspace_admin(target_workspace_id uuid)
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
      and wm.role in ('owner', 'admin')
  );
$$;

-- Replace broad financial policies with explicit non-delete policies.
drop policy if exists "workspace_members_insert_self_owner" on public.workspace_members;
drop policy if exists "workspace_members_update_owner" on public.workspace_members;

create policy "workspace_members_insert_authorized" on public.workspace_members
for insert
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
    or public.is_workspace_admin(workspace_id)
  )
);

create policy "workspace_members_update_owner_or_admin" on public.workspace_members
for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "clients_workspace_access" on public.clients;
drop policy if exists "simulations_workspace_access" on public.simulations;
drop policy if exists "credit_accounts_workspace_access" on public.credit_accounts;
drop policy if exists "installments_workspace_access" on public.installments;
drop policy if exists "payments_workspace_access" on public.payments;
drop policy if exists "extra_payments_workspace_access" on public.extra_payments;
drop policy if exists "reminders_workspace_access" on public.reminders;
drop policy if exists "credit_cards_workspace_access" on public.credit_cards;
drop policy if exists "audit_events_workspace_access" on public.audit_events;

create policy "clients_select_workspace" on public.clients for select using (public.is_workspace_member(workspace_id));
create policy "clients_insert_workspace" on public.clients for insert with check (public.is_workspace_member(workspace_id));
create policy "clients_update_workspace" on public.clients for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "simulations_select_workspace" on public.simulations for select using (public.is_workspace_member(workspace_id));
create policy "simulations_insert_workspace" on public.simulations for insert with check (public.is_workspace_member(workspace_id));
create policy "simulations_update_workspace" on public.simulations for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "credit_accounts_select_workspace" on public.credit_accounts for select using (public.is_workspace_member(workspace_id));
create policy "credit_accounts_insert_workspace" on public.credit_accounts for insert with check (public.is_workspace_member(workspace_id));
create policy "credit_accounts_update_workspace" on public.credit_accounts for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "installments_select_workspace" on public.installments for select using (public.is_workspace_member(workspace_id));
create policy "installments_insert_workspace" on public.installments for insert with check (public.is_workspace_member(workspace_id));
create policy "installments_update_workspace" on public.installments for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "payments_select_workspace" on public.payments for select using (public.is_workspace_member(workspace_id));
create policy "payments_insert_workspace" on public.payments for insert with check (public.is_workspace_member(workspace_id));

create policy "extra_payments_select_workspace" on public.extra_payments for select using (public.is_workspace_member(workspace_id));
create policy "extra_payments_insert_workspace" on public.extra_payments for insert with check (public.is_workspace_member(workspace_id));

create policy "reminders_select_workspace" on public.reminders for select using (public.is_workspace_member(workspace_id));
create policy "reminders_insert_workspace" on public.reminders for insert with check (public.is_workspace_member(workspace_id));
create policy "reminders_update_workspace" on public.reminders for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "credit_cards_select_workspace" on public.credit_cards for select using (public.is_workspace_member(workspace_id));
create policy "credit_cards_insert_workspace" on public.credit_cards for insert with check (public.is_workspace_member(workspace_id));
create policy "credit_cards_update_workspace" on public.credit_cards for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "audit_events_select_workspace" on public.audit_events for select using (public.is_workspace_member(workspace_id));
create policy "audit_events_insert_workspace" on public.audit_events for insert with check (public.is_workspace_member(workspace_id));

create or replace function public.record_credit_payment(
  p_workspace_id uuid,
  p_credit_account_id uuid,
  p_installment_id uuid,
  p_amount_cents bigint,
  p_payment_date date,
  p_method text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credit record;
  v_installment record;
  v_paid_before bigint := 0;
  v_paid_after bigint := 0;
  v_previous_ratio numeric := 0;
  v_new_ratio numeric := 0;
  v_principal_cents bigint := 0;
  v_interest_cents bigint := 0;
  v_fees_cents bigint := 0;
  v_new_balance bigint := 0;
  v_payment_id uuid;
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'PAYMENT_AMOUNT_MUST_BE_POSITIVE';
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

  v_principal_cents := least(p_amount_cents, v_credit.current_balance_cents);

  if p_installment_id is not null then
    select *
    into v_installment
    from public.installments
    where id = p_installment_id
      and workspace_id = p_workspace_id
      and credit_account_id = p_credit_account_id
    for update;

    if not found then
      raise exception 'INSTALLMENT_NOT_FOUND';
    end if;

    select coalesce(sum(amount_cents), 0)
    into v_paid_before
    from public.payments
    where workspace_id = p_workspace_id
      and installment_id = p_installment_id;

    v_paid_after := v_paid_before + p_amount_cents;
    v_previous_ratio := least(1, v_paid_before::numeric / greatest(1, v_installment.total_cents)::numeric);
    v_new_ratio := least(1, v_paid_after::numeric / greatest(1, v_installment.total_cents)::numeric);

    v_principal_cents := greatest(0, round(v_installment.principal_cents * (v_new_ratio - v_previous_ratio))::bigint);
    v_interest_cents := greatest(0, round(v_installment.interest_cents * (v_new_ratio - v_previous_ratio))::bigint);
    v_fees_cents := greatest(0, round(v_installment.fees_cents * (v_new_ratio - v_previous_ratio))::bigint);

    update public.installments
    set status = case when v_paid_after >= v_installment.total_cents then 'paid' else 'partial' end,
        paid_at = case when v_paid_after >= v_installment.total_cents then p_payment_date::timestamptz else null end
    where id = p_installment_id
      and workspace_id = p_workspace_id;
  end if;

  v_new_balance := greatest(0, v_credit.current_balance_cents - greatest(0, v_principal_cents));

  insert into public.payments (
    workspace_id,
    credit_account_id,
    installment_id,
    amount_cents,
    principal_cents,
    interest_cents,
    fees_cents,
    payment_date,
    method,
    notes,
    created_by
  )
  values (
    p_workspace_id,
    p_credit_account_id,
    p_installment_id,
    p_amount_cents,
    v_principal_cents,
    v_interest_cents,
    v_fees_cents,
    p_payment_date,
    nullif(p_method, ''),
    nullif(p_notes, ''),
    v_actor_id
  )
  returning id into v_payment_id;

  update public.credit_accounts
  set current_balance_cents = v_new_balance,
      status = case when v_new_balance = 0 then 'paid' else status end
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
    'payment_recorded',
    jsonb_build_object(
      'paymentId', v_payment_id,
      'amountCents', p_amount_cents,
      'installmentId', p_installment_id,
      'principalCents', v_principal_cents
    )
  );

  return v_payment_id;
end;
$$;

create or replace function public.apply_extra_payment(
  p_workspace_id uuid,
  p_credit_account_id uuid,
  p_expected_current_balance_cents bigint,
  p_amount_cents bigint,
  p_payment_date date,
  p_strategy text,
  p_previous_summary jsonb,
  p_new_summary jsonb,
  p_interest_savings_cents bigint,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credit record;
  v_new_balance bigint := 0;
  v_extra_payment_id uuid;
  v_schedule jsonb := coalesce(p_new_summary -> 'schedule', '[]'::jsonb);
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'EXTRA_PAYMENT_AMOUNT_MUST_BE_POSITIVE';
  end if;

  if p_strategy not in ('applied_reduce_term', 'applied_reduce_payment') then
    raise exception 'INVALID_EXTRA_PAYMENT_STRATEGY';
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

  if p_amount_cents > v_credit.current_balance_cents then
    raise exception 'EXTRA_PAYMENT_EXCEEDS_BALANCE';
  end if;

  v_new_balance := greatest(0, v_credit.current_balance_cents - p_amount_cents);

  insert into public.extra_payments (
    workspace_id,
    credit_account_id,
    amount_cents,
    payment_date,
    strategy,
    previous_summary,
    new_summary,
    interest_savings_cents,
    notes,
    created_by
  )
  values (
    p_workspace_id,
    p_credit_account_id,
    p_amount_cents,
    p_payment_date,
    p_strategy,
    p_previous_summary,
    p_new_summary,
    greatest(0, p_interest_savings_cents),
    nullif(p_notes, ''),
    v_actor_id
  )
  returning id into v_extra_payment_id;

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
  set current_balance_cents = v_new_balance,
      summary = p_new_summary,
      term_months = greatest(1, coalesce((p_new_summary ->> 'termMonths')::integer, term_months)),
      status = case when v_new_balance = 0 then 'paid' else status end
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
    'extra_payment_applied',
    jsonb_build_object(
      'extraPaymentId', v_extra_payment_id,
      'amountCents', p_amount_cents,
      'strategy', p_strategy,
      'interestSavingsCents', greatest(0, p_interest_savings_cents)
    )
  );

  return v_extra_payment_id;
end;
$$;

grant execute on function public.record_credit_payment(uuid, uuid, uuid, bigint, date, text, text) to authenticated;
grant execute on function public.apply_extra_payment(uuid, uuid, bigint, bigint, date, text, jsonb, jsonb, bigint, text) to authenticated;
