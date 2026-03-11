import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { apiKeys } from "@streamkit/db/schema";
import { ApiKeysClient } from "@/components/ApiKeysClient";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
  if (!workspaceId) redirect("/login");

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId));

  const serialized = keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <ApiKeysClient apiKeys={serialized} />
    </div>
  );
}
