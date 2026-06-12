"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivateAppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Algo no cargo bien</CardTitle>
        <CardDescription>
          Reintenta la accion o vuelve a Mis finanzas. Si el problema se repite, revisaremos la ruta especifica.
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
  );
}
