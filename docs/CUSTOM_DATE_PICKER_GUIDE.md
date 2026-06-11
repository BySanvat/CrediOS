# Custom Date Picker Guide

## Patron visual

Los campos de fecha deben mostrarse asi:

```txt
Fecha
12 jun 2026        [icono calendario]
```

En desktop, label y fecha pueden ir en una sola linea. En movil deben poder partir en dos lineas sin desbordar.

## Reglas

- El boton muestra solo icono de calendario.
- La fecha seleccionada es secundaria y usa color `muted`.
- El calendario es propio de la app.
- No usar calendario nativo si rompe la visual.
- El popup usa `surface-modal`.
- Debe funcionar en light y dark mode.

## Campos migrados

- Simulador.
- Crear deuda administrada.
- Pago inteligente.
- Abonos.
- Retanqueo administrativo.
- Movimientos.
- Presupuestos.
- Recurrentes.
- Saldos manuales.
- Confirmacion de ingresos/gastos fijos.
