# Credit Slug URLs

## Formato actual

Los enlaces nuevos a creditos usan slug limpio:

```txt
/creditos/credito-moto-himalayan
```

Si hay nombres repetidos dentro del workspace, CrediOS agrega un sufijo simple:

```txt
/creditos/credito-moto-himalayan-2
```

## Compatibilidad

Las rutas antiguas siguen funcionando:

```txt
/creditos/:id
/creditos/:id/:slug
```

Esto evita romper enlaces compartidos o guardados antes de esta correccion.

## Decision tecnica

No se agrego migracion de `slug` persistente en esta fase. El slug se calcula por workspace a partir de:

- nombre del credito;
- fecha de creacion;
- id como desempate interno.

Para beta controlado esto evita una migracion innecesaria. Si el volumen crece, se recomienda agregar `slug text` con indice unico por `workspace_id, slug`.
