# Real Supabase Validation Status

Fecha: 2026-06-10

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
```

## Vercel

`npx vercel --version` funciona y reporta Vercel CLI disponible.

Pendiente:

- proyecto no vinculado (`.vercel` no existe);
- variables reales no verificadas en Vercel;
- deploy no ejecutado.

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
```

La migracion `0002` agrega:

- helper `is_workspace_admin`;
- hardening de `workspace_members`;
- reemplazo de policies amplias por policies explicitas;
- RPC `record_credit_payment`;
- RPC `apply_extra_payment`.

## Validaciones pendientes contra Supabase real

- Probar usuario A/B con dos cuentas de prueba.
- Probar UI con signup/login real.
- Crear cliente/simulacion/deuda con sesion autenticada real.
- Registrar pago con `record_credit_payment` desde UI.
- Aplicar abono con `apply_extra_payment` desde UI.
- Verificar saldo/historial/auditoria.

Intento automatico A/B:

- Primer intento con dominio reservado fue rechazado por Supabase Auth como email invalido.
- Segundo intento fue bloqueado por rate limit de email en Supabase Auth antes de completar usuario B.
- Intento final de validacion A/B fue bloqueado por Supabase Auth con `email rate limit exceeded` antes de completar Usuario A.
- No se fingio la prueba A/B; queda pendiente crear o esperar disponibilidad de dos usuarios de prueba.

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
- probar RLS usuario A/B;
- probar pagos/abonos RPC con sesion autenticada real;
- confirmar que `npm run build` pasa.
