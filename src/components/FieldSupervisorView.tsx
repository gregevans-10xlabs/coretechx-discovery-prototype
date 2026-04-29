import { useState } from "react";
import { SUPERVISORS, type FieldDeferral } from "../data/scenarios";
import AskAI from "./AskAI";
import DeferralReasonModal from "./DeferralReasonModal";

// Troy is the only field-supervisor persona currently exposed in the picker.
// SUPERVISORS data is shared between this view and Logan's column 3.
const TROY = SUPERVISORS.find(s => s.id === "troy")!;

type AuditOutcome = "pass" | "flag" | "fail" | "deferred";

function priorityChip(p: string): string {
  if (p === "critical") return "bg-red-100 text-red-700 border border-red-200";
  if (p === "high")     return "bg-orange-100 text-orange-700 border border-orange-200";
  if (p === "medium")   return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-500 border border-slate-200";
}

export default function FieldSupervisorView({ onPersonaSwitch, deferrals, onAddDeferral }: {
  onPersonaSwitch?: (id: string) => void;
  deferrals: FieldDeferral[];
  onAddDeferral: (entry: FieldDeferral) => void;
}) {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(TROY.inspectionQueue[0]?.trade ?? null);
  const [outcomes, setOutcomes] = useState<Record<string, AuditOutcome>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [deferModalOpen, setDeferModalOpen] = useState(false);
  // Reset key forces AskAI to remount with fresh state on Clear.
  const [aiResetCounter, setAiResetCounter] = useState(0);
  const [aiHasConversation, setAiHasConversation] = useState(false);

  const selected = TROY.inspectionQueue.find(t => t.trade === selectedTrade) ?? null;

  // Troy's deferrals are anything originated by Troy. Per Discovery OS roll-up
  // requirement, items remain visible at every tier upward — Troy still sees
  // his deferrals even after Logan further escalates them, with the chain shown.
  const myDeferrals = deferrals.filter(d => d.whoId === "troy");

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const recordOutcome = (outcome: AuditOutcome) => {
    if (!selected) return;
    if (outcome === "deferred") {
      // Open the reason modal — actual write happens on submit
      setDeferModalOpen(true);
      return;
    }
    setOutcomes(o => ({ ...o, [selected.trade]: outcome }));
    flash(`${outcome.toUpperCase()} logged for ${selected.trade}.`);
  };

  const submitDeferral = (reason: string) => {
    if (!selected) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    onAddDeferral({
      task: `Site audit — ${selected.trade}`,
      who: "Troy Macpherson", whoId: "troy", role: "Field Supervisor",
      time, jobId: `INS-${Date.now().toString().slice(-5)}`,
      urgent: selected.priority === "critical" || selected.priority === "high",
      reason,
      tierPath: ["troy", "logan", "national", "aaron"],
      currentHolder: "logan",
    });
    setOutcomes(o => ({ ...o, [selected.trade]: "deferred" }));
    setDeferModalOpen(false);
    flash(`Deferred to Logan — ${selected.trade}. Now in his queue.`);
  };

  const safetyPct  = Math.round(TROY.safety.done  / TROY.safety.target  * 100);
  const qualityPct = Math.round(TROY.quality.done / TROY.quality.target * 100);

  return (
    <div className="flex justify-center px-4 py-6">
      {/* Mobile device frame — narrow centered column to signal "this is a phone" */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 240px)" }}>

        {/* Phone-style status header */}
        <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-[10px]">
          <span>9:18 AM</span>
          <span className="font-semibold tracking-wide">CHEKKU FIELD</span>
          <span>●●●●○</span>
        </div>

        {/* App header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-200">
          <div className="flex items-baseline justify-between">
            <h1 className="text-slate-800 font-bold text-lg leading-none">Today's Round</h1>
            <span className="text-slate-400 text-[10px]">{TROY.region}</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">{TROY.name} · Field Supervisor</p>
          {TROY.avoidanceFlag && (
            <p className="text-amber-700 text-[11px] mt-2 leading-snug bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              ⚠ {TROY.avoidanceFlag}
            </p>
          )}
        </div>

        {/* Round queue */}
        <div className="px-4 py-3 border-b border-slate-200">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide mb-2">Inspection queue · ranked by risk</p>
          <div className="space-y-1.5">
            {TROY.inspectionQueue.map(t => {
              const isSelected = t.trade === selectedTrade;
              const outcome = outcomes[t.trade];
              return (
                <button
                  key={t.trade}
                  onClick={() => setSelectedTrade(isSelected ? null : t.trade)}
                  className={`w-full text-left rounded-lg p-2.5 border transition-all ${
                    isSelected ? "bg-[#e0f7ff] border-[#00BDFE]" :
                    outcome ? "bg-green-50 border-green-200" :
                    "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-800 text-xs font-semibold leading-tight truncate">{t.trade}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${priorityChip(t.priority)}`}>{t.priority}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-1 leading-snug">{t.reason}</p>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                    <span>★ {t.rating} · last {t.lastInspected}</span>
                    {outcome && <span className="text-green-600 font-semibold">✓ {outcome.toUpperCase()}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Site Audit panel */}
        {selected && !outcomes[selected.trade] && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide mb-2">Site audit</p>
            <p className="text-slate-800 text-sm font-semibold leading-tight">{selected.trade}</p>
            <p className="text-slate-500 text-[11px] mt-0.5 mb-3 leading-snug">{selected.reason}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => recordOutcome("pass")}
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                ✓ Pass
              </button>
              <button
                onClick={() => recordOutcome("flag")}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                ⚠ Flag
              </button>
              <button
                onClick={() => recordOutcome("fail")}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                ✗ Fail
              </button>
              <button
                onClick={() => recordOutcome("deferred")}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                ↑ Defer to Logan
              </button>
            </div>
          </div>
        )}

        {/* My deferrals — items I escalated up. Stay visible per Discovery OS
            roll-up rule, with the full chain shown if Logan escalated further. */}
        {myDeferrals.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">My deferrals ({myDeferrals.length})</p>
              <span className="text-[10px] text-amber-600 font-semibold">Awaiting action</span>
            </div>
            <div className="space-y-2">
            {myDeferrals.map(d => {
              const escalated = (d.escalations?.length ?? 0) > 0;
              return (
                <div key={d.jobId} className="rounded-lg border border-amber-200 bg-white p-2.5 border-l-4 border-l-amber-400">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-slate-800 text-xs font-semibold leading-tight">{d.task}</p>
                    {d.urgent && <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium uppercase flex-shrink-0">Urgent</span>}
                  </div>
                  <p className="text-slate-600 text-[10px] mt-1 leading-snug italic">"You: {d.reason}"</p>
                  {escalated && d.escalations!.map((e, i) => (
                    <p key={i} className="text-slate-600 text-[10px] mt-1 leading-snug italic">"{e.by}: {e.reason}"</p>
                  ))}
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <span className="text-slate-400">{d.jobId}</span>
                    <span className={escalated ? "text-orange-600 font-semibold" : "text-slate-400"}>
                      {escalated
                        ? `Now with ${d.escalations![d.escalations!.length-1].to}`
                        : `With Logan since ${d.time}`}
                    </span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Manager view of you — the connection callout */}
        <div className="px-4 py-3 border-b border-slate-200 bg-[#e0f7ff]">
          <p className="text-[#0077a8] text-[10px] font-semibold uppercase tracking-wide mb-2">What Logan sees about you</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white rounded-lg p-2 border border-[#00BDFE]/30">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Safety</p>
              <p className={`text-base font-bold ${safetyPct < 50 ? "text-red-600" : "text-slate-800"}`}>{TROY.safety.done}/{TROY.safety.target}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-[#00BDFE]/30">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Quality</p>
              <p className={`text-base font-bold ${qualityPct < 50 ? "text-red-600" : "text-slate-800"}`}>{TROY.quality.done}/{TROY.quality.target}</p>
            </div>
          </div>
          <p className="text-slate-600 text-[11px] leading-snug mb-2">
            Both below threshold. Logan can see this — same numbers as on his Field Supervisors panel.
          </p>
          {onPersonaSwitch && (
            <button
              onClick={() => onPersonaSwitch("logan")}
              className="w-full bg-[#00BDFE] hover:bg-[#0099d4] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Switch to Logan's view →
            </button>
          )}
        </div>

        {/* AI bar */}
        <div className="mt-auto border-t border-slate-200">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BDFE] animate-pulse flex-shrink-0" />
            <span className="text-[#00BDFE] text-xs font-semibold">CoreTechX AI</span>
            <span className="text-slate-400 text-[10px] ml-auto truncate">{selected ? `Focused on ${selected.trade.split(" ")[0]}` : "On round"}</span>
            <button
              onClick={() => setAiResetCounter(c => c + 1)}
              title="Clear conversation"
              className={`text-[10px] px-2 py-0.5 rounded transition-colors flex-shrink-0 ${
                aiHasConversation
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ↻ Clear
            </button>
          </div>
          <div className="bg-white px-3 py-2">
            <AskAI
              key={`troy-${aiResetCounter}`}
              context={`Troy Macpherson — Field Supervisor, North East NSW. ${TROY.inspectionQueue.length} inspections in today's queue. Currently ${selected ? `viewing ${selected.trade} (priority ${selected.priority}, last inspected ${selected.lastInspected}, ${selected.complaints} complaint${selected.complaints !== 1 ? "s" : ""}). Reason on queue: ${selected.reason}` : "between sites"}. Standing: safety ${TROY.safety.done}/${TROY.safety.target}, quality ${TROY.quality.done}/${TROY.quality.target} — both below threshold. ${myDeferrals.length} items currently deferred to Logan.`}
              placeholder={selected ? `Ask about ${selected.trade.split(" ")[0]}...` : "Ask about today's round..."}
              onConversationChange={setAiHasConversation}
            />
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute" style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)" }}>
            <div className="bg-slate-800 text-white text-xs font-medium rounded-full px-4 py-2 shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>

      {/* Deferral reason modal — required for every defer per Discovery OS req */}
      <DeferralReasonModal
        open={deferModalOpen}
        title="Defer to Logan"
        itemDescription={selected ? `Site audit — ${selected.trade}` : ""}
        destinationLabel="Logan (Ops Manager — Installations)"
        submitLabel="Defer to Logan"
        onSubmit={submitDeferral}
        onCancel={() => setDeferModalOpen(false)}
      />
    </div>
  );
}
