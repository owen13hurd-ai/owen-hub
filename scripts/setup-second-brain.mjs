import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const vault = process.env.OBSIDIAN_VAULT_PATH || join(homedir(), "Documents", "Obsidian Vault");
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const created = [];
const skipped = [];

function frontmatter(title, extra = "") {
  const overriddenKeys = new Set(
    [...extra.matchAll(/^([a-z_][a-z0-9_-]*):/gim)].map((match) => match[1]),
  );
  const defaults = [
    ["status", "active"],
    ["tags", "[]"],
    ["aliases", "[]"],
    ["related_projects", "[]"],
    ["people", "[]"],
    ["companies", "[]"],
    ["topics", "[]"],
    ["source", "personal"],
    ["confidence", "high"],
    ["last_reviewed", today],
  ].filter(([key]) => !overriddenKeys.has(key));
  return `---
title: ${title}
created: ${today}
updated: ${today}
${defaults.map(([key, value]) => `${key}: ${value}`).join("\n")}
${extra}---\n`;
}

async function create(relativePath, content) {
  const destination = join(vault, relativePath);
  await mkdir(join(destination, ".."), { recursive: true });
  try {
    await writeFile(destination, content, { encoding: "utf8", flag: "wx" });
    created.push(relativePath);
  } catch (error) {
    if (error?.code === "EEXIST") skipped.push(relativePath);
    else throw error;
  }
}

const folders = [
  ["00 Inbox", "Fast capture awaiting review", "Capture first. During daily or weekly review, clarify and move each note to its durable home."],
  ["01 Projects", "Active outcomes with a finish line", "Each project owns objectives, status, roadmap, decisions, lessons, issues, links, and next actions."],
  ["02 Areas", "Ongoing responsibilities", "Areas have standards to maintain but no completion date."],
  ["03 Knowledge", "Durable concepts and explanations", "Prefer small linked notes over duplicated summaries."],
  ["04 Resources", "Reusable external material", "Store source notes, guides, datasets, and reference links."],
  ["05 Templates", "Consistent note starters", "Templates define metadata and minimum useful structure."],
  ["06 Daily Notes", "Daily capture and execution", "Record priorities, events, quick notes, and the daily shutdown."],
  ["07 Weekly Reviews", "Weekly reflection and planning", "Review projects, areas, inboxes, decisions, and agent health."],
  ["08 Journal", "Personal reflection", "Keep reflective writing separate from operational project records."],
  ["09 Meetings", "Conversations with outcomes", "Capture attendees, decisions, actions, and follow-ups."],
  ["10 Reference", "Stable lookup material", "Use for facts and lists that are consulted more than developed."],
  ["11 People", "Relationship memory", "One canonical note per person with respectful, relevant context."],
  ["12 Companies", "Organization research", "Track verified company facts, contacts, roles, and history."],
  ["13 Decisions", "Important choices and tradeoffs", "Create a decision note when future Owen or an agent may ask why."],
  ["14 SOPs", "Repeatable procedures", "Write steps that another agent or future Owen can execute and verify."],
  ["15 Prompt Library", "Versioned reusable prompts", "Each prompt declares purpose, inputs, outputs, examples, and history."],
  ["16 Agent Memory", "Current shared state and queues", "Structured Markdown is the only coordination layer between agents."],
  ["17 Agent Logs", "Append-only execution history", "Never rewrite prior entries. Corrections are new entries referencing the old one."],
  ["18 Archive", "Inactive material kept for history", "Archive instead of deleting durable context."],
];

for (const [folder, purpose, rule] of folders) {
  await create(`${folder}/_${folder} MOC.md`, `${frontmatter(`${folder} Map of Content`, `tags:\n  - moc\n`)}\n# ${folder}\n\n## Purpose\n\n${purpose}.\n\n## Operating Rule\n\n${rule}\n\n## Index\n\n- Add links here as canonical notes are created.\n`);
}

