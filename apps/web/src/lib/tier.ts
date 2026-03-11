type Tier = "free" | "pro" | "business";

const TIER_LIMITS = {
  free: { channels: 1, monthlyEvents: 10_000, ratePerMin: 60 },
  pro: { channels: 25, monthlyEvents: 500_000, ratePerMin: 600 },
  business: { channels: Infinity, monthlyEvents: Infinity, ratePerMin: Infinity },
} as const;

export function getChannelLimit(tier: Tier): number {
  return TIER_LIMITS[tier].channels;
}

export function getMonthlyEventLimit(tier: Tier): number {
  return TIER_LIMITS[tier].monthlyEvents;
}

export function getRateLimit(tier: Tier): number {
  return TIER_LIMITS[tier].ratePerMin;
}
