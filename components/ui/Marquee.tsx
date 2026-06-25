const ITEMS =
  "URL SHORTENER · PAYMENT SYSTEMS · REAL-TIME DATA · RATE LIMITING · DISTRIBUTED CACHE · CHAT SYSTEMS · VIDEO STREAMING · WEB CRAWLER · FRAUD DETECTION · CONSISTENT HASHING ·   ";

export function Marquee() {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: "1px solid #2A2724",
        borderBottom: "1px solid #2A2724",
        padding: "10px 0",
        margin: "48px 0",
      }}
    >
      <div
        className="flex"
        style={{
          animation: "marquee 25s linear infinite",
          width: "max-content",
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: "#524E4A",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {ITEMS}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: "#524E4A",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {ITEMS}
        </span>
      </div>
    </div>
  );
}
