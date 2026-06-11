# Manual Balances Guide

## Nombre UI

La funcion se muestra como `Saldos manuales` dentro de `Mis finanzas`.

## Casos de uso

- Deuda informal sin cuotas.
- Tarjeta o saldo flexible que sube y baja.
- Gasto acumulado.
- Prestamo personal registrado manualmente.
- Control de presupuesto o compromiso flexible.

## Comportamiento

- No exige tasa.
- No exige cuotas.
- No genera plan de pago.
- Permite saldo inicial.
- Permite aumentar o disminuir saldo.
- Muestra historial de movimientos recientes.

## Seguridad

Las tablas usan `workspace_id` y RLS por membership. No se borra historial al mover saldo.
