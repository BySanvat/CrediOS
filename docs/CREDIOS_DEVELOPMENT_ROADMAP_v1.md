# CrediOS by Sanvat - Development Roadmap v1

Estado: Fase 0  
Objetivo: proponer fases tecnicas para construir CrediOS con bajo riesgo.

## 1. Estrategia general

CrediOS debe construirse por capas, validando primero dominio, precision financiera, seguridad y experiencia base. La app no debe intentar cubrir todo el universo financiero desde el primer sprint.

Orden recomendado:

1. Base tecnica.
2. Motor financiero.
3. Simulador.
4. Persistencia segura.
5. Deudas administradas.
6. Pagos y abonos.
7. Clientes/cartera.
8. Dashboard.
9. Recordatorios.
10. Tarjetas.
11. Exportaciones e integraciones.

## 2. Fase 1 - Scaffold tecnico y base de calidad

Objetivo:

- Crear app Next.js limpia con TypeScript, Tailwind, shadcn/ui y estructura de carpetas.
- No conectar produccion.
- No crear funcionalidades masivas.

Entregables:

- `package.json`.
- Next.js App Router.
- TypeScript strict.
- Tailwind.
- shadcn/ui inicial.
- ESLint/Prettier si aplica.
- Vitest configurado.
- Playwright configurado opcionalmente.
- Estructura `src/domain`, `src/features`, `src/server`, `src/components`.
- README inicial.
- Pagina home interna placeholder sin promesas de credito.

Criterios de exito:

- `npm/pnpm lint` pasa si se configura.
- `typecheck` pasa.
- Test unitario de ejemplo pasa.
- No `.env` real.
- No deploy.

## 3. Fase 2 - Motor financiero MVP

Objetivo:

- Implementar motor puro para credito de cuota fija.

Entregables:

- Money value object.
- Conversion de tasas.
- Cuota fija.
- Tabla de amortizacion.
- Costos basicos.
- Ultima cuota ajustada.
- Tests parametrizados.

Criterios de exito:

- Casos tasa cero, plazo uno, tasa normal, tasa alta y redondeo pasan.
- No dependencia de React ni DB.
- Resultados reproducibles.

## 4. Fase 3 - Simulador UI sin persistencia

Objetivo:

- Crear primera experiencia usable de simulacion.

Entregables:

- Pantalla Simulador.
- Inputs: monto, tasa, tipo de tasa, plazo, frecuencia, fecha inicial, costos basicos.
- Resultados: cuota, total interes, total pagado, fecha final.
- Tabla de amortizacion.
- Comparacion visual simple.
- Estados de error claros.

Criterios de exito:

- Calculo local sin escribir en DB.
- Mobile first.
- Microcopy correcto.
- No lenguaje de otorgamiento.

## 5. Fase 4 - Auth, workspace y persistencia inicial

Objetivo:

- Crear base de usuario/workspace segura.

Entregables:

- Supabase Auth configurado en desarrollo.
- Workspace personal por defecto.
- Tablas iniciales.
- RLS base.
- Repositorios server-only.
- Guardar simulaciones por accion explicita.

Criterios de exito:

- Usuario A no lee datos de usuario B.
- No secretos en frontend.
- Tests/manual QA de RLS.

## 6. Fase 5 - Simulaciones guardadas y conversion

Objetivo:

- Permitir guardar escenarios y convertirlos en deuda administrada.

Entregables:

- Lista de simulaciones.
- Detalle de simulacion.
- Escenarios multiples.
- Accion "Convertir en deuda administrada".
- Creacion de `credit_account` e `installments`.
- Audit event.

Criterios de exito:

- Conversion transaccional.
- Simulacion conserva snapshot.
- Deuda queda lista para seguimiento.

## 7. Fase 6 - Deudas administradas, pagos y abonos

Objetivo:

- Gestionar deudas activas manuales.

Entregables:

- Lista de deudas.
- Ficha de deuda.
- Plan de pagos.
- Registrar pago.
- Registrar pago parcial.
- Simular abono.
- Aplicar abono con reduccion de plazo/cuota.
- Auditoria de eventos.

Criterios de exito:

- Saldos consistentes.
- Pagos no se sobrescriben.
- Abonos aplicados recalculan futuro sin destruir pasado.

## 8. Fase 7 - Clientes y cartera MVP

Objetivo:

- Soportar modo prestamista/cartera sin romper uso personal.

Entregables:

