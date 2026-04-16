# CoreTechX Prototype — Session Context

> Companion to `CLAUDE.md`. Records decisions, design principles, and implementation patterns established across working sessions. Update this file as sessions add new knowledge.
>
> **Last updated:** April 2026 (Session 2)

---

## Aaron's Validated Design Principles

These came directly from Aaron's feedback in the April 10 steering meeting and were validated in the prototype. They should be treated as non-negotiable UX rules.

### 1. Exception-driven, not monitoring
The interface must never feel like a dashboard to watch. An empty queue is the success state — display it as such (green ✓, "Nothing needs your attention", AI handling X others). A person logging in and seeing an empty queue means everything is working. This was explicitly validated: Aaron said "I find this quite easy to navigate."

### 2. Decision queue, not job list
At 5,000 active jobs, a job list is the wrong interface. The queue shows only jobs requiring a human decision (~8–15 in practice). Background volume is represented as a count ("AI handling 3,450 others"), not as rows. This is the core UX metaphor for Mission Control.

**Implementation pattern:**
- `actionRequired: string | null` — null means AI has it, never show in the action queue
- `sortDecisionFirst()` in CockpitView and FieldView: hard-limit+action → jeopardy+action → urgent+action → standard+action → AI-handled
- Auto-open first decision item on load (`useState(decisionQueue[0]?.id ?? null)`)
- Default tab is always "Decisions", not "Browse all"

### 3. Hard limits are behavioural, not just visual
Safety (WHS), financial decisions >$1k, legal, and compliance items are permanently Level 1 (human only). This must be enforced in the UI:
- Show 🔒 "Cannot defer" banner on queue card
- Show 🔒 "Hard limit — human sign-off required" notice in job detail above action buttons
- **Strip defer/reschedule/reassign options from the action buttons entirely** — do not show an escape hatch
- Secondary action buttons get red border styling, not grey, to reinforce all options require a decision

**Detection helper:** `isHardLimit(job)` — checks for `compliance_gap` or `scope_change` flag types.

### 4. AI pattern detection belongs in the ops view
Aaron's reaction when shown pattern detection: "This is exactly what we want to see — Logan doesn't have to think about which trade to go after, here's the list." Patterns are not just for the executive/portfolio view. Logan sees region-scoped patterns (P-039, P-041) in his Decisions queue under an "AI Patterns Detected" divider. Clicking opens the full pattern detail with AI activity log and action buttons.

### 5. Manager sees what was reprioritised
Aaron: "The manager should see all the things that have been reprioritised by someone — that's the stuff that will cause us issues." Logan's right panel has a collapsible "Deferred by team" amber strip. Exception-driven: only renders when deferrals exist. Shows who deferred, what task, when, and the job ID.

### 6. KPI panel must be gamified, not just informational
Aaron said this repeatedly — he wants people to be motivated by their performance data, not just informed by it. The right panel is not a report. Key elements Aaron called out:
- Peer rank (anonymous — he does not want names shown, only positions)
- Progress toward next tier
- Streak counter
- Weekly challenge with specific goal
- Badges tied to real work outcomes (not generic tropes)
- Leaderboard showing only your immediate context, not full list

**Critical:** Circl is 33 people. Leaderboard groups are small (installation: 6, insurance: 5, construction: 4, FM: 4). Design accordingly — do not show 10-row leaderboards.

**Anonymity rule:** Leaderboard peers show as "anonymous" + score only. You see your own position clearly. You do not see names of colleagues. Aaron's explicit preference.

---

## Component Architecture Changes (Session 2)

### New shared component: `PerformanceHub`
`src/components/PerformanceHub.tsx` — replaces the old inline `PersonalScorecard`. Shared across CockpitView (Logan, Kerrie) and FieldView (Conner, Blake). Three tabs: Standing, My KPIs, Challenge. Driven entirely by `STAFF_PERFORMANCE` in `scenarios.ts`.

Do not inline this logic — always import from the shared component.

