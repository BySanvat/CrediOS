# Firebase Setup

## Crear proyecto

1. Abrir Firebase Console.
2. Crear proyecto.
3. Activar:
   - Authentication;
   - Cloud Firestore;
   - App Hosting;
   - Hosting solo cuando exista la SPA React final.

## Configuracion local

Copiar `.firebaserc.example` a `.firebaserc` y reemplazar:

```json
{
  "projects": {
    "default": "TU_PROJECT_ID"
  }
}
```

No commitear credenciales privadas.

## Variables

Agregar en `.env.local` o Firebase App Hosting:

```env
NEXT_PUBLIC_FIREBASE_ENABLED=true
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Las claves `NEXT_PUBLIC_FIREBASE_*` de web app son publicas por diseno, pero aun asi deben corresponder a un proyecto protegido por Authentication y Firestore Rules.

## Emuladores

```bash
npm run firebase:emulators
```

## Deploy de reglas

```bash
npm run firebase:deploy:rules
```

## App Hosting para Next actual

La app Next actual debe ir por Firebase App Hosting, no por Hosting estatico.

Pasos:

1. Firebase Console.
2. Hosting & Serverless.
3. App Hosting.
4. Crear backend.
5. Conectar repositorio GitHub.
6. Root directory: `/`.
7. Live branch: rama que se defina para deploy.
8. Agregar variables de Supabase mientras dure la transicion.
9. Luego agregar variables Firebase.

## Hosting para React final

Cuando exista la SPA React:

1. Build genera `dist`.
2. Se agrega `hosting.public` a `firebase.json`.
3. Deploy:

```bash
firebase deploy --only hosting
```

## Google Auth

Segun documentacion oficial Firebase:

1. Firebase Console.
2. Authentication.
3. Sign-in method.
4. Habilitar Google.
5. Guardar.

Luego probar login web y APK.
