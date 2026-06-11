# CrediOS Calendar Field Guide

## Objetivo

Reemplazar campos de fecha nativos que ocupaban demasiado espacio y causaban overflow en modales.

## Regla visual

Cada campo muestra:

- label `Fecha` o `Fecha final`;
- fecha seleccionada en gris y sin protagonismo;
- boton compacto con icono de calendario;
- calendario propio con fondo, bordes y sombra del sistema CrediOS.

## Componente

```tsx
<DatePickerField name="paymentDate" label="Fecha" required />
```

## Aplicado en

- Simulador.
- Crear credito/deuda administrada.
- Pago inteligente.
- Abono extraordinario.
- Movimientos de Mis finanzas.
- Presupuestos.
- Fijos mensuales.
- Registros manuales.
- Retanqueo administrativo.

## Pendientes

- Agregar navegacion por teclado completa en calendario.
- Agregar test visual dedicado si se amplian los flujos con mas modales.
