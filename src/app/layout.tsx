import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://clara.shop"
  ),
  title: "DRD Fashion | Boutique officielle",
  description: "Découvrez les produits DRD Fashion et commandez facilement en ligne.",
  icons: {
    icon: [
      { url: "/drd-logo.png", type: "image/png", sizes: "32x32" },
      { url: "/drd-logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/drd-logo.png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "DRD Fashion | Boutique officielle",
    description: "Découvrez les produits DRD Fashion et commandez facilement en ligne.",
    type: "website",
    images: [
      {
        url: "/drd-logo.png",
        width: 720,
        height: 542,
        alt: "DRD Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DRD Fashion | Boutique officielle",
    description: "Découvrez les produits DRD Fashion et commandez facilement en ligne.",
    images: ["/drd-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
      
    </html>
  );
}
