import { Suspense } from "react";
import TasarimClient from "./TasarimClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white grid place-items-center">Yükleniyor...</div>}>
      <TasarimClient />
    </Suspense>
  );
}
