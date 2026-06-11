# Mobile Menu Fixes

## Problema

El menu movil podia verse demasiado transparente y algunas opciones quedaban escondidas en pantallas pequenas.

## Solucion

- Drawer izquierdo con base negra translucida y blur controlado.
- Backdrop `black/50` con `backdrop-blur`.
- Altura `100dvh`.
- Contenido interno con `overflow-y-auto`.
- Padding inferior para evitar que el ultimo item quede tapado.
- Estado activo por ruta actual.
- Simulador queda visible en modo personal.
- Herramientas de cartera se ocultan solo para creditos, clientes y simulaciones si el usuario no las activo.
- Se agrego barra inferior movil para accesos rapidos; el drawer conserva todas las rutas.

## QA esperado

- Abrir/cerrar con boton hamburguesa.
- Cerrar con Escape.
- Cerrar al navegar.
- Scroll interno en pantallas pequenas.
- Sin scroll horizontal.
