# Google Auth Setup for CrediOS

## Estado en codigo

Login y signup ya incluyen el boton `Continuar con Google`. El flujo usa Supabase Auth OAuth con provider `google` y redirige a:

```txt
/auth/callback
```

La app no usa Firebase Auth.

## Configuracion requerida en Supabase

1. Entrar al proyecto de Supabase.
2. Ir a `Authentication > Providers`.
3. Habilitar `Google`.
4. Crear OAuth Client en Google Cloud Console.
5. Copiar el Client ID y Client Secret en Supabase.
6. Configurar las URLs permitidas.

## Redirect URLs

Para local:

```txt
http://localhost:3000/auth/callback
http://localhost:3000/**
```

Para Cloudflare Pages:

```txt
https://credios.pages.dev/auth/callback
https://credios.pages.dev/**
```

Si se usa una URL preview:

```txt
https://*.credios.pages.dev/**
```

Si en el futuro hay dominio propio, agregar tambien:

```txt
https://TU-DOMINIO/auth/callback
https://TU-DOMINIO/**
```

## Variables

El frontend solo necesita las variables publicas de Supabase ya existentes:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

No se debe exponer `service_role` ni secrets de Google en el repo.

## Fallos esperados

Si Google no esta configurado en Supabase, el boton puede devolver un error del proveedor. La UI conserva email/password como alternativa.
