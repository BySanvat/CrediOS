# Manual Debts and Restocking

## Registros manuales simples

Mis finanzas incluye registros manuales simples para casos donde no hay tasa, cuota ni plan formal:

- deuda informal;
- saldo flexible;
- tarjeta o acumulado personal;
- gasto acumulado;
- saldo que aumenta/disminuye manualmente.

Tablas:

- `personal_debts`;
- `personal_debt_movements`.

Reglas:

- Siempre tienen `workspace_id`.
- RLS por `is_workspace_member(workspace_id)`.
- No requieren tasa ni plazo.
- El historial se conserva en movimientos.

## Retanqueo administrativo

CrediOS usa el termino funcional `Aumentar saldo registrado` en UI. Internamente puede describirse como retanqueo administrativo.

No significa que CrediOS ofrezca, apruebe o entregue dinero. Es solo un ajuste manual del usuario sobre un credito/deuda existente.

RPC:

```sql
increase_credit_balance_with_schedule(...)
```

La RPC:

- valida autenticacion;
- valida membership del workspace;
- bloquea el credito;
- verifica saldo esperado;
- cancela cuotas pendientes/parciales;
- inserta nuevo plan;
- actualiza saldo/capital;
- registra `audit_event`.

## Migracion

Archivo:

```txt
src/lib/db/migrations/0006_ux_round_3_manual_debts_and_restock.sql
```

Estado: aplicada y verificada en Supabase real el 2026-06-11.
