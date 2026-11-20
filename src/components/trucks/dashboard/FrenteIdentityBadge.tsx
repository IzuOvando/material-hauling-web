import whiteLabelConfig from "#/white-label.config";

interface FrenteIdentityBadgeProps {
  frente: string;
  displayName?: string;
  logoUrl?: string;
}

function splitFrente(frente: string) {
  const dash = frente.indexOf("-");
  if (dash <= 0) return { project: frente, suffix: "" };
  return { project: frente.slice(0, dash), suffix: frente.slice(dash + 1) };
}

export function FrenteIdentityBadge({
  frente,
  displayName,
  logoUrl,
}: FrenteIdentityBadgeProps) {
  const { project, suffix } = splitFrente(frente);

  // Hidden below lg: at md a long tenant tagline runs under it.
  return (
    <div className="pointer-events-none absolute right-0 -top-[6.5rem] z-10 hidden flex-col items-center gap-1.5 lg:flex">
      {logoUrl ? (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={whiteLabelConfig.ui.dashboard.frenteLogoAlt.replace("{frente}", frente)}
            className="h-full w-full object-contain p-2"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
          <span className="text-xl font-bold leading-none text-primary/70">
            {suffix || project}
          </span>
        </div>
      )}
      {displayName && (
        <span className="text-center text-sm font-bold leading-tight text-slate-800">
          {displayName}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-widest text-slate-400">
          {project}
        </p>
        {suffix && (
          <>
            <span className="text-[10px] text-slate-300">&middot;</span>
            <p className="text-[10px] font-semibold uppercase leading-none tracking-widest text-slate-400">
              {suffix}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
