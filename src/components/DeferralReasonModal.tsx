import { useState, useEffect } from "react";
import { DEFERRAL_REASON_CHIPS } from "../data/scenarios";

// Modal that captures the required reason when an operator defers or escalates
// a task. Per Discovery OS req (Alex, 17 Apr 2026): every deferral, priority
// change, and task re-ordering must be a structured event with a required
// reason field. Free text is mandatory; chips just speed up common cases.
//
// "Beyond my authority" is the natural reason chip for tier-up escalations.

type Props = {
  open: boolean;
  title: string;                 // e.g. "Defer to Logan" or "Escalate to senior"
  itemDescription: string;       // e.g. "Site audit — Penrith Install · CG-2417931"
  destinationLabel: string;      // e.g. "Logan" or "Aaron / National"
  submitLabel?: string;          // defaults to "Defer"
  onSubmit: (reason: string) => void;
  onCancel: () => void;
};

export default function DeferralReasonModal({ open, title, itemDescription, destinationLabel, submitLabel = "Defer", onSubmit, onCancel }: Props) {
  const [text, setText] = useState("");

  // Reset text whenever the modal is opened for a new item
  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0;

  const applyChip = (chip: string) => {
    // Chip click sets the chip label as a starting prefix, then operator types
    // the specifics. If the field is empty, just put the chip label. If not,
    // prepend the chip label to whatever's there.
    if (text.trim().length === 0) {
      setText(chip + " — ");
    } else if (text.startsWith(chip)) {
      // already starts with this chip; do nothing
    } else {
      setText(chip + " — " + text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{title}</p>
          <h2 className="text-slate-800 font-semibold text-base leading-snug mt-0.5">{itemDescription}</h2>
          <p className="text-slate-500 text-xs mt-1">Going to <span className="font-medium text-slate-700">{destinationLabel}</span> · reason required</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-slate-500 text-[11px] font-medium mb-1.5">Pick a starting reason (or type your own)</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFERRAL_REASON_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => applyChip(chip)}
                  className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-500 text-[11px] font-medium block mb-1.5">
              Add specifics — what does the next person need to know?<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              autoFocus
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. Trade unresponsive after 2 attempts; tried after-hours number too. Customer expecting call-back by 11am."
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
            onClick={() => canSubmit && onSubmit(trimmed)}
            disabled={!canSubmit}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
              canSubmit
                ? "bg-[#00BDFE] hover:bg-[#0099d4] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
