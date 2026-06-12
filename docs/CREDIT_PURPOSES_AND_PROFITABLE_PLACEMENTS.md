# Credit Purposes and Profitable Placements

## Propositos

Al convertir una simulacion guardada se pregunta:

- Credito personal.
- Credito a tercero.
- Colocacion rentable.

## Persistencia

Para evitar una migracion bloqueante en produccion, la clasificacion se guarda en `credit_accounts.summary`:

- `creditPurpose`;
- `affectsPersonalFinance`;
- `countPaymentsAsIncome`;
- `countInterestAsProfit`.

## Resumen de negocio

La pagina de creditos calcula resumen de negocio con creditos cuyo `summary` indica colocacion rentable o medicion de ingresos/ganancias.

Indicadores actuales:

- capital activo;
- capital recuperado;
- dinero colocado;
- cartera activa;
- utilidad proyectada;
- pagos recibidos del mes.

## Pendiente

Una fase posterior puede mover estos campos a columnas `jsonb`/booleanas dedicadas con migracion aditiva si se necesita reporting SQL directo.
