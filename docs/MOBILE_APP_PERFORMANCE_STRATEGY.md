# Mobile App Performance Strategy

## Objetivo

Que CrediOS se sienta como app: fluida, rapida y sin pantallas congeladas.

## Estado actual

La app ya tiene mejoras importantes:

- rutas privadas con skeletons;
- barra inferior movil;
- drawer movil;
- resultado del simulador calculado en cliente;
- historiales largos ocultos detras de modales/secciones;
- PWA manifest.

## Riesgo principal

La latencia percibida no viene de React como tecnologia, sino de:

- rutas dinamicas server-rendered;
- consultas Supabase por pagina;
- server actions que esperan red;
- Cloudflare cold starts;
- cargas largas en detalle de creditos;
- ausencia de cache controlada para datos no sensibles.

## Mejoras recomendadas por fases

### Corto plazo

- Mantener `/finanzas` como inicio privado.
- Prefetch de rutas frecuentes desde drawer/bottom nav.
- Reducir consultas secuenciales con `Promise.all`.
- Evitar cargar planes de pago completos en listados.
- Mantener pagos, abonos e historiales detras de modales o secciones plegables.
- Mejorar estados optimistas solo donde no haya riesgo financiero.

### Medio plazo

- Crear capa de repositorios cliente/API para extraer server actions.
- Cachear catalogos no sensibles por workspace:
  - categorias base;
  - preferencias visuales;
  - configuracion local;
  - accesos rapidos.
- Medir Web Vitals reales en Cloudflare.
- Identificar bundles pesados por ruta.

### Largo plazo

- React/Vite mobile shell solo cuando las acciones criticas tengan API explicita.
- Offline parcial para catalogos, nunca para saldos/pagos sin estrategia de reconciliacion.
- Sincronizacion segura con versionado y auditoria si algun dia hay writes offline.

## Reglas de seguridad

- No cachear respuestas de Supabase con datos financieros en service worker.
- No guardar secretos en APK.
- No usar `service_role`.
- No duplicar calculos financieros criticos sin tests.
- No permitir pagos offline.
