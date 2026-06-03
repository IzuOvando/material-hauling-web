import Link from "next/link";
import { FrenteReset } from "@/store";

export default function NotFound() {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-6">
      <FrenteReset />
      <div className="flex flex-col items-center text-center gap-6 max-w-sm">
        <div className="flex items-end gap-1 leading-none select-none">
          <span className="text-[96px] font-semibold text-secondary">4</span>
          <span className="text-[96px] font-semibold text-secondary">0</span>
          <span className="text-[96px] font-semibold text-secondary">4</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">Página no encontrada</h1>
          <p className="text-sm text-slate-500">
            El recurso que buscas no existe o fue movido.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-colors duration-200"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
