export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

// ── Story mode types ──────────────────────────────────────────────────────────

export interface StoryOptionData {
  id: string;
  text: string;
  correct: boolean;
  consequence: string;
  consequenceType: "success" | "failure";
}

export interface StoryDecisionData {
  id: number;
  question: string;
  context: string;
  options: StoryOptionData[];
  learning: string;
}

export interface SystemStoryData {
  id: string;
  title: string;
  scenario: string;
  decisions: StoryDecisionData[];
  finalArchitecture: string;
  score: {
    perfect: string;
    good: string;
    average: string;
    poor: string;
  };
}

export interface SystemMeta {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  icon: string;
  tags: string[];
  estimatedTime: string;
}

export interface StoryStep {
  id: string;
  title: string;
  content: string;
  decision?: {
    prompt: string;
    options: StoryOption[];
  };
}

export interface StoryOption {
  id: string;
  label: string;
  consequence: string;
  isOptimal: boolean;
}

export interface ArchitectureNode {
  id: string;
  type: string;
  label: string;
  description: string;
  position: { x: number; y: number };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface SystemData {
  meta: SystemMeta;
  story: StoryStep[];
  architecture: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
}
