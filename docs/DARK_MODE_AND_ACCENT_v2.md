# Dark Mode and Accent v2

## Dark mode

La version anterior del tema oscuro era demasiado cafe/negra y no diferenciaba bien modales y superficies. La nueva base usa:

- background gris-negro: `#0F1216`;
- cards: `#171B21`;
- superficie secundaria: `#1E242B`;
- bordes: `#2A3038`;
- texto principal claro y muted con contraste.

Los modales y drawers usan `bg-card`, borde visible, sombra suave y backdrop, para que no se pierdan en el fondo.

## Accent por defecto

El default ahora es `Manzana`:

- principal: `#6EA96B`;
- suave: `#E6F4E4`;
- dark: `#83BD7F`.

## Paleta

Se conserva la paleta:

- Manzana.
- Coral.
- Menta.
- Lavanda.
- Cielo.
- Rosa.
- Miel.
- Salvia.

## Persistencia

El color sigue persistiendo en cookie y localStorage. Es suficiente para UX actual y evita una migracion no esencial. Una fase futura puede moverlo a `profiles.preferences`.
