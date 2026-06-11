# Dark Mode Guidelines

## Direccion visual

El dark mode de CrediOS debe sentirse premium, sobrio y legible. No debe usar negro plano ni tonos cafe.

## Tokens principales

```css
--background: #0b0f14;
--surface-warm: #0f1620;
--card: #141b26;
--surface-elevated: #1b2431;
--surface-modal: #202b3a;
--foreground: #f8fafc;
--muted: #b6c2d2;
```

## Reglas

- Cards usan `card`.
- Dropdowns y drawer usan `surface-elevated`.
- Modales y calendarios usan `surface-modal`.
- Bordes son sutiles, pero visibles.
- El acento se mantiene pastel y no sustituye colores de estado.
- Exito, error y warning conservan sus tonos semanticos.

## QA

Revisar login, dashboard, menu movil, simulador, calendario, pagos y Mis finanzas en tema oscuro.
