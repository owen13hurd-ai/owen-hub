import { Bell, BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { RestockHubClient } from "@/components/restocks/RestockHubClient";
import { Button } from "@/components/ui/button";
import { getRestockSnapshot } from "@/lib/restocks/connectors/registry";

export const dynamic = "force-dynamic";

export default async function RestockHubPage() {
  const snapshot = await getRestockSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pokémon Restocks"
        title="MSRP Watch Center"
        description="Track verified inventory, upcoming releases, preferred stores, and the products you want before they disappear."
        actions={
          <>
            <Button variant="outline" disabled><BookOpen />Buying guide</Button>
            <Button disabled><Bell />Alerts setup</Button>
          </>
        }
      />
      <RestockHubClient initialSnapshot={snapshot} />
    </div>
  );
}
