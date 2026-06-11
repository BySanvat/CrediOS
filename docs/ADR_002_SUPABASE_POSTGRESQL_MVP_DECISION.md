# ADR 002 - Supabase/PostgreSQL para el MVP de CrediOS

Estado: aceptada  
Fecha: 2026-06-10  
Producto: CrediOS by Sanvat

## Contexto

CrediOS es una aplicacion para simular, guardar, comparar y administrar creditos, tarjetas, deudas, clientes, pagos, abonos, recordatorios y cartera. No presta dinero, no aprueba creditos y no desembolsa fondos.

El MVP necesita una base tecnica que soporte datos financieros relacionales, control de acceso por usuario/workspace, auditoria, reportes, precision y costos predecibles.

## Decision

Usar Supabase/PostgreSQL como backend principal del MVP, con Supabase Auth, Row Level Security y Drizzle ORM/Drizzle Kit para schema y migraciones.

No usar Firebase/Firestore como nucleo financiero de CrediOS.

## Por que se descarta Firebase/Firestore para el nucleo financiero

Firestore es fuerte para prototipos realtime y modelos documento, pero el nucleo de CrediOS depende de relaciones estrictas:

- Workspaces y miembros.
- Clientes.
- Creditos/deudas.
- Cuotas.
- Pagos.
- Abonos.
- Recordatorios.
- Auditoria.
- Reportes por rango, estado, cliente y cuenta.

En Firestore, muchas de estas consultas requieren duplicacion, agregados manuales, reglas complejas y control fino de lecturas para evitar costos crecientes. Para CrediOS, ese costo tecnico y operativo aparece justo en el centro del producto.

## Por que CrediOS necesita modelo relacional

CrediOS necesita consistencia y trazabilidad:

- Una deuda tiene cuotas.
- Una cuota puede recibir pagos parciales.
- Un pago afecta saldos.
- Un abono recalcula proyecciones.
- Un cliente agrupa deudas.
- Un workspace aisla informacion sensible.
- Un dashboard agrega datos por fechas, estados y saldos.
- Una auditoria registra cambios criticos.

PostgreSQL permite modelar estas relaciones con claves foraneas, transacciones, indices, constraints, vistas, funciones y consultas agregadas eficientes.

## Por que Supabase/PostgreSQL encaja mejor

Supabase aporta PostgreSQL administrado, Auth, RLS y una experiencia SaaS rapida sin crear un backend separado en el MVP.

Encaja especialmente para:

- Aislamiento por workspace con RLS.
- Consultas relacionales para clientes, creditos, cuotas, pagos y abonos.
- Reportes financieros por rango.
- Auditoria append-only.
- Migraciones SQL revisables.
- Evolucion futura hacia roles, equipos y planes.
- Costos controlables con indices, paginacion y agregados.

## Rol de Drizzle

Drizzle se usara para:

- Definir schema TypeScript de PostgreSQL.
- Generar migraciones.
- Mantener tipos cerca del modelo de datos.
- Evitar SQL disperso en la app.

Las migraciones SQL de RLS/policies se mantendran revisables porque son parte critica de seguridad.

## Rol de Supabase Auth y RLS

Supabase Auth gestionara identidad de usuarios.

RLS en PostgreSQL actuara como defensa de profundidad:

- Un usuario solo puede acceder a filas de workspaces donde sea miembro.
- Las tablas sensibles incluyen `workspace_id`.
- Las policies usan una funcion helper `is_workspace_member`.

La app tambien validara permisos en server actions. RLS no reemplaza validacion de backend.

## Riesgos pendientes

- Bootstrap inicial de profile/workspace debe mantenerse seguro sin `service_role`.
- Las policies deben probarse con usuarios de distintos workspaces antes de beta.
- Las migraciones no deben ejecutarse contra produccion sin revision.
- Jobs y reportes futuros pueden requerir estrategia adicional de rollups.
- Si el producto crece mucho, algunas operaciones podrian moverse a workers o backend dedicado.

## Decisiones futuras

- Confirmar proveedor de pagos para suscripciones.
- Definir SSO con Sanvat.
- Decidir si reportes pesados usan jobs asincronos.
- Definir politica de retencion de auditoria.
- Evaluar Storage para adjuntos solo cuando el MVP lo requiera.
- Evaluar canales externos de notificacion con consentimiento.