const projectNames = ["Owen's Hub", "Career Hub", "Dynasty Hub", "Pokemon Hub", "Pokemon Restock Hub", "Poker Hub", "Travel Hub", "Second Brain"];
for (const project of projectNames) {
  const slug = project.replaceAll("'", "");
  await create(`01 Projects/${slug}/${slug} Project.md`, `${frontmatter(project, `tags:\n  - project\nrelated_projects:\n  - "[[${slug} Project]]"\n`)}\n# ${project}\n\n## Objective\n\nDefine the outcome this project must create.\n\n## Current Status\n\n- Phase: Foundation\n- Health: Active\n- Owner: Owen\n- Last update: ${today}\n\n## Next Actions\n\n- [ ] Clarify the next highest-value outcome.\n\n## Roadmap\n\n## Architecture\n\n## Open Questions\n\n## Decisions\n\n## Lessons Learned\n\n## Known Issues\n\n## Useful Links\n\n## Future Ideas\n`);
}

const knowledgeTopics = ["Programming", "Economics", "Pokemon", "Supply Chain", "AI", "Investing"];
for (const topic of knowledgeTopics) {
  await create(`03 Knowledge/${topic}/${topic} MOC.md`, `${frontmatter(`${topic} Map of Content`, `tags:\n  - moc\n  - knowledge/${topic.toLowerCase().replaceAll(" ", "-")}\ntopics:\n  - ${topic}\n`)}\n# ${topic}\n\n## Core Concepts\n\n## Research Notes\n\n## Questions\n\n## Related Projects\n`);
}

const areaNames = ["Health", "Career", "Finance", "Family", "Technology", "Home"];
for (const area of areaNames) {
  await create(`02 Areas/${area}/${area} Area.md`, `${frontmatter(`${area} Area`, `tags:\n  - area\n`)}\n# ${area}\n\n## Standard\n\nWhat does healthy maintenance look like?\n\n## Current State\n\n## Routines\n\n## Open Loops\n\n## Related Projects\n`);
}

const templates = {
  "Daily Note": "# {{date}}\n\n## Top Three\n\n- [ ] \n- [ ] \n- [ ] \n\n## Schedule\n\n## Capture\n\n## Decisions\n\n## Shutdown\n\n- Wins:\n- Learned:\n- Carry forward:\n",
  "Weekly Review": "# Week of {{date}}\n\n## Wins\n\n## Metrics\n\n## Project Review\n\n## Area Review\n\n## Inbox Processing\n\n## Agent Health\n\n## Decisions and Lessons\n\n## Next Week\n",
  "Meeting": "# {{title}}\n\n## Attendees\n\n## Purpose\n\n## Notes\n\n## Decisions\n\n## Actions\n\n- [ ] Owner - action - due date\n\n## Follow-up\n",
  "Decision Log": "# {{title}}\n\n## Problem\n\n## Options Considered\n\n## Decision\n\n## Reasoning\n\n## Tradeoffs\n\n## Related Notes\n\n## Review Date\n",
  "Project": "# {{title}}\n\n## Objective\n\n## Current Status\n\n## Next Actions\n\n## Roadmap\n\n## Architecture\n\n## Open Questions\n\n## Decisions\n\n## Lessons Learned\n\n## Known Issues\n\n## Useful Links\n\n## Future Ideas\n",
  "Research Note": "# {{title}}\n\n## Question\n\n## Short Answer\n\n## Evidence\n\n## Analysis\n\n## Confidence\n\n## Sources\n\n## Follow-up Questions\n",
  "Company": "# {{title}}\n\n## Overview\n\n## Verified Facts\n\n## People\n\n## Roles\n\n## History\n\n## Opportunities\n\n## Sources\n",
  "Person": "# {{title}}\n\n## Context\n\n## Relationship\n\n## Last Contact\n\n## Follow-ups\n\n## Notes\n",
  "Book": "# {{title}}\n\n## Author\n\n## Thesis\n\n## Key Ideas\n\n## Useful Quotes\n\n## Applications\n\n## Related Notes\n",
  "Podcast": "# {{title}}\n\n## Episode\n\n## Guests\n\n## Summary\n\n## Key Ideas\n\n## Actions\n\n## Source\n",
  "Article": "# {{title}}\n\n## Summary\n\n## Claims\n\n## Evidence\n\n## Applications\n\n## Source\n",
  "Prompt": "# {{title}}\n\n## Purpose\n\n## Inputs\n\n## Prompt\n\n## Expected Output\n\n## Example\n\n## Version History\n\n- v1.0 - {{date}} - Initial version\n",
  "AI Conversation": "# {{title}}\n\n## Goal\n\n## Context Provided\n\n## Useful Output\n\n## Decisions\n\n## Follow-up\n",
  "Lesson Learned": "# {{title}}\n\n## Situation\n\n## What Happened\n\n## Lesson\n\n## Evidence\n\n## Future Rule\n\n## Related Project\n",
  "Standard Operating Procedure": "# {{title}}\n\n## Purpose\n\n## Trigger\n\n## Inputs\n\n## Procedure\n\n1. \n\n## Verification\n\n## Failure Recovery\n\n## Owner\n",
  "Experiment": "# {{title}}\n\n## Hypothesis\n\n## Method\n\n## Success Metric\n\n## Results\n\n## Conclusion\n\n## Next Experiment\n",
  "Idea": "# {{title}}\n\n## Idea\n\n## Problem It Solves\n\n## Potential Value\n\n## Risks\n\n## Smallest Test\n",
  "Postmortem": "# {{title}}\n\n## Summary\n\n## Impact\n\n## Timeline\n\n## Root Cause\n\n## What Went Well\n\n## What Failed\n\n## Corrective Actions\n",
};

