import type { PokerGameType, PokerPosition, PreflopAction, RangeCell, RangeDecision, StackDepth } from "@/lib/poker/types";

export const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

function handLabel(row: number, column: number) {
  if (row === column) return `${ranks[row]}${ranks[column]}`;
  return row < column ? `${ranks[row]}${ranks[column]}s` : `${ranks[column]}${ranks[row]}o`;
}

function strength(row: number, column: number) {
  if (row === column) return 100 - row * 4.8;
  const high = Math.min(row, column);
  const low = Math.max(row, column);
  const suited = row < column ? 7 : 0;
  const connected = Math.max(0, 6 - Math.abs(row - column) * 2);
  return 82 - high * 3.6 - low * 2.25 + suited + connected;
}

const positionAdjustment: Record<PokerPosition, number> = { UTG: 10, HJ: 6, CO: 1, BTN: -5, SB: -1, BB: -3 };
const actionAdjustment: Record<PreflopAction, number> = { Open: 0, "3-Bet": 13, "4-Bet": 28, Call: 9, Defend: -4 };

// These deterministic starter ranges make the trainer usable before imported solver data exists.
export function buildStarterRange({ action, gameType, position, stackDepth }: {
  action: PreflopAction; gameType: PokerGameType; position: PokerPosition; stackDepth: StackDepth;
}): RangeCell[] {
  const tournamentAdjustment = gameType === "Tournament" && stackDepth <= 40 ? -4 : 0;
  const deepAdjustment = stackDepth >= 200 ? 3 : stackDepth <= 20 ? -3 : 0;
  const threshold = 48 + positionAdjustment[position] + actionAdjustment[action] + tournamentAdjustment + deepAdjustment;

  return ranks.flatMap((_, row) => ranks.map((__, column) => {
    const value = strength(row, column);
    const margin = value - threshold;
    let decision: RangeDecision = "Fold";
    let frequency = 0;
    if (action === "Call" || action === "Defend") {
      if (margin >= 7) { decision = "Call"; frequency = 100; }
      else if (margin >= -3) { decision = "Mix"; frequency = Math.max(20, Math.min(80, Math.round(50 + margin * 5))); }
    } else if (margin >= 7) { decision = "Raise"; frequency = 100; }
    else if (margin >= -3) { decision = "Mix"; frequency = Math.max(20, Math.min(80, Math.round(50 + margin * 5))); }
    return { action: decision, frequency, hand: handLabel(row, column) };
  }));
}

