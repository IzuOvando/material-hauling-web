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
