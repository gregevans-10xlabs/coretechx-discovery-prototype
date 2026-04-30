import { useState, useEffect } from "react";
import { DEFERRAL_REASON_CHIPS } from "../data/scenarios";

// Modal for capturing reason on defer / escalate / recall flows. Default
// behaviour matches Discovery OS req for defers (Alex, 17 Apr 2026): chip +
// required free text. For recall, parameterise with `requireText={false}` and
// a `chips` set tuned to the recall context — chip alone is enough since the
// recall has no downstream receiver who needs structured context.

type Props = {
  open: boolean;
  title: string;                 // e.g. "Defer to Logan" or "Recall from senior"
  itemDescription: string;       // e.g. "Site audit — Penrith Install · CG-2417931"
  destinationLabel: string;      // e.g. "Logan" / "Aaron / National" / "Action returns to you"
  submitLabel?: string;          // defaults to "Defer"
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  // Customisation for non-defer flows (e.g. recall):
  chips?: string[];              // defaults to DEFERRAL_REASON_CHIPS
  requireText?: boolean;         // defaults to true; set false for recall (chip alone suffices)
  textareaPlaceholder?: string;  // override default placeholder
  textareaLabel?: string;        // override default label
};

export default function DeferralReasonModal({
  open, title, itemDescription, destinationLabel, submitLabel = "Defer", onSubmit, onCancel,
  chips = DEFERRAL_REASON_CHIPS, requireText = true, textareaPlaceholder, textareaLabel,
}: Props) {
  const [text, setText] = useState("");
  const [chipChosen, setChipChosen] = useState(false);

  // Reset whenever the modal is opened for a new item
  useEffect(() => {
    if (open) { setText(""); setChipChosen(false); }
  }, [open]);

  if (!open) return null;

  const trimmed = text.trim();
  // When text is required, that's the gate. When not required, picking a chip
  // OR typing something is the gate (so submit isn't always enabled).
  const canSubmit = requireText
    ? trimmed.length > 0
    : (chipChosen || trimmed.length > 0);

  const applyChip = (chip: string) => {
    setChipChosen(true);
    // Chip click sets the chip label as a starting prefix, then operator types
    // the specifics. If the field is empty, just put the chip label. If not,
    // prepend the chip label to whatever's there.
    if (text.trim().length === 0) {
      setText(chip + (requireText ? " — " : ""));
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
          <p className="text-slate-500 text-xs mt-1">
            <span className="font-medium text-slate-700">{destinationLabel}</span>
            {requireText && <span> · reason required</span>}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-slate-500 text-[11px] font-medium mb-1.5">Pick a starting reason{requireText ? " (or type your own)" : ""}</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => applyChip(chip)}
                  className={`text-[11px] rounded-full px-2.5 py-1 border transition-colors ${
                    text.startsWith(chip)
                      ? "bg-[#00BDFE] text-white border-[#00BDFE]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-500 text-[11px] font-medium block mb-1.5">
              {textareaLabel ?? "Add specifics — what does the next person need to know?"}
              {requireText && <span className="text-red-500 ml-0.5">*</span>}
              {!requireText && <span className="text-slate-400 ml-1">(optional)</span>}
            </label>
            <textarea
              autoFocus
              rows={requireText ? 4 : 3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={textareaPlaceholder ?? "e.g. Trade unresponsive after 2 attempts; tried after-hours number too. Customer expecting call-back by 11am."}
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
