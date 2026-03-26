// ─── Helpers ─────────────────────────────────────────────────────────────────
export const cc  = (s: number) => s>=0.95?"text-green-400":s>=0.80?"text-blue-400":s>=0.60?"text-yellow-400":s>=0.40?"text-orange-400":"text-red-400";
export const cb  = (s: number) => s>=0.80?"bg-green-400":s>=0.60?"bg-yellow-400":s>=0.40?"bg-orange-400":"bg-red-400";
export const fmt = (n: number) => n.toLocaleString();

export const LM = {
  1:{ label:"Level 1",  long:"Inform only",     desc:"AI prepares context. Human decides and acts.",              badge:"bg-gray-700 text-gray-300",       bar:"bg-gray-500",    ring:"border-gray-600" },
  2:{ label:"Level 2",  long:"Recommend",        desc:"AI recommends with confidence score. Human approves first.",badge:"bg-yellow-900 text-yellow-300",  bar:"bg-yellow-500",  ring:"border-yellow-700" },
  3:{ label:"Level 3",  long:"Act + Notify",     desc:"AI acts, logs it, notifies human. Reversible within window.",badge:"bg-blue-900 text-blue-300",    bar:"bg-blue-500",    ring:"border-blue-700" },
  4:{ label:"Level 4",  long:"Full autonomy",    desc:"AI acts. Human sees exceptions only.",                     badge:"bg-green-900 text-green-300",    bar:"bg-green-500",   ring:"border-green-700" },
  "hard":{ label:"🔒 Locked", long:"Permanent limit", desc:"Hard limit set by Aaron (18 Mar 2026). No pathway to higher autonomy regardless of accuracy.", badge:"bg-red-950 text-red-400", bar:"bg-red-800", ring:"border-red-900" },
};

