create or replace function public.record_installment_payment_with_optional_extra(
  p_workspace_id uuid,
  p_credit_account_id uuid,
  p_installment_id uuid,
  p_payment_amount_cents bigint,
  p_extra_amount_cents bigint,
  p_payment_date date,
  p_method text default null,
  p_notes text default null,
  p_extra_strategy text default null,
  p_expected_current_balance_cents bigint default null,
  p_previous_summary jsonb default null,
  p_new_summary jsonb default null,
  p_interest_savings_cents bigint default 0
)
returns jsonb
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
  v_remaining_before bigint := 0;
  v_previous_ratio numeric := 0;
  v_new_ratio numeric := 0;
  v_principal_cents bigint := 0;
  v_interest_cents bigint := 0;
  v_fees_cents bigint := 0;
  v_balance_after_payment bigint := 0;
  v_new_balance bigint := 0;
  v_payment_id uuid;
  v_extra_payment_id uuid;
  v_schedule jsonb := coalesce(p_new_summary -> 'schedule', '[]'::jsonb);
begin
  if v_actor_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_payment_amount_cents <= 0 then
    raise exception 'PAYMENT_AMOUNT_MUST_BE_POSITIVE';
  end if;

  if p_extra_amount_cents < 0 then
    raise exception 'EXTRA_PAYMENT_CANNOT_BE_NEGATIVE';
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

  if p_expected_current_balance_cents is not null
    and v_credit.current_balance_cents <> p_expected_current_balance_cents then
    raise exception 'CREDIT_BALANCE_CHANGED_RELOAD_REQUIRED';
  end if;

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

  if v_installment.status not in ('pending', 'partial') then
    raise exception 'INSTALLMENT_NOT_PAYABLE';
  end if;

  select coalesce(sum(amount_cents), 0)
  into v_paid_before
  from public.payments
  where workspace_id = p_workspace_id
    and installment_id = p_installment_id;

  v_remaining_before := greatest(0, v_installment.total_cents - v_paid_before);

  if p_payment_amount_cents > v_remaining_before then
    raise exception 'INSTALLMENT_PAYMENT_EXCEEDS_REMAINING';
  end if;

  v_paid_after := v_paid_before + p_payment_amount_cents;
  v_previous_ratio := least(1, v_paid_before::numeric / greatest(1, v_installment.total_cents)::numeric);
  v_new_ratio := least(1, v_paid_after::numeric / greatest(1, v_installment.total_cents)::numeric);

  v_principal_cents := greatest(0, round(v_installment.principal_cents * (v_new_ratio - v_previous_ratio))::bigint);
  v_interest_cents := greatest(0, round(v_installment.interest_cents * (v_new_ratio - v_previous_ratio))::bigint);
  v_fees_cents := greatest(0, round(v_installment.fees_cents * (v_new_ratio - v_previous_ratio))::bigint);
  v_balance_after_payment := greatest(0, v_credit.current_balance_cents - v_principal_cents);

  if p_extra_amount_cents > 0 and v_paid_after < v_installment.total_cents then
    raise exception 'EXTRA_PAYMENT_REQUIRES_INSTALLMENT_PAID';
  end if;

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
    p_payment_amount_cents,
    v_principal_cents,
    v_interest_cents,
    v_fees_cents,
    p_payment_date,
    nullif(p_method, ''),
    nullif(p_notes, ''),
    v_actor_id
  )
  returning id into v_payment_id;

  update public.installments
  set status = case when v_paid_after >= v_installment.total_cents then 'paid' else 'partial' end,
      paid_at = case when v_paid_after >= v_installment.total_cents then p_payment_date::timestamptz else null end
  where id = p_installment_id
    and workspace_id = p_workspace_id;

  v_new_balance := v_balance_after_payment;

  if p_extra_amount_cents > 0 then
    if p_extra_strategy not in ('applied_reduce_term', 'applied_reduce_payment') then
      raise exception 'INVALID_EXTRA_PAYMENT_STRATEGY';
    end if;

    if p_new_summary is null then
      raise exception 'NEW_SUMMARY_REQUIRED_FOR_EXTRA_PAYMENT';
    end if;

    if p_extra_amount_cents > v_balance_after_payment then
      raise exception 'EXTRA_PAYMENT_EXCEEDS_BALANCE';
    end if;

    v_new_balance := greatest(0, v_balance_after_payment - p_extra_amount_cents);

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
      p_extra_amount_cents,
      p_payment_date,
      p_extra_strategy,
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
  end if;

  update public.credit_accounts
  set current_balance_cents = v_new_balance,
      summary = coalesce(p_new_summary, summary),
      term_months = case
        when p_new_summary is not null then greatest(1, coalesce((p_new_summary ->> 'termMonths')::integer, term_months))
        else term_months
      end,
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
    'smart_payment_recorded',
    jsonb_build_object(
      'paymentId', v_payment_id,
      'extraPaymentId', v_extra_payment_id,
      'paymentAmountCents', p_payment_amount_cents,
      'extraAmountCents', p_extra_amount_cents,
      'installmentId', p_installment_id,
      'principalCents', v_principal_cents
    )
  );

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'extraPaymentId', v_extra_payment_id,
    'newBalanceCents', v_new_balance
  );
end;
$$;

grant execute on function public.record_installment_payment_with_optional_extra(
  uuid,
  uuid,
  uuid,
  bigint,
  bigint,
  date,
  text,
  text,
  text,
  bigint,
  jsonb,
  jsonb,
  bigint
) to authenticated;
