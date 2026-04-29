import { useState, useEffect } from "react";
import { AI_AUDIT_FLAG_CHIPS, type AIAuditFlagCategory, type SilentDecision } from "../data/scenarios";

// Modal for flagging an AI silent decision as wrong / mis-handled. Each flag
// becomes a labelled training example for the per-step CNN model that made
// the call (Discovery OS architecture decision 22 Apr 2026). Free-text reason
// is required so the model gets specifics, not just category.

type Props = {
  open: boolean;
  decision: SilentDecision | null;
  onSubmit: (category: AIAuditFlagCategory, reason: string) => void;
  onCancel: () => void;
};

export default function AIAuditFlagModal({ open, decision, onSubmit, onCancel }: Props) {
  const [category, setCategory] = useState<AIAuditFlagCategory | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) { setCategory(null); setText(""); }
  }, [open]);

  if (!open || !decision) return null;

  const trimmed = text.trim();
  const canSubmit = category !== null && trimmed.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Flag AI decision for review</p>
          <h2 className="text-slate-800 font-semibold text-base leading-snug mt-0.5">{decision.what}</h2>
          <p className="text-slate-500 text-xs italic mt-1 leading-snug">"{decision.reasoning}"</p>
          <p className="text-slate-400 text-[10px] mt-2">{decision.jobId} · {decision.step} · this becomes a training label</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-slate-500 text-[11px] font-medium mb-1.5">What was wrong about this call?<span className="text-red-500 ml-0.5">*</span></p>
            <div className="flex flex-wrap gap-1.5">
              {AI_AUDIT_FLAG_CHIPS.map(chip => {
                const active = category === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setCategory(chip.id)}
                    className={`text-[11px] rounded-full px-2.5 py-1 border transition-colors ${
                      active
                        ? "bg-[#00BDFE] text-white border-[#00BDFE]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-500 text-[11px] font-medium block mb-1.5">
              Specifics — what should it have done instead?<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              autoFocus
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. Sandbar's coverage doesn't extend to 2295 postcode — they accepted but their actual zone is 2440+. Confidence on that match should have been lower."
              className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#00BDFE] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onSubmit(category!, trimmed)}
            disabled={!canSubmit}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
              canSubmit
                ? "bg-[#00BDFE] hover:bg-[#0099d4] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Submit flag
          </button>
        </div>
      </div>
    </div>
  );
}
