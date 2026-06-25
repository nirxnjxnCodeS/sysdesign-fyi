"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { urlShortenerPrep } from "@/data/prep/url-shortener-prep";
import { paymentSystemPrep } from "@/data/prep/payment-system-prep";
import { notificationSystemPrep } from "@/data/prep/notification-system-prep";
import { stockPriceTickerPrep } from "@/data/prep/stock-price-ticker-prep";
import { chatSystemPrep } from "@/data/prep/chat-system-prep";
import { videoStreamingPrep } from "@/data/prep/video-streaming-prep";
import type {
  PrepData,
  PrepSection,
  RequirementsSection,
  EstimationSection,
  ApiDesignSection,
  DeepDiveSection,
  TradeoffsSection,
  CheatSheetSection,
} from "@/data/prep/types";
import { RequirementsSorter } from "@/components/prep/RequirementsSorter";
import { EstimationCalculator } from "@/components/prep/EstimationCalculator";
import { FlashcardDeck } from "@/components/prep/FlashcardDeck";
import { TradeoffPicker } from "@/components/prep/TradeoffPicker";
import type {
  InteractivePrepSection,
  SectionInteraction,
  RequirementsSortInteraction,
  EstimationCalculatorInteraction,
  FlashcardDeckInteraction,
  TradeoffPickerInteraction,
} from "@/data/prep/types";

// Registry: add new systems here as prep data is created
const PREP_REGISTRY: Record<string, PrepData> = {
  "url-shortener": urlShortenerPrep,
  "payment-system": paymentSystemPrep,
  "notification-system": notificationSystemPrep,
  "stock-price-ticker": stockPriceTickerPrep,
  "chat-system": chatSystemPrep,
  "video-streaming": videoStreamingPrep,
};

const STATIC_SECTION_LABELS: Record<string, string> = {
  requirements: "Requirements",
  estimation: "Estimation",
  apiDesign: "API Design",
  deepDive: "Deep Dive",
  tradeoffs: "Senior Tradeoffs",
  cheatSheet: "Cheat Sheet",
};

function getSectionId(section: PrepSection): string {
  return section.type === "interactive"
    ? (section as InteractivePrepSection).sectionId
    : section.type;
}

function getSectionLabel(section: PrepSection): string {
  if (section.type === "interactive") {
    return (section as InteractivePrepSection).title;
  }
  return STATIC_SECTION_LABELS[section.type] ?? section.type;
}

// ── Interactive section renderer ────────────────────────────────────────────

function renderInteraction(interaction: SectionInteraction) {
  switch (interaction.type) {
    case "requirements-sort":
      return (
        <RequirementsSorter
          items={(interaction as RequirementsSortInteraction).items}
          buckets={(interaction as RequirementsSortInteraction).buckets}
        />
      );
    case "estimation-calculator":
      return (
        <EstimationCalculator
          steps={(interaction as EstimationCalculatorInteraction).steps}
          insight={(interaction as EstimationCalculatorInteraction).insight}
        />
      );
    case "flashcard-deck":
      return (
        <FlashcardDeck
          title={(interaction as FlashcardDeckInteraction).title}
          cards={(interaction as FlashcardDeckInteraction).cards}
        />
      );
    case "tradeoff-picker":
      return (
        <TradeoffPicker
          scenarios={(interaction as TradeoffPickerInteraction).scenarios}
        />
      );
    default:
      return null;
  }
}

