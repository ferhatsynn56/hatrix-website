import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ErrorBoundary>
          <CartProvider>{children}</CartProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
