import { Bot, Plus } from "lucide-react";

import { AgentControlCenter } from "@/components/agents/AgentControlCenter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agent Workspace"
        title="Control Center"
        description="Assign focused work, inspect permissions, and coordinate Codex and Hermes through permanent Obsidian memory."
        actions={<Button disabled><Plus /><Bot />New automation</Button>}
      />
      <AgentControlCenter />
    </div>
  );
}