for (const [name, body] of Object.entries(templates)) {
  await create(`05 Templates/${name}.md`, `${frontmatter(name, `status: template\ntags:\n  - template\n`)}\n${body}`);
}

const coreAgents = [
  ["Project Manager", "Coordinate priorities, dependencies, task ownership, and project status across the system.", "Plans work and routes tasks; does not invent specialist conclusions."],
  ["Research", "Produce source-backed answers and durable research notes.", "Separates facts, inference, uncertainty, and source quality."],
  ["Career", "Improve Owen's truthful career strategy, applications, and interview readiness.", "Career Profile is the source of truth; never fabricates experience."],
  ["Dynasty", "Analyze rankings, portfolios, leagues, rookies, and trades using Owen's values.", "Distinguishes personal value from market value."],
  ["Pokemon", "Support competitive play, team building, battle review, and TCG restock decisions.", "States format and data freshness for every recommendation."],
  ["Daily Briefing", "Turn verified updates from every domain into one concise daily briefing and action list.", "Summarizes existing agent outputs before performing additional research."],
  ["Documentation", "Keep project memory, decisions, changelogs, links, and indexes current.", "Documents meaningful work before declaring it complete."],
  ["QA", "Verify outputs, data quality, links, builds, workflows, and unresolved risk.", "Reports failures precisely and never marks untested work verified."],
];

for (const [name, mission, guardrail] of coreAgents) {
  await create(`16 Agent Memory/Agents/${name} Agent.md`, `${frontmatter(`${name} Agent`, `tags:\n  - agent\nagent_name: ${name}\nversion: 1.0.0\nowner: Owen\nstatus: active\n`)}\n# ${name} Agent\n\n## Mission\n\n${mission}\n\n## Responsibilities\n\n- Accept structured tasks from [[Shared Task Queue]].\n- Read related project memory before acting.\n- Produce human-readable Markdown outputs.\n- Append an entry to the daily agent log.\n\n## Tools\n\n- Obsidian Markdown vault\n- Approved project tools and APIs\n- Owen's Hub\n\n## Inputs\n\nTask ID, objective, context links, constraints, due date, and success criteria.\n\n## Outputs\n\nResult, files changed, confidence, next actions, questions, and blockers.\n\n## Memory\n\nRead project notes plus 16 Agent Memory/Shared. Write durable knowledge to its canonical note and execution history to 17 Agent Logs.\n\n## Escalation Rules\n\n- Ask Owen when missing information could materially change the result.\n- Never fabricate facts, credentials, actions, or completion.\n- Escalate destructive, financial, account, privacy, or external-send actions.\n\n## Health Checks\n\n- Queue has no abandoned accepted tasks.\n- Logs exist for completed work.\n- Project status and decisions reflect the latest work.\n\n## Guardrail\n\n${guardrail}\n`);
}

