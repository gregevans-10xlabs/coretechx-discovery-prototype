import { useState } from "react";
import { STAFF_PERFORMANCE, type KPI } from "../data/scenarios";

// ─── Performance Hub (weighted KPI attainment — all operational personas) ────
// Score = sum(weight × attainment) × 100. Weights ARE the documented performance
// criteria for the role — each quarterly review uses exactly these numbers.
const TIER_META = {
  Platinum: { icon: "👑", color: "text-purple-700 bg-purple-50 border-purple-300", bar: "bg-purple-500", next: null,       label: "Consistently exceeding expectations" },
  Gold:     { icon: "⭐", color: "text-amber-700 bg-amber-50 border-amber-300",   bar: "bg-amber-400",  next: "Platinum",  label: "Meeting expectations"               },
  Silver:   { icon: "🥈", color: "text-slate-600 bg-slate-100 border-slate-300",  bar: "bg-slate-400",  next: "Gold",      label: "Working toward expectations"        },
  Bronze:   { icon: "🥉", color: "text-orange-700 bg-orange-50 border-orange-300",bar: "bg-orange-400", next: "Silver",    label: "Below expectations"                 },
};

type Badge = typeof STAFF_PERFORMANCE[0]["badges"][0];

function attainment(k: KPI): number {
  if (k.lowerIsBetter) {
    if (k.target === 0) return k.current === 0 ? 1 : 0;
    return Math.max(0, 1 - k.current / (k.target * 2));
  }
  return Math.min(k.current / k.target, 1);
}

function computeScore(kpis: KPI[]): number {
  return Math.round(kpis.reduce((sum, k) => sum + k.weight * attainment(k), 0) * 100);
}

function tierFromScore(s: number): keyof typeof TIER_META {
  return s >= 90 ? "Platinum" : s >= 80 ? "Gold" : s >= 70 ? "Silver" : "Bronze";
}

