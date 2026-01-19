import { ShieldX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <ShieldX className="h-14 w-14 text-accent" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary-dark">
          Acceso no autorizado
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          No cuenta con los permisos necesarios para acceder a este recurso.
        </p>
      </div>

      <Button asChild className="bg-secondary hover:bg-secondary-light">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
