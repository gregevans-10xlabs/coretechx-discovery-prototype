import { useState, useRef, useEffect } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cc  = (s: number) => s>=0.95?"text-green-400":s>=0.80?"text-blue-400":s>=0.60?"text-yellow-400":s>=0.40?"text-orange-400":"text-red-400";
const cb  = (s: number) => s>=0.80?"bg-green-400":s>=0.60?"bg-yellow-400":s>=0.40?"bg-orange-400":"bg-red-400";
const fmt = (n: number) => n.toLocaleString();

const LM = {
  1:{ label:"Level 1",  long:"Inform only",     desc:"AI prepares context. Human decides and acts.",              badge:"bg-gray-700 text-gray-300",       bar:"bg-gray-500",    ring:"border-gray-600" },
  2:{ label:"Level 2",  long:"Recommend",        desc:"AI recommends with confidence score. Human approves first.",badge:"bg-yellow-900 text-yellow-300",  bar:"bg-yellow-500",  ring:"border-yellow-700" },
  3:{ label:"Level 3",  long:"Act + Notify",     desc:"AI acts, logs it, notifies human. Reversible within window.",badge:"bg-blue-900 text-blue-300",    bar:"bg-blue-500",    ring:"border-blue-700" },
  4:{ label:"Level 4",  long:"Full autonomy",    desc:"AI acts. Human sees exceptions only.",                     badge:"bg-green-900 text-green-300",    bar:"bg-green-500",   ring:"border-green-700" },
  "hard":{ label:"🔒 Locked", long:"Permanent limit", desc:"Hard limit set by Aaron (18 Mar 2026). No pathway to higher autonomy regardless of accuracy.", badge:"bg-red-950 text-red-400", bar:"bg-red-800", ring:"border-red-900" },
};

