# Friendly Credit URLs

## Formato elegido

CrediOS usa URLs con ID y slug calculado:

```txt
/creditos/:id/:slug
```

Ejemplo:

```txt
/creditos/8f3a.../credito-moto-himalayan
```

## Por que no usar solo slug

Los nombres de creditos pueden repetirse. El ID evita colisiones sin agregar una migracion ni una restriccion nueva.

## Compatibilidad

La ruta antigua sigue funcionando:

```txt
/creditos/:id
```

Los listados y redirecciones nuevas apuntan al formato amigable.

## Slugify

La utilidad:

- convierte a minusculas;
- elimina tildes;
- convierte `ñ` en `n`;
- reemplaza espacios por guiones;
- elimina caracteres no seguros;
- usa `credito` como fallback.

## Pendiente opcional

En una fase posterior se puede redirigir automaticamente de `/creditos/:id` a `/creditos/:id/:slug` si se quiere canonicalizar URLs.
