export type PayableInstallment = {
  id: string;
  due_date: string;
  status: string;
  total_cents: number;
};

export type PaymentForInstallment = {
  installment_id: string | null;
  amount_cents: number;
};

export function getInstallmentPaidCents(
  installmentId: string,
  payments: PaymentForInstallment[],
) {
  return payments
    .filter((payment) => payment.installment_id === installmentId)
    .reduce((sum, payment) => sum + payment.amount_cents, 0);
}

export function getInstallmentRemainingCents(
  installment: PayableInstallment,
  payments: PaymentForInstallment[],
) {
  return Math.max(0, installment.total_cents - getInstallmentPaidCents(installment.id, payments));
}

export function getNextPayableInstallment<T extends PayableInstallment>(
  installments: T[],
  today: string,
  payments: PaymentForInstallment[] = [],
) {
  const payable = installments
    .filter((item) => ["pending", "partial"].includes(item.status))
    .filter((item) => getInstallmentRemainingCents(item, payments) > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const late = payable.find((item) => item.due_date < today);

  return late ?? payable[0] ?? null;
}
