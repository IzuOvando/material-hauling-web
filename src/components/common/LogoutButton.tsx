"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogoutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={
        className ??
        "bg-accent hover:bg-accent-light active:bg-accent-dark"
      }
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Cerrar Sesión
    </Button>
  );
}
