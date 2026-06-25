"use client";

import { motion } from "framer-motion";
import { systems } from "@/data/systems";
import { SystemCard } from "./SystemCard";

export function SystemsGrid() {
  return (
    <section className="px-6 pb-24 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mb-10 flex items-center justify-between"
      >
        <h2 className="text-2xl font-black font-display" style={{ color: "#F5F0EB" }}>
          Choose a System
        </h2>
        <span className="text-sm font-mono" style={{ color: "#524E4A" }}>
          {systems.length} systems available
        </span>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((system, i) => (
          <SystemCard key={system.id} system={system} index={i} />
        ))}
      </div>
    </section>
  );
}
