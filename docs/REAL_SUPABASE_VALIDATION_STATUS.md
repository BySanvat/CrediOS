# Real Supabase Validation Status

Fecha: 2026-06-11

## Estado

La conexion real a Supabase ya fue validada con `DATABASE_URL` de pooler.

`.env.local` esta:

- presente;
- ignorado por Git;
- no trackeado;
- configurado localmente con URL publica, publishable key y connection string PostgreSQL de pooler.

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

## Validacion de base real

Resultado contra Supabase real:

- Conexion PostgreSQL: OK via pooler.
- Tablas encontradas: 12/12.
- RLS activo: 12/12 tablas sensibles.
- Policies presentes: 12/12 tablas sensibles.
- Policies abiertas inseguras tipo `using (true)` / `with check (true)`: 0.
- RPCs presentes:
  - `record_credit_payment`
  - `apply_extra_payment`
  - `is_workspace_member`
  - `is_workspace_admin`

Migraciones aplicadas:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
src/lib/db/migrations/0003_workspace_bootstrap_owner_select.sql
```

## Vercel

`npx vercel --version` funciona y reporta Vercel CLI disponible.

Pendiente:

- proyecto no vinculado (`.vercel` no existe);
- variables reales no verificadas en Vercel;
- deploy no ejecutado.
- `npx vercel whoami` quedo esperando login o interaccion y termino por timeout.

## Variables necesarias en local

`.env.local` ya fue configurado localmente y no esta trackeado por Git. Debe contener:

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

## Migraciones

Aplicadas en orden:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
src/lib/db/migrations/0003_workspace_bootstrap_owner_select.sql
```

La migracion `0002` agrega:

- helper `is_workspace_admin`;
- hardening de `workspace_members`;
- reemplazo de policies amplias por policies explicitas;
- RPC `record_credit_payment`;
- RPC `apply_extra_payment`.

La migracion `0003` corrige el bootstrap inicial de workspace:

- permite que el owner lea su propio workspace antes de que exista membership;
- conserva el acceso por membership para usuarios ya miembros;
- no abre acceso cruzado entre workspaces.

## Validaciones contra Supabase real

Pasaron el 2026-06-11:

- Login Usuario A: OK.
- Login Usuario B: OK.
- Bootstrap profile/workspace/membership Usuario A: OK.
- Bootstrap profile/workspace/membership Usuario B: OK.
- Crear cliente/simulacion/deuda A: OK.
- Crear cliente/simulacion/deuda B: OK.
- Usuario A no ve cliente/deuda B: OK.
- Usuario B no ve cliente/deuda A: OK.
- Usuario A no puede insertar cliente en workspace B: bloqueado.
- Usuario B no puede insertarse como member/owner en workspace A: bloqueado.
- Usuario A no puede modificar deuda de workspace B: bloqueado.
- `record_credit_payment`: OK.
- `record_credit_payment` cruzado desde Usuario B contra workspace A: bloqueado.
- `apply_extra_payment`: OK.
- `apply_extra_payment` con saldo esperado stale: bloqueado.
- `audit_events` de pago y abono: OK.
- Validacion UI con Usuario A: login, detalle de deuda, registrar pago y aplicar abono: OK.

Historial de intentos automaticos previos:

- Primer intento con dominio reservado fue rechazado por Supabase Auth como email invalido.
- Segundo intento fue bloqueado por rate limit de email en Supabase Auth antes de completar usuario B.
- Intento final de validacion A/B fue bloqueado por Supabase Auth con `email rate limit exceeded` antes de completar Usuario A.
- Luego el usuario creo manualmente los usuarios y la validacion final paso.

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
- configurar Supabase Auth URLs;
- vincular proyecto Vercel o iniciar sesion en Vercel CLI;
- confirmar que `npm run build` pasa.
