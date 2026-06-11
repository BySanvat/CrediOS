# CrediOS by Sanvat - Data Model v1

Estado: Fase 0  
Objetivo: proponer modelo relacional inicial para PostgreSQL/Supabase sin crear migraciones reales.

## 1. Principios de datos

- Todas las tablas de negocio deben incluir `workspace_id` salvo catalogos globales controlados.
- Dinero se persiste como enteros en unidad menor: `amount_minor`, `currency`.
- Tasas se persisten como decimal string o `numeric`, nunca como float binario.
- Cambios financieros criticos se hacen en transaccion.
- Pagos y abonos no se sobrescriben; se anulan o compensan con evento.
- RLS debe impedir acceso cruzado por workspace.
- Consultas operativas deben usar indices por `workspace_id`, estado y fechas.
- Dashboards deben paginar, filtrar por rango y apoyarse en rollups cuando crezca el volumen.

## 2. Convenciones

Tipos sugeridos:

- IDs: `uuid`.
- Fechas de creacion: `timestamptz`.
- Fechas de pago/vencimiento: `date` cuando la hora no importa; `timestamptz` cuando se programe notificacion exacta.
- Money: `bigint amount_minor` + `char(3) currency`.
- Rates: `numeric(18,10)` para tasas periodicas/anuales.
- JSON snapshots: `jsonb` con schema version.
- Soft delete: `archived_at` o `deleted_at` segun entidad.

Columnas comunes:

- `id uuid primary key`
- `workspace_id uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

RLS base:

- Un usuario puede leer/escribir filas de un workspace solo si existe `workspace_members` activo para su `auth.uid()`.
- Roles futuros definen permisos por accion.
- Tablas financieras append-only o sensibles restringen update/delete.

## 3. Tablas

### 3.1 users

Nota: en Supabase Auth, `auth.users` existe. Esta tabla seria perfil publico/privado de aplicacion.

Campos:

- `id uuid primary key references auth.users(id)`
- `email text not null`
- `display_name text`
- `avatar_url text`
- `default_workspace_id uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_users_email` unique lower email, si se gestiona fuera de `auth.users`.

Seguridad:

- Usuario solo lee/actualiza su perfil.
- No guardar secretos.

Costos:

- Tabla pequena; cacheable.

### 3.2 workspaces

Campos:

- `id uuid primary key`
- `name text not null`
- `slug text`
- `type text not null check in ('personal','lender','team')`
- `default_currency char(3) not null default 'COP'`
- `timezone text not null default 'America/Bogota'`
- `created_by_user_id uuid not null references users(id)`
- `archived_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_workspaces_created_by`
- `idx_workspaces_slug` unique nullable.

Relaciones:

- 1:N `workspace_members`.
- 1:N entidades financieras.

Seguridad:

- Lectura solo miembros activos.
- Update solo owner/admin futuro.

Costos:

- Baja cardinalidad; no problema.

### 3.3 workspace_members

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `user_id uuid not null references users(id)`
- `role text not null default 'owner'`
- `status text not null default 'active'`
- `invited_by_user_id uuid null references users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_workspace_members_workspace_user unique (workspace_id, user_id)`
- `idx_workspace_members_user_status (user_id, status)`
- `idx_workspace_members_workspace_status (workspace_id, status)`

Seguridad:

- Es la tabla base para RLS.
- Cambios de rol requieren auditoria.

Costos:

- Indice critico para todas las politicas RLS; mantener simple.

### 3.4 personal_profiles

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `display_name text not null`
- `default_currency char(3) not null`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_personal_profiles_workspace unique (workspace_id)`

Seguridad:

- Solo miembros del workspace.

Costos:

- Una fila por workspace personal.

### 3.5 clients

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `type text not null default 'person'`
- `full_name text not null`
- `document_type text`
- `document_number text`
- `phone text`
- `email text`
- `address text`
- `notes text`
- `status text not null default 'active'`
- `archived_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_clients_workspace_status (workspace_id, status)`
- `idx_clients_workspace_name (workspace_id, full_name)`
- `idx_clients_workspace_document (workspace_id, document_type, document_number)` unique nullable si aplica.
- Busqueda futura: trigram index en `full_name` si el volumen lo exige.

