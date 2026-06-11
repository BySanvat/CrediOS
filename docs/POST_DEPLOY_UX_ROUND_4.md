# Post Deploy UX Round 4

## Objetivo

Corregir fricciones reales de produccion sin cambiar RLS, RPCs base ni arquitectura general.

## Cambios

- El header ya no muestra `Salir`; ahora muestra una tuerquita hacia Configuracion.
- El cierre de sesion vive dentro de Configuracion.
- Google Auth usa doble compuerta:
  - `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`
  - `NEXT_PUBLIC_GOOGLE_AUTH_PROVIDER_READY=true`
- Si Google no esta listo, el usuario ve mensaje claro y conserva correo/contrasena.
- Colores de acento light son mas pastel; default `apple-green`.
- Menu movil usa fondo negro translucido, blur controlado, scroll interno y contraste alto.
- Barra inferior movil estilo Sanvat con accesos reordenables por navegador.
- Quick Add de Mis finanzas usa botones compactos `Egreso` / `Ingreso`.
- Tipo de movimiento separa `Normal` / `Fijo`; fijo crea regla mensual confirmable.
- PWA queda preparada con manifest e iconos SVG.
- Pago inteligente devuelve errores al modal, no a una pagina rota.
- Detalle de credito tiene acciones redondas `+` y `-` arriba.
- Plan de pagos queda plegable para evitar vista infinita.
- Tablas de amortizacion usan padding, numeros tabulares y filas alternas suaves.

## No se cambio

- No se tocaron secrets.
- No se uso `service_role`.
- No se cambio RLS.
- No se hicieron migraciones destructivas.
- No se cachean datos privados con service worker.
