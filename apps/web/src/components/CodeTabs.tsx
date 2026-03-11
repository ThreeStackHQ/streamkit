"use client";

import { useState } from "react";

type Tab = "js" | "python" | "curl";

const TABS: { id: Tab; label: string }[] = [
  { id: "js", label: "JS" },
  { id: "python", label: "Python" },
  { id: "curl", label: "cURL" },
];

const CODE: Record<Tab, string> = {
  js: `const streamkit = new StreamKit('sk_live_...');

streamkit.subscribe('order-updates', (e) => {
  console.log(e);
});`,
  python: `import streamkit

sk = streamkit.StreamKit('sk_live_...')
sk.publish('order-updates', {'orderId': '123'})`,
  curl: `curl -X POST https://streamkit.threestack.io/api/v1/events \\
  -H "X-API-Key: sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "order-updates",
    "event": "new_order",
    "payload": {"id": "123"}
  }'`,
};

export function CodeTabs() {
  const [active, setActive] = useState<Tab>("js");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(CODE[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      {/* Tab bar */}
      <div className="flex items-center justify-between bg-[#0d1a22] border-b border-white/10 px-4">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                active === tab.id
                  ? "border-brand-accent text-brand-accent"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded border border-white/10 hover:border-white/30"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code block */}
      <div className="bg-[#060d12] p-6 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
          {CODE[active]}
        </pre>
      </div>
    </div>
  );
}
