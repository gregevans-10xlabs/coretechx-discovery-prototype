// ─────────────────────────────────────────────────────────────────────────────
// CoreTechX — Unified Job Dataset
//
// Job numbers, suburbs, trade names, and statuses sourced directly from the
// Prime export (Job_List_example_10xLabs_20260326). Customer names are
// synthetic homeowner initials — no real customer PII is stored here.
// Job values, confidence scores, AI logs, and flags are illustrative of the
// CoreTechX future state (not present in Prime today).
//
// Multi-persona visibility: jobs may appear for multiple personas simultaneously.
// Each persona sees a different slice (Logan: geo/trade; Kerrie: SLA/lifecycle).
// Skill gating: Logan cannot action insurance jobs (skill: "Learning").
// ─────────────────────────────────────────────────────────────────────────────

export type JobType =
  | "Starlink Install"
  | "Harvey Norman Install"
  | "JB Hi-Fi Install"
  | "Insurance Repair"
  | "AHO Construction"
  | "Home Repair";

export type PrimeStatus =
  | "Works Scheduled"
  | "Works Scheduled - Trade Confirmed"
  | "Works In Progress"
  | "Trade Allocation Required"
  | "Reschedule Required"
  | "Report/Quote Sent"
  | "Makesafe In Progress"
  | "Pending Variation"
  | "QA Call Required"
  | "Manual Procurement"
  | "Invoiced"
  | "Works Complete";

export type Priority = "standard" | "urgent" | "jeopardy";

export type GeoStatus =
  | "confirmed_en_route"
  | "gps_active"
  | "not_confirmed"
  | "no_checkin"
  | "unassigned";

export type AILogEntry = {
  time: string;
  actor: "ai" | "human";
  msg: string;
};

export type JobFlag = {
  type: "kpi_timer" | "portal_update_due" | "trade_overdue" | "compliance_gap" | "scope_change" | "no_checkin" | "coverage_gap" | "photo_missing";
  detail: string;
  severity: "high" | "medium" | "low";
};

export type Job = {
  // Identity
  id: string;                    // Real CG number from Prime
  type: JobType;
  primeStatus: PrimeStatus;
  priority: Priority;

  // Location
  suburb: string;
  state: string;
  postcode: string;

  // Parties
  customer: string;              // Synthetic homeowner initial + suburb (e.g. "M. Thornton")
  trade: string;                 // Real trade business name from Prime
  tradeType: string;             // e.g. "Antenna Installer", "Roofer", "Carpenter"
  insurer?: string;              // Insurance jobs only

  // Scheduling
  window: string;                // e.g. "8–10am" or "Mon 14 Apr"
  scheduledDate: string;         // ISO date
  geoStatus: GeoStatus;
  geoTime: string | null;        // Time of last geo event
  minsToWindow: number;          // Negative = window has started

  // Financial
  value: number;                 // Job value in AUD

  // CoreTechX fields (future state — not in Prime today)
  conf: number;                  // 0–1 confidence score
  journeyStep: number;           // 0-indexed step in the job's journey
  flags: JobFlag[];
  aiLog: AILogEntry[];
  actionRequired: string | null; // The ONE thing the human needs to do (null = AI has it)
  actionOptions: string[];       // Buttons to show when actionRequired is set

  // Persona visibility and skill gating
  visibleTo: string[];           // persona IDs that see this job
  actionableBy: string[];        // persona IDs that can take action (skill-gated)
  readOnlyFor: string[];         // persona IDs that see it but cannot act (with reason shown)
  readOnlyReason?: string;       // e.g. "Insurance — escalate to Kerrie (skill: Learning)"

  // Insurance-specific
  insuranceStage?: string;       // e.g. "Makesafe In Progress"
  kpiDeadline?: string;          // e.g. "45 min remaining (Allianz 1h acceptance)"
  nextAction?: string;
  nextTradeDate?: string;

  // Tags overlaid on stages — labels from TAG_VOCABULARY in scenarios.ts.
  // Pre-seeded values are session-initial state; users can add/remove at runtime.
  tags?: string[];

  // Commitments — the underlying probabilistic-contract structure (Discovery OS
  // canonical model). User-facing concept stays "Job"; commitments are exposed
  // for those who want the deeper structure. Optional — only modelled jobs have
  // these; others show a placeholder in the Commitment Anatomy block.
  commitments?: Commitment[];
};

// ─── Commitment model ────────────────────────────────────────────────────────
// Reflects the canonical 5-field anatomy + 9-state lifecycle from the Discovery
// OS Commitment Model Specification (updated 29 Apr 2026).
export type CommitmentState =
  | "specific"      // template-level only (not used at instance layer)
  | "potential"     // applicable but not yet activated
  | "active"        // open and being tracked
  | "in_progress"   // work toward fulfilling has begun
  | "proven"        // fulfilled, proof submitted, pending closure
  | "closed"        // formally closed
  | "breach"        // failed within breach threshold
  | "recovered"     // breached then back on track
  | "voided";       // deliberately removed (process change made redundant)

export type CommitmentClass =
  | "operational" | "commercial" | "customer" | "client_provider"
  | "compliance" | "proof" | "payment" | "exception";

export type CommitmentControl =
  | "human_only" | "human_decision" | "ai_assisted" | "ai_autonomous";

export type CommitmentRel =
  | "depends_on" | "blocks" | "releases" | "triggers"
  | "alternative_to" | "conflicts_with";

export type Commitment = {
  id: string;
  state: CommitmentState;
  klass: CommitmentClass;          // "class" is reserved in some contexts; use klass
  type: "staged" | "floating";
  promise: string;                  // what must become true
  owner: string;                    // who owns it (human-readable)
  ownerTier?: string;               // T1 / T2 / T3 / Ops / AI Agent name
  controlMode: CommitmentControl;
  proofRequired: string;
  breachEarly?: string;             // early warning trigger
  breachHard?: string;              // hard breach trigger
  autonomyProgression?: string;     // e.g. "monitor → recommend (current) → assess → act → approve"
  relationships?: { type: CommitmentRel; target: string }[];
  voidedReason?: string;            // for voided state
};

// ─── Journey step definitions ─────────────────────────────────────────────────
// Per-job-type client labels (kept for reference; AI log strings still use these).
export const STARLINK_JOURNEY  = ["Intake", "Triage", "Qualify", "Match", "Allocate", "Schedule", "Execute", "Complete"];
export const HN_JOURNEY        = ["Intake", "Qualify", "Match", "Allocate", "Schedule", "Execute", "QA", "Complete"];
export const INSURANCE_JOURNEY = ["Assessment", "Scope", "Approved", "Allocated", "In Progress", "Awaiting", "Portal", "Closed"];
export const AHO_JOURNEY       = ["Intake", "Site Survey", "Scope", "Approved", "Allocated", "In Progress", "Inspection", "Complete"];

