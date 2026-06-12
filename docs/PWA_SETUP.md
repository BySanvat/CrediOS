# PWA Setup

## Estado

CrediOS incluye `public/manifest.webmanifest` e iconos SVG locales:

- `/icons/credios-icon.svg`
- `/icons/credios-maskable.svg`

El manifest usa:

- `display: standalone`
- `start_url: /finanzas`
- `theme_color: #79B985`
- `background_color: #FCFBF7`

## Service worker

No se agrego service worker en esta fase.

Motivo: CrediOS maneja datos financieros sensibles. Cachear paginas privadas, respuestas de Supabase o datos de usuario en el navegador podria crear riesgo de privacidad. Una fase futura puede agregar service worker solo para assets estaticos, excluyendo rutas privadas y cualquier llamada a Supabase.

## QA

1. Abrir `https://credios.pages.dev`.
2. Iniciar sesion.
3. En Chrome/Edge movil o desktop, revisar opcion de instalar app.
4. Verificar que la app abre en modo standalone.
5. Confirmar que login y datos privados siguen viniendo de red/Supabase, no de cache.
