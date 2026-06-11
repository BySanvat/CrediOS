# CrediOS by Sanvat - Domain Model v1

Estado: Fase 0  
Objetivo: definir entidades, responsabilidades y relaciones sin crear migraciones reales.

## 1. Principios del dominio

CrediOS modela simulaciones, deudas administradas, tarjetas, clientes, pagos, abonos, recordatorios y cartera. No modela aprobacion, originacion ni desembolso de creditos.

Reglas transversales:

- Toda entidad financiera pertenece a un `Workspace`.
- Todo acceso debe pasar por usuario autenticado y membresia de workspace.
- Las simulaciones no alteran saldos reales.
- Los pagos y abonos aplicados si alteran saldos administrados y deben dejar auditoria.
- La eliminacion real de historial financiero no debe estar en MVP.
- Los documentos sensibles futuros deben tratarse como adjuntos privados.

## 2. Conceptos clave

### Simulacion

Una simulacion es un escenario guardado que puede o no convertirse en deuda administrada. Puede contener multiples escenarios comparables, por ejemplo plazo diferente, tasa diferente o abono extraordinario.

No debe generar cobros, vencimientos reales ni historial financiero aplicado hasta que el usuario la convierta explicitamente.

### Credito/deuda administrada

Un credito o deuda administrada es un registro activo al que se le pueden registrar pagos, abonos, vencimientos, mora, fees e historial.

Debe tener saldo, estado, plan de cuotas y trazabilidad.

### Cliente

Un cliente es una persona asociada a cartera administrada por el usuario/workspace. Es util para prestamistas o pequenas financieras.

No debe ser obligatorio para uso personal.

### Perfil personal

Un perfil personal permite que el usuario gestione sus propias deudas sin crear un cliente externo. El perfil personal pertenece al workspace y representa al propio usuario como sujeto financiero.

## 3. Entidades iniciales

### 3.1 User

Proposito:

- Representa identidad autenticada.
- Puede pertenecer a uno o varios workspaces.

Campos principales:

- `id`
- `email`
- `display_name`
- `avatar_url`
- `created_at`
- `last_sign_in_at`

Relaciones:

- Tiene muchos `WorkspaceMember`.
- Puede crear `AuditEvent`.

MVP:

- Si.

Futuro:

- MFA, dispositivos, preferencias personales, integracion Sanvat.

Riesgos:

- Confundir `User` con `Client`. Un usuario es quien usa la app; un cliente es una persona de cartera.

### 3.2 Workspace

Proposito:

- Contenedor de datos, permisos y configuracion.
- Permite evolucionar de uso personal a equipos.

Campos principales:

- `id`
- `name`
- `slug`
- `type`: `personal`, `lender`, `team`
- `default_currency`
- `timezone`
- `created_by_user_id`
- `created_at`
- `archived_at`

Relaciones:

- Tiene muchos `WorkspaceMember`.
- Tiene clientes, simulaciones, deudas, tarjetas, recordatorios y auditoria.

MVP:

- Si. Crear workspace personal por defecto.

Futuro:

- Multiples workspaces, equipos, facturacion.

Riesgos:

- Si se omite ahora, multiusuario futuro obliga a rehacer todo.

### 3.3 WorkspaceMember

Proposito:

- Une usuarios con workspaces.
- Prepara roles futuros.

Campos principales:

- `id`
- `workspace_id`
- `user_id`
- `role`: `owner`, `admin`, `collector`, `viewer`, `accountant`
- `status`: `active`, `invited`, `removed`
- `created_at`

Relaciones:

- Pertenece a `Workspace`.
- Pertenece a `User`.

MVP:

- Si, aunque solo exista `owner`.

Futuro:

- Invitaciones, permisos granulares, equipos.

Riesgos:

- Acceso cruzado si no se indexa y valida correctamente.

### 3.4 Client

Proposito:

- Representa una persona asociada a cartera.
- Agrupa creditos/deudas administradas para prestamistas.

Campos principales:

- `id`
- `workspace_id`
- `type`: `person`, `business`
- `full_name`
- `document_type`
- `document_number`
- `phone`
- `email`
- `address`
- `notes`
- `status`: `active`, `inactive`, `archived`
- `created_at`

Relaciones:

- Pertenece a `Workspace`.
- Puede tener muchos `CreditAccount`.
- Puede tener `Reminder`, `Attachment`, `Tag`.

MVP:

- Si, basico.

Futuro:

- Contactos adicionales, referencias, consentimiento de notificaciones, historial de comunicaciones.

Riesgos:

- Datos sensibles. Requiere minimizacion, RLS y logs sin PII.