// ─── 8 Universal Stages — platform backbone (Discovery OS, 7 Apr 2026) ──────
// Every job type maps onto this same backbone. Client-specific labels are
// configurable presentation; the universal stages are the canonical structure.
export const UNIVERSAL_STAGES = [
  "Intake", "Triage", "Qualify", "Plan", "Allocate", "Execute", "Complete", "Settle",
] as const;

// Per-job-type mapping: client step index → universal stage index (0–7).
// Plus the inverse: client labels living under each universal stage (for display).
export type JourneyMap = {
  toUniversal: number[];      // length matches client journey; value = universal stage 0–7
  clientLabels: string[][];   // length 8 (one per universal stage); each entry is client labels at that stage
};

// Starlink: Match→Plan, Schedule co-locates with Allocate, Complete→Complete.
// No client step lives in Settle today (post-job invoice/feedback handled in workflow agents).
export const STARLINK_MAP: JourneyMap = {
  toUniversal:  [0, 1, 2, 3, 4, 4, 5, 6],
  clientLabels: [["Intake"], ["Triage"], ["Qualify"], ["Match"], ["Allocate", "Schedule"], ["Execute"], ["Complete"], []],
};

// Harvey Norman / JB Hi-Fi: no Triage step; QA sits in Complete; "Complete" → Settle.
export const HN_MAP: JourneyMap = {
  toUniversal:  [0, 2, 3, 4, 4, 5, 6, 7],
  clientLabels: [["Intake"], [], ["Qualify"], ["Match"], ["Allocate", "Schedule"], ["Execute"], ["QA"], ["Complete"]],
};

// Insurance: Prime statuses mapped to universal backbone. Synthesized "Received
// from insurer" label completes the visual story for Intake (today's data starts at Assessment).
export const INSURANCE_MAP: JourneyMap = {
  toUniversal:  [1, 2, 3, 4, 5, 5, 6, 7],
  clientLabels: [["Received from insurer"], ["Assessment"], ["Scope"], ["Approved"], ["Allocated"], ["In Progress", "Awaiting"], ["Portal"], ["Closed"]],
};

// AHO Construction: clean 1:1 with universal backbone (its 8 client steps already align).
export const AHO_MAP: JourneyMap = {
  toUniversal:  [0, 1, 2, 3, 4, 5, 6, 7],
  clientLabels: [["Intake"], ["Site Survey"], ["Scope"], ["Approved"], ["Allocated"], ["In Progress"], ["Inspection"], ["Complete"]],
};

// Lookup helper — single source of truth for journey mapping by job type.
export function journeyMapForJob(job: Job): JourneyMap {
  if (job.type === "Insurance Repair") return INSURANCE_MAP;
  if (job.type === "AHO Construction") return AHO_MAP;
  if (job.type === "Harvey Norman Install" || job.type === "JB Hi-Fi Install") return HN_MAP;
  return STARLINK_MAP;
}

// ─── The 22-job dataset ───────────────────────────────────────────────────────

