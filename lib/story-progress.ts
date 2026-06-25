export interface DecisionAnswer {
  selectedId: string;
  isCorrect: boolean;
}

export interface StoryProgress {
  systemId: string;
  currentIdx: number;
  answers: Record<number, DecisionAnswer>;
  completed: boolean;
}

const key = (systemId: string) => `sysdesign_story_${systemId}`;

export function loadProgress(systemId: string): StoryProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(systemId));
    return raw ? (JSON.parse(raw) as StoryProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: StoryProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(progress.systemId), JSON.stringify(progress));
  } catch {
    // ignore quota errors
  }
}

export function clearProgress(systemId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(systemId));
}

export function getScore(
  answers: Record<number, DecisionAnswer>,
  totalDecisions: number
): number {
  return Object.values(answers).filter((a) => a.isCorrect).length;
}
