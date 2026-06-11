# Deployment Checklist - CrediOS Beta

## Precondiciones

- `npm run test:run` pasa.
- `npm run typecheck` pasa.
- `npm run lint` pasa.
- `npm run build` pasa.
- Migraciones Supabase aplicadas.
- RLS probado con dos usuarios.
- Pagos/abonos RPC probados con sesion autenticada.
- No hay secrets en repo.
- No se usa `service_role` en frontend.

## Supabase

1. Confirmar proyecto Supabase.
2. Copiar `NEXT_PUBLIC_SUPABASE_URL`.
3. Copiar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Obtener `DATABASE_URL` PostgreSQL real.
5. Confirmar/aplicar:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
src/lib/db/migrations/0003_workspace_bootstrap_owner_select.sql
```

6. Configurar Auth:
   - Email/password enabled.
   - Site URL local: `http://localhost:3000`
   - Redirect URL local: `http://localhost:3000/auth/callback`
   - Site URL Vercel: `https://TU-DOMINIO.vercel.app`
   - Redirect URL Vercel: `https://TU-DOMINIO.vercel.app/auth/callback`

7. Crear usuarios test A/B.
8. Ejecutar `docs/RLS_TEST_PLAN.md`.
9. Probar desde UI:
   - crear cliente;
   - crear simulacion/deuda;
   - registrar pago por RPC;
   - aplicar abono por RPC.

## Vercel

1. Importar repositorio.
2. Configurar variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=https://TU-DOMINIO.vercel.app
```

3. Build command:

```bash
npm run build
```

4. Output: Next.js default.
5. Deploy.
6. Actualizar Supabase Auth URL con la URL final.
7. Probar:
   - `/`
   - `/login`
   - `/signup`
   - login real
   - `/dashboard`
   - crear cliente
   - crear simulacion
   - convertir a deuda
   - registrar pago
   - aplicar abono

## Vercel CLI opcional

Si no esta vinculado:

```bash
npx vercel link
```

Si no estas autenticado:

```bash
npx vercel login
```

Deploy:

```bash
npx vercel --prod
```

No ejecutar deploy si faltan variables, build falla o RLS no fue probado.

Estado actual: Vercel CLI esta instalado, pero `.vercel` no existe y `npx vercel whoami` quedo esperando login/interaccion hasta timeout. Ejecutar `npx vercel login` y `npx vercel link` manualmente, eligiendo la cuenta/proyecto correctos. No adivinar el proyecto desde automatizacion.

## Rollback

- Usar rollback de Vercel si la app falla.
- No borrar tablas Supabase.
- No hacer reset de base sin backup y autorizacion explicita.
- Mantener migraciones aplicadas registradas.
