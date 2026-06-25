"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2A2724] py-10" style={{ background: "#0F0E0D" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          {/* Logo */}
          <span className="font-mono text-sm font-bold">
            <span style={{ color: "#F59E0B" }}>sys</span>
            <span style={{ color: "#524E4A" }}>.fyi</span>
          </span>

          {/* Center — twitter credit */}
          <a
            href="https://twitter.com/nirxnjxn7"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm transition-colors"
            style={{ color: "#524E4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8C8680")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#524E4A")}
          >
            Built by{" "}
            <span style={{ color: "#F59E0B" }}>@nirxnjxn7</span>
          </a>

          {/* Right */}
          <span className="font-mono text-xs" style={{ color: "#524E4A" }}>
            6 systems · Free forever
          </span>
        </div>

        {/* Bottom line */}
        <p className="font-mono text-xs text-center" style={{ color: "#3D3830" }}>
          Made for developers who learn by breaking things
        </p>
      </div>
    </footer>
  );
}
