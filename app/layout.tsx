import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mahalle Skoru — İstanbul İlçe Rehberi",
  description: "Ulaşımdan deprem riskine, 8 parametrede İstanbul ilçe analizi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <SmoothScroll>
          <CustomCursor />
          <Navbar />
          <main className="flex-1" style={{ paddingTop: 64 }}>
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}
