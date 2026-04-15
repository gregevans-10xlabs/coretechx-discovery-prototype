# CoreTechX Discovery Prototype - Claude Code Context

> **Purpose:** Context document for Claude Code sessions in VSCode. Provides the domain knowledge, codebase orientation, and design constraints needed to develop the prototype efficiently. Drop this file in the repo root as `CLAUDE.md`.
>
> **Repo:** github.com/gregevans-10xlabs/coretechx-discovery-prototype
> **Hosted:** coretechx-discovery-prototype.vercel.app
> **Current version:** v7

---

## What This Prototype IS and IS NOT

**IS:** A discovery-phase concept prototype shown to Aaron Aitken (CEO, Circl) and the ops team to validate product direction. Uses illustrative data with a live AI assistant. Aaron is a visual, tactile learner who forms opinions by playing with things, not reading documents. This prototype is the primary communication tool for discovery.

**IS NOT:** Production code. Not connected to real systems. The production platform will use Temporal.io, AWS EventBridge, Neon Postgres, event sourcing, and a multi-agent AI harness. This prototype exists to validate ideas before they are built for real.

**Success criteria:** Aaron plays with it and says "yes, that's what I mean" or "no, that's wrong." Both outcomes are valuable.

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (via @tailwindcss/vite plugin, NOT PostCSS config)
- **Deployment:** Vercel (vite build -> dist/)
- **AI:** Anthropic API via Vercel serverless function at `/api/anthropic.ts`. Model: `claude-sonnet-4-5`. API key stored as Vercel env var `ANTHROPIC_API_KEY`, never in code.
- **No router library** -- view state managed via useState in App.tsx
- **No state management library** -- local component state only
- **No component library** -- all UI hand-built with Tailwind

### Key files

```
src/
  App.tsx                    # Root: persona switcher, view routing, WorkflowConfig, AskAI component
  components/
    CockpitView.tsx          # Logan + Kerrie: three-column ops cockpit (956 lines)
    PortfolioView.tsx         # Aaron + National: portfolio/executive view (790 lines)
    FieldView.tsx             # Conner + Blake: field ops view (385 lines)
    ChekkuView.tsx            # Marcus (trade): Chekku trade portal (306 lines)
    CoordinatorView.tsx       # Legacy insurance coordinator view (303 lines)
    StaffPerformance.tsx      # Staff gamification/leaderboard (269 lines)
  data/
    scenarios.ts             # Personas, job type stats, decisions, patterns, workflows, supervisors
    jobs.ts                  # 22-job dataset with full Job type, journey definitions
    chekku.ts                # Trade portal data (Marcus persona)
api/
  anthropic.ts               # Vercel serverless proxy to Anthropic API
public/
  circl-logo.svg             # Circl brand logo
```

### Design system

- **Background:** `bg-[#f5f6f8]` (light grey)
- **Brand accent:** `#00BDFE` (Circl cyan), hover: `#0099d4`
- **AI highlight:** `bg-[#e0f7ff]` with `border-[#00BDFE]/30`
- **Cards:** `bg-white rounded-xl border border-slate-200`
- **Text:** slate scale (slate-800 primary, slate-400 secondary, slate-500 tertiary)
- **Confidence colours:** green (>=0.95), blue (>=0.80), yellow (>=0.60), orange (>=0.40), red (<0.40). Use helpers: `cc()` for text, `cb()` for bg, `cl()` for label (from scenarios.ts)
- **Autonomy levels:** green (L4), blue (L3), yellow (L2), grey (L1), red (locked)
- **Light theme only** -- no dark mode

---

## Codebase Architecture

### Persona System

The prototype uses a persona switcher to show different views of the same data. Each persona sees a filtered, role-appropriate slice.

| Persona | Role | View Component | Region | canConfig |
|---|---|---|---|---|
| logan | Ops Mgr, Installations | CockpitView | North East (NSW/QLD) | No |
| kerrie | Insurance Coordinator | CockpitView | National | No |
| conner | Ops Mgr, Construction | FieldView | National | No |
| blake | Ops Mgr, FM | FieldView | National | No |
| national | Senior Operations | PortfolioView | All Regions | No |
| aaron | Founder/CEO | PortfolioView | All Regions | Yes |
| chekku (Marcus) | Trade, MJ Electrical | ChekkuView | Sydney Metro | No |

### View Routing (App.tsx)

