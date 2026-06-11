import Link from "next/link";
import { ArrowRight, Bell, Calculator, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Calculator,
    title: "Simulaciones claras",
    text: "Calcula cuotas, intereses, costos y tablas de amortizacion antes de tomar decisiones.",
  },
  {
    icon: CreditCard,
    title: "Deudas y cartera",
    text: "Registra deudas manuales, clientes, pagos y abonos sin convertir CrediOS en prestamista.",
  },
  {
    icon: Bell,
    title: "Recordatorios internos",
    text: "Organiza proximas fechas de pago y vencimientos desde un panel privado.",
  },
  {
    icon: ShieldCheck,
    title: "Base segura",
    text: "Diseñado con workspaces, RLS, validacion y auditoria para datos financieros sensibles.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff8f3,transparent_34%),linear-gradient(180deg,#f8fafc,#eef4f7)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,#134e4a,transparent_30%),linear-gradient(180deg,#07111f,#0b1220)] dark:text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-teal-700 dark:text-teal-300">
              CrediOS by Sanvat
            </p>
            <h1 className="text-lg font-semibold">Sistema financiero de simulacion y seguimiento</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-sm font-medium text-teal-800 shadow-sm dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200">
              No otorga creditos. Te ayuda a entenderlos y administrarlos.
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Simula, compara y administra deudas con precision.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-650 dark:text-slate-300">
              CrediOS organiza simulaciones, cuotas, pagos, abonos, clientes y recordatorios para uso
              personal o gestion de cartera. Todo con lenguaje claro, trazabilidad y una base preparada
              para Supabase/PostgreSQL.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Empezar <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="bg-white/80 shadow-sm backdrop-blur dark:bg-slate-900/80">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white dark:bg-teal-300 dark:text-teal-950">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pillar.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{pillar.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
