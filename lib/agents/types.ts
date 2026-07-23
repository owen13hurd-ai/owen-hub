export type AgentId =
  | "project-manager"
  | "research"
  | "career"
  | "dynasty"
  | "pokemon"
  | "daily-briefing"
  | "documentation"
  | "qa";

export type AgentCategory = "orchestration" | "domain" | "operations";
export type AgentPermission = "read" | "draft" | "write-memory" | "queue" | "external-approval";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "ready" | "claimed" | "waiting" | "blocked" | "completed";

export type AgentDefinition = {
  id: AgentId;
  name: string;
  category: AgentCategory;
  mission: string;
  responsibilities: string[];
  modes: string[];
  permissions: AgentPermission[];
  memoryPath: string;
  trigger: "manual" | "scheduled-ready";
  accent: "moss" | "ember" | "sky" | "ink";
};

export type AgentTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent: AgentId | "unassigned";
  createdAt: string;
  project: string;
  objective: string;
  successCriteria: string;
};

export type CreateAgentTask = {
  title: string;
  priority: TaskPriority;
  assignedAgent: AgentId;
  project: string;
  objective: string;
  successCriteria: string;
};
