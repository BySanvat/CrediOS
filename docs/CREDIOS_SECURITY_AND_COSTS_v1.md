# CrediOS by Sanvat - Security and Costs v1

Estado: Fase 0  
Objetivo: definir seguridad, privacidad, auditoria y control de costos cloud/base de datos desde el inicio.

## 1. Premisa de seguridad

CrediOS manejara datos sensibles:

- Nombres.
- Telefonos.
- Correos.
- Direcciones.
- Documentos.
- Deudas.
- Saldos.
- Pagos.
- Abonos.
- Historial financiero.
- Recordatorios.
- Adjuntos futuros.

Por tanto, CrediOS debe tratarse como aplicacion financiera sensible aunque no otorgue creditos ni desembolse dinero.

## 2. Principios obligatorios

- No confiar solo en frontend.
- Validar en frontend y backend.
- Separar datos por workspace.
- Preparar roles desde el modelo.
- No exponer secretos en frontend.
- No tocar `.env` en Fase 0.
- No crear credenciales en Fase 0.
- No usar datos reales en desarrollo inicial.
- No permitir acceso cruzado entre usuarios.
- No borrar datos financieros sin confirmacion fuerte.
- No modificar historial financiero sin trazabilidad.
- No sobrescribir pagos.
- No implementar acciones destructivas sin auditoria.
- No pedir acceso a contactos del dispositivo.
- No reportar a centrales de riesgo.
- No crear mecanismos de presion social para cobro.
- Logs de errores sin datos sensibles.

## 3. Arquitectura de seguridad recomendada

Capas:

1. Auth: Supabase Auth.
2. Sesion server-side: lectura de usuario actual en Server Components/Actions.
3. Workspace resolver: determinar workspace activo desde membresia valida.
4. Policy guards: comprobar permiso por accion.
5. Zod validation: validar payloads en frontera server.
6. Repositorios server-only: acceso a datos sin exponer secretos.
7. RLS en Postgres: defensa de profundidad por workspace.
8. Audit events: registro append-only de cambios criticos.
9. Observabilidad: errores sanitizados.

## 4. Multiusuario y multitenant

Modelo base:

- `workspaces` como tenant.
- `workspace_members` como relacion usuario-tenant.
- Toda entidad financiera incluye `workspace_id`.
- RLS filtra por membresia activa.

Roles futuros:

- `owner`: control total, billing, miembros.
- `admin`: operaciones y configuracion.
- `collector`: clientes, pagos, abonos, recordatorios asignados.
- `viewer`: lectura.
- `accountant`: reportes, exportaciones, auditoria.

MVP:

- Implementar `owner`.
- Escribir modelo y guards para admitir roles despues.

Reglas:

- Nunca aceptar `workspace_id` del cliente sin verificar membresia.
- Todas las queries deben incluir workspace.
- Los IDs no deben usarse como unica barrera de seguridad.

## 5. RLS y permisos

Politica conceptual:

```sql
exists (
  select 1
  from workspace_members wm
  where wm.workspace_id = row.workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
)
```

Advertencias:

- RLS es defensa de profundidad, no excusa para saltar validacion en servidor.
- Si se usa service role o conexion privilegiada, RLS puede no proteger. Esa conexion debe quedar limitada a jobs/repositorios internos y exigir guards.
- Las politicas deben testearse con usuarios de distintos workspaces.

Permisos por accion:

- Crear simulacion: miembro activo.
- Guardar escenario: miembro activo.
- Convertir simulacion: owner/admin/rol operativo futuro.
- Crear cliente: owner/admin/collector futuro.
- Registrar pago: owner/admin/collector futuro.
- Anular pago: owner/admin y razon obligatoria.
- Ver auditoria: owner/admin/accountant futuro.
- Exportar datos: owner/admin/accountant futuro.
- Cambiar roles: owner.

## 6. Auditoria

Eventos obligatorios:

- Crear workspace.
- Cambiar rol/miembro.
- Crear cliente.
- Crear deuda administrada.
- Convertir simulacion.
- Registrar pago.
- Anular pago.
- Registrar abono aplicado.
- Recalcular plan por abono.
- Cambiar fecha de vencimiento.
- Archivar cliente/deuda.
- Exportar datos.
- Cambiar configuracion sensible.

