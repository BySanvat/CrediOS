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

Archivo:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
```

Opciones:

1. Ejecutar desde SQL Editor de Supabase.
2. Ejecutar con `psql` usando `DATABASE_URL`.
3. Adaptar a flujo Drizzle Kit custom si el equipo decide automatizar migraciones.

La migracion crea:

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
