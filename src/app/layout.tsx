import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

// Self-hosted via next/font — zero external network request, no FOUT
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TeamUp",
    template: "%s | TeamUp",
  },
  description:
    "The verified, semi-anonymous teammate-matching platform for Smart India Hackathon. Browse open teams, check skill gaps, and request to join — all without publicly broadcasting your details.",
  keywords: ["SIH", "Smart India Hackathon", "team formation", "hackathon", "teammates"],
  openGraph: {
    title: "TeamUp",
    description:
      "Verified teammate-matching for Smart India Hackathon. Browse open teams and join without publicly broadcasting your details.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
