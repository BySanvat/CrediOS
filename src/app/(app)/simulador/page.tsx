import { PageHeader } from "@/components/layout/page-header";
import { SimulatorClient } from "@/features/simulator/simulator-client";

export default function SimulatorPage() {
  return (
    <>
      <PageHeader
        title="Simulador"
        description="Simula cuotas, intereses, costos y tabla de amortizacion. CrediOS no otorga creditos; esta pantalla ayuda a comparar escenarios."
      />
      <SimulatorClient />
    </>
  );
}
