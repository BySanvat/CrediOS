# Personal Finance P0 Scope

Fecha: 2026-06-11

## Nombre de producto

Nombre dentro de CrediOS: **Finanzas personales**.

Motivo: es directo, maduro y consistente con una app que organiza informacion financiera. Evita sonar como una entidad que vende o aprueba productos financieros.

## Objetivo P0

Permitir que una persona registre movimientos, entienda su periodo actual, controle presupuestos y detecte capacidad realista para abonos extraordinarios.

## Vistas

### `/finanzas`

Dashboard personal:

- ingresos del periodo;
- gastos del periodo;
- balance neto;
- flujo libre potencial;
- categorias top;
- presupuestos criticos;
- proximos recurrentes;
- capacidad de abono vinculada a deudas activas;
- selector mes / trimestre / anio.

### `/finanzas/movimientos`

Movimientos:

- quick add;
- lista paginada por periodo;
- filtros por tipo, categoria y busqueda;
- edicion basica;
- archivado blando;
- creacion de categoria.

### `/finanzas/presupuestos`

Presupuestos:

- presupuesto por categoria;
- periodo mensual o trimestral;
- progreso visual;
- restante;
- rollover opcional guardado como booleano, sin calculo complejo P0.

### `/finanzas/recurrentes`

Reglas recurrentes:

- ingreso o gasto;
- categoria;
- monto;
- frecuencia;
- intervalo;
- fecha inicio;
- fecha fin opcional;
- proxima fecha;
- activo/inactivo.

P0 no ejecuta jobs automaticos ni crea transacciones en background.

### `/finanzas/reportes`

Reportes:

- resumen por mes / trimestre / anio;
- barras de categorias;
- insights deterministicos;
- export CSV real.

## Quick Add P0

Soporta frases como:

- `almuerzo 28000 hoy`;
- `gasolina 120000 ayer`;
- `salario 2800000`;
- `netflix 38900 el viernes`;
- `coffee 5 yesterday`.

El parser extrae:

- monto;
- fecha;
- tipo probable;
- categoria sugerida;
- nota normalizada.

El usuario siempre puede ajustar antes de guardar.

## Datos

Tablas nuevas:

- `personal_categories`;
- `personal_transactions`;
- `personal_budgets`;
- `recurring_rules`.

Todas usan `workspace_id` y RLS.

## Fuera de P0

- conciliacion bancaria;
- importaciones automaticas;
- OCR;
- voz persistida;
- IA externa;
- calendarios nativos;
- notificaciones push;
- recomendaciones personalizadas con scoring.
