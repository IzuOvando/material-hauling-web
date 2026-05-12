export function normalizeFrenteKey(nombre: string): string {
  const segments = nombre.trim().toLowerCase().split("-");
  return segments.slice(0, 2).join("-");
}
