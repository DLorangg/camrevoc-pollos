"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import OrderForm, { type Theme } from "@/components/OrderForm";

// ─── Theme definitions ─────────────────────────────────────────────────────

const THEME_LABELS: Record<Theme, { label: string; description: string; dot: string }> = {
  minimal: {
    label: "Minimal",
    description: "Institucional · Editorial",
    dot: "bg-[#009B4D]",
  },
  calido: {
    label: "Cálido",
    description: "Don Bosco · Comunitario",
    dot: "bg-[#E52427]",
  },
  dark: {
    label: "Dark",
    description: "Midnight Slate · Suave",
    dot: "bg-slate-600",
  },
};

// Page-level styles per theme
const PAGE_STYLES: Record<
  Theme,
  {
    pageBg: string;
    headerTitle: string;
    headerSubtitle: string;
    footerText: string;
    cardBg: string;
    cardBorder: string;
    cardShadow: string;
    cardRounded: string;
    switcherBg: string;
    switcherBorder: string;
    switcherText: string;
    switcherActiveBg: string;
    switcherActiveText: string;
  }
> = {
  minimal: {
    pageBg: "bg-slate-50",
    headerTitle: "text-[#1E293B]",
    headerSubtitle: "text-slate-500",
    footerText: "text-slate-400",
    cardBg: "bg-white",
    cardBorder: "border border-slate-200",
    cardShadow: "shadow-xl shadow-slate-200/60",
    cardRounded: "rounded-3xl",
    switcherBg: "bg-white border border-slate-200 shadow-sm",
    switcherBorder: "border-slate-200",
    switcherText: "text-slate-600",
    switcherActiveBg: "bg-[#009B4D]",
    switcherActiveText: "text-white",
  },
  calido: {
    pageBg: "bg-[#FBF9F5]",
    headerTitle: "text-stone-800",
    headerSubtitle: "text-amber-700",
    footerText: "text-stone-400",
    cardBg: "bg-white/95",
    cardBorder: "border border-stone-200",
    cardShadow: "shadow-2xl shadow-stone-300/40",
    cardRounded: "rounded-3xl",
    switcherBg: "bg-white/90 border border-stone-200 shadow-sm",
    switcherBorder: "border-stone-200",
    switcherText: "text-stone-600",
    switcherActiveBg: "bg-[#E52427]",
    switcherActiveText: "text-white",
  },
  dark: {
    pageBg: "bg-[#0B0F17]",
    headerTitle: "text-slate-100",
    headerSubtitle: "text-slate-400",
    footerText: "text-slate-700",
    cardBg: "bg-[#151B28]",
    cardBorder: "border border-slate-800",
    cardShadow: "shadow-2xl shadow-black/60",
    cardRounded: "rounded-3xl",
    switcherBg: "bg-[#151B28] border border-slate-700 shadow-lg",
    switcherBorder: "border-slate-700",
    switcherText: "text-slate-400",
    switcherActiveBg: "bg-emerald-600",
    switcherActiveText: "text-white",
  },
};

// ─── Theme Switcher ────────────────────────────────────────────────────────

function ThemeSwitcher({
  current,
  onChange,
}: {
  current: Theme;
  onChange: (t: Theme) => void;
}) {
  const p = PAGE_STYLES[current];
  const themes: Theme[] = ["minimal", "calido", "dark"];

  return (
    <div
      className={`flex items-center gap-1.5 rounded-2xl p-1.5 backdrop-blur-sm ${p.switcherBg}`}
    >
      <span className={`px-2 text-xs font-semibold uppercase tracking-wide ${p.switcherText}`}>
        Tema
      </span>
      {themes.map((t) => {
        const active = current === t;
        const info = THEME_LABELS[t];
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            title={info.description}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? `${p.switcherActiveBg} ${p.switcherActiveText} shadow-sm`
                : `${p.switcherText} hover:opacity-80`
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${info.dot}`} />
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Logo per theme ────────────────────────────────────────────────────────

function Logo({ theme }: { theme: Theme }) {
  return (
    <div className="mb-5 flex justify-center">
      <Image
        src="/logo.png"
        alt="Logo Camrevoc · Casa Salesiana Don Bosco Neuquén"
        width={88}
        height={88}
        className={`rounded-2xl shadow-lg transition-all ${
          theme === "dark" ? "brightness-90 contrast-110" : ""
        }`}
        priority
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "camrevoc_theme";
const DEFAULT_THEME: Theme = "minimal";

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: read localStorage only on client
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && stored in PAGE_STYLES) setTheme(stored);
    setMounted(true);
  }, []);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  const p = PAGE_STYLES[theme];

  // Render a neutral placeholder before hydration to avoid flash
  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className={`min-h-screen px-4 py-10 sm:px-6 transition-colors duration-300 ${p.pageBg}`}>
      {/* Theme switcher — centered above the card */}
      <div className="mx-auto mb-5 flex max-w-xl justify-center">
        <ThemeSwitcher current={theme} onChange={handleThemeChange} />
      </div>

      {/* Header */}
      <header className="mx-auto mb-7 max-w-xl text-center">
        <Logo theme={theme} />
        <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${p.headerTitle}`}>
          Venta de Pollos 🐔
        </h1>
        <p className={`mt-2 text-sm ${p.headerSubtitle}`}>
          Casa Salesiana Don Bosco Neuquén ·{" "}
          <strong className={p.headerTitle}>Camrevoc</strong>
        </p>
      </header>

      {/* Card */}
      <main
        className={`mx-auto max-w-xl px-6 py-8 transition-all duration-300 sm:px-8
          ${p.cardBg} ${p.cardBorder} ${p.cardShadow} ${p.cardRounded}`}
      >
        <OrderForm theme={theme} />
      </main>

      <footer className={`mt-8 text-center text-xs ${p.footerText}`}>
        Cualquier consulta por WhatsApp con tu animador/vendedor.
      </footer>
    </div>
  );
}
