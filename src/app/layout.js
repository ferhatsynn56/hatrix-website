import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import PerformanceOverlay from "@/components/Debug/PerformanceOverlay";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ErrorBoundary>
          <CartProvider>{children}</CartProvider>
          <PerformanceOverlay />
        </ErrorBoundary>
      </body>
    </html>
  );
}
