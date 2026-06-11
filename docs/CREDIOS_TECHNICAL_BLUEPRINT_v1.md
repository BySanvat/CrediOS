# CrediOS by Sanvat - Technical Blueprint v1

Estado: Fase 0, investigacion tecnica y arquitectura base  
Fecha de sesion: 2026-06-10, entorno America/Bogota  
Repositorio auditado: `C:\Users\Santiago\Documents\CrediOS`

## 1. Resumen ejecutivo

CrediOS by Sanvat debe construirse como una aplicacion SaaS independiente para simular, verificar, guardar, administrar y hacer seguimiento de creditos, tarjetas, deudas, pagos, abonos, clientes y cartera.

La decision tecnica recomendada para iniciar es:

- Frontend y backend BFF: Next.js App Router con TypeScript.
- UI: Tailwind CSS, shadcn/ui, Radix UI, lucide-react y Recharts.
- Formularios y validacion: React Hook Form mas Zod.
- Estado: Server Components y servidor para datos persistentes; TanStack Query para estado de servidor en pantallas interactivas; Zustand solo para estado local efimero.
- Datos: Supabase PostgreSQL con Auth, Row Level Security, Storage futuro y backups administrados.
- Acceso a datos: repositorios server-only; Supabase SSR client para operaciones sujetas a RLS; Drizzle Kit/ORM para schema, migraciones y consultas internas controladas.
- Motor financiero: paquete TypeScript puro, aislado de React, con decimal.js para calculos de tasas y enteros en centavos para persistencia monetaria.
- QA: Vitest para dominio financiero y servicios; Playwright para flujos criticos; pruebas de RLS y auditoria antes de beta.
- Hosting recomendado: Vercel para app web y Supabase para base/auth/storage, sin deploy en esta fase.

Esta fase no implementa producto. Solo deja una base tecnica clara para iniciar Fase 1 sin tomar decisiones improvisadas.

## 2. Auditoria inicial del repositorio

Comandos ejecutados:

```bash
git status
git branch --show-current
git log --oneline -8
```

Resultado:

- Rama inicial: `master`.
- Commit inicial: no existe commit inicial; Git reporto `No commits yet`.
- Estado inicial: arbol limpio, sin archivos versionados, solo carpeta `.git`.
- `git log --oneline -8`: fallo esperado porque la rama no tiene commits.
- `package.json`: no existe.
- `src`: no existe.
- `app`: no existe.
- `pages`: no existe.
- `docs`: no existia antes de esta fase.
- `README.md`: no existe.
- Framework detectado: ninguno.
- Riesgo principal: repo vacio, por tanto no hay restricciones de stack heredadas ni scripts de validacion.

Conclusion: CrediOS puede definirse desde cero. La Fase 0 debe producir documentacion y no construir la app completa.

## 3. Definicion estrategica del producto

CrediOS es:

- Un sistema operativo financiero para creditos, tarjetas, deudas y cartera.
- Una herramienta de simulacion, verificacion, organizacion y seguimiento.
- Un gestor personal de deudas para usuarios individuales.
- Un gestor de cartera para prestamistas independientes, financieras pequenas o personas que administran cobros de terceros.
- Una aplicacion independiente del ecosistema Sanvat, integrable en el futuro.

CrediOS no es:

- Banco.
- Financiera.
- Originador de credito.
- Plataforma de aprobacion.
- Plataforma de desembolso.
- Central de riesgo.
- Sistema de cobranza invasiva.
- App que promete acceso a dinero.

Lenguaje obligatorio del producto:

- Simular credito.
- Guardar simulacion.
- Administrar deuda.
- Gestionar cartera.
- Registrar pago.
- Registrar abono.
- Ver plan de pagos.
- Comparar escenarios.
- Recordar fecha de pago.
- Revisar intereses.
- Controlar saldo.
- Crear cliente.
- Historial de pagos.

Lenguaje prohibido en UX, marketing y modelo mental:

- Solicita tu credito.
- Te prestamos.
- Credito aprobado.
- Desembolso inmediato.
- Cupo aprobado.
- Aplica ahora.
- Recibe dinero.
- Preaprobado.
- Financiacion otorgada por CrediOS.

## 4. Usuarios objetivo

### 4.1 Uso personal

Personas que quieren entender sus deudas, simular antes de endeudarse, revisar si una tabla de pagos tiene sentido, controlar tarjetas, guardar escenarios y planear abonos.

Necesitan:

