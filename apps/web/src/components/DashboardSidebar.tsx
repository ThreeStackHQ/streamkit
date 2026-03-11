"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "⊞" },
  { href: "/dashboard/channels", label: "Channels", icon: "📡" },
  { href: "/dashboard/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/dashboard/event-log", label: "Event Log", icon: "📋" },
  { href: "/dashboard/billing", label: "Usage & Billing", icon: "💳" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

interface DashboardSidebarProps {
  email: string;
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full w-60 bg-[#0d1a22] border-r border-white/10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="text-lg font-bold text-brand-accent tracking-tight">
          StreamKit
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-brand-accent/15 text-brand-accent"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent text-sm font-bold flex-shrink-0">
            {email.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-400 truncate">{email}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/5"
        >
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#0d1a22] border border-white/10 text-white"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 h-full">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
