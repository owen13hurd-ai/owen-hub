import type { Concept, PokerSettings, TrainingSpot } from "@/lib/poker/types";

export const defaultPokerSettings: PokerSettings = {
  dailyGoal: 10,
  darkMode: false,
  difficulty: "Beginner",
  preferredGame: "Cash",
  preferredStack: 100,
  preferredStakes: "1/2",
};

export const trainingSpots: TrainingSpot[] = [
  {
    id: "btn-open-a5s", title: "Button first in", gameType: "Cash", difficulty: "Beginner",
    position: "BTN", stackSize: "100bb effective", heroCards: ["A♠", "5♠"], board: [], potSize: "1.5bb",
    previousAction: "Folds to Hero", playerToAct: "Hero on BTN", actionHistory: ["UTG folds", "HJ folds", "CO folds"],
    options: ["Fold", "Call", "Raise 2.5x"], optimalAction: "Raise 2.5x",
    explanation: "A5 suited has an ace blocker, nut-flush potential, and enough playability to open profitably from the button.",
    frequencies: { "Raise 2.5x": 100 },
  },
  {
    id: "utg-open-kjo", title: "Early-position discipline", gameType: "Cash", difficulty: "Beginner",
    position: "UTG", stackSize: "100bb effective", heroCards: ["K♥", "J♣"], board: [], potSize: "1.5bb",
    previousAction: "Hero is first to act", playerToAct: "Hero UTG", actionHistory: [],
    options: ["Fold", "Call", "Raise 2.5x"], optimalAction: "Fold",
    explanation: "KJo is frequently dominated when called from early position. A disciplined fold avoids difficult reverse-implied-odds spots.",
    frequencies: { Fold: 85, "Raise 2.5x": 15 },
  },
  {
    id: "bb-defend-q9s", title: "Big blind defense", gameType: "Cash", difficulty: "Intermediate",
    position: "BB", stackSize: "100bb effective", heroCards: ["Q♦", "9♦"], board: [], potSize: "4bb",
    previousAction: "BTN raises to 2.5bb", playerToAct: "Hero in BB", actionHistory: ["Folds to BTN", "BTN raises 2.5bb", "SB folds"],
    options: ["Fold", "Call", "Raise 4x"], optimalAction: "Call",
    explanation: "The big blind is getting a strong price. Q9 suited realizes equity well and is too strong to fold against a wide button range.",
    frequencies: { Call: 82, "Raise 4x": 12, Fold: 6 },
  },
  {
    id: "co-vs-btn-3bet-aqo", title: "Facing a button 3-bet", gameType: "Cash", difficulty: "Intermediate",
    position: "CO", stackSize: "100bb effective", heroCards: ["A♣", "Q♥"], board: [], potSize: "13bb",
    previousAction: "BTN 3-bets to 9bb", playerToAct: "Hero in CO", actionHistory: ["Hero opens 2.5bb", "BTN raises to 9bb"],
    options: ["Fold", "Call", "Raise 4x", "Jam"], optimalAction: "Call",
    explanation: "AQ offsuit is strong enough to continue but usually performs better as a call than a value 4-bet against a balanced range.",
    frequencies: { Call: 70, "Raise 4x": 22, Fold: 8 },
  },
  {
    id: "flop-cbet-akk", title: "Range advantage c-bet", gameType: "Cash", difficulty: "Intermediate",
    position: "BTN", stackSize: "97.5bb effective", heroCards: ["A♦", "K♣"], board: ["K♠", "7♥", "2♣"], potSize: "6.5bb",
    previousAction: "BB checks", playerToAct: "Hero on BTN", actionHistory: ["Hero opens", "BB calls", "Flop: BB checks"],
    options: ["Check", "Bet 33%", "Bet 75%"], optimalAction: "Bet 33%",
    explanation: "On a dry king-high board, the opener has a range advantage and can bet small with many hands. Top pair benefits from calls by worse kings and pairs.",
    frequencies: { "Bet 33%": 76, Check: 24 },
  },
  {
    id: "tourney-20bb-aqs", title: "Short-stack squeeze", gameType: "Tournament", difficulty: "Advanced",
    position: "SB", stackSize: "20bb effective", heroCards: ["A♠", "Q♠"], board: [], potSize: "6bb",
    previousAction: "CO opens, BTN calls", playerToAct: "Hero in SB", actionHistory: ["CO raises 2.2bb", "BTN calls"],
    options: ["Fold", "Call", "Raise 4x", "Jam"], optimalAction: "Jam",
    explanation: "AQ suited is far ahead of both ranges, benefits greatly from fold equity, and the stack-to-pot ratio makes a smaller raise awkward.",
    frequencies: { Jam: 88, "Raise 4x": 12 },
  },
];

const conceptSeeds = [
  ["Range Advantage", "Ranges", "One player has more strong hands across the whole range. That player can usually bet more often."],
  ["Nut Advantage", "Ranges", "One player has more of the very strongest possible hands. This often supports large bets."],
  ["Blockers", "Hand Reading", "Cards in your hand reduce the combinations your opponent can hold. Good bluff blockers remove likely calls."],
  ["Board Texture", "Postflop", "Dry boards connect with few hands; wet boards create many draws and strong combinations."],
  ["Polarized Ranges", "Ranges", "A range made mostly of very strong hands and bluffs, with few medium-strength hands."],
  ["Merged Ranges", "Ranges", "A range containing many strong and medium hands that can be called by worse."],
  ["Pot Odds", "Math", "Compare the call to the final pot. Calling $25 to win a $100 final pot requires 25% equity."],
  ["Implied Odds", "Math", "Future money you can win when a draw completes can justify a call beyond immediate pot odds."],
  ["Reverse Implied Odds", "Math", "A made hand can lose extra money when it improves to a second-best hand."],
  ["Equity Realization", "Math", "The percentage of raw equity a hand actually captures after position and future betting are considered."],
  ["Minimum Defense Frequency", "Defense", "The theoretical share of your range needed to continue so an opponent cannot profit with any two cards."],
  ["ICM", "Tournament", "Tournament chips change value based on payouts and remaining players, so chip-EV and money-EV can differ."],
  ["Continuation Betting", "Postflop", "The preflop aggressor bets the flop. Frequency and size depend on range interaction with the board."],
  ["Check Raising", "Postflop", "Checking before raising can build value pots and pressure frequent bets with selected bluffs."],
  ["Delayed C-Bets", "Postflop", "After checking the flop, the preflop aggressor bets the turn when ranges or new cards favor it."],
  ["Overbets", "Bet Sizing", "Bets larger than the pot suit polarized ranges and place maximum pressure on bluff catchers."],
  ["Probe Bets", "Postflop", "The out-of-position caller bets after the previous street checks through, attacking capped ranges."],
  ["Floating", "Defense", "Calling with a relatively weak hand intending to win later when the opponent slows down."],
  ["Thin Value", "Value Betting", "Betting a hand that is only slightly ahead of the opponent's calling range."],
  ["Bluff Catching", "Defense", "Calling with a hand that beats bluffs but usually loses to the opponent's value range."],
] as const;

export const pokerConcepts: Concept[] = conceptSeeds.map(([title, category, body], index) => ({
  id: `concept-${index + 1}`,
  title,
  category,
  body,
  tags: [category.toLowerCase(), title.toLowerCase()],
}));
