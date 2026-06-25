"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SystemMeta } from "@/lib/types";
import { difficultyBadge } from "@/data/systems";

interface SystemCardProps {
  system: SystemMeta;
  index: number;
}

export function SystemCard({ system, index }: SystemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.7 + index * 0.1 }}
      whileHover={{
        y: -4,
        scale: 1.02,
        boxShadow:
          "0 0 0 1px rgba(245, 158, 11, 0.3), 0 8px 32px rgba(245, 158, 11, 0.1)",
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: "1px solid #2A2724",
        background: "#1C1A18",
      }}
    >
      {/* Amber accent top bar on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(to right, transparent, #F59E0B, transparent)" }}
      />

      <div className="p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(245, 158, 11, 0.1)" }}
          >
            {system.icon}
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border font-mono tracking-wide ${difficultyBadge[system.difficulty]}`}
          >
            {system.difficulty}
          </span>
        </div>

        {/* Content */}
        <div>
          <h3
            className="text-lg font-bold mb-1.5 font-display"
            style={{ color: "#F5F0EB" }}
          >
            {system.name}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "#8C8680" }}>
            {system.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {system.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: "#2A2724", color: "#8C8680" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-mono" style={{ color: "#524E4A" }}>
            ⏱ {system.estimatedTime}
          </span>
          <Link
            href={`/learn/${system.id}`}
            className="text-sm font-semibold font-mono transition-colors flex items-center gap-1 group/btn"
            style={{ color: "#F59E0B" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FBB740")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#F59E0B")}
          >
            Start Learning
            <span className="inline-block transition-transform group-hover/btn:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {/* Interview Prep */}
        <div style={{ borderTop: "1px solid #2A2724", paddingTop: "12px" }}>
          <Link
            href={`/prep/${system.id}`}
            className="text-xs font-mono transition-colors flex items-center gap-1 group/prep"
            style={{ color: "#524E4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
          >
            Interview Prep
            <span className="inline-block transition-transform group-hover/prep:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
