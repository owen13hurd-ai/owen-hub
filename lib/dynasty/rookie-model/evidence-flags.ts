import type { RookieEnginePosition } from "@/types/rookie-engine";

export type RookieEvidenceFlag = {
  detail: string;
  key: string;
  label: string;
  points: number | null;
  tone: "green" | "red";
};

type EvidenceInput = {
  ageAtDraft: number | null;
  careerYprr: number | null;
  overallPick: number | null;
  position: RookieEnginePosition;
  receptionsPerGame: number | null;
  scrimmageYardsPerGame: number | null;
};

export function getRookieEvidenceFlags(input: EvidenceInput): RookieEvidenceFlag[] {
  const flags: RookieEvidenceFlag[] = [];
  const add = (flag: RookieEvidenceFlag) => flags.push(flag);

  if (input.position === "WR") {
    if (input.overallPick !== null && input.overallPick <= 32) add({ detail: "Exploratory 2020-2023 Hub cohort: 70% top-24 hit rate for first-round WRs (20 players). Draft capital remains separate from Prospect Score.", key: "wr-round-one", label: "Round 1", points: null, tone: "green" });
    if (input.overallPick !== null && input.overallPick > 200) add({ detail: "Exploratory 2020-2023 Hub cohort: 0 of 11 WRs selected after pick 200 recorded a top-24 season. Draft capital remains separate from Prospect Score.", key: "wr-after-200", label: "Pick 200+", points: null, tone: "red" });
    if (input.ageAtDraft !== null && input.ageAtDraft >= 23) add({ detail: "Exploratory 2020-2023 Hub cohort: WRs age 23 or older had a 5% top-24 hit rate (21 players), versus 31% for younger WRs. Prospect Score adjustment: -2.", key: "wr-age-23", label: "Age 23+", points: -2, tone: "red" });
    if (input.careerYprr !== null && input.careerYprr >= 3) add({ detail: "Exploratory 2020-2023 Hub cohort: WR career YPRR of 3.0+ produced a 64% top-24 hit rate (11 players). Prospect Score adjustment: +2. Small sample.", key: "wr-yprr-3", label: "3.0+ career YPRR", points: 2, tone: "green" });
    else if (input.careerYprr !== null && input.careerYprr >= 2.5) add({ detail: "Exploratory 2020-2023 Hub cohort: WR career YPRR of 2.5+ produced a 39% top-24 hit rate (36 players), versus 17% below 2.5. Prospect Score adjustment: +1.", key: "wr-yprr-25", label: "2.5+ career YPRR", points: 1, tone: "green" });
  }

  if (input.position === "RB") {
    if (input.overallPick !== null && input.overallPick <= 100) add({ detail: "Exploratory 2020-2023 Hub cohort: top-100 RBs had a 64% top-24 hit rate (25 players), versus 19% after pick 100. Draft capital remains separate from Prospect Score.", key: "rb-top-100", label: "Top-100 pick", points: null, tone: "green" });
    if (input.ageAtDraft !== null && input.ageAtDraft <= 21) add({ detail: "Exploratory 2020-2023 Hub cohort: RBs age 21 or younger had a 69% top-24 hit rate (13 players), versus 32% for older RBs. Prospect Score adjustment: +1.", key: "rb-age-21", label: "Age 21 or less", points: 1, tone: "green" });
    if (input.receptionsPerGame !== null && input.receptionsPerGame >= 3) add({ detail: "Exploratory 2020-2023 Hub cohort: RBs with 3.0+ college receptions per game had an 89% top-24 hit rate (9 players). Prospect Score adjustment: +2. Small sample.", key: "rb-receptions-3", label: "3.0+ receptions/game", points: 2, tone: "green" });
    if (input.scrimmageYardsPerGame !== null && input.scrimmageYardsPerGame >= 125) add({ detail: "Exploratory 2020-2023 Hub cohort: RBs with 125+ scrimmage yards per game had a 59% top-24 hit rate (17 players), versus 28% below 125. Prospect Score adjustment: +1.", key: "rb-scrimmage-125", label: "125+ scrimmage YPG", points: 1, tone: "green" });
  }

  return flags;
}
