# Firestore Data Model

## Principios

- Todo dato privado vive bajo un workspace.
- El acceso se controla con membership.
- Los deletes fisicos quedan deshabilitados por reglas; se usa archivado.
- Pagos, abonos y movimientos financieros criticos deben escribirse mediante transacciones o Cloud Functions.
- Los campos monetarios se guardan en centavos como enteros.

## Colecciones

### `users/{uid}`

Perfil basico del usuario autenticado.

Campos:

- `email`
- `fullName`
- `avatarUrl`
- `defaultWorkspaceId`
- `createdAt`
- `updatedAt`

### `workspaces/{workspaceId}`

Workspace personal o de cartera.

Campos:

- `name`
- `ownerId`
- `defaultCurrency`
- `usageMode`
- `creditToolsEnabled`
- `createdAt`
- `updatedAt`
- `archivedAt`

### `workspaces/{workspaceId}/members/{uid}`

Membership por usuario.

Campos:

- `workspaceId`
- `userId`
- `role`
- `createdAt`

### `workspaces/{workspaceId}/clients/{clientId}`

Clientes de cartera.

Campos equivalentes a Supabase:

- `workspaceId`
- `fullName`
- `documentId`
- `phone`
- `email`
- `address`
- `notes`
- `status`
- `createdAt`
- `updatedAt`
- `archivedAt`

### `workspaces/{workspaceId}/simulations/{simulationId}`

Simulaciones guardadas.

Campos:

- `workspaceId`
- `ownerId`
- `name`
- `productType`
- `principalCents`
- `rateValue`
- `rateType`
- `termMonths`
- `startDate`
- `charges`
- `summary`
- `createdAt`
- `updatedAt`
- `archivedAt`

### `workspaces/{workspaceId}/creditAccounts/{creditId}`

Creditos/deudas administrados.

Campos:

- `workspaceId`
- `clientId`
- `ownerId`
- `sourceSimulationId`
- `name`
- `type`
- `purpose`
- `status`
- `principalCents`
- `currentBalanceCents`
- `rateValue`
- `rateType`
- `termMonths`
- `startDate`
- `charges`
- `summary`
- `notes`
- `affectsPersonalFinance`
- `countPaymentsAsIncome`
- `countInterestAsProfit`
- `createdAt`
- `updatedAt`
- `archivedAt`

Subcolecciones:

- `installments`
- `payments`
- `extraPayments`

### `workspaces/{workspaceId}/personalTransactions/{transactionId}`

Movimientos de Mis finanzas.

Campos:

- `workspaceId`
- `categoryId`
- `direction`: `income` o `expense`
- `movementKind`: `normal` o `fixed`
- `amountCents`
- `currency`
- `noteRaw`
- `noteNormalized`
- `occurredAt`
- `source`
- `priority`
- `linkedCreditAccountId`
- `duplicateHash`
- `createdBy`
- `createdAt`
- `updatedAt`
- `archivedAt`

### `workspaces/{workspaceId}/personalCategories/{categoryId}`

Categorias personales.

Campos:

- `workspaceId`
- `name`
- `type`
- `icon`
- `colorToken`
- `isDefault`
- `createdAt`
- `updatedAt`
- `archivedAt`

### `workspaces/{workspaceId}/personalBudgets/{budgetId}`

Presupuestos.

Campos:

- `workspaceId`
- `categoryId`
- `periodType`
- `amountCents`
- `rollover`
- `activeFrom`
- `activeTo`
- `createdAt`
- `updatedAt`

### `workspaces/{workspaceId}/recurringRules/{ruleId}`

Ingresos/gastos fijos confirmables.

Campos:

- `workspaceId`
- `categoryId`
- `direction`
- `amountCents`
- `currency`
- `noteTemplate`
- `frequency`
- `intervalCount`
- `startsAt`
- `endsAt`
- `nextRunAt`
- `priority`
- `active`
- `createdAt`
- `updatedAt`

### `workspaces/{workspaceId}/personalDebts/{debtId}`

Saldos manuales.

Campos:

- `workspaceId`
- `name`
- `initialBalanceCents`
- `currentBalanceCents`
- `currency`
- `openedAt`
- `notes`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`
- `archivedAt`

Subcoleccion:

- `movements`

### `workspaces/{workspaceId}/auditEvents/{eventId}`

Auditoria.

Campos:

- `workspaceId`
- `actorId`
- `entityType`
- `entityId`
- `action`
- `metadata`
- `createdAt`

## Transacciones criticas

Deben ir en Cloud Functions o transacciones Firestore:

- registrar pago de cuota;
- pago total;
- abono a capital;
- retanqueo/aumento de credito;
- confirmar ingreso/gasto fijo;
- convertir simulacion a credito.

## Indices iniciales

Se prepararon en `firestore.indexes.json` para:

- movimientos por fecha;
- creditos por estado/fecha;
- cuotas por estado/vencimiento;
- recurrentes por proxima fecha.
