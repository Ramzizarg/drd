import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FB_PIXEL_ID || "1456485639472609";

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
  title: "Clara | Boutique officielle",
  description: "Découvrez les produits Clara et commandez facilement en ligne.",
  icons: {
    icon: [
      { url: "/Carla.png", type: "image/png", sizes: "32x32" },
      { url: "/Carla.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/Carla.png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Clara | Boutique officielle",
    description: "Découvrez les produits Clara et commandez facilement en ligne.",
    type: "website",
    images: [
      {
        url: "/Carla.png",
        width: 512,
        height: 512,
        alt: "Clara Boutique officielle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clara | Boutique officielle",
    description: "Découvrez les produits Clara et commandez facilement en ligne.",
    images: ["/Carla.png"],
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
        {/* Facebook Meta Pixel */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt="fb-pixel"
          />
        </noscript>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
