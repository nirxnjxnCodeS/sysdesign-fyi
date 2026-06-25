import type { SystemStoryData } from "@/lib/types";

export function getScoreLabel(
  correct: number,
  total: number,
  labels: SystemStoryData["score"]
): string {
  const pct = correct / total;
  if (pct === 1) return labels.perfect;
  if (pct >= 0.6) return labels.good;
  if (pct >= 0.4) return labels.average;
  return labels.poor;
}

export function getScorePercent(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}