- Claridad inmediata.
- Lenguaje simple.
- Resultados visuales.
- Comparacion de escenarios.
- Recordatorios de fechas.
- Privacidad fuerte.

### 4.2 Gestion de cartera

Prestamistas independientes, pequenas financieras o personas que hoy administran cartera en Excel, WhatsApp, cuadernos o notas.

Necesitan:

- Clientes.
- Creditos administrados manualmente.
- Pagos, abonos, cuotas y mora.
- Dashboard de cartera.
- Historial confiable.
- Auditoria futura.
- Exportaciones futuras.
- Roles futuros.

## 5. Modulos principales

MVP recomendado:

1. Autenticacion basica.
2. Workspace personal por defecto.
3. Simulador de credito de cuota fija.
4. Simulaciones guardadas.
5. Conversion de simulacion a deuda administrada.
6. Creditos/deudas administradas.
7. Registro manual de pagos y abonos.
8. Clientes basicos.
9. Perfil personal para deudas propias.
10. Recordatorios internos.
11. Dashboard inicial.
12. Auditoria basica de eventos criticos.

Futuro:

1. Tarjetas de credito avanzadas.
2. Multiworkspace y roles.
3. Reportes PDF/Excel.
4. Email/push/WhatsApp con consentimiento.
5. Adjuntos y recibos.
6. Planes, suscripciones y feature gates.
7. Integracion con Sanvat.
8. SSO.
9. Jobs programados.
10. Analitica de producto y observabilidad avanzada.

## 6. Stack recomendado

### 6.1 Frontend

Recomendacion: Next.js App Router con TypeScript.

Comparacion:

| Opcion | Ventajas | Desventajas | Veredicto |
| --- | --- | --- | --- |
| Next.js App Router | Rutas anidadas, layouts, Server Components, Route Handlers, Server Functions, SSR/SSG para landing futura, BFF integrado, despliegue natural en Vercel. | Mayor complejidad mental que SPA pura; exige disciplina entre server/client components. | Recomendada. CrediOS necesita SaaS, auth, dashboard, futura landing y capa server cercana a UI. |
| React + Vite | DX muy rapido, HMR excelente, SPA simple, menor complejidad inicial. | Requiere backend separado o BaaS directo; SEO/landing y rutas de servidor requieren mas piezas; mas riesgo de logica sensible en cliente. | Buena alternativa para prototipo, no ideal para SaaS financiero sensible. |
| Remix/React Router framework | Buen modelo web, formularios y nested routes. | Menor alineacion con ecosistema Vercel/shadcn actual y con Server Components. | Alternativa valida, no primera opcion. |

Decision:

- Usar App Router.
- Separar componentes de servidor y cliente con criterio estricto.
- Mantener calculos financieros puros fuera de React.
- No consultar datos sensibles desde componentes cliente sin pasar por RLS y validacion server.

Fuentes oficiales consultadas: Next.js App Router, Route Handlers y Server/Client Components; Vite docs.

### 6.2 UI y sistema visual

Recomendacion: Tailwind CSS + shadcn/ui + Radix UI + lucide-react + Recharts.

| Opcion | Ventajas | Desventajas | Veredicto |
| --- | --- | --- | --- |
| Tailwind CSS | Rapido, consistente, personalizable, buena base para design tokens. | Puede producir clases largas si no hay convencion. | Recomendada como capa de estilos. |
| shadcn/ui | Componentes copiables, personalizables, buena estetica, se apoya en Radix y Tailwind. | No es libreria cerrada; el equipo mantiene componentes en el repo. | Recomendada para velocidad y control. |
| Radix UI | Primitivas accesibles, sin estilos, robustas para dialogs, menus, tabs, popovers. | Requiere diseno encima. | Base recomendada bajo shadcn. |
| Headless UI | Accesible y simple. | Menor amplitud que Radix para un dashboard complejo. | Alternativa. |
| Design system propio desde cero | Maximo control. | Alto costo inicial y riesgo de inconsistencias. | No recomendado para MVP. |

Charts:

- Recharts para MVP por integracion React y composicion simple.
- Considerar Tremor o ECharts solo si los reportes crecen mucho.

Lineamientos visuales:

- Profesional, claro, sobrio y moderno.
- Modo claro y oscuro.
- Mobile first.
- Evitar una estetica de landing generica; el primer producto debe ser util.
- Usar iconos en acciones y tooltips en controles no obvios.
- Tablas densas pero legibles para cartera.
- Tarjetas solo para elementos repetidos, modales o herramientas enmarcadas.

