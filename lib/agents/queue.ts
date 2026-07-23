import { agentById } from "@/lib/agents/registry";
import type { AgentId, AgentTask, CreateAgentTask, TaskPriority, TaskStatus } from "@/lib/agents/types";

export const sharedQueuePath = "16 Agent Memory/Shared/Shared Task Queue.md";

const sectionStatus: Record<string, TaskStatus> = {
  Ready: "ready",
  Claimed: "claimed",
  "Waiting on Owen": "waiting",
  Blocked: "blocked",
  "Completed This Week": "completed",
};

function singleLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function field(block: string, label: string) {
  return block.match(new RegExp(`^- ${label}:\\s*(.*)$`, "mi"))?.[1]?.trim() ?? "";
}

function agentIdFromName(value: string): AgentId | "unassigned" {
  const normalized = value.toLowerCase();
  for (const [id, agent] of agentById) {
    if (agent.name.toLowerCase() === normalized) return id;
  }
  return "unassigned";
}

export function parseAgentTasks(content: string): AgentTask[] {
  const lines = content.split("\n");
  const tasks: AgentTask[] = [];
  let status: TaskStatus = "ready";

  for (let index = 0; index < lines.length; index += 1) {
    const section = lines[index].match(/^## (.+)$/)?.[1];
    if (section && sectionStatus[section]) status = sectionStatus[section];
    const heading = lines[index].match(/^### (TASK-\d{8}-\d{3}) - (.+)$/);
    if (!heading || heading[1] === "TASK-YYYYMMDD-001") continue;

    let end = index + 1;
    while (end < lines.length && !/^#{2,3} /.test(lines[end])) end += 1;
    const block = lines.slice(index + 1, end).join("\n");
    tasks.push({
      id: heading[1],
      title: heading[2].trim(),
      status,
      priority: (field(block, "Priority") as TaskPriority) || "medium",
      assignedAgent: agentIdFromName(field(block, "Assigned agent")),
      createdAt: field(block, "Created"),
      project: field(block, "Project").replace(/^\[\[|\]\]$/g, ""),
      objective: field(block, "Objective"),
      successCriteria: field(block, "Success criteria"),
    });
  }

  return tasks;
}

function localDateId() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
}

export function addTaskToQueue(content: string, input: CreateAgentTask) {
  const dateId = localDateId();
  const sequence = [...content.matchAll(new RegExp(`TASK-${dateId}-(\\d{3})`, "g"))]
    .reduce((maximum, match) => Math.max(maximum, Number(match[1])), 0) + 1;
  const id = `TASK-${dateId}-${String(sequence).padStart(3, "0")}`;
  const agent = agentById.get(input.assignedAgent);
  if (!agent) throw new Error("Unknown agent.");

  const task = `### ${id} - ${singleLine(input.title)}

- Status: ready
- Priority: ${input.priority}
- Requested by: Owen
- Assigned agent: ${agent.name}
- Created: ${new Date().toISOString()}
- Due: none
- Project: [[${singleLine(input.project)}]]
- Objective: ${singleLine(input.objective)}
- Inputs: See linked project memory and task context.
- Constraints: Follow agent permissions and escalation rules.
- Success criteria: ${singleLine(input.successCriteria)}
- Output path: Agent chooses the canonical project or knowledge note.

`;

  const readyHeading = "## Ready\n";
  const headingIndex = content.indexOf(readyHeading);
  if (headingIndex < 0) throw new Error("Shared queue is missing its Ready section.");
  const insertionPoint = headingIndex + readyHeading.length;
  const updatedDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const nextContent = `${content.slice(0, insertionPoint)}\n${task}${content.slice(insertionPoint)}`
    .replace(/^updated: .*$/m, `updated: ${updatedDate}`);

  return { id, content: nextContent };
}
