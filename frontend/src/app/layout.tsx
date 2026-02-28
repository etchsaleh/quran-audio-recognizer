import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const arabic = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "Quran",
  description: "Identify verses by recitation. Hold to listen.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Quran" },
};

export const viewport: Viewport = {
  themeColor: "#181621",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${arabic.variable}`}>
      <body className="font-display bg-app-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}

