# Simulator Result and Export

## Flujo

El simulador ya no renderiza todo el resultado de inmediato. El usuario configura monto, plazo, tasa, fecha, notas y cargos; luego presiona `Simular`.

El resultado abre un modal con:

- cuota protagonista;
- composicion capital/interes/cargos;
- resumen financiero;
- tabla de amortizacion;
- guardar simulacion;
- exportar PDF;
- compartir.

## Cargos configurables

Los cargos se agregan desde `Anadir cargo`:

- seguro mensual;
- cargo inicial;
- otro cargo fijo mensual;
- otro cargo fijo inicial;
- otro cargo como porcentaje del saldo.

Internamente se mapean al motor existente:

- seguro mensual -> `monthlyInsuranceCents`;
- cargo mensual u otro mensual -> `monthlyFeeCents`;
- cargo inicial u otro inicial -> `upfrontFeeCents`;
- porcentaje del saldo -> calculo on demand sobre el monto simulado.

## PDF y compartir

`Exportar PDF` abre una vista imprimible con branding CrediOS by Sanvat y tabla de amortizacion. El navegador permite guardar como PDF.

`Compartir` usa Web Share API si existe. Si no, copia un resumen al portapapeles.