- CRUD de clientes basico.
- Ficha de cliente.
- Asociar deudas a cliente.
- Indicadores por cliente.
- Busqueda/paginacion.

Criterios de exito:

- Cliente no es obligatorio para deudas personales.
- PII protegida.
- Listados paginados.

## 9. Fase 8 - Dashboard y recordatorios internos

Objetivo:

- Dar claridad operativa diaria.

Entregables:

- Dashboard personal.
- Dashboard cartera.
- Proximas cuotas.
- Vencidas.
- Saldo pendiente.
- Intereses proyectados.
- Recordatorios in-app.
- Notificaciones in-app.

Criterios de exito:

- Consultas indexadas.
- Sin polling agresivo.
- Estados vacios utiles.

## 10. Fase 9 - Tarjetas de credito MVP

Objetivo:

- Agregar modulo de tarjetas como dominio separado.

Entregables:

- Modelo inicial de tarjeta.
- Consumos manuales.
- Fechas de corte/pago.
- Pago minimo simplificado.
- Pago total.
- Simulacion de estrategia.

Criterios de exito:

- No reutilizar incorrectamente modelo de credito de cuota fija.
- Microcopy claro sobre supuestos.

## 11. Fase 10 - Reportes y exportaciones controladas

Objetivo:

- Exportar sin romper costos ni seguridad.

Entregables:

- CSV/Excel por rango.
- PDF basico de plan de pagos.
- Historial de exportaciones.
- Limites por rango.

Criterios de exito:

- Export jobs o requests controlados.
- No exportar otros workspaces.
- Auditoria de exportacion.

## 12. Fase 11 - Roles, planes y monetizacion

Objetivo:

- Preparar negocio SaaS sin borrar datos.

Entregables:

- Roles completos.
- Feature gates.
- Planes.
- Suscripciones futuras.
- UI de limites.

Criterios de exito:

- Cambiar plan no elimina historial.
- Permisos testeados.
- Billing real todavia requiere decision de proveedor.

## 13. Fase 12 - Integraciones futuras

Objetivo:

- Integrar canales externos solo cuando el nucleo sea seguro.

Entregables posibles:

- Email.
- Push.
- Calendario.
- WhatsApp Business API con consentimiento.
- SSO con Sanvat.
- Dashboard ecosistema Sanvat.

Criterios de exito:

- Consentimiento.
- Idempotencia.
- Plantillas aprobadas donde aplique.
- Sin cobranza invasiva.

## 14. QA por fase

Fase 1:

- Lint/typecheck/test base.

Fase 2:

- Tests unitarios intensivos del motor.
- Casos limite financieros.

Fase 3:

- Component tests o Playwright para simulador.
- Validacion visual mobile/desktop.

Fase 4:

- Tests de auth/workspace.
- Tests RLS.

Fase 5-6:

- Tests transaccionales.
- Tests de auditoria.
- E2E conversion y pago.

Fase 7-8:

- Tests de paginacion y dashboard.
- Performance basica.

Fase 9:

- Tests dominio tarjeta.

Fase 10+:

- Tests de exportacion, permisos y limites.

## 15. Riesgos pendientes

- Definicion legal de uso para prestamistas y recordatorios externos.
- Reglas exactas de mora si se implementan.
- Tratamiento de documentos/PII por pais.
- Seleccion final de proveedor de pagos de suscripcion.
- Integracion de identidad Sanvat.
- Necesidad futura de backend separado si jobs/reportes crecen.
- Complejidad de tarjetas si se busca exactitud por entidad bancaria.

## 16. Decisiones que requieren usuario

1. Moneda inicial oficial: recomendado COP, confirmar si sera multimoneda desde MVP o futuro.
2. Pais/mercado inicial: importante para microcopy, fechas, formatos y consideraciones legales.
3. Nivel de detalle de clientes en MVP: nombre/telefono basta o incluir documento/direccion opcional.
4. Proveedor de auth/DB final: recomendado Supabase, confirmar antes de implementar Fase 4.
5. Branding visual: relacion exacta con Sanvat, paleta, logo y tono.
6. Billing: no decidir ahora salvo direccion estrategica.

## 17. Siguiente paso recomendado

Ejecutar Fase 1:

- Scaffold tecnico.
- Estructura base.
- Configuracion de calidad.
- Primer shell visual.
- Sin DB real si aun no se confirma Supabase.
- Sin credenciales.
- Sin deploy.

Prompt sugerido disponible en `docs/CREDIOS_CODEX_NEXT_PROMPTS_v1.md`.
