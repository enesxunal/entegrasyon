import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIP — Evrensel Entegrasyon Platformu",
  description:
    "SaaS servislerini web sitelerine bağlayın — müşteri verilerini saklamadan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
