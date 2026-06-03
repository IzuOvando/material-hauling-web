// TODO SDN-141: Activar este tab cuando el módulo de Orígenes y Destinos esté rediseñado.
// BreakdownChart acepta groupBy="origen" y groupBy="destino" sin modificaciones.
// El endpoint /breakdown requiere añadir "origen" y "destino" a ALLOWED_GROUP_BY (SDN-149).
export function OrigenDestinoTab() {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <p className="font-semibold text-base">Origen / Destino — Próximamente</p>
    </div>
  );
}
