"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative px-6 pt-20 pb-8 max-w-5xl mx-auto text-center">
      {/* Amber halo glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-x-0 top-0 h-[400px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full font-mono text-sm"
          style={{
            border: "1px solid #2A2724",
            background: "rgba(245, 158, 11, 0.06)",
            color: "#F59E0B",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-slow"
            style={{ background: "#F59E0B" }}
          />
          Interactive System Design Learning
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] mb-6 font-display"
          style={{ color: "#F5F0EB" }}
        >
          Learn System Design{" "}
          <span className="relative inline-block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #FBB740, #F59E0B, #FBB740)",
              }}
            >
              by Breaking
            </span>
          </span>{" "}
          Things
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl sm:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#8C8680" }}
        >
          Make decisions. Watch systems fail.{" "}
          <span style={{ color: "#F5F0EB", fontWeight: 500 }}>Learn why.</span>
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm font-mono"
          style={{ color: "#524E4A" }}
        >
          <span>6 systems</span>
          <span style={{ color: "#2A2724" }}>·</span>
          <span>Story mode + Canvas</span>
          <span style={{ color: "#2A2724" }}>·</span>
          <span>No sign-up required</span>
        </motion.div>
      </div>
    </section>
  );
}
