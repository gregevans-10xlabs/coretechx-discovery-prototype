# CoreTechX Prototype — Roadmap

Items planned for future sessions. Ordered by priority within each section.

---

## Product — Prototype Screens & Features

### High priority

**1. Commitment anatomy on job detail**
Show the formal Commitment spec on each job detail panel: trigger, due date, proof required, breach trigger, escalation path, downstream release, control mode. Currently partially visible via the activity log and flags — needs a dedicated structured block.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**2. Complexity tier visual distinction**
Jobs should be visually tagged by tier (S / ST / MT / C) throughout the work queue and job detail. Qualification and planning patterns differ per tier. A heat map view across the portfolio would be powerful.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**3. Chekku trade experience**
Rebuild ChekkuView to match the "one screen, one action, one tap" vision. Daily workflow: My Day → Next Job → On Job → Day Complete. Five-tab nav: Home, Work, Money, Perks/Store, Career.
_Source: Aaron's Vision Direction Pack v2, April 2026_

**4. Field Supervisor screens**
Dedicated screens not yet built:
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
