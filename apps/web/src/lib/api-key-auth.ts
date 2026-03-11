import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { apiKeys, subscriptions, workspaces } from "@streamkit/db/schema";
import { db } from "./db";

interface AuthResult {
  workspaceId: string;
  apiKeyId: string;
  tier: "free" | "pro" | "business";
  rateLimitPerMin: number;
}

export async function authenticateApiKey(
  request: Request
): Promise<AuthResult | null> {
  const key = request.headers.get("X-StreamKit-Key");
  if (!key) return null;

  const prefix = key.slice(0, 8);

  const results = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))
    .limit(10);

  for (const row of results) {
    if (!row.isActive) continue;
    const match = await bcryptjs.compare(key, row.keyHash);
    if (!match) continue;

    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.id));

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, row.workspaceId))
      .limit(1);

    const tier = sub[0]?.tier ?? "free";

    return {
      workspaceId: row.workspaceId,
      apiKeyId: row.id,
      tier,
      rateLimitPerMin: row.rateLimitPerMin,
    };
  }

  return null;
}
