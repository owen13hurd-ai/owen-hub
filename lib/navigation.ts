import {
  Bot,
  BriefcaseBusiness,
  FileText,
  BrainCircuit,
  Map,
  Newspaper,
  PackageSearch,
  Shield,
  Spade,
  Sparkles,
} from "lucide-react";

export type Hub = {
  label: string;
  href: string;
  description: string;
  focus: string;
  status: string;
  accent: "moss" | "ember" | "sky" | "ink";
  icon: typeof Shield;
};

export const hubs: Hub[] = [
  {
    label: "Jarvis",
    href: "/dashboard/jarvis",
    description: "Second brain search, source rules, decisions, and future AI answers with citations.",
    focus: "Memory layer",
    status: "Building",
    accent: "ink",
    icon: BrainCircuit,
  },
  {
    label: "Agent Workspace",
    href: "/dashboard/agents",
    description: "Shared tasks, permissions, memory, and coordination for Codex and Hermes.",
    focus: "Agent control",
    status: "Connected",
    accent: "ink",
    icon: Bot,
  },
  {
    label: "Daily Briefing",
    href: "/dashboard/briefing",
    description: "News, videos, podcasts, and updates across your interests.",
    focus: "Morning scan",
    status: "Planning",
    accent: "sky",
    icon: Newspaper,
  },
  {
    label: "Dynasty Hub",
    href: "/dashboard/dynasty",
    description: "Rankings, trades, rosters, and football portfolio tracking.",
    focus: "Rankings and trades",
    status: "Active",
    accent: "moss",
    icon: Shield,
  },
  {
    label: "Pokémon Hub",
    href: "/dashboard/pokemon",
    description: "Team-building tools, type coverage, and saved strategy notes.",
    focus: "Team prep",
    status: "Active",
    accent: "ember",
    icon: Sparkles,
  },
  {
    label: "Pokémon Restocks",
    href: "/dashboard/restocks",
    description: "MSRP inventory alerts, release tracking, and a personal product watchlist.",
    focus: "Restock alerts",
    status: "Building",
    accent: "ember",
    icon: PackageSearch,
  },
  {
    label: "Poker Hub",
    href: "/dashboard/poker",
    description: "Ranges, hand training, concepts, and personal study tracking.",
    focus: "Trainer",
    status: "Active",
    accent: "ink",
    icon: Spade,
  },
  {
    label: "Career Hub",
    href: "/dashboard/career",
    description: "Job search resources, interview prep, resumes, and contacts.",
    focus: "Job agent",
    status: "Active",
    accent: "moss",
    icon: BriefcaseBusiness,
  },
  {
    label: "Travel Hub",
    href: "/dashboard/travel",
    description: "Trips, saved places, itineraries, budgets, and packing lists.",
    focus: "Trip planning",
    status: "Planned",
    accent: "sky",
    icon: Map,
  },
  {
    label: "Notes Hub",
    href: "/dashboard/notes",
    description: "Personal notes, knowledge management, and future AI search.",
    focus: "Knowledge base",
    status: "Connected",
    accent: "ink",
    icon: FileText,
  },
];

export const navigationItems = hubs;
