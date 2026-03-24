import "./globals.css";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { AppShell } from "../components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Harmony Jewels — Marketing intelligence",
  description: "UK luxury jewellery market insights, trends, and planning tools for your team.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${display.variable}`}>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
