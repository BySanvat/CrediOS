# Real Supabase Validation Status

Fecha: 2026-06-10

## Estado

La conexion real a Supabase queda pendiente porque `.env.local` existe pero no contiene las variables requeridas de Supabase/PostgreSQL.

`.env.local` esta:

- presente;
- ignorado por Git;
- no trackeado;
- sin valores reales para Supabase al momento de esta validacion.

## Validaciones ejecutadas en esta sesion

Pasaron:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

Resultado:

- tests financieros: 10/10;
- e2e Playwright minimo: 3/3;
- build Next.js: correcto.

## Vercel

`npx vercel --version` funciona y reporta Vercel CLI disponible.

Pendiente:

- proyecto no vinculado (`.vercel` no existe);
- variables reales no configuradas;
- deploy no ejecutado.

## Variables necesarias

Configurar en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Si el proyecto no tiene publishable key nueva, usar:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_public_key
```

## Correccion importante

`DATABASE_URL` debe ser una connection string PostgreSQL real. No debe ser la URL REST de Supabase.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` debe ser una key publica. No debe ser una connection string PostgreSQL.

## Migraciones listas

Aplicar en orden:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
```

La migracion `0002` agrega:

- helper `is_workspace_admin`;
- hardening de `workspace_members`;
- reemplazo de policies amplias por policies explicitas;
- RPC `record_credit_payment`;
- RPC `apply_extra_payment`.

## Validaciones pendientes contra Supabase real

- Aplicar migraciones.
- Verificar tablas.
- Verificar RLS activo.
- Verificar RPCs.
- Probar usuario A/B.
- Probar UI con signup/login real.
- Crear cliente/simulacion/deuda.
- Registrar pago con `record_credit_payment`.
- Aplicar abono con `apply_extra_payment`.
- Verificar saldo/historial/auditoria.

## Comandos de verificacion local

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

## Deploy

No hacer deploy hasta:

- configurar variables reales en Vercel;
- aplicar migraciones;
- configurar Supabase Auth URLs;
- probar RLS usuario A/B;
- confirmar que `npm run build` pasa.
