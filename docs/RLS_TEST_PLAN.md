# RLS Test Plan - CrediOS Beta

Estado: ejecutado y aprobado el 2026-06-11.
Motivo: el usuario creo manualmente dos usuarios de prueba confirmados en Supabase Auth y se pudo validar aislamiento real con sesiones autenticadas.

## Objetivo

Validar que un usuario autenticado solo pueda leer y escribir datos de workspaces donde es miembro.

## Preparacion

1. Confirmar proyecto Supabase.
2. Confirmar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Confirmar migraciones aplicadas en orden:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
src/lib/db/migrations/0002_beta_hardening_rls_and_rpcs.sql
src/lib/db/migrations/0003_workspace_bootstrap_owner_select.sql
```

4. Habilitar email/password en Supabase Auth.
5. Crear o confirmar dos usuarios de prueba:
   - Usuario A
   - Usuario B

No usar datos reales.

Nota de ejecucion: si Supabase Auth responde `email rate limit exceeded`, esperar a que termine la ventana de rate limit o crear los usuarios manualmente desde el panel de Supabase Auth para continuar la prueba.

Para continuar sin esperar el rate limit, crear manualmente Usuario A y Usuario B desde Supabase Dashboard > Authentication > Users, confirmar sus emails si el proyecto exige confirmacion y luego ejecutar la prueba desde la app o con clientes autenticados usando la publishable key. No usar `service_role`.

## Resultado automatizado 2026-06-11

- Login Usuario A: OK.
- Login Usuario B: OK.
- Bootstrap de profile/workspace/membership A: OK.
- Bootstrap de profile/workspace/membership B: OK.
- A no ve cliente/deuda B: OK.
- B no ve cliente/deuda A: OK.
- A no puede insertar cliente en workspace B: bloqueado por RLS.
- B no puede insertarse como owner/member en workspace A: bloqueado por RLS.
- A no puede modificar deuda de workspace B: bloqueado.
- B no puede llamar `record_credit_payment` sobre workspace A: bloqueado.
- `record_credit_payment` propio: OK.
- `apply_extra_payment` propio: OK.
- `apply_extra_payment` con saldo esperado obsoleto: bloqueado.
- Audit events de pago y abono: OK.
- UI con Usuario A: login, detalle de deuda, registrar pago y aplicar abono: OK.

## Prueba manual desde la app

1. Iniciar sesion como Usuario A.
2. Entrar a `/dashboard`.
3. Confirmar que se crea workspace A.
4. Crear un cliente A.
5. Crear una simulacion A.
6. Convertir o crear una deuda A.
7. Cerrar sesion.
8. Iniciar sesion como Usuario B.
9. Entrar a `/dashboard`.
10. Confirmar que se crea workspace B.
11. Verificar que Usuario B no ve cliente/simulacion/deuda de Usuario A.
12. Crear cliente/simulacion/deuda B.
13. Cerrar sesion.
14. Iniciar sesion como Usuario A.
15. Verificar que Usuario A no ve datos de Usuario B.

## Prueba SQL con sesiones JWT

Desde Supabase SQL editor no es facil simular `auth.uid()` de dos usuarios sin contexto de request. Para pruebas automatizadas reales, usar Supabase client autenticado con cada usuario y ejecutar:

```ts
const supabaseA = createClient(url, publishableKey)
await supabaseA.auth.signInWithPassword({ email: userA, password })
await supabaseA.from("clients").select("*")
```

Repetir con Usuario B y comprobar que cada cliente ve solo sus filas.

## Casos obligatorios

- Usuario A no puede seleccionar `clients` de workspace B.
- Usuario B no puede seleccionar `clients` de workspace A.
- Usuario A no puede insertar `clients` con `workspace_id` de B.
- Usuario B no puede insertar `payments` con `workspace_id` de A.
- Usuario A no puede insertarse como `workspace_member` de workspace B.
- Usuario B no puede llamar `record_credit_payment` con `workspace_id` de A.
- Usuario B no puede llamar `apply_extra_payment` con `workspace_id` de A.

## Verificacion de policies

Ejecutar en Supabase:

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Confirmar que no exista:

```sql
using (true)
with check (true)
```

en tablas sensibles.

## Resultado esperado

- Cada usuario opera solo sobre su workspace.
- Las llamadas cruzadas fallan con error de RLS o `WORKSPACE_ACCESS_DENIED`.
- Pagos y abonos se registran de forma transaccional mediante RPC.

## Evidencia a guardar

- Fecha de prueba.
- Usuarios de prueba usados, sin contrasenas.
- Capturas de listados vacios/cruzados.
- Resultado de queries de policies.
- Resultado de pago/abono exitoso en workspace propio.
- Resultado de intento cruzado fallido.
