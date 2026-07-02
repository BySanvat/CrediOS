# Firebase Migration Plan

## Decision ejecutiva

CrediOS puede migrarse a Firebase, pero no debe hacerse como un cambio de hosting solamente.

La app actual funciona sobre:

- Next.js App Router;
- Supabase Auth/SSR;
- PostgreSQL;
- RLS;
- RPCs transaccionales para pagos y abonos;
- server actions.

Firebase requiere otra arquitectura:

- Firebase App Hosting o Firebase Hosting;
- Firebase Authentication;
- Cloud Firestore;
- Firestore Security Rules;
- Cloud Functions para transacciones financieras criticas;
- React SPA o Next.js durante la transicion.

## Aclaracion importante

Firestore no es hosting. La equivalencia correcta es:

- Firebase Hosting/App Hosting: despliegue web.
- Cloud Firestore: base de datos administrable desde Firebase Console.
- Firebase Authentication: usuarios.
- Firestore Security Rules: equivalente conceptual de RLS, pero con sintaxis y limites distintos.

## Ruta recomendada

### Fase 1: puente seguro

Estado preparado en esta rama:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `apphosting.yaml`
- `.firebaserc.example`
- SDK Firebase web aislado en `src/lib/firebase/*`
- docs de modelo y migracion

Esta fase no borra Supabase. El objetivo es dejar Firebase listo para emuladores, reglas y App Hosting mientras la app productiva sigue estable.

### Fase 2: duplicar modelo en Firestore

Crear colecciones Firestore seguras:

- `users`
- `workspaces`
- `workspaces/{workspaceId}/members`
- subcolecciones por workspace:
  - `clients`
  - `simulations`
  - `creditAccounts`
  - `personalTransactions`
  - `personalCategories`
  - `personalBudgets`
  - `recurringRules`
  - `personalDebts`
  - `reminders`
  - `auditEvents`

### Fase 3: auth Firebase

Implementar:

- email/password;
- Google Auth;
- creacion de perfil;
- creacion de workspace personal;
- membership owner;
- guardas de rutas.

### Fase 4: React SPA nueva

Para que se sienta como Sanvat, el cliente debe ser React SPA:

- Vite + React o equivalente;
- rutas client-side;
- skeletons instantaneos;
- caches locales solo para catalogos no sensibles;
- Firestore realtime solo donde agregue valor;
- writes financieros por Cloud Functions transaccionales.

### Fase 5: migrar modulo por modulo

Orden recomendado:

1. Auth + onboarding + settings.
2. Mis finanzas.
3. Simulador.
4. Simulaciones guardadas.
5. Clientes.
6. Creditos.
7. Pagos y abonos con Cloud Functions.
8. Recordatorios.
9. Importacion de datos historicos.

### Fase 6: apagar Supabase

Solo cuando:

- reglas Firestore pasen tests A/B;
- pagos y abonos sean transaccionales en Cloud Functions;
- se haya migrado data real;
- QA beta pase en web y APK;
- no existan dependencias activas de Supabase.

## Hosting recomendado

### Durante la transicion

Usar Firebase App Hosting para la app Next.js actual.

Motivo: Firebase App Hosting tiene soporte para Next.js dinamico y se integra con Firebase Authentication/Firestore. La documentacion oficial recomienda App Hosting para apps Next.js modernas en lugar del experimento antiguo de frameworks en Firebase Hosting.

### App final estilo Sanvat

Usar Firebase Hosting con una SPA React.

Motivo: una SPA estatica en Hosting + Firestore/Auth reduce tiempos de navegacion, se siente mas nativa y encaja mejor con APK/PWA.

## Que no se debe hacer

- No copiar inserts financieros de Supabase a Firestore sin transacciones.
- No usar reglas abiertas tipo `allow read, write: if true`.
- No guardar secretos en frontend.
- No usar Admin SDK en cliente.
- No migrar pagos/abonos sin pruebas de consistencia.
- No borrar Supabase hasta terminar importacion y QA.

## Fuentes oficiales consultadas

- Firebase Hosting: https://firebase.google.com/docs/hosting
- Firebase App Hosting: https://firebase.google.com/docs/app-hosting
- Firebase App Hosting configuration: https://firebase.google.com/docs/app-hosting/configure
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Auth Google sign-in: https://firebase.google.com/docs/auth/web/google-signin
