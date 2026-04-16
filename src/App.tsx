import { useState } from "react";
import { cc, cb, fmt, LM, WORKFLOW_TEMPLATES, AUDIT_LOG, PERSONAS, TODAY_JOBS, geoLabel, JOB_TYPES, ALL_DECISIONS, SUPERVISORS, ALL_PATTERNS, MORNING } from "./data/scenarios";
import AskAI from "./components/AskAI";
import StaffPerformance from "./components/StaffPerformance";
import ChekkuView from "./components/ChekkuView";
import CockpitView from "./components/CockpitView";
import PortfolioView from "./components/PortfolioView";
import FieldView from "./components/FieldView";

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
        <button onClick={onBack} className="text-[#00BDFE] hover:text-[#0099d4] text-sm">← System Health</button>
        <div className="flex items-center gap-2">
          {canConfig
            ? <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">✓ Config access — Aaron</span>
            : <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Read-only — configuration requires Aaron sign-off</span>
          }
        </div>
      </div>

      <div>
        <h2 className="text-slate-800 font-bold text-lg">Workflow Configuration</h2>
        <p className="text-slate-400 text-xs mt-0.5">Autonomy levels per workflow step. Changes are logged, require a reason, and are immutable once committed.</p>
      </div>

      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {WORKFLOW_TEMPLATES.map(t=>(
          <button key={t.id} onClick={()=>setSelectedTemplate(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedTemplate===t.id?"bg-[#00BDFE] border-[#00BDFE] text-white":"bg-white border-slate-300 text-slate-600 hover:border-[#00BDFE]"}`}>
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Template header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-slate-800 font-semibold text-sm">{template.icon} {template.label}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{template.description}</p>
            <p className="text-slate-400 text-xs mt-0.5">Client: {template.client}</p>
          </div>
          <button onClick={()=>setShowAudit(a=>!a)} className="text-[#00BDFE] hover:text-[#0099d4] text-xs underline">
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
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">🔒 Hard limits: {template.steps.filter(s=>s.hard).length}</span>
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
            <div key={step.id} className={`rounded-xl border p-4 transition-colors ${step.hard?"bg-red-50 border-red-200":changed?"bg-[#e0f7ff] border-[#00BDFE]/40":"bg-white border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <span className="text-slate-400 text-xs font-mono w-5 flex-shrink-0 mt-0.5">{idx+1}.</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-slate-800 font-semibold text-sm">{step.name}</span>
                    {step.agent!=="—"&&<span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{step.agent}</span>}
                    {changed&&<span className="text-xs text-[#0099d4] bg-[#e0f7ff] px-2 py-0.5 rounded">Modified in session</span>}
                  </div>
                  <p className="text-slate-500 text-xs mb-2">{step.note}</p>

                  {step.accuracy!==null&&(
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-xs">Accuracy:</span>
                        <span className={`text-xs font-mono font-bold ${step.accuracy>=0.95?"text-green-600":step.accuracy>=0.85?"text-[#0099d4]":step.accuracy>=0.75?"text-amber-600":"text-orange-500"}`}>{(step.accuracy*100).toFixed(0)}%</span>
                      </div>
                      {step.trend&&<span className={`text-xs ${step.trend==="improving"?"text-green-500":step.trend==="declining"?"text-orange-400":"text-slate-400"}`}>{step.trend==="improving"?"↑ improving":step.trend==="declining"?"↓ declining":"→ stable"}</span>}
                      {step.decisions>0&&<span className="text-xs text-amber-600">{step.decisions} decisions this month</span>}
                    </div>
                  )}

                  {isPending&&canConfig&&(
                    <div className="bg-[#e0f7ff] border border-[#00BDFE]/40 rounded-lg p-3 mb-2">
                      <p className="text-[#0099d4] text-xs font-semibold mb-2">
                        Proposing: {lm.long} → {LM[pendingChange!.newLevel as keyof typeof LM].long}
                      </p>
                      <textarea
                        className="w-full bg-white text-slate-800 rounded-lg px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-[#00BDFE] mb-2 resize-none"
                        rows={2} placeholder="Required: reason for this change and evidence of accuracy..."
                        value={changeReason} onChange={e=>setChangeReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={commitChange} disabled={!changeReason.trim()}
                          className="text-xs bg-[#00BDFE] hover:bg-[#0099d4] disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium">
                          Commit change
                        </button>
                        <button onClick={()=>{setPendingChange(null);setChangeReason("");}}
                          className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg">
                          Cancel
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5">This action will be logged with your name, timestamp, and reason. It cannot be undone.</p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${lm.badge} ${lm.ring}`}>
                    {step.hard&&<span>🔒</span>}
                    <span>{lm.label}</span>
                    <span className="opacity-70 font-normal hidden sm:inline">— {lm.long}</span>
                  </div>

                  {canConfig&&!step.hard&&!isPending&&(
                    <div className="flex gap-1 mt-2 justify-end">
                      {(lv as number)>1&&(
                        <button onClick={()=>setPendingChange({stepId:step.id,newLevel:(lv as number)-1})}
                          className="text-xs bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-2 py-1 rounded font-mono transition-colors">
                          ↓ Level {(lv as number)-1}
                        </button>
                      )}
                      {(lv as number)<4&&(
                        <button onClick={()=>setPendingChange({stepId:step.id,newLevel:(lv as number)+1})}
                          className={`text-xs px-2 py-1 rounded font-mono transition-colors ${(step.accuracy??0)>=0.95?"bg-green-50 hover:bg-green-100 text-green-700":"bg-slate-100 hover:bg-[#e0f7ff] text-slate-500 hover:text-[#0099d4]"}`}>
                          ↑ Level {(lv as number)+1}
                        </button>
                      )}
                    </div>
                  )}
                  {!canConfig&&!step.hard&&(
                    <p className="text-slate-400 text-xs mt-1">Aaron sign-off required</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit log */}
      {showAudit&&(
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="text-slate-800 font-semibold text-sm mb-3">Audit Log — All Workflows</h3>
          <p className="text-slate-400 text-xs mb-3">All changes are immutable once committed. Retrospective alteration is not permitted.</p>
          <div className="space-y-2">
            {AUDIT_LOG.map((e,i)=>(
              <div key={i} className={`rounded-lg p-3 border text-xs ${e.type==="policy"?"bg-red-50 border-red-200":e.type==="demote"?"bg-orange-50 border-orange-200":"bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-slate-700 font-semibold">{e.user}</span>
                  <span className="text-slate-400">{e.date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${e.type==="policy"?"bg-red-100 text-red-700":e.type==="demote"?"bg-orange-100 text-orange-700":"bg-green-100 text-green-700"}`}>
                    {e.type==="policy"?"Policy":e.type==="demote"?"Auto-demoted":"Promoted"}
                  </span>
                </div>
                <p className="text-slate-800 font-medium mb-0.5">{e.action}</p>
                <p className="text-slate-500">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h3 className="text-slate-800 font-semibold text-sm mb-3">Ask AI about workflow configuration</h3>
        <AskAI context={`Workflow config for ${template.label}. ${template.steps.length} steps. Current autonomy distribution: ${[4,3,2,1].map(l=>`Level ${l}: ${template.steps.filter(s=>effectiveLevel(s)===l).length}`).join(", ")}. Hard limits: ${template.steps.filter(s=>s.hard).length}.`}
          placeholder="e.g. What would need to be true before I could promote scope assessment to Level 3?"/>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ALL_PERSONAS = [
  ...PERSONAS,
  { id:"chekku", label:"Marcus", title:"Trade — MJ Electrical Services", region:"Sydney Metro", types:[], canConfig:false },
];

export default function App() {
  const [view, setView]     = useState("dashboard");
  const [persona, setPersona] = useState("logan");
  const [expandedPattern, setExpandedPattern] = useState<string|null>(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);
  const [decisionsDone, setDecisionsDone] = useState<Record<string,string>>({});
  const [expandedSup, setExpandedSup] = useState<string|null>(null);
  const [loggedInspections, setLogged] = useState<Record<string,boolean>>({});

  const isChekku  = persona === "chekku";
  const isPortfolio = persona === "aaron" || persona === "national";
  const isField    = persona === "conner" || persona === "blake";

  const P = ALL_PERSONAS.find(p=>p.id===persona)!;
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

  const bg  = "min-h-screen bg-[#f5f6f8] p-4 md:p-6";
  const maxW = (isLogan||isKerrie||isPortfolio||isField||isChekku) ? "max-w-[1920px] mx-auto" : "max-w-4xl mx-auto";

  // ── Shared header + persona switcher ─────────────────────────────────────
  const sharedHeader = (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/circl-logo.svg" alt="Circl" className="h-8" />
          <div>
            <p className="text-slate-500 text-xs">
              {isChekku ? "Chekku — Trade Portal" : "Mission Control — System Health"}
            </p>
          </div>
        </div>
        <span className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full">10x Labs · v7</span>
      </div>
      <div className="bg-white rounded-xl p-3 border border-slate-200">
        <p className="text-slate-400 text-xs mb-2">Viewing as:</p>
        <div className="flex flex-wrap gap-2">
          {ALL_PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>setPersona(p.id)} className={`text-sm px-3 py-2 rounded-lg font-medium border transition-colors ${persona===p.id?"bg-[#00BDFE] border-[#00BDFE] text-white":"bg-white border-slate-200 text-slate-600 hover:border-[#00BDFE]"}`}>
              <span className="font-semibold">{p.label}</span>
              <span className={`block text-xs mt-0.5 ${persona===p.id?"text-white/80":"text-slate-400"}`}>{p.region}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // ── Chekku trade view ──────────────────────────────────────────────────────
  if (isChekku) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <ChekkuView />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );

  // ── Workflow view — checked before portfolio so Aaron can reach it ─────────
  if (view==="workflow") return (
    <div className={bg}><div className={maxW}>
      <div className="flex items-center gap-3 mb-6">
        <img src="/circl-logo.svg" alt="Circl" className="h-7" />
        <span className="text-slate-400 text-xs">Mission Control — v7</span>
      </div>
      <WorkflowConfig canConfig={P.canConfig} onBack={()=>setView("dashboard")}/>
    </div></div>
  );

  // ── Portfolio view — Aaron and National ───────────────────────────────────
  if (isPortfolio) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <PortfolioView persona={persona} onWorkflowConfig={() => setView("workflow")} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );

  // ── Field view — Conner and Blake ─────────────────────────────────────────
  if (isField) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <FieldView persona={persona} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );

  // ── Decisions view ─────────────────────────────────────────────────────────
  if (view==="decisions") return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={()=>setView("dashboard")} className="text-[#00BDFE] hover:text-[#0099d4] text-sm">← System Health</button>
        <img src="/circl-logo.svg" alt="Circl" className="h-6" />
      </div>
      <div><h2 className="text-slate-800 font-bold text-lg">Decision Queue</h2><p className="text-slate-400 text-xs">{decisions.length} items — {P.region}</p></div>
      <div className="space-y-3">
        {decisions.map(dec=>{
          const done=decisionsDone[dec.id]; const lm=LM[dec.autonomyLevel as keyof typeof LM];
          return (
            <div key={dec.id} className={`border rounded-xl p-4 ${done?"bg-green-50 border-green-200":"bg-white border-slate-200"}`}>
              {done?(<div className="flex justify-between"><span className="text-slate-700 font-mono text-sm">{dec.id}</span><span className="text-green-600 text-sm">✓ {done}</span></div>):(
                <>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-slate-800 font-mono text-sm font-semibold">{dec.id}</span>
                        <span className="text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded">{dec.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lm.badge}`}>{lm.long}</span>
                        {dec.autonomyLevel===1&&<span className="text-xs text-red-500">🔒</span>}
                      </div>
                      <p className="text-red-600 text-sm font-semibold">{dec.label}</p>
                    </div>
                    <span className={`text-xl font-bold font-mono ${cc(dec.conf)}`}>{dec.conf.toFixed(2)}</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-orange-600 font-medium mb-1">⏱ {dec.urgency}</p>
                    <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">AI Recommendation</p>
                    <p className="text-slate-700 text-sm">{dec.rec}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">{dec.options.map((o,i)=><button key={i} onClick={()=>setDecisionsDone(d=>({...d,[dec.id]:o}))} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${i===0?"bg-[#00BDFE] hover:bg-[#0099d4] text-white":"bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"}`}>{o}</button>)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div></div>
  );

  // ── Cockpit view — Logan and Kerrie ───────────────────────────────────────
  if (isLogan || isKerrie) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <CockpitView persona={persona}/>
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );

  // ── Decisions / Workflow views ────────────────────────────────────────────
  // (Aaron/National/Conner/Blake already handled above; this handles
  //  the workflow and decisions sub-views for any remaining persona)

  // ── Legacy dashboard — fallback (should not be reached) ──────────────────
  return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}

      {isAaron&&(
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-green-500 text-sm">✓</span>
          <p className="text-green-700 text-xs font-medium">Workflow configuration access enabled for this session</p>
        </div>
      )}

      {/* Cockpit view — Logan and Kerrie get three-column layout */}
      {(isLogan||isKerrie)&&<CockpitView persona={persona}/>}

      {/* Stats — non-cockpit personas only */}
      {!isKerrie&&!isLogan&&<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="bg-white rounded-xl p-4 col-span-2 md:col-span-1 border border-slate-200">
          <p className="text-slate-400 text-xs mb-1">Active Commitments</p>
          <p className="text-3xl font-bold text-slate-800">{fmt(TOTAL)}</p>
          <p className="text-slate-400 text-xs mt-1">{P.region}</p>
        </div>
        {isLogan&&(
          <div className={`rounded-xl p-4 border ${noActivity.length>0?"bg-amber-50 border-amber-200":"bg-white border-slate-200"}`}>
            <p className={`text-xs mb-1 ${noActivity.length>0?"text-amber-600":"text-slate-400"}`}>No geo activity today</p>
            <p className={`text-3xl font-bold ${noActivity.length>0?"text-amber-600":"text-slate-800"}`}>{noActivity.length}</p>
            <button onClick={()=>setView("decisions")} className="text-xs mt-1 underline text-amber-500">View →</button>
          </div>
        )}
        <div className={`rounded-xl p-4 border ${TOTAL_DEC>0?"bg-red-50 border-red-200":"bg-white border-slate-200"}`}>
          <p className={`text-xs mb-1 ${TOTAL_DEC>0?"text-red-500":"text-slate-400"}`}>Needs Decision</p>
          <p className={`text-3xl font-bold ${TOTAL_DEC>0?"text-red-500":"text-slate-800"}`}>{TOTAL_DEC}</p>
          <button onClick={()=>setView("decisions")} className={`text-xs mt-1 underline ${TOTAL_DEC>0?"text-red-400":"text-slate-400"}`}>View queue →</button>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-slate-400 text-xs mb-1">Fully Automated</p>
          <p className="text-3xl font-bold text-green-500">{fmt(TOTAL_ON)}</p>
          <p className="text-slate-400 text-xs mt-1">{TOTAL>0?Math.round(TOTAL_ON/TOTAL*100):0}%</p>
        </div>
      </div>}

      {/* Morning briefing — non-cockpit personas only */}
      {!isLogan&&!isKerrie&&!briefingDismissed&&(
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-slate-800 font-semibold text-sm">Morning Briefing</h2><p className="text-slate-400 text-xs mt-0.5">Overnight activity surfaced automatically</p></div>
            <button onClick={()=>setBriefingDismissed(true)} className="text-slate-400 hover:text-slate-600 text-xs">Dismiss</button>
          </div>
          <div className="space-y-2">
            {MORNING.map((item,i)=>(
              <div key={i} className={`rounded-lg p-3 flex items-start gap-3 ${item.severity==="high"?"bg-red-50 border border-red-200":"bg-amber-50 border border-amber-200"}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <p className={`text-xs flex-1 ${item.severity==="high"?"text-red-700":"text-amber-700"}`}>{item.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff performance — non-cockpit personas only */}
      {!isLogan&&!isKerrie&&<StaffPerformance persona={persona}/>}

      {/* Coordinator view — legacy, hidden now that Kerrie uses CockpitView */}

      {/* Today's schedule — superseded by CockpitView for Logan */}
      {false&&isLogan&&(
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-slate-800 font-semibold text-sm">Today's Schedule</h2><p className="text-slate-400 text-xs">North East · {TODAY_JOBS.length} jobs · 9:18am</p></div>
            <div className="text-right"><span className="text-amber-600 font-bold">{noActivity.length} at risk</span><p className="text-slate-400 text-xs">{TODAY_JOBS.filter(j=>j.geo==="confirmed"||j.geo==="en_route").length} confirmed</p></div>
          </div>
          <div className="flex gap-0.5 rounded-full overflow-hidden h-2 mb-3">
            {TODAY_JOBS.map(j=><div key={j.id} className={`flex-1 ${j.geo==="confirmed"||j.geo==="en_route"?"bg-green-400":j.geo==="no_activity"&&j.minsToWindow<0?"bg-red-400 animate-pulse":j.geo==="no_activity"?"bg-amber-400":j.geo==="unassigned"?"bg-slate-300":"bg-[#00BDFE]"}`} title={j.trade}/>)}
          </div>
          <div className="space-y-1">
            {TODAY_JOBS.map(j=>{
              const g=geoLabel(j.geo,j.minsToWindow);
              return(
                <div key={j.id} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${j.geo==="no_activity"&&j.minsToWindow<0?"bg-red-50 border border-red-200":"bg-slate-50"}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.dot}`}/>
                  <span className="text-slate-500 font-mono w-20 flex-shrink-0">{j.id}</span>
                  <span className="text-slate-600 w-28 flex-shrink-0 truncate">{j.trade}</span>
                  <span className="text-slate-400 flex-1 truncate">{j.suburb}</span>
                  <span className="text-slate-400 w-18 flex-shrink-0">{j.window}</span>
                  <span className={`flex-shrink-0 w-52 text-right ${g.text}`}>{g.label}{j.geoTime?` · ${j.geoTime}`:""}</span>
                  <span className={`font-mono font-bold flex-shrink-0 ${cc(j.conf)}`}>{j.conf.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job type health — non-cockpit personas only */}
      {!isKerrie&&!isLogan&&<div>
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Job Type Health</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jobTypes.map(jt=>(
            <div key={jt.id} className={`bg-white rounded-xl p-4 border ${jt.trend==="declining"?"border-orange-300":jt.trend==="improving"?"border-green-300":"border-slate-200"}`}>
              <div className="flex items-start justify-between mb-2">
                <div><p className={`text-sm font-semibold ${jt.color}`}>{jt.label}</p><p className="text-slate-400 text-xs">{fmt(jt.total)} active</p></div>
                <div className="text-right"><span className={`text-xl font-bold font-mono ${cc(jt.avgConf)}`}>{jt.avgConf.toFixed(2)}</span><p className={`text-xs ${jt.trend==="declining"?"text-orange-500":jt.trend==="improving"?"text-green-500":"text-slate-400"}`}>{jt.trend==="declining"?"↓":jt.trend==="improving"?"↑":"→"} {jt.trend}</p></div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2"><div className={`h-1.5 rounded-full ${cb(jt.avgConf)}`} style={{width:`${jt.avgConf*100}%`}}/></div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">{fmt(jt.onTrack)} automated</span>
                <span className="text-amber-500">{jt.atRisk} at risk</span>
                <span className={`font-semibold ${jt.needsDecision>0?"text-red-500":"text-slate-400"}`}>{jt.needsDecision} decisions</span>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* Field supervisors — moved to CockpitView for Logan */}
      {false&&isLogan&&(
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h2 className="text-slate-800 font-semibold text-sm mb-3">Field Supervisors — North East</h2>
          <div className="space-y-3">
            {SUPERVISORS.map(s=>{
              const sPct=Math.round(s.safety.done/s.safety.target*100);
              const qPct=Math.round(s.quality.done/s.quality.target*100);
              const behind=sPct<50||qPct<50;
              const open=expandedSup===s.id;
              return(
                <div key={s.id} className={`rounded-xl border ${behind?"bg-orange-50 border-orange-200":"bg-slate-50 border-slate-200"}`}>
                  <button className="w-full p-3 text-left" onClick={()=>setExpandedSup(open?null:s.id)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><div className="flex items-center gap-2"><span className="text-slate-800 font-semibold text-sm">{s.name}</span>{s.avoidanceFlag&&<span className="text-xs text-orange-500">⚠</span>}</div><p className="text-slate-400 text-xs">{s.region}</p></div>
                      <span className="text-[#00BDFE] text-xs">{open?"▲ Close":"▼ Inspect queue"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[{label:"Safety",v:s.safety,pct:sPct},{label:"Quality",v:s.quality,pct:qPct}].map(k=>(
                        <div key={k.label}>
                          <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{k.label}</span><span className={k.pct>=80?"text-green-600":k.pct>=50?"text-amber-500":"text-orange-500"}>{k.v.done}/{k.v.target}</span></div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${k.pct>=80?"bg-green-400":k.pct>=50?"bg-amber-400":"bg-orange-400"}`} style={{width:`${k.pct}%`}}/></div>
                        </div>
                      ))}
                    </div>
                  </button>
                  {open&&(
                    <div className="px-3 pb-3 border-t border-slate-200 pt-3 space-y-2">
                      {s.avoidanceFlag&&<div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2"><p className="text-orange-600 text-xs">⚠ {s.avoidanceFlag}</p></div>}
                      <p className="text-slate-400 text-xs">AI-generated inspection queue — ranked by trade risk profile</p>
                      {s.inspectionQueue.map((t,i)=>{
                        const logged=loggedInspections[`${s.id}-${t.trade}`];
                        const pc=t.priority==="critical"?"bg-red-100 text-red-700":t.priority==="high"?"bg-orange-100 text-orange-700":t.priority==="medium"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-500";
                        return(
                          <div key={i} className={`rounded-lg p-3 border ${logged?"bg-green-50 border-green-200":"bg-white border-slate-200"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="text-slate-800 text-sm font-semibold">{t.trade}</span><span className={`text-xs px-1.5 py-0.5 rounded-full ${pc}`}>{t.priority}</span><span className="text-amber-500 text-xs">{t.rating}★</span></div>
                                <p className="text-slate-500 text-xs">{t.reason}</p>
                                <p className="text-slate-400 text-xs mt-0.5">Last: {t.lastInspected} · {t.jobsSince} jobs since · {t.complaints} complaint{t.complaints!==1?"s":""}</p>
                              </div>
                              {logged?<span className="text-green-600 text-xs">✓ Logged</span>:<button onClick={()=>setLogged(l=>({...l,[`${s.id}-${t.trade}`]:true}))} className="text-xs bg-[#00BDFE] hover:bg-[#0099d4] text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Log</button>}
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
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Systemic Patterns</h2>
          <div className="space-y-3">
            {PATTERNS.map(p=>(
              <div key={p.id} className={`rounded-xl border ${p.severity==="high"?"bg-red-50 border-red-200":"bg-amber-50 border-amber-200"}`}>
                <button className="w-full p-4 text-left" onClick={()=>setExpandedPattern(expandedPattern===p.id?null:p.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3"><span className="text-base">{p.icon}</span><div><p className={`text-sm font-semibold ${p.severity==="high"?"text-red-700":"text-amber-700"}`}>{p.title}</p><div className="flex gap-2 mt-1"><span className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded">{p.type}</span><span className="text-xs text-slate-400">{p.affected}</span></div></div></div>
                    <span className="text-slate-400 text-xs">{expandedPattern===p.id?"▲":"▼"}</span>
                  </div>
                </button>
                {expandedPattern===p.id&&<div className="px-4 pb-4 border-t border-slate-200 pt-3 space-y-3"><p className="text-slate-600 text-sm">{p.detail}</p><button className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${p.severity==="high"?"bg-red-600 hover:bg-red-700 text-white":"bg-amber-500 hover:bg-amber-600 text-white"}`}>{p.action}</button></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow config entry point */}
      <div className={`rounded-xl border p-4 ${isAaron?"bg-[#e0f7ff] border-[#00BDFE]/40":"bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-slate-800 font-semibold text-sm">Workflow Configuration</h2>
            <p className="text-slate-400 text-xs mt-0.5">Autonomy levels per step, per job type. Accuracy-tracked. Audit-logged.</p>
          </div>
          <button onClick={()=>setView("workflow")} className={`text-xs underline flex-shrink-0 ${isAaron?"text-[#0099d4] hover:text-[#00BDFE]":"text-slate-400 hover:text-slate-600"}`}>
            {isAaron?"Configure →":"View (read-only) →"}
          </button>
        </div>
        <div className="flex gap-1 rounded-lg overflow-hidden h-2 mb-2">
          {[4,3,2,1].map(l=>{const c=WORKFLOW_TEMPLATES[0].steps.filter(s=>s.level===l).length;return c>0?<div key={l} className={`${LM[l as keyof typeof LM].bar} opacity-70`} style={{flex:c}}/>:null;})}
          <div className="bg-red-300 opacity-70" style={{flex:2}}/>
        </div>
        {!isAaron&&<p className="text-slate-400 text-xs mt-1">Adjusting autonomy levels requires Aaron sign-off.</p>}
        {isAaron&&<p className="text-green-600 text-xs mt-1">You have configuration access. All changes are immutably logged.</p>}
      </div>

      {/* AI */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h2 className="text-slate-800 font-semibold text-sm mb-1">Ask AI</h2>
        <p className="text-slate-400 text-xs mb-3">{P.label} · {P.region}</p>
        <AskAI context={`${P.label} (${P.region}): ${fmt(TOTAL)} Commitments, ${TOTAL_DEC} decisions, ${fmt(TOTAL_ON)} automated. ${isAaron?"Has workflow configuration access.":""}`} placeholder="e.g. Which workflow step has the most room for autonomy promotion?"/>
      </div>

      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );
}
