// ── Interactive component props ────────────────────────────────────────────

export interface RequirementItem {
  id: string;
  text: string;
  correctBucket: "functional" | "non-functional" | "out-of-scope";
  explanation: string;
}

export interface RequirementBucket {
  id: string;
  label: string;
  description: string;
}

export interface RequirementsSorterProps {
  items: RequirementItem[];
  buckets: RequirementBucket[];
}

// ──

export interface EstimationStep {
  id: string;
  label: string;
  formula: string;
  answer: number;
  unit: string;
  userInput: boolean;
  hint: string;
  explanation: string;
}

export interface EstimationCalculatorProps {
  steps: EstimationStep[];
  insight: string;
}

// ──

export interface FlashCardFront {
  label: string;
  title: string;
  subtitle: string;
  tag?: string;
}

export interface FlashCardBack {
  explanation: string;
  code?: string;
  proTip?: string;
  trap?: string;
}

export interface FlashCard {
  id: string;
  front: FlashCardFront;
  back: FlashCardBack;
}

export interface FlashcardDeckProps {
  title: string;
  cards: FlashCard[];
}

// ──

export interface TradeoffOption {
  id: string;
  label: string;
  correct: boolean;
  consequence: string;
}

export interface TradeoffScenario {
  id: string;
  scenario: string;
  context?: string;
  options: TradeoffOption[];
  seniorNote: string;
}

export interface TradeoffPickerProps {
  scenarios: TradeoffScenario[];
}

// ── Section interaction union ──────────────────────────────────────────────

export interface RequirementsSortInteraction {
  type: "requirements-sort";
  items: RequirementItem[];
  buckets: RequirementBucket[];
}

export interface EstimationCalculatorInteraction {
  type: "estimation-calculator";
  steps: EstimationStep[];
  insight: string;
}

export interface FlashcardDeckInteraction {
  type: "flashcard-deck";
  title: string;
  cards: FlashCard[];
}

export interface TradeoffPickerInteraction {
  type: "tradeoff-picker";
  scenarios: TradeoffScenario[];
}

export type SectionInteraction =
  | RequirementsSortInteraction
  | EstimationCalculatorInteraction
  | FlashcardDeckInteraction
  | TradeoffPickerInteraction;

// ── Prep data shapes ───────────────────────────────────────────────────────

export interface InteractivePrepSection {
  type: "interactive";
  sectionId: string;
  step: string;
  title: string;
  subtitle: string;
  interaction: SectionInteraction;
}

// Extend existing static section types with optional interaction override
export interface WithInteraction {
  interaction?: SectionInteraction;
}

// ── Static section types ───────────────────────────────────────────────────

export interface RequirementsSection {
  type: "requirements";
  functional: string[];
  nonFunctional: string[];
  outOfScope: string[];
  proTip: string;
}

export interface EstimationLine {
  label: string;
  value: string;
  note?: string;
}

export interface EstimationGroup {
  title: string;
  lines: EstimationLine[];
}

export interface EstimationSection {
  type: "estimation";
  assumptions: EstimationLine[];
  calculations: EstimationGroup[];
  insight: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  response: string;
  errors?: string;
  notes?: string;
}

export interface ApiDesignSection {
  type: "apiDesign";
  endpoints: ApiEndpoint[];
  trap: { title: string; content: string };
}

export interface DeepDiveSubSection {
  title: string;
  content: string;
  codeBlock?: string;
}

export interface DeepDiveSection {
  type: "deepDive";
  subSections: DeepDiveSubSection[];
}

export interface TradeoffRow {
  decision: string;
  optionA: string;
  optionB: string;
  pick: string;
}

export interface TradeoffsSection {
  type: "tradeoffs";
  rows: TradeoffRow[];
  juniorsMiss: string[];
}

export interface CheatSheetSection {
  type: "cheatSheet";
  components: string;
  numbers: { label: string; value: string }[];
  decisions: { decision: string; why: string }[];
}

// ── Top-level prep data shape ──────────────────────────────────────────────

export type PrepSection =
  | RequirementsSection
  | EstimationSection
  | ApiDesignSection
  | DeepDiveSection
  | TradeoffsSection
  | CheatSheetSection
  | InteractivePrepSection;

export interface PrepData {
  systemId: string;
  systemName: string;
  sections: PrepSection[];
}