### Pattern detection in CockpitView
- `ALL_PATTERNS` imported from `scenarios.ts`
- `loganPatterns` = patterns filtered to `region === "North East"`
- Pattern cards rendered below job cards in the Decisions tab with "AI Patterns Detected" section label
- `selectedId` can be `PATTERN:{id}` — detected via `startsWith("PATTERN:")`
- Middle column renders `CockpitPatternDetail` when a pattern is selected

### Key files updated this session
```
src/components/CockpitView.tsx      — decision queue, pattern detection, hard-limit enforcement, deferred strip
src/components/FieldView.tsx        — decision queue, PerformanceHub wired
src/components/PerformanceHub.tsx   — new shared gamified KPI component
src/data/scenarios.ts               — STAFF_PERFORMANCE badges rewritten, leaderboards anonymised/trimmed
ROADMAP.md                          — items 7 (done), 8 (added)
```

---

## Data Model Notes

### `Job.actionRequired: string | null`
The single most important field. `null` = AI owns it, never surface in decision queue. Non-null = human must act. The entire queue UX is built on this distinction.

### Hard limit detection
```typescript
function isHardLimit(job: Job): boolean {
  return job.flags.some(f => f.type === "compliance_gap" || f.type === "scope_change");
}
```

### Background volume constants (illustrative, for "AI handling X others" display)
```typescript
LOGAN_REGION_TOTAL  = 3450   // North East NSW/QLD installations
KERRIE_REGION_TOTAL = 240    // National insurance jobs
FIELD_REGION_TOTAL  = { conner: 420, blake: 310 }
```

### STAFF_PERFORMANCE data
Full gamification data in `scenarios.ts`: tier, score, rank, rankTotal, rankNoun, streak, weeklyTrend, trendDetail, highlight, weeklyChallenge, badges (with earned/unearned), leaderboard, kpis (with lowerIsBetter flag). Badge content must stay role-specific — do not replace with generic motivational labels.

---

## Aaron's Known Preferences and Sensitivities

- **Visual, tactile learner** — forms opinions by playing, not reading. The prototype is the communication tool.
- **Busy-ness concern** — called the current prototype "too busy, too many colours." Design pass is roadmapped (T1) for after functional areas are locked. Do not add visual complexity; simplify where possible.
- **Contractor language** — Circl runs a contract management function, not employment. Avoid any wording that implies trades are employees. Review copy carefully before showing externally.
- **No names in peer comparison** — does not want staff to feel surveilled. Scores visible, identity of peers not.
- **33-person ceiling** — if a feature implies hiring, it's wrong. Everything in the platform must be achievable by the current team assisted by AI.
- **Config not code** — new clients are configured, not custom-built. Any feature that requires bespoke development per client is architecturally wrong.

---

## Discovery Status (as of April 2026)

- **Functional areas confirmed by Aaron:** Three-column cockpit layout, decision queue metaphor, AI activity log, confidence scores, pattern detection concept, gamified KPI panel concept.
- **Still to build:** Chekku (trade portal — rebuild to match Vision Pack), Field Supervisor screens, Cynnch (consumer app), Client Portal.
- **Discovery sign-off pack:** Greg compiling. Needs: Aaron's Vision Pack in editable format (Word/HTML), architecture appendix (Jack leading), open questions log (Greg from Notion notes), Alex/Jack alignment on technical direction.
- **Design pass:** Deferred until functional areas are locked. Greg will use design team for lightweight cleanup (reduce colours, tighten spacing). Not a full rebuild.

---

## Open Architectural Questions (not yet resolved)

- Temporal.io vs AWS EventBridge for workflow orchestration — Alex and Jack need alignment session
- Event sourcing approach for the commitment model
- LLM provider strategy — must be agnostic, no hard dependency on Anthropic in production
- Multi-agent harness design (Jack leading)

---

## Working Conventions

- Always run `npx tsc --noEmit` after editing `.tsx` files before committing
- Commit messages follow: `type: short description\n\n- bullet detail`
- Do not add features beyond what is asked — no speculative abstractions
- Illustrative data label ("Data illustrative") and version number must remain visible in the UI
- Never commit real API keys — `.env.example` uses placeholder only
