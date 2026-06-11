# ADR 003 - MonAi-inspired Personal Finance for CrediOS

Fecha: 2026-06-11

## Estado

Aceptado para P0.

## Contexto

CrediOS ya cubre simulaciones, deudas administradas, clientes, pagos, abonos y recordatorios. El siguiente paso es agregar Finanzas Personales para que el usuario pueda registrar ingresos, gastos, presupuestos y recurrencias con friccion baja, y luego conectar esa informacion con decisiones de deuda.

La referencia MonAi se usa como inspiracion de experiencia:

- captura rapida;
- lenguaje simple;
- foco en habito;
- visual liviano;
- lectura inmediata de numeros.

CrediOS no copia flujos nativos, automatizaciones iOS, promesas comerciales ni tono de neobanco. CrediOS mantiene su ADN: claridad financiera, deuda, pagos, abonos y control.

## Decision

Implementar un modulo llamado **Finanzas personales**.

Razones:

- Es claro para usuarios no tecnicos.
- Encaja con el resto del producto en espanol.
- No suena a banco, credito aprobado ni prestamista.
- Permite crecer hacia flujo de caja, presupuestos, recurrencias y capacidad de abono.

## Alcance P0

Incluye:

- dashboard personal en `/finanzas`;
- quick add deterministico;
- movimientos de ingreso/gasto;
- categorias personales;
- presupuestos por categoria;
- reglas recurrentes con fecha fin opcional;
- reportes por mes, trimestre y anio;
- export CSV;
- insights deterministicos;
- tarjeta de capacidad de abono conectada a deudas existentes.

No incluye:

- IA externa;
- Apple Pay;
- Apple Shortcuts;
- OCR;
- parsing de email/SMS;
- integracion bancaria;
- push notifications;
- app movil nativa;
- billing;
- recomendaciones agresivas o moralistas.

## Arquitectura

El modulo usa las mismas reglas del SaaS:

- `workspace_id` obligatorio en tablas sensibles;
- RLS por membership;
- server actions con Zod;
- dinero persistido en centavos;
- parser puro y testeable;
- agregaciones acotadas por periodo;
- sin writes por cada tecla;
- sin realtime ni polling en P0.

## Consecuencias

Ventajas:

- Reduce friccion de captura.
- Hace visible flujo libre potencial.
- Prepara recomendaciones de abono sin IA costosa.
- Mantiene costos controlados.

Riesgos:

- Las agregaciones pueden crecer si no se pagina por periodo.
- El parser deterministico debe ser conservador para no clasificar de forma sorpresiva.
- Las recurrencias P0 no deben crear transacciones automaticas sin confirmacion futura.

Mitigaciones:

- Period filters por defecto.
- Indices por `workspace_id`, `occurred_at`, `type`, `category_id`.
- Recurrencias visibles como reglas, no jobs automaticos.
- Insights transparentes y explicables.
