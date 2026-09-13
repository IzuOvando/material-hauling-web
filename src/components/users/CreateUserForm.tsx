"use client";

import { useState, useMemo } from "react";
import sha256 from "crypto-js/sha256";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Search,
} from "lucide-react";
import type { StepId } from "@/types";
import { Stepper } from "./Stepper";
import { getProject } from "@/helpers/strings";
import whiteLabelConfig from "../../../white-label.config";

const FORM_INITIAL = {
  username:   "",
  password:   "",
  rol:        "",
  nombre:     "",
  apPaterno:  "",
  apMaterno:  "",
  noEmpleado: "",
};

interface CreateUserFormProps {
  frentes: string[];
}

export function CreateUserForm({ frentes }: CreateUserFormProps) {
  const { toast } = useToast();

  const [step, setStep]           = useState<StepId>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm]           = useState(FORM_INITIAL);
  const [createdUsername, setCreatedUsername] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);

  const [selectedFrentes, setSelectedFrentes] = useState<string[]>([]);
  const [search, setSearch]                   = useState("");
  const [openGroups, setOpenGroups]           = useState<Set<string>>(new Set());


  const passwordsMatch =
    form.password.length > 0 && confirmPassword.length > 0
      ? form.password === confirmPassword
      : null;

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const frente of frentes) {
      const project = getProject(frente);
      if (!map[project]) map[project] = [];
      map[project].push(frente);
    }
    return map;
  }, [frentes]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [project, frenteList] of Object.entries(grouped)) {
      if (project.toLowerCase().includes(q)) {
        result[project] = frenteList;
      } else {
        const matches = frenteList.filter((f) => f.toLowerCase().includes(q));
        if (matches.length > 0) result[project] = matches;
      }
    }
    return result;
  }, [grouped, search]);

  const showError = (message: string) => {
    toast({ title: "Error", description: message, variant: "destructive", duration: 3000 });
  };

  const handleFieldChange = (field: keyof typeof FORM_INITIAL, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGroup = (project: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  };

  const isGroupOpen = (project: string) =>
    search.trim() ? true : openGroups.has(project);

  const handleFrenteToggle = (frente: string) => {
    setSelectedFrentes((prev) =>
      prev.includes(frente) ? prev.filter((f) => f !== frente) : [...prev, frente]
    );
  };

  const handleReset = () => {
    setForm(FORM_INITIAL);
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setSelectedFrentes([]);
    setCreatedUsername("");
    setSearch("");
    setOpenGroups(new Set());
    setStep(1);
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    const { username, password, rol, nombre, apPaterno, noEmpleado } = form;

    if (!username || !password || !rol || !nombre || !apPaterno || !noEmpleado) {
      showError((whiteLabelConfig as any)?.ui?.users?.form?.requiredFields || "Completa todos los campos obligatorios.");
      return;
    }
    if (password.length <= 6) {
      showError((whiteLabelConfig as any)?.ui?.users?.form?.passwordMin || "La contraseña debe tener más de 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      showError((whiteLabelConfig as any)?.ui?.users?.form?.passwordMismatch || "Las contraseñas no coinciden.");
      return;
    }

    const hashedPassword = sha256(password).toString();

    setIsLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          rol,
          nombre,
          apPaterno,
          apMaterno: form.apMaterno || undefined,
          noEmpleado,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === "Username already exists") {
          showError((whiteLabelConfig as any)?.ui?.users?.form?.usernameExists || "El nombre de usuario ya existe.");
        } else if (data.message?.includes("Password length")) {
          showError((whiteLabelConfig as any)?.ui?.users?.form?.passwordMin || "La contraseña debe tener más de 6 caracteres.");
        } else {
          showError((whiteLabelConfig as any)?.ui?.users?.form?.createError || "Ocurrió un error al crear el usuario.");
        }
        return;
      }

      setCreatedUsername(data.username);
      setStep(2);
    } catch {
      showError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsignarFrentes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/assign-frentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: createdUsername,
          add: selectedFrentes,
          remove: [],
        }),
      });

      if (!res.ok) {
        showError((whiteLabelConfig as any)?.ui?.users?.form?.assignFrentesError || "Error al asignar los frentes.");
        return;
      }

      setStep(3);
    } catch {
      showError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOmitirFrentes = () => setStep(3);

  return (
    <div className="flex justify-center mt-3 pb-1">
      <div className="w-full max-w-xl">
        <Stepper currentStep={step} />
        <div className="border-2 border-primary-light rounded-lg overflow-hidden shadow-md">

          {step === 1 && (
            <>
                      <div className="bg-primary px-4 py-3">
                      <h2 className="text-lg font-semibold text-accent">{(whiteLabelConfig as any)?.ui?.users?.create?.title || 'Datos del nuevo usuario'}</h2>
                      <p className="text-xs text-white/70 mt-0.5">{(whiteLabelConfig as any)?.ui?.users?.create?.subtitle || 'Paso 1 de 3 — Información de acceso e identidad'}</p>
                    </div>

              <form onSubmit={handleCrearUsuario}>
                <div className="p-4 bg-white space-y-3">
                  <div className="grid grid-cols-2 gap-3">

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="username">{(whiteLabelConfig as any)?.ui?.users?.create?.usernameLabel || 'Nombre de usuario *'}</Label>
                      <Input
                        id="username"
                        placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.usernamePlaceholder || 'Ej. checador01'}
                        value={form.username}
                        onChange={(e) => handleFieldChange("username", e.target.value)}
                        className="shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="noEmpleado">{(whiteLabelConfig as any)?.ui?.users?.create?.employeeLabel || 'No. de empleado *'}</Label>
                      <Input
                        id="noEmpleado"
                        placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.employeePlaceholder || 'Ej. EMP-001'}
                        value={form.noEmpleado}
                        onChange={(e) => handleFieldChange("noEmpleado", e.target.value)}
                        className="shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password">{(whiteLabelConfig as any)?.ui?.users?.create?.passwordLabel || 'Contraseña *'}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.passwordPlaceholder || 'Mínimo 7 caracteres'}
                          value={form.password}
                          onChange={(e) => handleFieldChange("password", e.target.value)}
                          onBlur={() => setPasswordBlurred(true)}
                          onPaste={(e) => e.preventDefault()}
                          className="pr-10 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordBlurred && form.password.length > 0 && form.password.length <= 6 && (
                        <p className="text-xs text-red-400">{(whiteLabelConfig as any)?.ui?.users?.form?.passwordMin || 'La contraseña debe tener más de 6 caracteres'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="confirmPassword">{(whiteLabelConfig as any)?.ui?.users?.create?.confirmPasswordLabel || 'Confirmar contraseña *'}</Label>
                      <div className="flex flex-col gap-1">
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.confirmPasswordPlaceholder || 'Repetir contraseña'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                          <p className="text-xs text-red-400">{(whiteLabelConfig as any)?.ui?.users?.form?.passwordMismatch || 'Las contraseñas no coinciden'}</p>
                        )}
                        {passwordsMatch === true && (
                          <p className="text-xs text-green-600">{(whiteLabelConfig as any)?.ui?.users?.form?.passwordMatch || 'Las contraseñas coinciden ✓'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="rol">{(whiteLabelConfig as any)?.ui?.users?.create?.roleLabel || 'Rol *'}</Label>
                      <Select value={form.rol} onValueChange={(v) => handleFieldChange("rol", v)}>
                        <SelectTrigger id="rol" className="shadow-sm">
                          <SelectValue placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.rolePlaceholder || 'Selecciona un rol'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Checador</SelectItem>
                          <SelectItem value="admin">IRO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="nombre">{(whiteLabelConfig as any)?.ui?.users?.create?.nameLabel || 'Nombre(s) *'}</Label>
                      <Input
                        id="nombre"
                        placeholder={(whiteLabelConfig as any)?.ui?.users?.form?.namePlaceholder || 'Ej. Juan'}
                        value={form.nombre}
                        onChange={(e) => handleFieldChange("nombre", e.target.value)}
                        className="shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="apPaterno">{(whiteLabelConfig as any)?.ui?.users?.create?.firstSurnameLabel || 'Apellido paterno *'}</Label>
                      <Input
                        id="apPaterno"
                        placeholder={(whiteLabelConfig as any)?.ui?.users?.form?.surnamePlaceholder || 'Ej. García'}
                        value={form.apPaterno}
                        onChange={(e) => handleFieldChange("apPaterno", e.target.value)}
                        className="shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="apMaterno">
                        {(whiteLabelConfig as any)?.ui?.users?.create?.secondSurnameLabel || 'Apellido materno'}{" "}
                        <span className="text-muted-foreground font-normal">{(whiteLabelConfig as any)?.ui?.users?.create?.secondSurnameOptional || '(opcional)'}</span>
                      </Label>
                      <Input
                        id="apMaterno"
                        placeholder={(whiteLabelConfig as any)?.ui?.users?.form?.secondSurnamePlaceholder || 'Ej. López'}
                        value={form.apMaterno}
                        onChange={(e) => handleFieldChange("apMaterno", e.target.value)}
                        className="shadow-sm"
                      />
                    </div>

                  </div>
                </div>

                <div className="px-4 pb-4 bg-white">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? (whiteLabelConfig as any)?.ui?.users?.create?.creating || "Creando usuario..." : (whiteLabelConfig as any)?.ui?.users?.create?.createButton || "Continuar →"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (() => {
            const projectEntries = Object.entries(filteredGroups);
            const noResults = search.trim() && projectEntries.length === 0;

            return (
              <>
                <div className="bg-primary px-4 py-3">
                  <h2 className="text-lg font-semibold text-accent">{(whiteLabelConfig as any)?.ui?.users?.create?.stepTwoTitle || 'Asignar frentes'}</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    {(whiteLabelConfig as any)?.ui?.users?.create?.stepTwoDescription || 'Paso 2 de 3 — Usuario {username} creado. Selecciona los frentes a los que tendrá acceso.'}
                    {" "}
                    <span className="font-semibold text-white">{createdUsername}</span>
                  </p>
                </div>

                <div className="p-5 bg-white space-y-3">
                  {frentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{(whiteLabelConfig as any)?.ui?.frentesManager?.noRegistered || "No hay frentes registrados."}</p>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={(whiteLabelConfig as any)?.ui?.users?.create?.searchPlaceholder || 'Buscar proyecto o frente...'}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 shadow-sm"
                        />
                      </div>

                      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                        {noResults ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {(whiteLabelConfig as any)?.ui?.frentesManager?.noResultsPrefix || "Sin resultados para"} &quot;{search}&quot;
                          </p>
                        ) : (
                          projectEntries.map(([project, frenteList]) => {
                            const selectedInGroup = frenteList.filter((f) =>
                              selectedFrentes.includes(f)
                            ).length;
                            const open = isGroupOpen(project);

                            return (
                              <div key={project} className="rounded-md border border-primary-light/40 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(project)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-primary/5 rounded-md transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    {open ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    {project}
                                  </span>
                                  {selectedInGroup > 0 && (
                                    <span className="text-xs bg-secondary text-white rounded-full px-2 py-0.5">
                                      {selectedInGroup}/{frenteList.length}
                                    </span>
                                  )}
                                </button>

                                {open && (
                                  <div className="px-3 pb-2 space-y-2 border-t border-primary-light/30 pt-2 bg-gray-50">
                                    {frenteList.map((frente) => {
                                      const subLabel = frente.substring(project.length + 1);
                                      return (
                                        <div key={frente} className="flex items-center gap-3 pl-4">
                                          <Checkbox
                                            id={`frente-${frente}`}
                                            checked={selectedFrentes.includes(frente)}
                                            onCheckedChange={() => handleFrenteToggle(frente)}
                                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-white"
                                          />
                                          <Label
                                            htmlFor={`frente-${frente}`}
                                            className="cursor-pointer font-normal text-sm"
                                          >
                                            {subLabel}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      onClick={handleAsignarFrentes}
                      disabled={isLoading || selectedFrentes.length === 0}
                      className="w-full bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {(whiteLabelConfig as any)?.ui?.users?.create?.assignButton || 'Asignar frentes'} ({selectedFrentes.length} seleccionados)
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleOmitirFrentes}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {(whiteLabelConfig as any)?.ui?.users?.create?.omitButton || 'Omitir por ahora'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground pt-1">
                      ¿Necesitas corregir los datos del usuario?{" "}
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        {(whiteLabelConfig as any)?.ui?.users?.create?.backToStepOne || 'Volver al paso 1'}
                      </button>
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

          {step === 3 && (
            <>
              <div className="bg-primary px-4 py-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-accent">{(whiteLabelConfig as any)?.ui?.users?.create?.successTitle || 'Usuario registrado exitosamente'}</h2>
              </div>
              <div className="p-5 bg-white">
                <p className="text-muted-foreground text-sm">
                  {(whiteLabelConfig as any)?.ui?.users?.create?.successDescription || 'El usuario {username} fue creado {suffix}'}
                  <span className="font-semibold text-foreground">{createdUsername}</span>
                  {selectedFrentes.length > 0
                    ? ` ${(whiteLabelConfig as any)?.ui?.users?.form?.assignSummarySuffix || 'y se le asignaron'} ${selectedFrentes.length} ${(whiteLabelConfig as any)?.ui?.users?.form?.frontsSuffix || 'frente(s).'}`
                    : ` ${(whiteLabelConfig as any)?.ui?.users?.form?.noFrentesAssigned || 'sin frentes asignados.'}`}
                </p>
                <Button
                  onClick={handleReset}
                  className="w-full mt-4 bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
                >
                  {(whiteLabelConfig as any)?.ui?.users?.create?.successButton || 'Registrar otro usuario'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
