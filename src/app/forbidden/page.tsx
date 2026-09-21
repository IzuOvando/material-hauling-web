import { ShieldX } from "lucide-react";
import { ForbiddenActions } from "./ForbiddenActions";

export default function ForbiddenPage() {
  return (
    <main className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 text-center">
      <ShieldX className="h-20 w-20 text-accent" />

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">
          Acceso no autorizado
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          No cuenta con los permisos necesarios para acceder a este recurso.
        </p>
      </div>

      <ForbiddenActions />
    </main>
  );
}
