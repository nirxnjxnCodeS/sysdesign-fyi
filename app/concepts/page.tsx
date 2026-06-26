"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { concepts, categoryColors, type ConceptCategory } from "@/data/concepts";

const CATEGORIES: ("All" | ConceptCategory)[] = [
  "All",
  "Networking",
  "Scalability",
  "Storage",
  "Messaging",
  "Algorithms",
  "Security",
];

// ── AppearanceTag ──────────────────────────────────────────────────────────

function AppearanceTag({ system }: { system: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className="text-xs font-mono px-2 py-1 rounded-md transition-all duration-150"
      style={{
        background: "#242220",
        border: hovered ? "1px solid rgba(245,158,11,0.3)" : "1px solid #3D3830",
        color: hovered ? "rgba(251,191,36,0.7)" : "#8C8680",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {system}
    </span>
  );
}

// ── CategoryPill ───────────────────────────────────────────────────────────

function CategoryPill({
  label,
  count,
  isActive,
  onClick,
  colors,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  colors?: { bg: string; text: string; border: string };
}) {
  const [hovered, setHovered] = useState(false);

  let pillStyle: React.CSSProperties;
  if (isActive) {
    pillStyle = colors
      ? { background: colors.text, color: "#0F0E0D", border: `1px solid ${colors.text}`, fontWeight: 500 }
      : { background: "#F59E0B", color: "#0F0E0D", border: "1px solid #F59E0B", fontWeight: 500 };
  } else if (hovered) {
    pillStyle = colors
      ? { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }
      : { background: "#1C1A18", color: "rgba(251,191,36,0.7)", border: "1px solid rgba(245,158,11,0.3)" };
  } else {
    pillStyle = colors
      ? { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, opacity: 0.7 }
      : { background: "#1C1A18", color: "#6B6560", border: "1px solid #2A2724" };
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-xs font-mono px-4 py-2 rounded-full transition-all duration-150"
      style={pillStyle}
    >
      {label} ({count})
    </button>
  );
}

// ── ConceptCard ────────────────────────────────────────────────────────────

function ConceptCard({ concept }: { concept: (typeof concepts)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = categoryColors[concept.category];

  const borderColor = expanded
    ? "rgba(245,158,11,0.25)"
    : hovered
    ? "rgba(245,158,11,0.3)"
    : "#2A2724";

  return (
    <div className={expanded ? "col-span-1 md:col-span-2" : "col-span-1"}>
      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          background: expanded ? "#1F1D1A" : hovered ? "#1F1D1A" : "#1C1A18",
          borderTop: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          borderLeft: expanded ? "3px solid #F59E0B" : `1px solid ${borderColor}`,
          transition: "border-color 0.2s ease, background 0.15s ease",
        }}
      >
        {/* Clickable header row */}
        <div
          onClick={() => setExpanded((v) => !v)}
          onMouseEnter={() => !expanded && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ padding: "16px 20px", cursor: "pointer" }}
        >
          {expanded ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="text-base font-mono font-medium" style={{ color: "#F59E0B" }}>
                  {concept.term}
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {concept.category}
                </span>
              </div>
              <span className="text-xs font-mono shrink-0" style={{ color: "#524E4A" }}>
                ↑ collapse
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium" style={{ color: "#F59E0B" }}>
                  {concept.term}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "#6B6560" }}>
                  {concept.summary}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {concept.category}
                </span>
                <span className="text-xs font-mono" style={{ color: "#524E4A" }}>
                  → expand
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expandable body — Framer Motion AnimatePresence */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 24px 24px", borderTop: "1px solid #2A2724" }}>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "#8C8680", marginTop: 16 }}
                >
                  {concept.full}
                </p>
                {concept.appearsIn.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 flex-wrap">
                    <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "#524E4A" }}>
                      appears in:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {concept.appearsIn.map((system) => (
                        <AppearanceTag key={system} system={system} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-xl font-medium mb-2" style={{ color: "#3D3830" }}>
        no concepts match
      </p>
      <p className="font-mono text-sm mb-6" style={{ color: "#2A2724" }}>
        try &apos;cache&apos;, &apos;kafka&apos;, or &apos;websocket&apos;
      </p>
      <button
        onClick={onClear}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="font-mono text-sm px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: "#1C1A18",
          border: hovered ? "1px solid rgba(245,158,11,0.3)" : "1px solid #2A2724",
          color: hovered ? "#8C8680" : "#524E4A",
        }}
      >
        clear search
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | ConceptCategory>("All");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" key focuses the search bar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as Element).tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return concepts.filter((c) => {
      const matchesCategory =
        activeCategory === "All" || c.category === activeCategory;
      const matchesQuery =
        !q ||
        c.term.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.full.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    concepts.forEach((c) => {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  const isFiltered = activeCategory !== "All" || query.trim() !== "";
  const showingAll = filtered.length === concepts.length;

  function clearAll() {
    setQuery("");
    setActiveCategory("All");
  }

  return (
    <div className="min-h-screen bg-grid" style={{ background: "#0F0E0D" }}>
      <Navbar />

      <main className="pt-24 pb-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <Link
              href="/"
              className="font-mono text-xs transition-colors inline-block mb-6"
              style={{ color: "#524E4A" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
            >
              ← home
            </Link>
            <p className="font-mono text-xs mb-2" style={{ color: "#FBBF24" }}>
              // concepts
            </p>
            <h1
              className="text-4xl font-black tracking-tight font-display mb-3"
              style={{ color: "#F5F0EB" }}
            >
              System Design Glossary
            </h1>
            <p className="text-sm font-mono" style={{ color: "#524E4A" }}>
              {concepts.length} concepts · {CATEGORIES.length - 1} categories
              <span style={{ color: "#3D3830" }}> · press / to search</span>
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5"
          >
            <div className="relative" style={{ maxWidth: 600 }}>
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="6.5" cy="6.5" r="4.5" stroke="#524E4A" strokeWidth="1.5" />
                <path
                  d="M10.5 10.5L14 14"
                  stroke="#524E4A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`search ${concepts.length} concepts...`}
                className="w-full outline-none placeholder-[#524E4A]"
                style={{
                  background: "#1C1A18",
                  border: "1px solid #3D3830",
                  borderRadius: 12,
                  padding: "14px 20px 14px 44px",
                  fontSize: 14,
                  color: "#F5F0EB",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(245,158,11,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#3D3830";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </motion.div>

          {/* Category pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {CATEGORIES.map((cat) => {
              const count =
                cat === "All" ? concepts.length : (categoryCounts[cat] ?? 0);
              return (
                <CategoryPill
                  key={cat}
                  label={cat}
                  count={count}
                  isActive={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                />
              );
            })}
          </motion.div>

          {/* Results count */}
          <div className="flex items-center gap-2 mb-5">
            <p className="text-xs" style={{ color: "#6B6560" }}>
              {showingAll
                ? `showing ${filtered.length} concepts`
                : `showing ${filtered.length} of ${concepts.length} concepts`}
            </p>
            {isFiltered && (
              <button
                onClick={clearAll}
                className="text-xs font-mono transition-colors"
                style={{ color: "#524E4A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
              >
                · clear filter ×
              </button>
            )}
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((concept) => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          ) : (
            <EmptyState onClear={clearAll} />
          )}
        </div>
      </main>
    </div>
  );
}