// ─── Workflow templates ───────────────────────────────────────────────────────
export const WORKFLOW_TEMPLATES = [
  {
    id:"starlink", label:"Starlink Install", client:"Starlink", icon:"📡",
    description:"Single trade, fixed scope, fixed price. Target: 100% non-human.",
    steps:[
      { id:"s1", name:"Intake & triage",           agent:"Triage",           level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Classifies job type and assigns workflow template." },
      { id:"s2", name:"Trade matching",            agent:"Trade Matching",   level:4, hard:false, accuracy:0.97, trend:"stable",    decisions:0,  note:"Selects best-fit trade by skill, location, rating, compliance." },
      { id:"s3", name:"Shadow plan creation",      agent:"Trade Matching",   level:4, hard:false, accuracy:0.96, trend:"stable",    decisions:0,  note:"Identifies and soft-reserves backup trade at booking time." },
      { id:"s4", name:"Customer confirmation",     agent:"Customer Comms",   level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Sends booking confirmation, ETA window, trade details." },
      { id:"s5", name:"Day-of jeopardy detection", agent:"Confidence Monitor",level:3, hard:false, accuracy:0.91, trend:"improving",decisions:12, note:"Monitors geo check-in, flags unresponsive trades, activates shadow plan." },
      { id:"s6", name:"Evidence verification",     agent:"Evidence Monitor", level:3, hard:false, accuracy:0.88, trend:"improving",decisions:8,  note:"Verifies completion photos match expected scope. Escalates if missing." },
      { id:"s7", name:"Job closure & invoice",     agent:"Invoice",          level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Closes job, generates and dispatches invoice to Starlink." },
      { id:"s8", name:"Customer feedback",         agent:"Feedback",         level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Sends post-job satisfaction survey. Flags anomalies to Worker Reliability Model." },
      { id:"s9", name:"Financial decisions >$1k",  agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"s10",name:"WHS / Safety matters",      agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
    ],
  },
  {
    id:"insurance", label:"Insurance Repair", client:"IAG + others", icon:"🏠",
    description:"Multi-trade, sequenced, variable scope. Most complex Commitment type.",
    steps:[
      { id:"i1", name:"Intake & triage",           agent:"Triage",           level:4, hard:false, accuracy:0.97, trend:"stable",    decisions:0,  note:"Classifies job type, complexity, and assigns IAG workflow template." },
      { id:"i2", name:"Makesafe trade matching",   agent:"Trade Matching",   level:4, hard:false, accuracy:0.95, trend:"stable",    decisions:0,  note:"Assigns makesafe trade immediately on intake." },
      { id:"i3", name:"Scope assessment",          agent:"Scope Assessment", level:2, hard:false, accuracy:0.81, trend:"stable",    decisions:41, note:"Reviews job documentation, compares against policy, flags discrepancies. Accuracy not yet sufficient for Level 3." },
      { id:"i4", name:"Multi-trade sequencing",    agent:"Scheduling",       level:2, hard:false, accuracy:0.79, trend:"improving",decisions:28, note:"Sequences dependent trades (makesafe → carpenter → electrician). Complex dependency logic." },
      { id:"i5", name:"Out-of-zone approval",      agent:"Trade Matching",   level:2, hard:false, accuracy:0.88, trend:"stable",    decisions:9,  note:"Recommends out-of-zone trade when in-zone unavailable. Human approves rate premium." },
      { id:"i6", name:"Scope change mid-job",      agent:"Scope Assessment", level:1, hard:false, accuracy:0.71, trend:"stable",    decisions:6,  note:"Flags scope changes for human review. Accuracy too low for Level 2 recommendation yet." },
      { id:"i7", name:"Financial approval >$1k",   agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"i8", name:"Customer comms",            agent:"Customer Comms",   level:3, hard:false, accuracy:0.93, trend:"stable",    decisions:0,  note:"Sends status updates and notifications. Human reviews only on complex escalations." },
      { id:"i9", name:"Evidence verification",     agent:"Evidence Monitor", level:2, hard:false, accuracy:0.84, trend:"improving",decisions:11, note:"Photo + certificate verification. Insurance requires human sign-off at closure." },
      { id:"i10",name:"Invoice & reconciliation",  agent:"Invoice",          level:2, hard:false, accuracy:0.87, trend:"stable",    decisions:9,  note:"Invoice generation requires human review for variable-scope jobs." },
      { id:"i11",name:"WHS / Safety matters",      agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"i12",name:"Legal / compliance matters",agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
    ],
  },
  {
    id:"hn", label:"Harvey Norman", client:"Harvey Norman / JB Hi-Fi", icon:"📺",
    description:"Appliance installation. Medium complexity. Scope confirmation at closure is critical.",
    steps:[
      { id:"h1", name:"Intake & triage",           agent:"Triage",           level:4, hard:false, accuracy:0.99, trend:"stable",    decisions:0,  note:"Classifies job and assigns HN workflow template." },
      { id:"h2", name:"Trade matching",            agent:"Trade Matching",   level:4, hard:false, accuracy:0.96, trend:"stable",    decisions:0,  note:"Assigns trade. Shadow plan created at booking." },
      { id:"h3", name:"Day-of jeopardy detection", agent:"Confidence Monitor",level:3, hard:false, accuracy:0.89, trend:"improving",decisions:4,  note:"Monitors geo check-in. Shadow plan activates if confidence below threshold." },
      { id:"h4", name:"Scope confirmation at close",agent:"Evidence Monitor",level:2, hard:false, accuracy:0.83, trend:"stable",    decisions:6,  note:"Trade must confirm exactly what was completed. AI verifies against booked scope. Financial leak risk." },
      { id:"h5", name:"Job closure & invoice",     agent:"Invoice",          level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Closes job, dispatches invoice to Harvey Norman." },
      { id:"h6", name:"Customer feedback",         agent:"Feedback",         level:4, hard:false, accuracy:0.98, trend:"stable",    decisions:0,  note:"Post-job satisfaction survey." },
      { id:"h7", name:"Financial decisions >$1k",  agent:"—",                level:"hard" as const, hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
    ],
  },
];

// ─── Audit log ────────────────────────────────────────────────────────────────
export const AUDIT_LOG = [
  { date:"18 Mar 2026", user:"Aaron Aitken",   action:"Set hard limits",                  detail:"Financial >$1k, WHS, legal, enterprise client comms, police/fire — permanently Level 1 across all workflows.", type:"policy" },
  { date:"12 Mar 2026", user:"Ben Stevens",    action:"Promoted Starlink trade matching",  detail:"Level 3 → Level 4. Accuracy 0.97 sustained for 30 days, 0 adverse incidents. Approved by Aaron.", type:"promote" },
  { date:"8 Mar 2026",  user:"Jack Rudenko",   action:"Promoted Starlink job closure",     detail:"Level 3 → Level 4. Accuracy 0.99 over 15,000 Starlink jobs. No invoice errors in 45 days. Approved by Ben.", type:"promote" },
  { date:"6 Mar 2026",  user:"System",         action:"Auto-demoted Insurance scope change",detail:"Level 2 → Level 1. Accuracy dropped to 0.71 (below 0.75 floor). Human review mandatory until accuracy recovers.", type:"demote" },
];

// ─── Personas ─────────────────────────────────────────────────────────────────
export const PERSONAS = [
  { id:"logan",    label:"Logan",    title:"Ops Manager — Installation Services", region:"North East (NSW/QLD)", types:["starlink","hn","jbhifi"], canConfig:false },
  { id:"conner",   label:"Conner",   title:"Ops Manager — Construction",          region:"National",             types:["construction"],           canConfig:false },
  { id:"blake",    label:"Blake",    title:"Ops Manager — FM",                    region:"National",             types:["fm"],                     canConfig:false },
  { id:"national", label:"National", title:"Senior Operations — All Regions",     region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"], canConfig:false },
  { id:"aaron",    label:"Aaron",    title:"Founder / CEO",                       region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"], canConfig:true },
];

// ─── Today jobs ───────────────────────────────────────────────────────────────
export const TODAY_JOBS = [
  { id:"JOB-3201", trade:"Priya Nair",    type:"Starlink Install",  suburb:"Tweed Heads NSW",  window:"8–10am",  conf:0.91, geo:"confirmed",   geoTime:"7:34am", minsToWindow:-78 },
  { id:"JOB-3202", trade:"Sam Brooks",    type:"Appliance Install", suburb:"Doncaster VIC",    window:"9–11am",  conf:0.34, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  { id:"JOB-3203", trade:"Mick Torres",   type:"Starlink Install",  suburb:"Newcastle NSW",    window:"9–11am",  conf:0.71, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  { id:"JOB-3204", trade:"Jordan Kim",    type:"Starlink Install",  suburb:"Gold Coast QLD",   window:"10–12pm", conf:0.94, geo:"confirmed",   geoTime:"8:02am", minsToWindow:42 },
  { id:"JOB-3205", trade:"Chris Dale",    type:"Starlink Install",  suburb:"Lismore NSW",      window:"10–12pm", conf:0.88, geo:"en_route",    geoTime:"9:15am", minsToWindow:42 },
  { id:"JOB-3206", trade:"Unassigned",    type:"Starlink Install",  suburb:"Armidale NSW",     window:"11am–1pm",conf:0.42, geo:"unassigned",  geoTime:null,     minsToWindow:102 },
  { id:"JOB-3207", trade:"Dave Kowalski", type:"Starlink Install",  suburb:"Byron Bay NSW",    window:"12–2pm",  conf:0.87, geo:"confirmed",   geoTime:"7:58am", minsToWindow:162 },
  { id:"JOB-3208", trade:"Terry Huang",   type:"Starlink Install",  suburb:"Tamworth NSW",     window:"1–3pm",   conf:0.79, geo:"no_activity", geoTime:null,     minsToWindow:222 },
];

export const geoLabel = (geo: string, mins: number) => {
  if (geo==="confirmed")  return { label:`Confirmed en route`,                                  dot:"bg-green-400",              text:"text-green-400"  };
  if (geo==="en_route")   return { label:`GPS active`,                                          dot:"bg-blue-400",               text:"text-blue-400"   };
  if (geo==="unassigned") return { label:`No trade assigned`,                                   dot:"bg-gray-500",               text:"text-gray-400"   };
  if (mins > 30)          return { label:`Not yet confirmed — ${mins}m to window`,              dot:"bg-yellow-400",             text:"text-yellow-400" };
  if (mins > 0)           return { label:`No check-in — window in ${mins}m`,                   dot:"bg-orange-400 animate-pulse",text:"text-orange-400"};
  return                         { label:`No check-in — window started ${Math.abs(mins)}m ago`, dot:"bg-red-400 animate-pulse",  text:"text-red-400"    };
};

// ─── Job type health ──────────────────────────────────────────────────────────
export const JOB_TYPES = [
  { id:"starlink",    label:"Starlink Install",     total:2840, onTrack:2791, atRisk:34, critical:8,  needsDecision:7, avgConf:0.93, trend:"stable",    color:"text-blue-400",   bar:"bg-blue-500"   },
  { id:"hn",          label:"Harvey Norman",         total:610,  onTrack:581,  atRisk:21, critical:5,  needsDecision:4, avgConf:0.88, trend:"stable",    color:"text-purple-400", bar:"bg-purple-500" },
  { id:"insurance",   label:"Insurance Repair",      total:280,  onTrack:223,  atRisk:41, critical:11, needsDecision:9, avgConf:0.71, trend:"declining", color:"text-orange-400", bar:"bg-orange-500" },
  { id:"construction",label:"Construction / AHO",    total:520,  onTrack:486,  atRisk:27, critical:6,  needsDecision:5, avgConf:0.83, trend:"stable",    color:"text-cyan-400",   bar:"bg-cyan-500"   },
  { id:"fm",          label:"Facilities Management", total:360,  onTrack:332,  atRisk:19, critical:7,  needsDecision:6, avgConf:0.78, trend:"improving", color:"text-teal-400",   bar:"bg-teal-500"   },
];

// ─── Decisions ────────────────────────────────────────────────────────────────
export const DECISIONS = [
  { id:"JOB-2847", type:"Insurance Repair",  client:"IAG",           conf:0.61, autonomyLevel:2, label:"Carpenter out-of-zone approval required",        age:"6h ago",    urgency:"Act by 5pm — cascade to electrician",    rec:"Approve Terry Huang (+$180).", options:["Approve Terry Huang","Wait for in-zone","Escalate"] },
  { id:"JOB-2839", type:"Appliance Install",  client:"Harvey Norman", conf:0.34, autonomyLevel:3, label:"Shadow plan ready — activate Jordan Kim?",       age:"90m ago",   urgency:"Customer notified of delay",             rec:"Activate shadow plan. Pre-reserved at booking.", options:["Activate shadow plan","Call Sam Brooks","Cancel"] },
  { id:"JOB-2855", type:"Starlink Install",   client:"Starlink",      conf:0.71, autonomyLevel:3, label:"12 jobs — no evidence (4 days)",                 age:"3h ago",    urgency:"$3,588 invoicing blocked",               rec:"Call Mick Torres. Auto-suspension active.", options:["Call Mick Torres","Formal notice","Escalate to Logan"] },
  { id:"JOB-3089", type:"Insurance Repair",   client:"IAG",           conf:0.38, autonomyLevel:1, label:"Scope change +$1,400 — financial sign-off required",age:"1h ago", urgency:"Hard limit: financial >$1k",              rec:"Review evidence, approve if valid.", options:["Approve","Reject","Escalate to Paul Allen"] },
];

// ─── Supervisors ──────────────────────────────────────────────────────────────
export const SUPERVISORS = [
  { id:"troy", name:"Troy Macpherson", region:"North East NSW", safety:{done:8,target:20}, quality:{done:6,target:20}, avoidanceFlag:"Troy has not inspected Sam Brooks in 45 days despite 1 complaint.",
    inspectionQueue:[
      { trade:"Mick Torres",  rating:3.1, lastInspected:"Never",  jobsSince:28, complaints:2, priority:"critical", reason:"0 photos submitted. 28 jobs uninspected." },
      { trade:"Sam Brooks",   rating:3.6, lastInspected:"45 days",jobsSince:14, complaints:1, priority:"high",     reason:"No-show risk. Unresponsive this morning." },
      { trade:"Terry Huang",  rating:3.9, lastInspected:"31 days",jobsSince:9,  complaints:0, priority:"high",     reason:"New in region. >30 days since last check." },
      { trade:"Chris Dale",   rating:4.6, lastInspected:"22 days",jobsSince:7,  complaints:0, priority:"medium",   reason:"Good performer. Routine cycle overdue." },
    ],
  },
  { id:"kylie", name:"Kylie Tran", region:"QLD + Northern Rivers", safety:{done:14,target:20}, quality:{done:11,target:20}, avoidanceFlag:null, inspectionQueue:[] },
];

// ─── Patterns ─────────────────────────────────────────────────────────────────
export const ALL_PATTERNS = [
  { id:"P-041", region:"North East", severity:"high",   icon:"📍", title:"Coverage gap — Starlink, QLD regional", detail:"4 unresponsive trade incidents in Tweed Heads this week. Shadow plans activating repeatedly. Targeted recruitment required.", type:"Systemic", affected:"11 Commitments", action:"Raise recruitment request" },
  { id:"P-039", region:"North East", severity:"high",   icon:"📷", title:"Evidence non-submission — NSW corridor", detail:"3 Starlink installers in Newcastle have zero photos across 28 combined jobs this week. Possible app issue or training gap.", type:"Quality", affected:"28 Commitments", action:"Investigate app + training" },
];

// ─── Morning briefing ─────────────────────────────────────────────────────────
export const MORNING = [
  { severity:"high",   icon:"📷", msg:"Mick Torres: 12 installs, 0 photos (4 days). Suspended from new allocations." },
  { severity:"high",   icon:"🔒", msg:"Ryan Patel's public liability expired. Removed from pool — 3 jobs tomorrow need reallocation." },
  { severity:"medium", icon:"📋", msg:"JOB-2862 (Harvey Norman) scheduled tomorrow. No trade allocated. 26h to deadline." },
];

// ─── Staff performance ────────────────────────────────────────────────────────
export type KPI = {
  label: string;
  current: number;
  target: number;
  unit: string;
  lowerIsBetter?: boolean;
};

export type StaffPerf = {
  name: string;
  role: string;
  rank: number;
  rankTotal: number;
  rankLabel: string;
  weeklyTrend: "up" | "down" | "stable";
  trendDetail: string;
  highlight: string;
  kpis: KPI[];
};

export const STAFF_PERFORMANCE: Record<string, StaffPerf> = {
  logan: {
    name: "Logan",
    role: "Ops Manager — Installation Services",
    rank: 2, rankTotal: 8, rankLabel: "coordinators",
    weeklyTrend: "up",
    trendDetail: "Up 2 positions this week",
    highlight: "Your decision speed is creating capacity across the region — keep the momentum.",
    kpis: [
      { label: "On-time completion",   current: 91,  target: 95,  unit: "%"   },
      { label: "Trade compliance",     current: 96,  target: 98,  unit: "%"   },
      { label: "Customer satisfaction",current: 4.3, target: 4.5, unit: "/5.0"},
      { label: "Decision response",    current: 1.4, target: 2.0, unit: "h", lowerIsBetter: true },
      { label: "Evidence submission",  current: 94,  target: 98,  unit: "%"   },
    ],
  },
  conner: {
    name: "Conner",
    role: "Ops Manager — Construction",
    rank: 4, rankTotal: 6, rankLabel: "construction leads",
    weeklyTrend: "stable",
    trendDetail: "Consistent through a complex week",
    highlight: "Construction is the highest-complexity vertical — your depth here is a genuine asset.",
    kpis: [
      { label: "On-time completion",   current: 84,  target: 90,  unit: "%"   },
      { label: "Trade compliance",     current: 93,  target: 97,  unit: "%"   },
      { label: "Customer satisfaction",current: 4.1, target: 4.5, unit: "/5.0"},
      { label: "Decision response",    current: 2.8, target: 2.5, unit: "h", lowerIsBetter: true },
      { label: "Evidence submission",  current: 89,  target: 95,  unit: "%"   },
    ],
  },
  blake: {
    name: "Blake",
    role: "Ops Manager — Facilities Management",
    rank: 3, rankTotal: 7, rankLabel: "FM coordinators",
    weeklyTrend: "up",
    trendDetail: "Up 1 position this week",
    highlight: "Evidence and response time are standout strengths — FM complexity handled well.",
    kpis: [
      { label: "On-time completion",   current: 87,  target: 92,  unit: "%"   },
      { label: "Trade compliance",     current: 95,  target: 98,  unit: "%"   },
      { label: "Customer satisfaction",current: 4.4, target: 4.5, unit: "/5.0"},
      { label: "Decision response",    current: 1.9, target: 2.5, unit: "h", lowerIsBetter: true },
      { label: "Evidence submission",  current: 97,  target: 98,  unit: "%"   },
    ],
  },
  national: {
    name: "National",
    role: "Senior Operations — All Regions",
    rank: 1, rankTotal: 4, rankLabel: "regions",
    weeklyTrend: "stable",
    trendDetail: "Top region for the third consecutive week",
    highlight: "National portfolio is performing. Biggest growth opportunity is in Insurance and FM.",
    kpis: [
      { label: "Portfolio on-time rate",current: 89, target: 93,  unit: "%"   },
      { label: "Avg trade compliance",  current: 95, target: 97,  unit: "%"   },
      { label: "Customer satisfaction", current: 4.2,target: 4.5, unit: "/5.0"},
      { label: "Avg decision response", current: 2.1,target: 2.5, unit: "h", lowerIsBetter: true },
      { label: "Evidence submission",   current: 93, target: 97,  unit: "%"   },
    ],
  },
  aaron: {
    name: "Aaron",
    role: "Founder / CEO — All Regions",
    rank: 1, rankTotal: 4, rankLabel: "regions",
    weeklyTrend: "up",
    trendDetail: "Platform momentum building week-on-week",
    highlight: "The autonomy ladder is working — agents are earning their levels through accuracy.",
    kpis: [
      { label: "Platform on-time rate", current: 89, target: 93,  unit: "%"   },
      { label: "Avg trade compliance",  current: 95, target: 97,  unit: "%"   },
      { label: "Customer satisfaction", current: 4.2,target: 4.5, unit: "/5.0"},
      { label: "Autonomous decisions",  current: 78, target: 80,  unit: "%"   },
      { label: "Agent accuracy (avg)",  current: 91, target: 95,  unit: "%"   },
    ],
  },
};
