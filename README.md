# CrediOS by Sanvat

CrediOS es una aplicacion para simular, guardar, comparar y administrar creditos, deudas, clientes, pagos, abonos, recordatorios y cartera.

CrediOS no presta dinero, no aprueba creditos y no desembolsa fondos.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Drizzle ORM / Drizzle Kit
- React Hook Form preparado, Zod, decimal.js
- Vitest para el motor financiero
- Vercel como hosting recomendado

## Primeros pasos

```bash
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Si tu proyecto de Supabase entrega `anon key` legacy, puedes usar `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Base de datos

El schema Drizzle esta en:

```txt
src/lib/db/schema.ts
```

La migracion SQL inicial con tablas, indices, triggers y RLS esta en:

```txt
src/lib/db/migrations/0001_initial_schema_and_rls.sql
```

Aplica esa migracion en Supabase antes de usar la app con datos reales.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:run
npm run db:generate
npm run db:migrate
npm run db:push
```

## Modulos MVP

- Auth Supabase: login, signup, callback y logout.
- Workspace personal por usuario.
- Dashboard.
- Simulador de credito de cuota fija.
- Guardado de simulaciones.
- Conversion de simulacion a deuda administrada.
- Clientes.
- Creditos/deudas.
- Pagos.
- Abonos extraordinarios con comparacion de reducir plazo vs reducir cuota.
- Recordatorios internos.
- Configuracion basica.
- Modo claro/oscuro.

## Seguridad

- No usar `service_role` en frontend.
- No exponer `DATABASE_URL`.
- No commitear `.env.local`.
- Usar RLS para tablas sensibles.
- Validar en server actions con Zod.
- No guardar datos reales en desarrollo.

## Validaciones actuales

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Todas pasan en la version actual.
