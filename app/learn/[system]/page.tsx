import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoryExperience } from "@/components/story/StoryExperience";
import { urlShortener } from "@/data/systems/url-shortener";
import { paymentSystem } from "@/data/systems/payment-system";
import { notificationSystem } from "@/data/systems/notification-system";
import { stockPriceTicker } from "@/data/systems/stock-price-ticker";
import { chatSystem } from "@/data/systems/chat-system";
import { videoStreaming } from "@/data/systems/video-streaming";
import type { SystemStoryData } from "@/lib/types";

// Registry of all systems with story data
const SYSTEMS: Record<string, SystemStoryData> = {
  "url-shortener": urlShortener as SystemStoryData,
  "payment-system": paymentSystem as SystemStoryData,
  "notification-system": notificationSystem as SystemStoryData,
  "stock-price-ticker": stockPriceTicker as SystemStoryData,
  "chat-system": chatSystem as SystemStoryData,
  "video-streaming": videoStreaming as SystemStoryData,
};

interface Props {
  params: Promise<{ system: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params;
  const data = SYSTEMS[system];
  if (!data) return { title: "Not Found" };
  return {
    title: `${data.title} — sysdesign.fyi`,
    description: `Learn ${data.title} by making real decisions. Story mode on sysdesign.fyi`,
  };
}

export default async function LearnPage({ params }: Props) {
  const { system } = await params;
  const data = SYSTEMS[system];

  if (!data) notFound();

  return <StoryExperience systemData={data} />;
}
