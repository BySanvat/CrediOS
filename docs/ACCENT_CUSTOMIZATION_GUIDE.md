# CrediOS Accent Customization Guide

## Resumen

CrediOS permite elegir un color de enfasis para adaptar la interfaz sin romper la identidad visual del producto. La paleta evita colores chillones y mantiene el fondo calido, las cards limpias y los estados financieros separados por significado.

## Paleta disponible

- Coral: `#FF8A6B`
- Menta: `#14A799`
- Lavanda: `#8B7CF6`
- Cielo: `#4BA3F2`
- Rosa: `#F472B6`
- Miel: `#F2B84B`
- Salvia: `#78A083`

Cada color tiene una version suave para badges, previews y superficies ligeras.

## Persistencia actual

La seleccion se guarda en:

- cookie `credios_accent_color`;
- `localStorage` key `credios-accent-color`;
- atributo `data-accent` en `document.documentElement`.

Esto evita una migracion de base de datos en esta fase. Para una fase posterior se recomienda persistir la preferencia en `profiles.preferences jsonb` o en una tabla de preferencias por usuario/workspace.

## Donde aparece

- Login y signup.
- Onboarding inicial.
- Configuracion > Apariencia.
- Botones primarios.
- Estados activos de navegacion.
- Enlaces y elementos destacados.
- Previews visuales.

## Reglas

- El acento no reemplaza colores semanticos: exito sigue verde, error sigue rojo y alerta sigue ambar.
- El contraste debe mantenerse legible en claro y oscuro.
- No se deben crear colores libres fuera de la paleta sin revisar accesibilidad.
