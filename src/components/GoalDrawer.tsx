import { useState } from "react";
import type { Goal, GoalControl, GoalCommitment, StandaloneCommitment } from "../data/goals";
import { STAGE_NAMES } from "../data/goals";
import type { ConfigAccessTier } from "../data/scenarios";
import { CONFIG_ACCESS_META } from "../data/scenarios";

// GoalDrawer — slide-out pane that shows a goal (or a standalone commitment)
// in detail. Layered for the user's mental model:
//   1. Header — name, scope, anchor, version
//   2. Goal-level controls — the intent-shaped knobs the user mostly edits
//   3. Composed-of commitments (collapsed by default) — the "show technical
//      detail" expander where commitment-level edits live
//   4. Blast radius + history footer
//
// Read mode is the default. Edit affordances appear when access tier permits;
// changes route to the Pending Changes panel rather than mutating directly.

type Props = {
  open: boolean;
  goal: Goal | null;
  standalone: StandaloneCommitment | null;
  accessTier: ConfigAccessTier;
  personaName: string;
  onClose: () => void;
  onDraftChange: (description: string) => void;
};

function anchorLabel(anchor: Goal["anchor"]): string {
  if (anchor.kind === "staged") return `Staged · ${STAGE_NAMES[anchor.stage]}`;
  if (anchor.kind === "floating") return `Floating · ${STAGE_NAMES[anchor.spans[0]]} → ${STAGE_NAMES[anchor.spans[1]]}`;
  return `Triggered · materialises at ${STAGE_NAMES[anchor.stage]} when "${anchor.trigger}" fires`;
}

function scopeLabel(scope: Goal["scope"], jobTypes: string[]): string {
  if (scope === "universal") return "Universal";
  if (scope === "client-overlay") return "Client overlay";
  return `Job-type · ${jobTypes.join(", ")}`;
}

function autonomyMeta(level: 1 | 2 | 3 | 4) {
  return ({
    1: { label: "L1 Inform",        bg: "bg-slate-100",  text: "text-slate-600" },
    2: { label: "L2 Recommend",     bg: "bg-yellow-100", text: "text-yellow-800" },
    3: { label: "L3 Act + Notify",  bg: "bg-sky-100",    text: "text-sky-700" },
    4: { label: "L4 Full Auto",     bg: "bg-green-100",  text: "text-green-700" },
  } as const)[level];
}

