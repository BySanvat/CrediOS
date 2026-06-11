# CrediOS Mobile First QA Checklist

Fecha: 2026-06-11

## Rutas a revisar

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/finanzas`
- `/finanzas/movimientos`
- `/finanzas/presupuestos`
- `/finanzas/recurrentes`
- `/finanzas/reportes`
- `/simulador`
- `/simulaciones`
- `/clientes`
- `/creditos`
- `/creditos/[id]`
- `/recordatorios`
- `/configuracion`

## Checklist visual movil

- No hay scroll horizontal global.
- El header no se desborda.
- El drawer lateral abre desde el boton de menu.
- El drawer muestra todas las paginas principales.
- El drawer cierra al seleccionar una ruta.
- El drawer cierra con Escape en escritorio/tablet.
- Sidebar desktop no aparece en movil.
- Tablas anchas tienen scroll interno, no rompen el body.
- Cards usan ancho completo y padding compacto.
- Botones principales son faciles de tocar.
- Formularios usan inputs full width.
- Textos largos hacen wrap y no pisan botones.
- Numeros financieros usan `tabular-nums`.
- Scrollbars son delgadas y no invasivas.

## Checklist funcional movil

- Login muestra `Ingresando...` y spinner.
- Signup muestra `Creando cuenta...` y spinner.
- Doble click en auth no envia dos veces.
- Onboarding aparece si no hay preferencia.
- Preferencia personal abre dashboard con enfoque personal.
- Preferencia cartera abre dashboard con enfoque cartera.
- Configuracion cambia preferencia y refresca dashboard.
- Simulador acepta `1.000.000`.
- Simulador muestra `%` en tasa.
- Crear deuda acepta `1.000.000`.
- Registrar pago acepta `250.000`.
- Aplicar abono acepta `500.000`.
- Movimiento manual acepta `28.000`.
- Presupuesto acepta `1.200.000`.
- Recurrente acepta `38.900`.
- Export CSV sigue disponible.

## Notas Cloudflare

- No se reintrodujo `lucide-react`.
- La iconografia es local para cuidar el limite de bundle de Pages Functions.
- El build de Cloudflare debe mantener `nodejs_compat`.
