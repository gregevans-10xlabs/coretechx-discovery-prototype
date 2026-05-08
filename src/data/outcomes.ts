// ─────────────────────────────────────────────────────────────────────────────
// Business Outcomes & Strategic Patterns
//
// Configuration for the executive-tier (PortfolioView) outcomes-led view, per
// Aaron's spec direction: lead with business outcomes (revenue, margin, work
// orders, capacity, KPI/lifecycle/cost/quality, satisfaction, safety,
// compliance) aggregated by department / client / region / business unit,
// with drill-down to supporting data.
//
// Phase markers are honest: "phase_1" outcomes are demonstrable from the
// current data model; "phase_2" outcomes are clearly framed as pending
// production instrumentation rather than faking numbers.
//
// Strategic patterns are distinct from operational patterns (Logan only,
// scoped to one region). They aggregate across departments, clients,
// regions, workflows, and time, surfacing concerns at the executive tier.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Business Outcomes ──────────────────────────────────────────────────────

export type OutcomePhase = "phase_1" | "phase_2";

export type OutcomeCategory =
  | "revenue" | "cashflow" | "work_orders" | "capacity" | "kpi"
  | "margin" | "satisfaction" | "safety" | "compliance";

export type OutcomeBreakdown = {
  label: string;
  value: string;
  pct?: number;        // share of total, 0-100
};

export type OutcomeTrend = {
  direction: "up" | "down" | "flat";
  detail: string;      // human-readable, e.g. "+8% vs last month"
  good: boolean;       // is the trend in a good direction?
};

export type BusinessOutcome = {
  id: string;
  category: OutcomeCategory;
  title: string;
  phase: OutcomePhase;
  primaryValue: string;      // headline number e.g. "$487k"
  primaryLabel: string;      // what is it e.g. "Today"
  secondary?: { label: string; value: string }[];
  trend?: OutcomeTrend;
  breakdownByClient?: OutcomeBreakdown[];
  breakdownByDepartment?: OutcomeBreakdown[];
  breakdownByRegion?: OutcomeBreakdown[];
  // Honest framing for outcomes whose data isn't yet captured
  phase2Note?: string;
  // Optional drill-down hint pointing at jobs that contribute
  drillDown?: string;
};

