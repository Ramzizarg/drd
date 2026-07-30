import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { MetaPixel } from "@/components/MetaPixel";
import { META_PIXEL_ID } from "@/lib/meta-pixel-id";
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
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <MetaPixel />
        <Analytics />
      </body>
    </html>
  );
}
