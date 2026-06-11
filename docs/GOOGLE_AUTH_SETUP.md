# Google Auth Setup for CrediOS

## Estado en codigo

Login y signup incluyen `Continuar con Google`, pero el boton solo queda activo si:

```env
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
```

Si esa variable no esta en `true`, la UI muestra un mensaje claro y conserva ingreso con correo y contrasena. Esto evita que el usuario termine viendo el JSON crudo de Supabase:

```txt
Unsupported provider: provider is not enabled
```

## Configuracion requerida en Supabase

1. Entrar al proyecto de Supabase.
2. Ir a `Authentication > Providers`.
3. Habilitar `Google`.
4. Crear un OAuth Client en Google Cloud Console.
5. Copiar `Client ID` y `Client Secret` en Supabase.
6. Guardar cambios.
7. En Cloudflare Pages, configurar `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`.
8. Redeploy.

## Redirect URLs

Agregar en Supabase Auth Redirect URLs:

```txt
https://credios.pages.dev/auth/callback
https://credios.pages.dev/**
```

Para desarrollo local:

```txt
http://localhost:3000/auth/callback
http://localhost:3000/**
```

Para previews de Cloudflare:

```txt
https://*.credios.pages.dev/**
```

## Seguridad

- No usar Firebase Auth.
- No poner secretos de Google en el repo.
- No usar `service_role` en frontend.
- `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` no es secreto; solo activa la UI cuando Supabase ya esta configurado.
