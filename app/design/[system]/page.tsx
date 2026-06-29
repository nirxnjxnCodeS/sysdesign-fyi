import { notFound } from "next/navigation";
import { DesignCanvas } from "@/components/design/DesignCanvas";

const SYSTEMS: Record<string, { title: string }> = {
  "url-shortener": { title: "URL Shortener" },
  "payment-system": { title: "Payment System" },
  "notification-system": { title: "Notification System" },
  "stock-price-ticker": { title: "Stock Price Ticker" },
  "chat-system": { title: "Chat System" },
  "video-streaming": { title: "Video Streaming" },
  "twitter-feed": { title: "Twitter / X Feed" },
  "uber": { title: "Uber / Ride Sharing" },
  "instagram": { title: "Instagram" },
  "google-maps": { title: "Google Maps" },
  "youtube": { title: "YouTube" },
  "practice": { title: "Practice Mode" },
};

interface Props {
  params: Promise<{ system: string }>;
}

export default async function DesignPage({ params }: Props) {
  const { system } = await params;
  const meta = SYSTEMS[system];
  if (!meta) notFound();

  return (
    <>
      {/* Mobile fallback */}
      <div className="md:hidden min-h-screen flex items-center justify-center px-6 dark:bg-[#0A0A0F] bg-slate-100">
        <div className="text-center">
          <p className="font-mono text-sm dark:text-slate-500 text-slate-500 mb-2">
            // canvas mode
          </p>
          <p className="font-mono text-xs dark:text-slate-600 text-slate-400">
            best experienced on desktop
          </p>
        </div>
      </div>

      {/* Desktop canvas */}
      <div className="hidden md:block">
        <DesignCanvas systemId={system} systemTitle={meta.title} />
      </div>
    </>
  );
}