### 3.5 PersonalProfile

Proposito:

- Representa al usuario/workspace para deudas propias.

Campos principales:

- `id`
- `workspace_id`
- `display_name`
- `default_currency`
- `notes`
- `created_at`

Relaciones:

- Pertenece a `Workspace`.
- Puede asociarse a deudas personales.

MVP:

- Si.

Futuro:

- Presupuesto, ingresos, metas de pago, score interno no crediticio.

Riesgos:

- No convertir en scoring de aprobacion real.

### 3.6 FinancialProduct

Proposito:

- Catalogo interno de tipos de producto financiero simulable o administrable.

Campos principales:

- `id`
- `workspace_id` nullable para catalogo global futuro
- `name`
- `kind`: `fixed_installment_credit`, `credit_card`, `informal_loan`, `other_debt`
- `description`
- `is_active`

Relaciones:

- Puede asociarse a `Simulation`, `CreditAccount`, `CreditCardAccount`.

MVP:

- Parcial. Puede empezar como enum en codigo.

Futuro:

- Productos personalizados por workspace.

Riesgos:

- No modelar productos como ofertas de CrediOS.

### 3.7 Simulation

Proposito:

- Contenedor de una simulacion guardada.

Campos principales:

- `id`
- `workspace_id`
- `owner_user_id`
- `name`
- `product_kind`
- `currency`
- `principal_amount_minor`
- `status`: `draft`, `saved`, `converted`, `archived`
- `source`: `manual`
- `notes`
- `created_at`
- `updated_at`

Relaciones:

- Tiene muchos `SimulationScenario`.
- Puede convertirse en `CreditAccount`.
- Puede tener tags.

MVP:

- Si.

Futuro:

- Versionado de simulaciones, plantillas, colaboracion.

Riesgos:

- No guardar cada cambio de input; guardar por accion explicita.

### 3.8 SimulationScenario

Proposito:

- Escenario calculado dentro de una simulacion.
- Permite comparar cuota, plazo, tasa, abonos y costos.

Campos principales:

- `id`
- `simulation_id`
- `name`
- `input_json`
- `result_json`
- `rounding_policy`
- `is_primary`
- `created_at`

Relaciones:

- Pertenece a `Simulation`.

MVP:

- Si.

Futuro:

- Diferenciales visuales, comparacion avanzada.

Riesgos:

- `result_json` debe ser snapshot reproducible, no unica fuente para deudas activas.

### 3.9 CreditAccount

Proposito:

- Deuda/credito administrado manualmente.
- Tiene plan de cuotas, saldo y eventos.

Campos principales:

- `id`
- `workspace_id`
- `client_id` nullable
- `personal_profile_id` nullable
- `source_simulation_id` nullable
- `name`
- `lender_name`
- `borrower_label`
- `currency`
- `principal_amount_minor`
- `current_balance_minor`
- `annual_rate`
- `periodic_rate`
- `rate_type`: `effective_annual`, `nominal_annual`, `monthly_effective`
- `term_count`
- `payment_frequency`
- `start_date`
- `first_payment_date`
- `status`: `active`, `paid_off`, `overdue`, `paused`, `archived`
- `created_at`

Relaciones:

- Pertenece a `Workspace`.
- Pertenece a `Client` o `PersonalProfile`.
- Tiene muchas `Installment`, `Payment`, `ExtraPayment`, `Fee`, `Reminder`, `Attachment`, `AuditEvent`.

MVP:

- Si.

Futuro:

- Reestructuraciones, refinanciacion registrada como evento, co-deudores.

Riesgos:

- Debe permitir deuda personal y cartera sin mezclar semantica.
- Cambios al saldo requieren transaccion y auditoria.

### 3.10 CreditCardAccount

Proposito:

- Representa una tarjeta de credito administrada o simulada.

Campos principales:

- `id`
- `workspace_id`
- `client_id` nullable
- `personal_profile_id` nullable
- `issuer_name`
- `card_label`
- `currency`
- `credit_limit_minor`
- `current_balance_minor`
- `annual_rate`
- `monthly_rate`
- `statement_day`
- `payment_due_day`
- `minimum_payment_policy_json`
- `status`

Relaciones:

- Pertenece a `Workspace`.
- Puede pertenecer a `Client` o `PersonalProfile`.
- Tiene compras futuras, pagos, fees, recordatorios.

MVP:

- Parcial. Especificar y posiblemente dejar pantalla placeholder.

Futuro:

- Compras a cuotas, extractos, cortes, intereses por pago minimo.

Riesgos:

