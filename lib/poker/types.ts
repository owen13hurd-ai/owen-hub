export type PokerGameType = "Cash" | "Tournament";
export type StackDepth = 20 | 40 | 60 | 100 | 200;
export type PokerPosition = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type PreflopAction = "Open" | "3-Bet" | "4-Bet" | "Call" | "Defend";
export type RangeDecision = "Raise" | "Mix" | "Call" | "Fold";

export type RangeCell = {
  action: RangeDecision;
  frequency: number;
  hand: string;
};

export type PokerRange = {
  action: PreflopAction;
  cells: RangeCell[];
  gameType: PokerGameType;
  id: string;
  label: string;
  position: PokerPosition;
  stackDepth: StackDepth;
};

export type TrainingAction = string;

export type TrainingSpot = {
  actionHistory: string[];
  board: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  explanation: string;
  frequencies: Partial<Record<TrainingAction, number>>;
  gameType: PokerGameType;
  heroCards: string[];
  id: string;
  options: TrainingAction[];
  optimalAction: TrainingAction;
  playerToAct: string;
  position: PokerPosition;
  potSize: string;
  previousAction: string;
  stackSize: string;
  source?: string;
  sourceNotes?: string;
  sourceUrl?: string;
  title: string;
};

export type Concept = {
  body: string;
  category: string;
  id: string;
  tags: string[];
  title: string;
};

export type SolverSolution = {
  board: string;
  dateAdded: string;
  description: string;
  favorite: boolean;
  folder: string;
  gameType: PokerGameType;
  id: string;
  notes: string;
  positions: string;
  solverName: string;
  stackDepth: StackDepth;
  tags: string[];
  title: string;
};

export type HandHistory = {
  actionHistory: string;
  board: string;
  difficulty: "Easy" | "Medium" | "Hard";
  heroCards: string;
  id: string;
  notes: string;
  result: string;
  status: "New" | "Reviewed" | "Review later";
  tags: string[];
  title: string;
  villainPosition: PokerPosition;
};

export type PokerNote = {
  body: string;
  createdAt: string;
  folder: string;
  id: string;
  pinned: boolean;
  tags: string[];
  title: string;
};

export type StudySession = {
  completedAt: string;
  correct: boolean;
  minutes: number;
  module: "Concept" | "Daily Spot" | "Hand Trainer" | "Range";
  referenceId: string;
};

export type PokerSettings = {
  dailyGoal: number;
  darkMode: boolean;
  difficulty: TrainingSpot["difficulty"];
  preferredGame: PokerGameType;
  preferredStack: StackDepth;
  preferredStakes: string;
};