Relaciones:

- 1:N `credit_accounts`.
- 1:N `reminders`, `attachments` via entidad.

Seguridad:

- PII. No exponer en logs ni analytics.
- Delete fisico no recomendado en MVP; usar `archived_at`.

Costos:

- Paginacion obligatoria en listados.
- Evitar busquedas sin indice en carteras grandes.

### 3.6 financial_products

Campos:

- `id uuid primary key`
- `workspace_id uuid null references workspaces(id)`
- `name text not null`
- `kind text not null`
- `description text`
- `is_active boolean not null default true`
- `created_at timestamptz`

Indices:

- `idx_financial_products_workspace_kind (workspace_id, kind)`

Seguridad:

- Productos globales solo lectura.
- Productos por workspace solo miembros.

Costos:

- Puede empezar como enum en codigo para evitar tabla prematura.

### 3.7 simulations

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `owner_user_id uuid not null references users(id)`
- `name text not null`
- `product_kind text not null`
- `currency char(3) not null`
- `principal_amount_minor bigint not null`
- `status text not null default 'saved'`
- `source text not null default 'manual'`
- `converted_credit_account_id uuid null`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `archived_at timestamptz`

Indices:

- `idx_simulations_workspace_status_created (workspace_id, status, created_at desc)`
- `idx_simulations_workspace_owner (workspace_id, owner_user_id)`
- `idx_simulations_converted_credit (converted_credit_account_id)`

Relaciones:

- 1:N `simulation_scenarios`.
- 0:1 `credit_accounts`.

Seguridad:

- Solo workspace.
- Conversion requiere transaccion y auditoria.

Costos:

- No guardar drafts por tecla.
- `result_json` vive en scenarios, no duplicar tablas completas innecesariamente.

### 3.8 simulation_scenarios

Campos:

- `id uuid primary key`
- `simulation_id uuid not null references simulations(id) on delete cascade`
- `workspace_id uuid not null references workspaces(id)`
- `name text not null`
- `input_json jsonb not null`
- `result_json jsonb not null`
- `schema_version integer not null default 1`
- `rounding_policy text not null`
- `is_primary boolean not null default false`
- `created_at timestamptz`

Indices:

- `idx_simulation_scenarios_simulation (simulation_id)`
- `idx_simulation_scenarios_workspace (workspace_id)`
- `idx_simulation_scenarios_primary (simulation_id, is_primary)`

Seguridad:

- RLS por `workspace_id` redundante para evitar joins complejos.

Costos:

- JSONB puede crecer; limitar numero de escenarios y tamano de tabla guardada.
- Para tablas de amortizacion largas, guardar resumen y recalcular detalle si es barato; guardar snapshot completo solo si se necesita reproducibilidad.

### 3.9 credit_accounts

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `client_id uuid null references clients(id)`
- `personal_profile_id uuid null references personal_profiles(id)`
- `source_simulation_id uuid null references simulations(id)`
- `name text not null`
- `lender_name text`
- `borrower_label text`
- `currency char(3) not null`
- `principal_amount_minor bigint not null`
- `current_balance_minor bigint not null`
- `annual_rate numeric(18,10)`
- `periodic_rate numeric(18,10)`
- `rate_type text`
- `term_count integer not null`
- `payment_frequency text not null`
- `start_date date not null`
- `first_payment_date date not null`
- `status text not null default 'active'`
- `created_by_user_id uuid not null references users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`
- `archived_at timestamptz`

Constraints:

- Exactamente uno de `client_id` o `personal_profile_id` debe existir.
- `principal_amount_minor >= 0`
- `current_balance_minor >= 0`

Indices:

- `idx_credit_accounts_workspace_status (workspace_id, status)`
- `idx_credit_accounts_workspace_client (workspace_id, client_id)`
- `idx_credit_accounts_workspace_personal (workspace_id, personal_profile_id)`
- `idx_credit_accounts_workspace_created (workspace_id, created_at desc)`

Relaciones:

- 1:N `installments`, `payments`, `extra_payments`, `fees`.

