"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FlashcardDeckProps, FlashCard } from "@/data/prep/types";

const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Recommended: {
    bg: "rgba(16,185,129,0.1)",
    color: "#10B981",
    border: "rgba(16,185,129,0.3)",
  },
  Avoid: {
    bg: "rgba(244,63,94,0.1)",
    color: "#F43F5E",
    border: "rgba(244,63,94,0.3)",
  },
  Advanced: {
    bg: "rgba(245,158,11,0.1)",
    color: "#F59E0B",
    border: "rgba(245,158,11,0.3)",
  },
};

// ── Card faces ─────────────────────────────────────────────────────────────
// Both are normal in-flow divs (no position:absolute) so height is auto.
// The flip uses AnimatePresence: only one face is mounted at a time.

function CardFront({ card, seen }: { card: FlashCard; seen: boolean }) {
  const tag = card.front.tag;
  const tagStyle = tag ? (TAG_STYLES[tag] ?? TAG_STYLES["Advanced"]) : null;

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${seen ? "rgba(245,158,11,0.3)" : "#2A2724"}`,
        background: "#1C1A18",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 160,
        transition: "border-color 0.3s",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs" style={{ color: "#524E4A" }}>
          {card.front.label}
        </span>
        {tagStyle && tag && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: tagStyle.bg,
              color: tagStyle.color,
              border: `1px solid ${tagStyle.border}`,
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* Title + subtitle */}
      <div className="flex-1">
        <p
          className="text-xl font-bold font-display leading-tight mb-2"
          style={{ color: "#F5F0EB" }}
        >
          {card.front.title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
          {card.front.subtitle}
        </p>
      </div>

      {/* Hint */}
      <p className="text-xs font-mono self-end" style={{ color: "#3D3830" }}>
        click to flip →
      </p>
    </div>
  );
}

function CardBack({ card }: { card: FlashCard }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(245,158,11,0.3)",
        background: "#161513",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 160,
      }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "#A09890" }}>
        {card.back.explanation}
      </p>

      {card.back.code && (
        <pre
          style={{
            background: "#0F0E0D",
            border: "1px solid #2A2724",
            borderRadius: 6,
            padding: "10px 12px",
            color: "#8C8680",
            fontSize: 12,
            fontFamily: "var(--font-jetbrains), monospace",
            lineHeight: 1.6,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {card.back.code}
        </pre>
      )}

      {card.back.proTip && (
        <div
          style={{
            borderLeft: "3px solid rgba(245,158,11,0.5)",
            background: "rgba(245,158,11,0.05)",
            borderRadius: "0 6px 6px 0",
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#A09890",
          }}
        >
          💡 {card.back.proTip}
        </div>
      )}

      {card.back.trap && (
        <div
          style={{
            borderLeft: "3px solid rgba(244,63,94,0.5)",
            background: "rgba(244,63,94,0.05)",
            borderRadius: "0 6px 6px 0",
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#A09890",
          }}
        >
          ⚠️ {card.back.trap}
        </div>
      )}

      <p className="text-xs font-mono self-end mt-2" style={{ color: "#3D3830" }}>
        flip back ↩
      </p>
    </div>
  );
}

// ── Single card with flip ──────────────────────────────────────────────────
// AnimatePresence swaps front↔back in place — no position:absolute needed,
// so height follows content naturally.

const FLIP_OUT = { rotateY: 90, opacity: 0 };
const FLIP_IN  = { rotateY: 0,  opacity: 1 };
const FLIP_INIT = { rotateY: -90, opacity: 0 };

function FlipCard({
  card,
  seen,
  onFlip,
}: {
  card: FlashCard;
  seen: boolean;
  onFlip: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  function handleClick() {
    const next = !flipped;
    setFlipped(next);
    if (next) onFlip();
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        perspective: 1000,
      }}
      aria-label={flipped ? "Show card front" : "Flip to see explanation"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {flipped ? (
          <motion.div
            key="back"
            initial={FLIP_INIT}
            animate={FLIP_IN}
            exit={FLIP_OUT}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          >
            <CardBack card={card} />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={FLIP_INIT}
            animate={FLIP_IN}
            exit={FLIP_OUT}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          >
            <CardFront card={card} seen={seen} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Main deck ──────────────────────────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function FlashcardDeck({ title, cards }: FlashcardDeckProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const card = cards[index];
  const allSeen = seenIds.size === cards.length;

  function handlePrev() {
    if (index === 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  function handleNext() {
    if (index === cards.length - 1) return;
    setDirection(1);
    setIndex((i) => i + 1);
  }

  function handleFlip() {
    setSeenIds((prev) => new Set(prev).add(card.id));
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-mono" style={{ color: "#524E4A" }}>
          {title}
        </p>
        <p className="text-xs font-mono" style={{ color: "#524E4A" }}>
          {cards.length} cards
        </p>
      </div>

      {/* Card — full width, auto height */}
      <div style={{ width: "100%", minHeight: 0 }}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={card.id}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: "100%" }}
          >
            {/* key resets flip state when card changes */}
            <FlipCard
              key={card.id}
              card={card}
              seen={seenIds.has(card.id)}
              onFlip={handleFlip}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="font-mono text-sm px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: index === 0 ? "transparent" : "#1C1A18",
            color: index === 0 ? "#2A2724" : "#8C8680",
            border: `1px solid ${index === 0 ? "#1C1A18" : "#2A2724"}`,
            cursor: index === 0 ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (index > 0) e.currentTarget.style.borderColor = "#3D3830";
          }}
          onMouseLeave={(e) => {
            if (index > 0) e.currentTarget.style.borderColor = "#2A2724";
          }}
        >
          ← prev
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: seenIds.has(c.id)
                  ? i === index
                    ? "#F59E0B"
                    : "#10B981"
                  : i === index
                  ? "#F59E0B"
                  : "#2A2724",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 0.2s, background 0.2s",
              }}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={index === cards.length - 1}
          className="font-mono text-sm px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: index === cards.length - 1 ? "transparent" : "#1C1A18",
            color: index === cards.length - 1 ? "#2A2724" : "#8C8680",
            border: `1px solid ${
              index === cards.length - 1 ? "#1C1A18" : "#2A2724"
            }`,
            cursor: index === cards.length - 1 ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (index < cards.length - 1)
              e.currentTarget.style.borderColor = "#3D3830";
          }}
          onMouseLeave={(e) => {
            if (index < cards.length - 1)
              e.currentTarget.style.borderColor = "#2A2724";
          }}
        >
          next →
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mt-4">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: 3, background: "#2A2724" }}
        >
          <motion.div
            style={{
              height: "100%",
              borderRadius: 9999,
              background: allSeen ? "#10B981" : "#F59E0B",
            }}
            animate={{ width: `${(seenIds.size / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs font-mono shrink-0" style={{ color: "#524E4A" }}>
          {allSeen ? (
            <span style={{ color: "#10B981" }}>deck complete ✓</span>
          ) : (
            `${seenIds.size} / ${cards.length} seen`
          )}
        </p>
      </div>
    </div>
  );
}
