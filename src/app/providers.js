"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";

export default function Providers({ children }) {
  return <CartProvider>{children}</CartProvider>;
}
