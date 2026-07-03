import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIP — Universal Integration Platform",
  description:
    "Connect SaaS services to websites without storing customer data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
