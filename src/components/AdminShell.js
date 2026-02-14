"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, TrendingUp, LogOut } from "lucide-react";

export default function AdminShell({ children, title }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    router.replace("/admin");
  };

  const nav = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/panel", label: "Siparişler", icon: ShoppingBag },
    { href: "/admin/urunler", label: "Ürün Yönetimi", icon: Package },
    { href: "/admin/raporlar", label: "Raporlar", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white font-sans flex">
      <aside className="w-[260px] hidden md:flex flex-col border-r border-zinc-900 bg-black/40 backdrop-blur-xl">
        <div className="px-6 py-6 border-b border-zinc-900">
          <div className="text-xs font-black tracking-[0.4em] text-zinc-500 uppercase">Hatrix</div>
          <div className="text-xl font-black tracking-tight">Admin Panel</div>
        </div>

        <nav className="p-3 flex-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition border ${
                  active
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-300 border-transparent hover:bg-zinc-900/50 hover:border-zinc-800"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-900">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-black uppercase tracking-widest transition"
          >
            <LogOut size={16} />
            Çıkış
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-40 bg-[#0b0b0b]/90 backdrop-blur-xl border-b border-zinc-900">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Link href="/admin/dashboard" className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Admin
                </Link>
              </div>
              {title && <h1 className="text-sm md:text-base font-black uppercase tracking-widest text-white">{title}</h1>}
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-200"
              >
                <LogOut size={14} />
                Çıkış
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