- Tarjetas no son creditos de cuota fija. No forzar el mismo modelo.

### 3.11 Installment

Proposito:

- Cuota programada de una deuda administrada.

Campos principales:

- `id`
- `workspace_id`
- `credit_account_id`
- `installment_number`
- `due_date`
- `opening_balance_minor`
- `scheduled_payment_minor`
- `principal_minor`
- `interest_minor`
- `fees_minor`
- `closing_balance_minor`
- `paid_amount_minor`
- `status`: `pending`, `partial`, `paid`, `overdue`, `adjusted`
- `created_at`

Relaciones:

- Pertenece a `CreditAccount`.
- Puede tener pagos aplicados.

MVP:

- Si.

Futuro:

- Recalculo por reestructuraciones, mora, condonaciones auditadas.

Riesgos:

- La ultima cuota debe ajustar saldo a cero.
- Pagos parciales requieren estado consistente.

### 3.12 Payment

Proposito:

- Pago ordinario registrado sobre una deuda o tarjeta.

Campos principales:

- `id`
- `workspace_id`
- `credit_account_id` nullable
- `credit_card_account_id` nullable
- `installment_id` nullable
- `amount_minor`
- `currency`
- `paid_at`
- `method`
- `reference`
- `notes`
- `status`: `recorded`, `voided`
- `created_by_user_id`
- `created_at`

Relaciones:

- Pertenece a cuenta financiera.
- Genera `AuditEvent`.

MVP:

- Si.

Futuro:

- Adjuntos, recibos, conciliacion, anulacion con razon.

Riesgos:

- No sobrescribir pagos. Para correccion, anular y crear evento.

### 3.13 ExtraPayment

Proposito:

- Abono extraordinario que puede reducir plazo, reducir cuota o solo simularse.

Campos principales:

- `id`
- `workspace_id`
- `credit_account_id`
- `amount_minor`
- `currency`
- `paid_at`
- `strategy`: `reduce_term`, `reduce_payment`, `no_recalculation`
- `mode`: `simulated`, `applied`
- `result_snapshot_json`
- `notes`
- `created_by_user_id`
- `created_at`

Relaciones:

- Pertenece a `CreditAccount`.
- Puede generar nuevo plan de cuotas si se aplica.

MVP:

- Si para simulacion y aplicacion basica.

Futuro:

- Reversion auditada, multiples abonos, reglas personalizadas.

Riesgos:

- Aplicar un abono no debe confundirse con simularlo.

### 3.14 Fee

Proposito:

- Cargo adicional: seguro, cuota de manejo, estudio, mora futura, cargo fijo o porcentual.

Campos principales:

- `id`
- `workspace_id`
- `credit_account_id` nullable
- `credit_card_account_id` nullable
- `name`
- `fee_type`: `fixed`, `percentage`
- `amount_minor` nullable
- `percentage_rate` nullable
- `frequency`: `one_time`, `monthly`, `per_installment`
- `starts_on`
- `ends_on`
- `is_active`

Relaciones:

- Pertenece a cuenta financiera.

MVP:

- Parcial para simulacion de creditos.

Futuro:

- Mora, cargos condonados, impuestos.

Riesgos:

- Costos mal modelados cambian el costo total.

### 3.15 Reminder

Proposito:

- Recordatorio programado sobre cuota, pago, cliente o tarea.

Campos principales:

- `id`
- `workspace_id`
- `entity_type`
- `entity_id`
- `title`
- `due_at`
- `status`: `pending`, `done`, `dismissed`, `cancelled`
- `channel`: `in_app`, `email`, `push`, `whatsapp_future`
- `created_by_user_id`
- `created_at`

Relaciones:

- Puede generar `Notification`.

MVP:

- Si, solo `in_app`.

Futuro:

- Canales externos con consentimiento.

Riesgos:

- No enviar mensajes externos sin base legal/consentimiento.

### 3.16 Notification

Proposito:

- Mensaje mostrado o enviado al usuario.

Campos principales:

- `id`
- `workspace_id`
- `user_id`
- `reminder_id` nullable
- `type`
- `title`
- `body`
- `status`: `unread`, `read`, `archived`
- `created_at`
- `read_at`

Relaciones:

- Pertenece a `User` y `Workspace`.

MVP:

- Si para bandeja in-app simple.

Futuro:

- Entregas por canal, reintentos, preferencias.

Riesgos:

- Evitar PII innecesaria en body.

### 3.17 AuditEvent

Proposito:

- Registro append-only de cambios criticos.

Campos principales:

