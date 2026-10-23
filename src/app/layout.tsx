import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Missaha DECO مساحة — Rangement mural décoratif en Algérie",
  description:
    "Missaha DECO — meubles muraux de rangement décoratifs. Livraison 58 wilayas, paiement à la livraison. Commandez sur WhatsApp.",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
  openGraph: {
    title: "Missaha DECO مساحة — Rangement mural décoratif",
    description:
      "Meubles muraux de rangement décoratifs. Livraison 58 wilayas, paiement à la livraison.",
    images: ["/logo.jpg"],
    locale: "fr_DZ",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${arabic.variable} h-full`}>
      <body className="min-h-full bg-white font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
