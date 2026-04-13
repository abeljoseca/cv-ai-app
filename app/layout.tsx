import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resumint — Crea tu CV con IA",
  description: "Construye tu perfil profesional y genera CVs optimizados con inteligencia artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full" style={{ background: 'var(--bg-base)' }}>
        {children}
      </body>
    </html>
  );
}