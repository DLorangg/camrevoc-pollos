import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Admin · Camrevoc",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <div className="flex-1">{children}</div>
      <footer className="py-6 text-center text-xs text-slate-400">
        Diseñado con ❤️ por Dami Lorang
      </footer>
    </div>
  );
}
