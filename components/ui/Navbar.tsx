"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#2A2724] backdrop-blur-md"
      style={{ background: "rgba(15, 14, 13, 0.85)" }}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl font-bold font-mono">
          <span style={{ color: "#F59E0B" }}>sys</span>
          <span style={{ color: "#524E4A" }}>.fyi</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <a
          href="https://hashnode.com/nirxnjxn"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:block text-sm font-mono transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          blog
        </a>
        <Link
          href="/concepts"
          className="text-sm font-mono transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          concepts
        </Link>
        <a
          href="https://twitter.com/nirxnjxn7"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:block text-sm font-mono transition-colors"
          style={{ color: "#524E4A" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
        >
          @nirxnjxn7
        </a>
      </div>
    </motion.nav>
  );
}
