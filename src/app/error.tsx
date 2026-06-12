"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Algo no cargo bien</CardTitle>
          <CardDescription>
            La app encontro un problema temporal. Tus datos no se muestran aqui para proteger informacion sensible.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={reset} className="w-full sm:w-auto">
            Reintentar
          </Button>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/finanzas">Ir a Mis finanzas</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
