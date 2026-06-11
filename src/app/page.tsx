import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    mark: "S",
    title: "Simulaciones claras",
    text: "Calcula cuotas, intereses, costos y tablas de amortizacion antes de tomar decisiones.",
  },
  {
    mark: "D",
    title: "Deudas y cartera",
    text: "Registra deudas manuales, clientes, pagos y abonos sin convertir CrediOS en prestamista.",
  },
  {
    mark: "R",
    title: "Recordatorios internos",
    text: "Organiza proximas fechas de pago y vencimientos desde un panel privado.",
  },
  {
    mark: "B",
    title: "Base segura",
    text: "Disenado con workspaces, RLS, validacion y auditoria para datos financieros sensibles.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_34%),linear-gradient(180deg,var(--background),var(--surface-warm))] text-foreground">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <nav className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-accent">CrediOS by Sanvat</p>
            <h1 className="text-lg font-semibold">Sistema financiero de simulacion y seguimiento</h1>
          </div>
          <div className="flex shrink-0 gap-2">
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
            <p className="mb-4 inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-medium text-accent shadow-sm">
              No otorga creditos. Te ayuda a entenderlos y administrarlos.
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Simula, compara y administra deudas con precision.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              CrediOS organiza simulaciones, cuotas, pagos, abonos, clientes y recordatorios para uso
              personal o gestion de cartera. Todo con lenguaje claro, trazabilidad y una base preparada
              para Supabase/PostgreSQL.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Empezar</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="bg-card/85 shadow-sm backdrop-blur">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <span className="text-sm font-semibold">{pillar.mark}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{pillar.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{pillar.text}</p>
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
