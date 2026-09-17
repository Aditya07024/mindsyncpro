import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { WeArePartOfSection } from "@/components/WeArePartOfSection";

export const Route = createFileRoute("/ecosystem")({
  component: EcosystemPage,
});

function EcosystemPage() {
  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-900 font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-white shadow-lg overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt="MyMindTherapyFriend" className="size-full object-cover scale-125" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-[#012620]">
              MyMindTherapyFriend
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#012620] transition"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WeArePartOfSection />
      </main>

      {/* Footer minimal */}
      <footer className="mt-16 border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © 2026 mymindtherapyfriend™. All rights reserved.
      </footer>
    </div>
  );
}
