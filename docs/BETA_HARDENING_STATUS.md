# Beta Hardening Status - CrediOS

Fecha: 2026-06-11

## Resumen

Esta fase endurece el MVP existente sin agregar grandes modulos nuevos. El foco fue RLS, RPC transaccional, pruebas e2e minimas, documentacion de Supabase/Vercel y correccion del manejo de variables.

## Cambios realizados

- `.env.example` restaurado a placeholders.
- Agregada migracion `0002_beta_hardening_rls_and_rpcs.sql`.
- Agregada migracion `0003_workspace_bootstrap_owner_select.sql` para permitir bootstrap seguro del workspace owner.
- Agregada migracion `0004_personal_finance_p0.sql` para finanzas personales P0.
- Reemplazadas policies amplias `for all` por policies explicitas sin delete en tablas financieras.
- Corregida policy de `workspace_members` para impedir que un usuario se inserte como owner de un workspace ajeno.
- Agregada RPC `record_credit_payment`.
- Agregada RPC `apply_extra_payment`.
- Server actions de pagos/abonos actualizadas para llamar RPCs.
- Agregada configuracion Playwright.
- Agregadas pruebas e2e minimas de landing, login y proteccion privada.
- Agregado `docs/RLS_TEST_PLAN.md`.
- Agregado `docs/DEPLOYMENT_CHECKLIST.md`.

## Estado de Supabase real

Supabase real quedo conectado via pooler y las migraciones `0001`, `0002`, `0003` y `0004` fueron aplicadas. Ver `docs/REAL_SUPABASE_VALIDATION_STATUS.md`.

Resultado de metadatos contra base real:

- Conexion PostgreSQL: OK.
- Tablas esperadas: 12/12.
- RLS activo: 12/12.
- Policies presentes: 12/12.
- Policies abiertas inseguras tipo `true`: 0.
- RPCs presentes: `record_credit_payment` y `apply_extra_payment`.
- RLS A/B con dos usuarios confirmados: pasa.
- RPC de pago con sesion real: pasa.
- RPC de abono con sesion real: pasa.
- Validacion UI de login, detalle de deuda, pago y abono: pasa.

Validaciones locales de esa sesion:

- `npm run test:run`: pasa.
- `npm run typecheck`: pasa.
- `npm run lint`: pasa.
- `npm run build`: pasa.
- `npm run e2e`: pasa.

Vercel CLI esta disponible, pero el proyecto no esta vinculado y no se hizo deploy.

Durante la fase previa, el archivo `.env.example` tenia valores cruzados:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` tenia forma de URL PostgreSQL.
- `DATABASE_URL` tenia forma de URL REST.

Se corrigio el archivo versionado. Los valores reales deben ir en `.env.local`.

## RPC transaccionales

### `record_credit_payment`

Ejecuta en una transaccion:

- valida usuario autenticado;
- valida membership de workspace;
- bloquea la deuda con `for update`;
- bloquea cuota si aplica;
- inserta `payments`;
- actualiza cuota;
- actualiza saldo/status de deuda;
- inserta `audit_events`.

### `apply_extra_payment`

Ejecuta en una transaccion:

- valida usuario autenticado;
- valida membership de workspace;
- bloquea la deuda con `for update`;
- valida saldo esperado para evitar persistir un plan stale;
- inserta `extra_payments`;
- cancela cuotas pendientes/parciales;
- inserta nuevo plan desde `new_summary.schedule`;
- actualiza saldo/status/resumen de deuda;
- inserta `audit_events`.

El recalculo financiero sigue en TypeScript porque depende del motor puro testeado. La persistencia del resultado ocurre en RPC transaccional.

## Pendiente antes de beta real

- Vincular proyecto Vercel.
- Configurar variables reales en Vercel.
- Configurar Supabase Auth Redirect URLs con la URL final.
- Revisar `npm audit` cuando Next publique version que resuelva PostCSS sin downgrade rompedor.

## Auditoria de dependencias

`npm audit --omit=dev --audit-level=moderate` reporta 2 vulnerabilidades moderadas heredadas de `next` por `postcss <8.5.10`.

No se aplico `npm audit fix --force` porque npm propone instalar `next@9.3.3`, que seria un cambio rompedor e incorrecto para este proyecto.

`npm outdated` no pudo completarse en esta maquina por `ENOSPC` (falta de espacio en disco al escribir cache npm). Reintentar despues de liberar espacio local.

## No cambiado

- No se agrego modulo de finanzas personales.
- No se agrego billing.
- No se agrego WhatsApp/email/push.
- No se agregaron pagos reales.
- No se hizo deploy.
