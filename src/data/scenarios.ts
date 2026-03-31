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
export const cc  = (s: number) => s>=0.95?"text-green-400":s>=0.80?"text-blue-400":s>=0.60?"text-yellow-400":s>=0.40?"text-orange-400":"text-red-400";
export const cb  = (s: number) => s>=0.80?"bg-green-400":s>=0.60?"bg-yellow-400":s>=0.40?"bg-orange-400":"bg-red-400";
export const cl  = (s: number) => s>=0.95?"On track":s>=0.80?"Likely":s>=0.60?"At risk":s>=0.40?"High risk":"Critical";
export const cbg = (s: number) => s>=0.80?"bg-blue-950/60 border-blue-800":s>=0.60?"bg-yellow-950/40 border-yellow-800":s>=0.40?"bg-orange-950/40 border-orange-800":"bg-red-950/60 border-red-800";
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
export const PERSONAS = [
  { id:"logan",    label:"Logan",    title:"Ops Manager — Installation Services", region:"North East (NSW/QLD)", types:["starlink","hn","jbhifi"],                                      canConfig:false },
  { id:"kerrie",   label:"Kerrie",   title:"Insurance Coordinator",                region:"National",             types:["insurance"],                                                   canConfig:false },
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

// ─── Today's Schedule — Logan's region (real NSW suburbs and CG job numbers) ──
// Trade names: business names used directly; individual names replaced (see header).
export const TODAY_JOBS = [
  // CG36080 — Starlink, Macmasters Beach NSW 2251 — Central Coast, Logan's patch
  { id:"CG36080", trade:"Metro Handyman Services Pty Ltd",       type:"Starlink Install", suburb:"Macmasters Beach NSW", window:"8–10am",  conf:0.91, geo:"confirmed",   geoTime:"7:41am", minsToWindow:-78 },
  // CG35976 — Starlink, West Pymble NSW 2073 — "Reschedule Required" in Prime
  { id:"CG35976", trade:"Circl Customer Service",                 type:"Starlink Install", suburb:"West Pymble NSW",       window:"9–11am",  conf:0.34, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  // CG36057 — Starlink, Medowie NSW 2318 — Hunter Valley, Logan's patch
  { id:"CG36057", trade:"Newcastle Tv And Satellite Pty Ltd",     type:"Starlink Install", suburb:"Medowie NSW",           window:"9–11am",  conf:0.71, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  // CG36115 — Starlink, Kariong NSW 2250 — Central Coast, Logan's patch
  { id:"CG36115", trade:"National Representative Solutions Pty Ltd", type:"Starlink Install", suburb:"Kariong NSW",        window:"10–12pm", conf:0.94, geo:"confirmed",   geoTime:"8:09am", minsToWindow:42 },
  // CG36071 — Starlink, Bilpin NSW 2758 — Blue Mountains, Logan's patch
  { id:"CG36071", trade:"Compulance Computer Services",           type:"Starlink Install", suburb:"Bilpin NSW",            window:"10–12pm", conf:0.88, geo:"en_route",    geoTime:"9:22am", minsToWindow:42 },
  // CG36003 — Starlink, Fern Bay NSW 2295 — Newcastle area, no trade assigned
  { id:"CG36003", trade:"Circl Customer Service",                 type:"Starlink Install", suburb:"Fern Bay NSW",          window:"11am–1pm",conf:0.42, geo:"unassigned",  geoTime:null,     minsToWindow:102 },
  // CG35954 — Starlink, Broke NSW 2330 — Hunter Valley
  { id:"CG35954", trade:"York Digital Solutions",                 type:"Starlink Install", suburb:"Broke NSW",             window:"12–2pm",  conf:0.87, geo:"confirmed",   geoTime:"8:03am", minsToWindow:162 },
  // CG36110 — Starlink, Coomba Bay NSW 2428 — Mid North Coast
  { id:"CG36110", trade:"Sandbar Electrical Services",            type:"Starlink Install", suburb:"Coomba Bay NSW",        window:"1–3pm",   conf:0.79, geo:"no_activity", geoTime:null,     minsToWindow:222 },
  // CG35925 — Starlink, Pitt Town NSW 2756 — Northwest Sydney
  { id:"CG35925", trade:"Smart Techie Pty Ltd",                   type:"Starlink Install", suburb:"Pitt Town NSW",         window:"2–4pm",   conf:0.91, geo:"confirmed",   geoTime:"7:51am", minsToWindow:282 },
  // CG35958 — Harvey Norman, Point Clare NSW 2250 — Central Coast
  { id:"CG35958", trade:"UNITED INFOCOM TECH PTY LTD",           type:"HN Install",       suburb:"Point Clare NSW",       window:"2–4pm",   conf:0.93, geo:"en_route",    geoTime:"1:08pm", minsToWindow:282 },
];

// ─── Morning Briefing ─────────────────────────────────────────────────────────
// Uses real CG job numbers where applicable
export const MORNING = [
  // Based on Logan's Facebook story — evidence non-submission pattern
  { severity:"high",   icon:"📷", msg:"York Digital Solutions: CG35954, CG36003, CG36015 — 3 completed Starlink installs, 0 photos submitted (48+ hrs). Auto-reminder sent. No response.", jobRef:"CG35976" },
  // Compliance expiry — real scenario type
  { severity:"high",   icon:"🔒", msg:"Sandbar Electrical Services: public liability renewed but SWMS outstanding. Removed from new allocations pending submission.", jobRef:null },
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
export const STAFF_PERFORMANCE = [
  {
    persona:"logan", name:"Logan", role:"Ops Manager — Installation Services",
    rank:2, rankTotal:8, rankLabel:"2nd of 8 coordinators this week",
    weeklyTrend:"improving",
    kpis:[
      { label:"Decisions resolved",     current:18, target:20, unit:"this week",        trend:"up" },
      { label:"Jobs closed on time",    current:94, target:95, unit:"% (last 7 days)",  trend:"stable" },
      { label:"Evidence reviewed",      current:47, target:50, unit:"this week",        trend:"up" },
      { label:"Trade inspections (Safety)", current:8, target:20, unit:"this month",   trend:"behind" },
      { label:"Trade inspections (Quality)",current:6, target:20, unit:"this month",   trend:"behind" },
    ],
    insight:"Your decision resolution is strong. Inspection targets need attention — 14 days left in the month, 26 inspections to go.",
  },
  {
    persona:"kerrie", name:"Kerrie", role:"Insurance Coordinator",
    rank:4, rankTotal:8, rankLabel:"4th of 8 coordinators this week",
    weeklyTrend:"stable",
    kpis:[
      { label:"Work orders scheduled",  current:12, target:15, unit:"this week",        trend:"stable" },
      { label:"Portal updates on time", current:88, target:95, unit:"% (last 7 days)",  trend:"down" },
      { label:"Completion certs filed", current:9,  target:12, unit:"this week",        trend:"stable" },
      { label:"Scope changes reviewed", current:4,  target:5,  unit:"this week",        trend:"stable" },
    ],
    insight:"Portal update on-time rate is slipping. 3 Allianz jobs had updates logged more than 1 hour after status change this week.",
  },
  {
    persona:"national", name:"National View", role:"All Regions",
    rank:null, rankTotal:null, rankLabel:null,
    weeklyTrend:"stable",
    kpis:[
      { label:"Decisions resolved",  current:87,  target:100, unit:"this week",        trend:"stable" },
      { label:"Jobs closed on time", current:91,  target:95,  unit:"% (last 7 days)",  trend:"down" },
      { label:"SLA breaches",        current:3,   target:0,   unit:"this week",        trend:"stable" },
      { label:"Portal updates late", current:7,   target:0,   unit:"this week",        trend:"up" },
    ],
    insight:"3 SLA breaches this week, all in insurance. Portal update latency is the primary driver.",
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
export const KERRIE_JOBS = [
  { id:"CG36078", insurer:"Allianz",  customer:"R. Chen",      suburb:"Shailer Park QLD",    stage:"Assessment booked",         nextAction:"Virtual assessment — KPI 45 min remaining", tradeDate:"Today",    flag:"kpi",       flagLabel:"KPI: 45 min" },
  { id:"CG36069", insurer:"Allianz",  customer:"P. Morrow",    suburb:"Mardi NSW",            stage:"Scope change pending",      nextAction:"Scope change +$1,800 awaiting Paul sign-off", tradeDate:"Today",  flag:"approval",  flagLabel:"Approval needed" },
  { id:"CG36011", insurer:"Allianz",  customer:"D. Hartley",   suburb:"Port Macquarie NSW",   stage:"Trade allocation required", nextAction:"No compliant trade found — manual procurement", tradeDate:"Tomorrow",flag:"compliance",flagLabel:"No compliant trade" },
  { id:"CG35949", insurer:"Home Repair",customer:"T. Nguyen",  suburb:"Karuah NSW",           stage:"Report/Quote Sent",         nextAction:"Awaiting insurer approval",                   tradeDate:"TBC",      flag:null,        flagLabel:null },
  { id:"CG36029", insurer:"Home Repair",customer:"S. White",   suburb:"Bulahdelah NSW",       stage:"Works in progress",         nextAction:"Carpenter Day 3 of 5 — check photos today",   tradeDate:"Ongoing",  flag:"evidence",  flagLabel:"Photos due" },
  { id:"CG36031", insurer:"Home Repair",customer:"M. Park",    suburb:"Bulahdelah NSW",       stage:"Completion pending",        nextAction:"Await completion cert — trade finished Fri",   tradeDate:"Done",     flag:"cert",      flagLabel:"Cert overdue" },
  { id:"CG36025", insurer:"Home Repair",customer:"B. Torres",  suburb:"Coramba NSW",          stage:"Report/Quote Sent",         nextAction:"Josh to review quote — in his queue",         tradeDate:"TBC",      flag:null,        flagLabel:null },
  { id:"CG35974", insurer:"Home Repair",customer:"L. Evans",   suburb:"Valla NSW",            stage:"Invoiced",                  nextAction:"Upload completion docs to insurer portal",    tradeDate:"Complete", flag:"portal",    flagLabel:"Portal update due" },
  { id:"CG36078B",insurer:"Allianz",  customer:"A. Singh",     suburb:"Robina QLD",           stage:"Makesafe complete",         nextAction:"Post makesafe — book carpenter and plasterer", tradeDate:"Next week",flag:null,        flagLabel:null },
  { id:"CG36091B",insurer:"Allianz",  customer:"G. Russo",     suburb:"Werribee VIC",         stage:"Trade allocated",           nextAction:"Confirm trade start date with customer",      tradeDate:"Mar 28",   flag:null,        flagLabel:null },
  { id:"CG36102B",insurer:"Allianz",  customer:"H. Nielsen",   suburb:"Hornsby Heights NSW",  stage:"Works in progress",         nextAction:"Plasterer Day 2 — electrician booked Mar 30",tradeDate:"Ongoing",  flag:null,        flagLabel:null },
  { id:"CG36077B",insurer:"Home Repair",customer:"F. Walsh",   suburb:"Morwell VIC",          stage:"Report/Quote Sent",         nextAction:"Awaiting scope approval — 3 days overdue",   tradeDate:"TBC",      flag:"overdue",   flagLabel:"3 days overdue" },
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
