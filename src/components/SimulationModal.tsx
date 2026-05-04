import type { PendingChange, SimulationResult, SimulationMetric } from "../data/goals";

// SimulationModal — replays a pending change against a historical dataset and
// shows the projected operational impact before publishing. Honest by design:
// surfaces side effects alongside upside, references specific historical
// examples where possible, and lists caveats so the operator knows what
// they're trusting.
//
// Decision flow lives here too: Approve & publish moves the change from
// Pending Changes to the audit log. Cancel returns to the panel without
// changing anything.

type Props = {
  change: PendingChange;
  result: SimulationResult;
  canPublish: boolean;
  onCancel: () => void;
  onPublish: () => void;
};

const DIRECTION_META: Record<SimulationMetric["direction"], { color: string; bg: string; arrow: string; label: string }> = {
  improvement: { color: "text-green-700",  bg: "bg-green-50",   arrow: "↓", label: "Improvement" },
  regression:  { color: "text-red-700",    bg: "bg-red-50",     arrow: "↑", label: "Regression" },
  "side-effect": { color: "text-amber-700", bg: "bg-amber-50",  arrow: "↑", label: "Side effect" },
  neutral:     { color: "text-slate-600",  bg: "bg-slate-50",   arrow: "—", label: "No change" },
};

const RECOMMENDATION_META = {
  approve:        { label: "✓ Recommended: approve",   color: "text-green-700", bg: "bg-green-50",  border: "border-green-200" },
  review_first:   { label: "⚠ Review before publish", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
  do_not_approve: { label: "✕ Recommend against",     color: "text-red-700",   bg: "bg-red-50",    border: "border-red-200" },
} as const;

function MetricRow({ metric }: { metric: SimulationMetric }) {
  const meta = DIRECTION_META[metric.direction];
  return (
    <div className="border-b border-slate-100 last:border-b-0 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 font-medium">{metric.label}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-slate-500">{metric.before}</span>
          <span className="text-slate-400 text-xs">→</span>
          <span className="text-xs font-mono text-slate-800 font-semibold">{metric.after}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${meta.bg} ${meta.color} min-w-[64px] text-center`}>
            <span className="mr-0.5">{meta.arrow}</span>{metric.delta}
          </span>
        </div>
      </div>
      {metric.note && (
        <p className="text-[11px] text-slate-500 leading-snug mt-1 pl-1">{metric.note}</p>
      )}
    </div>
  );
}

export default function SimulationModal({ change, result, canPublish, onCancel, onPublish }: Props) {
  const rec = RECOMMENDATION_META[result.recommendation];

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[80] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Simulation</p>
              <h2 className="text-slate-800 font-bold text-base mt-0.5 leading-snug">{change.target}</h2>
              <p className="text-slate-500 text-xs mt-1 leading-snug">
                <span className="text-slate-400">{change.before}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="text-slate-700 font-medium">{change.after}</span>
              </p>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0">✕ close</button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{result.datasetDescription}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">

          {/* Headline */}
          <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#0077a8] mb-1">Headline</p>
            <p className="text-sm text-slate-800 leading-snug">{result.headline}</p>
          </div>

          {/* Metrics */}
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Projected metric deltas</p>
            <div className="border border-slate-200 rounded-lg px-3 py-1 bg-white">
              {result.metrics.map((m, i) => <MetricRow key={i} metric={m} />)}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-400">
              <span><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />Improvement</span>
              <span><span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1" />Side effect</span>
              <span><span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1" />Regression</span>
              <span><span className="inline-block w-2 h-2 bg-slate-400 rounded-full mr-1" />Neutral</span>
            </div>
          </div>

          {/* Examples */}
          {result.examples.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Examples — jobs that would have behaved differently</p>
              <div className="space-y-1.5">
                {result.examples.map((ex, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-2.5 text-xs">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-mono text-slate-400 text-[10px]">{ex.jobId}</span>
                      <span className="text-slate-500 text-[10px]">·</span>
                      <span className="text-slate-600 text-[11px]">{ex.location}</span>
                    </div>
                    <p className="text-slate-700 leading-snug">{ex.difference}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caveats */}
          {result.caveats.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Caveats</p>
              <ul className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                {result.caveats.map((caveat, i) => (
                  <li key={i} className="text-[11px] text-slate-600 leading-snug flex gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="flex-1">{caveat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className={`rounded-lg border ${rec.border} ${rec.bg} p-3`}>
            <p className={`text-xs font-semibold ${rec.color}`}>{rec.label}</p>
            <p className={`text-[11px] mt-0.5 leading-snug ${rec.color}`}>{result.recommendationNote}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 sticky bottom-0 bg-white flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400 italic">Simulation is illustrative for the prototype. Production replays the event stream.</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            {canPublish ? (
              <button onClick={onPublish} className="text-sm px-3 py-1.5 rounded-lg bg-[#00BDFE] hover:bg-[#0099d4] text-white font-medium">
                Approve &amp; publish with simulation log
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 italic self-center px-2">Publish requires senior tier</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