Seguridad:

- Update de saldo solo por servicios transaccionales.
- Archivar no debe borrar historial.

Costos:

- Persistir `current_balance_minor` para dashboard.
- Recalcular saldo completo solo en auditorias o reparaciones.

### 3.10 credit_card_accounts

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `client_id uuid null references clients(id)`
- `personal_profile_id uuid null references personal_profiles(id)`
- `issuer_name text`
- `card_label text not null`
- `currency char(3) not null`
- `credit_limit_minor bigint`
- `current_balance_minor bigint not null default 0`
- `annual_rate numeric(18,10)`
- `monthly_rate numeric(18,10)`
- `statement_day integer not null`
- `payment_due_day integer not null`
- `minimum_payment_policy_json jsonb`
- `status text not null default 'active'`
- `created_at timestamptz`
- `updated_at timestamptz`
- `archived_at timestamptz`

Indices:

- `idx_credit_cards_workspace_status (workspace_id, status)`
- `idx_credit_cards_workspace_client (workspace_id, client_id)`
- `idx_credit_cards_workspace_personal (workspace_id, personal_profile_id)`

Seguridad:

- Igual que creditos.

Costos:

- En MVP no modelar movimientos completos si no se implementa tarjeta.

### 3.11 installments

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `credit_account_id uuid not null references credit_accounts(id)`
- `installment_number integer not null`
- `due_date date not null`
- `opening_balance_minor bigint not null`
- `scheduled_payment_minor bigint not null`
- `principal_minor bigint not null`
- `interest_minor bigint not null`
- `fees_minor bigint not null default 0`
- `closing_balance_minor bigint not null`
- `paid_amount_minor bigint not null default 0`
- `status text not null default 'pending'`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints:

- Unique `(credit_account_id, installment_number)`.
- Amounts non-negative.

Indices:

- `idx_installments_workspace_due_status (workspace_id, due_date, status)`
- `idx_installments_credit_number (credit_account_id, installment_number)`
- `idx_installments_credit_status (credit_account_id, status)`

Seguridad:

- RLS por workspace.
- Updates via payment service only.

Costos:

- Indice por vencimiento alimenta dashboard sin escanear todo.
- Para carteras grandes, paginar por fecha.

### 3.12 payments

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `credit_account_id uuid null references credit_accounts(id)`
- `credit_card_account_id uuid null references credit_card_accounts(id)`
- `installment_id uuid null references installments(id)`
- `amount_minor bigint not null`
- `currency char(3) not null`
- `paid_at timestamptz not null`
- `method text`
- `reference text`
- `notes text`
- `status text not null default 'recorded'`
- `voided_at timestamptz`
- `void_reason text`
- `created_by_user_id uuid not null references users(id)`
- `created_at timestamptz`

Constraints:

- Amount positive.
- Debe apuntar a `credit_account_id` o `credit_card_account_id`.

Indices:

- `idx_payments_workspace_paid_at (workspace_id, paid_at desc)`
- `idx_payments_credit_account (credit_account_id, paid_at desc)`
- `idx_payments_installment (installment_id)`
- `idx_payments_status (workspace_id, status)`

Seguridad:

- No update libre. Anular requiere permiso y auditoria.
- Referencias pueden contener PII; tratarlas con cuidado.

Costos:

- Reportes por rango usan `paid_at`.
- Evitar sumar pagos de toda la historia en cada dashboard; usar rollups cuando crezca.

### 3.13 extra_payments

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `credit_account_id uuid not null references credit_accounts(id)`
- `amount_minor bigint not null`
- `currency char(3) not null`
- `paid_at timestamptz`
- `strategy text not null`
- `mode text not null default 'simulated'`
- `result_snapshot_json jsonb`
- `status text not null default 'recorded'`
- `notes text`
- `created_by_user_id uuid not null references users(id)`
- `created_at timestamptz`

Indices:

- `idx_extra_payments_credit_account (credit_account_id, created_at desc)`
- `idx_extra_payments_workspace_mode (workspace_id, mode, created_at desc)`

Seguridad:

- Aplicacion real requiere transaccion, nuevo plan y auditoria.