Fuentes oficiales consultadas: Tailwind CSS, shadcn/ui, Radix UI, Recharts.

### 6.3 Formularios y validacion

Recomendacion: React Hook Form + Zod.

| Opcion | Ventajas | Desventajas | Veredicto |
| --- | --- | --- | --- |
| React Hook Form | Formularios performantes, buen manejo de inputs numericos, field arrays y validacion. | Requiere convenciones para inputs monetarios complejos. | Recomendada. |
| Formik | Conocida y estable. | Mas renders y API menos moderna para este caso. | No recomendada para MVP. |
| Formularios manuales | Control total. | Mucha repeticion y riesgo en validaciones financieras. | No recomendado. |

Zod debe usarse para:

- Validar inputs de formularios.
- Validar payloads en Server Actions/Route Handlers.
- Compartir schemas entre frontend y backend sin confiar en el cliente.
- Definir contratos de motor financiero.

Fuentes oficiales consultadas: React Hook Form y Zod.

### 6.4 Estado

Recomendacion:

- Estado persistente: base de datos.
- Estado de servidor en UI: Server Components para lecturas iniciales; TanStack Query para pantallas cliente interactivas con mutaciones, cache, invalidacion y refetch controlado.
- Estado local efimero: Zustand para drafts del simulador, filtros temporales, paneles abiertos, preferencias de UI no criticas.
- Estado derivado: calcular con selectors/memos, no persistir salvo que sea costoso o necesario para auditoria.

No persistir innecesariamente:

- Cada tecla del simulador.
- Resultados intermedios de sliders.
- Filtros temporales.
- Totales que se pueden derivar en una consulta barata.
- Estados de hover, tabs o modales.

Persistir:

- Simulaciones guardadas por accion explicita.
- Creditos/deudas administradas.
- Pagos, abonos y fees.
- Installments si forman parte del plan administrado.
- Recordatorios.
- Eventos de auditoria.
- Snapshots de escenarios si se necesita preservar el resultado exacto de una simulacion guardada.

Fuentes oficiales consultadas: TanStack Query.

### 6.5 Backend y base de datos

Recomendacion: Next.js server layer + Supabase PostgreSQL/Auth/RLS + Drizzle para schema/migraciones y consultas server-only controladas.

Comparacion:

| Opcion | Ventajas | Desventajas | Veredicto |
| --- | --- | --- | --- |
| Supabase/PostgreSQL | Postgres real, Auth, RLS, Storage, backups, SQL, vistas, funciones, buen costo inicial. | Hay que disenar politicas RLS con cuidado; Realtime puede generar costos si se abusa. | Recomendada. Encaja con datos relacionales y seguridad por workspace. |
| PostgreSQL + Prisma | DX excelente, type safety, migraciones, Prisma Studio. | RLS por request no es trivial si se usa conexion privilegiada; puede inducir a saltarse politicas. | Alternativa fuerte si se prioriza ORM, pero requiere capa auth muy estricta. |
| PostgreSQL + Drizzle | Ligero, SQL-like, migrations flexibles, serverless-friendly. | Menos opinionado que Prisma; necesita convenciones fuertes. | Recomendado como herramienta de schema/migracion y consultas internas. |
| Firebase/Firestore | Auth y realtime faciles, buen prototipado. | Modelo documento menos natural para cuotas/pagos/reportes; costos por lecturas pueden crecer; queries relacionales mas dificiles. | No recomendado como DB principal. |
| Backend Node/NestJS separado | Separacion clara, arquitectura enterprise, jobs robustos. | Mayor costo operativo para MVP; duplica despliegue. | Futuro si el dominio crece, no necesario al inicio. |

Regla critica:

- Nunca exponer secretos en frontend.
- La capa de datos debe validar `workspace_id`, membresia y permisos en servidor.
- Las politicas RLS deben ser defensa de profundidad, no sustituto de validacion de negocio.
- Si se usa una conexion server privilegiada, debe estar encerrada en repositorios server-only y nunca aceptar `workspace_id` sin comprobar membresia.

Fuentes oficiales consultadas: Supabase RLS, Supabase Database, Drizzle ORM, Prisma ORM, Firebase Firestore.

### 6.6 Autenticacion

Recomendacion MVP:

- Supabase Auth.
- Email/password y magic link opcional.
- OAuth social solo si aporta conversion y soporte.
- Cada usuario obtiene un workspace personal por defecto.
- Tabla `workspace_members` preparada para roles futuros.

Futuro:

