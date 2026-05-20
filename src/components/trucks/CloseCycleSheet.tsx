"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTime } from "luxon";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";
import { formatIsoDate } from "@/helpers/formatters/datetime";
import { parseVoucherFolios } from "@/utils/normalizeVoucherFolio";
import { useToast } from "@/components/ui/use-toast";
import CONFIG from "@/config";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FoundTicket {
  folio: string;
  frenteNombre: string;
  placas: string;
  material: string;
  voucherDatetime: string;
  operador: string;
  odometer: number;
}

interface CloseResult {
  closed: string[];
  failed: Array<{ folio: string; reason: string }>;
}

interface ArrivalEntry {
  odometerArrival: string;
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:mm
}

type ViewState = "input" | "loading" | "preview" | "closing" | "result";

// ─── Validation helpers ───────────────────────────────────────────────────────

function getOdometerError(entry: ArrivalEntry, ticket: FoundTicket): string | null {
  if (entry.odometerArrival === "") return null;

  const trimmed = entry.odometerArrival.trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return "Ingresa un número válido.";

  const intPart = match[1];
  const decPart = match[2] || "";

  if (intPart.length > 7) return "Máximo 7 dígitos enteros.";
  if (decPart.length > 2) return "Máximo 2 decimales.";

  const val = parseFloat(trimmed);
  if (val < ticket.odometer)
    return `El odometro de llegada debe ser mayor o igual al de salida (${ticket.odometer}).`;
  return null;
}

function getDateTimeError(entry: ArrivalEntry, ticket: FoundTicket): string | null {
  const hasDate = entry.arrivalDate !== "";
  const hasTime = entry.arrivalTime !== "";

  if (!hasDate && !hasTime) return null;
  if (hasDate && !hasTime) return "Ingresa también la hora de llegada.";
  if (!hasDate && hasTime) return "Ingresa también la fecha de llegada.";

  const voucherDay = formatIsoDate(new Date(ticket.voucherDatetime))!;
  if (entry.arrivalDate < voucherDay)
    return `La fecha de llegada debe ser igual o posterior a ${voucherDay}.`;
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CloseCycleSheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}

