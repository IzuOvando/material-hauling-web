const FRENTE_SECTIONS = ["/db", "/dashboard"];

export function sectionLeftByDeletedFrente(pathname: string, nombre: string): string | null {
  for (const section of FRENTE_SECTIONS) {
    const prefix = `${section}/`;
    if (!pathname.startsWith(prefix)) continue;
    const segment = decodeURIComponent(pathname.slice(prefix.length).split("/")[0]);
    if (segment === nombre) return section;
  }
  return null;
}
