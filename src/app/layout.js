import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
