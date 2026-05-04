import { useState } from "react";
import type { ConfidenceBreakdown, ConfidenceDriver } from "../data/jobs";

// ConfidencePanel — answers "Why is this here?" in three layers:
//   1. Plain-English narrative (always visible) — what most operators read
//   2. Structured signal breakdown (expandable) — diagnostic depth, lets
//      operators verify the model's read and flag wrong signals
//   3. Ask follow-up (link) — fires AskAI for free-form questions
//
// Replaces the bare "Why is this here?" link previously next to RiskBadge.
// The narrative is pre-computed in the prototype data; production would
// generate it live via LLM from the structured drivers.

type Props = {
  narrative?: string;
  breakdown?: ConfidenceBreakdown;
  conf?: number;
  onAskFollowUp?: () => void;
  onFlagSignal?: (driverId: string, label: string) => void;
};

// ─── Per-driver styling ─────────────────────────────────────────────────────
// Color rules:
//   strongly negative (< -0.20): red
//   mildly negative (-0.05 to -0.20): amber
//   neutral (-0.05 to +0.05): slate
//   positive (+0.05+): green
function driverStyle(weight: number): { color: string; bg: string; arrow: string; weightText: string } {
  if (weight < -0.20) return { color: "text-red-700",   bg: "bg-red-50",    arrow: "↓", weightText: "text-red-700" };
  if (weight < -0.05) return { color: "text-amber-700", bg: "bg-amber-50",  arrow: "↓", weightText: "text-amber-700" };
  if (weight >  0.05) return { color: "text-green-700", bg: "bg-green-50",  arrow: "↑", weightText: "text-green-700" };
  return                       { color: "text-slate-600", bg: "bg-slate-50", arrow: "—", weightText: "text-slate-500" };
}

const CATEGORY_LABEL: Record<string, string> = {
  trade_history: "Trade history",
  compliance:    "Compliance",
  workload:      "Workload",
  geo:           "Geography",
  weather:       "Weather",
  equipment:     "Equipment",
  pattern:       "Pattern",
  time:          "Time",
  customer:      "Customer",
  other:         "Other",
};

function DriverRow({ driver, onFlag }: { driver: ConfidenceDriver; onFlag?: () => void }) {
  const style = driverStyle(driver.weight);
  const sign = driver.weight >= 0 ? "+" : "";
  return (
    <div className="border-b border-slate-100 last:border-b-0 py-2">
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className={`font-mono text-base flex-shrink-0 ${style.color}`}>{style.arrow}</span>
          <p className="text-xs font-semibold text-slate-700 leading-snug">{driver.label}</p>
        </div>
        <span className={`text-xs font-mono font-bold tabular-nums flex-shrink-0 ${style.weightText}`}>{sign}{driver.weight.toFixed(2)}</span>
      </div>
      <p className="text-[11px] text-slate-600 leading-snug pl-6">{driver.explanation}</p>
      {driver.evidence && (
        <p className="text-[10px] text-slate-400 leading-snug pl-6 mt-0.5 italic">↳ {driver.evidence}</p>
      )}
      <div className="flex items-center justify-between pl-6 mt-1">
        <span className="text-[9px] text-slate-300 uppercase tracking-wider">{CATEGORY_LABEL[driver.category] ?? driver.category}</span>
        {onFlag && (
          <button onClick={onFlag} className="text-[10px] text-slate-400 hover:text-[#0099d4] hover:underline">Flag this signal</button>
        )}
      </div>
    </div>
  );
}

export default function ConfidencePanel({ narrative, breakdown, conf, onAskFollowUp, onFlagSignal }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Nothing to render if there's no narrative AND no breakdown — caller should
  // gate rendering, but be defensive.
  if (!narrative && !breakdown) return null;

  // Sort drivers by absolute weight (most influential first); split into top 4
  // and the rest.
  const sortedDrivers = breakdown
    ? [...breakdown.drivers].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    : [];
  const visibleDrivers = showAll ? sortedDrivers : sortedDrivers.slice(0, 4);
  const hiddenCount = sortedDrivers.length - visibleDrivers.length;

  // Headline drag indicator — surfaces "1 strong drag" on the header so
  // operators know there's something pointed even before expanding.
  const strongDrags = sortedDrivers.filter(d => d.weight < -0.20).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Narrative — always visible. The thing most operators read. */}
      {narrative && (
        <div className="px-3 py-2.5 bg-white">
          <p className="text-sm text-slate-700 leading-snug">{narrative}</p>
          <div className="flex items-center gap-3 mt-2">
            {breakdown && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-[11px] text-[#0077a8] hover:text-[#00BDFE] font-medium"
              >
                {expanded ? "Hide signals" : "View signals"} {expanded ? "▴" : "▾"}
              </button>
            )}
            {breakdown && strongDrags > 0 && !expanded && (
              <span className="text-[10px] text-red-600 font-medium">{strongDrags} strong drag{strongDrags === 1 ? "" : "s"}</span>
            )}
            {onAskFollowUp && (
              <button
                onClick={onAskFollowUp}
                className="text-[11px] text-slate-500 hover:text-[#00BDFE] hover:underline ml-auto"
              >
                Ask follow-up →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Signals — expandable. Diagnostic depth. */}
      {breakdown && expanded && (
        <div className="px-3 py-2 border-t border-slate-200">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Confidence signals</p>
            <p className="text-[10px] text-slate-400">{conf != null ? `Score ${conf.toFixed(2)}` : ""} · {sortedDrivers.length} contributing</p>
          </div>
          <div className="bg-white rounded border border-slate-200 px-2.5">
            {visibleDrivers.map(d => (
              <DriverRow
                key={d.id}
                driver={d}
                onFlag={onFlagSignal ? () => onFlagSignal(d.id, d.label) : undefined}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[10px] text-[#0077a8] hover:underline mt-1.5"
            >
              Show all {sortedDrivers.length} signals →
            </button>
          )}
          <p className="text-[10px] text-slate-400 mt-1.5">
            Model: {breakdown.modelRefs.join(" · ")} · Last retrain: {breakdown.retrainedAt}
          </p>
        </div>
      )}
    </div>
  );
}
