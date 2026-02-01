import { Suspense } from "react";
import TasarimClient from "./TasarimClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
          Yükleniyor...
        </div>
      }
    >
      <TasarimClient />
    </Suspense>
  );
}
