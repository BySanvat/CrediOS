# Known Limitations - CrediOS MVP

## Supabase

- La app requiere configurar variables reales para probar auth y persistencia.
- La migracion SQL debe aplicarse en Supabase antes de usar la app.
- RLS esta definido, pero debe probarse con usuarios reales separados antes de beta.
- No se uso `service_role`.

## Transacciones

- Las acciones complejas de pagos/abonos usan llamadas secuenciales con Supabase client.
- Antes de beta financiera, conviene mover operaciones criticas a funciones SQL transaccionales o RPC controladas.

## Abonos

- Al aplicar abonos, las cuotas pendientes se cancelan y se genera un nuevo plan futuro.
- El historial de pagos y abonos se conserva.
- La estrategia es suficiente para MVP, pero requiere pruebas contables adicionales para carteras grandes.

## Pagos

- La distribucion de pagos parciales es basica.
- No hay anulacion/reversion de pagos en UI.
- No hay mora avanzada ni intereses de mora.

## Tarjetas

- Existe tabla `credit_cards` P1, pero no hay modulo UI completo de tarjetas.
- Las tarjetas deben implementarse como dominio separado, no como credito de cuota fija.

## Reportes

- Dashboard inicial usa consultas directas.
- Para volumen alto se deben agregar rollups mensuales o vistas materializadas.

## Exportaciones

- No hay CSV, Excel ni PDF.
- Exportaciones futuras deben tener limites por rango y auditoria.

## Notificaciones

- Solo recordatorios internos.
- No email, push ni WhatsApp.
- Cualquier canal externo futuro requiere consentimiento y controles antiabuso.

## Seguridad pendiente

- Tests automatizados de RLS.
- Playwright e2e para auth y flujos principales.
- Auditoria mas granular para ediciones/archivados.
- Rate limiting en acciones sensibles.

## Costos

- Evitar listeners realtime hasta que exista una necesidad clara.
- Evitar guardar simulaciones por cada cambio de input.
- Paginar listados cuando el volumen crezca.
