# CrediOS Input Formatting Guide

Fecha: 2026-06-11

## Objetivo

Los usuarios en Colombia deben poder escribir valores financieros de forma natural:

- `1000` se muestra como `1.000`
- `10000` se muestra como `10.000`
- `1000000` se muestra como `1.000.000`
- `25000000` se muestra como `25.000.000`

La base de datos sigue recibiendo centavos, no strings formateados.

## Componentes

### `CurrencyInput`

Ubicacion: `src/components/ui/financial-input.tsx`

Uso:

```tsx
<CurrencyInput name="amount" required />
```

Reglas:

- Renderiza texto con separador de miles punto.
- Usa `inputMode="numeric"` para teclado movil numerico.
- Envia el string formateado al formulario.
- Las server actions usan `moneyToCents` para convertir a centavos.

### `RateInput`

Ubicacion: `src/components/ui/financial-input.tsx`

Uso:

```tsx
<RateInput name="rateValue" required />
```

Reglas:

- El usuario escribe solo el numero.
- El simbolo `%` es visual y fijo.
- No se envia `%` al servidor.
- Normaliza coma decimal a punto.

## Parsing monetario

Ubicacion:

- `src/lib/utils/number-format.ts`
- `src/domain/finance/money.ts`

Reglas:

- `1.000.000` se interpreta como un millon de pesos.
- `123,45` se interpreta como 123.45.
- `123.45` se mantiene como decimal tecnico.
- `123.456` se interpreta como separador de miles colombiano.

## Formularios cubiertos

- Simulador: monto, cargos, seguro, tasa.
- Crear deuda: monto, cargos, seguro, tasa.
- Registrar pago: valor.
- Aplicar abono: valor.
- Movimientos personales: monto.
- Presupuestos: monto.
- Recurrentes: monto.

## Regresiones a evitar

- No guardar puntos de miles como texto financiero persistido.
- No romper `moneyToCents`.
- No permitir `%` dentro del valor enviado.
- No mezclar formato visual con el motor financiero.
- No usar writes por cada tecla hacia Supabase.