- SSO con Sanvat via OIDC/SAML si Sanvat consolida identidad.
- SSO empresarial para plan Financiera/Equipo.
- MFA para cuentas con cartera sensible.
- Sesiones y dispositivos administrables.

### 6.7 Precision monetaria

Recomendacion:

- Persistir dinero como enteros en unidad menor (`amount_minor`) con moneda ISO (`currency`).
- Usar decimal.js dentro del motor para tasas, potencias y amortizacion.
- Redondear a centavos solo en fronteras definidas: cuota, interes del periodo, capital del periodo, cargos y totales mostrados.
- Guardar parametros de redondeo en la simulacion para reproducibilidad.

Alternativas:

- big.js: mas pequeno y suficiente para decimales, pero con menos herramientas.
- Dinero.js: buen modelo Money, pero puede ser mas pesado/opinionado.
- Solo enteros: excelente para persistencia, insuficiente para tasas y potencias sin una capa decimal.

Fuentes oficiales consultadas: decimal.js y big.js.

### 6.8 Testing

Recomendacion:

- Vitest para motor financiero, validadores, servicios y repositorios con mocks.
- Pruebas de propiedades/casos parametrizados para amortizacion.
- Playwright para flujos criticos: login, crear simulacion, guardar, convertir a deuda, registrar pago, registrar abono, dashboard.
- Tests SQL/RLS en fase posterior antes de beta.

Fuentes oficiales consultadas: Vitest y Playwright.

### 6.9 Exportaciones futuras

No implementar en Fase 1, pero preparar arquitectura:

- Excel/CSV: `xlsx` o generacion server-side con streaming/paginacion.
- PDF: plantillas server-side; para reportes complejos considerar Playwright en job, no en request interactivo.
- Guardar `export_jobs` futuro para evitar timeouts y costos inesperados.
- Limitar rangos, tamano, frecuencia y retencion.

### 6.10 Notificaciones futuras

MVP:

- Recordatorios internos.
- Bandeja in-app.
- Estados `pending`, `sent`, `read`, `dismissed`.

Futuro:

- Email con proveedor transaccional.
- Push web.
- Calendario.
- WhatsApp Business API solo con consentimiento, plantillas aprobadas y controles antiabuso.

## 7. Arquitectura por capas

Arquitectura recomendada:

```txt
app/                         Next.js App Router
  (marketing)/               landing futura, sin mezclar con app privada
  (auth)/                    login, registro, recuperacion
  (app)/                     dashboard autenticado
components/
  ui/                        shadcn/radix wrappers
  app-shell/                 navegacion, layout privado
  charts/                    componentes visuales
features/
  simulations/
  credit-accounts/
  credit-cards/
  clients/
  payments/
  reminders/
  dashboard/
domain/
  financial-engine/          motor puro
  money/                     Money, Currency, rounding
  permissions/               reglas de permisos
server/
  actions/                   Server Actions validadas
  repositories/              acceso a datos server-only
  services/                  casos de uso
  auth/                      sesion, workspace actual
  policies/                  guards de permisos
db/
  schema/                    Drizzle schema
  migrations/                futuras migraciones
  sql/                       vistas/funciones futuras
lib/
  validation/
  telemetry/
  dates/
tests/
  unit/
  e2e/
docs/
```

### 7.1 Capa UI

Responsabilidad:

- Renderizar pantallas.
- Mostrar estados vacios, carga, errores y confirmaciones.
- Usar componentes accesibles.
- No contener reglas financieras criticas.

### 7.2 Capa de formularios

Responsabilidad:

- Form state con React Hook Form.
- Parsing visual de moneda, tasas y fechas.
- Validacion inmediata con Zod.
- Enviar comandos al servidor o al motor local de simulacion.

### 7.3 Hooks/orquestacion

Responsabilidad:

- Encapsular queries/mutaciones.
- Controlar invalidacion de cache.
- Evitar polling innecesario.
- Orquestar pantallas interactivas sin mezclar SQL ni formulas.

### 7.4 Dominio financiero

Responsabilidad:

- Calcular amortizaciones.
- Convertir tasas.
- Simular abonos.
- Simular tarjetas.
- Definir Money, Rate, Term, PaymentFrequency.
- Ser determinista, testeable y sin dependencias de React/DB.

### 7.5 Servicios de aplicacion

Responsabilidad:

- Casos de uso: guardar simulacion, convertir simulacion, registrar pago, registrar abono.
- Validar permisos.
- Crear eventos de auditoria.
- Coordinar repositorios y motor financiero.

### 7.6 Persistencia

