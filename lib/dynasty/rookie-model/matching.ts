import type { RookieEnginePosition } from "@/types/rookie-engine";

export type RookieMatchCandidate = {
  classYear: number;
  id: string;
  name: string;
  position: RookieEnginePosition;
  school: string | null;
};

function normalizedName(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function editDistance(first: string, second: string) {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[second.length];
}

export function rookieNameSimilarity(first: string, second: string) {
  const normalizedFirst = normalizedName(first);
  const normalizedSecond = normalizedName(second);
  if (!normalizedFirst || !normalizedSecond) return 0;
  return 1 - editDistance(normalizedFirst, normalizedSecond) / Math.max(normalizedFirst.length, normalizedSecond.length);
}

export function findRookieDuplicateCandidates(
  name: string,
  classYear: number,
  position: RookieEnginePosition | null,
  players: RookieMatchCandidate[],
) {
  if (!position) return [];
  return players
    .filter((player) => player.classYear === classYear && player.position === position)
    .map((player) => ({ ...player, similarity: rookieNameSimilarity(name, player.name) }))
    .filter((player) => player.similarity >= 0.82 && player.similarity < 1)
    .sort((first, second) => second.similarity - first.similarity)
    .slice(0, 3);
}
