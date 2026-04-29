import { useState } from "react";
import { type Job, type Commitment, type CommitmentState } from "../data/jobs";
import {
  COMMITMENT_STATE_META,
  COMMITMENT_CLASS_META,
  COMMITMENT_CONTROL_META,
  COMMITMENT_REL_META,
} from "../data/scenarios";

// CommitmentAnatomy — exposes the canonical 5-field commitment structure
// (Discovery OS Commitment Model Specification, updated 29 Apr 2026).
//
// Operators reason about Jobs; this block surfaces the underlying Commitment
// graph for those who want the deeper structure. Read-only in v1 — the
// commitment lifecycle is driven by events and proof, not direct UI edits.
//
// Default view shows only currently-live commitments (Active, In Progress,
// Breach) plus the most recently Closed for context. "Show all" expands.

const LIVE_STATES: CommitmentState[] = ["active", "in_progress", "breach", "potential"];

function CommitmentCard({ c }: { c: Commitment }) {
  const stateMeta = COMMITMENT_STATE_META[c.state];
  const classMeta = COMMITMENT_CLASS_META[c.klass];
  const controlMeta = COMMITMENT_CONTROL_META[c.controlMode];
  const isVoided = c.state === "voided";
  const isBreach = c.state === "breach";

  return (
    <div className={`rounded-lg border p-3 transition-all ${
      isBreach ? "bg-red-50 border-red-200" :
      isVoided ? "bg-slate-50 border-slate-200 opacity-60" :
      "bg-white border-slate-200"
    }`}>
      {/* Top row — state + class + floating tag + ID */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border inline-flex items-center gap-1 ${stateMeta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stateMeta.dot}`} />
            {stateMeta.label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${classMeta.color}`}>
            {classMeta.label}
          </span>
          {c.type === "floating" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium border border-amber-300 bg-amber-50 text-amber-700" title="Floating — created at runtime in response to an event">
              ↯ Floating
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono text-slate-300 flex-shrink-0">{c.id}</span>
      </div>

      {/* Promise — what must become true */}
      <p className={`text-sm leading-snug font-medium mb-2 ${isVoided ? "line-through text-slate-500" : "text-slate-800"}`}>
        {c.promise}
      </p>

      {/* Owner + control mode */}
      <div className="flex items-center justify-between gap-2 text-xs mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-400 text-[10px] uppercase tracking-wide flex-shrink-0">Owner</span>
          <span className="text-slate-700 truncate">{c.owner}</span>
          {c.ownerTier && <span className="text-slate-400 text-[10px] flex-shrink-0">· {c.ownerTier}</span>}
        </div>
        <span className={`text-[10px] font-semibold ${controlMeta.color} flex-shrink-0`}>
          {controlMeta.label}
        </span>
      </div>

      {/* Body fields */}
      <div className="space-y-1 text-xs">
        <FieldRow label="Proof required" value={c.proofRequired} />
        {c.breachEarly && <FieldRow label="Breach (early)" value={c.breachEarly} muted />}
        {c.breachHard && <FieldRow label="Breach (hard)" value={c.breachHard} alert />}
        {c.autonomyProgression && <FieldRow label="Autonomy" value={c.autonomyProgression} muted />}
        {c.voidedReason && <FieldRow label="Voided" value={c.voidedReason} muted />}
        {c.relationships && c.relationships.length > 0 && (
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-slate-400 text-[10px] uppercase tracking-wide flex-shrink-0 w-24">Relationships</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {c.relationships.map((r, i) => (
                <span key={i} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                  <span className="text-slate-400">{COMMITMENT_REL_META[r.type]?.label ?? r.type}:</span>{" "}
                  <span className="font-medium">{r.target}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({ label, value, muted, alert }: { label: string; value: string; muted?: boolean; alert?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-slate-400 text-[10px] uppercase tracking-wide flex-shrink-0 w-24">{label}</span>
      <span className={`leading-snug ${alert ? "text-red-700" : muted ? "text-slate-500" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

export default function CommitmentAnatomy({ job }: { job: Job }) {
  const [showAll, setShowAll] = useState(false);
  const all = job.commitments ?? [];

  if (all.length === 0) {
    return (
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Commitments</p>
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-4 text-center">
          <p className="text-slate-500 text-xs">Commitments not yet modelled for this job type.</p>
          <p className="text-slate-400 text-[11px] mt-1">Demo coverage: Starlink CG36110 · Insurance CG36069 · Harvey Norman CG35958 · AHO CG36385.</p>
        </div>
      </div>
    );
  }

  // Live = currently-actionable (active, in_progress, breach, potential).
  // Default view also includes the most-recently-closed for "what just happened" context.
  const live = all.filter(c => LIVE_STATES.includes(c.state));
  const closed = all.filter(c => c.state === "closed");
  const voided = all.filter(c => c.state === "voided");
  const recentClosed = closed.slice(-1); // last closed item for context
  const defaultVisible = [...live, ...recentClosed];
  const visible = showAll ? all : defaultVisible;
  const hidden = all.length - visible.length;

  // Sort visible: breach first, then active, in_progress, potential, then closed/voided
  const stateOrder: Record<string, number> = {
    breach: 0, active: 1, in_progress: 2, potential: 3, proven: 4, recovered: 5, closed: 6, voided: 7, specific: 8,
  };
  const sorted = [...visible].sort((a, b) => (stateOrder[a.state] ?? 9) - (stateOrder[b.state] ?? 9));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Commitments</p>
          <p className="text-slate-400 text-[10px] mt-0.5">
            {all.length} total · {live.length} live · {closed.length} closed{voided.length > 0 ? ` · ${voided.length} voided` : ""}
          </p>
        </div>
        {all.length > defaultVisible.length && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-[11px] text-[#00BDFE] hover:text-[#0099d4] hover:underline font-medium"
          >
            {showAll ? `Show live only (hide ${hidden} more)` : `Show all (${all.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map(c => <CommitmentCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}