Responsabilidad:

- Tablas relacionales.
- Indices por workspace y fechas.
- RLS.
- Repositorios server-only.
- Transacciones para cambios financieros.

### 7.7 Auth/autorizacion

Responsabilidad:

- Identidad de usuario.
- Workspace actual.
- Roles futuros.
- Guards por accion.
- Prevencion de acceso cruzado.

### 7.8 Notificaciones/recordatorios

Responsabilidad:

- Generar recordatorios internos.
- Detectar vencimientos.
- Programar canales futuros.
- Registrar estado de entrega sin datos sensibles innecesarios.

### 7.9 Reportes/exportaciones

Responsabilidad:

- Dashboards eficientes.
- Agregados por rango.
- Export jobs futuros.
- Plantillas PDF/Excel.

### 7.10 Observabilidad futura

Responsabilidad:

- Errores sin PII.
- Performance.
- Auditoria.
- Metricas de costo.
- Alertas de loops de escritura o consultas pesadas.

## 8. Separacion de dominios funcionales

### Simulaciones

Una simulacion es un escenario guardado. Puede tener varios escenarios comparables. No es una deuda activa hasta convertirse explicitamente.

### Creditos/deudas administradas

Una deuda administrada es un registro activo con pagos, abonos, vencimientos, historial y saldo.

### Clientes

Un cliente representa a una persona relacionada con cartera administrada por el usuario/workspace. No debe ser obligatorio para uso personal.

### Perfil personal

Permite que el usuario gestione sus propias deudas sin crear un cliente externo.

### Pagos y abonos

Pagos ordinarios cubren cuotas. Abonos extraordinarios alteran estrategia, saldo y proyeccion. Ambos deben ser trazables.

### Tarjetas

Tarjetas requieren modelo propio: consumo, corte, pago, compras a cuotas, interes, minimo, pago total y estrategia.

## 9. UX/UI base

Principios:

- El usuario debe entender el saldo, la cuota, el interes y la proxima accion sin leer manuales.
- El modo personal no debe sentirse como software de cobranza.
- El modo cartera no debe perder potencia operativa.
- Las acciones financieras criticas deben pedir confirmacion y dejar historial.
- La app debe evitar lenguaje que parezca oferta de credito.

Pantallas principales:

1. Home interna: resumen del workspace y accesos directos.
2. Dashboard: indicadores financieros y proximos vencimientos.
3. Simulador: inputs claros, resultados instantaneos, tabla de amortizacion.
4. Simulaciones guardadas: lista, comparacion y conversion.
5. Mis creditos/deudas: saldos, estados, proximas cuotas.
6. Tarjetas: saldos, cortes, pagos y compras a cuotas.
7. Clientes: cartera por persona.
8. Ficha de cliente: datos, deudas, pagos, recordatorios.
9. Ficha de credito: plan, saldo, cuotas, pagos, abonos.
10. Pagos/abonos: registro y simulacion antes de aplicar.
11. Recordatorios: vencimientos y alertas internas.
12. Reportes: MVP simple, futuro exportable.
13. Configuracion: workspace, moneda, preferencias, seguridad.

Microcopy recomendado:

- "Simula antes de decidir."
- "Guarda este escenario."
- "Convertir en deuda administrada."
- "Registrar pago recibido."
- "Registrar abono extraordinario."
- "Comparar reduccion de plazo y reduccion de cuota."
- "Ver plan de pagos."
- "Saldo pendiente."
- "Proxima fecha de pago."

Estados vacios:

- Simulaciones: "Crea tu primera simulacion para comparar cuota, plazo e intereses."
- Deudas personales: "Agrega una deuda para ver fechas, saldos y posibles estrategias de abono."
- Clientes: "Crea un cliente para organizar creditos, pagos e historial de cartera."
- Recordatorios: "No hay vencimientos pendientes en este rango."

## 10. Dashboard e indicadores

### Uso personal

Indicadores MVP:

- Total de deudas.
- Saldo pendiente.
- Intereses proyectados.
- Proximas cuotas.
- Cuotas vencidas.
- Deuda por tipo.
- Ahorro potencial por abonos.

Futuro:

- Estrategia sugerida de pago.
- Comparacion bola de nieve vs avalancha.
- Salud de calendario de pagos.

### Cartera

Indicadores MVP:

- Capital activo.
- Intereses proyectados.
- Intereses cobrados.
- Saldo pendiente.
- Cuotas proximas.
- Cuotas vencidas.
- Clientes activos.
- Cartera en mora.
- Creditos por estado.
- Pagos recibidos.
- Abonos recibidos.

