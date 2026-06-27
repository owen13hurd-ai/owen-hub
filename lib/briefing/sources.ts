export type BriefingCategory = "Career & Logistics" | "Dynasty Football" | "General" | "Pokémon" | "Tech & Atlanta" | "Travel";

export type BriefingSource = {
  category: BriefingCategory;
  label: string;
  url: string;
  whyItMatters: string;
};

export const briefingCategories: BriefingCategory[] = [
  "Dynasty Football",
  "Pokémon",
  "Career & Logistics",
  "Tech & Atlanta",
  "Travel",
  "General",
];

export const briefingSources: BriefingSource[] = [
  { label: "ESPN NFL", category: "Dynasty Football", url: "https://www.espn.com/espn/rss/nfl/news", whyItMatters: "Player, injury, transaction, and team news that can change dynasty value." },
  { label: "Victory Road VGC", category: "Pokémon", url: "https://victoryroadvgc.com/feed/", whyItMatters: "Tournament results, formats, and teams relevant to Pokémon Champions preparation." },
  { label: "FreightWaves", category: "Career & Logistics", url: "https://www.freightwaves.com/feed/", whyItMatters: "Freight-market language and industry developments useful for logistics interviews." },
  { label: "Supply Chain Dive", category: "Career & Logistics", url: "https://www.supplychaindive.com/feeds/news/", whyItMatters: "Operations, procurement, manufacturing, and supply-chain trends tied to your target roles." },
  { label: "Hypepotamus", category: "Tech & Atlanta", url: "https://hypepotamus.com/feed/", whyItMatters: "Atlanta startups, funding, and companies that may create new local tech-sales opportunities." },
  { label: "TechCrunch", category: "Tech & Atlanta", url: "https://techcrunch.com/feed/", whyItMatters: "Technology-company shifts and products worth understanding before SDR and BDR interviews." },
  { label: "The Points Guy", category: "Travel", url: "https://thepointsguy.com/feed/", whyItMatters: "Travel deals, points changes, and planning ideas for future trips." },
  { label: "BBC News", category: "General", url: "https://feeds.bbci.co.uk/news/rss.xml", whyItMatters: "A compact general-news baseline without overwhelming the interest-specific briefing." },
];

