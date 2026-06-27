export type BattleOutcome = "Win" | "Loss";
export type BattleStatus = "Live" | "Review" | "Complete";
export type BattleTag =
  | "Good Play" | "Mistake" | "Lucky" | "Unlucky"
  | "Prediction Correct" | "Prediction Wrong" | "Missed Win"
  | "Throw" | "Misplay" | "Lead" | "Endgame" | "Positioning"
  | "Win Condition" | "Speed Control" | "Priority" | "Setup"
  | "Critical Hit" | "Calc Error" | "Terastal" | "Switch";

export type BattlePokemonState = {
  ability: string;
  boosts: string;
  fainted: boolean;
  item: string;
  moves: string[];
  status: string;
  terastallized: boolean;
};

export type BattleTurn = {
  createdAt: string;
  id: string;
  note: string;
  tags: string[];
  turn: number;
};

export type BattleReview = {
  bestPlay: string;
  biggestMistake: string;
  confidence: number;
  difficulty: number;
  leadThoughts: string;
  lesson: string;
  mvp: string;
  playedWell: boolean;
  remember: string;
  turningPoint: string;
  worstPokemon: string;
};

export type PokemonBattle = {
  archetype: string;
  currentTurn: number;
  date: string;
  format: string;
  id: string;
  myLead: string;
  myTeam: string[];
  opponentLead: string;
  opponentName: string;
  opponentTeam: string[];
  outcome: BattleOutcome | null;
  pokemonState: Record<string, BattlePokemonState>;
  rank: string;
  review: BattleReview;
  status: BattleStatus;
  turns: BattleTurn[];
};

export type OpponentNote = {
  commonLeads: string;
  id: string;
  name: string;
  notes: string;
  threats: string;
  typicalSwitches: string;
  weaknesses: string;
};

export type BattleTeamNote = {
  badMatchups: string;
  description: string;
  gameplan: string;
  goodMatchups: string;
  id: string;
  leadOptions: string;
  name: string;
  pokemon: string[];
  remember: string;
  winConditions: string;
};

export type BattleJournalData = {
  battles: PokemonBattle[];
  currentRating: number;
  opponentNotes: OpponentNote[];
  teamNotes: BattleTeamNote[];
};

export const emptyBattleReview: BattleReview = {
  bestPlay: "", biggestMistake: "", confidence: 3, difficulty: 3,
  leadThoughts: "", lesson: "", mvp: "", playedWell: true,
  remember: "", turningPoint: "", worstPokemon: "",
};

export const emptyBattleJournal: BattleJournalData = {
  battles: [], currentRating: 0, opponentNotes: [], teamNotes: [],
};