Calcular al vuelo:

- Conteos por estado en rangos pequenos.
- Proximas cuotas paginadas.
- Totales de una ficha individual.

Persistir o materializar:

- Saldos actuales por credito.
- Estado actual de cuota.
- Rollups mensuales por workspace cuando haya volumen.
- Snapshots de simulaciones guardadas.

## 11. Alertas y recordatorios

MVP:

- Recordatorios internos basados en fechas de pago.
- Vencimientos proximos.
- Cuotas vencidas.
- Bandeja in-app.
- Dismiss/read.

Futuro:

- Email.
- Push.
- Calendario.
- WhatsApp Business API con consentimiento.
- Plantillas personalizadas.
- Recordatorios al cliente/deudor solo con controles legales, consentimiento y antiabuso.

No implementar WhatsApp en Fase 1.

## 12. Monetizacion futura

No implementar billing en MVP inicial. Preparar `plans`, `subscriptions` y `feature_gates`.

Planes sugeridos:

1. Gratis: simulaciones limitadas, deudas personales basicas.
2. Personal Plus: simulaciones ilimitadas, tarjetas, reportes personales.
3. Prestamista: clientes, cartera, recordatorios, reportes.
4. Financiera/Equipo: roles, multiusuario, auditoria avanzada, exportaciones.
5. Add-ons: adjuntos, canales de notificacion, reportes avanzados.

Reglas:

- Feature gating no borra datos.
- Si un plan cambia, bloquear funciones avanzadas sin eliminar historial.
- Mensajes comerciales positivos y transparentes.
- Pasarela de pagos futura solo procesa cobro de suscripcion; CrediOS decide acceso.
- Webhooks futuros idempotentes.

## 13. Integracion futura con Sanvat

Fases sugeridas:

1. Enlace desde Sanvat hacia CrediOS.
2. Landing compartida o cross-link.
3. Login separado.
4. Login compartido futuro.
5. SSO futuro.
6. Plan combinado.
7. Dashboard de ecosistema.
8. Cross-selling contextual.

Regla: no mezclar codigo de Sanvat con CrediOS en Fase 1. Mantener identidad visual compatible, no dependencia tecnica fuerte.

## 14. Riesgos principales

- Deriva de alcance hacia originacion de credito.
- Calculos financieros incorrectos por redondeo.
- Acceso cruzado entre workspaces.
- Mutaciones financieras sin auditoria.
- Dashboards costosos sobre tablas grandes.
- Uso excesivo de listeners/realtime.
- Guardar cada cambio de input del simulador.
- Tarjetas de credito subestimadas; su dominio es distinto a creditos de cuota fija.
- Exportaciones pesadas bloqueando requests.
- Notificaciones externas sin consentimiento.

## 15. Decisiones finales de Fase 0

1. Construir CrediOS como SaaS financiero de administracion y simulacion, no como prestamista.
2. Usar Next.js App Router por arquitectura SaaS, rutas, server layer y futura landing.
3. Usar Supabase/PostgreSQL por modelo relacional, RLS y costo inicial.
4. Usar Drizzle como herramienta de schema/migracion y SQL typed server-only; no exponer conexiones privilegiadas al cliente.
5. Usar decimal.js mas enteros en centavos para precision.
6. Separar motor financiero como dominio puro.
7. Preparar workspace y roles desde el modelo aunque MVP use un solo usuario.
8. Auditar pagos, abonos y cambios criticos desde el inicio.
9. No implementar pagos reales, desembolsos, scoring, WhatsApp ni deploy en Fase 1.

## 16. Fuentes tecnicas consultadas

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Vite: https://vite.dev/
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database: https://supabase.com/docs/guides/database/overview
- Drizzle ORM migrations: https://orm.drizzle.team/docs/migrations
- Drizzle ORM overview: https://orm.drizzle.team/docs/overview
- Prisma ORM overview: https://www.prisma.io/docs/orm
- Firebase Firestore pricing: https://firebase.google.com/docs/firestore/pricing
- Firebase Firestore data model: https://firebase.google.com/docs/firestore/data-model
- Tailwind CSS: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/
- Radix UI Primitives: https://www.radix-ui.com/primitives
- Recharts: https://recharts.org/
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
- TanStack Query: https://tanstack.com/query/latest
- decimal.js: https://github.com/MikeMcl/decimal.js/
- big.js: https://github.com/MikeMcl/big.js/
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