const CloseCycleSheet = ({ open, setOpen, onSuccess }: CloseCycleSheetProps) => {
  const { toast } = useToast();

  const [view, setView] = useState<ViewState>("input");
  const [folioInput, setFolioInput] = useState("");
  const [found, setFound] = useState<FoundTicket[]>([]);
  const [alreadyClosed, setAlreadyClosed] = useState<FoundTicket[]>([]);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [arrivalEntries, setArrivalEntries] = useState<Record<string, ArrivalEntry>>({});
  const [closeResult, setCloseResult] = useState<CloseResult | null>(null);
  const [parseWarnings, setParseWarnings] = useState<{
    invalid: string[];
    duplicatesRemoved: number;
  }>({ invalid: [], duplicatesRemoved: 0 });

  const handleSearch = async () => {
    const { valid, invalid, duplicatesRemoved } = parseVoucherFolios(folioInput);
    setParseWarnings({ invalid, duplicatesRemoved });

    if (valid.length === 0) return;

    setView("loading");

    try {
      const res = await fetch("/api/trucks/lookupFolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folios: valid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al buscar folios.");
      }

      const data = await res.json();
      setFound(data.found ?? []);
      setAlreadyClosed(data.alreadyClosed ?? []);
      setNotFound(data.notFound ?? []);

      const entries: Record<string, ArrivalEntry> = {};
      for (const t of data.found ?? []) {
        entries[t.folio] = { odometerArrival: "", arrivalDate: "", arrivalTime: "" };
      }
      setArrivalEntries(entries);
      setView("preview");
    } catch (err) {
      setView("input");
      toast({
        title: "Error al buscar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleCloseCycles = async () => {
    setView("closing");

    const entries = found.map((t) => {
      const entry = arrivalEntries[t.folio];
      const hasDateTime = entry?.arrivalDate && entry?.arrivalTime;
      let arrivalTimeISO: string | null = null;
      if (hasDateTime) {
        arrivalTimeISO = DateTime.fromISO(
          `${entry.arrivalDate}T${entry.arrivalTime}:00`,
          { zone: CONFIG.TIMEZONE }
        ).toUTC().toISO();
      }
      return {
        folio: t.folio,
        odometerArrival:
          entry?.odometerArrival !== ""
            ? parseFloat(entry.odometerArrival)
            : t.odometer,
        arrivalTime: arrivalTimeISO,
      };
    });

    try {
      const res = await fetch("/api/trucks/closeCycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al cerrar ciclos.");
      }

      const data: CloseResult = await res.json();
      setCloseResult(data);
      setView("result");
    } catch (err) {
      setCloseResult({
        closed: [],
        failed: found.map((t) => ({
          folio: t.folio,
          reason: err instanceof Error ? err.message : "Error de red.",
        })),
      });
      setView("result");
    }
  };

  const handleReset = () => {
    setView("input");
    setFolioInput("");
    setFound([]);
    setAlreadyClosed([]);
    setNotFound([]);
    setArrivalEntries({});
    setCloseResult(null);
    setParseWarnings({ invalid: [], duplicatesRemoved: 0 });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && (view === "loading" || view === "closing")) return;
    setOpen(next);
    if (!next) {
      if (closeResult && closeResult.closed.length > 0) onSuccess?.();
      handleReset();
    }
  };

  const handleArrivalChange = (
    folio: string,
    field: keyof ArrivalEntry,
    value: string
  ) => {
    if (field === "odometerArrival" && value !== "") {
      if (!/^(\d{0,7})(\.\d{0,2})?$/.test(value)) return;
    }
    setArrivalEntries((prev) => ({
      ...prev,
      [folio]: { ...prev[folio], [field]: value },
    }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-primary-light shrink-0">
          <SheetTitle className="text-accent">
            Cierre Manual de Ciclos
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "input" && (
            <InputView
              value={folioInput}
              onChange={setFolioInput}
              onSearch={handleSearch}
              warnings={parseWarnings}
            />
          )}
          {view === "loading" && <LoadingView message="Buscando tickets..." />}
          {view === "preview" && (
            <PreviewView
              found={found}
              alreadyClosed={alreadyClosed}
              notFound={notFound}
              arrivalEntries={arrivalEntries}
              onChangeEntry={handleArrivalChange}
              onBack={() => setView("input")}
              onClose={handleCloseCycles}
            />
          )}
          {view === "closing" && <LoadingView message="Cerrando ciclos..." />}
          {view === "result" && closeResult && (
            <ResultView result={closeResult} onFinish={() => handleOpenChange(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ─── InputView ────────────────────────────────────────────────────────────────

const InputView = ({
  value,
  onChange,
  onSearch,
  warnings,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  warnings: { invalid: string[]; duplicatesRemoved: number };
}) => {
  const { valid } = parseVoucherFolios(value);
  const hasValid = valid.length > 0;

  return (
    <div className="flex flex-col flex-1 px-6 py-5 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-primary">Folios del váucher</label>
        <p className="text-xs text-primary/50">
          Ingresa los folios, uno por línea o separados por comas.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"D2F7-K7M3-P9F2\nA1B2-C3D4-E5F6"}
        className="flex-1 min-h-[200px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 resize-none font-mono"
      />

      {!hasValid && value.trim().length > 0 && (
        <p className="text-xs text-secondary">
          No se encontraron folios con formato válido. Verifica que el formato sea correcto (ej. D2F7-K7M3-P9F2).
        </p>
      )}

      {(warnings.invalid.length > 0 || warnings.duplicatesRemoved > 0) && (
        <div className="flex flex-col gap-1 text-xs">
          {warnings.duplicatesRemoved > 0 && (
            <span className="text-primary/60">
              {warnings.duplicatesRemoved} folio
              {warnings.duplicatesRemoved > 1 ? "s duplicados ignorados" : " duplicado ignorado"}.
            </span>
          )}
          {warnings.invalid.length > 0 && (
            <span className="text-secondary">
              {warnings.invalid.length} folio
              {warnings.invalid.length > 1 ? "s con formato inválido" : " con formato inválido"}:{" "}
              <span className="font-mono">
                {warnings.invalid.slice(0, 3).join(", ")}
                {warnings.invalid.length > 3 ? "…" : ""}
              </span>
            </span>
          )}
        </div>
      )}

      <Button
        className="shrink-0 bg-accent hover:bg-accent-dark active:bg-accent-dark text-white"
        disabled={!hasValid}
        onClick={onSearch}
      >
        Buscar váuchers →
      </Button>
    </div>
  );
};

// ─── PreviewView ──────────────────────────────────────────────────────────────

const PreviewView = ({
  found,
  alreadyClosed,
  notFound,
  arrivalEntries,
  onChangeEntry,
  onBack,
  onClose,
}: {
  found: FoundTicket[];
  alreadyClosed: FoundTicket[];
  notFound: string[];
  arrivalEntries: Record<string, ArrivalEntry>;
  onChangeEntry: (folio: string, field: keyof ArrivalEntry, value: string) => void;
  onBack: () => void;
  onClose: () => void;
}) => {
  const hasValidationError = found.some((t) => {
    const entry = arrivalEntries[t.folio];
    if (!entry) return false;
    return !!getOdometerError(entry, t) || !!getDateTimeError(entry, t);
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Summary badges */}
      <div className="px-6 py-3 border-b border-primary-light flex flex-wrap gap-2 shrink-0">
        <Badge className="bg-green-100 text-green-800 border-green-400 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {found.length} listo{found.length !== 1 ? "s" : ""}
        </Badge>
        {alreadyClosed.length > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-400 hover:bg-amber-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            {alreadyClosed.length} previamente cerrado
            {alreadyClosed.length !== 1 ? "s" : ""}
          </Badge>
        )}
        {notFound.length > 0 && (
          <Badge className="bg-red-100 text-secondary border-red-300 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            {notFound.length} no encontrado
            {notFound.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="py-4 flex flex-col gap-4">

          {/* Found IN_TRANSIT */}
          {found.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Listos para cerrar
              </p>
              {found.map((ticket) => {
                const entry = arrivalEntries[ticket.folio] ?? { odometerArrival: "", arrivalDate: "", arrivalTime: "" };
                const odomError = getOdometerError(entry, ticket);
                const dateError = getDateTimeError(entry, ticket);
                return (
                  <div
                    key={ticket.folio}
                    className="rounded-lg border-2 border-green-300 bg-green-50 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-mono font-semibold text-sm text-accent">
                        {formatVoucherId(ticket.folio)}
                      </span>
                      <span className="text-xs text-primary/50">
                        {ticket.frenteNombre}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary/70">
                      <span>Placas: <b className="text-primary">{ticket.placas}</b></span>
                      <span>Material: <b className="text-primary">{ticket.material}</b></span>
                      <span>Fecha: <b className="text-primary">{formatIsoDate(new Date(ticket.voucherDatetime))}</b></span>
                    </div>

                    {/* Fields row */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-primary/60">
                          Odómetro llegada <span className="text-primary/40">(opcional)</span>
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="km/mi"
                          className="h-8 w-32 text-sm"
                          value={entry.odometerArrival}
                          onChange={(e) =>
                            onChangeEntry(ticket.folio, "odometerArrival", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-primary/60">
                          Fecha llegada <span className="text-primary/40">(opcional)</span>
                        </label>
                        <DatePicker
                          value={entry.arrivalDate}
                          onChange={(v) => onChangeEntry(ticket.folio, "arrivalDate", v)}
                          placeholder="dd/mm/aaaa"
                          className="h-8 w-36 text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-primary/60">
                          Hora llegada <span className="text-primary/40">(opcional)</span>
                        </label>
                        <input
                          type="time"
                          className="flex h-8 w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                          value={entry.arrivalTime}
                          onChange={(e) =>
                            onChangeEntry(ticket.folio, "arrivalTime", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Validation errors below fields */}
                    {(odomError || dateError) && (
                      <div className="flex flex-col gap-0.5">
                        {odomError && (
                          <p className="text-xs text-secondary">{odomError}</p>
                        )}
                        {dateError && (
                          <p className="text-xs text-secondary">{dateError}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Already closed */}
          {alreadyClosed.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Previamente cerrados
              </p>
              {alreadyClosed.map((ticket) => (
                <div
                  key={ticket.folio}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 flex items-center justify-between"
                >
                  <span className="font-mono text-sm text-amber-700">
                    {formatVoucherId(ticket.folio)}
                  </span>
                  <span className="text-xs text-amber-600">{ticket.frenteNombre}</span>
                </div>
              ))}
            </div>
          )}

          {/* Not found */}
          {notFound.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide">
                No encontrados
              </p>
              <p className="text-xs text-primary/40">
                Verifica si la partida fue procesada o si el folio es correcto en el documento.
              </p>
              {notFound.map((folio) => (
                <div
                  key={folio}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2"
                >
                  <span className="font-mono text-sm text-secondary">
                    {formatVoucherId(folio)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {found.length === 0 && alreadyClosed.length === 0 && notFound.length === 0 && (
            <p className="text-center text-sm text-primary/40 py-8">
              No se encontraron resultados.
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-6 py-4 border-t border-primary-light flex gap-3">
        <Button variant="outline" className="flex-1 border-primary/20 text-primary" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button
          className="flex-1 bg-accent hover:bg-accent-dark active:bg-accent-dark text-white"
          disabled={found.length === 0 || hasValidationError}
          onClick={onClose}
        >
          Cerrar {found.length > 0 ? `${found.length} ` : ""}
          ciclo{found.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
};

// ─── LoadingView ──────────────────────────────────────────────────────────────

const LoadingView = ({ message }: { message: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-primary/50">
    <Loader2 className="h-10 w-10 animate-spin text-accent" />
    <p className="text-sm">{message}</p>
  </div>
);

// ─── ResultView ───────────────────────────────────────────────────────────────

const ResultView = ({
  result,
  onFinish,
}: {
  result: CloseResult;
  onFinish: () => void;
}) => {
  const allOk = result.failed.length === 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 flex flex-col gap-4">
          {result.closed.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border-2 border-green-400 bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">
                  {result.closed.length} ciclo
                  {result.closed.length !== 1 ? "s cerrados" : " cerrado"} correctamente
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.closed.map((folio) => (
                    <span
                      key={folio}
                      className="font-mono text-xs bg-green-100 text-green-800 border border-green-300 rounded px-1.5 py-0.5"
                    >
                      {formatVoucherId(folio)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <XCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-secondary">
                  {result.failed.length} folio
                  {result.failed.length !== 1 ? "s no se pudieron" : " no se pudo"} cerrar
                </p>
                {result.failed.map(({ folio, reason }) => (
                  <div key={folio} className="text-sm">
                    <span className="font-mono text-secondary">{formatVoucherId(folio)}</span>
                    <span className="text-primary/60"> — {reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allOk && result.closed.length === 0 && (
            <p className="text-center text-sm text-primary/40 py-8">
              No se realizó ninguna acción.
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-6 py-4 border-t border-primary-light">
        <Button
          className="w-full bg-accent hover:bg-accent-dark active:bg-accent-dark text-white"
          onClick={onFinish}
        >
          {allOk ? "Listo" : "Cerrar"}
        </Button>
      </div>
    </div>
  );
};

export default CloseCycleSheet;
