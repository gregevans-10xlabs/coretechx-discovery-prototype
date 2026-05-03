import type { ShadowTrade } from "../data/jobs";
import TradeLink from "./TradeLink";

// ShadowPlanPill — surfaces the pre-computed backup trade attached to a job.
// Two modes: `compact` for queue cards (small chip), default for the job
// detail panel (a fuller framed row).
//
// Why this exists: shadow plans are the most distinctive operational primitive
// in the spec — a 60-second cancellation-to-replacement guarantee depends on
// the backup being pre-computed and visible, not buried in the AI log.

type Props = {
  shadow: ShadowTrade;
  compact?: boolean;
  onSelectTrade?: (name: string) => void;
};

function formatTrailing(s: ShadowTrade): string {
  const parts: string[] = [];
  if (s.etaMin != null) parts.push(`${s.etaMin}min`);
  else if (s.distanceKm != null) parts.push(`${s.distanceKm}km`);
  if (s.rating != null) parts.push(`★${s.rating.toFixed(1)}`);
  return parts.join(" · ");
}

export default function ShadowPlanPill({ shadow, compact, onSelectTrade }: Props) {
  const activated = shadow.activated === true;
  const trailing = formatTrailing(shadow);

  if (compact) {
    // Single chip for the queue card — needs to stay small and scannable.
    // Trade name truncates to keep the row tidy; full detail lives on the
    // detail panel.
    const truncated = shadow.name.length > 22 ? shadow.name.slice(0, 22) + "…" : shadow.name;
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium border inline-flex items-center gap-1 ${
          activated
            ? "bg-amber-50 border-amber-300 text-amber-700"
            : "bg-slate-50 border-slate-200 text-slate-600"
        }`}
        title={`${activated ? "Shadow active" : "Shadow ready"}: ${shadow.name}${trailing ? " · " + trailing : ""}${shadow.softReserved ? " · soft-reserved" : ""}`}
      >
        <span className="text-slate-400" aria-hidden>↯</span>
        <span className="truncate max-w-[140px]">{activated ? "Shadow active" : "Shadow"}: {truncated}</span>
      </span>
    );
  }

  // Detail mode — small framed panel slotted into the job detail view above
  // the activity log so the operator sees the safety net before reading the
  // narrative of what's gone wrong.
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        activated
          ? "bg-amber-50 border-amber-300"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${activated ? "text-amber-700" : "text-slate-500"}`}>
          <span className="mr-1" aria-hidden>↯</span>
          {activated ? "Shadow active" : "Shadow plan ready"}
        </span>
        <span className={`text-[10px] font-medium ${activated ? "text-amber-600" : "text-slate-400"}`}>
          {activated ? `Activated ${shadow.activatedAt ?? ""}`.trim() : (shadow.softReserved ? "Soft-reserved" : "Available")}
        </span>
      </div>
      <p className="text-sm text-slate-700 leading-snug">
        <TradeLink name={shadow.name} onSelectTrade={onSelectTrade} className="text-slate-700 font-medium" />
      </p>
      {trailing && (
        <p className="text-[11px] text-slate-500 mt-0.5">{trailing}</p>
      )}
    </div>
  );
}
