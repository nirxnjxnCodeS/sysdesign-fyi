"use client";

import { useState, useMemo } from "react";
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

function ConceptCard({ concept }: { concept: (typeof concepts)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const colors = categoryColors[concept.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #2A2724", background: "#1C1A18" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start justify-between gap-4 group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span
              className="text-base font-mono font-medium"
              style={{ color: "#F59E0B" }}
            >
              {concept.term}
            </span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              {concept.category}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
            {concept.summary}
          </p>
        </div>
        <span
          className="shrink-0 mt-0.5 text-lg transition-transform duration-200"
          style={{
            color: "#524E4A",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ↓
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-5 pb-5"
              style={{ borderTop: "1px solid #2A2724" }}
            >
              <p
                className="text-sm leading-relaxed mt-4 whitespace-pre-line"
                style={{ color: "#A09890" }}
              >
                {concept.full}
              </p>
              {concept.appearsIn.length > 0 && (
                <div className="mt-4 flex items-start gap-2 flex-wrap">
                  <span
                    className="text-xs font-mono shrink-0 mt-0.5"
                    style={{ color: "#524E4A" }}
                  >
                    appears in:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {concept.appearsIn.map((system) => (
                      <span
                        key={system}
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{ background: "#2A2724", color: "#8C8680" }}
                      >
                        {system}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ConceptsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | ConceptCategory>(
    "All"
  );

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

  const categoryCount = useMemo(() => {
    const cats = new Set(concepts.map((c) => c.category));
    return cats.size;
  }, []);

  return (
    <div className="min-h-screen bg-grid" style={{ background: "#0F0E0D" }}>
      <Navbar />

      <main className="pt-24 pb-24 px-4">
        <div className="max-w-[720px] mx-auto">
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
            <h1
              className="text-3xl font-bold tracking-tight font-display mb-2"
              style={{ color: "#F5F0EB" }}
            >
              System Design Glossary
            </h1>
            <p className="text-sm font-mono" style={{ color: "#524E4A" }}>
              {concepts.length} concepts · {categoryCount} categories
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4"
          >
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm"
                style={{ color: "#524E4A" }}
              >
                /
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search concepts..."
                className="w-full rounded-xl pl-8 pr-4 py-3 text-sm font-mono outline-none transition-colors"
                style={{
                  background: "#1C1A18",
                  border: "1px solid #2A2724",
                  color: "#F5F0EB",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "#2A2724")
                }
              />
            </div>
          </motion.div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              const colors = cat !== "All" ? categoryColors[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs font-mono px-3 py-1.5 rounded-full transition-all duration-150"
                  style={{
                    background: isActive
                      ? colors
                        ? colors.bg
                        : "rgba(245,158,11,0.12)"
                      : "#1C1A18",
                    color: isActive
                      ? colors
                        ? colors.text
                        : "#F59E0B"
                      : "#524E4A",
                    border: isActive
                      ? `1px solid ${colors ? colors.border : "rgba(245,158,11,0.3)"}`
                      : "1px solid #2A2724",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </motion.div>

          {/* Results counter */}
          <div className="mb-5">
            <p className="text-xs font-mono" style={{ color: "#524E4A" }}>
              {filtered.length > 0
                ? `${filtered.length} concept${filtered.length !== 1 ? "s" : ""} found`
                : "No concepts match — try a different term"}
            </p>
          </div>

          {/* Concept cards */}
          <motion.div layout className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((concept) => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