- `id`
- `workspace_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `metadata_json`
- `ip_hash`
- `user_agent_hash`
- `created_at`

Relaciones:

- Apunta logicamente a entidades financieras.

MVP:

- Si, para pagos, abonos, creacion/conversion y cambios de saldo.

Futuro:

- Exportacion, retencion, diff estructurado.

Riesgos:

- No registrar datos sensibles completos en metadata.

### 3.18 Attachment

Proposito:

- Archivo privado futuro: recibo, documento, soporte.

Campos principales:

- `id`
- `workspace_id`
- `entity_type`
- `entity_id`
- `storage_path`
- `file_name`
- `mime_type`
- `size_bytes`
- `uploaded_by_user_id`
- `created_at`
- `deleted_at`

Relaciones:

- Pertenece a workspace y entidad.

MVP:

- No.

Futuro:

- Si.

Riesgos:

- Costos de storage y datos sensibles.

### 3.19 Tag

Proposito:

- Etiquetas para organizar clientes, deudas y simulaciones.

Campos principales:

- `id`
- `workspace_id`
- `name`
- `color`
- `created_at`

Relaciones:

- Muchas-a-muchas via tablas pivote futuras.

MVP:

- Opcional.

Futuro:

- Segmentacion de cartera.

Riesgos:

- Evitar tags que expongan datos sensibles en logs/analytics.

### 3.20 Plan

Proposito:

- Define plan comercial futuro.

Campos principales:

- `id`
- `code`
- `name`
- `limits_json`
- `features_json`
- `is_active`

Relaciones:

- Tiene muchas `Subscription`.

MVP:

- No implementar billing, solo preparar concepto.

Futuro:

- Si.

Riesgos:

- Feature gating no debe eliminar historial.

### 3.21 Subscription

Proposito:

- Estado de suscripcion de un workspace.

Campos principales:

- `id`
- `workspace_id`
- `plan_id`
- `status`
- `current_period_start`
- `current_period_end`
- `provider`
- `provider_customer_id`
- `provider_subscription_id`

Relaciones:

- Pertenece a `Workspace` y `Plan`.

MVP:

- No.

Futuro:

- Si.

Riesgos:

- Webhooks idempotentes y sin borrar datos al fallar pago.

### 3.22 FeatureGate

Proposito:

- Controla acceso a funciones por plan, workspace o rollout.

Campos principales:

- `id`
- `workspace_id` nullable
- `feature_key`
- `enabled`
- `limit_value`
- `source`: `plan`, `override`, `trial`
- `created_at`

Relaciones:

- Puede depender de `Plan` o `Subscription`.

MVP:

- No necesario como tabla, pero si como abstraccion futura.

Futuro:

- Si.

Riesgos:

- Bloquear acceso no debe corromper datos existentes.

## 4. Relaciones principales

```txt
User 1--N WorkspaceMember N--1 Workspace
Workspace 1--N Client
Workspace 1--1 PersonalProfile
Workspace 1--N Simulation 1--N SimulationScenario
Simulation 0--1 CreditAccount
Workspace 1--N CreditAccount
Client 0--N CreditAccount
PersonalProfile 0--N CreditAccount
CreditAccount 1--N Installment
CreditAccount 1--N Payment
CreditAccount 1--N ExtraPayment
CreditAccount 1--N Fee
Workspace 1--N CreditCardAccount
CreditCardAccount 1--N Payment
Workspace 1--N Reminder 1--N Notification
Workspace 1--N AuditEvent
Workspace 1--N Attachment
Workspace 1--N Tag
Workspace 1--N Subscription N--1 Plan
```

## 5. MVP vs futuro

MVP obligatorio:

- User.
- Workspace.
- WorkspaceMember.
- PersonalProfile.
- Client.
- Simulation.
- SimulationScenario.
- CreditAccount.
- Installment.
- Payment.
- ExtraPayment.
- Fee basico.
- Reminder.
- Notification in-app.
- AuditEvent.

Futuro preparado:

- CreditCardAccount avanzado.
- Attachment.
- Tag avanzado.
- Plan.
- Subscription.
- FeatureGate.
- Roles completos.
- Integracion Sanvat.

## 6. Riesgos de diseno

- No separar simulacion de deuda administrada.
- No tener workspace desde el inicio.
- Guardar saldos sin eventos que expliquen cambios.
- Tratar pagos como editables en vez de anulables.
- Forzar tarjetas al modelo de cuotas.
- No preservar snapshots de simulaciones guardadas.
- Usar `client_id` obligatorio y romper uso personal.
- Guardar PII en auditoria o notificaciones.
- Construir billing antes de validar producto.
