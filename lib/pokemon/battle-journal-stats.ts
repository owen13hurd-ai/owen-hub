import type { BattleJournalData, PokemonBattle } from "@/lib/pokemon/battle-journal-types";

function completeBattles(battles: PokemonBattle[]) {
  return battles.filter((battle) => battle.status === "Complete" && battle.outcome);
}

function topCount(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts).sort((a, b) => b[1] - a[1])[0] ?? ["-", 0] as const;
}

export function getBattleJournalStats(data: BattleJournalData) {
  const battles = completeBattles(data.battles);
  const wins = battles.filter((battle) => battle.outcome === "Win").length;
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  [...battles].sort((a, b) => a.date.localeCompare(b.date)).forEach((battle) => {
    runningStreak = battle.outcome === "Win" ? runningStreak + 1 : 0;
    longestStreak = Math.max(longestStreak, runningStreak);
  });
  for (const battle of [...battles].sort((a, b) => b.date.localeCompare(a.date))) {
    if (battle.outcome !== "Win") break;
    currentStreak += 1;
  }
  const mostUsedTeam = topCount(battles.map((battle) => battle.myTeam.join(" / ")));
  const favoriteLead = topCount(battles.map((battle) => battle.myLead));
  const commonOpponent = topCount(battles.map((battle) => battle.opponentName || battle.archetype));
  const commonMistake = topCount(battles.flatMap((battle) => battle.turns.filter((turn) => turn.tags.some((tag) => ["Mistake", "Misplay", "Throw", "Missed Win"].includes(tag))).flatMap((turn) => turn.tags)));
  return {
    battles,
    commonMistake,
    commonOpponent,
    currentStreak,
    favoriteLead,
    longestStreak,
    mostUsedTeam,
    record: `${wins}-${battles.length - wins}`,
    winRate: battles.length ? Math.round((wins / battles.length) * 100) : 0,
  };
}

export function buildBattleInsights(data: BattleJournalData) {
  const stats = getBattleJournalStats(data);
  if (stats.battles.length < 2) return ["Log two completed battles to unlock pattern detection."];
  const insights = [`Your overall win rate is ${stats.winRate}% across ${stats.battles.length} battles.`];
  if (stats.favoriteLead[1] >= 2) insights.push(`${stats.favoriteLead[0]} is your most-used lead (${stats.favoriteLead[1]} games).`);
  if (stats.commonMistake[1] >= 2) insights.push(`${stats.commonMistake[0]} is your most frequent review tag.`);
  const lateLosses = stats.battles.filter((battle) => battle.outcome === "Loss" && battle.currentTurn > 10).length;
  if (lateLosses >= 2) insights.push(`${lateLosses} losses happened after turn 10. Review endgame planning.`);
  return insights.slice(0, 4);
}

export function getLeadMatchups(battles: PokemonBattle[]) {
  const groups = new Map<string, { battles: PokemonBattle[]; myLead: string; opponentLead: string }>();
  completeBattles(battles).filter((battle) => battle.myLead && battle.opponentLead).forEach((battle) => {
    const key = `${battle.myLead}::${battle.opponentLead}`;
    const group = groups.get(key) ?? { battles: [], myLead: battle.myLead, opponentLead: battle.opponentLead };
    group.battles.push(battle); groups.set(key, group);
  });
  return Array.from(groups.values()).map((group) => ({
    ...group,
    winRate: Math.round(group.battles.filter((battle) => battle.outcome === "Win").length / group.battles.length * 100),
  })).sort((a, b) => b.battles.length - a.battles.length);
}
