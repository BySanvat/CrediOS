# Setup Supabase y Vercel - CrediOS MVP

## 1. Variables requeridas

Local y Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Compatibilidad legacy:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Preferir `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` si el proyecto de Supabase ya la ofrece.

Importante:

- `.env.example` debe quedarse con placeholders.
- Los valores reales van en `.env.local` y en Vercel.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` no es una URL PostgreSQL.
- `DATABASE_URL` no es la URL REST de Supabase; debe ser la connection string PostgreSQL.

Ejemplo de forma, sin valores reales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 1.1 Donde encontrar cada valor

En Supabase:

1. `NEXT_PUBLIC_SUPABASE_URL`
   - Project Settings
   - API
   - Project URL
   - Tiene forma `https://PROJECT_REF.supabase.co`

2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Project Settings
   - API
   - Publishable key
   - Tiene forma `sb_publishable_...`

3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Solo usar si el proyecto no muestra publishable key.
   - Project Settings
   - API
   - anon public key
   - No debe ser una URL PostgreSQL.

4. `DATABASE_URL`
   - Project Settings
   - Database
   - Connection string
   - Seleccionar URI / Transaction pooler si Supabase lo recomienda para tu entorno
   - Reemplazar `[YOUR-PASSWORD]` por la contraseña real de la base
   - Tiene forma `postgresql://postgres:PASSWORD@...:5432/postgres`
   - Este valor es secreto y solo debe ir en `.env.local` o Vercel.

5. `NEXT_PUBLIC_APP_URL`
   - Local: `http://localhost:3000`
   - Vercel: URL final del deploy.

## 2. Reglas de secretos

- No commitear `.env.local`.
- No usar `service_role` en frontend.
- No exponer `DATABASE_URL` en componentes cliente.
- No guardar credenciales reales en documentacion.

## 3. Crear proyecto Supabase

1. Crear proyecto Supabase.
2. Copiar URL publica.
3. Copiar publishable key o anon key.
4. Copiar connection string PostgreSQL para `DATABASE_URL`.
5. Configurar Auth con email/password.
6. Configurar Site URL:

```txt
http://localhost:3000
```

En Vercel, actualizar a la URL real del despliegue.

## 4. Aplicar migracion inicial

Archivos, en orden:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
src/lib/db/migrations/0003_workspace_bootstrap_owner_select.sql
```

Opciones:

1. Ejecutar desde SQL Editor de Supabase.
2. Ejecutar con `psql` usando `DATABASE_URL`.
3. Adaptar a flujo Drizzle Kit custom si el equipo decide automatizar migraciones.

Las migraciones crean:

- `profiles`
- `workspaces`
- `workspace_members`
- `clients`
- `simulations`
- `credit_accounts`
- `installments`
- `payments`
- `extra_payments`
- `reminders`
- `credit_cards`
- `audit_events`
- indices
- triggers `updated_at`
- funcion `is_workspace_member`
- RLS y policies
- RPC transaccionales `record_credit_payment` y `apply_extra_payment`

## 5. Bootstrap workspace

El bootstrap ocurre desde servidor al entrar a rutas privadas:

1. Se valida usuario autenticado.
2. Se crea/actualiza `profiles`.
3. Si el usuario no tiene workspace, se crea `workspaces`.
4. Se crea `workspace_members` con rol `owner`.

No usa `service_role`.

## 6. Deploy Vercel

No se hizo deploy en esta sesion.

Pasos:

1. Crear proyecto Vercel desde el repositorio.
2. Agregar variables de entorno.
3. Verificar que `NEXT_PUBLIC_APP_URL` apunte a la URL de Vercel.
4. Configurar esa URL en Supabase Auth.
5. Ejecutar build.
6. Desplegar.

Comando local de validacion:

```bash
npm run build
```

## 7. Checklist antes de beta

- Probar usuario A vs usuario B para confirmar RLS.
- Probar signup/login/logout.
- Probar creacion de workspace.
- Probar guardar simulacion.
- Probar conversion a deuda.
- Probar pagos y abonos.
- Revisar logs sin PII.
- Confirmar que no hay `service_role` en frontend.
- Probar `record_credit_payment` desde la UI.
- Probar `apply_extra_payment` desde la UI.
- Revisar `docs/RLS_TEST_PLAN.md`.