```
persona === "chekku"                    -> ChekkuView
persona === "aaron" || "national"       -> PortfolioView
persona === "conner" || "blake"         -> FieldView
persona === "logan" || "kerrie"         -> CockpitView
view === "workflow"                     -> WorkflowConfig (inline in App.tsx)
view === "decisions"                    -> Decision queue (inline in App.tsx)
```

### Core Data Model (src/data/jobs.ts)

The `Job` type is the central data structure:

```typescript
type Job = {
  id: string;                    // Real CG number from Prime export
  type: JobType;                 // "Starlink Install" | "Harvey Norman Install" | "Insurance Repair" | etc.
  primeStatus: PrimeStatus;      // Real Prime status string
  priority: Priority;            // "standard" | "urgent" | "jeopardy"
  suburb: string; state: string; postcode: string;
  customer: string;              // Synthetic name only
  trade: string;                 // Real trade business name from Prime
  tradeType: string;
  window: string;                // e.g. "8-10am"
  scheduledDate: string;
  geoStatus: GeoStatus;          // confirmed_en_route | gps_active | not_confirmed | no_checkin | unassigned
  value: number;                 // AUD
  conf: number;                  // 0-1 confidence score (MOST IMPORTANT NUMBER)
  journeyStep: number;           // 0-indexed position in journey
  flags: JobFlag[];              // Active alerts
  aiLog: AILogEntry[];           // Chronological AI + human actions
  actionRequired: string | null; // THE thing the human must do (null = AI has it)
  actionOptions: string[];       // Decision buttons
  visibleTo: string[];           // Persona IDs that see this job
  actionableBy: string[];        // Persona IDs that can act (skill-gated)
  readOnlyFor: string[];         // See but cannot act
  readOnlyReason?: string;       // e.g. "Insurance - escalate to Kerrie (skill: Learning)"
  // Insurance-specific
  insuranceStage?: string;
  kpiDeadline?: string;
};
```

Journey step definitions per job type (mapped to the 8 universal stages):
```typescript
STARLINK_JOURNEY  = ["Intake", "Triage", "Qualify", "Match", "Allocate", "Schedule", "Execute", "Complete"]
HN_JOURNEY        = ["Intake", "Qualify", "Match", "Allocate", "Schedule", "Execute", "QA", "Complete"]
INSURANCE_JOURNEY = ["Assessment", "Scope", "Approved", "Allocated", "In Progress", "Awaiting", "Portal", "Closed"]
AHO_JOURNEY       = ["Intake", "Site Survey", "Scope", "Approved", "Allocated", "In Progress", "Inspection", "Complete"]
```

22 jobs in the dataset, sourced from a real Prime export with synthetic customer names.

### AI Assistant (AskAI component in App.tsx)

- Accepts `context` string prop and optional `placeholder`
- Calls `/api/anthropic` (Vercel serverless function proxying to Anthropic)
- System prompt sets general CoreTechX context; `context` prop adds view-specific detail
- Formats responses with basic markdown rendering (FormatAI component)
- Used in: job detail, workflow config, portfolio view, standalone sections

---

## The Domain -- What CoreTechX IS

### Core Concepts (minimum context for AI system prompts)

- **Commitments, not jobs.** Probabilistic contracts between actors. Confidence score 0-1 drives all behaviour. Commitments activate in parallel when dependencies are met.
- **Shadow Plans.** Pre-computed backup trade at booking time. Target: cancellation to customer notified in <60 seconds.
- **Exception-driven.** Empty Mission Control = everything is working. Humans are exception handlers.
- **8 Universal Stages:** Intake, Triage, Qualify, Plan, Allocate, Execute, Complete, Settle. All job types use the same backbone; complexity varies by tier.
- **Tags, not statuses:** "On Hold" and "Needs Variation" are tags overlaid on stages, not separate workflow states.

### Four Complexity Tiers

| Tier | Description | AI Target | Examples |
|---|---|---|---|
| S (Simplex) | Single trade, single visit, rate card | 90%+ | Starlink 99%, Harvey Norman 95% |
| ST (Standard) | Single trade, needs quoting | 82-92% | JB Hi-Fi commercial 82% |
| MT (Multi-Trade) | Multiple trades, dependencies | ~78% | Insurance repairs 78% |
| C (Complex) | Full PM, on-site supervision | ~25% | Construction 25% |

### AI Control Modes (Autonomy Ladder)

