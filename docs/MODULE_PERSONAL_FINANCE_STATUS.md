# Module Status - Finanzas personales P0

Fecha: 2026-06-11

## Estado

Implementado y validado contra Supabase real.

## Vistas

- `/finanzas`: dashboard personal con quick add, ingresos, gastos, balance, categorias top, presupuestos criticos, recurrentes, insights y capacidad de abono.
- `/finanzas/movimientos`: quick add, registro manual, categorias, filtros de periodo y lista editable con archivado blando.
- `/finanzas/presupuestos`: presupuestos por categoria con progreso visual, restante y cierre suave.
- `/finanzas/recurrentes`: reglas recurrentes con frecuencia, intervalo, fecha inicio, fecha fin opcional y activo/inactivo.
- `/finanzas/reportes`: resumen por periodo, distribucion, insights y export CSV.

## Data model

Migracion aplicada:

```txt
src/lib/db/migrations/0004_personal_finance_p0.sql
```

Tablas nuevas:

- `personal_categories`;
- `personal_transactions`;
- `personal_budgets`;
- `recurring_rules`.

Todas tienen `workspace_id`, RLS activo y policies por membership. No se agregaron deletes fisicos.

## Quick Add

Parser deterministico en `src/domain/personal-finance/parser.ts`.

Ejemplos soportados:

- `almuerzo 28000 hoy`;
- `gasolina 120000 ayer`;
- `salario 2800000`;
- `netflix 38900 el viernes`;
- `coffee 5 yesterday`.

No usa IA externa ni escribe por cada tecla.

## Insights

Reglas deterministicas:

- presupuesto en alerta;
- mayor gasto variable;
- comparacion contra periodo anterior;
- capacidad de abono si hay flujo libre y deudas activas.

## Validaciones

Pasaron:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

Prueba UI local contra Supabase real:

- login;
- `/finanzas`;
- quick add;
- crear categoria;
- crear presupuesto;
- crear recurrente;
- export CSV;
- vista movil.

## Costos y rendimiento

Medidas aplicadas:

- queries por `workspace_id`;
- filtros por periodo;
- `limit` en listados principales;
- indices por workspace/fecha/tipo/categoria;
- CSV por periodo;
- sin realtime;
- sin polling;
- sin IA externa.

Riesgos futuros:

- reportes historicos multi-anio pueden necesitar agregados materializados;
- importaciones masivas requeriran jobs y deduplicacion mas fuerte;
- recurrencias automaticas deben ejecutarse con auditoria y control de idempotencia.

## Fuera de P0

- OCR;
- email/SMS parsing;
- integracion bancaria;
- voz persistida;
- Apple Pay/Shortcuts;
- jobs automaticos de recurrencias;
- PDF;
- IA externa.
