import { STAFF_PERFORMANCE, type KPI } from "../data/scenarios";

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const ordinal = (n: number) => ORDINAL[n] ?? `${n}th`;

function kpiScore(kpi: KPI): number {
  // Returns 0–1+ where >= 1 means at/above target
  return kpi.lowerIsBetter
    ? kpi.target / kpi.current
    : kpi.current / kpi.target;
}

function barColor(score: number): string {
  if (score >= 1.0)  return "bg-green-500";
  if (score >= 0.92) return "bg-blue-500";
  if (score >= 0.80) return "bg-yellow-500";
  return "bg-orange-500";
}

function valueColor(score: number): string {
  if (score >= 1.0)  return "text-green-400";
  if (score >= 0.92) return "text-blue-400";
  if (score >= 0.80) return "text-yellow-400";
  return "text-orange-400";
}

function formatValue(kpi: KPI): string {
  if (kpi.unit === "/5.0") return `${kpi.current.toFixed(1)}${kpi.unit}`;
  if (kpi.unit === "h")    return `${kpi.current}${kpi.unit}`;
  return `${kpi.current}${kpi.unit}`;
}

function formatTarget(kpi: KPI): string {
  if (kpi.unit === "/5.0") return `${kpi.target.toFixed(1)}`;
  return `${kpi.target}${kpi.unit}`;
}

function KPIRow({ kpi }: { kpi: KPI }) {
  const score = kpiScore(kpi);
  const barWidth = Math.min(score, 1) * 100;
  const atTarget = score >= 1.0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-300 text-xs">{kpi.label}</span>
        <div className="flex items-center gap-2">
          {atTarget && (
            <span className="text-green-500 text-xs font-medium">✓ On target</span>
          )}
          <span className={`text-xs font-semibold font-mono ${valueColor(score)}`}>
            {formatValue(kpi)}
          </span>
          <span className="text-gray-600 text-xs">/ {formatTarget(kpi)}</span>
        </div>
      </div>
      <div className="relative w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor(score)}`}
          style={{ width: `${barWidth}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50"
          style={{ left: "100%" }}
        />
      </div>
    </div>
  );
}

export default function StaffPerformance({ persona }: { persona: string }) {
  const data = STAFF_PERFORMANCE[persona];
  if (!data) return null;

  const kpisAtTarget = data.kpis.filter(k => kpiScore(k) >= 1.0).length;
  const trendIcon = data.weeklyTrend === "up" ? "↑" : data.weeklyTrend === "down" ? "↓" : "→";
  const trendColor =
    data.weeklyTrend === "up"   ? "text-green-400" :
    data.weeklyTrend === "down" ? "text-orange-400" :
    "text-gray-400";

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-white font-semibold text-sm">Your Performance This Week</h2>
          <p className="text-gray-500 text-xs mt-0.5">{data.role}</p>
        </div>
        <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-800">
          {kpisAtTarget} of {data.kpis.length} KPIs on target
        </span>
      </div>

      {/* Rank + trend row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
          <span className="text-white font-bold text-sm">{ordinal(data.rank)}</span>
          <span className="text-gray-400 text-xs">of {data.rankTotal} {data.rankLabel} this week</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{data.trendDetail}</span>
        </div>
      </div>

      {/* Highlight */}
      <p className="text-indigo-300 text-xs italic border-l-2 border-indigo-700 pl-3 mb-4">
        {data.highlight}
      </p>

      {/* KPIs */}
      <div className="space-y-3">
        {data.kpis.map((kpi, i) => (
          <KPIRow key={i} kpi={kpi} />
        ))}
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-4">
        Peer ranking is anonymised. Data refreshes daily. Focus on creating space to grow — not just hitting numbers.
      </p>
    </div>
  );
}
