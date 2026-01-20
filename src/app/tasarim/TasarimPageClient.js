"use client";

import dynamic from "next/dynamic";

const TasarimClient = dynamic(() => import("./TasarimClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white grid place-items-center">
      Yükleniyor...
    </div>
  ),
});

export default function TasarimPageClient() {
  return <TasarimClient />;
}