| Mode | Label | What happens | In prototype |
|---|---|---|---|
| Human Only | Locked | Permanent hard limit. No AI pathway. | `LM.hard` - red badge, lock icon |
| L1 Inform | Level 1 | AI prepares context. Human decides. | `LM[1]` - grey badge |
| L2 Recommend | Level 2 | AI recommends with confidence. Human approves. | `LM[2]` - yellow badge |
| L3 Act+Notify | Level 3 | AI acts, logs, notifies human. Reversible. | `LM[3]` - blue badge |
| L4 Full Auto | Level 4 | AI acts. Human sees exceptions only. | `LM[4]` - green badge |

Hard limits (permanently L1, no promotion path): legal, WHS/safety, compliance, financial >$1K, police/fire/rescue, banks, enterprise client communications.

### Skill Tiers (Internal Staff)

- **T1 Operator:** Standard work across all divisions (calls, intake, dispatch, RCTI)
- **T2 Specialist:** Complex work (insurance assessment, estimating, multi-trade scheduling)
- **T3 Lead:** Escalation ownership, client relationships, on-site supervision
- **Ops Management:** Platform governance, AI training, process improvement

### Five Product Surfaces (prototype status)

| Surface | Description | Prototype Status |
|---|---|---|
| Mission Control | Desktop ops cockpit. Exception-driven. | PRIMARY FOCUS. CockpitView + PortfolioView + FieldView. |
| Chekku | Trade app. "Employment Hero for Trades." | ChekkuView exists. Needs refinement to match Vision Pack. |
| Field Supervisor | Mobile. Audits, inspections, WHS, jeopardy. | Partially covered by FieldView. Needs dedicated screens. |
| Cynnch | Consumer app. "Peace of Mind as a Service." | NOT YET BUILT. |
| Client Portal | White-label enterprise reporting. | NOT YET BUILT. |

### The Business

- **Client:** Circl (circl.com.au), building services and installation, Sydney AU
- **Scale:** ~20,000 Starlink installs/month + insurance + HN/JB + construction + FM
- **Constraint:** $100M+ ARR with 33 people. If a feature requires hiring, it's wrong.
- **Trade network:** Circl's competitive moat. Verified, compliant tradespeople.
- **Key people in prototype:** Logan (Installations), Kerrie (Insurance), Conner (Construction), Blake (FM), Aaron (CEO, has workflow config access)

### Non-Negotiable Principles

1. **Configuration, Not Code** -- new clients configured, not custom-built
2. **Parallel, Not Sequential** -- commitments activate when dependencies are met
3. **33-Person Ceiling** -- automate or kill anything that requires hiring
4. **AI-First, Human-Governed** -- boundary shifts toward AI over time
5. **Trade Experience = Revenue** -- Chekku must be the best app a tradie has ever used
6. **One Platform, Many Skins** -- CoreTechX runs logic, everything else is a view
7. **Prove It Works First** -- Simplex, then Standard, then Multi-Trade, then Complex
8. **LLM-Agnostic** -- switch providers without rewriting agents

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for product and technical items planned for future sessions.

---

## What Aaron Cares About

When Aaron reviews the prototype, these are the things that make or break his reaction:

1. **Exception-driven, not monitoring.** If it looks like a dashboard to watch, it's wrong.
2. **AI doing real work.** The AI activity log must show the system making decisions autonomously.
3. **Human only when necessary.** "Action Required" should feel like an exception.
4. **Confidence scores visible everywhere.** The 0-1 number drives all behaviour.
5. **Trade chain visibility.** For multi-trade jobs: who depends on whom, where risk is.
6. **Workflow configuration access.** Aaron wants to see and adjust autonomy levels.
7. **Immutable audit trail.** Every decision logged. Cannot be altered after the fact.

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server at localhost:5173
npm run build        # TypeScript check + Vite build
```

AI assistant requires `ANTHROPIC_API_KEY`. Locally, either:
- Use `npx vercel dev` to run with Vercel env vars
- Or accept that AI calls return "Unable to reach AI" during pure frontend work

---

## Data Privacy

- Real CG job numbers from Prime: OK
- Real trade business names from Prime: OK
- Real suburbs and postcodes: OK
- Real individual person names (customer or trade): NEVER. Use synthetic names or business names.
- Internal strategic numbers ($100M, 33 people): internal only, never in external materials
- Keep "Data illustrative" and version labels visible in the UI