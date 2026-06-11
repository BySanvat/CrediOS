# Performance Audit

## Observacion

El usuario percibia esperas al navegar entre paginas dinamicas. La app depende de Supabase y rutas privadas, asi que algunas pantallas no pueden ser completamente estaticas.

## Cambios aplicados

- Se agrego `src/app/(app)/loading.tsx` con skeletons premium para rutas privadas.
- El detalle de credito deja el plan de pagos dentro de una seccion plegable.
- El listado de creditos sigue cargando solo datos de credito/cliente, no fuerza interaccion con historial completo.
- La barra inferior y drawer son client-side livianos y usan preferencias locales.

## Pendientes recomendados

- Medir en produccion con Cloudflare Analytics o Web Vitals.
- Revisar queries del dashboard si el volumen crece.
- Cargar graficas con lazy loading si aparecen rutas con mucho JS.
- No cachear datos financieros privados en service worker.
