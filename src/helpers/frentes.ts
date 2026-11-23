import { getProject } from "./strings";

interface FrenteNames {
  nombre: string;
  displayName: string | null;
}

/** The project name another frente of the same project already has, if any. */
export function findSiblingDisplayName(frentes: FrenteNames[], nombre: string): string | null {
  const project = getProject(nombre);

  return (
    frentes.find(
      (f) => f.nombre !== nombre && getProject(f.nombre) === project && f.displayName
    )?.displayName ?? null
  );
}
