import {
  BriefcaseBusiness,
  FileText,
  Map,
  Shield,
  Sparkles,
} from "lucide-react";

export type Hub = {
  label: string;
  href: string;
  description: string;
  icon: typeof Shield;
};

export const hubs: Hub[] = [
  {
    label: "Dynasty Hub",
    href: "/dashboard/dynasty",
    description: "Rankings, trades, rosters, and football portfolio tracking.",
    icon: Shield,
  },
  {
    label: "Pokémon Hub",
    href: "/dashboard/pokemon",
    description: "Team-building tools, type coverage, and saved strategy notes.",
    icon: Sparkles,
  },
  {
    label: "Career Hub",
    href: "/dashboard/career",
    description: "Job search resources, interview prep, resumes, and contacts.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Travel Hub",
    href: "/dashboard/travel",
    description: "Trips, saved places, itineraries, budgets, and packing lists.",
    icon: Map,
  },
  {
    label: "Notes Hub",
    href: "/dashboard/notes",
    description: "Personal notes, knowledge management, and future AI search.",
    icon: FileText,
  },
];

export const navigationItems = hubs;