export const BUSINESS_OUTCOMES: BusinessOutcome[] = [
  {
    id: "O-revenue",
    category: "revenue",
    title: "Revenue",
    phase: "phase_1",
    primaryValue: "$487k",
    primaryLabel: "Today",
    secondary: [
      { label: "MTD",      value: "$3.42M" },
      { label: "Forecast", value: "$4.18M" },
    ],
    trend: { direction: "up", detail: "+6.2% vs last month at this point", good: true },
    breakdownByDepartment: [
      { label: "Installations (Starlink/HN/JB)", value: "$1.84M", pct: 54 },
      { label: "Insurance Repair",                value: "$687k",  pct: 20 },
      { label: "AHO Construction",                value: "$612k",  pct: 18 },
      { label: "Facilities Management",           value: "$280k",  pct: 8  },
    ],
    breakdownByClient: [
      { label: "Starlink",                value: "$1.42M", pct: 42 },
      { label: "Allianz Australia",       value: "$487k",  pct: 14 },
      { label: "Harvey Norman",           value: "$298k",  pct: 9  },
      { label: "AHO",                     value: "$612k",  pct: 18 },
      { label: "JB Hi-Fi",                value: "$118k",  pct: 3  },
      { label: "Suncorp / IAG / others",  value: "$485k",  pct: 14 },
    ],
    breakdownByRegion: [
      { label: "NSW (incl. North East)", value: "$1.92M", pct: 56 },
      { label: "QLD",                     value: "$684k",  pct: 20 },
      { label: "VIC",                     value: "$489k",  pct: 14 },
      { label: "Other",                   value: "$337k",  pct: 10 },
    ],
    drillDown: "Top contributors today: 42 Starlink installs, 8 insurance scopes signed off, 1 AHO milestone.",
  },
  {
    id: "O-cashflow",
    category: "cashflow",
    title: "Cashflow",
    phase: "phase_1",
    primaryValue: "$487k",
    primaryLabel: "Open invoices",
    secondary: [
      { label: "Collected today",  value: "$280" },
      { label: "Invoiced today",    value: "$639" },
      { label: "Overdue (>0d)",     value: "$2,400" },
      { label: "DSO (overall)",     value: "21 days" },
    ],
    trend: { direction: "down", detail: "Allianz DSO 18d trending up vs 14d target", good: false },
    breakdownByClient: [
      { label: "Allianz",      value: "DSO 18d · $4,800 open" },
      { label: "Harvey Norman", value: "DSO 11d · $280 open" },
      { label: "AHO",           value: "DSO 27d · $0 open" },
      { label: "Home Repair",   value: "$2,400 overdue (5d)" },
    ],
    drillDown: "1 invoice overdue (CG36031, $2,400, 5 days). 1 RCTI sync exception (CG36245). 1 variation awaiting Authoriser sign-off ($1,800 — CG36069). Mei is the operational owner; pending changes also visible in Aaron's Awaiting Your Authority.",
  },
  {
    id: "O-work-orders",
    category: "work_orders",
    title: "Work orders completed",
    phase: "phase_1",
    primaryValue: "183",
    primaryLabel: "Today",
    secondary: [
      { label: "MTD",      value: "1,247" },
      { label: "Forecast", value: "1,520" },
    ],
    trend: { direction: "up", detail: "+4% on plan", good: true },
    breakdownByDepartment: [
      { label: "Installations", value: "118", pct: 64 },
      { label: "Insurance",     value: "32",  pct: 17 },
      { label: "Construction",  value: "18",  pct: 10 },
      { label: "FM",            value: "15",  pct: 8  },
    ],
    drillDown: "Settlement-stage close-outs: 47. In-flight at Execute stage: 412.",
  },
  {
    id: "O-margin",
    category: "margin",
    title: "Margin",
    phase: "phase_2",
    primaryValue: "—",
    primaryLabel: "Phase 2",
    phase2Note: "Margin tracking requires per-job cost instrumentation (trade rate, materials, overhead allocation). Production data model design in progress; not captured in current prototype data. Once instrumented, this card will mirror the Revenue structure with margin % by department / client / region and forecast.",
  },
  {
    id: "O-capacity",
    category: "capacity",
    title: "Operational capacity",
    phase: "phase_1",
    primaryValue: "78%",
    primaryLabel: "Today's utilisation",
    secondary: [
      { label: "Trade slots booked",  value: "412 of 528" },
      { label: "Coordinator load",    value: "84%" },
    ],
    trend: { direction: "up", detail: "+6 pts vs last week — Sharon's queue building", good: false },
    breakdownByDepartment: [
      { label: "Installations (trade)",   value: "82%", pct: 82 },
      { label: "Insurance (coordinator)", value: "91%", pct: 91 },
      { label: "Construction (trade)",    value: "67%", pct: 67 },
      { label: "FM (trade)",              value: "74%", pct: 74 },
    ],
    drillDown: "Capacity strain in Insurance (Kerrie's portal backlog). Mid North Coast install corridor under-served (P-039 ongoing).",
  },
  {
    id: "O-kpi",
    category: "kpi",
    title: "KPI / lifecycle performance",
    phase: "phase_1",
    primaryValue: "91%",
    primaryLabel: "On-time completion",
    secondary: [
      { label: "Insurance SLA adherence", value: "97%" },
      { label: "Portal on-time rate",     value: "70%" },
      { label: "Stage progression rate",  value: "94%" },
    ],
    trend: { direction: "down", detail: "Portal rate dragging team score", good: false },
    breakdownByClient: [
      { label: "Allianz",   value: "Portal 68% · SLA 96%" },
      { label: "IAG/NRMA",  value: "Portal 78% · SLA 99%" },
      { label: "Suncorp",   value: "Portal 74% · SLA 97%" },
      { label: "QBE",       value: "Portal 65% · SLA 95%" },
      { label: "Starlink",  value: "On-time 94%" },
      { label: "HN/JB",     value: "On-time 91%" },
    ],
    drillDown: "6 portal updates more than 1h late this week (3× Allianz, 2× QBE, 1× Suncorp). Kerrie's portal blitz this week is the highest-leverage action.",
  },
  {
    id: "O-satisfaction",
    category: "satisfaction",
    title: "Customer satisfaction",
    phase: "phase_1",
    primaryValue: "73%",
    primaryLabel: "30-day NPS rolling",
    secondary: [
      { label: "Survey response rate",     value: "71%" },
      { label: "≥4-star this week",        value: "146 of 184" },
    ],
    trend: { direction: "down", detail: "-3 pts vs prior 30-day window", good: false },
    breakdownByDepartment: [
      { label: "Installations (Starlink)", value: "71%", pct: 71 },
      { label: "Installations (HN/JB)",    value: "82%", pct: 82 },
      { label: "Insurance",                value: "68%", pct: 68 },
      { label: "Construction",             value: "79%", pct: 79 },
    ],
    phase2Note: "Phase 1 baseline from current CSAT pilot (sample of customers actively surveyed). Full coverage requires Cynnch consumer-app rollout — Phase 2.",
    drillDown: "Recent dips track to no-checkin events on Starlink installs. See pattern P-NSW-Sat.",
  },
  {
    id: "O-safety",
    category: "safety",
    title: "Safety",
    phase: "phase_1",
    primaryValue: "1",
    primaryLabel: "Active incident · SafeWork due",
    secondary: [
      { label: "FS audits this month",     value: "26 of 40" },
      { label: "WHS observations logged",  value: "138" },
      { label: "Notifiable injuries (28d)", value: "1 (today)" },
    ],
    trend: { direction: "down", detail: "First incident in 6 weeks — Metro Handyman roof fall, CG36080", good: false },
    breakdownByRegion: [
      { label: "North East NSW", value: "Audit 14/20 (Troy) · 1 flagged · ⚠ active incident" },
      { label: "South NSW",      value: "Audit 12/20 (Kylie) · 0 flagged" },
      { label: "QLD",            value: "Audit (none scheduled)" },
    ],
    drillDown: "Active critical incident — Metro Handyman lead installer fall on roof at CG36080, 11:14 today. Maya managing cascade (Hubspot HS-44892); Troy en route to site; SafeWork NSW 24h notification pending Aaron sign-off (hard limit). 4 of Metro Handyman's other active jobs flagged for re-allocation.",
  },
  {
    id: "O-compliance",
    category: "compliance",
    title: "Compliance",
    phase: "phase_1",
    primaryValue: "96%",
    primaryLabel: "Trade compliance currency",
    secondary: [
      { label: "Active gaps",              value: "11 trades" },
      { label: "Expiring next 30 days",    value: "23" },
      { label: "Compliance exceptions today", value: "2" },
    ],
    trend: { direction: "down", detail: "+40% MoM in NSW SWMS expiry events", good: false },
    breakdownByRegion: [
      { label: "NSW", value: "Compliance 95% · 8 active gaps" },
      { label: "QLD", value: "Compliance 98% · 1 active gap"  },
      { label: "VIC", value: "Compliance 96% · 2 active gaps" },
    ],
    drillDown: "Sandbar Electrical (CG36110) and Shane's Roofing (CG36011) currently in compliance exception. NSW SWMS bulk-renewal campaign recommended (see strategic patterns).",
  },
];

