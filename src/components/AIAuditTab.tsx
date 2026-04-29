import { useState } from "react";
import { type SilentDecision, type ModelFeedback, type AIAuditFlagCategory, SILENT_DECISION_CATEGORY_META } from "../data/scenarios";
import AIAuditFlagModal from "./AIAuditFlagModal";

// Operator-facing audit surface for AI silent decisions (Discovery OS Req 3,
// 17 Apr 2026): operators must be able to see what the system chose NOT to
// put on their queue, to catch cases where the prioritisation model is wrong.
//
// Each card shows the AI's decision + plain-English reasoning + confidence,
// with two actions: "Looks right" (positive label) and "Flag" (opens reason
// modal — captures specifics for the per-step CNN's training queue).

type Props = {
  decisions: SilentDecision[];        // already filtered to this persona's region/jobtype
  feedback: ModelFeedback[];
  onAddFeedback: (entry: ModelFeedback) => void;
  flaggedByName: string;              // e.g. "Logan Reilly"
  flaggedById: string;                // e.g. "logan"
};

function ConfidenceTrace({ value }: { value: number }) {
  // Discovery OS decision: don't show raw conf as primary signal in queue,
  // but in the audit context the operator IS questioning the AI's judgement —
  // confidence is the right unit here. Render as small mono badge.
  const tone = value >= 0.9 ? "text-slate-500" : value >= 0.7 ? "text-amber-700" : "text-orange-700";
  return <span className={`text-[10px] font-mono ${tone}`}>{value.toFixed(2)}</span>;
}

export default function AIAuditTab({ decisions, feedback, onAddFeedback, flaggedByName, flaggedById }: Props) {
  const [flagTarget, setFlagTarget] = useState<SilentDecision | null>(null);

  // Lookup table for which decisions already have feedback from this user
  const myFeedbackByDecision = new Map<string, ModelFeedback>();
  feedback.filter(f => f.flaggedById === flaggedById).forEach(f => myFeedbackByDecision.set(f.decisionId, f));

  const submitFlag = (category: AIAuditFlagCategory, reason: string) => {
    if (!flagTarget) return;
    onAddFeedback({
      id: `MFB-${Date.now()}`,
      decisionId: flagTarget.id,
      flaggedById, flaggedByName,
      flaggedAt: new Date().toISOString(),
      isFlag: true,
      flagCategory: category,
      reason,
    });
    setFlagTarget(null);
  };

  const submitLooksRight = (decision: SilentDecision) => {
    if (myFeedbackByDecision.has(decision.id)) return;
    onAddFeedback({
      id: `MFB-${Date.now()}`,
      decisionId: decision.id,
      flaggedById, flaggedByName,
      flaggedAt: new Date().toISOString(),
      isFlag: false,
    });
  };

  if (decisions.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-slate-500 text-xs">No recent silent AI decisions in your region.</p>
        <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
          AI activity is filtered to your region and job types. Decisions surface here when AI took action without human input.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <p className="text-slate-400 text-[10px] leading-relaxed">
          Decisions the AI made in your region without surfacing them. Flag any that look wrong — flags become labelled training examples.
        </p>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        {decisions.map(d => {
          const meta = SILENT_DECISION_CATEGORY_META[d.category];
          const myFb = myFeedbackByDecision.get(d.id);
          const flagged = myFb?.isFlag === true;
          const confirmed = myFb?.isFlag === false;
          return (
            <div
              key={d.id}
              className={`rounded-xl border bg-white p-2.5 ${
                flagged ? "border-l-4 border-l-orange-400" :
                confirmed ? "border-l-4 border-l-green-400" :
                "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${meta.tone}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{d.time}</span>
                </div>
                <ConfidenceTrace value={d.confidence} />
              </div>

              <p className="text-slate-800 text-xs font-semibold leading-tight">{d.what}</p>
              <p className="text-slate-500 text-[11px] italic mt-1 leading-snug">"{d.reasoning}"</p>

              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-[10px] font-mono text-slate-300">{d.jobId}</span>
                {flagged ? (
                  <span className="text-[10px] text-orange-600 font-medium">⚠ Flagged for review</span>
                ) : confirmed ? (
                  <span className="text-[10px] text-green-600 font-medium">✓ Confirmed</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => submitLooksRight(d)}
                      title="Confirm AI got this right (lower-affordance training signal)"
                      className="text-[11px] text-slate-400 hover:text-green-600 transition-colors"
                    >
                      ✓ Looks right
                    </button>
                    <button
                      onClick={() => setFlagTarget(d)}
                      className="text-[11px] text-[#0077a8] hover:text-[#00BDFE] hover:underline font-medium"
                    >
                      ⚠ Flag
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AIAuditFlagModal
        open={flagTarget !== null}
        decision={flagTarget}
        onSubmit={submitFlag}
        onCancel={() => setFlagTarget(null)}
      />
    </>
  );
}
