# Beta Hardening Status - CrediOS

Fecha: 2026-06-10

## Resumen

Esta fase endurece el MVP existente sin agregar grandes modulos nuevos. El foco fue RLS, RPC transaccional, pruebas e2e minimas, documentacion de Supabase/Vercel y correccion del manejo de variables.

## Cambios realizados

- `.env.example` restaurado a placeholders.
- Agregada migracion `0002_beta_hardening_rls_and_rpcs.sql`.
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

No probado contra Supabase real en esta sesion porque no existe `.env.local` ni `DATABASE_URL` PostgreSQL real disponible.

El archivo `.env.example` tenia valores cruzados:

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

- Aplicar migraciones en Supabase.
- Ejecutar `docs/RLS_TEST_PLAN.md`.
- Probar pagos/abonos desde UI contra Supabase real.
- Considerar tests de RLS automatizados con usuarios de prueba.
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
