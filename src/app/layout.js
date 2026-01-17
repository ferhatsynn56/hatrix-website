import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Sepet mantığını buraya import ediyoruz
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stenist | Design Studio",
  description: "Automotive Fashion & Custom Design",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* BÜTÜN UYGULAMAYI CARTPROVIDER İLE SARIYORUZ.
            Böylece sepete eklenen ürünler anasayfada, tasarımda 
            veya sepet sayfasında kaybolmaz.
        */}
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}