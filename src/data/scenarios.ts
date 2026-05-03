// ─────────────────────────────────────────────────────────────────────────────
// CoreTechX Mission Control — Scenario Data
//
// Job numbers, suburbs, statuses, and business trade names sourced from
// Prime export (Job_List_example_10xLabs_20260326). Individual person names
// have been replaced with fictional business names. Volume statistics remain
// illustrative (the export is a filtered regional subset).
//
// DO NOT add customer names, addresses, or individual person names to this file.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Confidence helpers ───────────────────────────────────────────────────────
// Per Discovery OS decision (17 Apr 2026): raw confidence scores are not shown to
// ops staff in operator-facing surfaces. Use riskState/riskBadgeClass for cards
// and detail headers. The cc/cb/cl/cbg helpers below remain for executive
// aggregates (avg confidence across many jobs) and dev tooling.
export const cc  = (s: number) => s>=0.95?"text-green-400":s>=0.80?"text-blue-400":s>=0.60?"text-yellow-400":s>=0.40?"text-orange-400":"text-red-400";
export const cb  = (s: number) => s>=0.80?"bg-green-400":s>=0.60?"bg-yellow-400":s>=0.40?"bg-orange-400":"bg-red-400";
export const cl  = (s: number) => s>=0.95?"On track":s>=0.80?"Likely":s>=0.60?"At risk":s>=0.40?"High risk":"Critical";
export const cbg = (s: number) => s>=0.80?"bg-blue-950/60 border-blue-800":s>=0.60?"bg-yellow-950/40 border-yellow-800":s>=0.40?"bg-orange-950/40 border-orange-800":"bg-red-950/60 border-red-800";

// ─── Risk state (operator-facing) ─────────────────────────────────────────────
// Qualitative replacement for the raw confidence score on every operator surface.
export const riskState = (s: number) =>
  s>=0.80 ? "On Track" : s>=0.60 ? "At Risk" : s>=0.40 ? "Critical" : "Jeopardy";

export const riskBadgeClass = (s: number) =>
  s>=0.80 ? "text-green-700 bg-green-50 border-green-200"
: s>=0.60 ? "text-amber-700 bg-amber-50 border-amber-200"
: s>=0.40 ? "text-orange-700 bg-orange-50 border-orange-200"
:           "text-red-700 bg-red-50 border-red-200";
export const fmt = (n: number) => n.toLocaleString();
export const geoLabel = (geo: string, mins: number) => {
  if (geo==="confirmed")  return { label:`Confirmed en route`,                                   dot:"bg-green-400",               text:"text-green-400"  };
  if (geo==="en_route")   return { label:`GPS active`,                                           dot:"bg-blue-400",                text:"text-blue-400"   };
  if (geo==="unassigned") return { label:`No trade assigned`,                                    dot:"bg-gray-500",                text:"text-gray-400"   };
  if (mins > 30)          return { label:`Not yet confirmed — ${mins}m to window`,               dot:"bg-yellow-400",              text:"text-yellow-400" };
  if (mins > 0)           return { label:`No check-in — window in ${mins}m`,                    dot:"bg-orange-400 animate-pulse", text:"text-orange-400" };
  return                         { label:`No check-in — window started ${Math.abs(mins)}m ago`, dot:"bg-red-400 animate-pulse",   text:"text-red-400"    };
};

// ─── Autonomy level metadata ──────────────────────────────────────────────────
export const LM: Record<number | string, { label: string; long: string; desc: string; badge: string; bar: string; ring: string }> = {
  1:{ label:"Level 1", long:"Inform only",    desc:"AI prepares context. Human decides and acts.",                badge:"bg-gray-700 text-gray-300",      bar:"bg-gray-500",   ring:"border-gray-600" },
  2:{ label:"Level 2", long:"Recommend",      desc:"AI recommends with confidence score. Human approves first.", badge:"bg-yellow-900 text-yellow-300",  bar:"bg-yellow-500", ring:"border-yellow-700" },
  3:{ label:"Level 3", long:"Act + Notify",   desc:"AI acts, logs it, notifies human. Reversible within window.",badge:"bg-blue-900 text-blue-300",      bar:"bg-blue-500",   ring:"border-blue-700" },
  4:{ label:"Level 4", long:"Full autonomy",  desc:"AI acts. Human sees exceptions only.",                       badge:"bg-green-900 text-green-300",    bar:"bg-green-500",  ring:"border-green-700" },
  hard:{ label:"🔒 Locked", long:"Permanent limit", desc:"Hard limit set by Aaron (18 Mar 2026). No pathway to higher autonomy regardless of accuracy.", badge:"bg-red-950 text-red-400", bar:"bg-red-800", ring:"border-red-900" },
};

// ─── Prime status labels (real values from Prime export) ─────────────────────
// These are the actual status strings used in Prime. Mapped here for reference.
export const PRIME_STATUSES = [
  "New Enquiry",
  "Work Order Pending Scheduled Date",
  "Reschedule Required",
  "Works Complete",
  "Complete - Customer",
  "Invoiced",
  "Request Cancelled",
  "Report/Quote Sent",
] as const;

