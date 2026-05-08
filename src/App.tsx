import { useState } from "react";
import { LM, PERSONAS, ALL_DECISIONS, INITIAL_FIELD_DEFERRALS, type FieldDeferral, type DeferralEscalation, type ModelFeedback, riskState, riskBadgeClass } from "./data/scenarios";
import { JOBS } from "./data/jobs";
import CockpitView from "./components/CockpitView";
import PortfolioView from "./components/PortfolioView";
import FieldView from "./components/FieldView";
import FieldSupervisorView from "./components/FieldSupervisorView";
import ServiceView from "./components/ServiceView";
import FinanceView from "./components/FinanceView";
import TradeDrawer from "./components/TradeDrawer";
import ConfigurationView from "./components/ConfigurationView";

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]     = useState("dashboard");
  const [persona, setPersona] = useState("logan");
  const [decisionsDone, setDecisionsDone] = useState<Record<string,string>>({});

  // Tags overlaid on stages — lifted to App so changes persist across persona
  // switches (Logan adds "On Hold"; Aaron sees the same tag on the same job).
  // Initial state seeded from any tags hardcoded in jobs.ts.
  const [tagsByJob, setTagsByJob] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    JOBS.forEach(j => { if (j.tags?.length) init[j.id] = [...j.tags]; });
    return init;
  });
  const addTag = (jobId: string, tag: string) => setTagsByJob(curr => {
    const existing = curr[jobId] ?? [];
    if (existing.includes(tag)) return curr;
    return { ...curr, [jobId]: [...existing, tag] };
  });
  const removeTag = (jobId: string, tag: string) => setTagsByJob(curr => {
    const existing = curr[jobId] ?? [];
    return { ...curr, [jobId]: existing.filter(t => t !== tag) };
  });

  // Field-team deferrals — lifted to App so the same record is visible at every
  // tier upward (Discovery OS roll-up requirement, 17 Apr 2026). addDeferral
  // creates new entries from operator action; addEscalation pushes an item one
  // tier higher with a new reason in the chain.
  const [deferrals, setDeferrals] = useState<FieldDeferral[]>(INITIAL_FIELD_DEFERRALS);

  // Model feedback — operator flags on AI silent decisions become labelled
  // training examples for the per-step CNN models (Discovery OS Req 3 +
  // 22 Apr 2026 architecture decision).
  const [modelFeedback, setModelFeedback] = useState<ModelFeedback[]>([]);

  // Trade detail drawer — operator clicks any trade name (queue cards,
  // job detail header, commitment owners) and a slide-out drawer shows
  // profile, compliance, performance, active work, recent jobs. Trades
  // are Circl's competitive moat — operators look this up constantly.
  const [selectedTradeName, setSelectedTradeName] = useState<string | null>(null);
  const addModelFeedback = (entry: ModelFeedback) => setModelFeedback(curr => {
    // De-duplicate: if this user already feedback'd this decision, replace
    const existing = curr.findIndex(f => f.decisionId === entry.decisionId && f.flaggedById === entry.flaggedById);
    if (existing >= 0) {
      const next = [...curr]; next[existing] = entry; return next;
    }
    return [entry, ...curr];
  });
  const addDeferral = (entry: FieldDeferral) => setDeferrals(curr => [entry, ...curr]);
  const addEscalation = (jobId: string, esc: DeferralEscalation) => setDeferrals(curr =>
    curr.map(d => d.jobId === jobId
      ? { ...d, escalations: [...(d.escalations ?? []), esc], currentHolder: esc.toId }
      : d
    )
  );
  // Recall — operator pulls a deferred job back from senior. If chained
  // escalations exist, pop the last one (currentHolder reverts to whoever
  // pushed it up most recently). Otherwise remove the entry entirely.
  // Discovery OS event-sourced auditability would archive the recall as an
  // event in production; for the prototype we drop the record. Reason accepted
  // for consistency with defer modal but not yet fed into a training stream.
  const recallDeferral = (jobId: string, _reason: string) => setDeferrals(curr => {
    const def = curr.find(d => d.jobId === jobId);
    if (!def) return curr;
    const escs = def.escalations ?? [];
    if (escs.length > 0) {
      const newEscs = escs.slice(0, -1);
      // currentHolder reverts to whoever did the popped escalation (they're taking it back)
      const reverted = escs[escs.length - 1].byId;
      return curr.map(d => d.jobId === jobId
        ? { ...d, escalations: newEscs.length > 0 ? newEscs : undefined, currentHolder: reverted }
        : d);
    }
    // No escalations — operator originated this; remove entirely
    return curr.filter(d => d.jobId !== jobId);
  });

  const isPortfolio = persona === "aaron" || persona === "national";
  const isField     = persona === "conner" || persona === "blake";
  const isTroy      = persona === "troy";
  const isMaya      = persona === "maya";
  const isMei       = persona === "mei";

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
        <div className="flex items-center gap-2">
          {/* Configuration link — visible to all personas; the access tier
              inside the view determines what's editable */}
          <button
            onClick={() => setView("workflow")}
            className="text-xs bg-white border border-slate-200 text-slate-600 hover:border-[#00BDFE] hover:text-[#0099d4] px-3 py-1 rounded-full transition-colors"
            title="Workflow & commitment configuration"
          >
            ⚙ Configuration
          </button>
          <span className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full">10x Labs · v7</span>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 border border-slate-200">
        <p className="text-slate-400 text-xs mb-2">Viewing as:</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>setPersona(p.id)} className={`text-sm px-3 py-2 rounded-lg font-medium border transition-colors ${persona===p.id?"bg-[#00BDFE] border-[#00BDFE] text-white":"bg-white border-slate-200 text-slate-600 hover:border-[#00BDFE]"}`}>
              <span className="font-semibold">{p.label}</span>
              <span className={`block text-xs mt-0.5 ${persona===p.id?"text-white/80":"text-slate-400"}`}>{p.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // ── Configuration view — workflow + commitment editing surface ─────────────
  // All personas can navigate here; the access banner inside reflects what
  // the current persona can/can't do (Reader / Drafter / Reviewer / Authoriser).
  // Checked before portfolio routing so personas like Aaron and National can
  // also reach it from their main view.
  if (view==="workflow") return (
    <div className={bg}><div className={maxW}>
      <div className="flex items-center gap-3 mb-6">
        <img src="/circl-logo.svg" alt="Circl" className="h-7" />
        <span className="text-slate-400 text-xs">Mission Control — v7</span>
      </div>
      <ConfigurationView persona={persona} onBack={()=>setView("dashboard")} />
    </div></div>
  );

  // ── Portfolio view — Aaron and National ───────────────────────────────────
  if (isPortfolio) return (
    <>
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <PortfolioView persona={persona} onWorkflowConfig={() => setView("workflow")} tagsByJob={tagsByJob} onAddTag={addTag} onRemoveTag={removeTag} deferrals={deferrals} modelFeedback={modelFeedback} onSelectTrade={setSelectedTradeName} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
    <TradeDrawer tradeName={selectedTradeName} onClose={() => setSelectedTradeName(null)} onSelectJob={() => setSelectedTradeName(null)} />
    </>
  );

  // ── Field view — Conner and Blake ─────────────────────────────────────────
  if (isField) return (
    <>
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <FieldView persona={persona} tagsByJob={tagsByJob} onAddTag={addTag} onRemoveTag={removeTag} modelFeedback={modelFeedback} onAddModelFeedback={addModelFeedback} deferrals={deferrals} onAddDeferral={addDeferral} onRecallDeferral={recallDeferral} onSelectTrade={setSelectedTradeName} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
    <TradeDrawer tradeName={selectedTradeName} onClose={() => setSelectedTradeName(null)} onSelectJob={() => setSelectedTradeName(null)} />
    </>
  );

  // ── Field Supervisor view — Troy ──────────────────────────────────────────
  if (isTroy) return (
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <FieldSupervisorView onPersonaSwitch={setPersona} deferrals={deferrals} onAddDeferral={addDeferral} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
  );

  // ── Maya — Service Officer view (Hubspot-sourced ticket queue) ─────────────
  if (isMaya) return (
    <>
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <ServiceView persona={persona} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
    <TradeDrawer tradeName={selectedTradeName} onClose={() => setSelectedTradeName(null)} onSelectJob={() => setSelectedTradeName(null)} />
    </>
  );

  // ── Mei — Finance Officer view (Xero sync surface, billing/payment state) ──
  if (isMei) return (
    <>
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <FinanceView persona={persona} />
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
    <TradeDrawer tradeName={selectedTradeName} onClose={() => setSelectedTradeName(null)} onSelectJob={() => setSelectedTradeName(null)} />
    </>
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

  // ── Cockpit view — Sharon, Logan and Kerrie (default; aaron/national/conner/blake/troy handled above) ─
  return (
    <>
    <div className={bg}><div className={maxW + " space-y-5"}>
      {sharedHeader}
      <CockpitView persona={persona} onPersonaSwitch={setPersona} tagsByJob={tagsByJob} onAddTag={addTag} onRemoveTag={removeTag} deferrals={deferrals} onAddEscalation={addEscalation} onAddDeferral={addDeferral} onRecallDeferral={recallDeferral} modelFeedback={modelFeedback} onAddModelFeedback={addModelFeedback} onSelectTrade={setSelectedTradeName}/>
      <p className="text-slate-400 text-xs text-center mt-8 pb-8">Concept prototype · v7 · Data illustrative · AI live via Anthropic API</p>
    </div></div>
    <TradeDrawer tradeName={selectedTradeName} onClose={() => setSelectedTradeName(null)} onSelectJob={() => setSelectedTradeName(null)} />
    </>
  );
}