Formato:

- `workspace_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `metadata_json` sanitizado
- `created_at`

No incluir:

- Numeros completos de documento si no es imprescindible.
- Direcciones completas.
- Telefonos completos.
- Contenido de adjuntos.
- Secretos.
- Tokens.

Correcciones financieras:

- No editar silenciosamente.
- Anular con razon.
- Crear nuevo evento compensatorio.
- Mantener trazabilidad.

## 7. Eliminacion, archivado y restauracion

MVP:

- Usar `archived_at` para clientes, deudas y simulaciones.
- No hard delete de pagos, abonos, installments ni auditoria desde UI.
- Confirmacion fuerte para archivar entidades con historial.

Futuro:

- Papelera/restauracion.
- Politicas de retencion.
- Exportacion antes de eliminacion de cuenta.
- Proceso legal/privacidad para borrar PII donde aplique, preservando registros contables anonimizados si corresponde.

## 8. Privacidad

Minimizacion:

- Pedir solo datos necesarios.
- Documento, direccion y telefono deben ser opcionales en MVP.
- No pedir contactos del dispositivo.
- No importar agenda.

Logs:

- Registrar IDs, no PII.
- Sanitizar errores.
- No enviar payloads financieros completos a herramientas de analytics.

Adjuntos futuros:

- Storage privado.
- URLs firmadas con expiracion.
- Limite por tipo/tamano.
- Escaneo futuro si hay presupuesto.

## 9. Seguridad de frontend

Reglas:

- No secretos en `NEXT_PUBLIC_*`.
- No confiar en ocultar botones como control de seguridad.
- Inputs monetarios con normalizacion y validacion.
- Confirmaciones para acciones irreversibles.
- Estados de error no deben exponer SQL ni detalles internos.
- Evitar XSS en notas y campos libres; escapar contenido.
- Usar componentes accesibles para modales de confirmacion.

## 10. Seguridad de backend

Reglas:

- Validar todos los payloads con Zod.
- Comprobar sesion.
- Resolver workspace desde membresia.
- Ejecutar cambios financieros en transaccion.
- Usar idempotency keys en operaciones futuras de webhooks/exportaciones.
- Limitar rate de acciones sensibles.
- No usar service role en rutas cliente.
- No retornar filas de otros workspaces aunque se pidan por ID.

## 11. Riesgos de costos por base de datos

Riesgos:

- Dashboards que escanean todas las cuotas/pagos.
- Consultas sin `workspace_id`.
- Listeners realtime en tablas grandes.
- Polling cada pocos segundos.
- Guardar simulaciones por cada tecla.
- Recalcular saldos historicos en cada render.
- JSONB de amortizaciones gigantes sin limites.
- Busquedas sin indices.
- Exportaciones sin rango.

Mitigaciones:

- Indices compuestos por `workspace_id`, fechas y estado.
- Paginacion por cursor.
- Guardar por accion explicita.
- Persistir saldo actual.
- Rollups mensuales cuando el volumen lo pida.
- Cache con stale times.
- Jobs para reportes pesados.
- Limites por plan.

## 12. Riesgos de costos por hosting

Riesgos:

- Server Actions pesadas calculando reportes grandes.
- Render SSR costoso para dashboards sin cache.
- PDF generado sin job.
- Builds lentos por dependencias innecesarias.
- Logs excesivos.

Mitigaciones:

- Calculos financieros en cliente para simulaciones no guardadas cuando no expongan datos sensibles.
- Persistencia y aplicacion real en servidor.
- Rutas server optimizadas.
- Cargar charts por pantalla.
- Exportaciones asincronas.
- Observabilidad con muestreo.

## 13. Riesgos de costos por almacenamiento

Riesgos:

- Recibos/adjuntos sin limite.
- Imagenes pesadas.
- Duplicados.
- Retencion indefinida.
- URLs publicas accidentalmente indexables.

Mitigaciones:

- No implementar adjuntos en MVP.
- Limites por archivo y workspace.
- Compresion de imagenes.
- Storage privado.
- Limpieza de adjuntos huerfanos.
- Cuotas por plan futuro.

## 14. Riesgos de costos por notificaciones

Riesgos:

- Emails repetidos por jobs mal disenados.
- Push/WhatsApp sin deduplicacion.
- Recordatorios generados por cada render.
- Reintentos infinitos.

Mitigaciones:

- MVP solo in-app.
- Tabla de notificaciones con estado.
- Idempotencia por `reminder_id + channel + scheduled_at`.
- Reintentos limitados.
- Consentimiento por canal.
- Preferencias de frecuencia.

## 15. Riesgos de costos por PDF/Excel

Riesgos:

- Exportar toda la historia sin rango.
- Generar PDF en request sin timeout controlado.
- Archivos enormes.
- Repetir exportaciones identicas.

Mitigaciones:

- Export jobs.
- Rango obligatorio.
- Limites de filas.
- Paginacion interna.
- Retencion temporal.
- Cache de exportaciones recientes si aplica.

## 16. Riesgos de costos por integraciones futuras

Riesgos:

- WhatsApp Business API.
- Email transaccional masivo.
- SSO empresarial.
- Analitica con eventos demasiado detallados.
- Webhooks duplicados.

Mitigaciones:

- Feature gates.
- Consentimiento.
- Idempotencia.
- Muestreo de analytics.
- Limites por plan.
- Alertas de consumo.

## 17. Loops de escritura

Prohibido:

- `useEffect` que guarde simulacion al cambiar cada input.
- Suscribirse a una tabla y escribir en la misma tabla sin idempotencia.
- Jobs que recalculan y actualizan filas sin detectar cambios reales.
- Mutaciones en cascada desde el cliente.

Patrones seguros:

- Boton "Guardar simulacion".
- Debounce solo para calculo local, no persistencia.
- Idempotency key para jobs.
- Comparar hash de inputs antes de recalcular snapshots.
- Transacciones pequenas y explicitas.

## 18. Lecturas masivas

Evitar:

- `select *` en tablas financieras.
- Cargar todos los installments de todos los creditos.
- Cargar todos los pagos para dashboard.
- Exportar sin filtros.

Usar:

- Columnas especificas.
- Rango de fechas.
- Paginacion.
- Agregados SQL.
- Vistas/materialized views futuras.
- Indices por estado/vencimiento.

## 19. Dashboard eficiente

MVP:

- Consultas por workspace y rango.
- Proximas cuotas: `installments where due_date between now and now+30`.
- Vencidas: `status overdue/pending and due_date < today`.
- Saldos: `credit_accounts.current_balance_minor`.
- Pagos del mes: suma por `payments.paid_at`.

Futuro:

- Rollups mensuales.
- Cache por workspace.
- Jobs nocturnos.
- Invalidacion por eventos financieros.

## 20. Datos al vuelo vs persistidos

Calcular al vuelo:

- Simulaciones no guardadas.
- Comparaciones temporales.
- Interes proyectado de una sola cuenta.
- UI derivada.

Persistir:

- Pagos.
- Abonos aplicados.
- Saldos actuales.
- Installments de deudas administradas.
- Snapshots de simulaciones guardadas.
- Recordatorios y notificaciones.
- Auditoria.

Materializar futuro:

- Cartera mensual.
- Interes cobrado mensual.
- Mora historica.
- Indicadores por cliente.

## 21. Checklist de seguridad para Fase 1

- Crear proyecto sin credenciales reales en repo.
- Configurar TypeScript strict.
- Definir schemas Zod.
- Crear abstraccion `requireWorkspace`.
- Crear repositorios server-only.
- No introducir service role en cliente.
- Disenar RLS antes de beta.
- Pruebas unitarias del motor.
- Pruebas de autorizacion antes de datos reales.
- Mensajes de UI sin promesas de credito.

## 22. No implementado en Fase 0

- No deploy.
- No produccion.
- No `.env`.
- No credenciales.
- No pagos reales.
- No billing.
- No WhatsApp.
- No migraciones.
- No datos reales.
- No aprobacion, desembolso u originacion de creditos.
