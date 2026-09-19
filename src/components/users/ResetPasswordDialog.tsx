"use client";

import { useState, useEffect } from "react";
import sha256 from "crypto-js/sha256";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import whiteLabelConfig from "../../../white-label.config";

interface ResetPasswordDialogProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  username,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setShowConfirm(false);
      setError(null);
    }
  }, [open]);

  const passwordsMatch =
    password.length > 0 && confirm.length > 0
      ? password === confirm
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length <= 6) {
      setError((whiteLabelConfig as any)?.ui?.users?.form?.passwordMin || "La contraseña debe tener más de 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError((whiteLabelConfig as any)?.ui?.users?.form?.passwordMismatch || "Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const hashedPassword = sha256(password).toString();

      const res = await fetch(`/api/user/${username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: hashedPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message?.includes("not found")) {
          setError((whiteLabelConfig as any)?.ui?.users?.resetDialog?.userNotFound || "Usuario no encontrado.");
        } else {
          setError((whiteLabelConfig as any)?.ui?.users?.resetDialog?.updateError || "Error al actualizar la contraseña.");
        }
        return;
      }

      toast({
        title: (whiteLabelConfig as any)?.ui?.users?.resetDialog?.successTitle || "Contraseña actualizada",
        description: ((whiteLabelConfig as any)?.ui?.users?.resetDialog?.successDescription || `La contraseña de ${username} fue restablecida correctamente.`),
        variant: "success",
      });
      onOpenChange(false);
    } catch {
      setError((whiteLabelConfig as any)?.ui?.users?.form?.connectionError || "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isLoading) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{(whiteLabelConfig as any)?.ui?.users?.actions?.resetPasswordTitle || 'Restablecer contraseña'}</DialogTitle>
          <DialogDescription>
            {(whiteLabelConfig as any)?.ui?.users?.actions?.resetPasswordDescription || 'Establece una nueva contraseña para'}{" "}
            <span className="font-mono font-semibold">{username}</span>.
            {(whiteLabelConfig as any)?.ui?.users?.actions?.resetPasswordNote || ' No se requiere la contraseña anterior.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 py-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-password">{(whiteLabelConfig as any)?.ui?.users?.resetDialog?.newPasswordLabel || "Nueva contraseña *"}</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.passwordPlaceholder || "Mínimo 7 caracteres"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  className="pr-10 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? ((whiteLabelConfig as any)?.ui?.login?.hidePassword || "Ocultar contraseña") : ((whiteLabelConfig as any)?.ui?.login?.showPassword || "Mostrar contraseña")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-confirm">{(whiteLabelConfig as any)?.ui?.users?.create?.confirmPasswordLabel || "Confirmar contraseña *"}</Label>
              <div className="relative">
                <Input
                  id="reset-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.confirmPasswordPlaceholder || "Repetir contraseña"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  className="pr-10 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordsMatch === false && (
                <p className="text-xs text-red-400">{(whiteLabelConfig as any)?.ui?.users?.form?.passwordMismatch || "Las contraseñas no coinciden"}</p>
              )}
              {passwordsMatch === true && (
                <p className="text-xs text-green-600">{(whiteLabelConfig as any)?.ui?.users?.form?.passwordMatch || "Las contraseñas coinciden ✓"}</p>
              )}
            </div>

          </div>

          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? ((whiteLabelConfig as any)?.ui?.general?.saving || 'Guardando...') : ((whiteLabelConfig as any)?.ui?.users?.actions?.resetPasswordTitle || 'Restablecer contraseña')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordDialog;
