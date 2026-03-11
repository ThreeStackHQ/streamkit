"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
  slug: string;
  isPresenceEnabled: boolean;
  subscriberCount: number;
  eventsThisHour: number;
  createdAt: string;
}

interface ChannelSectionProps {
  channels: Channel[];
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ChannelSection({ channels }: ChannelSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: channelName.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "Failed to create channel");
        return;
      }
      setChannelName("");
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Channels</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          + New Channel
        </button>
      </div>

      {/* Table or empty state */}
      {channels.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1a22] p-12 text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white font-medium mb-1">No channels yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create a channel to start streaming events.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Create your first channel
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1a22]">
              <tr>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Channel</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Subscribers</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Events/hr</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">History</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Last Event</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => {
                const isActive = (ch.eventsThisHour ?? 0) > 0;
                return (
                  <tr key={ch.id} className={i % 2 === 0 ? "bg-brand-bg" : "bg-[#060d12]"}>
                    <td className="px-5 py-3 font-medium text-white">
                      <span className="font-mono text-brand-accent text-xs bg-brand-accent/10 px-2 py-0.5 rounded mr-2">
                        #{ch.slug}
                      </span>
                      {ch.name}
                    </td>
                    <td className="px-5 py-3 text-gray-300">{ch.subscriberCount ?? 0}</td>
                    <td className="px-5 py-3 text-gray-300">{ch.eventsThisHour ?? 0}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-green-500/15 text-green-400"
                            : "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        )}
                        {isActive ? "Active" : "Idle"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                        24h
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{timeAgo(ch.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-[#0d1a22] rounded-xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">New Channel</h3>
            <p className="text-gray-400 text-sm mb-5">
              Give your channel a descriptive name.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Channel name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. order-updates"
                  className="w-full bg-brand-bg border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-white/20 text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !channelName.trim()}
                  className="flex-1 py-2.5 bg-brand-accent text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