// ─── Personas ─────────────────────────────────────────────────────────────────
// Order matters: shown in this sequence in the persona switcher. T1/T2
// frontline operators come first (Shari) so the persona switcher reads bottom-
// up through the org — the people who do the work, then the managers who
// govern it, then the executives.
export const PERSONAS = [
  { id:"shari",    label:"Shari",    title:"T1 Intake & Dispatch",                 region:"North East (NSW/QLD)", types:["starlink","hn","jbhifi"],                                      canConfig:false },
  { id:"logan",    label:"Logan",    title:"Ops Manager — Installation Services", region:"North East (NSW/QLD)", types:["starlink","hn","jbhifi"],                                      canConfig:false },
  { id:"kerrie",   label:"Kerrie",   title:"Insurance Coordinator",                region:"National",             types:["insurance"],                                                   canConfig:false },
  { id:"troy",     label:"Troy",     title:"Field Supervisor",                     region:"North East NSW",       types:[],                                                              canConfig:false },
  { id:"conner",   label:"Conner",   title:"Ops Manager — Construction",           region:"National",             types:["construction"],                                                canConfig:false },
  { id:"blake",    label:"Blake",    title:"Ops Manager — FM",                     region:"National",             types:["fm"],                                                          canConfig:false },
  { id:"national", label:"National", title:"Senior Operations — All Regions",      region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"],      canConfig:false },
  { id:"aaron",    label:"Aaron",    title:"Founder / CEO",                        region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"],      canConfig:true },
];

// ─── Job type health (volume stats illustrative — export is a regional subset) ─
export const JOB_TYPES = [
  // Real Prime label: "Starlink Internet Services Pty Ltd"
  { id:"starlink",    label:"Starlink Install",          primeLabel:"Starlink Internet Services Pty Ltd",    total:2840, onTrack:2791, atRisk:34, critical:8,  needsDecision:7, avgConf:0.93, trend:"stable",    color:"text-blue-400",   bar:"bg-blue-500"   },
  // Real Prime label: "Harvey Norman - Derni Pty Ltd"
  { id:"hn",          label:"Harvey Norman",             primeLabel:"Harvey Norman - Derni Pty Ltd",         total:610,  onTrack:581,  atRisk:21, critical:5,  needsDecision:4, avgConf:0.88, trend:"stable",    color:"text-purple-400", bar:"bg-purple-500" },
  // Real Prime label: "JB Hi-Fi Group Pty Ltd (JB Hi-Fi)"
  { id:"jbhifi",      label:"JB Hi-Fi",                  primeLabel:"JB Hi-Fi Group Pty Ltd (JB Hi-Fi)",     total:390,  onTrack:371,  atRisk:14, critical:3,  needsDecision:2, avgConf:0.89, trend:"stable",    color:"text-pink-400",   bar:"bg-pink-500"   },
  // Real Prime labels: "Home Repair", "Allianz Australia Insurance Ltd"
  { id:"insurance",   label:"Insurance Repair",          primeLabel:"Home Repair / Allianz Australia Insurance Ltd", total:280, onTrack:223, atRisk:41, critical:11, needsDecision:9, avgConf:0.71, trend:"declining", color:"text-orange-400", bar:"bg-orange-500" },
  { id:"construction",label:"Construction / AHO",        primeLabel:"Construction",                           total:520,  onTrack:486,  atRisk:27, critical:6,  needsDecision:5, avgConf:0.83, trend:"stable",    color:"text-cyan-400",   bar:"bg-cyan-500"   },
  { id:"fm",          label:"Facilities Management",     primeLabel:"Total Installs FM",                      total:360,  onTrack:332,  atRisk:19, critical:7,  needsDecision:6, avgConf:0.78, trend:"improving", color:"text-teal-400",   bar:"bg-teal-500"   },
];


// ─── Morning Briefing ─────────────────────────────────────────────────────────
// Uses real CG job numbers where applicable
export const MORNING = [
  // Based on Logan's Facebook story — evidence non-submission pattern
  { severity:"high",   icon:"📷", msg:"York Digital Solutions: CG35954, CG36003, CG36015 — 3 completed Starlink installs, 0 photos submitted (48+ hrs). Auto-reminder sent. No response.", jobRef:"PATTERN:york-digital-photos" },
  // Compliance expiry — real scenario type
  { severity:"high",   icon:"🔒", msg:"Sandbar Electrical Services: public liability renewed but SWMS outstanding. Removed from new allocations pending submission.", jobRef:"CG36110" },
  // Unallocated job approaching deadline
  { severity:"medium", icon:"📋", msg:"CG36003 (Starlink, Fern Bay NSW) scheduled today. No trade allocated — showing as 'Circl Customer Service' in Prime. 26h to window.", jobRef:null },
];

// ─── Decision Queue ───────────────────────────────────────────────────────────
// Real CG numbers, real suburbs, real Prime status labels in descriptions
export const ALL_DECISIONS = [
  {
    id:"CG36037", region:"North East", type:"Starlink Install", client:"Starlink Internet Services Pty Ltd",
    conf:0.61, autonomyLevel:2,
    label:"Reschedule Required — Mundoo QLD. Shadow plan: activate?",
    age:"6h ago", urgency:"Mulgrave Maintenance Services unresponsive since 7am. Prime status: Reschedule Required.",
    rec:"Shadow trade (AMP Electrical Service) was soft-reserved at booking. Activate now — customer window closes at 2pm.",
    options:["Activate shadow plan","Call Mulgrave Maintenance","Cancel & reschedule"],
  },
  {
    id:"CG35976", region:"North East", type:"Starlink Install", client:"Starlink Internet Services Pty Ltd",
    conf:0.34, autonomyLevel:3,
    label:"Shadow plan ready — West Pymble NSW. Trade unresponsive.",
    age:"90m ago", urgency:"Customer notified of delay. Prime status: Reschedule Required.",
    rec:"Metro Handyman Services was soft-reserved at booking on Feb 2. 45-min ETA. Activate.",
    options:["Activate shadow plan","Call original trade","Cancel & reschedule"],
  },
  {
    id:"CG36011", region:"National", type:"Insurance Repair", client:"Allianz Australia Insurance Ltd",
    conf:0.71, autonomyLevel:2,
    label:"Compliance exception — Port Macquarie NSW. Only available trade has SWMS outstanding.",
    age:"3h ago", urgency:"Job window in 2 days. 90% Chekku no-match rate — manual procurement required.",
    rec:"Shane's Roofing Pty Ltd is available and licensed but SWMS not yet submitted. Trade type: roofing (higher risk). Recommend: do not approve exception. Continue manual outreach for compliant trade.",
    options:["Continue manual search","Request SWMS urgently from Shane's Roofing","Escalate to Paul Allen"],
  },
  {
    id:"CG36069", region:"National", type:"Insurance Repair", client:"Allianz Australia Insurance Ltd",
    conf:0.38, autonomyLevel:1,
    label:"Scope change +$1,800 — Mardi NSW. Financial sign-off required.",
    age:"1h ago", urgency:"Hard limit: financial >$1k. Human sign-off required. Josh's calendar item due in 47 minutes.",
    rec:"TAYLOR MADE ROOFING AND CARPENTRY identified additional water damage during makesafe. Review scope photos and approve if valid before authorising next work order.",
    options:["Approve scope change","Reject and revert scope","Escalate to Paul Allen"],
  },
  {
    id:"CG36078", region:"National", type:"Insurance Repair", client:"Allianz Australia Insurance Ltd",
    conf:0.42, autonomyLevel:2,
    label:"Virtual assessment required — Shailer Park QLD. KPI: 45 min remaining.",
    age:"14m ago", urgency:"1-hour acceptance window from Allianz. 45 minutes remaining. Josh unavailable — delegate to Paul.",
    rec:"CJF Electrical Contractors confirmed on-site. LiveGenic session link ready. Delegate to Paul Allen now to meet KPI.",
    options:["Assign to Paul Allen","Join assessment myself","Log KPI miss and reschedule"],
  },
  {
    id:"CG36102", region:"National", type:"FM Emergency", client:"Total Installs",
    conf:0.42, autonomyLevel:2,
    label:"No trades applied — emergency callout, 4h remaining.",
    age:"2h ago", urgency:"SLA breach in 4 hours. Lower Plenty VIC.",
    rec:"S&T AV INSTALLATION PTY LTD available in zone. Above-rate offer approved to +$80. Manual outreach required.",
    options:["Manual outreach","Escalate to Blake","Extend SLA"],
  },
];

// ─── Systemic Patterns ────────────────────────────────────────────────────────
export const ALL_PATTERNS = [
  {
    id:"P-041", region:"North East", severity:"high", icon:"📍",
    title:"Coverage gap — Starlink, NSW Mid North Coast",
    detail:"3 unresponsive trade incidents in Coomba Bay / Forster corridor this week. CG36110, CG35978, CG36015 all showing Reschedule Required. Sandbar Electrical Services and DRC Solar are the only active trades in that zone. Shadow plans activating on consecutive jobs. Targeted recruitment required for 2428–2430 postcode range.",
    type:"Systemic", affected:"3 Commitments", action:"Raise recruitment request",
  },
  {
    id:"P-039", region:"North East", severity:"high", icon:"📷",
    title:"Evidence non-submission — York Digital Solutions",
    detail:"York Digital Solutions completed CG35954 (Broke), CG36003 (Fern Bay), CG36015 (Moruya) — 3 Starlink installs over 4 days with 0 photos submitted. Invoicing blocked on all 3. Auto-reminder sent at 07:01. No response. Pattern threshold exceeded.",
    type:"Quality / Technical", affected:"3 Commitments", action:"Call York Digital Solutions",
  },
  {
    id:"P-037", region:"National", severity:"medium", icon:"📉",
    title:"Insurance confidence declining — Allianz NSW portfolio",
    detail:"Average confidence on Allianz NSW jobs dropped from 0.81 to 0.71 over 10 days. Primary signal: 90% Chekku no-match rate forcing manual procurement on every job. Carpenter and plasterer availability in Newcastle-Hunter corridor is the binding constraint.",
    type:"Capacity", affected:"41 Commitments", action:"Review trade compliance remediation queue",
  },
];

// ─── Commitment metadata (for display) ───────────────────────────────────────
// State / class / control-mode / relationship vocabularies and visual styling
// for the Commitment Anatomy block. Schema lives in jobs.ts; this is the
// presentation layer only. Reflects Discovery OS spec (updated 29 Apr 2026).
export const COMMITMENT_STATE_META: Record<string, { label: string; color: string; dot: string }> = {
  specific:    { label: "Specific",    color: "bg-slate-50 text-slate-500 border-slate-200",   dot: "bg-slate-300" },
  potential:   { label: "Potential",   color: "bg-slate-100 text-slate-600 border-slate-300",  dot: "bg-slate-400" },
  active:      { label: "Active",      color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500"  },
  in_progress: { label: "In Progress", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  proven:      { label: "Proven",      color: "bg-teal-50 text-teal-700 border-teal-200",       dot: "bg-teal-500"  },
  closed:      { label: "Closed",      color: "bg-slate-100 text-slate-500 border-slate-200",   dot: "bg-slate-400" },
  breach:      { label: "Breach",      color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"   },
  recovered:   { label: "Recovered",   color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500" },
  voided:      { label: "Voided",      color: "bg-slate-50 text-slate-400 border-slate-200",    dot: "bg-slate-300" },
};

// Class is a taxonomy, not a state — most classes render in neutral slate so
// the eye reads state and promise first. Only the three classes that signal
// genuine attention (compliance / commercial / exception) keep an accent.
export const COMMITMENT_CLASS_META: Record<string, { label: string; color: string }> = {
  operational:     { label: "Operational",     color: "bg-slate-50 text-slate-600 border-slate-200" },
  commercial:      { label: "Commercial",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  customer:        { label: "Customer",        color: "bg-slate-50 text-slate-600 border-slate-200" },
  client_provider: { label: "Client/Provider", color: "bg-slate-50 text-slate-600 border-slate-200" },
  compliance:      { label: "Compliance",      color: "bg-orange-50 text-orange-700 border-orange-200" },
  proof:           { label: "Proof",           color: "bg-slate-50 text-slate-600 border-slate-200" },
  payment:         { label: "Payment",         color: "bg-slate-50 text-slate-600 border-slate-200" },
  exception:       { label: "Exception",       color: "bg-red-50 text-red-700 border-red-200" },
};

export const COMMITMENT_CONTROL_META: Record<string, { label: string; color: string }> = {
  human_only:     { label: "🔒 Human Only",      color: "text-red-700"    },
  human_decision: { label: "Human Decision",    color: "text-slate-600"  },
  ai_assisted:    { label: "AI Assisted",       color: "text-blue-700"   },
  ai_autonomous:  { label: "AI Autonomous",     color: "text-green-700"  },
};

export const COMMITMENT_REL_META: Record<string, { label: string }> = {
  depends_on:      { label: "Depends on" },
  blocks:          { label: "Blocks" },
  releases:        { label: "Releases" },
  triggers:        { label: "Triggers" },
  alternative_to:  { label: "Alternative to" },
  conflicts_with:  { label: "Conflicts with" },
};

// ─── Tag vocabulary ──────────────────────────────────────────────────────────
// Per CLAUDE.md: "On Hold" and "Needs Variation" are tags overlaid on stages,
// not separate workflow states. Predefined vocabulary — no free text — keeps
// the demo clean and avoids typo drift. Connected to workflow logic, so adding
// new tags is a deliberate platform-level change, not a per-coordinator action.
//
// Two visual styles, not four — colour encodes meaning (caution vs waiting),
// icons differentiate within each meaning.
const TAG_CAUTION = "bg-amber-50 text-amber-700 border-amber-200";
const TAG_WAITING = "bg-slate-100 text-slate-600 border-slate-200";
export const TAG_VOCABULARY = [
  { label: "On Hold",           icon: "⏸",  color: TAG_CAUTION },
  { label: "Needs Variation",   icon: "🔧", color: TAG_CAUTION },
  { label: "Awaiting Customer", icon: "📞", color: TAG_WAITING },
  { label: "Awaiting Parts",    icon: "📦", color: TAG_WAITING },
];

// ─── Field-team deferrals ────────────────────────────────────────────────────
// Shared between Logan's "Deferred by team" exception strip (CockpitView, col 3),
// Troy's "Deferred to Logan" list (FieldSupervisorView), and Aaron/National's
// "Team deferrals" panel (PortfolioView). Single source of truth — same record
// visible at every tier upward (Discovery OS req: roll-up to N+1 and N+2).
//
// tierPath records the chain of personas who can see / are above the original
// deferrer. currentHolder = whose action it is right now. escalations = chain
// of further deferrals applied after the original (each with its own reason).
export type DeferralEscalation = {
  by: string;        // e.g. "Logan Reilly"
  byId: string;      // persona id
  byRole: string;    // e.g. "Ops Manager — Installation Services"
  to: string;        // human-readable next-tier descriptor
  toId: string;      // persona id (currentHolder after this escalation)
  time: string;
  reason: string;
};

export type FieldDeferral = {
  task: string;
  who: string;          // original deferrer (human-readable)
  whoId: string | null; // original deferrer persona id (null for non-persona actors like trades)
  role: string;
  time: string;
  jobId: string;
  urgent: boolean;
  reason: string;
  tierPath: string[];   // ordered persona ids from origin upward; e.g. ["troy","logan","aaron"]
  currentHolder: string;// persona id whose action it is now
  escalations?: DeferralEscalation[];
};

export const INITIAL_FIELD_DEFERRALS: FieldDeferral[] = [
  { task:"Site audit — Penrith Install",        who:"Troy Macpherson", whoId:"troy",  role:"Field Supervisor",            time:"07:42", jobId:"CG-2417931", urgent:true,  reason:"WHS observation flagged — needs Logan sign-off before re-attendance.",                  tierPath:["troy","logan","national","aaron"],  currentHolder:"logan" },
  { task:"Photo evidence upload — Minto",       who:"MJ Electrical",   whoId:null,    role:"Trade",                       time:"08:15", jobId:"CG-2418042", urgent:false, reason:"Trade portal sync error. Coordinator manual upload required.",                          tierPath:["logan","national","aaron"],         currentHolder:"logan" },
  { task:"Customer call-back — Coffs Harbour",  who:"Kylie Tran",      whoId:"kylie", role:"Field Supervisor",            time:"09:03", jobId:"CG-2418109", urgent:false, reason:"Customer requested manager-level discussion on rescheduling.",                          tierPath:["kylie","logan","national","aaron"], currentHolder:"logan" },
  // Shari → Logan: T1 has hit the limit of her authority and bumped a second
  // no-show / formal-warning decision up to the ops manager. Demonstrates the
  // T1-tier chain that exists upstream of the patterns Logan was already
  // handling.
  { task:"Formal warning — Smart Techie 2nd no-show", who:"Shari Patel",     whoId:"shari", role:"T1 Intake & Dispatch",         time:"09:08", jobId:"CG35930",    urgent:true,  reason:"Second no-show in 14 days. Logging a formal warning is beyond my authority — needs Logan's call.",  tierPath:["shari","logan","national","aaron"], currentHolder:"logan" },
  { task:"Coverage gap — Mid North Coast (NSW)",who:"Logan Reilly",    whoId:"logan", role:"Ops Manager — Installations", time:"09:18", jobId:"P-041",      urgent:true,  reason:"Beyond my procurement authority — pattern P-039 persisting 5+ days, 3 jobs unmatched in 2295 postcode. Need approval to onboard 1–2 trades for this corridor.", tierPath:["logan","national","aaron"], currentHolder:"aaron" },
];

// Suggested-reason chips for the Defer/Escalate modal. Pick one to set the
// text quickly; staff can also type a custom reason. Required free-text field
// captures the specifics that feed the AI learning loop (Alex, 17 Apr 2026).
export const DEFERRAL_REASON_CHIPS = [
  "Trade unresponsive",
  "Customer not available",
  "Awaiting parts",
  "Compliance issue",
  "Scope unclear",
  "Beyond my authority",
  "Other",
];

// Suggested-reason chips for Recall — operator pulls a deferred job back from
// senior. Free text is optional here (chip alone often tells the story) since
// the recall has no downstream receiver who needs context.
export const RECALL_REASON_CHIPS = [
  "I have the info I need now",
  "Situation resolved itself",
  "Customer/trade contact resumed",
  "I can handle it after all",
  "Other",
];

// ─── AI Audit / Missed-prioritisation surface ────────────────────────────────
// Per Discovery OS req (17 Apr 2026, High priority): operators must be able to
// see what the system chose NOT to put on their queue, to catch cases where
// the prioritisation model is wrong. Operator flags become labelled training
// examples that feed the per-step CNN models (architecture decision 22 Apr 2026).

export type SilentDecisionCategory =
  | "auto_allocated"
  | "auto_classified"
  | "shadow_activated"
  | "pattern_suppressed"
  | "evidence_accepted"
  | "auto_rescheduled"
  | "rate_card_applied";

export const SILENT_DECISION_CATEGORY_META: Record<SilentDecisionCategory, { label: string; tone: string }> = {
  auto_allocated:     { label: "Auto-allocated",        tone: "bg-slate-100 text-slate-700 border-slate-200" },
  auto_classified:    { label: "Auto-classified",       tone: "bg-slate-100 text-slate-700 border-slate-200" },
  shadow_activated:   { label: "Shadow plan activated", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  pattern_suppressed: { label: "Pattern suppressed",    tone: "bg-amber-50 text-amber-700 border-amber-200" },
  evidence_accepted:  { label: "Evidence accepted",     tone: "bg-slate-100 text-slate-700 border-slate-200" },
  auto_rescheduled:   { label: "Auto-rescheduled",      tone: "bg-amber-50 text-amber-700 border-amber-200" },
  rate_card_applied:  { label: "Rate card applied",     tone: "bg-slate-100 text-slate-700 border-slate-200" },
};

export type SilentDecision = {
  id: string;
  category: SilentDecisionCategory;
  jobId: string;            // or pattern id for pattern_suppressed
  what: string;             // human-readable summary of what the AI did
  reasoning: string;        // why — plain-English explanation
  confidence: number;       // 0–1 at the moment of decision
  time: string;             // relative time, illustrative
  step: string;             // CNN model name (matches MODEL_STATS.step)
  region?: string;          // for persona scoping
  jobType?: string;         // for persona scoping
};

export const SILENT_DECISIONS: SilentDecision[] = [
  // — Logan / Starlink + HN/JBHF —
  { id:"AID-001", category:"auto_allocated",     jobId:"CG36120", what:"Allocated to Sandbar Electrical Services",            reasoning:"Closest available trade (12km), 4.2★ rating, on-time history 96%, in zone for Coomba Bay corridor.",                          confidence:0.97, time:"14m ago", step:"trade_matching",      region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-002", category:"shadow_activated",   jobId:"CG36079", what:"Swapped Metro Handyman → North Coast Comms",          reasoning:"Original trade did not confirm by T-30. Shadow plan activated automatically. Customer SMS sent.",                              confidence:0.71, time:"23m ago", step:"shadow_plan_trigger", region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-003", category:"pattern_suppressed", jobId:"P-061",   what:"Suppressed 4 attendance-lag flags (Wollongong corridor)", reasoning:"Pattern: pre-9am attendance lag typical for 2500–2599 postcodes, self-resolves by 10:00 in 94% of cases over last 8 weeks.", confidence:0.62, time:"1h ago",  step:"pattern_suppression", region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-004", category:"auto_classified",    jobId:"CG36205", what:"Classified as Starlink Install — Standard rate card",  reasoning:"Order matches 99.4% with Starlink standard scope; no scope-change indicators; rate card $310 applied.",                          confidence:0.99, time:"2h ago",  step:"scope_classification",region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-005", category:"auto_rescheduled",   jobId:"CG36088", what:"Window moved 2pm → 4pm (BoM weather alert)",            reasoning:"BoM severe-storm warning issued for Hunter region 2pm–3pm. Window moved 2h to next available slot. Customer notified.",       confidence:0.84, time:"3h ago",  step:"reschedule_trigger",  region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-006", category:"evidence_accepted",  jobId:"CG36019", what:"Install evidence pack auto-validated",                  reasoning:"6 photos passed quality check, customer signature present, serial number scanned and matches order. Invoice released.",        confidence:0.96, time:"4h ago",  step:"evidence_validation", region:"North East NSW/QLD", jobType:"Starlink Install" },
  { id:"AID-007", category:"auto_allocated",     jobId:"CG35968", what:"Allocated to UNITED INFOCOM TECH (Harvey Norman)",      reasoning:"Trade has 99% on-time record across 47 HN jobs in last 90 days. Within delivery window. No flags.",                              confidence:0.98, time:"5h ago",  step:"trade_matching",      region:"North East NSW/QLD", jobType:"Harvey Norman Install" },
  { id:"AID-008", category:"rate_card_applied",  jobId:"CG36190", what:"JB Hi-Fi commercial rate applied ($382)",               reasoning:"Order tagged commercial in JB portal. Commercial rate card applied (vs standard $310).",                                          confidence:0.93, time:"6h ago",  step:"rate_card_application",region:"North East NSW/QLD", jobType:"JB Hi-Fi Install" },
  { id:"AID-009", category:"pattern_suppressed", jobId:"P-058",   what:"Suppressed 'no GPS ping' flag (Mid North Coast)",       reasoning:"Pattern: GPS dead zones around Coomba Bay / Pacific Palms — confirmed via 12-month history. Trade reliability remains high.",   confidence:0.55, time:"7h ago",  step:"pattern_suppression", region:"North East NSW/QLD", jobType:"Starlink Install" },

  // — Kerrie / Insurance —
  { id:"AID-010", category:"auto_classified",    jobId:"CG36277", what:"Allianz claim classified as Roof Repair (Tier ST)",    reasoning:"Description matches roof-leak template 0.94. Photos confirm visible damage. Standard estimating workflow applied.",            confidence:0.94, time:"30m ago", step:"insurance_scope",     region:"National",          jobType:"Insurance Repair" },
  { id:"AID-011", category:"auto_allocated",     jobId:"CG36192", what:"Allocated to TAYLOR MADE for Mardi roofing job",        reasoning:"Licensed roofer in zone. Allianz-approved. SWMS current. 4.1★ quality, no recent complaints.",                                  confidence:0.89, time:"45m ago", step:"trade_matching",      region:"National",          jobType:"Insurance Repair" },
  { id:"AID-012", category:"pattern_suppressed", jobId:"P-052",   what:"Suppressed 'Suncorp portal sync delay' alert",           reasoning:"Pattern: Suncorp portal sync delays of 4–6 hours typical post-7pm AEDT. Self-corrects overnight in 98% of cases.",                confidence:0.58, time:"2h ago",  step:"pattern_suppression", region:"National",          jobType:"Insurance Repair" },
  { id:"AID-013", category:"evidence_accepted",  jobId:"CG36088", what:"Makesafe photos accepted (NRMA portal updated)",        reasoning:"4 photos passed quality check. Trade GPS confirms on-site duration 1h 12m. NRMA portal acknowledged.",                            confidence:0.91, time:"3h ago",  step:"evidence_validation", region:"National",          jobType:"Insurance Repair" },

  // — Conner / Construction —
  { id:"AID-014", category:"auto_allocated",     jobId:"CG36412", what:"AHO Tweed Heads — AusCorp + J1 Air Conditioning",       reasoning:"Both trades selected together: AusCorp lead (builder), J1 sub (HVAC). Past pairing 4 sites this quarter, 100% on-schedule.",    confidence:0.86, time:"1h ago",  step:"multi_trade_match",   region:"National",          jobType:"AHO Construction" },
  { id:"AID-015", category:"auto_classified",    jobId:"CG36418", what:"AHO Mt Druitt — classified Tier C (Complex)",            reasoning:"Multi-trade scope, 4-week build, custom kitchen — all complexity indicators present. Tier C workflow applied.",                  confidence:0.92, time:"4h ago",  step:"complexity_tiering",  region:"National",          jobType:"AHO Construction" },
  { id:"AID-016", category:"pattern_suppressed", jobId:"P-064",   what:"Suppressed 3 'low-comms during fix stage' flags",        reasoning:"Pattern: construction sites typically reduce daily comms during fix stage (no progress photos). Self-resolves at lock-up.",        confidence:0.66, time:"5h ago",  step:"pattern_suppression", region:"National",          jobType:"AHO Construction" },

  // — Blake / FM —
  { id:"AID-017", category:"auto_allocated",     jobId:"CG36322", what:"Reactive callout → nearest plumber (Sydney metro)",      reasoning:"Highest-rated available trade within 8km, all certifications current, accepted via Chekku in 4m.",                                confidence:0.88, time:"55m ago", step:"trade_matching",      region:"National",          jobType:"Facilities Management" },
  { id:"AID-018", category:"pattern_suppressed", jobId:"P-067",   what:"Suppressed 'after-hours request' flag (low severity)",   reasoning:"Pattern: after-hours requests for non-emergency lighting requests typical for office strata, batched to next-day handling.",      confidence:0.64, time:"6h ago",  step:"pattern_suppression", region:"National",          jobType:"Facilities Management" },
  { id:"AID-019", category:"auto_classified",    jobId:"CG36340", what:"Preventive maintenance — quarterly schedule applied",   reasoning:"Site contract active, quarterly cycle due, no special instructions. Standard PM workflow auto-instantiated.",                    confidence:0.99, time:"7h ago",  step:"scope_classification",region:"National",          jobType:"Facilities Management" },

  // — Cross-region / Aaron-level —
  { id:"AID-020", category:"shadow_activated",   jobId:"CG36254", what:"Shadow activated — original trade missed window",       reasoning:"3-strike rule: trade missed last 3 confirmation pings. Shadow plan engaged automatically. Customer notified.",                  confidence:0.74, time:"40m ago", step:"shadow_plan_trigger", region:"National",          jobType:"Starlink Install" },
  { id:"AID-021", category:"rate_card_applied",  jobId:"CG36167", what:"Insurance rate card (Suncorp Tier 2) applied",          reasoning:"Suncorp claim, ≤$2,500 scope. Tier 2 rate applied per insurer agreement schedule.",                                              confidence:0.96, time:"3h ago",  step:"rate_card_application",region:"National",         jobType:"Insurance Repair" },
];

export type ModelFeedback = {
  id: string;
  decisionId: string;
  flaggedById: string;
  flaggedByName: string;
  flaggedAt: string;
  // true = "Flag for review" (negative label); false = "Looks right" (positive)
  isFlag: boolean;
  flagCategory?: AIAuditFlagCategory;
  reason?: string;
};

export type AIAuditFlagCategory =
  | "wrong_action"
  | "should_have_escalated"
  | "confidence_overstated"
  | "pattern_misapplied"
  | "wrong_trade_match"
  | "other";

export const AI_AUDIT_FLAG_CHIPS: { id: AIAuditFlagCategory; label: string }[] = [
  { id: "wrong_action",            label: "Wrong action" },
  { id: "should_have_escalated",   label: "Should have escalated" },
  { id: "confidence_overstated",   label: "Confidence overstated" },
  { id: "pattern_misapplied",      label: "Pattern misapplied" },
  { id: "wrong_trade_match",       label: "Wrong trade match" },
  { id: "other",                   label: "Other" },
];

// ─── Per-step CNN model stats (illustrative — drives Training Feedback panel) ─
// In production these come from the per-step CNN training pipeline. For the
// prototype, hardcoded numbers show the loop structure: flags → labels → retrain
// → accuracy delta. Architecture per Discovery OS decision 22 Apr 2026.
export type ModelStats = {
  step: string;          // matches SilentDecision.step
  label: string;         // human-readable
  accuracy: number;      // 0–1, current
  trend: "up" | "down" | "stable";
  delta?: number;        // pt change since last retrain (e.g. +0.7)
  lastRetrainDays: number | null; // null = "queued for retrain"
  flagsLast7d: number;
  retrainsLast30d: number;
};

export const MODEL_STATS: ModelStats[] = [
  { step:"trade_matching",        label:"Trade matching CNN",         accuracy:0.978, trend:"up",     delta:0.7,  lastRetrainDays:2,    flagsLast7d:3,  retrainsLast30d:4 },
  { step:"scope_classification",  label:"Scope classification CNN",   accuracy:0.994, trend:"stable",             lastRetrainDays:11,   flagsLast7d:1,  retrainsLast30d:1 },
  { step:"shadow_plan_trigger",   label:"Shadow plan trigger CNN",    accuracy:0.912, trend:"down",   delta:-0.4, lastRetrainDays:null, flagsLast7d:8,  retrainsLast30d:3 },
  { step:"pattern_suppression",   label:"Pattern suppression LLM",    accuracy:0.886, trend:"stable",             lastRetrainDays:null, flagsLast7d:12, retrainsLast30d:0 },
  { step:"evidence_validation",   label:"Evidence validation CNN",    accuracy:0.965, trend:"up",     delta:0.3,  lastRetrainDays:5,    flagsLast7d:2,  retrainsLast30d:2 },
  { step:"rate_card_application", label:"Rate card application CNN",  accuracy:0.991, trend:"stable",             lastRetrainDays:18,   flagsLast7d:0,  retrainsLast30d:1 },
  { step:"reschedule_trigger",    label:"Reschedule trigger CNN",     accuracy:0.943, trend:"up",     delta:0.5,  lastRetrainDays:7,    flagsLast7d:1,  retrainsLast30d:1 },
  { step:"insurance_scope",       label:"Insurance scope CNN",        accuracy:0.928, trend:"stable",             lastRetrainDays:9,    flagsLast7d:2,  retrainsLast30d:2 },
  { step:"multi_trade_match",     label:"Multi-trade matching CNN",   accuracy:0.852, trend:"up",     delta:1.1,  lastRetrainDays:14,   flagsLast7d:1,  retrainsLast30d:1 },
  { step:"complexity_tiering",    label:"Complexity tier CNN",        accuracy:0.971, trend:"stable",             lastRetrainDays:21,   flagsLast7d:0,  retrainsLast30d:1 },
];

// ─── Supervisor data ──────────────────────────────────────────────────────────
// Suburbs from real Prime data (Logan's NSW/QLD region)
export const SUPERVISORS = [
  {
    id:"troy", name:"Troy Macpherson", region:"North East NSW", mobile:true,
    safety:{ done:8, target:20 }, quality:{ done:6, target:20 },
    currentJob:{ id:"CG36080", trade:"Metro Handyman Services Pty Ltd", suburb:"Macmasters Beach" },
    lastInspection:"2 days ago",
    avoidanceFlag:"Troy has not inspected Metro Handyman Services in 45 days despite 1 complaint. Review whether this is scheduling or avoidance.",
    inspectionQueue:[
      { trade:"York Digital Solutions",              rating:3.1, lastInspected:"Never",  jobsSince:28, complaints:2, priority:"critical", reason:"3 jobs with 0 photos submitted. 28 jobs uninspected." },
      { trade:"Metro Handyman Services Pty Ltd",     rating:3.6, lastInspected:"45 days",jobsSince:14, complaints:1, priority:"high",     reason:"No-show risk. Unresponsive this morning on CG35976." },
      { trade:"Sandbar Electrical Services",         rating:3.9, lastInspected:"31 days",jobsSince:9,  complaints:0, priority:"high",     reason:"SWMS outstanding. New to Mid North Coast zone." },
      { trade:"Compulance Computer Services",        rating:4.6, lastInspected:"22 days",jobsSince:7,  complaints:0, priority:"medium",   reason:"Good performer. Routine cycle overdue." },
      { trade:"National Representative Solutions",  rating:4.9, lastInspected:"8 days", jobsSince:12, complaints:0, priority:"low",      reason:"Excellent record. Inspect when convenient." },
    ],
  },
  {
    id:"kylie", name:"Kylie Tran", region:"QLD + Northern Rivers", mobile:true,
    safety:{ done:14, target:20 }, quality:{ done:11, target:20 },
    currentJob:null,
    lastInspection:"Today",
    avoidanceFlag:null,
    inspectionQueue:[
      { trade:"Tender It",          rating:4.8, lastInspected:"12 days",jobsSince:8,  complaints:0, priority:"medium", reason:"Routine cycle." },
      { trade:"QLD Home Tech Pty Ltd", rating:4.7, lastInspected:"18 days",jobsSince:6, complaints:0, priority:"medium", reason:"Routine cycle." },
    ],
  },
];

// ─── Staff Performance (Aaron hard requirement: gamified KPI visibility) ──────
// weight: fraction of overall score this KPI contributes (all weights sum to 1.0 per persona)
// baseline: for lowerIsBetter KPIs where target=0 — the value at which attainment reaches 0
export type KPI = { label: string; current: number; target: number; unit: string; trend: string; weight: number; lowerIsBetter?: boolean; baseline?: number };
export type Badge = { icon: string; label: string; desc: string; earned: boolean };
export type LeaderboardEntry = { label: string; score: number; isYou?: boolean };
export type TeamMember = { name: string; role: string; tier: "Platinum"|"Gold"|"Silver"|"Bronze"; score: number; trend: "up"|"down"|"stable"; concern: string };
export type ImprovementAction = {
  task: string;                 // Imperative action verb: "Log 4 safety inspections"
  detail: string;               // Progress context with specific numbers
  kpi: string;                  // Must match a KPI label exactly — used to compute score impact
  projectedAttainment: number;  // Attainment (0–1) after completing this action
  badge: string | null;
  urgent: boolean;
};

export const STAFF_PERFORMANCE: {
  persona: string; name: string; role: string;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  rank: number | null; rankTotal: number | null; rankNoun: string | null;
  streak: number;
  weeklyTrend: "up" | "down" | "stable";
  trendDetail: string;
  highlight: string;
  weeklyChallenge: string;
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  kpis: KPI[];
  improvementActions: ImprovementAction[];
  nextRankGap: string | null;
  teamMembers?: TeamMember[];
  improvements?: string[];
}[] = [
  {
    persona:"shari", name:"Shari", role:"T1 Intake & Dispatch",
    tier:"Gold",
    rank:3, rankTotal:8, rankNoun:"T1 dispatch operators",
    streak:2,
    weeklyTrend:"up", trendDetail:"Up from 5th — intake-to-allocation time dropping",
    highlight:"High decision throughput this week — 11.4/hr average against a 12/hr target. Photo-evidence chase backlog is the one drag; 17 of the 20 chases logged this week have closed, but the remaining 3 are aging.",
    weeklyChallenge:"⚡ Sub-15 Sprint — hold intake-to-allocation under 15 minutes for the rest of the week to unlock Dispatch Hawk.",
    badges:[
      { icon:"⚡", label:"Quick Hands",      desc:"Resolved 11.4 allocation decisions per hour this week — well above the 10/hr threshold for the badge. Top-quartile pace for T1 dispatch.",                                  earned:true  },
      { icon:"🔁", label:"Routing Right",    desc:"94% of escalations to Logan accepted as appropriate first time. No bounce-backs this week — Shari is correctly identifying what needs T2/T3 judgment.",                  earned:true  },
      { icon:"📞", label:"Callback Closer",  desc:"28 of 30 customer callbacks closed within 30 min this week. Two open are awaiting customer return-call, which is outside her control.",                                   earned:true  },
      { icon:"📷", label:"Evidence Hawk",    desc:"Close 25 photo-evidence chases in a single week. Currently at 17 — closing 8 more before Friday unlocks this. The York Digital pattern is consuming most of the queue.", earned:false },
      { icon:"🦅", label:"Dispatch Hawk",    desc:"Hold intake-to-allocation time under 15 min across a full week. Currently averaging 14.2 min for 4 days running — three more days to lock in the badge.",                  earned:false },
    ],
    leaderboard:[
      { label:"—",   score:91 },
      { label:"—",   score:87 },
      { label:"You", score:84, isYou:true },
      { label:"—",   score:80 },
    ],
    kpis:[
      { label:"Decisions resolved per hour",       current:11.4, target:12,  unit:"/hr",         trend:"up",     weight:0.30 },
      { label:"Intake → allocation time (avg)",    current:14.2, target:15,  unit:"min",         trend:"up",     weight:0.25, lowerIsBetter:true },
      { label:"Photo-evidence chases closed",      current:17,   target:25,  unit:"this week",   trend:"behind", weight:0.20 },
      { label:"Callbacks closed <30 min",          current:93,   target:90,  unit:"%",           trend:"stable", weight:0.15 },
      { label:"Escalation accuracy (1st-time accept)", current:94, target:90, unit:"%",          trend:"stable", weight:0.10 },
    ],
    nextRankGap: "4% to break into top 2 — closing the photo-evidence chase backlog gets there",
    improvementActions:[
      { task:"Close 8 outstanding photo-evidence chases this week",   detail:"17 of 25 closed — 8 remaining, mostly York Digital Solutions. Highest-leverage single action available before Friday.",                       kpi:"Photo-evidence chases closed", projectedAttainment:1.0,  badge:"Evidence Hawk", urgent:true  },
      { task:"Hold intake-to-allocation under 15 min for 3 more days", detail:"Averaging 14.2 min for 4 days running. Three more days at this pace unlocks the Dispatch Hawk badge and the second-highest weight KPI.",       kpi:"Intake → allocation time (avg)", projectedAttainment:1.0,  badge:"Dispatch Hawk", urgent:false },
      { task:"Review the 3 callbacks awaiting customer return-call",  detail:"Both customers haven't called back within 24 hours. Outbound second attempt would either close them or convert them to deferral with reason.", kpi:"Callbacks closed <30 min",      projectedAttainment:0.97, badge:null,            urgent:false },
    ],
  },
  {
    persona:"logan", name:"Logan", role:"Ops Manager — Installation Services",
    tier:"Gold",
    rank:2, rankTotal:6, rankNoun:"installation coordinators",
    streak:3,
    weeklyTrend:"up", trendDetail:"Up from 4th last week",
    highlight:"Decision resolution and evidence review are strong. Inspection targets are the only thing holding this score back — 14 days left to close the gap.",
    weeklyChallenge:"🏗️ Inspection Sprint — log 8 safety inspections before Friday to unlock the Inspector badge.",
    badges:[
      { icon:"⚡", label:"First Responder",   desc:"Cleared every jeopardy job within 30 min of it escalating this week. No jeopardy went unactioned on Logan's watch.",                                           earned:true  },
      { icon:"📷", label:"Evidence Clean",    desc:"47 of 50 evidence packs reviewed this week — 94% rate. Invoicing unblocked and trades paid on time.",                                                          earned:true  },
      { icon:"🔥", label:"Three-Week Climb",  desc:"Performance score trending up for 3 consecutive weeks. Moved from #4 to #2 in that time. Only 8 points behind the leader.",                             earned:true  },
      { icon:"🔍", label:"Safety Inspector",  desc:"Complete 20 trade safety inspections with your field supervisors in a calendar month. Currently at 8/20 — 12 inspections needed in the next 14 days.",         earned:false },
      { icon:"🏆", label:"Top of Board",      desc:"Reach #1 among the 6 installation coordinators. Currently 8 points behind the leader — one strong week of decisions and inspections would close the gap.", earned:false },
    ],
    leaderboard:[
      { label:"—", score:96 },
      { label:"You", score:88, isYou:true },
      { label:"—", score:85 },
    ],
    kpis:[
      { label:"Jobs closed on time",         current:94, target:95, unit:"%",          trend:"stable", weight:0.35 },
      { label:"Decisions resolved",          current:18, target:20, unit:"this week",  trend:"up",     weight:0.30 },
      { label:"Evidence reviewed",           current:47, target:50, unit:"this week",  trend:"up",     weight:0.20 },
      { label:"Trade inspections (Safety)",  current:8,  target:20, unit:"this month", trend:"behind", weight:0.08 },
      { label:"Trade inspections (Quality)", current:6,  target:20, unit:"this month", trend:"behind", weight:0.07 },
    ],
    nextRankGap: "10% to reach #1 — complete inspection targets and decision queue",
    improvementActions:[
      { task:"Resolve the 2 remaining decisions in queue",       detail:"18 of 20 decisions actioned this week — 2 left to lock in the KPI. Highest-weight item you can close today.", kpi:"Decisions resolved",          projectedAttainment:1.0, badge:null,             urgent:true  },
      { task:"Log 4 safety inspections with field supervisors",  detail:"8 of 20 this month — 12 remaining. Friday is the best window before month-end pressure compounds.",            kpi:"Trade inspections (Safety)",  projectedAttainment:0.60,badge:"Safety Inspector", urgent:true  },
      { task:"Log 4 quality inspections with field supervisors", detail:"6 of 20 this month — 14 remaining. Both inspection KPIs are below 50% of target with 14 days left.",           kpi:"Trade inspections (Quality)", projectedAttainment:0.50,badge:"Safety Inspector", urgent:true  },
    ],
  },
  {
    persona:"kerrie", name:"Kerrie", role:"Insurance Coordinator",
    tier:"Silver",
    rank:4, rankTotal:5, rankNoun:"insurance coordinators",
    streak:2,
    weeklyTrend:"stable", trendDetail:"Holding 4th — portal rate dragging the score",
    highlight:"Portal on-time rate at 72% — well below the 95% target. Six late updates this week are driving SLA breach risk across Allianz jobs. This is the primary drag on performance.",
    weeklyChallenge:"⚡ Portal Blitz — log 5 portal updates within 15 min of status change this week to unlock Portal Hawk.",
    badges:[
      { icon:"📅", label:"SLA Guardian",  desc:"Zero missed SLA deadlines across Allianz, IAG, Suncorp and QBE this week. Every acceptance, makesafe and repair window met.",                                        earned:true  },
      { icon:"🤝", label:"Trade Ready",   desc:"Every active insurance job has a confirmed, compliant trade allocated. No unassigned jobs sitting on the books.",                                                     earned:true  },
      { icon:"⚡", label:"Portal Hawk",   desc:"Log 95%+ of insurer portal updates within 15 min of a status change. Currently at 72% — 6 updates this week were more than 1 hour late, triggering breach risk.", earned:false },
      { icon:"📜", label:"Cert Machine",  desc:"File 12+ completion certificates in a single week. Currently at 7 — 5 more before Friday would unlock this.",                                                        earned:false },
      { icon:"🏆", label:"Top 3",         desc:"Break into the top 3 of the 5 insurance coordinators. Currently #4 — closing the portal rate gap alone would close most of the distance.",                           earned:false },
    ],
    leaderboard:[
      { label:"—", score:89 },
      { label:"—", score:82 },
      { label:"You", score:74, isYou:true },
      { label:"—", score:65 },
    ],
    kpis:[
      { label:"Portal updates on time", current:72, target:95, unit:"%",         trend:"down",   weight:0.40 },
      { label:"Work orders scheduled",  current:12, target:15, unit:"this week", trend:"stable", weight:0.25 },
      { label:"Completion certs filed", current:7,  target:12, unit:"this week", trend:"stable", weight:0.20 },
      { label:"Scope changes reviewed", current:4,  target:5,  unit:"this week", trend:"stable", weight:0.15 },
    ],
    nextRankGap: "8% to break into top 3 — close the portal rate gap first",
    improvementActions:[
      { task:"Log 5 portal updates within 15 min of status change", detail:"On-time rate is 72% — target 95%. Getting 5 more timely updates this week moves the rate to ~82%, the single biggest score lever you have.", kpi:"Portal updates on time", projectedAttainment:82/95, badge:"Portal Hawk",  urgent:true  },
      { task:"File 3 more completion certificates before Friday",   detail:"7 of 12 filed this week — 3 more hits the KPI target and unlocks the Cert Machine badge.",                                                   kpi:"Completion certs filed", projectedAttainment:10/12, badge:"Cert Machine", urgent:false },
      { task:"Schedule the 3 remaining work orders",                detail:"12 of 15 scheduled — the last 3 are straightforward Allianz jobs already scoped and ready to assign.",                                        kpi:"Work orders scheduled",  projectedAttainment:1.0,   badge:null,          urgent:false },
    ],
  },
  {
    persona:"conner", name:"Conner", role:"Ops Manager — Construction",
    tier:"Gold",
    rank:2, rankTotal:4, rankNoun:"construction managers",
    streak:4,
    weeklyTrend:"stable", trendDetail:"Solid — holding 2nd for 4 weeks running",
    highlight:"Safety audits are spotless and the highest-weight KPI (build stages) has room to close. Confirming the last trade and progressing 2 build stages this week would push you into Platinum.",
    weeklyChallenge:"🎯 Perfect Build — hit all 4 KPI targets this week and clear the build stage gap for your first tier promotion.",
    badges:[
      { icon:"🏗️", label:"Stage Keeper",  desc:"12 of 15 active AHO build stages on schedule this month. Sites are progressing and milestone payments are being triggered on time.",                               earned:true  },
      { icon:"🛡️", label:"Audit Clean",   desc:"8 of 8 scheduled safety audits completed this week — zero misses. WHS compliance is spotless across all active construction sites.",                               earned:true  },
      { icon:"⚡", label:"Site Ready",     desc:"11 of 12 trades confirmed and on-site on time this week. Sub-contractors showing up when they're supposed to, before the window opens.",                           earned:true  },
      { icon:"🎯", label:"Perfect Build",  desc:"Hit all 4 KPI targets in the same week. Currently at 2 of 4 — confirm the last trade and close 2 defects this week to unlock this for the first time.",          earned:false },
      { icon:"🏆", label:"#1 Builder",     desc:"Reach #1 among the 4 construction managers. Currently 5% behind the leader — a Perfect Build week would close the gap and trigger a tier promotion.",             earned:false },
    ],
    leaderboard:[
      { label:"—", score:93 },
      { label:"You", score:88, isYou:true },
      { label:"—", score:82 },
    ],
    kpis:[
      { label:"Build stages on schedule", current:12, target:15, unit:"this month", trend:"stable", weight:0.35 },
      { label:"Safety audits completed",  current:8,  target:8,  unit:"this week",  trend:"stable", weight:0.30 },
      { label:"Trades confirmed on-site", current:11, target:12, unit:"this week",  trend:"stable", weight:0.20 },
      { label:"Defects resolved <48h",    current:8,  target:10, unit:"this week",  trend:"up",     weight:0.15 },
    ],
    nextRankGap: "5% to reach #1 — confirm the last trade and progress build stages",
    improvementActions:[
      { task:"Confirm the 1 remaining trade for this week",    detail:"11 of 12 trades confirmed on-site. Closing this is the second-highest weight KPI and the fastest win available today.",                         kpi:"Trades confirmed on-site", projectedAttainment:1.0,   badge:"Perfect Build", urgent:true  },
      { task:"Resolve 2 outstanding defects within 48h",       detail:"8 of 10 defects resolved — 2 flagged to Penrith sites. Closing both hits the weekly target and contributes to a Perfect Build week.",           kpi:"Defects resolved <48h",    projectedAttainment:1.0,   badge:"Perfect Build", urgent:false },
      { task:"Progress 2 AHO build stages to next milestone",  detail:"12 of 15 stages on schedule this month — 2 more milestone completions pushes the highest-weight KPI from 80% to 93% of target.",               kpi:"Build stages on schedule",  projectedAttainment:0.933, badge:null,          urgent:false },
    ],
  },
  {
    persona:"blake", name:"Blake", role:"Ops Manager — Facilities Management",
    tier:"Platinum",
    rank:1, rankTotal:4, rankNoun:"FM managers",
    streak:5,
    weeklyTrend:"up", trendDetail:"Holding #1 for 5 consecutive weeks",
    highlight:"Outstanding week — preventive maintenance is spotless. Two quick actions complete this week's KPI set and put the Unbeatable badge in reach.",
    weeklyChallenge:"👑 Fortnight Reign — hold #1 again next week to unlock the Unbeatable badge.",
    badges:[
      { icon:"🔑", label:"FM Leader",     desc:"Reached and held #1 rank among FM managers. Five consecutive weeks at the top — no one else in the group has come close.",                                     earned:true  },
      { icon:"⚡", label:"First In",      desc:"2.1h average response time — the fastest in the FM manager group. The benchmark every other manager is measured against.",                                      earned:true  },
      { icon:"✅", label:"Full House",    desc:"23 of 23 preventive maintenance tasks completed on time this week. Nothing slipped, nothing deferred — a perfect maintenance week.",                            earned:true  },
      { icon:"👑", label:"Unbeatable",    desc:"Hold #1 rank for 6 consecutive weeks without dropping. Currently at 5 weeks — one more strong week and this badge is yours.",                                  earned:false },
      { icon:"🌟", label:"Legend",        desc:"Sustain 96%+ performance across all KPIs for a full calendar month. Currently at 94% — closing the reactive and compliance KPIs this week puts this in range.", earned:false },
    ],
    leaderboard:[
      { label:"You", score:94, isYou:true },
      { label:"—",   score:87 },
      { label:"—",   score:79 },
    ],
    kpis:[
      { label:"Preventive maintenance tasks", current:23, target:23, unit:"this week", trend:"stable", weight:0.35 },
      { label:"Reactive jobs resolved",        current:17, target:18, unit:"this week", trend:"stable", weight:0.25 },
      { label:"Subcontractor compliance",      current:31, target:32, unit:"this week", trend:"stable", weight:0.25 },
      { label:"Avg response time",             current:2.1,target:4,  unit:"h",         trend:"stable", weight:0.15, lowerIsBetter:true },
    ],
    nextRankGap: null,
    improvementActions:[
      { task:"Resolve the 1 remaining reactive job this week",          detail:"17 of 18 resolved — a Karuah commercial callout. Closing it locks the reactive KPI and moves the score.",            kpi:"Reactive jobs resolved",   projectedAttainment:1.0,  badge:null,         urgent:false },
      { task:"Log the 1 remaining subcontractor compliance check",      detail:"31 of 32 checks logged — 1 subcontractor pending verification. Quick task, clears the KPI and helps the Legend run.",kpi:"Subcontractor compliance", projectedAttainment:1.0,  badge:"Legend",     urgent:false },
      { task:"Hold response time below 2.5h for the rest of the week", detail:"Currently averaging 2.1h — best in the group by far. Maintaining this through Friday supports the Unbeatable badge.", kpi:"Avg response time",        projectedAttainment:0.74, badge:"Unbeatable", urgent:false },
    ],
  },
  {
    persona:"national", name:"National View", role:"Senior Ops — All Regions",
    tier:"Gold",
    rank:null, rankTotal:null, rankNoun:null,
    streak:1,
    weeklyTrend:"down", trendDetail:"Portal on-time rate dragging team score — insurance backlog driving it",
    highlight:"Portal on-time rate sits at 70% — well below the 95% target. Three SLA breaches this week are all traceable to late portal updates in the insurance stream. This is the primary drag on the team score.",
    weeklyChallenge:"✅ Portal Blitz — coordinate with Kerrie to move team portal on-time rate from 70% to 82% and recover the SLA position.",
    badges:[
      { icon:"🌐", label:"Network",       desc:"All regions actively reporting — full visibility across Starlink, Harvey Norman, Insurance, Construction, and FM.",           earned:true  },
      { icon:"📊", label:"Data Rich",     desc:"100% KPI coverage across all active teams. Every coordinator's performance is tracked and visible in real time.",            earned:true  },
      { icon:"✅", label:"SLA Clean",     desc:"Achieve 100% SLA adherence across all regions for a full week. Currently at 97% — close the portal latency gap to get there.", earned:false },
      { icon:"🚀", label:"Peak Form",     desc:"Team portal on-time rate hits 95%+ for a full week. Currently at 70% — targeted action on the insurance stream gets there.", earned:false },
      { icon:"🏆", label:"Top Quartile",  desc:"Outperform the industry benchmark on all four team KPIs for a calendar month. The portal rate is the only gap right now.",   earned:false },
    ],
    leaderboard:[
      { label:"Blake (FM)",   score:94 },
      { label:"Conner",       score:88 },
      { label:"Logan",        score:86 },
      { label:"Tom H.",       score:87 },
      { label:"Kerrie",       score:74 },
    ],
    kpis:[
      { label:"Team decisions resolved", current:87, target:100, unit:"%",         trend:"stable", weight:0.25 },
      { label:"Jobs closed on time",     current:91, target:95,  unit:"%",         trend:"down",   weight:0.20 },
      { label:"SLA adherence",           current:97, target:100, unit:"%",         trend:"stable", weight:0.15 },
      { label:"Portal on-time rate",     current:70, target:95,  unit:"%",         trend:"down",   weight:0.40 },
    ],
    nextRankGap: null,
    improvementActions:[
      { task:"Coordinate with Kerrie to clear 5 overdue portal updates", detail:"Portal on-time rate is 70% — 40% of team score. Moving it to 82% this week is the highest-leverage single action available.", kpi:"Portal on-time rate",     projectedAttainment:0.863, badge:"SLA Clean",  urgent:true  },
      { task:"Assign the 13 unresolved team decisions to coordinators",  detail:"87 of 100 decisions resolved this week. Routing the remaining 13 to the right skill sets closes the weekly team KPI.",          kpi:"Team decisions resolved", projectedAttainment:0.92,  badge:null,         urgent:true  },
      { task:"Block an inspection week for Logan — 26 audits in 14 days",detail:"Logan is at 40% of his monthly safety inspection target. A focused 3-day block prevents month-end scramble and SLA risk.",       kpi:"SLA adherence",           projectedAttainment:1.0,   badge:"Peak Form",  urgent:false },
    ],
  },
  {
    persona:"aaron", name:"Aaron", role:"Founder / CEO",
    tier:"Gold",
    rank:null, rankTotal:null, rankNoun:null,
    streak:2,
    weeklyTrend:"stable", trendDetail:"Team average holding — portal on-time rate is the key drag",
    highlight:"Team portal on-time rate sits at 70% — the single biggest drag on the team's performance score. Addressing Kerrie's capacity is the clearest path to lifting the team to Platinum.",
    weeklyChallenge:"🏆 Team Platinum Push — drive portal on-time rate to 82% and close the decision queue this week to break the Platinum threshold.",
    badges:[
      { icon:"🌐", label:"Network",        desc:"All coordinators actively reporting — full KPI visibility across all roles and regions.",                                                  earned:true  },
      { icon:"📊", label:"Full Visibility", desc:"100% KPI coverage across all active coordinators. Every team member's performance is visible in real time.",                             earned:true  },
      { icon:"✅", label:"SLA Clean",       desc:"Team achieves 100% SLA adherence for a full week. Currently at 97% — the portal latency gap is the only remaining obstacle.",           earned:false },
      { icon:"🚀", label:"Peak Form",       desc:"All coordinators above 85% performance score in the same week. Currently Blake, Conner, Logan are there — Kerrie needs portal rate up.", earned:false },
      { icon:"🏆", label:"Dream Team",      desc:"Team average score reaches Platinum tier (90%+). Currently at Gold — closing Kerrie's portal rate is the primary lever.",               earned:false },
    ],
    leaderboard:[],
    kpis:[
      { label:"Team decisions resolved", current:87, target:100, unit:"%",         trend:"stable", weight:0.25 },
      { label:"Jobs closed on time",     current:91, target:95,  unit:"%",         trend:"down",   weight:0.20 },
      { label:"SLA adherence",           current:97, target:100, unit:"%",         trend:"stable", weight:0.15 },
      { label:"Portal on-time rate",     current:70, target:95,  unit:"%",         trend:"down",   weight:0.40 },
    ],
    nextRankGap: null,
    improvementActions:[
      { task:"Redistribute 15 jobs from Kerrie's queue to cut portal latency", detail:"Kerrie carries 80 concurrent jobs — 15% above capacity. Redistribution moves portal on-time rate from 70% to ~82%. Highest-leverage action on the board.", kpi:"Portal on-time rate",     projectedAttainment:0.863, badge:"SLA Clean",  urgent:true  },
      { task:"Block an inspection week for Logan — 26 audits in 14 days",      detail:"Logan is at 40% of his monthly safety inspection target. A focused 3-day block prevents month-end scramble and protects SLA adherence.",                   kpi:"SLA adherence",           projectedAttainment:1.0,   badge:"Peak Form",  urgent:true  },
      { task:"Assign the 13 unresolved team decisions to the right people",    detail:"87 of 100 decisions resolved this week. Routing the remaining 13 to the right skill sets closes the weekly team KPI.",                                     kpi:"Team decisions resolved", projectedAttainment:1.0,   badge:"Dream Team", urgent:false },
    ],
    teamMembers:[
      { name:"Blake",  role:"FM Ops Manager",           tier:"Platinum", score:94, trend:"up",     concern:"Holding #1 — on track for Unbeatable badge. No action needed." },
      { name:"Logan",  role:"Installation Ops Manager", tier:"Gold",     score:86, trend:"up",     concern:"Inspection targets at 40% of monthly goal — 26 inspections needed in 14 days." },
      { name:"Conner", role:"Construction Ops Manager", tier:"Gold",     score:88, trend:"stable", concern:"One trade confirmation gap this week — minor drag, otherwise consistent." },
      { name:"Kerrie", role:"Insurance Coordinator",    tier:"Silver",   score:74, trend:"stable", concern:"Portal update latency is the primary SLA risk — 3 Allianz jobs flagged this week." },
    ],
    improvements:[
      "Kerrie's portal on-time rate (70%) is the team's primary score drag and the main SLA risk — redistributing 10–15 of her 80 concurrent jobs would move the rate to ~82%.",
      "Logan needs 26 safety inspections in 14 days — block a focused inspection week now before month-end pressure compounds.",
      "The team is 5% from Platinum average — a coordinated week targeting Kerrie's portal rate and the decision queue would likely get there.",
    ],
  },
];

// ─── Trade Network (Aaron hard requirement: trade performance visible to trades)
export const TRADE_NETWORK = {
  tiers: [
    { tier:"Platinum", count:312,  pct:8,  color:"text-purple-300", bg:"bg-purple-900/40 border-purple-700", desc:"Top 8% — priority job allocation, fastest payment terms, dedicated support." },
    { tier:"Gold",     count:1240, pct:31, color:"text-yellow-300", bg:"bg-yellow-900/30 border-yellow-800", desc:"Strong performers — preferred allocation, standard payment terms." },
    { tier:"Silver",   count:1890, pct:47, color:"text-gray-300",   bg:"bg-gray-700/40 border-gray-600",     desc:"Active and reliable — standard allocation." },
    { tier:"Bronze",   count:558,  pct:14, color:"text-orange-400", bg:"bg-orange-900/20 border-orange-800", desc:"New or below target — limited allocation until score improves." },
  ],
  // Sample trade profile card — shows what a trade sees in Chekku
  sampleProfile: {
    trade:"Smart Techie Pty Ltd",
    tier:"Gold",
    score:0.82,
    factors:[
      { label:"On-time rate",    value:"88%",  target:"85%", status:"above",  weight:30 },
      { label:"Completion rate", value:"97%",  target:"95%", status:"above",  weight:25 },
      { label:"Quality score",   value:"4.3★", target:"4.0★",status:"above",  weight:20 },
      { label:"Cancellation rate",value:"2%", target:"<5%", status:"above",  weight:15 },
      { label:"Responsiveness",  value:"72%",  target:"80%", status:"below",  weight:10 },
    ],
    improvementPath:"Your responsiveness rate is 72% — improving to 80% would move you to Platinum tier and increase your weekly job allocation by approximately 40%.",
    jobsThisMonth:34,
    earningsThisMonth:"$10,166",
    rankInRegion:"14th of 89 active trades in NSW",
  },
};

// ─── Kerrie's Coordinator View (80 concurrent insurance jobs — 12 shown) ──────
// Uses real CG numbers from Allianz / Home Repair rows in the Prime export
export type JobFlag = { type: "kpi_timer" | "portal_update_due" | "trade_overdue"; detail: string };
export type InsuranceJob = {
  id: string;
  customer: string;
  suburb: string;
  insurer: string;
  stage: "Assessment booked" | "Scope approved" | "Trades allocated" | "Work in progress" | "Awaiting completion" | "Pending portal update";
  nextAction: string;
  nextTradeDate: string | null;
  flags: JobFlag[];
};

export const KERRIE_JOBS: InsuranceJob[] = [
  { id:"CG36078",  insurer:"Allianz",    customer:"R. Chen",    suburb:"Shailer Park QLD",   stage:"Assessment booked",   nextTradeDate:"Today",     nextAction:"Virtual assessment — KPI timer: 45 min remaining",                flags:[{type:"kpi_timer",         detail:"Virtual assessment KPI expires in 45 minutes"}] },
  { id:"CG36031",  insurer:"Home Repair",customer:"M. Park",    suburb:"Bulahdelah NSW",     stage:"Awaiting completion", nextTradeDate:null,         nextAction:"Completion cert not received — trade finished Friday",             flags:[{type:"kpi_timer",         detail:"Completion cert overdue — insurer SLA at risk"}] },
  { id:"CG36011",  insurer:"Allianz",    customer:"D. Hartley", suburb:"Port Macquarie NSW", stage:"Trades allocated",    nextTradeDate:"Tomorrow",  nextAction:"No compliant trade confirmed — manual outreach required today",     flags:[{type:"trade_overdue",     detail:"No compliant trade found for confirmed start date"}] },
  { id:"CG36077B", insurer:"Home Repair",customer:"F. Walsh",   suburb:"Morwell VIC",        stage:"Scope approved",      nextTradeDate:null,         nextAction:"Awaiting scope approval response — 3 days past SLA",               flags:[{type:"trade_overdue",     detail:"Scope response 3 days overdue — insurer follow-up needed"}] },
  { id:"CG35974",  insurer:"Home Repair",customer:"L. Evans",   suburb:"Valla NSW",          stage:"Pending portal update",nextTradeDate:null,         nextAction:"Upload completion docs to insurer portal — due today",             flags:[{type:"portal_update_due", detail:"Completion documents ready — portal upload overdue"}] },
  { id:"CG36029",  insurer:"Home Repair",customer:"S. White",   suburb:"Bulahdelah NSW",     stage:"Work in progress",    nextTradeDate:"Ongoing",   nextAction:"Carpenter Day 3 of 5 — check progress photos uploaded",            flags:[{type:"portal_update_due", detail:"Daily photo evidence due in portal by 5pm"}] },
  { id:"CG36069",  insurer:"Allianz",    customer:"P. Morrow",  suburb:"Mardi NSW",          stage:"Scope approved",      nextTradeDate:"Today",     nextAction:"Scope change +$1,800 awaiting sign-off — trades on hold",          flags:[] },
  { id:"CG35949",  insurer:"Home Repair",customer:"T. Nguyen",  suburb:"Karuah NSW",         stage:"Scope approved",      nextTradeDate:null,         nextAction:"Awaiting insurer approval of submitted quote",                     flags:[] },
  { id:"CG36078B", insurer:"Allianz",    customer:"A. Singh",   suburb:"Robina QLD",         stage:"Scope approved",      nextTradeDate:"Next week",  nextAction:"Makesafe complete — book carpenter and plasterer for scope works",  flags:[] },
  { id:"CG36091B", insurer:"Allianz",    customer:"G. Russo",   suburb:"Werribee VIC",       stage:"Trades allocated",    nextTradeDate:"28 Mar",    nextAction:"Confirm trade start date with customer — call before 11am",        flags:[] },
  { id:"CG36102B", insurer:"Allianz",    customer:"H. Nielsen", suburb:"Hornsby Heights NSW", stage:"Work in progress",   nextTradeDate:"Ongoing",   nextAction:"Plasterer Day 2 on site — electrician confirmed for 30 Mar",       flags:[] },
  { id:"CG36025",  insurer:"Home Repair",customer:"B. Torres",  suburb:"Coramba NSW",        stage:"Scope approved",      nextTradeDate:null,         nextAction:"Quote in reviewer queue — follow up if no response by 3pm",        flags:[] },
];

// ─── Autonomy Ladder ──────────────────────────────────────────────────────────
export const AUTONOMY = [
  { category:"Simple installs (Starlink, Harvey Norman, JB Hi-Fi)", level:4, hard:false, note:"Triage → match → schedule → notify → invoice → feedback. Zero human touch on healthy Commitments." },
  { category:"Trade matching — standard pool",                       level:3, hard:false, note:"AI selects, assigns, notifies. Human can override within 2 hours. 97% accuracy over 30 days." },
  { category:"Shadow plan activation",                               level:3, hard:false, note:"AI detects confidence drop, activates shadow trade, notifies customer. Human receives log entry." },
  { category:"Evidence non-submission detection",                    level:3, hard:false, note:"AI detects missing photos, suspends trade from new allocations, sends reminder. Decision queued if no response." },
  { category:"Out-of-zone / above-rate trade approval",              level:2, hard:false, note:"AI recommends with cost and cascade risk analysis. Human approves before action is taken." },
  { category:"No-trades-apply manual escalation",                    level:2, hard:false, note:"AI identifies candidate trades and drafts manual offer. Human reviews and contacts trade." },
  { category:"Scope change mid-job (under $1,000)",                  level:2, hard:false, note:"AI flags and summarises scope change. Human approves if within $1,000 threshold." },
  { category:"Financial decisions above $1,000",                     level:1, hard:true,  note:"Permanent hard limit (Aaron, 18 Mar 2026). AI provides full context. Human decides and signs off." },
  { category:"WHS / Safety / Compliance",                            level:1, hard:true,  note:"Permanent hard limit. No pathway to higher autonomy regardless of AI accuracy." },
  { category:"Legal or regulatory matters",                          level:1, hard:true,  note:"Permanent hard limit." },
  { category:"Enterprise client communications (Starlink, Allianz)", level:1, hard:true,  note:"AI agents must not communicate directly with enterprise clients. (Aaron, 18 Mar 2026)" },
  { category:"Police, fire, or rescue involvement",                  level:1, hard:true,  note:"Permanent hard limit." },
];

// ─── Workflow Templates ───────────────────────────────────────────────────────
export const WORKFLOW_TEMPLATES = [
  {
    id:"starlink", label:"Starlink Install", client:"Starlink Internet Services Pty Ltd", icon:"📡",
    description:"Single trade, fixed scope, fixed price. Prime status flow: New Enquiry → Work Order Pending Scheduled Date → Invoiced. Target: 100% non-human.",
    steps:[
      { id:"s1", name:"Intake & triage",            agent:"Triage Agent",          level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Classifies job, assigns Starlink workflow template. Creates CG job number in Prime." },
      { id:"s2", name:"Trade matching",             agent:"Trade Matching Agent",  level:4, hard:false, accuracy:0.97, trend:"stable",    decisions:0,  note:"Selects trade by skill, location, rating, compliance. Shadow plan created simultaneously." },
      { id:"s3", name:"Shadow plan creation",       agent:"Trade Matching Agent",  level:4, hard:false, accuracy:0.96, trend:"stable",    decisions:0,  note:"Identifies and soft-reserves backup trade at booking. Not at crisis time." },
      { id:"s4", name:"Customer confirmation",      agent:"Customer Comms Agent",  level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Sends booking confirmation, ETA window, trade details. Platform-initiated, not trade-initiated." },
      { id:"s5", name:"Day-of jeopardy detection",  agent:"Confidence Monitor",    level:3, hard:false, accuracy:0.91, trend:"improving",decisions:12, note:"Monitors geo check-in. Prime status: Reschedule Required triggers shadow activation." },
      { id:"s6", name:"Evidence verification",      agent:"Evidence Monitor",      level:3, hard:false, accuracy:0.88, trend:"improving",decisions:8,  note:"Completion photos verified against scope before Prime status moves to Invoiced." },
      { id:"s7", name:"Job closure & invoice",      agent:"Invoice Agent",         level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Closes job in Prime, generates invoice to Starlink Internet Services Pty Ltd." },
      { id:"s8", name:"Customer feedback",          agent:"Feedback Agent",        level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Post-completion satisfaction survey. Triggered on trade geo check-out, not job completion." },
      { id:"s9", name:"Financial decisions >$1k",   agent:"—",                     level:"hard" as const, hard:true, accuracy:null, trend:null, decisions:0, note:"Permanent hard limit (Aaron, 18 Mar 2026)." },
    ],
  },
  {
    id:"insurance", label:"Insurance Repair", client:"Allianz Australia Insurance Ltd / Home Repair", icon:"🏠",
    description:"Multi-trade, sequenced, variable scope. Prime label: Home Repair or insurer name. Most complex Commitment type. 90% Chekku no-match rate — predominantly manual procurement.",
    steps:[
      { id:"i1",  name:"Intake from insurer inbox",       agent:"Triage Agent",          level:4, hard:false, accuracy:0.97, trend:"stable",    decisions:0,  note:"Email from insurer (Allianz, Home Repair) picked up from insurance@ inbox. Job created in Prime." },
      { id:"i2",  name:"Customer triage call",            agent:"—",                     level:1, hard:false, accuracy:null, trend:null,       decisions:0,  note:"Offshore team calls customer using triage script. Structured notes captured in Prime job history." },
      { id:"i3",  name:"Virtual assessment booking",      agent:"Scheduling Agent",      level:2, hard:false, accuracy:0.81, trend:"stable",    decisions:41, note:"Books LiveGenic VA session with Josh. Added to Josh's Prime calendar. Josh is a single point of failure." },
      { id:"i4",  name:"Scope & estimate build",          agent:"—",                     level:1, hard:false, accuracy:null, trend:null,       decisions:0,  note:"Josh builds estimate manually in Prime. Client-visible price ≠ trade work order price (margin structure)." },
      { id:"i5",  name:"Quote submission to insurer portal",agent:"—",                  level:1, hard:false, accuracy:null, trend:null,       decisions:0,  note:"Quote submitted to insurer portal. Format varies by client. KPI: 1-hour acceptance window." },
      { id:"i6",  name:"Insurer portal acceptance",       agent:"Escalation Agent",      level:2, hard:false, accuracy:0.79, trend:"improving",decisions:28, note:"AI monitors KPI timer. Flags when approaching breach. Human accepts in portal." },
      { id:"i7",  name:"Work order build (4–7 per job)",  agent:"—",                     level:1, hard:false, accuracy:null, trend:null,       decisions:0,  note:"Josh/Paul build 4–7 work orders per job. Assigned to Kerrie for trade procurement." },
      { id:"i8",  name:"Trade procurement (manual)",      agent:"Trade Matching Agent",  level:2, hard:false, accuracy:0.88, trend:"stable",    decisions:9,  note:"90% no-match in Chekku. Manual procurement: call known trades, check Prime, cold-call. SWMS gap is primary blocker." },
      { id:"i9",  name:"Scope change approval",           agent:"Scope Assessment Agent",level:1, hard:false, accuracy:0.71, trend:"stable",    decisions:6,  note:"Auto-demoted from Level 2 when accuracy dropped to 0.71. Trade identifies additional scope on-site." },
      { id:"i10", name:"Financial approval >$1k",         agent:"—",                     level:"hard" as const, hard:true, accuracy:null, trend:null, decisions:0, note:"Permanent hard limit." },
      { id:"i11", name:"Progress monitoring & rescheduling",agent:"Confidence Monitor", level:2, hard:false, accuracy:0.84, trend:"improving",decisions:11, note:"Trade dropout triggers cascade rescheduling. Can consume half a day per incident." },
      { id:"i12", name:"Completion certificate",          agent:"Feedback Agent",        level:2, hard:false, accuracy:0.84, trend:"improving",decisions:9,  note:"Two-level completion: per work order + overall project. Customer digital sign-off. Kerrie manually uploads to insurer portal." },
      { id:"i13", name:"Insurer portal mirror updates",   agent:"—",                     level:1, hard:false, accuracy:null, trend:null,       decisions:0,  note:"Every Prime status change requires a manual mirror update in the insurer portal. KPI-timed." },
      { id:"i14", name:"WHS / Safety matters",            agent:"—",                     level:"hard" as const, hard:true, accuracy:null, trend:null, decisions:0, note:"Permanent hard limit." },
    ],
  },
  {
    id:"hn", label:"Harvey Norman / JB Hi-Fi", client:"Harvey Norman - Derni Pty Ltd / JB Hi-Fi Group Pty Ltd", icon:"📺",
    description:"Appliance installation. Prime label: Harvey Norman - Derni Pty Ltd. Scope confirmation at closure is critical — financial leak risk confirmed by Nicole.",
    steps:[
      { id:"h1", name:"Intake from Magento",         agent:"Triage Agent",          level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Job created via Magento → Proxy API → Prime. HN label: Harvey Norman - Derni Pty Ltd." },
      { id:"h2", name:"Trade matching",              agent:"Trade Matching Agent",  level:4, hard:false, accuracy:0.96, trend:"stable",    decisions:0,  note:"Trade matched, shadow plan created at booking." },
      { id:"h3", name:"Day-of jeopardy detection",   agent:"Confidence Monitor",    level:3, hard:false, accuracy:0.89, trend:"improving",decisions:4,  note:"Geo check-in monitored. Shadow activates if confidence drops below threshold." },
      { id:"h4", name:"Scope confirmation at close", agent:"Evidence Monitor",      level:2, hard:false, accuracy:0.83, trend:"stable",    decisions:6,  note:"Trade must confirm exactly what was completed — TV wall mount and/or cable conceal. Prevents billing discrepancy." },
      { id:"h5", name:"Job closure & invoice",       agent:"Invoice Agent",         level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Prime status → Works Complete → Invoiced. Invoice dispatched to Harvey Norman." },
      { id:"h6", name:"Customer feedback",           agent:"Feedback Agent",        level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Post-completion survey triggered on trade geo check-out." },
      { id:"h7", name:"Financial decisions >$1k",    agent:"—",                     level:"hard" as const, hard:true, accuracy:null, trend:null, decisions:0, note:"Permanent hard limit." },
    ],
  },
];

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const AUDIT_LOG = [
  { date:"18 Mar 2026", user:"Aaron Aitken",  action:"Set hard limits",                    detail:"Financial >$1k, WHS, legal, enterprise client comms, police/fire — permanently Level 1 across all workflows.", type:"policy" },
  { date:"12 Mar 2026", user:"Ben Stevens",   action:"Promoted Starlink trade matching",    detail:"Level 3 → Level 4. Accuracy 0.97 sustained 30 days, 0 adverse incidents. Approved by Aaron.", type:"promote" },
  { date:"8 Mar 2026",  user:"Jack Rudenko",  action:"Promoted Starlink job closure",       detail:"Level 3 → Level 4. Accuracy 0.99 over 15,000 jobs. No invoice errors in 45 days. Approved by Ben.", type:"promote" },
  { date:"6 Mar 2026",  user:"System",        action:"Auto-demoted: Insurance scope change",detail:"Level 2 → Level 1. Accuracy dropped to 0.71 (below 0.75 floor). Human review mandatory until accuracy recovers.", type:"demote" },
];

// ─── Confidence distribution (illustrative — aligned to Session Starter volumes) ─
export const CONF_DIST = [
  { band:"0.95–1.0", label:"Near certain", count:3206, color:"bg-green-500" },
  { band:"0.80–0.95",label:"Likely",       count:1578, color:"bg-blue-500"  },
  { band:"0.60–0.80",label:"At risk",      count:156,  color:"bg-yellow-500"},
  { band:"0.40–0.60",label:"High risk",    count:47,   color:"bg-orange-500"},
  { band:"< 0.40",   label:"Critical",     count:13,   color:"bg-red-500"   },
];
