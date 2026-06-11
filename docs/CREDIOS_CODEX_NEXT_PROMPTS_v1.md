# CrediOS by Sanvat - Codex Next Prompts v1

Estado: Fase 0  
Objetivo: dejar prompts listos para continuar el desarrollo por fases sin perder contexto ni romper alcance.

## 1. Prompt recomendado para Fase 1

```txt
Actua como ingeniero senior full-stack y arquitecto SaaS. Vamos a iniciar la Fase 1 de CrediOS by Sanvat usando la documentacion creada en /docs.

Contexto obligatorio:
- CrediOS NO presta dinero.
- CrediOS NO aprueba creditos.
- CrediOS NO desembolsa dinero.
- CrediOS es una herramienta para simular, guardar, administrar y hacer seguimiento de creditos, tarjetas, deudas, pagos, abonos, clientes y cartera.

Lee primero:
- docs/CREDIOS_TECHNICAL_BLUEPRINT_v1.md
- docs/CREDIOS_DOMAIN_MODEL_v1.md
- docs/CREDIOS_DATA_MODEL_v1.md
- docs/CREDIOS_FINANCIAL_ENGINE_SPEC_v1.md
- docs/CREDIOS_SECURITY_AND_COSTS_v1.md
- docs/CREDIOS_DEVELOPMENT_ROADMAP_v1.md

Objetivo de Fase 1:
Crear el scaffold tecnico inicial de CrediOS, sin implementar el producto completo.

Alcance permitido:
1. Auditar Git al inicio con:
   - git status
   - git branch --show-current
   - git log --oneline -8
2. Crear una app Next.js App Router con TypeScript.
3. Configurar Tailwind CSS y estructura compatible con shadcn/ui.
4. Configurar estructura base:
   - src/app
   - src/components
   - src/features
   - src/domain
   - src/server
   - src/lib
   - src/tests o tests
5. Configurar lint/typecheck/test si el scaffold lo permite.
6. Crear una pantalla inicial sobria de CrediOS con lenguaje correcto:
   - Simular credito
   - Guardar simulacion
   - Administrar deuda
   - Gestionar cartera
   - Registrar pago
   - Registrar abono
7. Crear README inicial con definicion de producto y comandos.
8. No conectar base de datos real todavia salvo que el usuario lo autorice.
9. No tocar .env.
10. No crear credenciales.
11. No hacer deploy.
12. No implementar pagos reales, desembolsos, scoring, WhatsApp ni billing.

Stack objetivo:
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui preparable
- Radix UI cuando se agreguen componentes
- lucide-react para iconos
- React Hook Form + Zod preparados si se agregan formularios
- Vitest para pruebas unitarias
- Playwright solo si se configura sin friccion

Reglas de seguridad:
- No confiar en frontend.
- No exponer secretos.
- No usar datos reales.
- No crear rutas publicas inseguras.
- No usar lenguaje que parezca oferta de credito.

Validaciones:
- Ejecutar scripts existentes o creados: lint, typecheck, test, build solo si no requiere credenciales.
- Reportar resultados.

Reporte final obligatorio:
1. Resumen ejecutivo.
2. Estado Git inicial/final.
3. Archivos creados/modificados.
4. Stack instalado.
5. Scripts disponibles.
6. Validaciones ejecutadas.
7. Confirmar que no se toco .env, no deploy, no credenciales, no pagos reales, no otorgamiento de creditos.
8. Siguiente paso recomendado: Fase 2 motor financiero.
```

## 2. Prompt recomendado para Fase 2 - Motor financiero MVP

```txt
Actua como ingeniero senior especializado en calculos financieros y QA. Vamos a implementar la Fase 2 de CrediOS: motor financiero MVP.

Lee antes:
- docs/CREDIOS_FINANCIAL_ENGINE_SPEC_v1.md
- docs/CREDIOS_TECHNICAL_BLUEPRINT_v1.md

Objetivo:
Implementar un motor TypeScript puro para credito de cuota fija, conversion de tasas y tabla de amortizacion. No mezclar con React ni DB.

Alcance:
1. Auditar Git.
2. Revisar estructura actual.
3. Crear modulo en src/domain/financial-engine.
4. Implementar:
   - Money helpers con minor units.
   - Rounding policy.
   - Conversion effective annual/monthly/nominal annual.
   - Calculo de cuota fija.
   - Tabla de amortizacion.
   - Costos basicos.
   - Ultima cuota ajustada.
5. Usar decimal.js o libreria decimal recomendada.
6. Crear tests con Vitest para:
   - tasa cero
   - plazo uno
   - tasa normal
   - tasa alta
   - ultima cuota
   - redondeo
   - costos fijos
   - conversion de tasas

Prohibido:
- No usar number para dinero.
- No tocar .env.
- No conectar DB.
- No implementar UI completa.
- No usar el motor para aprobar creditos.

Validar:
- lint
- typecheck
- test

Reporte final:
- Cambios.
- Casos cubiertos.
- Limitaciones.
- Siguiente paso: Fase 3 simulador UI sin persistencia.
```

