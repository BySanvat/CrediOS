# Smart Payments and Daily Interest

## Pago inteligente

CrediOS ya no requiere que el usuario elija manualmente una cuota al pagar desde el detalle del credito. La app selecciona:

1. primera cuota vencida no pagada;
2. si no hay vencida, primera cuota pendiente;
3. si no hay cuotas pendientes, no muestra accion de pago.

La funcion pura principal es:

```ts
getNextPayableInstallment(installments, today, payments)
```

## Excedente y abono a capital

Si el pago ingresado supera lo requerido por la cuota objetivo, la UI muestra el excedente y exige escoger:

- reducir cuota;
- reducir plazo.

Esto evita estados ambiguos donde un pago mayor queda sin tratamiento financiero.

## RPC transaccional

La migracion aditiva:

```txt
src/lib/db/migrations/0005_smart_installment_payment_rpc.sql
```

crea:

```sql
record_installment_payment_with_optional_extra(...)
```

La RPC:

- valida que el usuario pertenezca al workspace;
- bloquea credito y cuota;
- inserta payment;
- actualiza cuota;
- si hay excedente, inserta extra_payment;
- cancela cuotas futuras que quedan reemplazadas;
- actualiza saldo/resumen del credito;
- inserta audit_event.

Debe aplicarse en Supabase real antes de usar el flujo inteligente en produccion.

## Interes corrido diario

El interes diario se calcula bajo demanda. No hay cron diario ni escrituras repetidas.

Funciones principales:

```ts
calculateDailyRateFromMonthly(monthlyRate)
calculateDailyRateFromAnnualEffective(effectiveAnnualRate)
calculateAccruedInterestForDays({ balanceCents, dailyRate, days })
calculatePayoffQuote({ credit, installments, payments, asOfDate })
```

## Base de calculo

Para el pago total estimado:

- capital base: `current_balance_cents`;
- fecha inicial: ultimo pago registrado o `start_date`;
- fecha final: fecha actual;
- tasa: derivada de `rate_type` y `rate_value`;
- resultado: capital pendiente + interes corrido.

## Limitacion actual

El calculo es incremental y conservador. No reemplaza la amortizacion mensual existente. Sirve para mostrar saldo estimado hoy y soportar pago total con interes corrido.

## Pruebas cubiertas

- interes corrido con cero dias;
- interes corrido 1 y 15 dias;
- tasa cero;
- payoff quote con interes corrido;
- seleccion de siguiente cuota pagable;
- saldo restante de cuota con pago parcial.
