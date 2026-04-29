import { useState } from "react";
import { LM, WORKFLOW_TEMPLATES, AUDIT_LOG, PERSONAS, ALL_DECISIONS, riskState, riskBadgeClass } from "./data/scenarios";
import AskAI from "./components/AskAI";
import CockpitView from "./components/CockpitView";
import PortfolioView from "./components/PortfolioView";
import FieldView from "./components/FieldView";
import FieldSupervisorView from "./components/FieldSupervisorView";

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
export default function App() {
  const [view, setView]     = useState("dashboard");
  const [persona, setPersona] = useState("logan");
  const [decisionsDone, setDecisionsDone] = useState<Record<string,string>>({});

  const isPortfolio = persona === "aaron" || persona === "national";
  const isField     = persona === "conner" || persona === "blake";
  const isTroy      = persona === "troy";

  const P = PERSONAS.find(p=>p.id===persona)!;
  const decisions = ALL_DECISIONS.filter(d=>{
    if(persona==="aaron"||persona==="national")return true;
    if(persona==="logan")return d.type==="Appliance Install"||d.type==="Starlink Install";
    if(persona==="blake")return d.type==="FM Emergency";
    if(persona==="conner")return d.type==="Construction / AHO";
    if(persona==="kerrie")return d.type==="Insurance Repair";
    return true;
  });

  const bg  = "min-h-screen bg-[#f5f6f8] p-4 md:p-6";
  const maxW = "max-w-[1920px] mx-auto";

  // ── Shared header + persona switcher ─────────────────────────────────────
  const sharedHeader = (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/circl-logo.svg" alt="Circl" className="h-8" />
          <div>
            <p className="text-slate-500 text-xs">Mission Control — System Health</p>
          </div>
        </div>
        <span className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full">10x Labs · v7</span>
      </div>
      <div className="bg-white rounded-xl p-3 border border-slate-200">
        <p className="text-slate-400 text-xs mb-2">Viewing as:</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>setPersona(p.id)} className={`text-sm px-3 py-2 rounded-lg font-medium border transition-colors ${persona===p.id?"bg-[#00BDFE] border-[#00BDFE] text-white":"bg-white border-slate-200 text-slate-600 hover:border-[#00BDFE]"}`}>
              <span className="font-semibold">{p.label}</span>
              <span className={`block text-xs mt-0.5 ${persona===p.id?"text-white/80":"text-slate-400"}`}>{p.region}</span>
            </button>
          ))}
        </div>
      </div>
    </>
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

  // ── Field Supervisor view — Troy ──────────────────────────────────────────
  if (isTroy) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <FieldSupervisorView onPersonaSwitch={setPersona} />
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
                    <span className={`text-xs font-semibold border rounded px-2 py-0.5 ${riskBadgeClass(dec.conf)}`}>{riskState(dec.conf)}</span>
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

  // ── Cockpit view — Logan and Kerrie (default; aaron/national/conner/blake/troy handled above) ─
  return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <CockpitView persona={persona} onPersonaSwitch={setPersona}/>
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );
}
