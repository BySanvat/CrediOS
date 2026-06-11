# CrediOS by Sanvat - Financial Engine Spec v1

Estado: Fase 0  
Objetivo: especificar un motor financiero puro, determinista y testeable para creditos, abonos y tarjetas.

## 1. Principios del motor

- Debe vivir fuera de React, fuera de Next.js y fuera de la base de datos.
- Debe ser un modulo TypeScript puro.
- Debe recibir inputs validados y devolver resultados deterministas.
- No debe leer sesiones, workspaces, DOM ni variables de entorno.
- Debe soportar simulacion sin persistencia y aplicacion real desde servicios de aplicacion.
- Debe guardar suficiente metadata para reproducir una simulacion guardada.

Ubicacion futura recomendada:

```txt
src/domain/financial-engine/
  index.ts
  money.ts
  rates.ts
  amortization.ts
  extra-payments.ts
  credit-cards.ts
  rounding.ts
  types.ts
  __tests__/
```

## 2. Libreria y precision monetaria

Recomendacion:

- Persistencia: enteros en unidad menor (`amount_minor`) + `currency`.
- Calculo: `decimal.js`.
- IO del motor: aceptar `MoneyInput` como string decimal o minor units; normalizar internamente.
- Salida: minor units para montos persistibles y strings formateables para UI.

Por que decimal.js:

- Soporta decimales arbitrarios.
- Maneja potencias necesarias para conversion de tasas.
- Evita errores de `number` binario en JavaScript.

Reglas:

- No usar `number` para dinero.
- No usar floats para tasas en la capa de dominio; aceptar strings o Decimal.
- Redondear montos monetarios a centavos en puntos definidos.
- Evitar redondear en cada operacion intermedia si no corresponde.

Politica inicial de redondeo:

- Moneda inicial: COP por defecto, pero el motor debe aceptar `currency`.
- Unidad menor: 2 decimales por defecto; configurar por moneda futura.
- Redondeo: half-up para cuotas mostradas, salvo que una moneda/regla especifique otro modo.
- Interes por periodo: redondear a unidad menor.
- Principal por periodo: `payment - interest - fees`.
- Ultima cuota: ajustar para que `closing_balance_minor` sea 0 y no quede residuo por redondeo.

## 3. Tipos base sugeridos

```ts
type CurrencyCode = "COP" | "USD" | string;

type Money = {
  amountMinor: bigint;
  currency: CurrencyCode;
};

type RateInput = {
  value: string;
  type: "monthly_effective" | "effective_annual" | "nominal_annual";
  compoundingPeriodsPerYear?: number;
};

type PaymentFrequency =
  | "monthly"
  | "biweekly"
  | "weekly"
  | "custom";

type RoundingPolicy = {
  moneyDecimals: number;
  roundingMode: "half_up" | "half_even" | "down";
};
```

## 4. Conversion de tasas

El motor debe soportar:

- Tasa efectiva mensual.
- Tasa efectiva anual.
- Tasa nominal anual con capitalizacion.
- Frecuencia de pago.

Formulas conceptuales:

### Efectiva anual a efectiva mensual

```txt
monthly_rate = (1 + annual_effective_rate)^(1/12) - 1
```

### Efectiva anual a tasa por periodo

```txt
periodic_rate = (1 + annual_effective_rate)^(periods_per_year^-1) - 1
```

Ejemplos:

- Mensual: `periods_per_year = 12`
- Quincenal: `periods_per_year = 24`
- Semanal: `periods_per_year = 52`

### Nominal anual a tasa por periodo de capitalizacion

```txt
periodic_rate = nominal_annual_rate / compounding_periods_per_year
```

Si la frecuencia de pago difiere de la capitalizacion, convertir primero a efectiva anual:

```txt
effective_annual = (1 + nominal_rate / compounding_periods_per_year)^compounding_periods_per_year - 1
payment_period_rate = (1 + effective_annual)^(1 / payment_periods_per_year) - 1
```

Validaciones:

- Tasas no negativas en MVP.
- Permitir tasa cero.
- Rechazar tasas absurdas con warnings configurables, no silenciosamente.
- Registrar tipo de tasa usado en inputs/snapshots.

## 5. Creditos de cuota fija

### 5.1 Inputs

```ts
type FixedInstallmentLoanInput = {
  principal: Money;
  rate: RateInput;
  termCount: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  firstPaymentDate?: string;
  fees?: FeeInput[];
  roundingPolicy: RoundingPolicy;
};
```

Validaciones:

- `principal > 0`.
- `termCount >= 1`.
- `currency` consistente en todos los cargos.
- Fechas validas.
- Frecuencia soportada.

### 5.2 Cuota fija

Para tasa periodica `r`, principal `P`, plazo `n`:

```txt
payment = P * r / (1 - (1 + r)^(-n))
```

Caso tasa cero:

```txt
payment = P / n
```

La cuota debe redondearse a unidad menor segun politica. La ultima cuota puede diferir para cerrar saldo.

### 5.3 Tabla de amortizacion