export default function PerformanceHub({ persona }: { persona: string }) {
  const [tab, setTab] = useState<"standing" | "kpis" | "improve">("standing");
  const [hoveredBadge, setHoveredBadge] = useState<Badge | null>(null);
  const perf = STAFF_PERFORMANCE.find(p => p.persona === persona);
  if (!perf) return null;

  const score   = computeScore(perf.kpis);
  const tier    = tierFromScore(score);
  const tm      = TIER_META[tier];
  const nextTier = tm.next as keyof typeof TIER_META | null;

  const tierThreshold: Record<string, number> = { Platinum: 100, Gold: 90, Silver: 80, Bronze: 70 };
  const prevThreshold  = nextTier ? tierThreshold[tier] ?? 70 : (tierThreshold[tier] ?? 80) - 10;
  const scoreProgress  = Math.min(Math.round(((score - prevThreshold) / ((nextTier ? tierThreshold[nextTier] : 100) - prevThreshold)) * 100), 100);

  const trendArrow = perf.weeklyTrend === "up" ? "↑" : perf.weeklyTrend === "down" ? "↓" : "→";
  const trendColor = perf.weeklyTrend === "up" ? "text-green-600" : perf.weeklyTrend === "down" ? "text-red-500" : "text-slate-400";

  // Projected score: apply each improvement action's projected attainment for its KPI
  const projectedScore = Math.round(
    perf.kpis.reduce((sum, k) => {
      const action = perf.improvementActions.find(a => a.kpi === k.label);
      const curr   = attainment(k);
      const proj   = action ? Math.max(curr, action.projectedAttainment) : curr;
      return sum + k.weight * proj;
    }, 0) * 100
  );
  const projTier = tierFromScore(projectedScore);
  const tierUp   = projTier !== tier;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        {(["standing", "kpis", "improve"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${
              tab === t ? "bg-[#00BDFE] text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}>
            {t === "standing" ? "Standing" : t === "kpis" ? "My KPIs" : "Improve"}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">

        {/* ── STANDING tab ── */}
        {tab === "standing" && (
          <>
            {/* Tier + score */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${tm.color}`}>
                  {tm.icon} {tier}
                </span>
                <p className="text-slate-400 text-[9px] mt-1 ml-0.5">{tm.label}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-800">{score}</span>
                <span className="text-slate-400 text-xs ml-0.5">%</span>
              </div>
            </div>

            {/* Score-to-next-tier bar */}
            {nextTier && (
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-400">{tier}</span>
                  <span className="text-slate-500 font-semibold">{tierThreshold[nextTier] - score}% to {nextTier}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${tm.bar}`} style={{ width: `${scoreProgress}%` }} />
                </div>
              </div>
            )}

            {/* Rank */}
            {perf.rank && perf.rankTotal && (
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[10px] mb-0.5">Your rank</p>
                  <p className="text-slate-800 font-black text-xl leading-none">
                    #{perf.rank}
                    <span className="text-slate-400 text-xs font-normal ml-1">of {perf.rankTotal}</span>
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{perf.rankNoun}</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${trendColor}`}>{trendArrow}</span>
                  <p className="text-slate-400 text-[10px] mt-0.5 leading-tight max-w-20">{perf.trendDetail}</p>
                </div>
              </div>
            )}

            {/* Streak */}
            {perf.streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-base">🔥</span>
                <p className="text-orange-700 text-xs font-semibold">{perf.streak}-day improvement streak</p>
              </div>
            )}

            {/* Next rank gap */}
            {perf.nextRankGap && (
              <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-[#00BDFE] text-xs flex-shrink-0 mt-0.5">→</span>
                <p className="text-[#0077a8] text-[10px] leading-snug">{perf.nextRankGap}</p>
              </div>
            )}

            {/* Mini leaderboard */}
            {perf.leaderboard.length > 0 && (
              <div>
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Leaderboard</p>
                <div className="space-y-1">
                  {perf.leaderboard.map((e, i) => (
                    <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs ${
                      e.isYou ? "bg-[#e0f7ff] border border-[#00BDFE]/30 font-semibold" : "bg-slate-50"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 ${e.isYou ? "text-[#0077a8]" : "text-slate-400"}`}>
                          #{i + 1}
                        </span>
                        {e.isYou
                          ? <span className="text-[#0077a8]">You</span>
                          : <span className="text-slate-400 text-[10px]">{e.label ?? "—"}</span>
                        }
                      </div>
                      <span className={`font-bold tabular-nums ${e.isYou ? "text-[#0077a8]" : "text-slate-400"}`}>
                        {e.isYou ? score : e.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            <div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Badges</p>
              <div className="flex flex-wrap gap-1.5" onMouseLeave={() => setHoveredBadge(null)}>
                {perf.badges.map((b, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoveredBadge(b)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border cursor-default transition-all ${
                      b.earned
                        ? `bg-white border-slate-200 text-slate-700 font-semibold ${hoveredBadge?.label === b.label ? "border-slate-400 shadow-sm" : "hover:border-slate-300"}`
                        : `bg-slate-50 border-slate-100 text-slate-300 ${hoveredBadge?.label === b.label ? "border-slate-300" : "hover:border-slate-200"}`
                    }`}>
                    <span className={b.earned ? "" : "opacity-30"}>{b.icon}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
              {hoveredBadge ? (
                <div className="mt-2 bg-slate-800 rounded-xl px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{hoveredBadge.icon}</span>
                      <span className="text-white text-xs font-semibold">{hoveredBadge.label}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      hoveredBadge.earned ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {hoveredBadge.earned ? "✓ Earned" : "Not yet"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px] leading-relaxed">{hoveredBadge.desc}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-[9px] mt-1.5">Hover a badge to see what it means</p>
              )}
            </div>
          </>
        )}

        {/* ── KPIs tab ── */}
        {tab === "kpis" && (
          <>
            <p className="text-slate-500 text-[10px] leading-snug">{perf.highlight}</p>
            <div className="space-y-3">
              {perf.kpis.map(k => {
                const att      = attainment(k);
                const pct      = Math.round(att * 100);
                const onTarget = k.lowerIsBetter ? k.current <= k.target : k.current >= k.target;
                const barColor = onTarget ? "bg-green-400" : k.trend === "behind" || k.trend === "down" ? "bg-red-400" : "bg-amber-400";
                const textColor= onTarget ? "text-green-600" : k.trend === "behind" || k.trend === "down" ? "text-red-600" : "text-amber-600";
                const isPercent= k.unit === "%" || k.unit === "h";
                return (
                  <div key={k.label}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-slate-600 text-xs leading-tight">{k.label}</p>
                      <p className={`text-xs font-bold flex-shrink-0 ${textColor}`}>
                        {k.current}{isPercent ? k.unit : ""}
                        <span className="text-slate-300 font-normal"> / {k.target}{isPercent ? k.unit : ""}</span>
                      </p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-slate-400 text-[10px]">
                        {!isPercent ? k.unit + " " : ""}
                        {onTarget ? "✓ On target" : `${k.lowerIsBetter ? "reduce to" : "target"} ${k.target}${isPercent ? k.unit : ""}`}
                      </p>
                      <p className="text-slate-300 text-[9px]">{Math.round(k.weight * 100)}% of score</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-slate-400 text-[9px] leading-snug pt-1 border-t border-slate-100">
              Weights reflect your documented performance criteria — the same values your manager uses in quarterly and annual reviews.
            </p>
          </>
        )}

        {/* ── IMPROVE tab ── */}
        {tab === "improve" && (
          <>
            {/* Weekly challenge */}
            <div className="bg-gradient-to-br from-[#e0f7ff] to-white border border-[#00BDFE]/30 rounded-xl px-3 py-2.5">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">This week's focus</p>
              <p className="text-slate-800 text-sm font-bold leading-snug">{perf.weeklyChallenge}</p>
            </div>

            {/* Action plan */}
            <div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Actions your manager would direct</p>
              <div className="space-y-2">
                {perf.improvementActions.map((action, i) => {
                  const kpiData  = perf.kpis.find(k => k.label === action.kpi);
                  const currAtt  = kpiData ? attainment(kpiData) : 0;
                  const delta    = kpiData ? Math.round((Math.max(currAtt, action.projectedAttainment) - currAtt) * kpiData.weight * 100) : 0;
                  return (
                    <div key={i} className={`rounded-xl border p-2.5 ${action.urgent ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-slate-800 text-xs font-semibold leading-snug flex-1">{action.task}</p>
                        {delta > 0 && (
                          <span className="text-[#0077a8] text-[10px] font-bold flex-shrink-0 bg-[#e0f7ff] px-1.5 py-0.5 rounded-full whitespace-nowrap">+{delta}%</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[10px] leading-snug mb-1.5">{action.detail}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 italic truncate">{action.kpi}</span>
                        {action.badge && (
                          <>
                            <span className="text-slate-200 flex-shrink-0">·</span>
                            <span className="text-[10px] text-amber-600 font-semibold flex-shrink-0">→ {action.badge}</span>
                          </>
                        )}
                        {action.urgent && (
                          <span className="text-[10px] text-amber-600 font-bold ml-auto flex-shrink-0">⏰ Today</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score projection */}
            <div className={`rounded-xl border px-3 py-2.5 ${tierUp ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"}`}>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">If you complete all of the above</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm tabular-nums">{score}%</span>
                <span className="text-slate-300 text-xs">→</span>
                <span className={`text-2xl font-black tabular-nums ${tierUp ? "text-amber-600" : "text-slate-800"}`}>{projectedScore}%</span>
                {tierUp && (
                  <span className="ml-auto text-xs font-bold text-amber-600 flex-shrink-0">
                    {TIER_META[projTier].icon} {projTier}!
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[10px] mt-1">
                {tierUp
                  ? `+${projectedScore - score}% — tier promotion unlocked`
                  : `+${projectedScore - score}% performance improvement`
                }
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
