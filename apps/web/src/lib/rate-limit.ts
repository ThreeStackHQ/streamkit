import { getRedis } from "./redis";

export async function checkRateLimit(
  apiKeyId: string,
  limitPerMin: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (limitPerMin === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  const redis = getRedis();
  const now = Math.floor(Date.now() / 60000);
  const key = `ratelimit:${apiKeyId}:${now}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60);
  }

  return {
    allowed: current <= limitPerMin,
    remaining: Math.max(0, limitPerMin - current),
  };
}