await create("16 Agent Memory/Shared/Shared Task Queue.md", `${frontmatter("Shared Task Queue", `tags:\n  - agent/queue\n`)}\n# Shared Task Queue\n\n## Ready\n\n<!-- One task per heading. Use the Task template below. -->\n\n## Claimed\n\n## Waiting on Owen\n\n## Blocked\n\n## Completed This Week\n\n## Task Template\n\n### TASK-YYYYMMDD-001 - Short title\n\n- Status: ready\n- Priority: medium\n- Requested by: Owen\n- Assigned agent: unassigned\n- Created: YYYY-MM-DDTHH:mm:ss-05:00\n- Due: none\n- Project: [[Project Note]]\n- Objective:\n- Inputs:\n- Constraints:\n- Success criteria:\n- Output path:\n`);

await create("16 Agent Memory/Shared/Memory Protocol.md", `${frontmatter("Agent Memory Protocol", `tags:\n  - agent/memory\n`)}\n# Agent Memory Protocol\n\n## Required Completion Record\n\nEvery meaningful run records:\n\n- What happened\n- What changed\n- Why\n- Files modified\n- Confidence\n- Next actions\n- Questions\n- Blockers\n- Timestamp\n- Task ID\n- Agent name and version\n\n## Write Rules\n\n1. Read the project note and active task before acting.\n2. Update canonical knowledge instead of duplicating it.\n3. Append history; never rewrite a prior log entry.\n4. Link every log to its task and project.\n5. Mark inference and uncertainty explicitly.\n6. Never store passwords, tokens, private keys, or payment data.\n7. An agent cannot mark its own unverified claim as QA-verified.\n`);

await create("16 Agent Memory/Shared/Agent Registry.md", `${frontmatter("Agent Registry", `tags:\n  - agent/registry\n`)}\n# Agent Registry\n\n## Active Core Agents\n\n- [[Project Manager Agent]]\n- [[Research Agent]]\n- [[Career Agent]]\n- [[Dynasty Agent]]\n- [[Pokemon Agent]]\n- [[Daily Briefing Agent]]\n- [[Documentation Agent]]\n- [[QA Agent]]\n\n## Specialists To Activate When Needed\n\n- Resume Agent - application-specific resume production\n- Job Agent - job discovery and scoring\n- News Agent - daily source monitoring\n- Finance Agent - personal finance analysis with strict verification\n- Travel Agent - itinerary and booking research\n- Learning Agent - curricula and spaced review\n- Scheduler - calendar and recurring task coordination\n- Code Agent - implementation delegated by Project Manager\n\nSpecialists use the same queue, memory, logging, and escalation protocol.\n`);

await create(`17 Agent Logs/${today} Agent Log.md`, `${frontmatter(`${today} Agent Log`, `tags:\n  - agent/log\n`)}\n# ${today} Agent Log\n\n## Entries\n\n### ${new Date().toISOString()} - Documentation Agent\n\n- Task ID: SYSTEM-SECOND-BRAIN-001\n- What happened: Created the initial Second Brain structure, templates, projects, agents, queue, and memory protocol.\n- What changed: Added missing Markdown files without overwriting existing notes.\n- Why: Establish transparent long-term memory and coordination for Codex and future Hermes agents.\n- Files modified: See Git commit for this vault snapshot.\n- Confidence: High\n- Next actions: Review folder names and begin processing 00 Inbox.\n- Questions: None.\n- Blockers: Hermes runtime is not installed.\n`);

