# Post Deploy UX Round 3 Fixes

## Objetivo

Corregir observaciones reales posteriores al deploy sin cambiar arquitectura, RLS ni RPCs.

## Cambios aplicados

- Google Auth queda protegido por `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`.
- Paleta de acento reducida a colores pastel mas sutiles.
- Default visual nuevo: verde manzana pastel.
- Dark mode rehecho con grises frios y superficies diferenciadas.
- Menu movil con fondo solido, scroll interno y estado activo.
- Calendario propio compacto: label, fecha secundaria y boton solo con icono.
- Dropdowns con wrapper premium y sin caracter corrupto.
- Simulador con cuota mas protagonista y composicion visual de cuota.
- UI visible usa `Mis finanzas`.
- Saldos manuales muestran historial.
- Creditos se muestran como cards en movil.
- Pago inteligente elimina boton redundante de cuota y conserva valor editable.
- URLs de creditos usan slug limpio sin ID visible en enlaces nuevos.

## No se cambio

- No se tocaron secrets.
- No se cambio RLS.
- No se cambio la logica transaccional de RPCs.
- No se agregaron modulos grandes.
- No se implementaron pagos reales.