// ─── Goal-level control widget (read-only render + simulated edit) ──────────
function ControlRow({ control, canEdit, onEdit }: { control: GoalControl; canEdit: boolean; onEdit: () => void }) {
  const valueLabel = (() => {
    if (Array.isArray(control.value)) return control.value.join(" + ");
    if (typeof control.value === "boolean") return control.value ? "On" : "Off";
    return String(control.value);
  })();
  return (
    <div className="border border-slate-200 rounded-lg px-3 py-2.5 bg-white">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-slate-700">{control.label}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-slate-800 font-mono">{valueLabel}</span>
          {canEdit && (
            <button
              onClick={onEdit}
              className="text-[11px] text-[#0077a8] hover:text-[#00BDFE] hover:underline font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {control.description && (
        <p className="text-[11px] text-slate-500 leading-snug">{control.description}</p>
      )}
      {control.affects.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">↓ writes through to {control.affects.length} commitment{control.affects.length === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}

// ─── Commitment row (the technical-detail layer) ────────────────────────────
function CommitmentRow({ c, isHardLimit }: { c: GoalCommitment; isHardLimit?: boolean }) {
  const auto = autonomyMeta(c.autonomyLevel);
  return (
    <div className={`border rounded-lg px-3 py-2.5 ${isHardLimit ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`text-sm font-medium leading-snug ${c.enabled ? "text-slate-800" : "text-slate-400 line-through"}`}>{c.promise}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isHardLimit && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border bg-red-100 text-red-700 border-red-300">🔒 Hard limit</span>}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${auto.bg} ${auto.text}`}>{auto.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] mt-1.5">
        <div><span className="text-slate-400">Owner:</span> <span className="text-slate-600">{c.owner}{c.ownerTier ? ` · ${c.ownerTier}` : ""}</span></div>
        <div><span className="text-slate-400">Control:</span> <span className="text-slate-600">{c.controlMode.replace(/_/g, " ")}</span></div>
        <div className="col-span-2"><span className="text-slate-400">Proof:</span> <span className="text-slate-600">{c.proofRequired}</span></div>
        {c.accuracy != null && (
          <div><span className="text-slate-400">Accuracy:</span> <span className={`font-mono ${c.accuracy >= 0.95 ? "text-green-600" : c.accuracy >= 0.85 ? "text-sky-600" : "text-amber-600"}`}>{(c.accuracy * 100).toFixed(1)}%</span></div>
        )}
      </div>
      {c.hardLimit && (
        <p className="text-[10px] text-red-600 mt-1.5 italic">{c.hardLimit}</p>
      )}
    </div>
  );
}

export default function GoalDrawer({ open, goal, standalone, accessTier, personaName, onClose, onDraftChange }: Props) {
  const [showCommitments, setShowCommitments] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState<{ controlId: string; controlLabel: string } | null>(null);

  if (!open) return null;
  if (!goal && !standalone) return null;

  const access = CONFIG_ACCESS_META[accessTier];
  const isStandalone = !!standalone;
  const isHardLimit = standalone?.hardLimit != null;
  // Hard limits + new-goal auth + universal-scope changes route to authoriser only.
  // Drafters can draft other items; reviewers can publish low-risk; authoriser
  // can publish anything.
  const blocksDrafter = isHardLimit;
  const canEditHere = access.canEdit && !blocksDrafter;

  const name      = goal?.name ?? standalone?.id ?? "";
  const purpose   = goal?.purpose ?? standalone?.promise ?? "";
  const anchor    = goal?.anchor ?? standalone!.anchor;
  const scope     = goal?.scope ?? standalone!.scope;
  const jobTypes  = goal?.jobTypes ?? standalone!.jobTypes;
  const version   = goal?.version ?? standalone!.version;
  const publishedBy = goal?.publishedBy ?? standalone!.publishedBy;
  const publishedAt = goal?.publishedAt ?? standalone!.publishedAt;
  const usedIn    = goal?.usedInWorkflows ?? standalone!.usedInWorkflows;
  const blastWorkflows = usedIn.length;

  const handleConfirmEdit = () => {
    if (!confirmEdit) return;
    onDraftChange(`${name} — ${confirmEdit.controlLabel} edit drafted by ${personaName}`);
    setConfirmEdit(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/30 z-40 animate-fadeIn" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
        style={{ animation: "slideInRight 0.18s ease-out" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">{isStandalone ? "Standalone Commitment" : "Goal"}</p>
              <h2 className="text-slate-800 font-bold text-base mt-0.5 leading-snug">{name}</h2>
              {!isStandalone && <p className="text-slate-500 text-xs mt-1 leading-snug">{purpose}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0">✕ close</button>
          </div>

          {/* Metadata strip */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Anchor</p>
              <p className="text-slate-700 mt-0.5 leading-snug">{anchorLabel(anchor)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Scope</p>
              <p className="text-slate-700 mt-0.5 leading-snug">{scopeLabel(scope, jobTypes)}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-4">

          {/* Goal-level controls */}
          {goal && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Goal Controls</p>
              <div className="space-y-2">
                {goal.controls.map(ctrl => (
                  <ControlRow key={ctrl.id} control={ctrl} canEdit={canEditHere} onEdit={() => setConfirmEdit({ controlId: ctrl.id, controlLabel: ctrl.label })} />
                ))}
              </div>
            </div>
          )}

          {/* Composed-of expander (goal only) */}
          {goal && (
            <div>
              <button
                onClick={() => setShowCommitments(s => !s)}
                className="w-full flex items-center gap-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#00BDFE]/50 px-3 py-2 transition-colors group"
              >
                <span className="text-slate-500 text-sm leading-none group-hover:text-[#0099d4] transition-colors">{showCommitments ? "▾" : "▸"}</span>
                <div className="flex-1">
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider group-hover:text-slate-800 transition-colors">Composed of {goal.commitments.length} commitment{goal.commitments.length === 1 ? "" : "s"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Show technical detail — direct commitment-level edits</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-[#0099d4] transition-colors">{showCommitments ? "Hide" : "Show"}</span>
              </button>
              {showCommitments && (
                <div className="space-y-2 mt-2">
                  {goal.commitments.map(c => <CommitmentRow key={c.id} c={c} />)}
                </div>
              )}
            </div>
          )}

          {/* Standalone — show the commitment directly */}
          {standalone && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Commitment</p>
              <CommitmentRow c={standalone} isHardLimit={isHardLimit} />
            </div>
          )}

          {/* Footer: blast radius + history */}
          <div className="border-t border-slate-200 pt-3 mt-2 space-y-2">
            <div className="text-[11px] text-slate-500">
              <p>
                <span className="text-slate-400">Used in:</span> {blastWorkflows} workflow{blastWorkflows === 1 ? "" : "s"} · {usedIn.join(" · ")}
              </p>
              <p className="mt-0.5">
                <span className="text-slate-400">Version:</span> v{version} · published {publishedAt} by {publishedBy}
              </p>
            </div>
          </div>

          {/* Access notice when read-only */}
          {!access.canEdit && (
            <div className={`rounded-lg border ${access.border} ${access.bg} px-3 py-2 text-xs ${access.color}`}>
              <p className="font-semibold">View only — {access.label}</p>
              <p className="mt-0.5">{access.description}</p>
            </div>
          )}
          {access.canEdit && blocksDrafter && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <p className="font-semibold">Hard limit — Authoriser only</p>
              <p className="mt-0.5">Hard-limit commitments can only be edited by the Authoriser tier (Aaron).</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm-edit modal — drafts the change to Pending Changes rather than
          mutating directly. Demonstrates the draft-first machinery. */}
      {confirmEdit && (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Draft change</p>
            <h3 className="text-slate-800 font-bold text-base mt-1">{confirmEdit.controlLabel}</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-snug">
              In the production prototype, you'd edit the value here. For the MVP demo, confirming below adds this change to the Pending Changes panel as a draft authored by you ({personaName}).
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-3 text-xs text-slate-600">
              <p><span className="text-slate-400">Affects:</span> {blastWorkflows} workflow{blastWorkflows === 1 ? "" : "s"}</p>
              <p className="mt-0.5"><span className="text-slate-400">Routes to:</span> {access.canPublish ? `${personaName} can publish directly` : "Senior tier review"}</p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmEdit(null)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleConfirmEdit} className="text-sm px-3 py-1.5 rounded-lg bg-[#00BDFE] hover:bg-[#0099d4] text-white font-medium">Add to Pending Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
