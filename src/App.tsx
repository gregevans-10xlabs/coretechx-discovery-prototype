import { useState, useRef, useEffect } from "react";
import { cc, cb, fmt, LM, WORKFLOW_TEMPLATES, AUDIT_LOG, PERSONAS, TODAY_JOBS, geoLabel, JOB_TYPES, ALL_DECISIONS, SUPERVISORS, ALL_PATTERNS, MORNING } from "./data/scenarios";
import StaffPerformance from "./components/StaffPerformance";
import CoordinatorView from "./components/CoordinatorView";


// ─── AskAI ────────────────────────────────────────────────────────────────────
function FormatAI({ text }: { text: string }) {
  const renderInline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-semibold text-white">{p.slice(2,-2)}</strong>
        : p
    );

  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];

  const flushBullets = () => {
    if (bullets.length) {
      out.push(<ul key={out.length} className="list-disc list-inside space-y-0.5 my-1 pl-1">{bullets.map((b,i)=><li key={i}>{renderInline(b)}</li>)}</ul>);
      bullets = [];
    }
  };
  const flushNumbered = () => {
    if (numbered.length) {
      out.push(<ol key={out.length} className="list-decimal list-inside space-y-0.5 my-1 pl-1">{numbered.map((n,i)=><li key={i}>{renderInline(n)}</li>)}</ol>);
      numbered = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushBullets(); flushNumbered(); continue; }
    if (/^#{1,3}\s/.test(line)) {
      flushBullets(); flushNumbered();
      out.push(<p key={out.length} className="font-semibold text-white mt-2 mb-0.5">{renderInline(line.replace(/^#{1,3}\s/,""))}</p>);
    } else if (/^[-*•]\s+/.test(line)) {
      flushNumbered();
      bullets.push(line.replace(/^[-*•]\s+/,""));
    } else if (/^\d+\.\s+/.test(line)) {
      flushBullets();
      numbered.push(line.replace(/^\d+\.\s+/,""));
    } else {
      flushBullets(); flushNumbered();
      out.push(<p key={out.length} className="my-0.5 leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushBullets(); flushNumbered();
  return <>{out}</>;
}

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
            {m.role==="assistant" ? <FormatAI text={m.content}/> : m.content}
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
  const decisions = ALL_DECISIONS.filter(d=>{
    if(persona==="aaron"||persona==="national")return true;
    if(persona==="logan")return d.type==="Appliance Install"||d.type==="Starlink Install";
    if(persona==="blake")return d.type==="FM Emergency";
    if(persona==="conner")return d.type==="Construction / AHO";
    if(persona==="kerrie")return d.type==="Insurance Repair";
    return true;
  });
  const TOTAL     = jobTypes.reduce((a,t)=>a+t.total,0);
  const TOTAL_DEC = jobTypes.reduce((a,t)=>a+t.needsDecision,0);
  const TOTAL_ON  = jobTypes.reduce((a,t)=>a+t.onTrack,0);
  const noActivity = TODAY_JOBS.filter(j=>j.geo==="no_activity"||j.geo==="unassigned");
  const isLogan   = persona==="logan";
  const isAaron   = persona==="aaron";
  const isKerrie  = persona==="kerrie";

  const PATTERNS = ALL_PATTERNS.filter(()=>isLogan||isAaron||persona==="national");

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
      {!isKerrie&&<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
      </div>}

      {/* Morning briefing */}
      {!briefingDismissed&&(
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-white font-semibold text-sm">Morning Briefing</h2><p className="text-gray-500 text-xs mt-0.5">Overnight activity surfaced automatically</p></div>
            <button onClick={()=>setBriefingDismissed(true)} className="text-gray-600 hover:text-gray-400 text-xs">Dismiss</button>
          </div>
          <div className="space-y-2">
            {MORNING.map((item,i)=>(
              <div key={i} className={`rounded-lg p-3 flex items-start gap-3 ${item.severity==="high"?"bg-red-950/60 border border-red-900":"bg-yellow-950/30 border border-yellow-900"}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <p className={`text-xs flex-1 ${item.severity==="high"?"text-red-200":"text-yellow-200"}`}>{item.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff performance */}
      <StaffPerformance persona={persona}/>

      {/* Coordinator view — Kerrie only */}
      {isKerrie&&<CoordinatorView/>}

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
      {!isKerrie&&<div>
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
      </div>}

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