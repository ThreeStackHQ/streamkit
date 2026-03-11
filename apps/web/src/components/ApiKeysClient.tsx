"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface ApiKeysClientProps {
  apiKeys: ApiKey[];
}

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return "Never";
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApiKeysClient({ apiKeys }: ApiKeysClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setCreateError(data.message ?? "Failed to create key");
        return;
      }
      const data = (await res.json()) as { data: { key: string } };
      setNewKey(data.data.key);
      setKeyName("");
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
    setRevoking(id);
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCloseNewKey() {
    setNewKey(null);
    setShowCreate(false);
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your API keys for accessing the StreamKit API.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          + Create API Key
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 bg-brand-accent/10 border border-brand-accent/20 rounded-xl p-4 flex gap-3">
        <span className="text-brand-accent text-lg">🔑</span>
        <div>
          <p className="text-sm text-white font-medium">Keep your API keys secure</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Never share your API keys publicly. Revoke and rotate keys if compromised.
          </p>
        </div>
      </div>

      {/* Quick start */}
      <div className="mb-6 bg-[#0d1a22] rounded-xl border border-white/10 p-5">
        <p className="text-sm text-gray-400 mb-2 font-medium">Quick start</p>
        <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
          {`curl -X POST https://streamkit.threestack.io/api/v1/events \\
  -H "X-API-Key: sk_live_..." \\
  -d '{"channel":"my-channel","event":"hello","payload":{}}'`}
        </pre>
      </div>

      {/* Table or empty state */}
      {apiKeys.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1a22] p-12 text-center">
          <p className="text-4xl mb-3">🔑</p>
          <p className="text-white font-medium mb-1">No API keys yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create an API key to start publishing events.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:opacity-90"
          >
            Create your first key
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1a22]">
              <tr>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Key</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Created</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Last Used</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key, i) => (
                <tr key={key.id} className={i % 2 === 0 ? "bg-brand-bg" : "bg-[#060d12]"}>
                  <td className="px-5 py-3 font-medium text-white">{key.name}</td>
                  <td className="px-5 py-3">
                    <code className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-gray-300">
                      {key.keyPrefix}••••••••••••••••
                    </code>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{formatDate(key.createdAt)}</td>
                  <td className="px-5 py-3 text-gray-400">{timeAgo(key.lastUsedAt)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        key.isActive
                          ? "bg-green-500/15 text-green-400"
                          : "bg-gray-500/15 text-gray-400"
                      }`}
                    >
                      {key.isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      )}
                      {key.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(key.id)}
                      disabled={revoking === key.id}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {revoking === key.id ? "Revoking…" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreate && !newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-[#0d1a22] rounded-xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1">Create API Key</h3>
            <p className="text-gray-400 text-sm mb-5">
              Give your key a name to identify it later.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Key name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Server"
                  className="w-full bg-brand-bg border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
                  autoFocus
                />
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-white/20 text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !keyName.trim()}
                  className="flex-1 py-2.5 bg-brand-accent text-black font-semibold rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Display Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-[#0d1a22] rounded-xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-lg">✅</span>
              <h3 className="text-lg font-semibold">API Key Created</h3>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-5 mt-3">
              <p className="text-yellow-400 text-xs font-medium">
                ⚠️ Save this key now. You won&apos;t be able to see it again.
              </p>
            </div>
            <div className="bg-brand-bg border border-white/10 rounded-lg p-4 mb-4 flex items-center gap-3">
              <code className="font-mono text-sm text-brand-accent flex-1 break-all">
                {newKey}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 px-3 py-1.5 border border-white/20 text-gray-300 rounded text-xs hover:bg-white/5 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={handleCloseNewKey}
              className="w-full py-2.5 bg-brand-accent text-black font-semibold rounded-lg text-sm hover:opacity-90"
            >
              I&apos;ve saved my key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
