# CoreTechX Prototype — Roadmap

Items planned for future sessions. Ordered by priority within each section.

---

## Product — Prototype Screens & Features

### High priority

**1. Replace raw confidence scores on job cards** _(Discovery OS alignment fix)_
Job cards currently show `conf: 0.85` etc. A recorded Decision (17 Apr 2026, 75% confidence) specifies that the raw score is NOT shown to ops staff — instead, a plain-English LLM explanation of why the job is in the queue. Replace the decimal with a qualitative risk state: On Track / At Risk / Critical / Jeopardy. The raw score can remain accessible in the detailed job panel for developer discussion. Add a "Why is this here?" AI explanation pattern in the job detail.
_Source: Decisions DB — "Confidence score not surfaced to ops users — LLM explanation instead" (17 Apr 2026). Flagged via Discovery OS alignment analysis._

**2. Add field supervisor persona (Troy)** _(Discovery OS gap)_
The April 22 Decision formally classifies the field supervisor experience as a role-based view within Mission Control (not a separate product surface). The prototype has no field supervisor persona. Add Troy with a simplified mobile-oriented view: My Round (today's inspection queue), Site Audit (pass/flag/fail), Jeopardy Queue (AI-suggested actions). Overlaps with existing item #4 below — treat this as the Mission Control entry point for that work.
_Source: Decisions DB — "Field supervisor experience is a Mission Control view, not a separate product surface" (22 Apr 2026). Flagged via Discovery OS alignment analysis._

**3. Add countdown/auto-execute signal to Decision Queue items** _(Discovery OS gap)_
Decision Queue items should show when the AI will auto-execute if the human doesn't act. Currently the queue has action buttons but no urgency signal — it reads as a to-do list, not an exception surface. Add a deadline tag or countdown: e.g. "AI will act in 47 min" or "Auto-resolves at 3:15pm" for L3/L4 decisions.
_Source: Session Starter — "Deadline (if no human acts, AI's top pick auto-executes)" as required Decision Queue field. Flagged via Discovery OS alignment analysis._

**4. Demonstrate chat-as-search in the AI assistant** _(Discovery OS gap)_
A confirmed design decision (April 17) says operators never browse a job list — they ask the AI: "Find me the job at 7 Smith Street, customer's on the phone." The prototype AI assistant is context-injected but doesn't demonstrate this pattern. Add at least one pre-canned interaction showing a job lookup by address or customer name.
_Source: Session Starter — "Chat as search — confirmed (Aaron, 17 April 2026)". Flagged via Discovery OS alignment analysis._

> ⚠️ **Shadow plans — needs discussion before any prototype changes**
> The Discovery OS alignment analysis noted shadow plans as a gap. Greg's view: shadow plans are not a "pillar" concept alongside Commitments and the Trade Network — they are an important commitment that a job may carry, not a separate structural layer. The framing in Discovery OS and the Session Starter may overstate their architectural prominence. Before adding any shadow plan UX to the prototype, this should be discussed and the Discovery OS framing reviewed. Do not implement shadow plan prototype changes until there is alignment on what they are in the product model.
> _Source: Greg Evans, 24 Apr 2026. Flagged via Discovery OS alignment analysis._

**5. Commitment anatomy on job detail**
Show the formal Commitment spec on each job detail panel: trigger, due date, proof required, breach trigger, escalation path, downstream release, control mode. Currently partially visible via the activity log and flags — needs a dedicated structured block.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**6. Complexity tier visual distinction**
Jobs should be visually tagged by tier (S / ST / MT / C) throughout the work queue and job detail. Qualification and planning patterns differ per tier. A heat map view across the portfolio would be powerful.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**7. Chekku trade experience**
Rebuild ChekkuView to match the "one screen, one action, one tap" vision. Daily workflow: My Day → Next Job → On Job → Day Complete. Five-tab nav: Home, Work, Money, Perks/Store, Career.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**8. Field Supervisor screens**
Dedicated screens not yet built (see also item #2 above for the Mission Control persona entry point):
- My Round — today's sites, colour-coded by status
- Site Audit — pass / flag / fail + photo capture
- Trade Check-in — WHS, variation request, conversation log
- Jeopardy Queue — AI-suggested field actions
_Source: Aaron's Vision Direction Pack v2, April 2026_

### Medium priority

**5. Tags overlaid on journey stages**
"On Hold" and "Needs Variation" should appear as overlay badges on the journey progress bar, not replace the current stage position. Aaron's principle: tags are states overlaid on stages, not separate workflow states.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**6. Staff performance nav integration**
`StaffPerformance.tsx` exists but is not reachable via the main nav. Wire it up and refine: peer comparison, trajectory arrow, tier progression (Gold/Silver/Bronze/Platinum), self-review mode.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**7. "Deferred by team" manager exception strip** ✓ _Done_
Logan's right panel — collapsible amber strip, exception-driven, showing who deferred, what task, when, with job ID link. 3 illustrative deferrals (Troy/Kylie/MJ Electrical).
_Source: April 10 steering meeting_

**8. Problematic trades section — Logan's right panel**
Logan's KPI panel should include a ranked list of the trades dragging his region's performance down — not just pattern cards, but a persistent "watch list" showing trade name, performance score, last inspection, open complaints, and a recommended action. Aaron's words: *"Here's your list of our most problematic guys in your area. Get him fixed and your whole team's going to be performing better."* This is distinct from AI patterns (which are event-triggered) — this is a standing operational view.
_Source: April 10 steering meeting_

### Not yet started (lower priority for discovery phase)

**8. Cynnch — consumer app**
"Peace of Mind as a Service." Consumer-facing view. Not yet built. Low priority for discovery sign-off.

**9. Client Portal**
White-label enterprise reporting for enterprise clients. Not yet built. Low priority for discovery sign-off.

---

## Technical

**T1. Design polish pass**
Once Aaron confirms all functional areas are correct, a lightweight pass to reduce visual noise: fewer competing colours, tighter spacing, remove remaining clutter. Greg to use the design team for this — not a full rebuild, just enough to look credible.
_Agreed in Apr 10 meeting: only after functional areas are locked_

**T2. Production architecture appendix**
Add an architecture section (or appendix) to the discovery sign-off pack describing the real production stack: Temporal.io, AWS EventBridge, Neon Postgres, event sourcing, multi-agent AI harness, LLM-agnostic design. Jack (10x Labs) leading. Needs alignment session with Alex.
_Source: Apr 10 meeting — architectural direction still open between Alex and Jack_

**T3. Open questions log**
Assemble the remaining open questions that must be answered before discovery sign-off. These become the acceptance criteria for the sign-off document. Aaron closed some in his Vision Pack; others remain. Greg compiling from Notion interview notes.
_Source: Apr 10 meeting_