Costos:

- Snapshots pueden crecer; guardar resumen y detalles necesarios.

### 3.14 fees

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `credit_account_id uuid null references credit_accounts(id)`
- `credit_card_account_id uuid null references credit_card_accounts(id)`
- `name text not null`
- `fee_type text not null`
- `amount_minor bigint`
- `percentage_rate numeric(18,10)`
- `frequency text not null`
- `starts_on date`
- `ends_on date`
- `is_active boolean not null default true`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_fees_credit_account_active (credit_account_id, is_active)`
- `idx_fees_credit_card_active (credit_card_account_id, is_active)`
- `idx_fees_workspace_active (workspace_id, is_active)`

Seguridad:

- Solo workspace.

Costos:

- Pocos registros; se pueden cargar por cuenta.

### 3.15 reminders

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `title text not null`
- `due_at timestamptz not null`
- `status text not null default 'pending'`
- `channel text not null default 'in_app'`
- `created_by_user_id uuid references users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_reminders_workspace_due_status (workspace_id, due_at, status)`
- `idx_reminders_entity (workspace_id, entity_type, entity_id)`

Seguridad:

- No canales externos sin consentimiento.

Costos:

- Jobs deben consultar por ventana y estado, no toda la tabla.

### 3.16 notifications

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `user_id uuid not null references users(id)`
- `reminder_id uuid null references reminders(id)`
- `type text not null`
- `title text not null`
- `body text`
- `status text not null default 'unread'`
- `created_at timestamptz`
- `read_at timestamptz`
- `archived_at timestamptz`

Indices:

- `idx_notifications_user_status_created (user_id, status, created_at desc)`
- `idx_notifications_workspace_created (workspace_id, created_at desc)`

Seguridad:

- Usuario solo lee sus notificaciones.
- Body sin PII excesiva.

Costos:

- Paginacion y limpieza/archivado por retencion.

### 3.17 audit_events

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `actor_user_id uuid references users(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `action text not null`
- `metadata_json jsonb`
- `ip_hash text`
- `user_agent_hash text`
- `created_at timestamptz not null default now()`

Indices:

- `idx_audit_workspace_created (workspace_id, created_at desc)`
- `idx_audit_entity (workspace_id, entity_type, entity_id, created_at desc)`
- `idx_audit_actor (workspace_id, actor_user_id, created_at desc)`

Seguridad:

- Append-only.
- Lectura limitada a owner/admin futuro.
- Metadata sin documentos completos, sin telefonos/direcciones si no es imprescindible.

Costos:

- Puede crecer mucho. Definir retencion/archivado futuro.
- No registrar cada render ni cada input.

### 3.18 attachments

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `storage_path text not null`
- `file_name text not null`
- `mime_type text not null`
- `size_bytes bigint not null`
- `uploaded_by_user_id uuid not null references users(id)`
- `created_at timestamptz`
- `deleted_at timestamptz`

Indices:

- `idx_attachments_entity (workspace_id, entity_type, entity_id)`
- `idx_attachments_workspace_created (workspace_id, created_at desc)`

Seguridad:

- Storage path privado por workspace.
- Firmar URLs temporalmente.
- Limitar tipos y tamano.

Costos:

- Storage con cuotas por plan futuro.
- Comprimir imagenes/recibos cuando aplique.

### 3.19 tags

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `name text not null`
- `color text`
- `created_at timestamptz`

Indices:

- `idx_tags_workspace_name unique (workspace_id, name)`

Tablas pivote futuras:

- `client_tags(client_id, tag_id, workspace_id)`
- `credit_account_tags(credit_account_id, tag_id, workspace_id)`
- `simulation_tags(simulation_id, tag_id, workspace_id)`

Seguridad:

- Solo workspace.

Costos:

- Bajo.

### 3.20 plans

Campos:

- `id uuid primary key`
- `code text unique not null`
- `name text not null`
- `limits_json jsonb not null`
- `features_json jsonb not null`
- `is_active boolean not null default true`
- `created_at timestamptz`

Seguridad:

- Solo lectura publica/autenticada segun producto.
- Escritura admin interna.

Costos:

- Bajo.

### 3.21 subscriptions

Campos:

- `id uuid primary key`
- `workspace_id uuid not null references workspaces(id)`
- `plan_id uuid not null references plans(id)`
- `status text not null`
- `current_period_start timestamptz`
- `current_period_end timestamptz`
- `provider text`
- `provider_customer_id text`
- `provider_subscription_id text`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_subscriptions_workspace_status (workspace_id, status)`
- `idx_subscriptions_provider unique (provider, provider_subscription_id)`

Seguridad:

- No exponer provider IDs al cliente salvo necesidad.

Costos:

- Webhooks futuros idempotentes.

### 3.22 feature_gates

Campos:

- `id uuid primary key`
- `workspace_id uuid null references workspaces(id)`
- `feature_key text not null`
- `enabled boolean not null default false`
- `limit_value integer`
- `source text not null`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices:

- `idx_feature_gates_workspace_feature unique (workspace_id, feature_key)`
- `idx_feature_gates_feature (feature_key)`

Seguridad:

- Escritura admin interna.

Costos:

- Cacheable por workspace.

## 4. Vistas y rollups futuros

### 4.1 account_current_status_view

Proposito:

- Resumen por credito/deuda: saldo, cuotas pendientes, vencidas, proxima cuota.

Uso:

- Dashboard y listados.

Cuidado:

- Empezar como query optimizada; materializar solo cuando el volumen lo justifique.

### 4.2 workspace_monthly_financial_rollups

Campos posibles:

- `workspace_id`
- `month`
- `payments_received_minor`
- `extra_payments_received_minor`
- `interest_collected_minor`
- `active_principal_minor`
- `overdue_installments_count`
- `active_clients_count`

Uso:

- Dashboard historico.

Cuidado:

- Actualizar por job o transaccion controlada, no por loops de cliente.

## 5. Politicas RLS sugeridas

Patron conceptual:

```sql
exists (
  select 1
  from workspace_members wm
  where wm.workspace_id = target.workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
)
```

Reglas:

- `select`: miembros activos.
- `insert`: miembros activos con rol permitido; `workspace_id` debe coincidir con membresia.
- `update`: miembros activos con permiso; tablas criticas restringidas a servicios.
- `delete`: evitar en tablas financieras; usar archivo/anulacion.

Advertencia:

- Si un repositorio usa service role o conexion privilegiada, RLS puede no proteger automaticamente. En ese caso, los guards de aplicacion son obligatorios y deben testearse.

## 6. Estrategia de costos de base de datos

Evitar:

- Listeners en todas las cuotas/pagos.
- Polling frecuente de dashboards.
- Consultas sin `workspace_id`.
- Reportes sin rango.
- Busquedas `ILIKE '%x%'` sin indice y paginacion.
- Recalcular todos los saldos en cada render.
- Guardar amortizaciones completas para cada cambio de slider.

Usar:

- Indices compuestos por `workspace_id` + filtros reales.
- Paginacion por cursor/fecha.
- Saldos actuales persistidos en cuenta.
- Rollups mensuales cuando haya volumen.
- Acciones explicitas para guardar simulaciones.
- Cache de TanStack Query con stale time razonable.
- Jobs para procesos pesados.

## 7. Datos calculados al vuelo vs persistidos

Calcular al vuelo:

- Resultado de simulacion no guardada.
- Comparacion temporal de abonos.
- Totales de una simulacion abierta.
- Etiquetas visuales simples.

Persistir:

- Simulacion guardada y snapshots necesarios.
- Plan de cuotas de deuda administrada.
- Saldo actual.
- Pagos/abonos aplicados.
- Estados de cuotas.
- Recordatorios.
- Auditoria.

Materializar futuro:

- Indicadores mensuales.
- Dashboard historico.
- Mora agregada.
- Intereses cobrados por periodo.

## 8. No hacer en Fase 1

- No crear migraciones reales sin autorizacion.
- No tocar `.env`.
- No usar datos reales.
- No crear credenciales.
- No implementar billing.
- No implementar WhatsApp.
- No implementar reportes pesados.
- No modelar CrediOS como entidad que otorga creditos.
