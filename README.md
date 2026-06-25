# System Design App

An interactive system design interview prep tool built with Next.js. Each system walks through requirements, estimation, API design, deep dives, and senior tradeoffs — with hands-on exercises at every step.

## Systems covered

| System | Prep | Learn | Design canvas |
|--------|------|-------|---------------|
| URL Shortener | ✓ | ✓ | ✓ |
| Payment System | ✓ | ✓ | ✓ |
| Notification System | ✓ | ✓ | ✓ |
| Stock Price Ticker | ✓ | ✓ | ✓ |
| Chat System | ✓ | ✓ | ✓ |
| Video Streaming | ✓ | ✓ | ✓ |

## Routes

| Path | Description |
|------|-------------|
| `/` | Home — pick a system |
| `/prep/[system]` | Interactive interview prep (requirements sorter, estimation calculator, flashcards, tradeoff picker, cheat sheet) |
| `/learn/[system]` | Story mode — narrative walkthrough |
| `/design/[system]` | Freeform canvas for sketching architecture |
| `/concepts` | Glossary of system design concepts |

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS, Framer Motion
- **Diagrams**: React Flow / XY Flow
- **Drag and drop**: dnd-kit
- **Testing**: Jest + React Testing Library (unit), Playwright (e2e)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test                # unit tests
npm run test:coverage   # unit tests with coverage report
npm run test:e2e        # Playwright end-to-end tests
npm run test:all        # both suites
```

## Project structure

```
app/
  prep/[system]/      # interview prep page
  learn/[system]/     # story mode page
  design/[system]/    # canvas page
  concepts/           # glossary page
components/
  prep/               # RequirementsSorter, EstimationCalculator, FlashcardDeck, TradeoffPicker
  canvas/             # design canvas components
  story/              # story mode components
  ui/                 # shared UI primitives
data/prep/
  types.ts            # all shared TypeScript interfaces (PrepData, PrepSection, etc.)
  *-prep.ts           # per-system prep content
```

## Adding a new system

1. Create `data/prep/[system-id]-prep.ts` — export a `PrepData` object, import types from `./types`.
2. Register it in `app/prep/[system]/page.tsx` → `PREP_REGISTRY`.
3. Add learn and design data following the same pattern for those routes.