const sops = {
  "Starting a Project": ["Create a Project note from the template.", "Define objective and success criteria.", "Link relevant areas, people, companies, and knowledge.", "Record initial decisions and next actions.", "Add active tasks to the shared queue."],
  "Closing a Project": ["Confirm success criteria or reason for stopping.", "Record outcomes and remaining risks.", "Create lessons learned and any postmortem.", "Move reusable knowledge to canonical notes.", "Archive the project folder and close its tasks."],
  "Research Workflow": ["Write the exact question.", "Prefer primary and current sources.", "Capture evidence and source links.", "Separate facts from inference.", "Record confidence and unresolved questions."],
  "Coding Workflow": ["Read project architecture and local instructions.", "Create or claim a task.", "Implement the smallest coherent change.", "Run typecheck, lint, tests, and build as applicable.", "Update project memory, decisions, changelog, and agent log."],
  "Debugging": ["Reproduce the issue.", "Capture expected versus actual behavior.", "Form and test one hypothesis at a time.", "Fix the root cause.", "Add verification and document the lesson."],
  "Job Application": ["Verify the role and company.", "Read Career Profile and master resume.", "Ask only material factual questions.", "Tailor without fabrication.", "Save a new application copy and update tracker notes."],
  "Knowledge Capture": ["Capture quickly in 00 Inbox.", "Clarify the note's purpose.", "Link or merge with canonical knowledge.", "Add metadata and sources.", "Move it to the correct folder and update its MOC."],
  "Daily Review": ["Process urgent inbox items.", "Review today's top three.", "Check waiting and blocked agent tasks.", "Capture decisions and lessons.", "Prepare tomorrow's first action."],
  "Weekly Review": ["Empty or triage the inbox.", "Review all active projects and areas.", "Review agent queues and health.", "Update roadmap and priorities.", "Choose next week's outcomes."],
};

for (const [name, steps] of Object.entries(sops)) {
  await create(`14 SOPs/${name}.md`, `${frontmatter(name, `tags:\n  - sop\n`)}\n# ${name}\n\n## Purpose\n\nCreate a repeatable, inspectable workflow.\n\n## Procedure\n\n${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n## Verification\n\n- Required outputs exist.\n- Links and metadata are valid.\n- Open questions and blockers are explicit.\n`);
}

await create("README.md", `${frontmatter("Owen's Second Brain", `tags:\n  - system\n  - moc\n`)}\n# Owen's Second Brain\n\nThis vault is the local-first, Markdown-based knowledge and coordination layer for Owen, Codex, Owen's Hub, and future Hermes agents.\n\n## Start Here\n\n- [[Second Brain Home]]\n- [[Shared Task Queue]]\n- [[Agent Registry]]\n- [[Agent Memory Protocol]]\n- [[Second Brain Project]]\n\n## Principles\n\n- Human-readable Markdown is canonical.\n- Prefer links over duplication.\n- Agent work is explicit and append-only.\n- Important claims include sources and confidence.\n- Secrets never belong in the vault.\n- Git provides history; it is not a substitute for clear logs.\n`);

await create("Second Brain Home.md", `${frontmatter("Second Brain Home", `tags:\n  - moc\n  - dashboard\n`)}\n# Second Brain Home\n\n## Capture\n\n- [[00 Inbox/_00 Inbox MOC|Inbox]]\n- [[06 Daily Notes/_06 Daily Notes MOC|Daily Notes]]\n\n## Active Work\n\n- [[01 Projects/_01 Projects MOC|Projects]]\n- [[Shared Task Queue]]\n- [[Agent Registry]]\n\n## Knowledge\n\n- [[03 Knowledge/_03 Knowledge MOC|Knowledge]]\n- [[04 Resources/_04 Resources MOC|Resources]]\n- [[10 Reference/_10 Reference MOC|Reference]]\n\n## Review\n\n- [[07 Weekly Reviews/_07 Weekly Reviews MOC|Weekly Reviews]]\n- [[13 Decisions/_13 Decisions MOC|Decisions]]\n- [[17 Agent Logs/_17 Agent Logs MOC|Agent Logs]]\n`);

await create("10 Reference/Conventions/Naming and Linking.md", `${frontmatter("Naming and Linking Conventions", `tags:\n  - system/conventions\n`)}\n# Naming and Linking Conventions\n\n## Names\n\n- Notes use readable title case.\n- Daily files use YYYY-MM-DD.\n- Agent logs use YYYY-MM-DD Agent Log.\n- Tasks use stable IDs: TASK-YYYYMMDD-NNN.\n- One canonical note represents each person, company, decision, or durable concept.\n\n## Links\n\n- Link the first meaningful mention of a canonical concept.\n- Project logs link their project, task, and agent.\n- MOCs organize navigation; folders organize storage.\n- Do not create empty links merely to make the graph dense.\n\n## Tags\n\nUse tags for workflow and broad type, links for meaning. Prefer project, area, agent/log, status/waiting, and topic/name. Avoid synonyms for the same tag.\n`);

console.log(JSON.stringify({ vault, created: created.length, skipped: skipped.length, createdFiles: created }, null, 2));
