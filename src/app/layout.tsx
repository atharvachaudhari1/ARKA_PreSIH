import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TeamUp — Find Your Hackathon Team",
    template: "%s | TeamUp",
  },
  description:
    "The verified, semi-anonymous teammate-matching platform for Smart India Hackathon. Browse open teams, check skill gaps, and request to join — all without publicly broadcasting your details.",
  keywords: ["SIH", "Smart India Hackathon", "team formation", "hackathon", "teammates"],
  openGraph: {
    title: "TeamUp — Find Your Hackathon Team",
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
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  );
}