export const JOBS: Job[] = [

  // ── STARLINK JOBS (Logan primary) ────────────────────────────────────────────

  {
    id: "CG35976",
    type: "Starlink Install",
    primeStatus: "Reschedule Required",
    priority: "urgent",
    suburb: "West Pymble", state: "New South Wales", postcode: "2073",
    customer: "R. Thornton",
    trade: "Shane's Handyman Service",
    tradeType: "Antenna Installer",
    window: "9–11am", scheduledDate: "2026-04-09",
    geoStatus: "no_checkin", geoTime: null, minsToWindow: -18,
    value: 359,
    conf: 0.34,
    journeyStep: 5,
    flags: [
      { type: "no_checkin", detail: "Window started 18 minutes ago. No GPS ping. Trade phone going to voicemail.", severity: "high" },
    ],
    aiLog: [
      { time: "06:12", actor: "ai", msg: "Auto-classified as Starlink Install. Standard residential rate card applied." },
      { time: "06:13", actor: "ai", msg: "Auto-qualified — no surcharge. Single-storey residential, clear roof access." },
      { time: "07:15", actor: "ai", msg: "Shane's Handyman Service matched and allocated. Confirmation SMS sent." },
      { time: "07:16", actor: "ai", msg: "Trade confirmed acceptance via Chekku. ETA 8:45am logged." },
      { time: "09:00", actor: "ai", msg: "Window opened. No check-in received. Auto-escalation triggered. Shadow plan pre-computed: Metro Handyman Services Pty Ltd, 22-min ETA." },
      { time: "09:18", actor: "ai", msg: "Second auto-reminder sent to trade. No response. Flagging for human action." },
    ],
    actionRequired: "Activate shadow plan or call trade directly",
    actionOptions: ["Activate shadow plan", "Call Shane's Handyman", "Mark jeopardy"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36003",
    type: "Starlink Install",
    primeStatus: "Trade Allocation Required",
    priority: "urgent",
    suburb: "Fern Bay", state: "New South Wales", postcode: "2295",
    customer: "D. Nguyen",
    trade: "Trade Allocation Required",
    tradeType: "Antenna Installer",
    window: "11am–1pm", scheduledDate: "2026-04-09",
    geoStatus: "unassigned", geoTime: null, minsToWindow: 102,
    value: 359,
    conf: 0.42,
    journeyStep: 4,
    flags: [
      { type: "coverage_gap", detail: "No Chekku-matched trade available in 2295 postcode. Manual procurement required. Nearest available: York Digital Solutions (28km).", severity: "high" },
    ],
    aiLog: [
      { time: "06:05", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "06:06", actor: "ai", msg: "Chekku trade match attempted — 0 available trades within 20km with valid compliance docs." },
      { time: "06:07", actor: "ai", msg: "Extended search to 40km. One candidate: York Digital Solutions (28km, 4.7★). Soft-reserved pending human confirmation." },
      { time: "08:30", actor: "ai", msg: "Soft reservation expiring in 90 min. Customer notified of potential delay. Flagging for human action." },
    ],
    actionRequired: "Confirm York Digital Solutions or find alternate trade",
    actionOptions: ["Confirm York Digital Solutions", "Search alternate trades", "Reschedule job"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36080",
    type: "Starlink Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Macmasters Beach", state: "New South Wales", postcode: "2251",
    customer: "P. Whitfield",
    trade: "Metro Handyman Services Pty Ltd",
    tradeType: "Antenna Installer",
    window: "8–10am", scheduledDate: "2026-04-09",
    geoStatus: "confirmed_en_route", geoTime: "7:41am", minsToWindow: -78,
    value: 359,
    conf: 0.91,
    journeyStep: 6,
    flags: [],
    aiLog: [
      { time: "06:10", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "06:11", actor: "ai", msg: "Auto-qualified — standard residential." },
      { time: "07:02", actor: "ai", msg: "Metro Handyman Services matched and allocated. Confirmation received." },
      { time: "07:41", actor: "ai", msg: "Trade geo-confirmed en route. GPS active. ETA 8:05am — within window." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36057",
    type: "Starlink Install",
    primeStatus: "Works Scheduled",
    priority: "urgent",
    suburb: "Medowie", state: "New South Wales", postcode: "2318",
    customer: "T. Kowalski",
    trade: "Newcastle Tv And Satellite Pty Ltd",
    tradeType: "Antenna Installer",
    window: "9–11am", scheduledDate: "2026-04-09",
    geoStatus: "no_checkin", geoTime: null, minsToWindow: -18,
    value: 359,
    conf: 0.71,
    journeyStep: 5,
    flags: [
      { type: "no_checkin", detail: "Window started 18 minutes ago. Trade has not checked in via Chekku. Last known location: 34 minutes from site (07:52am).", severity: "high" },
    ],
    aiLog: [
      { time: "06:15", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:20", actor: "ai", msg: "Newcastle Tv And Satellite matched and allocated. SMS confirmation received." },
      { time: "07:52", actor: "ai", msg: "Last GPS ping: 34 min from site. Trade likely running late." },
      { time: "09:00", actor: "ai", msg: "Window opened. No check-in. Auto-reminder sent. Shadow plan pre-computed: Fadi Ezzeddine T/A Air Securitel (available, 18km)." },
      { time: "09:18", actor: "ai", msg: "No response to reminder. Confidence dropped to 0.71. Flagging for human review." },
    ],
    actionRequired: "Call trade — likely running late, shadow plan ready if needed",
    actionOptions: ["Call trade", "Activate shadow plan", "Mark jeopardy"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36115",
    type: "Starlink Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Kariong", state: "New South Wales", postcode: "2250",
    customer: "S. Okafor",
    trade: "National Representative Solutions Pty Ltd",
    tradeType: "Antenna Installer",
    window: "10–12pm", scheduledDate: "2026-04-09",
    geoStatus: "confirmed_en_route", geoTime: "8:09am", minsToWindow: 42,
    value: 359,
    conf: 0.94,
    journeyStep: 6,
    flags: [],
    aiLog: [
      { time: "06:08", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:45", actor: "ai", msg: "National Representative Solutions matched and allocated. Confirmation received." },
      { time: "08:09", actor: "ai", msg: "Trade geo-confirmed. GPS active. ETA 9:52am — comfortably within window." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36071",
    type: "Starlink Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Bilpin", state: "New South Wales", postcode: "2758",
    customer: "A. Marchetti",
    trade: "Compulance Computer Services",
    tradeType: "Antenna Installer",
    window: "10–12pm", scheduledDate: "2026-04-09",
    geoStatus: "gps_active", geoTime: "9:22am", minsToWindow: 42,
    value: 359,
    conf: 0.88,
    journeyStep: 6,
    flags: [],
    aiLog: [
      { time: "06:09", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:50", actor: "ai", msg: "Compulance Computer Services matched and allocated. Confirmation received." },
      { time: "09:22", actor: "ai", msg: "GPS active. Trade en route. ETA 9:58am." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG35954",
    type: "Starlink Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Broke", state: "New South Wales", postcode: "2330",
    customer: "J. Papadopoulos",
    trade: "York Digital Solutions",
    tradeType: "Antenna Installer",
    window: "12–2pm", scheduledDate: "2026-04-09",
    geoStatus: "confirmed_en_route", geoTime: "8:03am", minsToWindow: 162,
    value: 359,
    conf: 0.87,
    journeyStep: 5,
    flags: [
      { type: "photo_missing", detail: "York Digital Solutions: 3 prior completed jobs (CG35954, CG36003, CG36015) with 0 photos submitted. Pattern threshold exceeded. Auto-reminder sent 07:01 — no response.", severity: "high" },
    ],
    aiLog: [
      { time: "06:11", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:55", actor: "ai", msg: "York Digital Solutions matched and allocated. Confirmation received." },
      { time: "08:03", actor: "ai", msg: "Trade geo-confirmed. GPS active. ETA 11:45am." },
      { time: "08:05", actor: "ai", msg: "⚠ Pattern flag: York Digital Solutions has 3 completed jobs with no evidence submitted. Auto-reminder sent. Flagging for human follow-up." },
    ],
    actionRequired: "Call York Digital Solutions — evidence non-submission pattern on 3 prior jobs",
    actionOptions: ["Call York Digital Solutions", "Log formal warning", "Reassign future jobs"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36110",
    type: "Starlink Install",
    primeStatus: "Works Scheduled",
    priority: "standard",
    suburb: "Coomba Bay", state: "New South Wales", postcode: "2428",
    customer: "B. Ferreira",
    trade: "Sandbar Electrical Services",
    tradeType: "Antenna Installer",
    window: "1–3pm", scheduledDate: "2026-04-09",
    geoStatus: "not_confirmed", geoTime: null, minsToWindow: 222,
    value: 359,
    conf: 0.79,
    journeyStep: 5,
    flags: [
      { type: "compliance_gap", detail: "Sandbar Electrical Services: public liability renewed but SWMS not yet submitted. Removed from new allocations pending submission. This job was allocated before the gap was detected.", severity: "medium" },
    ],
    aiLog: [
      { time: "06:14", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:40", actor: "ai", msg: "Sandbar Electrical Services matched and allocated. Confirmation received." },
      { time: "08:15", actor: "ai", msg: "⚠ Compliance check: SWMS not on file. Public liability renewed (valid). Trade notified via Chekku. Flagging for coordinator awareness." },
    ],
    actionRequired: "Confirm Sandbar will submit SWMS before attending — or reallocate",
    actionOptions: ["Request SWMS urgently", "Reallocate to alternate trade", "Log and monitor"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
    tags: ["On Hold"],
    commitments: [
      { id: "C-CG36110-01", state: "closed", klass: "operational", type: "staged",
        promise: "Job intake auto-classified as Starlink Install",
        owner: "AI Triage Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "Prime status event captured",
        autonomyProgression: "Autonomous since Jul 2025 · 99.4% accuracy",
      },
      { id: "C-CG36110-02", state: "closed", klass: "operational", type: "staged",
        promise: "Trade matched and allocated within 50km of site",
        owner: "AI Trade Matching Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "Sandbar Electrical accepted via Chekku",
        autonomyProgression: "Autonomous since Sep 2025 · 97.1% accuracy",
        relationships: [{ type: "triggers", target: "SWMS document filed" }],
      },
      { id: "C-CG36110-03", state: "active", klass: "compliance", type: "staged",
        promise: "SWMS document filed before site attendance",
        owner: "Sandbar Electrical Services", ownerTier: "Trade · T1",
        controlMode: "ai_assisted",
        proofRequired: "SWMS PDF uploaded via Chekku portal",
        breachEarly: "T-60 min: confidence drops below 0.6, coordinator notified",
        breachHard: "T+15 min: shadow plan activates, customer notified",
        autonomyProgression: "monitor → recommend (current) → assess → act → approve",
        relationships: [{ type: "blocks", target: "Trade geo check-in at site" }],
      },
      { id: "C-CG36110-04", state: "potential", klass: "operational", type: "staged",
        promise: "Trade geo check-in at job address before window start",
        owner: "Sandbar Electrical Services", ownerTier: "Trade · T1",
        controlMode: "ai_autonomous",
        proofRequired: "Active 'I'm on my way' event + geofence entry at T-30",
        breachHard: "T+15 min: missed-arrival escalation",
        autonomyProgression: "Autonomous · 96% sustained accuracy",
        relationships: [{ type: "depends_on", target: "SWMS document filed" }],
      },
      { id: "C-CG36110-05", state: "potential", klass: "proof", type: "staged",
        promise: "Install evidence pack submitted with photos and signed customer form",
        owner: "Sandbar Electrical Services", ownerTier: "Trade · T1",
        controlMode: "ai_assisted",
        proofRequired: "≥6 photos + customer signature + serial number scan",
        breachEarly: "T+24h: evidence-clean reminder sent",
        relationships: [{ type: "depends_on", target: "Trade geo check-in at site" },
                        { type: "triggers", target: "Invoice generated" }],
      },
      { id: "C-CG36110-06", state: "potential", klass: "payment", type: "staged",
        promise: "Trade payment processed (RCTI generated and remitted)",
        owner: "AI Settlement Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "RCTI sent + payment confirmed",
        relationships: [{ type: "depends_on", target: "Install evidence pack submitted" }],
      },
    ],
  },

  {
    id: "CG35925",
    type: "Starlink Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Pitt Town", state: "New South Wales", postcode: "2756",
    customer: "C. Delacroix",
    trade: "Smart Techie Pty Ltd",
    tradeType: "Antenna Installer",
    window: "2–4pm", scheduledDate: "2026-04-09",
    geoStatus: "confirmed_en_route", geoTime: "7:51am", minsToWindow: 282,
    value: 359,
    conf: 0.91,
    journeyStep: 5,
    flags: [],
    aiLog: [
      { time: "06:10", actor: "ai", msg: "Auto-classified as Starlink Install. Rate card applied." },
      { time: "07:48", actor: "ai", msg: "Smart Techie Pty Ltd matched and allocated. Confirmation received." },
      { time: "07:51", actor: "ai", msg: "Trade geo-confirmed. GPS active. Plenty of time — ETA well within window." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  // ── HARVEY NORMAN / JB HI-FI JOBS ────────────────────────────────────────────

  {
    id: "CG35958",
    type: "Harvey Norman Install",
    primeStatus: "Works Scheduled - Trade Confirmed",
    priority: "standard",
    suburb: "Point Clare", state: "New South Wales", postcode: "2250",
    customer: "M. Stavros",
    trade: "UNITED INFOCOM TECH PTY LTD",
    tradeType: "AV Installer",
    window: "2–4pm", scheduledDate: "2026-04-09",
    geoStatus: "gps_active", geoTime: "1:08pm", minsToWindow: 52,
    value: 280,
    conf: 0.93,
    journeyStep: 6,
    flags: [],
    aiLog: [
      { time: "06:20", actor: "ai", msg: "Auto-classified as Harvey Norman Install. HN rate card applied." },
      { time: "07:55", actor: "ai", msg: "UNITED INFOCOM TECH matched and allocated. Confirmation received." },
      { time: "13:08", actor: "ai", msg: "GPS active. Trade en route. ETA 1:52pm — within window." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
    commitments: [
      { id: "C-CG35958-01", state: "closed", klass: "operational", type: "staged",
        promise: "Harvey Norman order ingested + auto-classified",
        owner: "AI Intake Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "HN portal event captured + rate card applied",
      },
      { id: "C-CG35958-02", state: "closed", klass: "operational", type: "staged",
        promise: "Trade matched within delivery window",
        owner: "AI Trade Matching Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "UNITED INFOCOM TECH accepted via Chekku",
      },
      { id: "C-CG35958-03", state: "closed", klass: "customer", type: "staged",
        promise: "Customer notified of confirmed install window",
        owner: "AI Customer Comms Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "SMS delivered + read receipt OR portal event",
      },
      { id: "C-CG35958-04", state: "in_progress", klass: "operational", type: "staged",
        promise: "Trade attends and completes install in window",
        owner: "UNITED INFOCOM TECH PTY LTD", ownerTier: "Trade · T1",
        controlMode: "ai_autonomous",
        proofRequired: "Geo check-in + completion event",
        breachHard: "T+30 min: missed-arrival escalation",
        autonomyProgression: "Autonomous · 99% on-time rate sustained",
      },
      { id: "C-CG35958-05", state: "potential", klass: "proof", type: "staged",
        promise: "Install QA evidence pack submitted",
        owner: "UNITED INFOCOM TECH PTY LTD", ownerTier: "Trade · T1",
        controlMode: "ai_assisted",
        proofRequired: "≥4 photos + signed customer form + serial scan",
        relationships: [{ type: "depends_on", target: "Trade attends and completes install" },
                        { type: "triggers", target: "HN portal updated" }],
      },
      { id: "C-CG35958-06", state: "potential", klass: "client_provider", type: "staged",
        promise: "HN portal updated with completion event",
        owner: "AI Portal Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "HN portal acknowledgement event received",
      },
      { id: "C-CG35958-07", state: "potential", klass: "payment", type: "staged",
        promise: "Trade paid (RCTI generated and remitted)",
        owner: "AI Settlement Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "RCTI sent + payment confirmed",
      },
    ],
  },

  {
    id: "CG35930",
    type: "Harvey Norman Install",
    primeStatus: "Reschedule Required",
    priority: "urgent",
    suburb: "Woollahra", state: "New South Wales", postcode: "2025",
    customer: "F. Bergmann",
    trade: "Smart Techie Pty Ltd",
    tradeType: "AV Installer",
    window: "10am–12pm", scheduledDate: "2026-04-09",
    geoStatus: "no_checkin", geoTime: null, minsToWindow: -35,
    value: 280,
    conf: 0.38,
    journeyStep: 5,
    flags: [
      { type: "no_checkin", detail: "Window started 35 minutes ago. Smart Techie Pty Ltd unresponsive. Harvey Norman store notified of potential delay.", severity: "high" },
      { type: "trade_overdue", detail: "This is the second no-show from Smart Techie in Woollahra in 14 days. Pattern flag raised.", severity: "medium" },
    ],
    aiLog: [
      { time: "06:22", actor: "ai", msg: "Auto-classified as Harvey Norman Install. HN rate card applied." },
      { time: "07:30", actor: "ai", msg: "Smart Techie Pty Ltd matched and allocated. Confirmation received." },
      { time: "10:00", actor: "ai", msg: "Window opened. No check-in. Auto-reminder sent to trade and Harvey Norman store contact." },
      { time: "10:20", actor: "ai", msg: "No response. Second reminder sent. Shadow plan pre-computed: Remiria Pty Ltd (available, 12km, 4.6★)." },
      { time: "10:35", actor: "ai", msg: "⚠ Pattern flag: second no-show from this trade in Woollahra in 14 days. Escalating to human." },
    ],
    actionRequired: "Activate shadow plan — second no-show from this trade in 14 days",
    actionOptions: ["Activate shadow plan (Remiria Pty Ltd)", "Call Smart Techie", "Log formal warning + reassign"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG35952",
    type: "JB Hi-Fi Install",
    primeStatus: "Trade Allocation Required",
    priority: "standard",
    suburb: "Campbelltown", state: "New South Wales", postcode: "2560",
    customer: "K. Abara",
    trade: "Trade Allocation Required",
    tradeType: "AV Installer",
    window: "Mon 14 Apr", scheduledDate: "2026-04-14",
    geoStatus: "unassigned", geoTime: null, minsToWindow: 7200,
    value: 220,
    conf: 0.74,
    journeyStep: 3,
    flags: [],
    aiLog: [
      { time: "Yesterday", actor: "ai", msg: "Auto-classified as JB Hi-Fi Install. JB rate card applied." },
      { time: "Yesterday", actor: "ai", msg: "3 available trades identified in 2560 postcode. Top match: Modern Lighting & Electrical PTY LTD (4.7★, 98% completion rate)." },
      { time: "Yesterday", actor: "ai", msg: "Soft reservation placed with Modern Lighting & Electrical. Awaiting human confirmation before committing." },
    ],
    actionRequired: "Confirm trade allocation — soft reservation expires today",
    actionOptions: ["Confirm Modern Lighting & Electrical", "Review alternates", "Reschedule"],
    visibleTo: ["logan", "national", "aaron"],
    actionableBy: ["logan", "national", "aaron"],
    readOnlyFor: [],
  },

  // ── INSURANCE REPAIR JOBS (Kerrie primary, Logan read-only) ──────────────────

  {
    id: "CG36078",
    type: "Insurance Repair",
    primeStatus: "Works Scheduled",
    priority: "urgent",
    suburb: "Shailer Park", state: "Queensland", postcode: "4128",
    customer: "L. Vukovic",
    trade: "CJF Electrical Contractors Pty Ltd",
    tradeType: "Electrician",
    insurer: "Allianz Australia Insurance Ltd",
    window: "Today", scheduledDate: "2026-04-09",
    geoStatus: "confirmed_en_route", geoTime: "9:15am", minsToWindow: -45,
    value: 4800,
    conf: 0.42,
    journeyStep: 3,
    insuranceStage: "Scope approved",
    kpiDeadline: "45 min remaining (Allianz 1h virtual assessment window)",
    flags: [
      { type: "kpi_timer", detail: "Allianz 1-hour virtual assessment window opened at 9:00am. 45 minutes remaining. Virtual assessment not yet initiated.", severity: "high" },
    ],
    aiLog: [
      { time: "2 days ago", actor: "ai", msg: "Claim received from Allianz. Auto-classified as electrical repair. Insurer SLA clock started." },
      { time: "Yesterday", actor: "ai", msg: "CJF Electrical Contractors matched and allocated. Compliance docs verified: licence, public liability, SWMS all current." },
      { time: "09:00", actor: "ai", msg: "Virtual assessment window opened. LiveGenic session link generated and sent to trade." },
      { time: "09:15", actor: "ai", msg: "Trade geo-confirmed on site. Assessment not yet initiated. KPI clock running." },
    ],
    actionRequired: "Initiate virtual assessment — 45 min remaining in Allianz KPI window",
    actionOptions: ["Join LiveGenic session", "Delegate to Paul Allen", "Log KPI miss and reschedule"],
    visibleTo: ["kerrie", "national", "aaron", "logan"],
    actionableBy: ["kerrie", "national", "aaron"],
    readOnlyFor: ["logan"],
    readOnlyReason: "Insurance — escalate to Kerrie (your skill level: Learning)",
    nextAction: "Initiate virtual assessment",
    nextTradeDate: "Today",
  },

  {
    id: "CG36011",
    type: "Insurance Repair",
    primeStatus: "Manual Procurement",
    priority: "jeopardy",
    suburb: "Port Macquarie", state: "New South Wales", postcode: "2444",
    customer: "G. Hartmann",
    trade: "Shane's Roofing Pty Ltd",
    tradeType: "Roofer",
    insurer: "Allianz Australia Insurance Ltd",
    window: "Wed 11 Apr", scheduledDate: "2026-04-11",
    geoStatus: "unassigned", geoTime: null, minsToWindow: 2880,
    value: 6200,
    conf: 0.29,
    journeyStep: 2,
    insuranceStage: "Scope approved",
    flags: [
      { type: "compliance_gap", detail: "Shane's Roofing Pty Ltd: only available licensed roofer in 2444 postcode. SWMS not submitted. Roofing = higher-risk trade type. Exception approval required.", severity: "high" },
      { type: "coverage_gap", detail: "90% Chekku no-match rate for roofing trades in Port Macquarie corridor. Manual procurement required for all roofing jobs in this zone.", severity: "high" },
    ],
    aiLog: [
      { time: "3 days ago", actor: "ai", msg: "Claim received from Allianz. Auto-classified as roof repair. Insurer SLA clock started." },
      { time: "3 days ago", actor: "ai", msg: "Chekku trade match: 0 compliant roofers within 50km. Manual procurement required." },
      { time: "2 days ago", actor: "ai", msg: "Shane's Roofing Pty Ltd identified via manual search. Licensed, experienced. SWMS not on file." },
      { time: "Yesterday", actor: "ai", msg: "SWMS request sent to Shane's Roofing via Chekku. No response after 24h." },
      { time: "Today", actor: "ai", msg: "⚠ Compliance exception decision required. Job window in 2 days. Recommendation: do not approve exception for roofing trade without SWMS." },
    ],
    actionRequired: "Compliance exception decision — approve Shane's Roofing without SWMS, or continue manual search",
    actionOptions: ["Continue manual search (recommended)", "Request SWMS urgently from Shane's Roofing", "Escalate to Paul Allen"],
    visibleTo: ["kerrie", "national", "aaron", "logan"],
    actionableBy: ["kerrie", "national", "aaron"],
    readOnlyFor: ["logan"],
    readOnlyReason: "Insurance — escalate to Kerrie (your skill level: Learning)",
    nextAction: "Compliance exception decision",
    nextTradeDate: "Wed 11 Apr",
  },

  {
    id: "CG36069",
    type: "Insurance Repair",
    primeStatus: "Pending Variation",
    priority: "urgent",
    suburb: "Mardi", state: "New South Wales", postcode: "2259",
    customer: "H. Osei",
    trade: "TAYLOR MADE ROOFING AND CARPENTRY",
    tradeType: "Carpenter",
    insurer: "Allianz Australia Insurance Ltd",
    window: "Today", scheduledDate: "2026-04-09",
    geoStatus: "gps_active", geoTime: "9:05am", minsToWindow: -55,
    value: 8400,
    conf: 0.38,
    journeyStep: 4,
    insuranceStage: "Work in progress",
    kpiDeadline: "Scope change +$1,800 — financial hard limit: requires human sign-off",
    flags: [
      { type: "scope_change", detail: "TAYLOR MADE ROOFING AND CARPENTRY identified additional water damage during makesafe. Scope change +$1,800. Hard limit: financial decisions >$1k require human sign-off.", severity: "high" },
    ],
    aiLog: [
      { time: "4 days ago", actor: "ai", msg: "Claim received from Allianz. Auto-classified as roof and carpentry repair. Scope: $6,600." },
      { time: "3 days ago", actor: "ai", msg: "TAYLOR MADE ROOFING AND CARPENTRY allocated. Compliance docs verified." },
      { time: "Yesterday", actor: "ai", msg: "Makesafe completed. Trade on site for repair phase." },
      { time: "09:05", actor: "ai", msg: "Trade submitted scope change: additional water damage to ceiling joists found. Variation: +$1,800 (new total: $8,400)." },
      { time: "09:06", actor: "ai", msg: "⚠ Hard limit triggered: financial decision >$1k. Scope change photos attached. Flagging for human sign-off. Work paused pending approval." },
    ],
    actionRequired: "Review scope change photos and approve or reject +$1,800 variation",
    actionOptions: ["Approve scope change", "Reject and revert scope", "Escalate to Paul Allen"],
    visibleTo: ["kerrie", "national", "aaron", "logan"],
    actionableBy: ["kerrie", "national", "aaron"],
    readOnlyFor: ["logan"],
    readOnlyReason: "Insurance — escalate to Kerrie (your skill level: Learning)",
    nextAction: "Scope change approval",
    nextTradeDate: "Today",
    tags: ["Needs Variation"],
    commitments: [
      { id: "C-CG36069-01", state: "closed", klass: "client_provider", type: "staged",
        promise: "Claim received from Allianz portal and ingested",
        owner: "AI Intake Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "Allianz portal event captured + claim ID assigned",
        autonomyProgression: "Autonomous since Mar 2025 · 97% accuracy",
      },
      { id: "C-CG36069-02", state: "closed", klass: "compliance", type: "staged",
        promise: "Trade compliance verified (license, insurance, SWMS on file)",
        owner: "AI Compliance Agent", ownerTier: "Ops · AI",
        controlMode: "ai_assisted",
        proofRequired: "Trade compliance docs current within 30 days",
      },
      { id: "C-CG36069-03", state: "closed", klass: "operational", type: "staged",
        promise: "Makesafe completed within Allianz 4h SLA",
        owner: "TAYLOR MADE ROOFING AND CARPENTRY", ownerTier: "Trade · T2",
        controlMode: "ai_assisted",
        proofRequired: "Trade reports makesafe complete + 4 photos uploaded",
      },
      { id: "C-CG36069-04", state: "voided", klass: "operational", type: "staged",
        promise: "Standard repair scope executed ($6,600)",
        owner: "TAYLOR MADE ROOFING AND CARPENTRY", ownerTier: "Trade · T2",
        controlMode: "ai_assisted",
        proofRequired: "Repair complete + insurer sign-off",
        voidedReason: "Trade discovered additional water damage during makesafe. Scope replaced by variation commitment (+$1,800). Original commitment voided 09:06 today.",
      },
      { id: "C-CG36069-05", state: "active", klass: "commercial", type: "floating",
        promise: "Variation +$1,800 approved by human (financial >$1k hard limit)",
        owner: "Kerrie Tran", ownerTier: "Insurance Coord · T2",
        controlMode: "human_only",
        proofRequired: "Coordinator approval logged + insurer notified",
        breachEarly: "T+4h: variation pending notification to Allianz",
        breachHard: "T+24h: claim escalation, customer satisfaction risk",
        autonomyProgression: "🔒 Permanent — financial decisions >$1k cannot be delegated to AI",
        relationships: [
          { type: "blocks", target: "Repair work completed" },
          { type: "alternative_to", target: "Standard repair scope (voided)" },
        ],
      },
      { id: "C-CG36069-06", state: "potential", klass: "operational", type: "staged",
        promise: "Repair work completed to approved scope",
        owner: "TAYLOR MADE ROOFING AND CARPENTRY", ownerTier: "Trade · T2",
        controlMode: "ai_assisted",
        proofRequired: "Trade reports complete + final photos + customer sign-off",
        relationships: [{ type: "depends_on", target: "Variation +$1,800 approved" }],
      },
      { id: "C-CG36069-07", state: "potential", klass: "client_provider", type: "staged",
        promise: "Allianz portal updated with completion + invoice",
        owner: "AI Portal Agent", ownerTier: "Ops · AI",
        controlMode: "ai_assisted",
        proofRequired: "Allianz acknowledgement event received",
        relationships: [{ type: "depends_on", target: "Repair work completed" }],
      },
    ],
  },

  {
    id: "CG36183",
    type: "Insurance Repair",
    primeStatus: "Report/Quote Sent",
    priority: "standard",
    suburb: "Pymble", state: "New South Wales", postcode: "2073",
    customer: "N. Blackwood",
    trade: "Waterplus Plumbing",
    tradeType: "Plumber",
    insurer: "Allianz Australia Insurance Ltd",
    window: "Fri 11 Apr", scheduledDate: "2026-04-11",
    geoStatus: "not_confirmed", geoTime: null, minsToWindow: 4320,
    value: 3200,
    conf: 0.68,
    journeyStep: 2,
    insuranceStage: "Scope approved",
    flags: [
      { type: "portal_update_due", detail: "Allianz portal not updated since scope approval 18 hours ago. Portal update SLA: within 4 hours of status change. Currently 14 hours overdue.", severity: "medium" },
    ],
    aiLog: [
      { time: "2 days ago", actor: "ai", msg: "Claim received from Allianz. Auto-classified as plumbing repair." },
      { time: "Yesterday", actor: "ai", msg: "Waterplus Plumbing allocated. Compliance docs verified." },
      { time: "Yesterday", actor: "ai", msg: "Scope approved by Allianz. Portal update required within 4 hours." },
      { time: "Today 06:00", actor: "ai", msg: "⚠ Portal update overdue by 14 hours. Auto-reminder sent to coordinator. Confidence declining." },
    ],
    actionRequired: "Update Allianz portal — scope approval logged 18h ago, portal update 14h overdue",
    actionOptions: ["Update Allianz portal now", "Log note and schedule update", "Delegate to team"],
    visibleTo: ["kerrie", "national", "aaron", "logan"],
    actionableBy: ["kerrie", "national", "aaron"],
    readOnlyFor: ["logan"],
    readOnlyReason: "Insurance — escalate to Kerrie (your skill level: Learning)",
    nextAction: "Portal update",
    nextTradeDate: "Fri 11 Apr",
  },

  {
    id: "CG36100",
    type: "Insurance Repair",
    primeStatus: "Works In Progress",
    priority: "standard",
    suburb: "Shailer Park", state: "Queensland", postcode: "4128",
    customer: "V. Andreou",
    trade: "Estimate Services Group Pty Ltd",
    tradeType: "Builder",
    insurer: "Allianz Australia Insurance Ltd",
    window: "In progress", scheduledDate: "2026-04-09",
    geoStatus: "gps_active", geoTime: "8:30am", minsToWindow: 0,
    value: 12400,
    conf: 0.81,
    journeyStep: 5,
    insuranceStage: "Work in progress",
    flags: [],
    aiLog: [
      { time: "8 days ago", actor: "ai", msg: "Claim received from Allianz. Auto-classified as structural repair." },
      { time: "7 days ago", actor: "ai", msg: "Estimate Services Group allocated. Full compliance docs on file." },
      { time: "5 days ago", actor: "ai", msg: "Virtual assessment completed. Scope: $12,400 approved by Allianz." },
      { time: "3 days ago", actor: "ai", msg: "Work commenced. Progress photos submitted Day 1 and Day 2." },
      { time: "08:30", actor: "ai", msg: "Trade geo-confirmed on site. Day 3 of works. On track for completion Friday." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["kerrie", "national", "aaron"],
    actionableBy: ["kerrie", "national", "aaron"],
    readOnlyFor: [],
    nextAction: "QA call on completion",
    nextTradeDate: "Fri 11 Apr",
  },

  // ── AHO CONSTRUCTION JOBS (Conner primary) ────────────────────────────────────

  {
    id: "CG36385",
    type: "AHO Construction",
    primeStatus: "Works In Progress",
    priority: "standard",
    suburb: "Lethbridge Park", state: "New South Wales", postcode: "2770",
    customer: "AHO Property — Unit 14",
    trade: "AusCorp Energy Pty Ltd",
    tradeType: "Builder",
    window: "This week", scheduledDate: "2026-04-09",
    geoStatus: "gps_active", geoTime: "8:00am", minsToWindow: 0,
    value: 18600,
    conf: 0.83,
    journeyStep: 5,
    flags: [],
    aiLog: [
      { time: "2 weeks ago", actor: "ai", msg: "AHO work order received. Auto-classified as construction. Site survey booked." },
      { time: "10 days ago", actor: "ai", msg: "Site survey completed. Scope approved by AHO." },
      { time: "1 week ago", actor: "ai", msg: "AusCorp Energy Pty Ltd allocated. J1 Air Conditioning allocated for HVAC component." },
      { time: "3 days ago", actor: "ai", msg: "Works commenced. AHO booking confirmed." },
      { time: "08:00", actor: "ai", msg: "Both trades geo-confirmed on site. Day 4 of works. On track." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["conner", "national", "aaron"],
    actionableBy: ["conner", "national", "aaron"],
    readOnlyFor: [],
    commitments: [
      { id: "C-CG36385-01", state: "closed", klass: "client_provider", type: "staged",
        promise: "AHO work order received and intake completed",
        owner: "AI Intake Agent", ownerTier: "Ops · AI",
        controlMode: "ai_autonomous",
        proofRequired: "AHO portal event captured",
      },
      { id: "C-CG36385-02", state: "closed", klass: "operational", type: "staged",
        promise: "Site survey conducted and scope captured",
        owner: "Conner Reilly", ownerTier: "Ops Mgr · T3",
        controlMode: "human_decision",
        proofRequired: "Survey report uploaded + scope document signed",
        autonomyProgression: "🔒 Construction surveys remain human — complex sites require judgment",
      },
      { id: "C-CG36385-03", state: "closed", klass: "client_provider", type: "staged",
        promise: "Scope approved by AHO before works commenced",
        owner: "AHO (client)", ownerTier: "Client · enterprise",
        controlMode: "human_only",
        proofRequired: "AHO sign-off received via portal",
        autonomyProgression: "🔒 Permanent — enterprise client comms cannot be delegated",
      },
      { id: "C-CG36385-04", state: "closed", klass: "operational", type: "staged",
        promise: "Lead trade allocated (builder)",
        owner: "AI Trade Matching Agent", ownerTier: "Ops · AI",
        controlMode: "ai_assisted",
        proofRequired: "AusCorp Energy accepted via Chekku",
        relationships: [{ type: "triggers", target: "Sub-trade allocated (HVAC)" }],
      },
      { id: "C-CG36385-05", state: "closed", klass: "operational", type: "staged",
        promise: "Sub-trade allocated (HVAC)",
        owner: "AI Trade Matching Agent", ownerTier: "Ops · AI",
        controlMode: "ai_assisted",
        proofRequired: "J1 Air Conditioning accepted via Chekku",
      },
      { id: "C-CG36385-06", state: "in_progress", klass: "operational", type: "staged",
        promise: "Build stages completed on schedule (4-week build)",
        owner: "AusCorp Energy Pty Ltd", ownerTier: "Trade · T2 (lead)",
        controlMode: "ai_assisted",
        proofRequired: "Stage sign-offs at frame, lock-up, fix, completion",
        breachEarly: "Day 5 without stage progress: AI flags variance to coordinator",
        breachHard: "Day 7 without stage progress: Conner notified directly",
        autonomyProgression: "AI Assisted — construction is Tier C (Complex), human stays in loop",
        relationships: [{ type: "blocks", target: "QA inspection" }],
      },
      { id: "C-CG36385-07", state: "active", klass: "compliance", type: "staged",
        promise: "WHS observations logged twice weekly during works",
        owner: "Troy Macpherson", ownerTier: "Field Supervisor · T2",
        controlMode: "ai_assisted",
        proofRequired: "WHS observation form completed + photos",
        breachEarly: "T+24h after due: AI reminder sent",
      },
      { id: "C-CG36385-08", state: "potential", klass: "operational", type: "staged",
        promise: "QA inspection passed",
        owner: "Conner Reilly", ownerTier: "Ops Mgr · T3",
        controlMode: "human_decision",
        proofRequired: "Inspection report + customer (AHO) walk-through sign-off",
        relationships: [{ type: "depends_on", target: "Build stages completed on schedule" },
                        { type: "blocks", target: "Final invoice released" }],
      },
      { id: "C-CG36385-09", state: "potential", klass: "payment", type: "staged",
        promise: "Trades paid (RCTI generated for both AusCorp and J1)",
        owner: "AI Settlement Agent", ownerTier: "Ops · AI",
        controlMode: "ai_assisted",
        proofRequired: "RCTIs sent + payments confirmed for both trades",
        relationships: [{ type: "depends_on", target: "QA inspection passed" }],
      },
    ],
  },

  {
    id: "CG36472",
    type: "AHO Construction",
    primeStatus: "QA Call Required",
    priority: "standard",
    suburb: "Minto", state: "New South Wales", postcode: "2566",
    customer: "AHO Property — Unit 7",
    trade: "J1 Air Conditioning",
    tradeType: "HVAC Technician",
    window: "Today", scheduledDate: "2026-04-09",
    geoStatus: "not_confirmed", geoTime: null, minsToWindow: 60,
    value: 14200,
    conf: 0.76,
    journeyStep: 6,
    flags: [
      { type: "trade_overdue", detail: "QA call required before final sign-off. AHO inspector availability: today 2–4pm. Conner to schedule and lead the call.", severity: "medium" },
    ],
    aiLog: [
      { time: "3 weeks ago", actor: "ai", msg: "AHO work order received. Site survey and scope completed." },
      { time: "2 weeks ago", actor: "ai", msg: "J1 Air Conditioning and AusCorp Energy allocated. Works commenced." },
      { time: "Yesterday", actor: "ai", msg: "Works complete. Final photos submitted by both trades. AHO inspection triggered." },
      { time: "Today 07:00", actor: "ai", msg: "AHO inspector available 2–4pm today for QA call. Calendar invite drafted — awaiting Conner confirmation." },
    ],
    actionRequired: "Confirm QA call with AHO inspector — available 2–4pm today",
    actionOptions: ["Confirm 2pm QA call", "Reschedule to tomorrow", "Delegate to team"],
    visibleTo: ["conner", "national", "aaron"],
    actionableBy: ["conner", "national", "aaron"],
    readOnlyFor: [],
  },

  // ── HOME REPAIR JOBS (Blake / general) ───────────────────────────────────────

  {
    id: "CG35949",
    type: "Home Repair",
    primeStatus: "Report/Quote Sent",
    priority: "standard",
    suburb: "Karuah", state: "New South Wales", postcode: "2324",
    customer: "W. Svensson",
    trade: "Soleys Carpentry & Maintenance",
    tradeType: "Carpenter",
    window: "Pending approval", scheduledDate: "2026-04-14",
    geoStatus: "unassigned", geoTime: null, minsToWindow: 7200,
    value: 1800,
    conf: 0.62,
    journeyStep: 2,
    flags: [],
    aiLog: [
      { time: "5 days ago", actor: "ai", msg: "Home repair enquiry received. Auto-classified. Quote requested from Soleys Carpentry." },
      { time: "3 days ago", actor: "ai", msg: "Quote submitted: $1,800. Report sent to customer for approval." },
      { time: "Yesterday", actor: "ai", msg: "Customer has not responded. Auto-follow-up sent. Awaiting approval to proceed." },
    ],
    actionRequired: "Follow up with customer — quote approval pending 5 days",
    actionOptions: ["Call customer", "Resend quote with expiry", "Close enquiry"],
    visibleTo: ["blake", "national", "aaron"],
    actionableBy: ["blake", "national", "aaron"],
    readOnlyFor: [],
  },

  {
    id: "CG36031",
    type: "Home Repair",
    primeStatus: "Invoiced",
    priority: "standard",
    suburb: "Bulahdelah", state: "New South Wales", postcode: "2423",
    customer: "E. Nakamura",
    trade: "TAYLOR MADE ROOFING AND CARPENTRY",
    tradeType: "Carpenter",
    window: "Complete", scheduledDate: "2026-04-07",
    geoStatus: "confirmed_en_route", geoTime: "Completed", minsToWindow: -2880,
    value: 2400,
    conf: 0.95,
    journeyStep: 7,
    flags: [],
    aiLog: [
      { time: "1 week ago", actor: "ai", msg: "Home repair job received. Auto-classified. TAYLOR MADE ROOFING allocated." },
      { time: "5 days ago", actor: "ai", msg: "Works completed. Photos submitted. Customer sign-off received." },
      { time: "3 days ago", actor: "ai", msg: "Invoice generated and submitted: $2,400. Payment terms: 14 days." },
    ],
    actionRequired: null,
    actionOptions: [],
    visibleTo: ["blake", "national", "aaron"],
    actionableBy: ["blake", "national", "aaron"],
    readOnlyFor: [],
  },

];

// ─── Derived views ────────────────────────────────────────────────────────────

/** Jobs visible to a given persona */
export function jobsForPersona(personaId: string): Job[] {
  return JOBS.filter(j => j.visibleTo.includes(personaId));
}

/** Jobs requiring action from a given persona */
export function actionableJobs(personaId: string): Job[] {
  return JOBS.filter(j => j.actionableBy.includes(personaId) && j.actionRequired !== null);
}

/** Jobs that are read-only for a given persona */
export function readOnlyJobs(personaId: string): Job[] {
  return JOBS.filter(j => j.readOnlyFor.includes(personaId));
}

/** Today's scheduled jobs for Logan's cockpit queue */
export function loganQueueJobs(): Job[] {
  return JOBS.filter(j =>
    j.visibleTo.includes("logan") &&
    ["Starlink Install", "Harvey Norman Install", "JB Hi-Fi Install"].includes(j.type)
  ).sort((a, b) => a.minsToWindow - b.minsToWindow);
}

/** Kerrie's insurance job queue */
export function kerrieQueueJobs(): Job[] {
  return JOBS.filter(j => j.type === "Insurance Repair").sort((a, b) => {
    const priority = { jeopardy: 0, urgent: 1, standard: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}
