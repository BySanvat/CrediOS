# Post Deploy UX Round 5

## Resumen

Round 5 corrige fricciones reales de produccion en simulador, navegacion movil, Mis finanzas, guardado de simulaciones, detalle de creditos y Google Auth.

## Cambios principales

- Configuracion ya no muestra ni edita "Nombre del workspace".
- El header muestra `By Sanvat` y usa `CrediOS Finanzas` como fallback visual cuando el workspace viene vacio o con nombre QA.
- Login, signup, callback OAuth, PWA y accesos moviles priorizan `/finanzas`.
- El tema inicia en modo dia salvo que el usuario haya elegido modo oscuro.
- El simulador usa boton `Simular` y abre resultado en modal.
- Seguro mensual y cargo inicial salen del formulario principal; ahora se gestionan desde `Anadir cargo`.
- Guardar simulacion usa server action con estado y errores visibles.
- Exportar PDF usa una vista imprimible local; compartir usa Web Share API o portapapeles.
- Categorias QA se ocultan en UI sin borrar datos.
- Categorias comunes se agregan de forma incremental cuando faltan.
- Conversion de simulacion a credito pregunta proposito financiero.
- Creditos muestran resumen de negocio para colocaciones rentables.
- Detalle de credito compacta resumen, acciones, pagos y abonos en botones/modales.
- Barra inferior permite hasta 6 accesos y adapta labels segun cantidad.
- Menu movil conserva fondo oscuro translucidado, blur, scroll y cierre por swipe/tap fuera.

## Limitaciones

- El PDF es MVP de impresion moderna, no genera archivo en servidor.
- La clasificacion de credito se persiste en `summary` para evitar migracion obligatoria antes de deploy.
- El impacto automatico de pagos sobre Mis finanzas queda preparado por metadata, pero una conciliacion contable completa debe ser una fase aparte.
