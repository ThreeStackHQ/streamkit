import { eq, sql } from "drizzle-orm";
import { channels } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { createRedisSubscriber } from "@/lib/redis";
import { authenticateApiKey } from "@/lib/api-key-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const authResult = await authenticateApiKey(request);
  if (!authResult) {
    return new Response(JSON.stringify({ status: "fail", message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const channel = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (channel.length === 0) {
    return new Response(JSON.stringify({ status: "fail", message: "Channel not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .update(channels)
    .set({ subscriberCount: sql`${channels.subscriberCount} + 1` })
    .where(eq(channels.id, channelId));

  const subscriber = createRedisSubscriber();
  const redisChannel = `streamkit:events:${channelId}`;

  const stream = new ReadableStream({
    async start(controller) {
      await subscriber.subscribe(redisChannel);

      subscriber.on("message", (_ch: string, message: string) => {
        controller.enqueue(`data: ${message}\n\n`);
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue('data: {"type":"heartbeat"}\n\n');
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      request.signal.addEventListener("abort", async () => {
        clearInterval(heartbeat);
        await subscriber.unsubscribe(redisChannel);
        await subscriber.quit();
        await db
          .update(channels)
          .set({
            subscriberCount: sql`GREATEST(${channels.subscriberCount} - 1, 0)`,
          })
          .where(eq(channels.id, channelId));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