// ─── Strategic Patterns ─────────────────────────────────────────────────────

export type StrategicPatternCategory =
  | "department_kpi" | "client_margin" | "region_quality"
  | "workflow_bottleneck" | "capacity" | "revenue_forecast"
  | "satisfaction" | "compliance" | "lifecycle";

export type StrategicPattern = {
  id: string;
  category: StrategicPatternCategory;
  title: string;
  severity: "low" | "medium" | "high";
  context: string;            // what's happening, in plain English
  scope: string;              // department/client/region/workflow + time
  trend: string;              // direction + duration
  aiRecommendedAction: string;
  supportingData: { metric: string; current: string; historical: string }[];
  // Optional: phase the pattern relies on (e.g. margin patterns require phase 2 instrumentation)
  phase?: OutcomePhase;
};

export const STRATEGIC_PATTERNS: StrategicPattern[] = [
  {
    id: "SP-INS-KPI",
    category: "department_kpi",
    title: "Insurance department KPI gap — portal on-time rate",
    severity: "high",
    context: "Insurance team's portal on-time update rate has fallen to 70% against a 95% target. Three weeks of consistent decline. Six portal updates more than 1 hour late this week, all driving SLA breach risk on Allianz, Suncorp, and QBE work.",
    scope: "Insurance department · National · 3 weeks declining",
    trend: "↓ 5pp over 3 weeks; was 75% mid-March, 78% in February",
    aiRecommendedAction: "Block 2 days for Kerrie's team to clear backlog ('portal blitz'). Tighten the AI Portal Agent's auto-update threshold so fewer updates wait for coordinator review. Recommend 14 days post-action measurement window.",
    supportingData: [
      { metric: "Portal on-time rate",       current: "70%",   historical: "75% (3w ago)" },
      { metric: "Late updates this week",    current: "6",     historical: "2 avg" },
      { metric: "Allianz SLA breaches at risk", current: "3", historical: "0" },
    ],
  },
  {
    id: "SP-MNC-COVERAGE",
    category: "region_quality",
    title: "Mid North Coast coverage gap — already escalated",
    severity: "high",
    context: "Pattern P-039 (Coverage gap, Mid North Coast 2295–2430 corridor) has been active for 5+ days. Three jobs unmatched within standard radius this week required manual procurement. Pattern is currently with you (Aaron) following Logan's escalation.",
    scope: "Region: Mid North Coast NSW · Workflow: Starlink Install · 5+ days active",
    trend: "↑ jeopardy rate +12% above baseline in this corridor",
    aiRecommendedAction: "Approve Logan's procurement request to onboard 1–2 trades for the 2295–2430 corridor. Currently blocked at Aaron tier in deferred queue.",
    supportingData: [
      { metric: "Manual procurements this week", current: "3", historical: "0–1 typical" },
      { metric: "Coverage no-match rate",        current: "60%", historical: "12%" },
      { metric: "Days pattern has been active",  current: "5",  historical: "<2 typical" },
    ],
  },
  {
    id: "SP-AHO-LIFECYCLE",
    category: "lifecycle",
    title: "AHO Construction frame stage drifting",
    severity: "medium",
    context: "AHO Construction jobs at the Frame stage are holding 4–6 days longer than the 90-day baseline. Affects Tier C (Complex) flow downstream — HVAC sub-trades waiting, milestone payments delayed. AusCorp Energy is the lead trade on most affected jobs.",
    scope: "Workflow: AHO Construction · Stage: Frame · 14 days emerging",
    trend: "Avg frame days: 28 → 33; affects 6 of 8 active builds",
    aiRecommendedAction: "Review AusCorp Energy's forward capacity vs. AHO's order pipeline. Consider raising additional builder capacity OR slowing intake. Conner is best placed to assess.",
    supportingData: [
      { metric: "Avg days at Frame stage",      current: "33", historical: "28 baseline" },
      { metric: "Builds affected",              current: "6 of 8", historical: "—" },
      { metric: "HVAC sub-trades waiting",      current: "4", historical: "0–1" },
    ],
  },
  {
    id: "SP-ALLIANZ-MARGIN",
    category: "client_margin",
    title: "Allianz client margin compression",
    severity: "medium",
    context: "Allianz portfolio margin trending down approximately 8% over the last 6 weeks. SLA pressure is increasing effort per claim — virtual assessment KPI tightening + portal compliance + scope variation rate up. Volume is steady but per-job profitability is declining.",
    scope: "Client: Allianz Australia Insurance · 6 weeks · ~62 active jobs",
    trend: "Margin: -8pp · Effort per claim: +14% · Volume: stable",
    aiRecommendedAction: "Review SLA-vs-effort balance with Kerrie. Two paths: renegotiate SLA terms with Allianz at next contract renewal, or absorb effort increase via the portal-update auto-tightening (see SP-INS-KPI). Recommend bundling both for next quarterly review.",
    supportingData: [
      { metric: "Allianz portfolio margin",     current: "−8pp", historical: "baseline 6w ago" },
      { metric: "Avg effort hours / claim",     current: "+14%", historical: "baseline 6w ago" },
      { metric: "Scope variations / claim",     current: "1.8",  historical: "1.4" },
    ],
    phase: "phase_2", // accurate margin numbers require cost instrumentation
  },
  {
    id: "SP-NSW-SAT",
    category: "satisfaction",
    title: "NSW Starlink customer satisfaction declining",
    severity: "medium",
    context: "NSW Starlink CSAT is 71% on the 30-day rolling window, down from 76%. Decline correlates with the no-checkin pattern affecting urban-fringe and Mid North Coast installs. Customer feedback themes: 'trade didn't show', 'wasn't kept informed of delay'.",
    scope: "Workflow: Starlink Install · Region: NSW · 30 days rolling",
    trend: "CSAT: 76% → 71% over 30 days · Theme cluster: late/no-show",
    aiRecommendedAction: "Trade reliability deep-dive on the affected corridors. Bring forward Cynnch proactive-comms feature to reduce 'not informed' theme. Already partially mitigated by automated SMS reminders — measure impact at +14 days.",
    supportingData: [
      { metric: "30d rolling CSAT (NSW Starlink)", current: "71%", historical: "76%" },
      { metric: "No-show events this week",        current: "4",   historical: "1–2 typical" },
      { metric: "'Not informed' feedback theme",   current: "+38%", historical: "30d prior" },
    ],
  },
  {
    id: "SP-NSW-SWMS",
    category: "compliance",
    title: "NSW SWMS expiry trend rising",
    severity: "medium",
    context: "SWMS expiry events across the NSW trade network are up 40% month-on-month. Affects high-risk work types (roofing, electrical) most. Currently 11 active compliance gaps; 23 SWMS documents expiring in next 30 days.",
    scope: "Region: NSW · Document type: SWMS · 30 days emerging",
    trend: "+40% MoM · 23 expiring next 30d · 8 active gaps",
    aiRecommendedAction: "Bulk renewal campaign via Chekku — push notification + 7-day grace period before allocation block. Estimated effort: low (automated). Estimated impact: -75% gap creation rate, frees Sharon's queue from individual chase events.",
    supportingData: [
      { metric: "SWMS expiry events / month", current: "37", historical: "26" },
      { metric: "Active compliance gaps",     current: "11", historical: "6 typical" },
      { metric: "Expiring next 30 days",      current: "23", historical: "—" },
    ],
  },
  {
    id: "SP-INCIDENT-METRO",
    category: "compliance",
    title: "Active trade incident — Metro Handyman, SafeWork notification due",
    severity: "high",
    context: "Metro Handyman lead installer suffered a roof fall at CG36080 at 11:14 today (Hubspot HS-44892, managed by Maya). Cascade is in flight — 4 affected jobs flagged for re-allocation, customer notified via Cynnch, Troy en route to site, Metro Handyman compliance status flipped to paused. SafeWork NSW 24h notifiable-injury commitment is active and requires Aaron sign-off.",
    scope: "Trade: Metro Handyman Services Pty Ltd · Region: Central Coast NSW · 1 day active",
    trend: "First Metro Handyman incident in 18 months · industry-baseline trade-injury rate ~2 per 1000 trade-days",
    aiRecommendedAction: "Sign off SafeWork NSW notification within the 24h window (in your Awaiting Authority panel). Confirm Logan has re-allocation plan for Metro's 4 affected jobs. Hold Metro Handyman in 'paused' status pending Troy's site report and trade investigation outcome.",
    supportingData: [
      { metric: "Active jobs blocked",            current: "4", historical: "—" },
      { metric: "Customer notifications fired",   current: "1 (CG36080)", historical: "—" },
      { metric: "Hours until SafeWork NSW deadline", current: "23h 32m", historical: "24h hard limit" },
    ],
  },
  {
    id: "SP-T1-CAPACITY",
    category: "capacity",
    title: "T1 dispatch capacity strain emerging",
    severity: "low",
    context: "Sharon's queue depth is +30% this week vs. her 90-day baseline. Intake-to-allocation time still within target (14.2 min vs. 15 min) but trending up. Pattern suggests either intake routing rules need tuning OR a second T1 operator should be added before strain becomes a breach risk.",
    scope: "Persona: T1 Intake & Dispatch · 1 week emerging",
    trend: "Queue depth +30% · Intake→allocation: 13 → 14.2 min · Decisions/hr: 11.8 → 11.4",
    aiRecommendedAction: "Two options to evaluate: (1) Tune intake routing rules to push more low-risk intakes to L4 auto-handling — review with Logan. (2) Add a second T1 dispatch operator. Estimated lead time on either: 2 weeks. Decide before queue hits +50%.",
    supportingData: [
      { metric: "Sharon queue depth (avg)",     current: "+30%", historical: "baseline" },
      { metric: "Intake→allocation time",       current: "14.2 min", historical: "13.0 min" },
      { metric: "Decisions resolved per hour",  current: "11.4", historical: "11.8" },
    ],
  },
];
