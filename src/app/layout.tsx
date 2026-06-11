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
            "try{const r=document.documentElement;const t=localStorage.getItem('credios-theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.classList.toggle('dark',d);const m=document.cookie.match(/(?:^|; )credios_accent_color=([^;]+)/);let a=localStorage.getItem('credios-accent-color')||(m&&decodeURIComponent(m[1]))||'apple-green';const map={apple:'apple-green',sage:'apple-green',teal:'mint',coral:'peach',amber:'honey'};a=map[a]||a;if(['apple-green','mint','sky','lavender','rose','peach','honey'].includes(a))r.dataset.accent=a}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
