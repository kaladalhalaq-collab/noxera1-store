import type { Metadata, Viewport } from "next";
import { Cairo, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/locale";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const arabic = Cairo({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "NOXÉRA | Beyond Limits. Beyond Ordinary.", template: "%s | NOXÉRA" },
  description: "NOXÉRA: luxury athletic fashion, premium gymwear and modern lifestyle clothing.",
  openGraph: { title: "NOXÉRA", description: "Beyond Limits. Beyond Ordinary.", images: ["/images/noxera-founder.png"], type: "website" },
};
export const viewport: Viewport = { themeColor: "#080808" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${display.variable} ${sans.variable} ${arabic.variable}`}>
      <body className={locale === "ar" ? "font-arabic" : "font-sans"}>
        <Providers initialLocale={locale}>
          <Header />
          <main className="min-h-screen pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
