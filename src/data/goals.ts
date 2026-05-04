// ─────────────────────────────────────────────────────────────────────────────
// Goals & Configuration Templates
//
// Configuration-layer data, distinct from the runtime `Commitment` instances
// rendered on actual jobs in CommitmentAnatomy. Goals are the user-facing
// primitive — a capability (e.g. "Get customer satisfaction") composed of
// atomic commitments. The user edits goal-level controls; the system writes
// those changes through to the underlying commitments.
//
// Scope: prototype models the Starlink workflow goals. Other workflows would
// follow the same shape; deferred to keep the MVP focused.
// ─────────────────────────────────────────────────────────────────────────────

import type { CommitmentControl } from "./jobs";

// ─── Anchors ─────────────────────────────────────────────────────────────────
// Every goal (and every standalone commitment) is anchored to the workflow in
// one of three ways:
//   - staged:   pinned to one of the 8 universal stages
//   - floating spanning: active across a range of stages
//   - floating triggered: only materialises when a triggering event fires
export type GoalAnchor =
  | { kind: "staged"; stage: number }                          // 0-7 universal stage index
  | { kind: "floating"; spans: [number, number] }              // [from, to] inclusive
  | { kind: "triggered"; stage: number; trigger: string };     // event-driven materialisation

export type GoalScope = "universal" | "job-type" | "client-overlay";

// ─── Goal-level control ─────────────────────────────────────────────────────
// Intent-shaped knob exposed to the user, translates to commitment-level
// changes when published. `affects` lists the commitment IDs this control
// writes through to — surfaces the implementation detail when needed but
// hides it by default.
export type GoalControl = {
  id: string;
  label: string;
  kind: "toggle" | "select" | "multiselect" | "duration";
  value: string | number | boolean | string[];
  options?: string[];
  affects: string[];        // commitment IDs touched by this control
  description?: string;
};

// ─── Atomic commitment template (configuration layer) ───────────────────────
// Distinct from the runtime `Commitment` type in jobs.ts (which carries
// instance state like proven/breach). This is the reusable template that the
// runtime instantiates onto each job. Carries autonomy + accuracy metadata
// the configuration UI needs.
export type GoalCommitment = {
  id: string;
  promise: string;
  owner: string;
  ownerTier?: string;
  controlMode: CommitmentControl;
  proofRequired: string;
  autonomyLevel: 1 | 2 | 3 | 4;
  accuracy?: number;        // 0-1, last 90-day rolling
  enabled: boolean;
  hardLimit?: string;       // if set, why this is permanently locked at L1
};

// ─── Goal ────────────────────────────────────────────────────────────────────
export type Goal = {
  id: string;
  name: string;
  purpose: string;
  scope: GoalScope;
  jobTypes: string[];                 // workflows this goal applies to
  anchor: GoalAnchor;
  controls: GoalControl[];
  commitments: GoalCommitment[];
  version: string;
  publishedAt: string;
  publishedBy: string;
  usedInWorkflows: string[];          // for blast-radius display in the drawer
};

// ─── Standalone commitments ──────────────────────────────────────────────────
// Commitments that don't compose into a larger goal — the contract IS the
// thing. Same anchor semantics; same versioning; just no goal wrapper.
export type StandaloneCommitment = GoalCommitment & {
  anchor: GoalAnchor;
  scope: GoalScope;
  jobTypes: string[];
  version: string;
  publishedAt: string;
  publishedBy: string;
  usedInWorkflows: string[];
};

// ─── Autonomy promotion thresholds ──────────────────────────────────────────
// Discovery OS principle: AI earns autonomy through measured accuracy. Each
// promotion has an accuracy floor; promotion below threshold requires an
// explicit policy override from the Authoriser.
//
// L1 has no floor (always available — operator decides). L4 mirrors the spec
// requirement of 95%+ sustained accuracy for full autonomy.
export const AUTONOMY_THRESHOLDS: Record<2 | 3 | 4, number> = {
  2: 0.75,   // L2 Recommend — AI surfaces recommendation, human approves
  3: 0.88,   // L3 Act + Notify — AI acts, human can override
  4: 0.95,   // L4 Full Auto — AI handles end-to-end, human sees exceptions only
};

