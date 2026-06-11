# CrediOS Post Deploy UX Fixes

Fecha: 2026-06-11

## Objetivo

Corregir observaciones reales despues del deploy en Cloudflare Pages sin cambiar Supabase, RLS, RPCs ni arquitectura de datos.

## Cambios incluidos

- Login y signup ahora muestran estado visible de carga.
- Los botones de auth quedan deshabilitados durante el envio para evitar doble submit.
- Signup/login usan textos especificos: `Ingresando...` y `Creando cuenta...`.
- Se agrego onboarding de intencion de uso:
  - `Uso personal`
  - `Gestion de cartera`
- La preferencia se guarda en cookie y localStorage para orientar el dashboard sin migraciones.
- Configuracion permite cambiar la preferencia de inicio.
- Dashboard adapta titulo, descripcion, CTA y prioridad visual segun la preferencia.
- Navegacion movil se consolido en un drawer lateral izquierdo con todas las paginas.
- Se agrego iconografia local liviana para navegacion, headers, estados vacios y acciones de auth.
- Scrollbars globales ahora son delgadas, suaves y coherentes con la paleta premium.
- Se aplico defensa contra overflow horizontal accidental.
- Inputs financieros usan separador de miles con punto.
- Inputs de tasa muestran `%` fijo y guardan solo el numero.

## No se cambio

- No se tocaron variables de entorno.
- No se modifico `.env.local`.
- No se cambio Supabase.
- No se cambio RLS.
- No se cambio RPC.
- No se agrego `service_role`.
- No se agregaron modulos nuevos grandes.
- No se cambio hosting.

## Persistencia de onboarding

La preferencia de uso es una preferencia de experiencia, no un dato financiero critico. Por eso en esta fase se guarda en:

- Cookie: `credios_usage_mode`
- localStorage: `credios_usage_mode`

Esto evita una migracion aditiva solo para UX y no compromete RLS ni datos sensibles.

## Pendientes recomendados

- En una fase posterior, si se desea sincronizacion multi-dispositivo de la preferencia, agregar un campo aditivo `preferences jsonb` en `profiles` o `workspaces`.
- Hacer smoke test en celular real despues del deploy.
- Revisar metricas de Cloudflare Pages despues del nuevo build.
