import type { AgentDefinition, AgentId } from "@/lib/agents/types";

export const agentRegistry: AgentDefinition[] = [
  {
    id: "project-manager", name: "Project Manager", category: "orchestration", accent: "ink", trigger: "manual",
    mission: "Turn Owen's goals into prioritized, owned, and inspectable work.",
    responsibilities: ["Prioritize the shared queue", "Route work to specialists", "Track blockers and unfinished work"],
    modes: ["Daily planning", "Project review", "Task routing"],
    permissions: ["read", "draft", "write-memory", "queue", "external-approval"],
    memoryPath: "16 Agent Memory/Agents/Project Manager Agent.md",
  },
  {
    id: "career", name: "Career", category: "domain", accent: "moss", trigger: "scheduled-ready",
    mission: "Improve Owen's truthful career strategy, applications, and interview readiness.",
    responsibilities: ["Maintain verified career facts", "Score relevant Atlanta roles", "Prepare application materials"],
    modes: ["Job Scout", "Application Writer", "Interview Coach", "Career Strategy"],
    permissions: ["read", "draft", "write-memory", "queue", "external-approval"],
    memoryPath: "16 Agent Memory/Agents/Career Agent.md",
  },
  {
    id: "dynasty", name: "Dynasty", category: "domain", accent: "moss", trigger: "manual",
    mission: "Analyze leagues, trades, rankings, rookies, and portfolio risk through Owen's values.",
    responsibilities: ["Compare personal and market values", "Evaluate roster impact", "Track portfolio exposure"],
    modes: ["Trade Review", "Portfolio Audit", "Rookie Model", "League Strategy"],
    permissions: ["read", "draft", "write-memory", "queue", "external-approval"],
    memoryPath: "16 Agent Memory/Agents/Dynasty Agent.md",
  },
  {
    id: "pokemon", name: "Pokemon", category: "domain", accent: "ember", trigger: "scheduled-ready",
    mission: "Support competitive improvement, metagame study, and safe TCG buying decisions.",
    responsibilities: ["Analyze teams and battles", "Track verified restocks", "Organize metagame knowledge"],
    modes: ["Competitive", "Restock", "Study", "Battle Review"],
    permissions: ["read", "draft", "write-memory", "queue", "external-approval"],
    memoryPath: "16 Agent Memory/Agents/Pokemon Agent.md",
  },
  {
    id: "research", name: "Research", category: "operations", accent: "sky", trigger: "manual",
    mission: "Produce current, source-backed research with explicit confidence.",
    responsibilities: ["Prefer primary sources", "Separate fact from inference", "Create durable research notes"],
    modes: ["Quick verification", "Deep research", "Source audit"],
    permissions: ["read", "draft", "write-memory", "queue"],
    memoryPath: "16 Agent Memory/Agents/Research Agent.md",
  },
  {
    id: "daily-briefing", name: "Daily Briefing", category: "operations", accent: "sky", trigger: "scheduled-ready",
    mission: "Condense verified domain updates into one prioritized daily scan.",
    responsibilities: ["Reuse domain-agent outputs", "Rank urgent actions", "Remove duplicate and low-value updates"],
    modes: ["Morning Briefing", "Urgent Alert", "Weekly Digest"],
    permissions: ["read", "draft", "write-memory", "queue"],
    memoryPath: "16 Agent Memory/Agents/Daily Briefing Agent.md",
  },
  {
    id: "documentation", name: "Documentation", category: "operations", accent: "ink", trigger: "manual",
    mission: "Keep project memory, decisions, lessons, links, and logs trustworthy.",
    responsibilities: ["Update canonical notes", "Maintain Maps of Content", "Append completion history"],
    modes: ["Project closeout", "Inbox processing", "Knowledge cleanup"],
    permissions: ["read", "draft", "write-memory", "queue"],
    memoryPath: "16 Agent Memory/Agents/Documentation Agent.md",
  },
  {
    id: "qa", name: "QA", category: "operations", accent: "ink", trigger: "manual",
    mission: "Independently verify claims, workflows, code, and completion evidence.",
    responsibilities: ["Test expected behavior", "Find unsupported claims", "Report residual risk"],
    modes: ["Code verification", "Source audit", "Workflow audit", "Data-quality review"],
    permissions: ["read", "draft", "write-memory", "queue"],
    memoryPath: "16 Agent Memory/Agents/QA Agent.md",
  },
];

export const agentById = new Map<AgentId, AgentDefinition>(agentRegistry.map((agent) => [agent.id, agent]));

export const agentCategories = [
  { id: "orchestration" as const, label: "Coordination" },
  { id: "domain" as const, label: "Domain Specialists" },
  { id: "operations" as const, label: "Shared Operations" },
];