## 3. Prompt recomendado para Fase 3 - Simulador UI

```txt
Actua como ingeniero frontend senior con criterio de UX financiera. Vamos a implementar la Fase 3: simulador UI sin persistencia.

Lee antes:
- docs/CREDIOS_TECHNICAL_BLUEPRINT_v1.md
- docs/CREDIOS_FINANCIAL_ENGINE_SPEC_v1.md
- docs/CREDIOS_SECURITY_AND_COSTS_v1.md

Objetivo:
Crear una pantalla de simulacion usable que consuma el motor financiero localmente y no guarde datos todavia.

Alcance:
- Formulario para monto, tasa, tipo de tasa, plazo, frecuencia, fecha inicial y costos basicos.
- Resultados: cuota, total interes, total pagado, fecha final.
- Tabla de amortizacion.
- Estados de error.
- Mobile first.
- Microcopy correcto.

Prohibido:
- No persistir en DB.
- No crear auth todavia si no existe.
- No tocar .env.
- No prometer creditos.
- No hacer deploy.

Validar:
- lint
- typecheck
- tests existentes
- captura visual o revision con browser si hay servidor local.
```

## 4. Prompt recomendado para Fase 4 - Auth y persistencia

```txt
Actua como arquitecto SaaS y especialista en seguridad. Vamos a implementar Fase 4: auth, workspace y persistencia inicial para guardar simulaciones.

Lee antes:
- docs/CREDIOS_DATA_MODEL_v1.md
- docs/CREDIOS_SECURITY_AND_COSTS_v1.md
- docs/CREDIOS_TECHNICAL_BLUEPRINT_v1.md

Antes de actuar:
- Confirmar con el usuario si se usara Supabase.
- No tocar .env sin autorizacion explicita.
- No crear credenciales reales.

Objetivo:
Preparar auth/workspace y guardar simulaciones con RLS, usando entorno de desarrollo seguro.

Alcance:
- Configuracion local segura.
- Tablas iniciales si el usuario autoriza migraciones.
- RLS base.
- Workspace personal por defecto.
- Guardar simulacion por accion explicita.
- Repositorios server-only.
- Validacion Zod en servidor.

Prohibido:
- No deploy.
- No produccion.
- No service role en frontend.
- No datos reales.
- No billing.
```

## 5. Prompt recomendado para Fase 5 - Conversion a deuda administrada

```txt
Actua como ingeniero backend/producto financiero. Vamos a implementar Fase 5: simulaciones guardadas y conversion a deuda administrada.

Lee antes:
- docs/CREDIOS_DOMAIN_MODEL_v1.md
- docs/CREDIOS_DATA_MODEL_v1.md
- docs/CREDIOS_FINANCIAL_ENGINE_SPEC_v1.md
- docs/CREDIOS_SECURITY_AND_COSTS_v1.md

Objetivo:
Permitir que una simulacion guardada se convierta explicitamente en deuda administrada con plan de cuotas.

Alcance:
- Lista/detalle de simulaciones.
- Escenario primario.
- Accion "Convertir en deuda administrada".
- Crear credit_account.
- Crear installments.
- Marcar simulacion como converted.
- Crear audit_event.

Reglas:
- Transaccion.
- Confirmacion fuerte.
- No borrar simulacion.
- No pagos reales.
- No otorgamiento de credito.
```

## 6. Checklist para cualquier fase futura

Antes:

- Ejecutar `git status`.
- Confirmar rama.
- Leer docs relevantes.
- Detectar scripts disponibles.
- Identificar si hay cambios del usuario.

Durante:

- Mantener cambios pequenos.
- No tocar `.env` sin autorizacion.
- No introducir secretos.
- No borrar datos.
- No hacer deploy.
- No usar lenguaje de oferta de credito.
- Validar frontend y backend.
- Proteger workspace.

Despues:

- Ejecutar validaciones disponibles.
- Revisar `git status`.
- Reportar archivos creados/modificados.
- Reportar riesgos.
- Confirmar que no se hizo deploy ni acciones fuera de alcance.

## 7. Lenguaje permitido para futuras implementaciones

Usar:

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

Evitar:

- Solicita tu credito.
- Te prestamos.
- Credito aprobado.
- Desembolso inmediato.
- Cupo aprobado.
- Aplica ahora.
- Recibe dinero.
- Preaprobado.
- Financiacion otorgada por CrediOS.

## 8. Notas para otra IA o desarrollador

- El repositorio de Fase 0 empezo vacio.
- La documentacion en `/docs` es la fuente de verdad inicial.
- No hay proveedor cloud configurado en esta fase.
- No hay `.env` creado por Fase 0.
- No hay migraciones reales creadas por Fase 0.
- La recomendacion tecnica es fuerte pero no irreversible: Next.js + Supabase/PostgreSQL + motor financiero puro.
- La decision mas importante del producto es mantener la diferencia entre simular/administrar y otorgar/prestar.
