# Smart Payment Bugfix

## Problema

Al pagar una cuota, un error de server action podia terminar como pagina rota o mensaje generico del navegador.

## Correccion

- `recordSmartPaymentAction` ahora devuelve estado `{ ok, error }`.
- El modal usa `useActionState`.
- Los errores de monto, cuota cubierta, RPC o migracion se muestran dentro del modal.
- La RPC transaccional `record_installment_payment_with_optional_extra` se mantiene como unica ruta critica.

## QA

1. Abrir un credito con cuota pendiente.
2. Usar el boton `-` superior o `Pagar` en la cuota siguiente.
3. Probar pago menor, igual y mayor a la cuota.
4. Si hay excedente, elegir reducir plazo o cuota.
5. Confirmar que no aparece `this page couldn't load`.
6. Confirmar que el historial se actualiza tras exito.
