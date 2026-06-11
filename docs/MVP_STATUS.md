# CrediOS MVP Status

Fecha: 2026-06-10  
Estado: MVP funcional avanzado, preparado para configurar Supabase y desplegar en Vercel.

## Implementado

### Base tecnica

- Next.js App Router.
- TypeScript strict.
- Tailwind CSS.
- ESLint.
- Vitest.
- Drizzle schema.
- Migracion SQL inicial con RLS.
- Migracion de hardening beta con RPC transaccionales.
- `.env.example`.

### Auth y workspace

- Login con email/password.
- Signup.
- Callback de Supabase.
- Logout.
- Middleware de rutas privadas.
- Bootstrap de profile/workspace personal sin `service_role`.

### Motor financiero

- `calculateFixedPayment`.
- `generateAmortizationSchedule`.
- `convertAnnualEffectiveToMonthly`.
- `convertNominalAnnualToMonthly`.
- `calculateLoanSummary`.
- `simulateExtraPaymentReduceTerm`.
- `simulateExtraPaymentReducePayment`.
- `moneyToCents`.
- `centsToMoney`.
- `formatMoneyCOP`.
- 10 pruebas unitarias pasando.

### Producto P0

- Landing publica.
- Dashboard.
- Simulador.
- Guardar simulaciones.
- Listar, duplicar y archivar simulaciones.
- Convertir simulacion en deuda administrada.
- Crear clientes.
- Buscar/listar/archivar clientes.
- Crear deudas manuales.
- Listar/archivar deudas.
- Detalle de deuda.
- Plan de pagos.
- Registrar pagos.
- Abonos extraordinarios.
- Comparar reducir plazo vs reducir cuota.
- Recordatorios internos.
- Completar recordatorios.
- Configuracion de perfil/workspace.
- Modo claro/oscuro.
- Responsive desktop/mobile.
- Playwright e2e minimo.

## Validaciones

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

Resultado: pasan.

## No implementado

- Deploy real.
- Datos reales.
- Pagos reales.
- Billing.
- WhatsApp/email/push.
- Storage/adjuntos.
- Tarjetas de credito completas.
- Portal de cliente/deudor.
- Reportes PDF/Excel.
- Playwright e2e completo con usuario real de prueba.

## Decision importante

CrediOS permanece como herramienta para simular, verificar, guardar y administrar informacion financiera. No otorga creditos, no aprueba creditos y no desembolsa dinero.
