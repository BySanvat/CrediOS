# Personal Finance UI Guidelines

Fecha: 2026-06-11

## Direccion visual

CrediOS debe sentirse calmado, premium y financiero. La inspiracion de captura liviana no debe convertir la app en un juguete de gastos.

Tokens base:

- fondo calido: `#FCFBF7`;
- superficie: `#FFFFFF`;
- texto: `#171615`;
- texto secundario: `#6F6965`;
- linea: `#ECE7E2`;
- acento primario: `#F29A7A`;
- arena: `#F9E1B2`;
- azul pastel: `#C0EAFB`;
- rosa pastel: `#FED2DE`;
- amarillo pastel: `#F3E58B`;
- verde pastel: `#D7EBD8`.

## Componentes

- Cards grandes: radio 24px, sombra suave, borde muy bajo.
- Cards compactas: radio 18px.
- Botones: pill/rounded, transicion 150ms.
- Inputs: alto comodo, borde suave, foco con acento calido.
- Segment controls: usar para periodo mes/trimestre/anio.
- Empty states: texto corto, CTA claro, sin ilustraciones pesadas.
- Charts: barras redondeadas, colores pastel, sin saturar.

## Motion

- Transiciones de hover/focus: 120-180ms.
- Entrada de cards: fade + translate pequeno.
- Sin rebotes exagerados.
- Sin efectos caros en scroll.

## Dark mode

Mantener dark mode existente con:

- fondo casi negro calido;
- cards oscuras no azuladas en exceso;
- acento coral suave;
- lineas visibles pero discretas.

## Microcopy

Usar:

- Registrar movimiento.
- Gasto.
- Ingreso.
- Presupuesto.
- Recurrente.
- Capacidad de abono.
- Flujo libre.

No usar:

- credito aprobado;
- solicita credito;
- desembolso;
- cupo aprobado;
- te prestamos.

## Rendimiento

- No escribir por cada tecla.
- No usar realtime en P0.
- No cargar todos los movimientos historicos.
- Limitar queries por periodo y workspace.
- Export CSV con filtros de periodo.
