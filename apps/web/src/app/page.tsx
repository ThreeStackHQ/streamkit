import type { Metadata } from "next";
import Link from "next/link";
import { CodeTabs } from "@/components/CodeTabs";

export const metadata: Metadata = {
  title: "StreamKit — Real-Time Events. One API.",
  description:
    "Pusher without the $99/mo bill. Publish events via REST, receive instantly via SSE. Start free, no credit card required.",
  openGraph: {
    title: "StreamKit — Real-Time Events. One API.",
    description:
      "Pusher without the $99/mo bill. Publish events via REST, receive instantly via SSE.",
    url: "https://streamkit.threestack.io",
    siteName: "StreamKit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamKit — Real-Time Events. One API.",
    description: "Pusher without the $99/mo bill. Publish events via REST, receive instantly via SSE.",
  },
};

const features = [
  {
    icon: "⚡",
    title: "Server-Sent Events",
    desc: "No WebSocket infra needed. Native SSE works everywhere HTTP does.",
  },
  {
    icon: "👥",
    title: "Channel Presence",
    desc: "Know exactly who's connected to any channel in real time.",
  },
  {
    icon: "🕐",
    title: "Event History",
    desc: "24h replay for any channel. Late subscribers catch up instantly.",
  },
  {
    icon: "📦",
    title: "JS SDK <2KB",
    desc: "One script tag, zero dependencies. Drops into any project.",
  },
  {
    icon: "🔌",
    title: "REST Publish",
    desc: "Simple HTTP POST to publish. Any language, any framework.",
  },
  {
    icon: "🛡️",
    title: "Rate Limits",
    desc: "Fair usage per tier, never surprises. No runaway bills.",
  },
];

const comparisonRows: [string, string, string, string, string][] = [
  ["Price", "Free/$9/$29", "$99/mo", "$50/mo", "Self-hosted"],
  ["SSE Support", "✅ Native", "❌ WebSocket only", "✅ Yes", "✅ Yes"],
  ["Event History", "✅ 24h", "✅ 7 days", "✅ 72h", "❌ No"],
  ["Presence", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes"],
  ["SDK Size", "< 2KB", "~42KB", "~38KB", "~28KB"],
  ["SLA", "✅ Business tier", "✅ Paid plans", "✅ Paid plans", "❌ Self-managed"],
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    highlight: false,
    badge: null,
    features: [
      "50k events / month",
      "3 channels",
      "JS SDK included",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    highlight: true,
    badge: "Most Popular",
    features: [
      "5M events / month",
      "Unlimited channels",
      "Presence + 24h history",
      "Email support",
    ],
    cta: "Start Pro",
    href: "/signup?plan=pro",
  },
  {
    name: "Business",
    price: "$29",
    period: "/mo",
    highlight: false,
    badge: null,
    features: [
      "Unlimited events",
      "Custom domain",
      "99.9% SLA",
      "Priority support",
    ],
    cta: "Start Business",
    href: "/signup?plan=business",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-accent tracking-tight">
            StreamKit
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#docs" className="text-sm text-gray-400 hover:text-white transition-colors">
              Docs
            </a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="https://github.com/ThreeStackHQ/streamkit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
          <Link
            href="/signup"
            className="px-4 py-2 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              SSE-first · No WebSocket infra
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Real-Time Events.<br />
              <span className="text-brand-accent">One API.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
              Pusher without the $99/mo bill. Publish events via REST, receive
              instantly via SSE.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 bg-brand-accent text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Free
              </Link>
              <a
                href="#docs"
                className="px-6 py-3 border border-brand-accent/60 text-brand-accent font-semibold rounded-lg hover:bg-brand-accent/10 transition-colors"
              >
                View Docs
              </a>
            </div>
          </div>

          {/* Right: terminal mockup */}
          <div className="rounded-xl border border-white/10 bg-[#060d12] overflow-hidden font-mono text-sm shadow-2xl">
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d1a22] border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-gray-500 text-xs">terminal</span>
            </div>
            {/* Code snippet */}
            <div className="p-5">
              <p className="text-gray-500 text-xs mb-2"># publish an event</p>
              <p className="text-brand-accent">streamkit</p>
              <p className="text-gray-300">
                {"  "}.publish(<span className="text-yellow-300">&apos;order-updates&apos;</span>, {"{"}
              </p>
              <p className="text-gray-300 pl-4">
                orderId: <span className="text-yellow-300">&apos;ord_9f2Ka1&apos;</span>,
              </p>
              <p className="text-gray-300 pl-4">
                status: <span className="text-yellow-300">&apos;shipped&apos;</span>,
              </p>
              <p className="text-gray-300">{"  "}{"}"});</p>
            </div>
            {/* Live event log */}
            <div className="border-t border-white/10 p-4 bg-[#040a0e] space-y-2">
              <p className="text-gray-500 text-xs mb-3">▶ live event log</p>
              {[
                { event: "order.shipped", time: "just now" },
                { event: "order.updated", time: "2s ago" },
                { event: "user.checkout", time: "5s ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
                    {item.event}
                  </span>
                  <span className="text-gray-600 text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-gray-400 text-center mb-12">
          Built for developers who want real-time without the complexity.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 bg-[#0d1a22] border border-white/10 hover:border-brand-accent/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg border border-brand-accent/40 bg-brand-accent/10 flex items-center justify-center text-xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code Snippet Section ── */}
      <section id="docs" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Integrate in minutes</h2>
        <p className="text-gray-400 text-center mb-10">
          Connect your app with a few lines of code.
        </p>
        <CodeTabs />
      </section>

      {/* ── Comparison Table ── */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Why StreamKit?</h2>
        <p className="text-gray-400 text-center mb-10">
          All the features, none of the enterprise pricing.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1a22]">
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Feature</th>
                <th className="px-6 py-4 text-brand-accent font-semibold border-l-2 border-brand-accent bg-brand-accent/5">
                  StreamKit
                </th>
                <th className="px-6 py-4 text-gray-400 font-medium">Pusher</th>
                <th className="px-6 py-4 text-gray-400 font-medium">Ably</th>
                <th className="px-6 py-4 text-gray-400 font-medium">Soketi</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, sk, pusher, ably, soketi], i) => (
                <tr key={feature} className={i % 2 === 0 ? "bg-brand-bg" : "bg-[#060d12]"}>
                  <td className="px-6 py-4 text-gray-300 font-medium">{feature}</td>
                  <td className="px-6 py-4 text-center font-semibold text-brand-accent border-l-2 border-brand-accent bg-brand-accent/5">
                    {sk}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">{pusher}</td>
                  <td className="px-6 py-4 text-center text-gray-400">{ably}</td>
                  <td className="px-6 py-4 text-center text-gray-400">{soketi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">No hidden fees. Cancel anytime.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 border ${
                plan.highlight
                  ? "border-brand-accent ring-1 ring-brand-accent bg-brand-accent/5"
                  : "border-white/10 bg-[#0d1a22]"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-accent text-black text-xs font-bold rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-brand-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-brand-accent text-black hover:opacity-90"
                    : "border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#060d12]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© StreamKit 2026. Built by ThreeStack.</p>
          <div className="flex items-center gap-6">
            <a href="#docs" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Docs
            </a>
            <a href="#pricing" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Pricing
            </a>
            <Link href="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Login
            </Link>
            <Link href="/signup" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
