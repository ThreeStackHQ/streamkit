import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";
import { channels, apiKeys, eventLog, subscriptions } from "@streamkit/db/schema";
import { ChannelSection } from "@/components/ChannelSection";

// ── Types ──────────────────────────────────────────────────────────────────

interface StatsData {
  eventsToday: number;
  activeChannels: number;
  totalApiKeys: number;
  eventsThisMonth: number;
  planLimit: number;
}

interface ChannelData {
  id: string;
  name: string;
  slug: string;
  isPresenceEnabled: boolean;
  subscriberCount: number;
  eventsThisHour: number;
  createdAt: string;
}

// ── Mock chart data ────────────────────────────────────────────────────────

const mockChartData = [
  { day: "Mon", value: 420 },
  { day: "Tue", value: 780 },
  { day: "Wed", value: 560 },
  { day: "Thu", value: 1200 },
  { day: "Fri", value: 890 },
  { day: "Sat", value: 340 },
  { day: "Sun", value: 610 },
];

const CHART_MAX = 1400;

// Mock live stream events
const mockLiveEvents = [
  { event: "order.shipped", channel: "order-updates", time: "2s ago", payload: '{"orderId":"ord_9f2"}' },
  { event: "user.signup", channel: "auth-events", time: "14s ago", payload: '{"userId":"u_4kx"}' },
  { event: "payment.success", channel: "billing", time: "1m ago", payload: '{"amount":29}' },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
  if (!workspaceId) redirect("/login");

  // Fetch stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const workspaceChannels = await db
    .select({ id: channels.id })
    .from(channels)
    .where(eq(channels.workspaceId, workspaceId));

  const channelIds = workspaceChannels.map((c) => c.id);

  let eventsToday = 0;
  if (channelIds.length > 0) {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventLog)
      .where(
        and(
          sql`${eventLog.channelId} = ANY(${channelIds})`,
          gte(eventLog.createdAt, today)
        )
      );
    eventsToday = result[0]?.count ?? 0;
  }

  const keyCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspaceId));

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  const stats: StatsData = {
    eventsToday,
    activeChannels: workspaceChannels.length,
    totalApiKeys: keyCount[0]?.count ?? 0,
    eventsThisMonth: sub[0]?.eventsThisMonth ?? 0,
    planLimit: 50000,
  };

  // Fetch channels
  const channelRows = await db
    .select()
    .from(channels)
    .where(eq(channels.workspaceId, workspaceId));

  const channelData: ChannelData[] = channelRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isPresenceEnabled: c.isPresenceEnabled,
    subscriberCount: c.subscriberCount ?? 0,
    eventsThisHour: c.eventsThisHour ?? 0,
    createdAt: c.createdAt.toISOString(),
  }));

  const usagePct = Math.min(100, Math.round((stats.eventsThisMonth / stats.planLimit) * 100));

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Your StreamKit workspace at a glance.</p>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Events Today */}
        <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
            Total Events Today
          </p>
          <p className="text-3xl font-bold text-white">
            {stats.eventsToday.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-2">Resets at midnight UTC</p>
        </div>

        {/* Active Connections */}
        <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
            Active Connections
          </p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-white">0</p>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">SSE connections (real-time)</p>
        </div>

        {/* Channels */}
        <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
            Channels
          </p>
          <p className="text-3xl font-bold text-white">
            {stats.activeChannels}
            <span className="text-lg text-gray-500 font-normal">/50</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">Free plan limit</p>
        </div>

        {/* API Calls This Month */}
        <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
            API Calls This Month
          </p>
          <p className="text-3xl font-bold text-white mb-2">
            {stats.eventsThisMonth.toLocaleString()}
          </p>
          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
            <div
              className="bg-brand-accent h-1.5 rounded-full transition-all"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">{usagePct}% of 50k / mo</p>
        </div>
      </div>

      {/* ── Event Volume Chart (mock) ── */}
      <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">Event Volume (30 days)</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
            Connect your SDK to see real data
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-5">Mock data shown below</p>

        {/* CSS bar chart */}
        <div className="flex items-end gap-2 h-32">
          {mockChartData.map((d) => {
            const heightPct = Math.round((d.value / CHART_MAX) * 100);
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-accent/30 hover:bg-brand-accent/50 transition-colors relative group"
                  style={{ height: `${heightPct}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0d1a22] border border-white/10 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.value.toLocaleString()}
                  </div>
                </div>
                <span className="text-gray-500 text-xs">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom grid: Channels + Live Stream ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Channels table */}
        <div className="lg:col-span-2">
          <ChannelSection channels={channelData} />
        </div>

        {/* Live Stream Panel */}
        <div className="bg-[#0d1a22] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold">Live Event Stream</h2>
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          </div>
          <p className="text-gray-400 text-xs mb-5">
            Real-time events appear here as they arrive
          </p>

          {/* Placeholder */}
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-4 border border-white/10 rounded-lg p-3 bg-brand-bg">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            Listening for events…
          </div>

          {/* Mock events */}
          <div className="space-y-3">
            {mockLiveEvents.map((ev, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-3 bg-brand-bg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-brand-accent">{ev.event}</span>
                  <span className="text-gray-500 text-xs">{ev.time}</span>
                </div>
                <p className="text-gray-500 text-xs mb-1">#{ev.channel}</p>
                <code className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  {ev.payload}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