Por cada periodo:

```txt
interest = opening_balance * periodic_rate
fees = fees_for_period
principal = scheduled_payment - interest - fees
closing_balance = opening_balance - principal
```

Reglas:

- Si `principal` calculado supera saldo, ajustar ultima cuota.
- Si una cuota no cubre interes + fees, marcar como caso invalido o amortizacion negativa no soportada en MVP.
- `closing_balance` nunca debe ser negativo en resultado final.
- `total_interest` suma intereses redondeados por periodo.
- `total_paid` suma cuotas + fees incluidos.
- `last_payment_date` se deriva por frecuencia.

### 5.4 Costos adicionales

Tipos:

- Cargo unico al inicio.
- Cargo fijo por cuota.
- Cargo mensual.
- Cargo porcentual sobre saldo.
- Seguro fijo.
- Seguro porcentual.

En MVP:

- Soportar cargo unico y cargo fijo por cuota en simulacion.
- Seguro/cargos avanzados pueden quedar para futuro.

Decisiones:

- Definir si el cargo se financia dentro del principal o se paga por fuera.
- Mostrar costo total con y sin cargos.

## 6. Abonos extraordinarios

### 6.1 Modos

- Simulado: no altera deuda administrada.
- Aplicado: registra `ExtraPayment`, actualiza saldo, recalcula plan y crea auditoria.

### 6.2 Estrategias

#### Reducir plazo

Mantiene cuota aproximada y reduce numero de periodos.

Proceso:

1. Tomar saldo despues de la cuota o fecha de aplicacion.
2. Restar abono.
3. Mantener cuota original.
4. Recalcular periodos restantes hasta saldo cero.
5. Ajustar ultima cuota.

Resultados:

- Nuevo plazo.
- Nueva fecha final.
- Interes ahorrado.
- Total pagado estimado.

#### Reducir cuota

Mantiene plazo restante y reduce cuota.

Proceso:

1. Tomar saldo despues de la cuota o fecha de aplicacion.
2. Restar abono.
3. Mantener numero de periodos restantes.
4. Recalcular cuota fija.
5. Ajustar ultima cuota.

Resultados:

- Nueva cuota.
- Fecha final igual o casi igual.
- Interes ahorrado.
- Total pagado estimado.

### 6.3 Comparacion lado a lado

El motor debe devolver:

```ts
type ExtraPaymentComparison = {
  reduceTerm: ExtraPaymentResult;
  reducePayment: ExtraPaymentResult;
  baseline: AmortizationSchedule;
  interestSavingsByReducingTerm: Money;
  interestSavingsByReducingPayment: Money;
};
```

UI debe mostrar:

- Cuota actual.
- Nueva cuota.
- Plazo actual.
- Nuevo plazo.
- Interes ahorrado.
- Fecha final.
- Advertencia de que es simulacion hasta aplicar.

### 6.4 Aplicacion real

Reglas:

- Confirmacion fuerte antes de aplicar.
- Servicio transaccional.
- Crear `extra_payments`.
- Recalcular installments futuros.
- Mantener historial anterior via auditoria o versionado.
- No borrar pagos existentes.
- Si hay cuotas pagadas, no recalcular pasado salvo correccion auditada.

## 7. Tarjetas de credito

Tarjetas no son creditos de cuota fija. El motor debe tener modulo separado.

### 7.1 Conceptos

- Consumo.
- Compra a una cuota.
- Compra a varias cuotas.
- Fecha de corte.
- Fecha limite de pago.
- Pago minimo.
- Pago total.
- Interes sobre saldo financiado.
- Cuota de manejo/cargos.
- Saldo revolvente.

### 7.2 Modelo inicial de inputs

```ts
type CreditCardSimulationInput = {
  currentBalance: Money;
  monthlyRate: string;
  statementDay: number;
  paymentDueDay: number;
  purchases: CardPurchaseInput[];
  plannedPayments: CardPaymentInput[];
  minimumPaymentPolicy: MinimumPaymentPolicy;
  simulationMonths: number;
  roundingPolicy: RoundingPolicy;
};
```

### 7.3 Compra a cuotas

Campos:

- `amount`
- `purchaseDate`
- `installments`
- `description`
- `rateOverride` opcional futuro

Reglas:

- Distribuir principal por cuotas.
- Aplicar interes segun politica de tarjeta si corresponde.
- Reflejar en extractos futuros.

### 7.4 Pago minimo

Politicas posibles:

- Porcentaje del saldo.
- Interes del periodo + porcentaje de capital.
- Minimo fijo.
- Mayor entre varios valores.

MVP:

- Simular pago minimo con regla configurable simple, no afirmar reglas de un banco especifico.

### 7.5 Estrategias

- Pagar minimo.
- Pagar total.
- Pagar monto fijo mensual.
- Priorizar compras con mayor tasa futura.

Resultados:

- Meses hasta saldo cero.
- Interes total.
- Pagos totales.
- Alertas de saldo creciente.

## 8. Guardar simulaciones

Una simulacion guardada debe persistir:

- Inputs normalizados.
- Version del motor.
- Politica de redondeo.
- Resultados principales.
- Tabla resumida o completa segun longitud.
- Fecha de calculo.

Recomendacion:

- Para creditos con plazo razonable, guardar tabla completa en `result_json`.
- Para simulaciones muy largas, guardar resumen y recalcular detalle bajo demanda con la misma version del motor si es posible.
- Al cambiar motor en el futuro, mantener `engine_version` para reproducibilidad.

## 9. Convertir simulacion en deuda administrada

Proceso:

1. Usuario elige escenario.
2. UI muestra confirmacion: "Convertir en deuda administrada".
3. Servicio valida workspace y permisos.
4. Crear `credit_accounts`.
5. Crear `installments` desde schedule.
6. Marcar `simulations.status = converted`.
7. Guardar `source_simulation_id`.
8. Crear `audit_events`.

Reglas:

- La simulacion original queda como evidencia/snapshot.
- La deuda administrada puede evolucionar con pagos y abonos.
- No prometer que el plan coincide con una entidad externa; se muestra como herramienta de seguimiento.

## 10. Eventos financieros

Eventos que deben generar auditoria:

- Crear deuda administrada.
- Convertir simulacion.
- Registrar pago.
- Anular pago.
- Registrar abono aplicado.
- Recalcular plan por abono.
- Cambiar fecha de vencimiento.
- Archivar deuda.
- Marcar deuda como saldada.

No generar auditoria por:

- Cambiar filtros.
- Mover tabs.
- Simulaciones no guardadas.
- Inputs temporales.

## 11. Casos limite

El motor debe manejar:

- Tasa cero.
- Plazo uno.
- Principal pequeno.
- Tasa alta.
- Tasa con muchos decimales.
- Abono igual al saldo.
- Abono mayor al saldo: rechazar o ajustar con mensaje.
- Abono temprano.
- Abono tardio.
- Costos fijos mayores que cuota: invalidar.
- Ultima cuota con residuo por redondeo.
- Frecuencias no mensuales.
- Fecha inicial al final del mes.
- Anos bisiestos.

## 12. Pruebas obligatorias futuras

### 12.1 Creditos

- Cuota fija con tasa mensual normal.
- Tasa cero divide principal en plazo.
- Plazo uno cobra principal mas interes/cargos del periodo.
- Tasa alta no produce saldo negativo.
- Ultima cuota ajusta saldo a cero.
- Costos mensuales se suman correctamente.
- Costos unicos se reflejan en costo total.
- Conversion TEA a mensual coincide con formula esperada.
- Conversion nominal anual a periodo coincide con formula esperada.

### 12.2 Abonos

- Abono temprano reduce mas interes que abono tardio.
- Reducir plazo mantiene cuota y baja periodos.
- Reducir cuota mantiene periodos y baja cuota.
- Abono igual al saldo cierra deuda.
- Abono mayor al saldo falla con error claro.
- Aplicacion real no modifica cuotas pagadas.

### 12.3 Pagos

- Pago completo marca cuota pagada.
- Pago parcial marca cuota parcial.
- Pago mayor a cuota aplica regla definida o requiere decision.
- Anulacion restaura estado mediante evento, no borrado silencioso.

### 12.4 Tarjetas

- Pago total evita interes futuro segun politica simplificada.
- Pago minimo genera interes y saldo remanente.
- Compra a cuotas reparte cuotas correctamente.
- Fecha de corte asigna consumo al ciclo correcto.
- Pago despues de fecha limite queda como caso futuro de mora.

### 12.5 Redondeo

- Suma de principales por periodo iguala principal.
- Suma de cuotas coincide con total pagado esperado dentro de centavo final.
- Moneda COP sin decimales visuales si se decide UI, pero persistencia mantiene unidad menor.
- No aparecen valores `NaN`, `Infinity` ni negativos imposibles.

## 13. API interna sugerida

```ts
export function calculateFixedInstallmentSchedule(
  input: FixedInstallmentLoanInput
): AmortizationSchedule;

export function compareExtraPaymentStrategies(
  input: ExtraPaymentInput
): ExtraPaymentComparison;

export function simulateCreditCardStrategy(
  input: CreditCardSimulationInput
): CreditCardSimulationResult;

export function convertRate(
  input: RateConversionInput
): RateConversionResult;
```

Errores:

- Usar errores tipados de dominio, no strings sueltos.
- Ejemplos: `INVALID_RATE`, `NEGATIVE_PRINCIPAL`, `UNSUPPORTED_FREQUENCY`, `PAYMENT_DOES_NOT_AMORTIZE`, `EXTRA_PAYMENT_EXCEEDS_BALANCE`.

## 14. No hacer

- No calcular dinero con `number`.
- No guardar simulaciones por cada tecla.
- No mezclar calculo financiero con componentes React.
- No aplicar abonos sin confirmacion.
- No borrar historial al recalcular.
- No usar reglas de bancos especificos sin configuracion explicita.
- No usar el motor para aprobar u otorgar creditos.
