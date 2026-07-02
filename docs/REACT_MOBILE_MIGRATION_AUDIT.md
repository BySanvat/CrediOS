# React Mobile Migration Audit

## Resultado ejecutivo

CrediOS ya usa React 19. La migracion pendiente no es "a React" como framework de UI, sino desde una app Next.js full-stack hacia una arquitectura React/mobile con una capa de datos compatible con APK.

La conclusion profesional es no hacer un corte directo. La app actual usa Next.js App Router, server actions, cookies, redirects, revalidacion y Supabase SSR en flujos financieros criticos. Migrarlo todo a SPA o React Native en una sola fase duplicaria logica de pagos, simulaciones, RLS y auth, con alto riesgo de regresiones.

Esta fase prepara un APK instalable con Capacitor cargando la app real publicada en Cloudflare. Es la ruta segura para tener experiencia movil nativa sin partir el producto en dos bases de codigo.

## Auditoria tecnica

Hallazgos principales:

- React ya esta presente como base de UI: `react@19.2.4` y `react-dom@19.2.4`.
- Next.js sigue siendo el runtime de producto: `next@16.2.9`.
- Hay 8 modulos con server actions:
  - `src/server/actions/auth.actions.ts`
  - `src/server/actions/clients.actions.ts`
  - `src/server/actions/credits.actions.ts`
  - `src/server/actions/payments.actions.ts`
  - `src/server/actions/personal-finance.actions.ts`
  - `src/server/actions/reminders.actions.ts`
  - `src/server/actions/settings.actions.ts`
  - `src/server/actions/simulations.actions.ts`
- Hay mas de 100 referencias a contexto server/cookies/redirects/revalidacion.
- Las rutas privadas dependen de `getAppContext`, cookies y Supabase SSR.
- El producto ya tiene PWA manifest, pero no service worker por seguridad de datos financieros.

## Bloqueadores para React SPA puro

Una SPA React/Vite no puede usar directamente:

- server actions de Next;
- `next/headers`, `cookies()` y middleware SSR de Supabase;
- `redirect()`/`revalidatePath()` como control de flujo;
- inserts financieros transaccionales escondidos detras de server actions;
- rutas dinamicas de Next sin una capa API equivalente.

Antes de un cambio a React puro hay que extraer una API estable.

## Ruta recomendada

### Fase 1 completada: APK con Capacitor

Objetivo: entregar app instalable sin duplicar logica financiera.

Decision:

- Capacitor carga `https://credios.pages.dev`.
- El APK no contiene secrets.
- Supabase, RLS, RPCs y server actions siguen viviendo en la app Cloudflare.
- Los updates web se siguen desplegando en Cloudflare sin reconstruir APK mientras no cambie configuracion nativa.

### Fase 2: separar dominio compartido

Extraer y estabilizar:

- calculos financieros puros;
- formateadores;
- validadores Zod;
- tipos de dominio;
- parser de categorias y movimientos;
- helpers de calendario/fechas.

Estos modulos ya pueden compartirse entre Next, Capacitor y una futura app React SPA.

### Fase 3: crear API explicita

Reemplazar progresivamente server actions por endpoints/API o RPCs invocables desde cliente:

- `auth` y sesion;
- simulaciones;
- personal finance;
- creditos;
- pagos/abonos;
- recordatorios;
- configuracion.

Cada endpoint debe respetar RLS y no usar `service_role`.

### Fase 4: React mobile shell real

Crear un shell Vite/React o React Native/Expo cuando la API este lista.

Condicion de entrada:

- login estable sin SSR obligatorio;
- pagos y abonos transaccionales por RPC/API;
- workspace/context resoluble desde token de usuario;
- tests de RLS y flujos financieros.

### Fase 5: offline controlado

Solo despues de estabilizar la API:

- cachear catalogos no sensibles;
- nunca cachear datos privados financieros en service worker sin cifrado/estrategia clara;
- invalidar datos por workspace y usuario.

## Decision de producto

Para CrediOS, el mejor primer APK es un contenedor nativo de la app web real. Esto mantiene la misma fluidez funcional que la version Cloudflare y evita que el usuario vea diferencias entre web y APK.

La migracion React pura queda documentada como una ruta por fases, no como una reescritura a ciegas.