// ─── Workflow templates ───────────────────────────────────────────────────────
const WORKFLOW_TEMPLATES = [
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
      { id:"s9", name:"Financial decisions >$1k",  agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"s10",name:"WHS / Safety matters",      agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
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
      { id:"i7", name:"Financial approval >$1k",   agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"i8", name:"Customer comms",            agent:"Customer Comms",   level:3, hard:false, accuracy:0.93, trend:"stable",    decisions:0,  note:"Sends status updates and notifications. Human reviews only on complex escalations." },
      { id:"i9", name:"Evidence verification",     agent:"Evidence Monitor", level:2, hard:false, accuracy:0.84, trend:"improving",decisions:11, note:"Photo + certificate verification. Insurance requires human sign-off at closure." },
      { id:"i10",name:"Invoice & reconciliation",  agent:"Invoice",          level:2, hard:false, accuracy:0.87, trend:"stable",    decisions:9,  note:"Invoice generation requires human review for variable-scope jobs." },
      { id:"i11",name:"WHS / Safety matters",      agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
      { id:"i12",name:"Legal / compliance matters",agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
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
      { id:"h7", name:"Financial decisions >$1k",  agent:"—",                level:"hard", hard:true, accuracy:null, trend:null,   decisions:0,  note:"Hard limit (Aaron, 18 Mar 2026)." },
    ],
  },
];

// ─── Audit log ────────────────────────────────────────────────────────────────
const AUDIT_LOG = [
  { date:"18 Mar 2026", user:"Aaron Aitken",   action:"Set hard limits",                  detail:"Financial >$1k, WHS, legal, enterprise client comms, police/fire — permanently Level 1 across all workflows.", type:"policy" },
  { date:"12 Mar 2026", user:"Ben Stevens",    action:"Promoted Starlink trade matching",  detail:"Level 3 → Level 4. Accuracy 0.97 sustained for 30 days, 0 adverse incidents. Approved by Aaron.", type:"promote" },
  { date:"8 Mar 2026",  user:"Jack Rudenko",   action:"Promoted Starlink job closure",     detail:"Level 3 → Level 4. Accuracy 0.99 over 15,000 Starlink jobs. No invoice errors in 45 days. Approved by Ben.", type:"promote" },
  { date:"6 Mar 2026",  user:"System",         action:"Auto-demoted Insurance scope change",detail:"Level 2 → Level 1. Accuracy dropped to 0.71 (below 0.75 floor). Human review mandatory until accuracy recovers.", type:"demote" },
];

// ─── Personas ─────────────────────────────────────────────────────────────────
const PERSONAS = [
  { id:"logan",    label:"Logan",    title:"Ops Manager — Installation Services", region:"North East (NSW/QLD)", types:["starlink","hn","jbhifi"], canConfig:false },
  { id:"conner",   label:"Conner",   title:"Ops Manager — Construction",          region:"National",             types:["construction"],           canConfig:false },
  { id:"blake",    label:"Blake",    title:"Ops Manager — FM",                    region:"National",             types:["fm"],                     canConfig:false },
  { id:"national", label:"National", title:"Senior Operations — All Regions",     region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"], canConfig:false },
  { id:"aaron",    label:"Aaron",    title:"Founder / CEO",                       region:"All Regions",          types:["starlink","hn","jbhifi","insurance","construction","fm"], canConfig:true },
];

// ─── Today jobs ───────────────────────────────────────────────────────────────
const TODAY_JOBS = [
  { id:"JOB-3201", trade:"Priya Nair",    type:"Starlink Install",  suburb:"Tweed Heads NSW",  window:"8–10am",  conf:0.91, geo:"confirmed",   geoTime:"7:34am", minsToWindow:-78 },
  { id:"JOB-3202", trade:"Sam Brooks",    type:"Appliance Install", suburb:"Doncaster VIC",    window:"9–11am",  conf:0.34, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  { id:"JOB-3203", trade:"Mick Torres",   type:"Starlink Install",  suburb:"Newcastle NSW",    window:"9–11am",  conf:0.71, geo:"no_activity", geoTime:null,     minsToWindow:-18 },
  { id:"JOB-3204", trade:"Jordan Kim",    type:"Starlink Install",  suburb:"Gold Coast QLD",   window:"10–12pm", conf:0.94, geo:"confirmed",   geoTime:"8:02am", minsToWindow:42 },
  { id:"JOB-3205", trade:"Chris Dale",    type:"Starlink Install",  suburb:"Lismore NSW",      window:"10–12pm", conf:0.88, geo:"en_route",    geoTime:"9:15am", minsToWindow:42 },
  { id:"JOB-3206", trade:"Unassigned",    type:"Starlink Install",  suburb:"Armidale NSW",     window:"11am–1pm",conf:0.42, geo:"unassigned",  geoTime:null,     minsToWindow:102 },
  { id:"JOB-3207", trade:"Dave Kowalski", type:"Starlink Install",  suburb:"Byron Bay NSW",    window:"12–2pm",  conf:0.87, geo:"confirmed",   geoTime:"7:58am", minsToWindow:162 },
  { id:"JOB-3208", trade:"Terry Huang",   type:"Starlink Install",  suburb:"Tamworth NSW",     window:"1–3pm",   conf:0.79, geo:"no_activity", geoTime:null,     minsToWindow:222 },
];

const geoLabel = (geo: string, mins: number) => {
  if (geo==="confirmed")  return { label:`Confirmed en route`,                                  dot:"bg-green-400",              text:"text-green-400"  };
  if (geo==="en_route")   return { label:`GPS active`,                                          dot:"bg-blue-400",               text:"text-blue-400"   };
  if (geo==="unassigned") return { label:`No trade assigned`,                                   dot:"bg-gray-500",               text:"text-gray-400"   };
  if (mins > 30)          return { label:`Not yet confirmed — ${mins}m to window`,              dot:"bg-yellow-400",             text:"text-yellow-400" };
  if (mins > 0)           return { label:`No check-in — window in ${mins}m`,                   dot:"bg-orange-400 animate-pulse",text:"text-orange-400"};
  return                         { label:`No check-in — window started ${Math.abs(mins)}m ago`, dot:"bg-red-400 animate-pulse",  text:"text-red-400"    };
};

// ─── Job type health ──────────────────────────────────────────────────────────
const JOB_TYPES = [
  { id:"starlink",    label:"Starlink Install",     total:2840, onTrack:2791, atRisk:34, critical:8,  needsDecision:7, avgConf:0.93, trend:"stable",    color:"text-blue-400",   bar:"bg-blue-500"   },
  { id:"hn",          label:"Harvey Norman",         total:610,  onTrack:581,  atRisk:21, critical:5,  needsDecision:4, avgConf:0.88, trend:"stable",    color:"text-purple-400", bar:"bg-purple-500" },
  { id:"insurance",   label:"Insurance Repair",      total:280,  onTrack:223,  atRisk:41, critical:11, needsDecision:9, avgConf:0.71, trend:"declining", color:"text-orange-400", bar:"bg-orange-500" },
  { id:"construction",label:"Construction / AHO",    total:520,  onTrack:486,  atRisk:27, critical:6,  needsDecision:5, avgConf:0.83, trend:"stable",    color:"text-cyan-400",   bar:"bg-cyan-500"   },
  { id:"fm",          label:"Facilities Management", total:360,  onTrack:332,  atRisk:19, critical:7,  needsDecision:6, avgConf:0.78, trend:"improving", color:"text-teal-400",   bar:"bg-teal-500"   },
];

// ─── Decisions ────────────────────────────────────────────────────────────────
const DECISIONS = [
  { id:"JOB-2847", type:"Insurance Repair",  client:"IAG",           conf:0.61, autonomyLevel:2, label:"Carpenter out-of-zone approval required",        age:"6h ago",    urgency:"Act by 5pm — cascade to electrician",    rec:"Approve Terry Huang (+$180).", options:["Approve Terry Huang","Wait for in-zone","Escalate"] },
  { id:"JOB-2839", type:"Appliance Install",  client:"Harvey Norman", conf:0.34, autonomyLevel:3, label:"Shadow plan ready — activate Jordan Kim?",       age:"90m ago",   urgency:"Customer notified of delay",             rec:"Activate shadow plan. Pre-reserved at booking.", options:["Activate shadow plan","Call Sam Brooks","Cancel"] },
  { id:"JOB-2855", type:"Starlink Install",   client:"Starlink",      conf:0.71, autonomyLevel:3, label:"12 jobs — no evidence (4 days)",                 age:"3h ago",    urgency:"$3,588 invoicing blocked",               rec:"Call Mick Torres. Auto-suspension active.", options:["Call Mick Torres","Formal notice","Escalate to Logan"] },
  { id:"JOB-3089", type:"Insurance Repair",   client:"IAG",           conf:0.38, autonomyLevel:1, label:"Scope change +$1,400 — financial sign-off required",age:"1h ago", urgency:"Hard limit: financial >$1k",              rec:"Review evidence, approve if valid.", options:["Approve","Reject","Escalate to Paul Allen"] },
];

// ─── Supervisors ──────────────────────────────────────────────────────────────
const SUPERVISORS = [
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

// ─── AskAI ────────────────────────────────────────────────────────────────────
function AskAI({ context, placeholder }: { context: string; placeholder?: string }) {
  const [q,setQ]=useState(""); const [msgs,setMsgs]=useState<{role:string;content:string}[]>([]); const [loading,setLoading]=useState(false);
  const bot=useRef<HTMLDivElement>(null);
  useEffect(()=>{ bot.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  const ask=async()=>{
    if(!q.trim()||loading)return;
    const u=q.trim(); setQ(""); setMsgs(m=>[...m,{role:"user",content:u}]); setLoading(true);
    const sys=`You are the CoreTechX AI operations assistant for Circl (Australia). ~5,000 active Commitments, ~20,000/month. The platform uses Commitment confidence scores (0-1), pre-computed shadow plans, and a 4-level autonomy ladder. Agents earn autonomy through measured accuracy. Hard limits (financial >$1k, WHS, legal, enterprise client comms, police/fire) are permanently Level 1. Workflow configuration allows authorised users to adjust autonomy levels per step per job type, with audit logging. All changes require a reason and are immutable once logged.\nContext: ${context}\nAnswer directly, under 150 words.`;
    try {
      const res = await fetch("/api/anthropic", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[...msgs.map(m=>({role:m.role,content:m.content})),{role:"user",content:u}]})});
      const d=await res.json();
      setMsgs(m=>[...m,{role:"assistant",content:d.content?.find((b:{type:string;text:string})=>b.type==="text")?.text||"No response."}]);
    } catch { setMsgs(m=>[...m,{role:"assistant",content:"Unable to reach AI."}]); }
    setLoading(false);
  };
  return (
    <div>
      <div className="overflow-y-auto space-y-2 mb-3 pr-1" style={{maxHeight:"160px"}}>
        {msgs.length===0&&<p className="text-gray-500 text-xs italic">{placeholder||"Ask..."}</p>}
        {msgs.map((m,i)=>(
          <div key={i} className={`text-sm rounded-lg px-3 py-2 ${m.role==="user"?"bg-gray-700 text-gray-100 ml-6":"bg-indigo-950 text-indigo-100 mr-6 border border-indigo-800"}`}>
            <span className="font-semibold text-xs uppercase tracking-wide opacity-60 block mb-1">{m.role==="user"?"You":"CoreTechX AI"}</span>
            {m.content}
          </div>
        ))}
        {loading&&<div className="bg-indigo-950 border border-indigo-800 rounded-lg px-3 py-2 text-indigo-300 text-sm mr-6 animate-pulse">Thinking...</div>}
        <div ref={bot}/>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
          placeholder={placeholder||"Ask..."} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()}/>
        <button onClick={ask} disabled={loading||!q.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium">Ask</button>
      </div>
    </div>
  );
}

// ─── Workflow Config View ─────────────────────────────────────────────────────
function WorkflowConfig({ canConfig, onBack }: { canConfig: boolean; onBack: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState("starlink");
  const [pendingChange, setPendingChange] = useState<{stepId:string;newLevel:number}|null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [committed, setCommitted] = useState<Record<string,{level:number;reason:string;date:string}>>({});
  const [showAudit, setShowAudit] = useState(false);

  const template = WORKFLOW_TEMPLATES.find(t=>t.id===selectedTemplate)!;

  const effectiveLevel = (step: (typeof WORKFLOW_TEMPLATES)[0]['steps'][0]): keyof typeof LM =>
    (committed[step.id]?.level ?? step.level) as keyof typeof LM;

  const commitChange = () => {
    if (!changeReason.trim()) return;
    setCommitted(c=>({...c,[pendingChange!.stepId]:{level:pendingChange!.newLevel, reason:changeReason, date:"Now (prototype)"}}));
    setPendingChange(null);
    setChangeReason("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 text-sm">← System Health</button>
        <div className="flex items-center gap-2">
          {canConfig
            ? <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full font-medium">✓ Config access — Aaron</span>
            : <span className="text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full">Read-only — configuration requires Aaron sign-off</span>
          }
        </div>
      </div>

      <div>
        <h2 className="text-white font-bold text-lg">Workflow Configuration</h2>
        <p className="text-gray-500 text-xs mt-0.5">Autonomy levels per workflow step. Changes are logged, require a reason, and are immutable once committed.</p>
      </div>

      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {WORKFLOW_TEMPLATES.map(t=>(
          <button key={t.id} onClick={()=>setSelectedTemplate(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedTemplate===t.id?"bg-indigo-700 border-indigo-500 text-white":"bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-600"}`}>
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Template header */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm">{template.icon} {template.label}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{template.description}</p>
            <p className="text-gray-500 text-xs mt-0.5">Client: {template.client}</p>
          </div>
          <button onClick={()=>setShowAudit(a=>!a)} className="text-indigo-400 hover:text-indigo-300 text-xs underline">
            {showAudit?"Hide audit log":"View audit log"}
          </button>
        </div>

        {/* Level summary bar */}
        <div className="flex gap-1 rounded-lg overflow-hidden h-2 mb-2">
          {template.steps.map(s=>{
            const lv=effectiveLevel(s);
            const lm=lv==="hard"?LM.hard:LM[lv];
            return <div key={s.id} className={`flex-1 ${lm.bar} opacity-80`} title={s.name}/>;
          })}
        </div>
        <div className="flex gap-2 flex-wrap text-xs">
          {[4,3,2,1].map(l=>{
            const count=template.steps.filter(s=>!s.hard&&effectiveLevel(s)===l).length;
            if(!count)return null;
            return <span key={l} className={`px-2 py-0.5 rounded-full ${LM[l as keyof typeof LM].badge}`}>{LM[l as keyof typeof LM].long}: {count}</span>;
          })}
          {template.steps.filter(s=>s.hard).length>0&&(
            <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400">🔒 Hard limits: {template.steps.filter(s=>s.hard).length}</span>
          )}
        </div>
      </div>

      {/* Workflow steps */}
      <div className="space-y-2">
        {template.steps.map((step, idx) => {
          const lv = effectiveLevel(step);
          const lm = step.hard ? LM.hard : LM[lv];
          const changed = !!committed[step.id];
          const isPending = pendingChange?.stepId === step.id;

          return (
            <div key={step.id} className={`rounded-xl border p-4 transition-colors ${step.hard?"bg-red-950/10 border-red-900/40":changed?"bg-indigo-950/20 border-indigo-800":"bg-gray-800 border-gray-700"}`}>
              <div className="flex items-start gap-3">
                {/* Step number */}
                <span className="text-gray-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">{idx+1}.</span>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-semibold text-sm">{step.name}</span>
                    {step.agent!=="—"&&<span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">{step.agent}</span>}
                    {changed&&<span className="text-xs text-indigo-300 bg-indigo-900 px-2 py-0.5 rounded">Modified in session</span>}
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{step.note}</p>

                  {/* Accuracy */}
                  {step.accuracy!==null&&(
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs">Accuracy:</span>
                        <span className={`text-xs font-mono font-bold ${step.accuracy>=0.95?"text-green-400":step.accuracy>=0.85?"text-blue-400":step.accuracy>=0.75?"text-yellow-400":"text-orange-400"}`}>{(step.accuracy*100).toFixed(0)}%</span>
                      </div>
                      {step.trend&&<span className={`text-xs ${step.trend==="improving"?"text-green-500":step.trend==="declining"?"text-orange-400":"text-gray-500"}`}>{step.trend==="improving"?"↑ improving":step.trend==="declining"?"↓ declining":"→ stable"}</span>}
                      {step.decisions>0&&<span className="text-xs text-yellow-500">{step.decisions} decisions this month</span>}
                    </div>
                  )}

                  {/* Pending change form */}
                  {isPending&&canConfig&&(
                    <div className="bg-indigo-950/40 border border-indigo-800 rounded-lg p-3 mb-2">
                      <p className="text-indigo-300 text-xs font-semibold mb-2">
                        Proposing: {lm.long} → {LM[pendingChange!.newLevel as keyof typeof LM].long}
                      </p>
                      <textarea
                        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-xs border border-gray-600 focus:outline-none focus:border-indigo-500 mb-2 resize-none"
                        rows={2} placeholder="Required: reason for this change and evidence of accuracy..."
                        value={changeReason} onChange={e=>setChangeReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={commitChange} disabled={!changeReason.trim()}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium">
                          Commit change
                        </button>
                        <button onClick={()=>{setPendingChange(null);setChangeReason("");}}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg">
                          Cancel
                        </button>
                      </div>
                      <p className="text-gray-600 text-xs mt-1.5">This action will be logged with your name, timestamp, and reason. It cannot be undone.</p>
                    </div>
                  )}
                </div>

                {/* Level badge + controls */}
                <div className="flex-shrink-0 text-right">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${lm.badge} ${lm.ring}`}>
                    {step.hard&&<span>🔒</span>}
                    <span>{lm.label}</span>
                    <span className="opacity-70 font-normal hidden sm:inline">— {lm.long}</span>
                  </div>

                  {/* Adjust controls */}
                  {canConfig&&!step.hard&&!isPending&&(
                    <div className="flex gap-1 mt-2 justify-end">
                      {(lv as number)>1&&(
                        <button onClick={()=>setPendingChange({stepId:step.id,newLevel:(lv as number)-1})}
                          className="text-xs bg-gray-700 hover:bg-red-900 text-gray-400 hover:text-red-300 px-2 py-1 rounded font-mono transition-colors">
                          ↓ Level {(lv as number)-1}
                        </button>
                      )}
                      {(lv as number)<4&&(
                        <button onClick={()=>setPendingChange({stepId:step.id,newLevel:(lv as number)+1})}
                          className={`text-xs px-2 py-1 rounded font-mono transition-colors ${(step.accuracy??0)>=0.95?"bg-green-900 hover:bg-green-800 text-green-300":"bg-gray-700 hover:bg-blue-900 text-gray-400 hover:text-blue-300"}`}>
                          ↑ Level {(lv as number)+1}
                        </button>
                      )}
                    </div>
                  )}
                  {!canConfig&&!step.hard&&(
                    <p className="text-gray-600 text-xs mt-1">Aaron sign-off required</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit log */}
      {showAudit&&(
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold text-sm mb-3">Audit Log — All Workflows</h3>
          <p className="text-gray-500 text-xs mb-3">All changes are immutable once committed. Retrospective alteration is not permitted.</p>
          <div className="space-y-2">
            {AUDIT_LOG.map((e,i)=>(
              <div key={i} className={`rounded-lg p-3 border text-xs ${e.type==="policy"?"bg-red-950/20 border-red-900/40":e.type==="demote"?"bg-orange-950/20 border-orange-900/40":"bg-green-950/20 border-green-900/40"}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-gray-300 font-semibold">{e.user}</span>
                  <span className="text-gray-600">{e.date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${e.type==="policy"?"bg-red-900 text-red-300":e.type==="demote"?"bg-orange-900 text-orange-300":"bg-green-900 text-green-300"}`}>
                    {e.type==="policy"?"Policy":e.type==="demote"?"Auto-demoted":"Promoted"}
                  </span>
                </div>
                <p className="text-white font-medium mb-0.5">{e.action}</p>
                <p className="text-gray-400">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Ask AI about workflow configuration</h3>
        <AskAI context={`Workflow config for ${template.label}. ${template.steps.length} steps. Current autonomy distribution: ${[4,3,2,1].map(l=>`Level ${l}: ${template.steps.filter(s=>effectiveLevel(s)===l).length}`).join(", ")}. Hard limits: ${template.steps.filter(s=>s.hard).length}.`}
          placeholder="e.g. What would need to be true before I could promote scope assessment to Level 3?"/>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]     = useState("dashboard");
  const [persona, setPersona] = useState("logan");
  const [expandedPattern, setExpandedPattern] = useState<string|null>(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [decisionsDone, setDecisionsDone] = useState<Record<string,string>>({});
  const [expandedSup, setExpandedSup] = useState<string|null>(null);
  const [loggedInspections, setLogged] = useState<Record<string,boolean>>({});

  const P = PERSONAS.find(p=>p.id===persona)!;
  const jobTypes = JOB_TYPES.filter(jt=>P.types.includes(jt.id));
  const decisions = DECISIONS.filter(d=>{
    if(persona==="aaron"||persona==="national")return true;
    if(persona==="logan")return d.type==="Appliance Install"||d.type==="Starlink Install";
    if(persona==="blake")return d.type==="FM Emergency";
    if(persona==="conner")return d.type==="Construction / AHO";
    return true;
  });
  const TOTAL     = jobTypes.reduce((a,t)=>a+t.total,0);
  const TOTAL_DEC = jobTypes.reduce((a,t)=>a+t.needsDecision,0);
  const TOTAL_ON  = jobTypes.reduce((a,t)=>a+t.onTrack,0);
  const noActivity = TODAY_JOBS.filter(j=>j.geo==="no_activity"||j.geo==="unassigned");
  const isLogan   = persona==="logan";
  const isAaron   = persona==="aaron";

  const PATTERNS = [
    { id:"P-041", region:"North East", severity:"high",   icon:"📍", title:"Coverage gap — Starlink, QLD regional", detail:"4 unresponsive trade incidents in Tweed Heads this week. Shadow plans activating repeatedly. Targeted recruitment required.", type:"Systemic", affected:"11 Commitments", action:"Raise recruitment request" },
    { id:"P-039", region:"North East", severity:"high",   icon:"📷", title:"Evidence non-submission — NSW corridor", detail:"3 Starlink installers in Newcastle have zero photos across 28 combined jobs this week. Possible app issue or training gap.", type:"Quality", affected:"28 Commitments", action:"Investigate app + training" },
  ].filter(()=>isLogan||isAaron||persona==="national");

  const navBg = "min-h-screen bg-gray-900 text-white p-4 md:p-6";
  const maxW   = "max-w-4xl mx-auto";

  if (view==="workflow") return (
    <div className={navBg}><div className={maxW}>
      <div className="flex items-center gap-3 mb-6"><div className="text-indigo-400 font-bold text-lg">CoreTechX</div><span className="text-gray-600 text-xs">Mission Control — v6</span></div>
      <WorkflowConfig canConfig={P.canConfig} onBack={()=>setView("dashboard")}/>
    </div></div>
  );

  if (view==="decisions") return (
    <div className={navBg}><div className={maxW + " space-y-5"}>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={()=>setView("dashboard")} className="text-indigo-400 hover:text-indigo-300 text-sm">← System Health</button>
        <div className="text-indigo-400 font-bold text-lg">CoreTechX</div>
      </div>
      <div><h2 className="text-white font-bold text-lg">Decision Queue</h2><p className="text-gray-500 text-xs">{decisions.length} items — {P.region}</p></div>
      <div className="space-y-3">
        {decisions.map(dec=>{
          const done=decisionsDone[dec.id]; const lm=LM[dec.autonomyLevel as keyof typeof LM];
          return (
            <div key={dec.id} className={`border rounded-xl p-4 ${done?"bg-green-950/20 border-green-900":"bg-gray-800 border-gray-700"}`}>
              {done?(<div className="flex justify-between"><span className="text-white font-mono text-sm">{dec.id}</span><span className="text-green-400 text-sm">✓ {done}</span></div>):(
                <>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-mono text-sm font-semibold">{dec.id}</span>
                        <span className="text-gray-500 text-xs bg-gray-700 px-2 py-0.5 rounded">{dec.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lm.badge}`}>{lm.long}</span>
                        {dec.autonomyLevel===1&&<span className="text-xs text-red-400">🔒</span>}
                      </div>
                      <p className="text-red-300 text-sm font-semibold">{dec.label}</p>
                    </div>
                    <span className={`text-xl font-bold font-mono ${cc(dec.conf)}`}>{dec.conf.toFixed(2)}</span>
                  </div>
                  <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-3 mb-3">
                    <p className="text-xs text-orange-300 font-medium mb-1">⏱ {dec.urgency}</p>
                    <p className="text-xs text-red-300 font-semibold uppercase tracking-wide mb-1">AI Recommendation</p>
                    <p className="text-gray-200 text-sm">{dec.rec}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">{dec.options.map((o,i)=><button key={i} onClick={()=>setDecisionsDone(d=>({...d,[dec.id]:o}))} className={`text-sm px-3 py-1.5 rounded-lg font-medium ${i===0?"bg-indigo-600 hover:bg-indigo-500 text-white":"bg-gray-700 hover:bg-gray-600 text-gray-200"}`}>{o}</button>)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div></div>
  );

  // ── Main dashboard ───────────────────────────────────────────────────────────
  return (
    <div className={navBg}><div className={maxW + " space-y-5"}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><div className="text-indigo-400 font-bold text-xl tracking-tight">CoreTechX</div><p className="text-gray-500 text-xs">Mission Control — System Health</p></div>
        <span className="text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">10x Labs · v6</span>
      </div>

      {/* Persona switcher */}
      <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
        <p className="text-gray-500 text-xs mb-2">Viewing as:</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>setPersona(p.id)} className={`text-sm px-3 py-2 rounded-lg font-medium border transition-colors ${persona===p.id?"bg-indigo-700 border-indigo-500 text-white":"bg-gray-700 border-gray-600 text-gray-300 hover:border-indigo-600"}`}>
              <span className="font-semibold">{p.label}</span>
              <span className={`block text-xs mt-0.5 ${persona===p.id?"text-indigo-300":"text-gray-500"}`}>{p.region}</span>
            </button>
          ))}
        </div>
        {isAaron&&<p className="text-green-400 text-xs mt-2">✓ Workflow configuration access enabled for this session</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="bg-gray-800 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-gray-400 text-xs mb-1">Active Commitments</p>
          <p className="text-3xl font-bold text-white">{fmt(TOTAL)}</p>
          <p className="text-gray-500 text-xs mt-1">{P.region}</p>
        </div>
        {isLogan&&(
          <div className={`rounded-xl p-4 ${noActivity.length>0?"bg-yellow-950 border border-yellow-800":"bg-gray-800"}`}>
            <p className={`text-xs mb-1 ${noActivity.length>0?"text-yellow-400":"text-gray-400"}`}>No geo activity today</p>
            <p className={`text-3xl font-bold ${noActivity.length>0?"text-yellow-300":"text-white"}`}>{noActivity.length}</p>
            <button onClick={()=>setView("decisions")} className="text-xs mt-1 underline text-yellow-400">View →</button>
          </div>
        )}
        <div className={`rounded-xl p-4 ${TOTAL_DEC>0?"bg-red-950 border border-red-800":"bg-gray-800"}`}>
          <p className={`text-xs mb-1 ${TOTAL_DEC>0?"text-red-400":"text-gray-400"}`}>Needs Decision</p>
          <p className={`text-3xl font-bold ${TOTAL_DEC>0?"text-red-300":"text-white"}`}>{TOTAL_DEC}</p>
          <button onClick={()=>setView("decisions")} className={`text-xs mt-1 underline ${TOTAL_DEC>0?"text-red-400":"text-gray-600"}`}>View queue →</button>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Fully Automated</p>
          <p className="text-3xl font-bold text-green-400">{fmt(TOTAL_ON)}</p>
          <p className="text-gray-500 text-xs mt-1">{TOTAL>0?Math.round(TOTAL_ON/TOTAL*100):0}%</p>
        </div>
      </div>

      {/* Morning briefing */}
      {!briefingDismissed&&(
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-white font-semibold text-sm">Morning Briefing</h2><p className="text-gray-500 text-xs mt-0.5">Overnight activity surfaced automatically</p></div>
            <button onClick={()=>setBriefingDismissed(true)} className="text-gray-600 hover:text-gray-400 text-xs">Dismiss</button>
          </div>
          <div className="space-y-2">
            {[
              { severity:"high",   icon:"📷", msg:"Mick Torres: 12 installs, 0 photos (4 days). Suspended from new allocations." },
              { severity:"high",   icon:"🔒", msg:"Ryan Patel's public liability expired. Removed from pool — 3 jobs tomorrow need reallocation." },
              { severity:"medium", icon:"📋", msg:"JOB-2862 (Harvey Norman) scheduled tomorrow. No trade allocated. 26h to deadline." },
            ].map((item,i)=>(
              <div key={i} className={`rounded-lg p-3 flex items-start gap-3 ${item.severity==="high"?"bg-red-950/60 border border-red-900":"bg-yellow-950/30 border border-yellow-900"}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <p className={`text-xs flex-1 ${item.severity==="high"?"text-red-200":"text-yellow-200"}`}>{item.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's schedule — Logan only */}
      {isLogan&&(
        <div className="bg-gray-800 rounded-xl p-4 border border-yellow-800">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-white font-semibold text-sm">Today's Schedule</h2><p className="text-gray-500 text-xs">North East · {TODAY_JOBS.length} jobs · 9:18am</p></div>
            <div className="text-right"><span className="text-yellow-300 font-bold">{noActivity.length} at risk</span><p className="text-gray-500 text-xs">{TODAY_JOBS.filter(j=>j.geo==="confirmed"||j.geo==="en_route").length} confirmed</p></div>
          </div>
          <div className="flex gap-0.5 rounded-full overflow-hidden h-2 mb-3">
            {TODAY_JOBS.map(j=><div key={j.id} className={`flex-1 ${j.geo==="confirmed"||j.geo==="en_route"?"bg-green-500":j.geo==="no_activity"&&j.minsToWindow<0?"bg-red-500 animate-pulse":j.geo==="no_activity"?"bg-yellow-500":j.geo==="unassigned"?"bg-gray-600":"bg-blue-500"}`} title={j.trade}/>)}
          </div>
          <div className="space-y-1">
            {TODAY_JOBS.map(j=>{
              const g=geoLabel(j.geo,j.minsToWindow);
              return(
                <div key={j.id} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${j.geo==="no_activity"&&j.minsToWindow<0?"bg-red-950/30 border border-red-900/40":"bg-gray-700/30"}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.dot}`}/>
                  <span className="text-gray-300 font-mono w-20 flex-shrink-0">{j.id}</span>
                  <span className="text-gray-400 w-28 flex-shrink-0 truncate">{j.trade}</span>
                  <span className="text-gray-500 flex-1 truncate">{j.suburb}</span>
                  <span className="text-gray-500 w-18 flex-shrink-0">{j.window}</span>
                  <span className={`flex-shrink-0 w-52 text-right ${g.text}`}>{g.label}{j.geoTime?` · ${j.geoTime}`:""}</span>
                  <span className={`font-mono font-bold flex-shrink-0 ${cc(j.conf)}`}>{j.conf.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job type health */}
      <div>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Job Type Health</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jobTypes.map(jt=>(
            <div key={jt.id} className={`bg-gray-800 rounded-xl p-4 border ${jt.trend==="declining"?"border-orange-800":jt.trend==="improving"?"border-green-800/40":"border-gray-700"}`}>
              <div className="flex items-start justify-between mb-2">
                <div><p className={`text-sm font-semibold ${jt.color}`}>{jt.label}</p><p className="text-gray-500 text-xs">{fmt(jt.total)} active</p></div>
                <div className="text-right"><span className={`text-xl font-bold font-mono ${cc(jt.avgConf)}`}>{jt.avgConf.toFixed(2)}</span><p className={`text-xs ${jt.trend==="declining"?"text-orange-400":jt.trend==="improving"?"text-green-400":"text-gray-500"}`}>{jt.trend==="declining"?"↓":jt.trend==="improving"?"↑":"→"} {jt.trend}</p></div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2"><div className={`h-1.5 rounded-full ${cb(jt.avgConf)}`} style={{width:`${jt.avgConf*100}%`}}/></div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">{fmt(jt.onTrack)} automated</span>
                <span className="text-yellow-600">{jt.atRisk} at risk</span>
                <span className={`font-semibold ${jt.needsDecision>0?"text-red-400":"text-gray-600"}`}>{jt.needsDecision} decisions</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field supervisors — Logan only */}
      {isLogan&&(
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-white font-semibold text-sm mb-3">Field Supervisors — North East</h2>
          <div className="space-y-3">
            {SUPERVISORS.map(s=>{
              const sPct=Math.round(s.safety.done/s.safety.target*100);
              const qPct=Math.round(s.quality.done/s.quality.target*100);
              const behind=sPct<50||qPct<50;
              const open=expandedSup===s.id;
              return(
                <div key={s.id} className={`rounded-xl border ${behind?"bg-orange-950/20 border-orange-900":"bg-gray-700/30 border-gray-600"}`}>
                  <button className="w-full p-3 text-left" onClick={()=>setExpandedSup(open?null:s.id)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><div className="flex items-center gap-2"><span className="text-white font-semibold text-sm">{s.name}</span>{s.avoidanceFlag&&<span className="text-xs text-orange-400">⚠</span>}</div><p className="text-gray-500 text-xs">{s.region}</p></div>
                      <span className="text-indigo-400 text-xs">{open?"▲ Close":"▼ Inspect queue"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[{label:"Safety",v:s.safety,pct:sPct},{label:"Quality",v:s.quality,pct:qPct}].map(k=>(
                        <div key={k.label}>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{k.label}</span><span className={k.pct>=80?"text-green-400":k.pct>=50?"text-yellow-400":"text-orange-400"}>{k.v.done}/{k.v.target}</span></div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${k.pct>=80?"bg-green-500":k.pct>=50?"bg-yellow-500":"bg-orange-500"}`} style={{width:`${k.pct}%`}}/></div>
                        </div>
                      ))}
                    </div>
                  </button>
                  {open&&(
                    <div className="px-3 pb-3 border-t border-gray-600/50 pt-3 space-y-2">
                      {s.avoidanceFlag&&<div className="bg-orange-950/40 border border-orange-800 rounded-lg px-3 py-2"><p className="text-orange-300 text-xs">⚠ {s.avoidanceFlag}</p></div>}
                      <p className="text-gray-500 text-xs">AI-generated inspection queue — ranked by trade risk profile</p>
                      {s.inspectionQueue.map((t,i)=>{
                        const logged=loggedInspections[`${s.id}-${t.trade}`];
                        const pc=t.priority==="critical"?"bg-red-900 text-red-200":t.priority==="high"?"bg-orange-900 text-orange-200":t.priority==="medium"?"bg-yellow-900 text-yellow-200":"bg-gray-700 text-gray-400";
                        return(
                          <div key={i} className={`rounded-lg p-3 border ${logged?"bg-green-950/20 border-green-900":"bg-gray-700/40 border-gray-600"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="text-white text-sm font-semibold">{t.trade}</span><span className={`text-xs px-1.5 py-0.5 rounded-full ${pc}`}>{t.priority}</span><span className="text-yellow-400 text-xs">{t.rating}★</span></div>
                                <p className="text-gray-400 text-xs">{t.reason}</p>
                                <p className="text-gray-600 text-xs mt-0.5">Last: {t.lastInspected} · {t.jobsSince} jobs since · {t.complaints} complaint{t.complaints!==1?"s":""}</p>
                              </div>
                              {logged?<span className="text-green-400 text-xs">✓ Logged</span>:<button onClick={()=>setLogged(l=>({...l,[`${s.id}-${t.trade}`]:true}))} className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium">Log</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patterns */}
      {PATTERNS.length>0&&(
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Systemic Patterns</h2>
          <div className="space-y-3">
            {PATTERNS.map(p=>(
              <div key={p.id} className={`rounded-xl border ${p.severity==="high"?"bg-red-950/30 border-red-900":"bg-yellow-950/20 border-yellow-900"}`}>
                <button className="w-full p-4 text-left" onClick={()=>setExpandedPattern(expandedPattern===p.id?null:p.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3"><span className="text-base">{p.icon}</span><div><p className={`text-sm font-semibold ${p.severity==="high"?"text-red-200":"text-yellow-200"}`}>{p.title}</p><div className="flex gap-2 mt-1"><span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.type}</span><span className="text-xs text-gray-500">{p.affected}</span></div></div></div>
                    <span className="text-gray-600 text-xs">{expandedPattern===p.id?"▲":"▼"}</span>
                  </div>
                </button>
                {expandedPattern===p.id&&<div className="px-4 pb-4 border-t border-gray-700/50 pt-3 space-y-3"><p className="text-gray-300 text-sm">{p.detail}</p><button className={`text-sm px-4 py-2 rounded-lg font-medium ${p.severity==="high"?"bg-red-800 hover:bg-red-700 text-white":"bg-yellow-900 text-yellow-200"}`}>{p.action}</button></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow config entry point */}
      <div className={`rounded-xl border p-4 ${isAaron?"bg-indigo-950/20 border-indigo-800":"bg-gray-800 border-gray-700"}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-semibold text-sm">Workflow Configuration</h2>
            <p className="text-gray-500 text-xs mt-0.5">Autonomy levels per step, per job type. Accuracy-tracked. Audit-logged.</p>
          </div>
          <button onClick={()=>setView("workflow")} className={`text-xs underline flex-shrink-0 ${isAaron?"text-indigo-300 hover:text-indigo-200":"text-gray-500 hover:text-gray-400"}`}>
            {isAaron?"Configure →":"View (read-only) →"}
          </button>
        </div>
        <div className="flex gap-1 rounded-lg overflow-hidden h-2 mb-2">
          {[4,3,2,1].map(l=>{const c=WORKFLOW_TEMPLATES[0].steps.filter(s=>s.level===l).length;return c>0?<div key={l} className={`${LM[l as keyof typeof LM].bar} opacity-70`} style={{flex:c}}/>:null;})}
          <div className="bg-red-800 opacity-70" style={{flex:2}}/>
        </div>
        {!isAaron&&<p className="text-gray-600 text-xs mt-1">Adjusting autonomy levels requires Aaron sign-off.</p>}
        {isAaron&&<p className="text-green-400 text-xs mt-1">You have configuration access. All changes are immutably logged.</p>}
      </div>

      {/* AI */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-1">Ask AI</h2>
        <p className="text-gray-500 text-xs mb-3">{P.label} · {P.region}</p>
        <AskAI context={`${P.label} (${P.region}): ${fmt(TOTAL)} Commitments, ${TOTAL_DEC} decisions, ${fmt(TOTAL_ON)} automated. ${isAaron?"Has workflow configuration access.":""}`} placeholder="e.g. Which workflow step has the most room for autonomy promotion?"/>
      </div>

      <p className="text-gray-600 text-xs text-center pb-2">Concept prototype · v6 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );
}