function InteractiveSectionView({ section }: { section: InteractivePrepSection }) {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs mb-2" style={{ color: "#524E4A" }}>
          {section.step}
        </p>
        <h2
          className="text-2xl font-bold tracking-tight font-display mb-2"
          style={{ color: "#F5F0EB" }}
        >
          {section.title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
          {section.subtitle}
        </p>
      </div>
      {renderInteraction(section.interaction)}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeading({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs mb-2" style={{ color: "#524E4A" }}>
        {step}
      </p>
      <h2
        className="text-2xl font-bold tracking-tight font-display mb-2"
        style={{ color: "#F5F0EB" }}
      >
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
        {subtitle}
      </p>
    </div>
  );
}

function CalloutBox({
  type,
  title,
  children,
}: {
  type: "proTip" | "warning" | "insight";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    proTip: {
      border: "rgba(245,158,11,0.35)",
      bg: "rgba(245,158,11,0.04)",
      titleColor: "#F59E0B",
      dotColor: "#F59E0B",
    },
    warning: {
      border: "rgba(244,63,94,0.35)",
      bg: "rgba(244,63,94,0.04)",
      titleColor: "#F43F5E",
      dotColor: "#F43F5E",
    },
    insight: {
      border: "rgba(16,185,129,0.35)",
      bg: "rgba(16,185,129,0.04)",
      titleColor: "#10B981",
      dotColor: "#10B981",
    },
  }[type];

  return (
    <div
      className="rounded-xl p-5"
      style={{
        border: `1px solid ${styles.border}`,
        borderLeft: `3px solid ${styles.border}`,
        background: styles.bg,
      }}
    >
      <p
        className="text-xs font-mono font-medium mb-3"
        style={{ color: styles.titleColor }}
      >
        {title}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: "#A09890" }}>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #2A2724", background: "#161513" }}
    >
      <pre
        className="p-5 text-xs font-mono leading-relaxed overflow-x-auto"
        style={{ color: "#A09890" }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────

function RequirementsSectionView({ data }: { data: RequirementsSection }) {
  return (
    <div className="space-y-6">
      <SectionHeading
        step="Step 1 — Requirements"
        title="Requirements"
        subtitle="Spend the first 5 minutes here. Jumping to design without this is the #1 reason candidates fail."
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
        {/* Functional */}
        <div
          className="rounded-xl p-5"
          style={{ border: "1px solid #2A2724", background: "#1C1A18" }}
        >
          <p
            className="text-xs font-mono font-medium mb-4"
            style={{ color: "#F59E0B" }}
          >
            What the system must DO
          </p>
          <ul className="space-y-2.5">
            {data.functional.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 mt-0.5 text-sm"
                  style={{ color: "#10B981" }}
                >
                  ✓
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "#A09890" }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Non-functional */}
        <div
          className="rounded-xl p-5"
          style={{ border: "1px solid #2A2724", background: "#1C1A18" }}
        >
          <p
            className="text-xs font-mono font-medium mb-4"
            style={{ color: "#F59E0B" }}
          >
            How the system must PERFORM
          </p>
          <ul className="space-y-2.5">
            {data.nonFunctional.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 mt-0.5 text-sm"
                  style={{ color: "#10B981" }}
                >
                  ✓
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "#A09890" }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Out of scope */}
      <div
        className="rounded-xl p-5"
        style={{
          border: "1px solid rgba(245,158,11,0.25)",
          background: "rgba(245,158,11,0.03)",
        }}
      >
        <p
          className="text-xs font-mono font-medium mb-4"
          style={{ color: "#8C8680" }}
        >
          Explicitly say these are OUT OF SCOPE
        </p>
        <ul className="space-y-2">
          {data.outOfScope.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="shrink-0 mt-0.5 text-sm"
                style={{ color: "#524E4A" }}
              >
                ✗
              </span>
              <span
                className="text-sm leading-relaxed"
                style={{ color: "#8C8680" }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro tip */}
      <CalloutBox type="proTip" title="// pro tip">
        <p className="whitespace-pre-line">{data.proTip}</p>
      </CalloutBox>
    </div>
  );
}

function EstimationSectionView({ data }: { data: EstimationSection }) {
  return (
    <div className="space-y-6">
      <SectionHeading
        step="Step 2 — Estimation"
        title="Estimation"
        subtitle="Show the interviewer you think at scale before designing. The math drives the architecture."
      />

      {/* Assumptions */}
      <div>
        <p
          className="text-xs font-mono mb-3"
          style={{ color: "#524E4A" }}
        >
          assumptions
        </p>
        <div
          className="rounded-xl p-5 overflow-x-auto"
          style={{ border: "1px solid #2A2724", background: "#161513" }}
        >
          <table className="w-full">
            <tbody>
              {data.assumptions.map((line, i) => (
                <tr
                  key={i}
                  style={
                    i < data.assumptions.length - 1
                      ? { borderBottom: "1px solid #2A2724" }
                      : {}
                  }
                >
                  <td
                    className="py-2 pr-4 text-xs font-mono"
                    style={{ color: "#524E4A" }}
                  >
                    {line.label}
                  </td>
                  <td
                    className="py-2 text-xs font-mono font-medium text-right"
                    style={{ color: "#F5F0EB" }}
                  >
                    {line.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation groups */}
      {data.calculations.map((group, gi) => (
        <div key={gi}>
          <p
            className="text-xs font-mono mb-3"
            style={{ color: "#524E4A" }}
          >
            {group.title.toLowerCase()}
          </p>
          <div
            className="rounded-xl overflow-x-auto"
            style={{ border: "1px solid #2A2724", background: "#161513" }}
          >
            <table className="w-full">
              <tbody>
                {group.lines.map((line, i) => (
                  <tr
                    key={i}
                    style={
                      i < group.lines.length - 1
                        ? { borderBottom: "1px solid #2A2724" }
                        : {}
                    }
                  >
                    <td className="px-5 py-3 w-2/5">
                      <span
                        className="text-xs font-mono"
                        style={{ color: "#8C8680" }}
                      >
                        {line.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 w-1/4">
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: "#F59E0B" }}
                      >
                        {line.value}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {line.note && (
                        <span
                          className="text-xs font-mono"
                          style={{ color: "#3D3830" }}
                        >
                          {line.note}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <CalloutBox type="insight" title="// what the math tells you">
        <p className="whitespace-pre-line">{data.insight}</p>
      </CalloutBox>
    </div>
  );
}

function ApiDesignSectionView({ data }: { data: ApiDesignSection }) {
  return (
    <div className="space-y-6">
      <SectionHeading
        step="Step 3 — API Design"
        title="API Design"
        subtitle="Define the contract before drawing boxes. Interviewers at Flipkart and Fidelity specifically check this."
      />

      {data.endpoints.map((ep, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background:
                  ep.method === "POST"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(16,185,129,0.12)",
                color: ep.method === "POST" ? "#F59E0B" : "#10B981",
              }}
            >
              {ep.method}
            </span>
            <span
              className="text-sm font-mono font-medium"
              style={{ color: "#F5F0EB" }}
            >
              {ep.path}
            </span>
          </div>
          <p
            className="text-xs font-mono mb-3"
            style={{ color: "#524E4A" }}
          >
            {ep.description}
          </p>

          {ep.requestBody && (
            <div className="mb-3">
              <p
                className="text-xs font-mono mb-1.5"
                style={{ color: "#3D3830" }}
              >
                request body
              </p>
              <CodeBlock code={ep.requestBody} />
            </div>
          )}

          <div className="mb-3">
            <p
              className="text-xs font-mono mb-1.5"
              style={{ color: "#3D3830" }}
            >
              response
            </p>
            <CodeBlock code={ep.response} />
          </div>

          {ep.errors && (
            <p
              className="text-xs font-mono"
              style={{ color: "#524E4A" }}
            >
              errors: {ep.errors}
            </p>
          )}
          {ep.notes && (
            <p
              className="text-xs font-mono mt-2 leading-relaxed whitespace-pre-line"
              style={{ color: "#524E4A" }}
            >
              {ep.notes}
            </p>
          )}
        </div>
      ))}

      <CalloutBox type="warning" title={`// trap: ${data.trap.title}`}>
        <p className="whitespace-pre-line">{data.trap.content}</p>
      </CalloutBox>
    </div>
  );
}

function DeepDiveSectionView({ data }: { data: DeepDiveSection }) {
  return (
    <div className="space-y-8">
      <SectionHeading
        step="Step 4 — Deep Dive"
        title="Deep Dive"
        subtitle="This is where you show depth. Cover these areas and you'll outperform 90% of candidates."
      />

      {data.subSections.map((sub, i) => (
        <div key={i}>
          <div
            className="flex items-center gap-3 mb-4"
            style={{ paddingBottom: "12px", borderBottom: "1px solid #2A2724" }}
          >
            <span
              className="text-xs font-mono w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
            >
              {i + 1}
            </span>
            <h3
              className="text-base font-bold font-display"
              style={{ color: "#F5F0EB" }}
            >
              {sub.title}
            </h3>
          </div>
          {sub.content && (
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: "#8C8680" }}
            >
              {sub.content}
            </p>
          )}
          {sub.codeBlock && <CodeBlock code={sub.codeBlock} />}
        </div>
      ))}
    </div>
  );
}

function TradeoffsSectionView({ data }: { data: TradeoffsSection }) {
  return (
    <div className="space-y-6">
      <SectionHeading
        step="Step 5 — Tradeoffs"
        title="Senior Tradeoffs"
        subtitle="Juniors name components. Seniors explain WHY and acknowledge what they gave up."
      />

      {/* Comparison table — desktop (sm and above) */}
      <div
        className="hidden sm:block rounded-xl overflow-hidden"
        style={{ border: "1px solid #2A2724" }}
      >
        {/* Header */}
        <div
          className="grid text-xs font-mono px-5 py-3"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 2fr",
            background: "#161513",
            borderBottom: "1px solid #2A2724",
            color: "#524E4A",
          }}
        >
          <span>Decision</span>
          <span>Option A</span>
          <span>Option B</span>
          <span>What you pick & why</span>
        </div>
        {data.rows.map((row, i) => (
          <div
            key={i}
            className="grid px-5 py-4 text-sm"
            style={{
              gridTemplateColumns: "1fr 1fr 1fr 2fr",
              background: i % 2 === 0 ? "#1C1A18" : "#161513",
              borderBottom:
                i < data.rows.length - 1 ? "1px solid #2A2724" : "none",
              gap: "12px",
              alignItems: "start",
            }}
          >
            <span className="font-mono font-medium" style={{ color: "#F5F0EB" }}>
              {row.decision}
            </span>
            <span className="font-mono text-xs" style={{ color: "#8C8680" }}>
              {row.optionA}
            </span>
            <span className="font-mono text-xs" style={{ color: "#8C8680" }}>
              {row.optionB}
            </span>
            <span className="text-xs leading-relaxed" style={{ color: "#A09890" }}>
              {row.pick}
            </span>
          </div>
        ))}
      </div>

      {/* Comparison cards — mobile (below sm) */}
      <div className="sm:hidden space-y-3">
        {data.rows.map((row, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-2"
            style={{ border: "1px solid #2A2724", background: "#1C1A18" }}
          >
            <p className="text-sm font-mono font-medium" style={{ color: "#F5F0EB" }}>
              {row.decision}
            </p>
            <div className="flex gap-2 text-xs font-mono flex-wrap">
              <span className="px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#8C8680" }}>{row.optionA}</span>
              <span className="font-mono" style={{ color: "#3D3830" }}>vs</span>
              <span className="px-2 py-0.5 rounded" style={{ background: "rgba(244,63,94,0.08)", color: "#8C8680" }}>{row.optionB}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#A09890" }}>
              <span style={{ color: "#F59E0B" }}>→ </span>{row.pick}
            </p>
          </div>
        ))}
      </div>

      {/* What juniors miss */}
      <CalloutBox type="proTip" title="// what juniors miss — seniors catch these">
        <ul className="space-y-3">
          {data.juniorsMiss.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0" style={{ color: "#F59E0B" }}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CalloutBox>
    </div>
  );
}

function CheatSheetSectionView({ data }: { data: CheatSheetSection }) {
  const [copied, setCopied] = useState(false);

  const plainText = [
    "SYSTEM ARCHITECTURE",
    data.components,
    "",
    "KEY NUMBERS",
    ...data.numbers.map((n) => `${n.label}: ${n.value}`),
    "",
    "KEY DECISIONS & WHY",
    ...data.decisions.map((d) => `${d.decision} → ${d.why}`),
  ].join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs mb-2" style={{ color: "#524E4A" }}>
            // cheat sheet
          </p>
          <h2
            className="text-2xl font-bold tracking-tight font-display mb-2"
            style={{ color: "#F5F0EB" }}
          >
            Cheat Sheet
          </h2>
          <p className="text-sm" style={{ color: "#8C8680" }}>
            Review this the night before your interview.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs font-mono px-3 py-2 rounded-lg transition-all"
          style={{
            background: copied ? "rgba(16,185,129,0.12)" : "#1C1A18",
            color: copied ? "#10B981" : "#8C8680",
            border: copied
              ? "1px solid rgba(16,185,129,0.3)"
              : "1px solid #2A2724",
          }}
        >
          {copied ? "✓ copied" : "copy cheat sheet"}
        </button>
      </div>

      {/* Components flow */}
      <div>
        <p
          className="text-xs font-mono mb-3"
          style={{ color: "#524E4A" }}
        >
          architecture flow
        </p>
        <div
          className="rounded-xl p-5"
          style={{ border: "1px solid #2A2724", background: "#161513" }}
        >
          <p className="font-mono text-sm" style={{ color: "#F59E0B" }}>
            {data.components}
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
        {/* Numbers */}
        <div>
          <p
            className="text-xs font-mono mb-3"
            style={{ color: "#524E4A" }}
          >
            key numbers
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #2A2724", background: "#161513" }}
          >
            {data.numbers.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom:
                    i < data.numbers.length - 1
                      ? "1px solid #2A2724"
                      : "none",
                }}
              >
                <span
                  className="text-xs font-mono"
                  style={{ color: "#8C8680" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-xs font-mono font-medium"
                  style={{ color: "#F59E0B" }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decisions */}
        <div>
          <p
            className="text-xs font-mono mb-3"
            style={{ color: "#524E4A" }}
          >
            key decisions & why
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #2A2724", background: "#161513" }}
          >
            {data.decisions.map((item, i) => (
              <div
                key={i}
                className="px-4 py-2.5"
                style={{
                  borderBottom:
                    i < data.decisions.length - 1
                      ? "1px solid #2A2724"
                      : "none",
                }}
              >
                <p
                  className="text-xs font-mono font-medium mb-0.5"
                  style={{ color: "#F5F0EB" }}
                >
                  {item.decision}
                </p>
                <p
                  className="text-xs font-mono leading-relaxed"
                  style={{ color: "#524E4A" }}
                >
                  {item.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav to other pages */}
      <div
        className="flex flex-wrap gap-4 pt-8"
        style={{ borderTop: "1px solid #2A2724" }}
      >
        <Link
          href="/"
          className="font-mono text-sm transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          ← try another system
        </Link>
        <Link
          href="/concepts"
          className="font-mono text-sm transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          concepts glossary →
        </Link>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function SidebarNavItem({
  id,
  label,
  isActive,
  isDone,
  onNavigate,
}: {
  id: string;
  label: string;
  isActive: boolean;
  isDone: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(id)}
      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-mono"
      style={{
        fontSize: 11,
        lineHeight: 1.4,
        background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
        color: isActive ? "#F59E0B" : "#524E4A",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = "#8C8680";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = "#524E4A";
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-all"
        style={{
          background: isDone ? "#10B981" : isActive ? "#F59E0B" : "#2A2724",
        }}
      />
      {label}
    </button>
  );
}

function Sidebar({
  activeSection,
  onNavigate,
  completedSections,
  sections,
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
  completedSections: Set<string>;
  sections: PrepSection[];
}) {
  return (
    <aside
      className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen pt-20 pb-8 pl-6 overflow-y-auto"
      style={{ borderRight: "1px solid #2A2724" }}
    >
      <p className="font-mono text-xs mb-6" style={{ color: "#524E4A" }}>
        // interview prep
      </p>

      <nav className="space-y-1 mb-4">
        {sections.map((section) => {
          const id = getSectionId(section);
          return (
            <SidebarNavItem
              key={id}
              id={id}
              label={getSectionLabel(section)}
              isActive={activeSection === id}
              isDone={completedSections.has(id)}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <div className="mt-auto pt-8" style={{ borderTop: "1px solid #2A2724" }}>
        <Link
          href="/concepts"
          className="text-xs font-mono block transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          concepts glossary →
        </Link>
      </div>
    </aside>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PrepPage() {
  const params = useParams();
  const systemId = params.system as string;

  const prepData = PREP_REGISTRY[systemId];
  if (!prepData) {
    notFound();
  }

  const [activeSection, setActiveSection] = useState("requirements");
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  );

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const sections = prepData.sections;

  const registerRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    []
  );

  // Intersection observer — tracks all sections in unified array
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const allIds = sections.map(getSectionId);

    allIds.forEach((id) => {
      const el = sectionRefs.current[id];
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
            setCompletedSections((prev) => {
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  function scrollToSection(id: string) {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSection(section: PrepSection) {
    switch (section.type) {
      case "interactive":
        return <InteractiveSectionView section={section as InteractivePrepSection} />;
      case "requirements":
        return <RequirementsSectionView data={section as RequirementsSection} />;
      case "estimation":
        return <EstimationSectionView data={section as EstimationSection} />;
      case "apiDesign":
        return <ApiDesignSectionView data={section as ApiDesignSection} />;
      case "deepDive":
        return <DeepDiveSectionView data={section as DeepDiveSection} />;
      case "tradeoffs":
        return <TradeoffsSectionView data={section as TradeoffsSection} />;
      case "cheatSheet":
        return <CheatSheetSectionView data={section as CheatSheetSection} />;
      default:
        return null;
    }
  }

  return (
    <div
      className="min-h-screen bg-grid flex"
      style={{ background: "#0F0E0D" }}
    >
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={scrollToSection}
        completedSections={completedSections}
        sections={sections}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-md"
          style={{
            borderColor: "#2A2724",
            background: "rgba(15,14,13,0.9)",
          }}
        >
          <Link
            href={`/learn/${systemId}`}
            className="hidden sm:block font-mono text-xs transition-colors"
            style={{ color: "#524E4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
          >
            ← story mode
          </Link>
          <span className="hidden sm:block" style={{ color: "#2A2724" }}>·</span>
          <span className="font-mono text-xs truncate" style={{ color: "#524E4A" }}>
            {prepData.systemName}
          </span>
          <span style={{ color: "#2A2724" }}>·</span>
          <span className="font-mono text-xs shrink-0" style={{ color: "#F59E0B" }}>
            prep
          </span>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href={`/design/${systemId}`}
              className="hidden sm:block font-mono text-xs transition-colors"
              style={{ color: "#524E4A" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
            >
              try the canvas →
            </Link>
            <Link
              href="/"
              className="sm:hidden font-mono text-xs transition-colors"
              style={{ color: "#524E4A" }}
            >
              ←
            </Link>
          </div>
        </div>

        {/* Mobile section nav (hidden on lg where sidebar handles this) */}
        <div
          className="lg:hidden sticky top-[49px] z-10 overflow-x-auto border-b px-4 py-2 flex gap-2"
          style={{ borderColor: "#2A2724", background: "rgba(15,14,13,0.95)" }}
        >
          {sections.map((section) => {
            const id = getSectionId(section);
            const isActive = activeSection === id;
            const isDone = completedSections.has(id) && !isActive;
            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="shrink-0 text-xs font-mono px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                style={{
                  background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                  color: isActive ? "#F59E0B" : isDone ? "#10B981" : "#524E4A",
                  border: `1px solid ${isActive ? "rgba(245,158,11,0.3)" : isDone ? "rgba(16,185,129,0.3)" : "#2A2724"}`,
                }}
              >
                {isDone ? "✓ " : ""}{getSectionLabel(section)}
              </button>
            );
          })}
        </div>

        {/* Page header */}
        <div className="px-4 sm:px-6 pt-8 sm:pt-10 pb-0 max-w-[800px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-mono text-xs mb-2" style={{ color: "#524E4A" }}>
              // interview prep
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight font-display mb-3"
              style={{ color: "#F5F0EB" }}
            >
              {prepData.systemName}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
              Everything you need to design this system in an interview.
              Work through each section in order — they build on each other.
            </p>
          </motion.div>
        </div>

        {/* All sections — static and interactive unified */}
        <div className="px-4 sm:px-6 pb-24">
          {sections.map((section, i) => {
            const id = getSectionId(section);
            return (
              <section
                key={id}
                ref={registerRef(id)}
                className="max-w-[800px] py-8 sm:py-10"
                style={{
                  borderTop: i > 0 ? "1px solid #2A2724" : "none",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderSection(section)}
                </motion.div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
