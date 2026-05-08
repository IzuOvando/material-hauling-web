export function getProject(frente: string): string {
  return frente.split("-")[0].trim();
}

export function findClosestMatch(
  word: string,
  possibleMatches: string[]
): string | null {
  const cleanedInputString = word.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

  for (let match of possibleMatches) {
    if (cleanedInputString.includes(match.replaceAll("_", ""))) {
      return match;
    }
  }

  return null;
}

export function generateUniqueId(length: number) {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
}
