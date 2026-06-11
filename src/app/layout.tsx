import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrediOS by Sanvat",
  description: "Simula, guarda y administra creditos, deudas, pagos, abonos y cartera.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('credios-theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
