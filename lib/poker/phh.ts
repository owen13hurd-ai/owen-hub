export type ReplayStreet = "Preflop" | "Flop" | "Turn" | "River" | "Showdown";
export type ReplayActor = "Hero" | "Villain";
export type ReplayActionType = "Check / Call" | "Bet / Raise to" | "Fold" | "Show / Muck";

export type ReplayAction = {
  actor: ReplayActor;
  amount?: number;
  id: string;
  street: ReplayStreet;
  type: ReplayActionType;
};

export type PokerReplay = {
  actions: ReplayAction[];
  bigBlind: number;
  board: string[];
  heroCards: string;
  id: string;
  players: [string, string];
  savedAt: string;
  smallBlind: number;
  startingStacks: [number, number];
  title: string;
  villainCards: string;
};

function cards(value: string) {
  return value.replace(/[^2-9TJQKAcdhs?]/gi, "");
}

function quote(value: string) {
  return JSON.stringify(value);
}

function actionNotation(action: ReplayAction) {
  const actor = action.actor === "Hero" ? "p1" : "p2";
  if (action.type === "Bet / Raise to") return `${actor} cbr ${action.amount ?? 0}`;
  if (action.type === "Fold") return `${actor} f`;
  if (action.type === "Show / Muck") return `${actor} sm`;
  return `${actor} cc`;
}

export function replayToPhh(replay: PokerReplay) {
  const actions: string[] = [
    `d dh p1 ${cards(replay.heroCards) || "????"}`,
    `d dh p2 ${cards(replay.villainCards) || "????"}`,
  ];
  const streets: ReplayStreet[] = ["Preflop", "Flop", "Turn", "River", "Showdown"];
  const boardByStreet: Partial<Record<ReplayStreet, string>> = {
    Flop: cards(replay.board.slice(0, 3).join("")),
    Turn: cards(replay.board[3] ?? ""),
    River: cards(replay.board[4] ?? ""),
  };

  for (const street of streets) {
    const boardCards = boardByStreet[street];
    if (boardCards) actions.push(`d db ${boardCards}`);
    actions.push(...replay.actions.filter((action) => action.street === street).map(actionNotation));
  }

  return [
    `# ${replay.title}`,
    `variant = "NT"`,
    `antes = [0, 0]`,
    `blinds_or_straddles = [${replay.smallBlind}, ${replay.bigBlind}]`,
    `min_bet = ${replay.bigBlind}`,
    `starting_stacks = [${replay.startingStacks.join(", ")}]`,
    `players = [${replay.players.map(quote).join(", ")}]`,
    `actions = [`,
    ...actions.map((action) => `  ${quote(action)},`),
    `]`,
    `event = "Owen's Hub Hand Review"`,
    "",
  ].join("\n");
}

function numberArray(source: string, field: string) {
  const match = source.match(new RegExp(`${field}\\s*=\\s*\\[([^\\]]*)\\]`));
  return match?.[1].split(",").map((value) => Number(value.trim())).filter(Number.isFinite) ?? [];
}

function stringArray(source: string, field: string) {
  const match = source.match(new RegExp(`${field}\\s*=\\s*\\[([\\s\\S]*?)\\](?:\\s*\\n|$)`));
  return match ? Array.from(match[1].matchAll(/"((?:\\.|[^"\\])*)"/g), (item) => JSON.parse(`"${item[1]}"`) as string) : [];
}

export function phhToReplay(source: string): PokerReplay {
  if (!/variant\s*=\s*"NT"/.test(source)) throw new Error("This first replayer supports no-limit Texas hold'em PHH files.");
  const stacks = numberArray(source, "starting_stacks");
  const blinds = numberArray(source, "blinds_or_straddles");
  const players = stringArray(source, "players");
  const rawActions = stringArray(source, "actions");
  if (stacks.length < 2 || blinds.length < 2 || rawActions.length < 2) throw new Error("The PHH file is missing stacks, blinds, or actions.");

  let street: ReplayStreet = "Preflop";
  let heroCards = "";
  let villainCards = "";
  const board: string[] = [];
  const actions: ReplayAction[] = [];

  rawActions.forEach((rawAction, index) => {
    const hole = rawAction.match(/^d\s+dh\s+p([12])\s+([^\s#]+)/);
    if (hole) {
      if (hole[1] === "1") heroCards = hole[2];
      else villainCards = hole[2];
      return;
    }
    const dealtBoard = rawAction.match(/^d\s+db\s+([^\s#]+)/);
    if (dealtBoard) {
      const dealt = dealtBoard[1].match(/.{2}/g) ?? [];
      board.push(...dealt);
      street = board.length <= 3 ? "Flop" : board.length === 4 ? "Turn" : "River";
      return;
    }
    const playerAction = rawAction.match(/^p([12])\s+(cc|f|cbr|sm)(?:\s+([\d.]+))?/);
    if (!playerAction) return;
    const actionType: Record<string, ReplayActionType> = { cc: "Check / Call", cbr: "Bet / Raise to", f: "Fold", sm: "Show / Muck" };
    actions.push({
      actor: playerAction[1] === "1" ? "Hero" : "Villain",
      amount: playerAction[3] ? Number(playerAction[3]) : undefined,
      id: `imported-${index}`,
      street: playerAction[2] === "sm" ? "Showdown" : street,
      type: actionType[playerAction[2]],
    });
  });

  const title = source.match(/^#\s*(.+)$/m)?.[1] ?? "Imported PHH hand";
  return {
    actions,
    bigBlind: blinds[1],
    board,
    heroCards,
    id: `${Date.now()}-imported`,
    players: [players[0] ?? "Hero", players[1] ?? "Villain"],
    savedAt: new Date().toISOString(),
    smallBlind: blinds[0],
    startingStacks: [stacks[0], stacks[1]],
    title,
    villainCards,
  };
}