// ─── Universal Stage labels ─────────────────────────────────────────────────
// Re-exported here so the configuration view can label stage columns without
// importing from jobs.ts (keeps the configuration layer's dependencies tight).
export const STAGE_NAMES = [
  "Intake", "Triage", "Qualify", "Plan", "Allocate", "Execute", "Complete", "Settle",
] as const;

// ─── Starlink workflow — goals ──────────────────────────────────────────────
// 6 goals modelled across the 8 stages. Mix of staged + floating; mix of
// universal + job-type scope. Get customer satisfaction is the canonical
// example of a multi-commitment goal — modelled in detail.

const ALL_INSTALL_WORKFLOWS = ["Starlink Install", "Harvey Norman Install", "JB Hi-Fi Install"];
const ALL_WORKFLOWS         = ["Starlink Install", "Harvey Norman Install", "JB Hi-Fi Install", "Insurance Repair", "AHO Construction", "Home Repair"];

export const STARLINK_GOALS: Goal[] = [

  // 1. Intake — universal across all workflows
  {
    id: "G-INTAKE",
    name: "Intake & classify",
    purpose: "Receive job orders from any source, auto-classify by job type, apply the relevant rate card and SLA, and trigger downstream workflow.",
    scope: "universal",
    jobTypes: ALL_WORKFLOWS,
    anchor: { kind: "staged", stage: 0 },
    version: "5.1",
    publishedAt: "2026-03-12",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_WORKFLOWS,
    controls: [
      { id: "c-intake-sources", label: "Active intake channels", kind: "multiselect", value: ["Starlink portal", "HN/JB API", "Allianz portal", "AHO portal", "Email"], options: ["Starlink portal", "HN/JB API", "Allianz portal", "AHO portal", "Email", "Phone (manual)"], affects: ["X-INTAKE-01"] },
      { id: "c-intake-classify-conf", label: "Auto-classify confidence threshold", kind: "select", value: "0.85", options: ["0.70", "0.80", "0.85", "0.90", "0.95"], affects: ["X-INTAKE-02"], description: "Below this threshold, classification is escalated to T1 dispatch." },
    ],
    commitments: [
      { id: "X-INTAKE-01", promise: "Job order received and event captured from source", owner: "AI Intake Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Source event captured + ID assigned", autonomyLevel: 4, accuracy: 0.998, enabled: true },
      { id: "X-INTAKE-02", promise: "Job auto-classified by type with confidence ≥ threshold", owner: "AI Triage Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Classification logged with confidence score", autonomyLevel: 4, accuracy: 0.994, enabled: true },
    ],
  },

  // 2. Match trade — job-type-specific (install workflows)
  {
    id: "G-MATCH",
    name: "Match trade to job",
    purpose: "Identify a compliant trade with capacity and proximity to fulfil the job, soft-reserve them, and pre-compute a shadow plan in case of failure.",
    scope: "job-type",
    jobTypes: ALL_INSTALL_WORKFLOWS,
    anchor: { kind: "staged", stage: 4 },
    version: "3.7",
    publishedAt: "2026-04-02",
    publishedBy: "Logan",
    usedInWorkflows: ALL_INSTALL_WORKFLOWS,
    controls: [
      { id: "c-match-radius", label: "Search radius (km)", kind: "select", value: "20", options: ["10", "20", "30", "50"], affects: ["X-MATCH-01"], description: "Auto-extends to next tier if no compliant trades within initial radius." },
      { id: "c-match-soft-hold", label: "Soft-reservation hold time", kind: "select", value: "90 min", options: ["30 min", "60 min", "90 min", "2h", "4h"], affects: ["X-MATCH-02"] },
      { id: "c-match-shadow", label: "Pre-compute shadow plan", kind: "toggle", value: true, affects: ["X-MATCH-03"], description: "Required for the 60-second cancellation guarantee." },
    ],
    commitments: [
      { id: "X-MATCH-01", promise: "Compliant trade identified within search radius", owner: "AI Trade Matching Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Trade selection logged with compliance + capacity check", autonomyLevel: 4, accuracy: 0.971, enabled: true },
      { id: "X-MATCH-02", promise: "Trade soft-reserved via Chekku", owner: "AI Trade Matching Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Chekku acceptance event received", autonomyLevel: 4, accuracy: 0.965, enabled: true },
      { id: "X-MATCH-03", promise: "Shadow trade pre-computed and soft-reserved", owner: "AI Trade Matching Agent", ownerTier: "Ops · AI", controlMode: "ai_assisted", proofRequired: "Shadow trade selected + capacity confirmed", autonomyLevel: 3, accuracy: 0.892, enabled: true },
    ],
  },

  // 3. Verify trade compliance — floating, universal, spans Allocate→Settle
  {
    id: "G-COMPLIANCE",
    name: "Verify trade compliance",
    purpose: "Continuously verify the assigned trade holds current licences, insurances, and SWMS for the work being done. Exception-flag on expiry.",
    scope: "universal",
    jobTypes: ALL_WORKFLOWS,
    anchor: { kind: "floating", spans: [4, 7] },  // Allocate → Settle
    version: "4.2",
    publishedAt: "2026-04-15",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_WORKFLOWS,
    controls: [
      { id: "c-compliance-lookback", label: "Compliance check frequency", kind: "select", value: "Daily", options: ["Hourly", "Daily", "Weekly"], affects: ["X-COMPLIANCE-01", "X-COMPLIANCE-02"] },
      { id: "c-compliance-warning-window", label: "Expiry warning window", kind: "select", value: "30 days", options: ["7 days", "14 days", "30 days", "60 days"], affects: ["X-COMPLIANCE-01"] },
      { id: "c-compliance-block-allocations", label: "Block new allocations on lapse", kind: "toggle", value: true, affects: ["X-COMPLIANCE-02"], description: "Prevent allocation of jobs to trades whose compliance has lapsed." },
    ],
    commitments: [
      { id: "X-COMPLIANCE-01", promise: "Trade licence + insurance currency verified within window", owner: "AI Compliance Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Compliance docs current within configured window", autonomyLevel: 4, accuracy: 0.999, enabled: true },
      { id: "X-COMPLIANCE-02", promise: "SWMS / SWMS equivalent on file for high-risk work", owner: "AI Compliance Agent", ownerTier: "Ops · AI", controlMode: "ai_assisted", proofRequired: "SWMS PDF uploaded to Chekku for the trade", autonomyLevel: 3, accuracy: 0.94, enabled: true },
    ],
  },

  // 4. Capture install evidence — staged at Complete
  {
    id: "G-EVIDENCE",
    name: "Capture install evidence",
    purpose: "Collect photographic evidence, customer signature, and serial scans before marking job complete. Required for client acceptance and trade payment.",
    scope: "universal",
    jobTypes: ALL_INSTALL_WORKFLOWS,
    anchor: { kind: "staged", stage: 6 },
    version: "2.4",
    publishedAt: "2026-03-28",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_INSTALL_WORKFLOWS,
    controls: [
      { id: "c-evidence-min-photos", label: "Minimum photos required", kind: "select", value: "6", options: ["4", "6", "8", "10"], affects: ["X-EVIDENCE-01"] },
      { id: "c-evidence-customer-sig", label: "Customer signature required", kind: "toggle", value: true, affects: ["X-EVIDENCE-02"] },
      { id: "c-evidence-serial-scan", label: "Equipment serial scan required", kind: "toggle", value: true, affects: ["X-EVIDENCE-03"] },
    ],
    commitments: [
      { id: "X-EVIDENCE-01", promise: "Photo evidence pack submitted (≥ minimum)", owner: "Trade", ownerTier: "Trade · T1", controlMode: "ai_assisted", proofRequired: "Photos uploaded via Chekku, count ≥ minimum", autonomyLevel: 3, accuracy: 0.913, enabled: true },
      { id: "X-EVIDENCE-02", promise: "Customer signature captured", owner: "Trade", ownerTier: "Trade · T1", controlMode: "ai_assisted", proofRequired: "Signed customer acceptance form via Chekku", autonomyLevel: 3, accuracy: 0.952, enabled: true },
      { id: "X-EVIDENCE-03", promise: "Equipment serial scanned and recorded", owner: "Trade", ownerTier: "Trade · T1", controlMode: "ai_assisted", proofRequired: "Serial number captured via Chekku scan", autonomyLevel: 3, accuracy: 0.967, enabled: true },
    ],
  },

  // 5. Process trade payment — staged at Settle
  {
    id: "G-PAYMENT",
    name: "Process trade payment",
    purpose: "Generate RCTI, sync to trade portal, confirm bank remittance. Closes the trade-side commercial loop.",
    scope: "universal",
    jobTypes: ALL_WORKFLOWS,
    anchor: { kind: "staged", stage: 7 },
    version: "3.1",
    publishedAt: "2026-04-08",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_WORKFLOWS,
    controls: [
      { id: "c-payment-terms", label: "Payment terms", kind: "select", value: "14 days", options: ["7 days", "14 days", "30 days"], affects: ["X-PAYMENT-02"] },
      { id: "c-payment-retry-attempts", label: "RCTI sync retry attempts", kind: "select", value: "3", options: ["1", "2", "3", "5"], affects: ["X-PAYMENT-01"], description: "Failed retries escalate to T1 dispatch for manual remittance." },
    ],
    commitments: [
      { id: "X-PAYMENT-01", promise: "RCTI generated and synced to trade portal", owner: "AI Settlement Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Portal sync acknowledged with RCTI ID", autonomyLevel: 4, accuracy: 0.997, enabled: true },
      { id: "X-PAYMENT-02", promise: "Bank remittance confirmed", owner: "AI Settlement Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Bank confirmation event received within payment terms", autonomyLevel: 4, accuracy: 0.998, enabled: true },
    ],
  },

  // 6. Get customer satisfaction — floating, universal, spans Complete→Settle.
  // Canonical example of a multi-commitment goal abstracted by intent-shaped
  // controls. The user toggles Channels; the system enables/disables the
  // matching commitments. The goal-level breach (Response-rate target) is
  // distinct from per-commitment breach thresholds.
  {
    id: "G-CSAT",
    name: "Get customer satisfaction",
    purpose: "Capture customer sentiment after job completion so we can spot issues early and improve the product.",
    scope: "universal",
    jobTypes: ALL_WORKFLOWS,
    anchor: { kind: "floating", spans: [6, 7] },  // Complete → Settle
    version: "3.2",
    publishedAt: "2026-04-12",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_WORKFLOWS,
    controls: [
      { id: "c-csat-enabled", label: "Enabled", kind: "toggle", value: true, affects: ["X-CSAT-01", "X-CSAT-02", "X-CSAT-03", "X-CSAT-04"] },
      { id: "c-csat-channels", label: "Channels", kind: "multiselect", value: ["Email", "SMS"], options: ["Email", "SMS", "WhatsApp"], affects: ["X-CSAT-01", "X-CSAT-02"], description: "Which channels are used to reach the customer." },
      { id: "c-csat-timing", label: "Send timing", kind: "select", value: "T+24h after Settle", options: ["T+1h after Settle", "T+24h after Settle", "T+48h after Settle", "T+72h after Settle"], affects: ["X-CSAT-01", "X-CSAT-02"] },
      { id: "c-csat-followup", label: "Follow-up trigger", kind: "select", value: "Rating ≤ 3 stars", options: ["Always", "Rating ≤ 3 stars", "Rating ≤ 4 stars", "Never"], affects: ["X-CSAT-04"], description: "When to trigger a human follow-up call." },
      { id: "c-csat-target", label: "Response-rate target", kind: "select", value: "60%", options: ["50%", "60%", "70%", "80%"], affects: [] /* goal-level only */, description: "Aggregate target across all channels. Goal breaches if missed for 7 consecutive days." },
    ],
    commitments: [
      { id: "X-CSAT-01", promise: "CSAT email sent at configured timing", owner: "AI Customer Comms Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Email delivery event received", autonomyLevel: 4, accuracy: 0.997, enabled: true },
      { id: "X-CSAT-02", promise: "CSAT SMS sent at configured timing", owner: "AI Customer Comms Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "SMS delivery event received", autonomyLevel: 4, accuracy: 0.995, enabled: true },
      { id: "X-CSAT-03", promise: "Customer rating recorded (or no-response timeout)", owner: "AI Customer Comms Agent", ownerTier: "Ops · AI", controlMode: "ai_autonomous", proofRequired: "Rating captured OR T+7d timeout", autonomyLevel: 4, accuracy: 0.998, enabled: true },
      { id: "X-CSAT-04", promise: "Follow-up call triggered when threshold met", owner: "AI Customer Comms Agent", ownerTier: "Ops · AI", controlMode: "ai_assisted", proofRequired: "Callback queued in T1 dispatch when rating below threshold", autonomyLevel: 3, accuracy: 0.892, enabled: true },
    ],
  },
];

// ─── Standalone commitments (Starlink) ──────────────────────────────────────
// Atomic contracts that don't compose into a goal — the contract is the
// capability. Most operationally-critical commitments fit here.
export const STARLINK_STANDALONE: StandaloneCommitment[] = [
  {
    id: "S-WINDOW",
    promise: "Trade attends within scheduled window",
    owner: "Trade",
    ownerTier: "Trade · T1",
    controlMode: "ai_assisted",
    proofRequired: "Geo check-in at site within window start ± tolerance",
    autonomyLevel: 3,
    accuracy: 0.961,
    enabled: true,
    anchor: { kind: "staged", stage: 5 },
    scope: "universal",
    jobTypes: ALL_INSTALL_WORKFLOWS,
    version: "2.8",
    publishedAt: "2026-03-20",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_INSTALL_WORKFLOWS,
  },
  {
    id: "S-VARIATION",
    promise: "Scope variation approved by human (financial >$1k hard limit)",
    owner: "Ops Manager (division)",
    ownerTier: "Ops · T3",
    controlMode: "human_only",
    proofRequired: "Coordinator approval logged with reason + photos",
    autonomyLevel: 1,
    enabled: true,
    hardLimit: "Financial decisions >$1k require human sign-off",
    anchor: { kind: "triggered", stage: 5, trigger: "scope_change_logged" },
    scope: "universal",
    jobTypes: ALL_WORKFLOWS,
    version: "1.4",
    publishedAt: "2026-02-10",
    publishedBy: "Aaron",
    usedInWorkflows: ALL_WORKFLOWS,
  },
];

// ─── Pending changes — seeded examples ──────────────────────────────────────
// In production these come from the drafts queue. Seeded here to demonstrate
// the cross-cutting Pending Changes panel pattern. Each entry shows author,
// change type, scope, blast radius, and review state.
export type PendingChange = {
  id: string;
  draftedBy: string;
  draftedById: string;
  draftedAt: string;
  changeType: "goal-control" | "commitment-edit" | "autonomy-promote" | "fork-overlay" | "new-goal" | "hard-limit";
  target: string;            // human-readable target (e.g. "Match trade — Search radius")
  before: string;
  after: string;
  scope: string;             // human-readable scope (e.g. "All install workflows", "Starlink only")
  blastRadius: string;       // e.g. "5 workflows · ~3,200 in-flight jobs"
  reviewState: "awaiting_review" | "needs_authoriser" | "scheduled" | "approved";
  routedTo: string;          // persona id of next reviewer
  notes?: string;
};

export const PENDING_CHANGES: PendingChange[] = [
  {
    id: "PC-101",
    draftedBy: "Logan Reilly",
    draftedById: "logan",
    draftedAt: "Today 09:42",
    changeType: "goal-control",
    target: "Match trade — Search radius",
    before: "20 km",
    after: "30 km",
    scope: "Starlink Install only (NSW/QLD)",
    blastRadius: "1 workflow · ~480 in-flight jobs",
    reviewState: "awaiting_review",
    routedTo: "national",
    notes: "Coverage gap pattern P-039 persisting. Tighter radius forcing manual procurement on 6+ jobs in Mid North Coast. Trade network is dense enough at 30km to reduce manual.",
  },
  {
    id: "PC-102",
    draftedBy: "Kerrie Tran",
    draftedById: "kerrie",
    draftedAt: "Yesterday 16:08",
    changeType: "fork-overlay",
    target: "Get customer satisfaction — Allianz overlay",
    before: "Inherits universal · channels = Email + SMS",
    after: "Allianz overlay · channels = Allianz portal only · timing = T+1h",
    scope: "Insurance Repair · Allianz Australia Insurance Ltd",
    blastRadius: "1 client overlay · ~62 in-flight Allianz jobs",
    reviewState: "needs_authoriser",
    routedTo: "aaron",
    notes: "Allianz operator request: surveys via Allianz portal not external SMS. Tighter timing per their SLA framework.",
  },
];

// ─── Audit log — seeded recent published changes ────────────────────────────
// Demonstrates the immutable history. Real production would derive from
// publish events on PendingChanges; here it's seeded.
export type ConfigAuditEntry = {
  id: string;
  publishedBy: string;
  publishedAt: string;
  changeType: PendingChange["changeType"];
  target: string;
  summary: string;
  version: string;
};

export const CONFIG_AUDIT: ConfigAuditEntry[] = [
  { id:"CA-201", publishedBy:"Aaron", publishedAt:"Yesterday 11:14",  changeType:"goal-control",     target:"Get customer satisfaction — Follow-up trigger", summary:"Lowered threshold from ≤4 stars to ≤3 stars. Reduces follow-up call load by ~40%.", version:"v3.2" },
  { id:"CA-202", publishedBy:"Aaron", publishedAt:"3 days ago 14:32", changeType:"autonomy-promote", target:"RCTI generated and synced to trade portal",      summary:"Promoted to L4 — accuracy 99.7% over 90 days, threshold met.",                  version:"v3.0 → v3.1" },
  { id:"CA-203", publishedBy:"National", publishedAt:"5 days ago",    changeType:"commitment-edit",  target:"Trade compliance — SWMS proof required",        summary:"Strengthened proof: now requires SWMS PDF upload (was 'on file').",            version:"v4.1 → v4.2" },
];

// ─── Simulation ──────────────────────────────────────────────────────────────
// "If this change had been live for the last 30 days, what would have
// changed?" Each PendingChange can be simulated against a historical job
// dataset before publishing. The result is intentionally honest: it shows
// side effects, not just the obvious upside, and surfaces caveats so the
// operator (or Authoriser) knows what they're trusting.
//
// In production this would replay the actual event stream against the
// proposed configuration. For the prototype, results are seeded for staged
// drafts and generated heuristically for drafts created during the demo.

export type SimulationMetricDirection = "improvement" | "regression" | "side-effect" | "neutral";

export type SimulationMetric = {
  label: string;
  before: string;
  after: string;
  delta: string;                    // human-readable, e.g. "-67%", "+47", "no change"
  direction: SimulationMetricDirection;
  note?: string;
};

export type SimulationExample = {
  jobId: string;
  location: string;
  difference: string;               // human-readable: what would have changed for this job
};

export type SimulationResult = {
  datasetDescription: string;       // honest data scope, e.g. "Last 32 days · 5,847 historical jobs · NSW/QLD"
  headline: string;                 // one-line summary
  metrics: SimulationMetric[];
  examples: SimulationExample[];
  caveats: string[];
  recommendation: "approve" | "review_first" | "do_not_approve";
  recommendationNote: string;
};

// ─── Seeded simulations for the staged pending changes ──────────────────────
// Realistic numbers that lead with the upside, surface side effects, and
// reference specific job IDs from the prototype dataset where possible.
export const SEEDED_SIMULATIONS: Record<string, SimulationResult> = {

  // PC-101 — Logan: Match trade Search radius 20km → 30km
  "PC-101": {
    datasetDescription: "Last 32 days · 5,847 historical jobs · NSW/QLD region",
    headline: "Would have prevented 4 of 6 manual procurement events by reaching compliant trades in the Mid North Coast corridor.",
    metrics: [
      { label: "Manual procurement events",  before: "6",      after: "2",      delta: "-67%",  direction: "improvement" },
      { label: "Coverage-gap pattern hits",  before: "12",     after: "5",      delta: "-58%",  direction: "improvement" },
      { label: "Avg time to allocation",     before: "19 min", after: "14 min", delta: "-26%",  direction: "improvement" },
      { label: "Avg trade travel time",      before: "31 min", after: "38 min", delta: "+23%",  direction: "side-effect", note: "Wider radius pulls trades from further out — may push some windows late." },
      { label: "Hard-limit hits",            before: "0",      after: "0",      delta: "no change", direction: "neutral" },
    ],
    examples: [
      { jobId: "CG36003", location: "Fern Bay NSW",     difference: "AI would have auto-allocated York Digital Solutions inside the radius — Sharon's manual confirmation step skipped." },
      { jobId: "CG36015", location: "Coomba Bay NSW",   difference: "Allocated 14 min after intake instead of 90 min — shadow-plan activation avoided entirely." },
      { jobId: "CG35978", location: "Forster NSW",      difference: "AI reached AMP Electrical (28km) inside the wider radius — manual procurement avoided." },
      { jobId: "CG36015", location: "Forster NSW",      difference: "Pattern P-039 (coverage gap) would have eased — 2 of 3 affected jobs absorb." },
    ],
    caveats: [
      "Assumes trade availability holds at current levels.",
      "+7 min average travel may push 4–6 jobs past their window cutoff. Recommend re-evaluation 30 days post-publish.",
      "Doesn't account for slight increase in trade fuel/time costs (out of scope for autonomy economics).",
    ],
    recommendation: "approve",
    recommendationNote: "Net positive — improvement in 3 metrics, one side-effect with a clear monitoring path.",
  },

  // PC-102 — Kerrie: Get customer satisfaction Allianz overlay (channel switch + tighter timing)
  "PC-102": {
    datasetDescription: "Last 32 days · 421 Allianz jobs · National",
    headline: "Would have shifted ~340 Allianz customers from external SMS/email to Allianz portal surveys, with surveys reaching customers ~23h earlier.",
    metrics: [
      { label: "CSAT surveys sent (Allianz)", before: "421",    after: "421",    delta: "no change",      direction: "neutral" },
      { label: "Channel: Allianz portal",     before: "0%",     after: "100%",   delta: "+421",           direction: "improvement", note: "Aligns with Allianz operator request — surveys via their portal, not external channels." },
      { label: "Avg time-to-send",            before: "T+24h",  after: "T+1h",   delta: "-23h",           direction: "improvement", note: "Closer to event = higher recall, projected response rate +14pp." },
      { label: "Projected response rate",     before: "62%",    after: "76%",    delta: "+14pp",          direction: "improvement", note: "Based on 2025 H2 portal-channel cohort (n=2,184)." },
      { label: "Customers reachable",         before: "421",    after: "418",    delta: "-3 customers",   direction: "side-effect", note: "Customers without Allianz portal access (3) would not receive a survey." },
    ],
    examples: [
      { jobId: "CG36078", location: "Shailer Park QLD", difference: "Survey would have been delivered via Allianz portal at T+1h instead of SMS at T+24h." },
      { jobId: "CG36011", location: "Port Macquarie NSW", difference: "Customer would have received survey through portal — likely higher engagement given portal-active customer." },
      { jobId: "CG36069", location: "Mardi NSW", difference: "Same survey content delivered via Allianz portal; SMS path retired for this client." },
    ],
    caveats: [
      "Allianz client overlay only — universal CSAT goal unchanged for other clients.",
      "Response-rate projection (+14pp) assumes Allianz portal cohort behaviour holds.",
      "3 customers without portal access (legacy customers, ~0.7% of Allianz base) lose CSAT signal entirely — alternative channel needed for those.",
    ],
    recommendation: "review_first",
    recommendationNote: "High upside but introduces a small uncovered cohort (3 customers) that should be addressed before publish.",
  },
};

// Heuristic simulation for drafts created live during the demo. Picks a
// result shape based on changeType + draft metadata. Numbers are illustrative
// at the prototype scope; real production would replay the event stream.
export function simulateChange(change: PendingChange): SimulationResult {
  if (change.changeType === "autonomy-promote") {
    const isPromotion = /L\d → L[34]/i.test(`${change.before} → ${change.after}`);
    const isOverride  = /override/i.test(change.after);
    const targetIsL4  = /L4/i.test(change.after);
    const baseHandled = targetIsL4 ? 47 : 23;
    return {
      datasetDescription: "Last 32 days · 5,847 historical jobs · NSW/QLD region",
      headline: isPromotion
        ? `Would have shifted ~${baseHandled} ${change.target.split("—")[0].trim().toLowerCase()} actions from human dispatch to AI auto-execution.`
        : "Demotion: AI would have surfaced more decisions for human review.",
      metrics: [
        { label: "Decisions auto-handled by AI", before: "3,421", after: `${3421 + baseHandled}`, delta: `+${baseHandled} (+${(baseHandled / 3421 * 100).toFixed(1)}%)`, direction: isPromotion ? "improvement" : "regression" },
        { label: "Decisions routed to T1 dispatch", before: "487", after: `${487 - baseHandled}`, delta: `-${baseHandled} (-${(baseHandled / 487 * 100).toFixed(1)}%)`, direction: isPromotion ? "improvement" : "regression" },
        ...(isOverride ? [{
          label: "Projected false positives",
          before: "—",
          after: `~${Math.round(baseHandled * 0.07)}`,
          delta: "estimated",
          direction: "side-effect" as SimulationMetricDirection,
          note: "Based on current accuracy ~89%. If accuracy drops below 85%, false positives climb sharply — recommend monitoring window after publish.",
        }] : []),
        { label: "Avg time-to-action", before: "12.4 min", after: "2.1 min", delta: "-83%", direction: "improvement", note: "AI execution is near-instantaneous; T1 dispatch involves callback queue + human latency." },
      ],
      examples: [
        { jobId: "CG36241", location: "Forster NSW",      difference: "Would have been auto-handled by AI without the T1 callback step." },
        { jobId: "CG36245", location: "Salamander Bay NSW", difference: "AI would have applied the auto-execute option directly; no escalation to dispatch." },
      ],
      caveats: [
        isOverride ? "Threshold override applied — accuracy below the 95% bar required for L4." : "Accuracy meets threshold for proposed level.",
        "Assumes current model accuracy holds. Sustained drop below 85% would warrant rollback.",
      ],
      recommendation: isOverride ? "review_first" : "approve",
      recommendationNote: isOverride
        ? "Sub-threshold promotion — Authoriser approval required, monitoring window strongly recommended."
        : "Threshold met. Net positive on automation rate; low risk.",
    };
  }
  // Generic goal-control edit
  return {
    datasetDescription: "Last 32 days · 5,847 historical jobs · NSW/QLD region",
    headline: `Would have applied to ~${change.scope.includes("Starlink") ? 1240 : 4200} jobs over the simulation window.`,
    metrics: [
      { label: "Jobs affected", before: "—", after: change.scope.includes("Starlink") ? "~1,240" : "~4,200", delta: "scope of replay", direction: "neutral" },
      { label: "Hard-limit hits", before: "0", after: "0", delta: "no change", direction: "neutral" },
      { label: "Operational delta", before: "baseline", after: "modified", delta: "see notes", direction: "neutral", note: "Goal-control edits typically affect downstream behaviour incrementally; no direct breach impact projected." },
    ],
    examples: [],
    caveats: [
      "Generic simulation for prototype scope — production simulation would model the specific control change in detail.",
    ],
    recommendation: "approve",
    recommendationNote: "Low-risk goal-control edit. Standard publish flow.",
  };
}
