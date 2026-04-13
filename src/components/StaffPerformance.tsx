import { STAFF_PERFORMANCE, type KPI, type Badge, type LeaderboardEntry, type TeamMember } from "../data/scenarios";

// ─── Tier config (light theme) ────────────────────────────────────────────────
const TIER = {
  Platinum: { icon:"💎", label:"Platinum", color:"text-purple-700", bg:"bg-purple-50",  border:"border-purple-300", glow:"from-purple-50",  bar:"bg-purple-400" },
  Gold:     { icon:"⭐", label:"Gold",     color:"text-amber-700",  bg:"bg-amber-50",   border:"border-amber-300",  glow:"from-amber-50",   bar:"bg-amber-400"  },
  Silver:   { icon:"🥈", label:"Silver",   color:"text-slate-600",  bg:"bg-slate-100",  border:"border-slate-300",  glow:"from-slate-50",   bar:"bg-slate-400"  },
  Bronze:   { icon:"🥉", label:"Bronze",   color:"text-orange-700", bg:"bg-orange-50",  border:"border-orange-300", glow:"from-orange-50",  bar:"bg-orange-400" },
};

const MEDAL = ["🥇","🥈","🥉"];
const ORDINAL = ["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"];
const ordinal = (n: number) => ORDINAL[n] ?? `${n}th`;

// ─── KPI helpers ──────────────────────────────────────────────────────────────
function kpiScore(kpi: KPI): number {
  if (kpi.lowerIsBetter) {
    if (kpi.current === 0) return 1;
    if (kpi.target === 0)  return 0;
    return kpi.target / kpi.current;
  }
  return kpi.current / kpi.target;
}

function barColor(s: number)  { return s >= 1.0 ? "bg-green-400" : s >= 0.92 ? "bg-[#00BDFE]" : s >= 0.8 ? "bg-amber-400" : "bg-red-400"; }
function textColor(s: number) { return s >= 1.0 ? "text-green-600" : s >= 0.92 ? "text-[#0099d4]" : s >= 0.8 ? "text-amber-600" : "text-red-500"; }

function fmtVal(kpi: KPI, n: number): string {
  if (kpi.unit === "%") return `${n}%`;
  if (kpi.unit === "h") return `${n}h`;
  return `${n}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPIRow({ kpi }: { kpi: KPI }) {
  const score    = kpiScore(kpi);
  const barWidth = Math.min(score, 1) * 100;
  const atTarget = score >= 1.0;
  const unitLabel = kpi.unit !== "%" && kpi.unit !== "h" ? kpi.unit : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-500 text-xs">
          {kpi.label}
          {unitLabel && <span className="text-slate-400 ml-1 text-[10px]">({unitLabel})</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {atTarget && <span className="text-green-500 text-xs">✓ On target</span>}
          <span className={`text-xs font-semibold font-mono ${textColor(score)}`}>{fmtVal(kpi, kpi.current)}</span>
          <span className="text-slate-400 text-xs">/ {fmtVal(kpi, kpi.target)}</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${barColor(score)}`} style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
}

function BadgeChip({ badge }: { badge: Badge }) {
  return (
    <div
      title={badge.desc}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border select-none ${
        badge.earned
          ? "bg-[#e0f7ff] border-[#00BDFE] text-[#0099d4]"
          : "bg-slate-50 border-slate-200 text-slate-400 opacity-50"
      }`}
    >
      <span>{badge.earned ? badge.icon : "🔒"}</span>
      <span className="font-medium">{badge.label}</span>
    </div>
  );
}

function LeaderRow({ entry, rank, anonymize }: { entry: LeaderboardEntry; rank: number; anonymize: boolean }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  const nameEl = entry.isYou
    ? <span className="w-20 shrink-0 font-medium text-[#0099d4]">★ You</span>
    : anonymize
      ? <span className="w-20 shrink-0 text-slate-300 tracking-widest">— — —</span>
      : <span className="w-20 shrink-0 font-medium text-slate-500 truncate">{entry.label}</span>;

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${entry.isYou ? "bg-[#e0f7ff] border border-[#00BDFE]/40" : ""}`}>
      <span className="w-5 text-center shrink-0">
        {medal !== null ? medal : <span className="text-slate-400">{rank}</span>}
      </span>
      {nameEl}
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${entry.isYou ? "bg-[#00BDFE]" : "bg-slate-300"}`}
          style={{ width: `${entry.score}%` }}
        />
      </div>
      <span className={`font-mono w-7 text-right shrink-0 ${entry.isYou ? "text-[#0099d4]" : "text-slate-400"}`}>
        {entry.score}
      </span>
    </div>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const t = TIER[member.tier];
  const trendIcon  = member.trend === "up" ? "↑" : member.trend === "down" ? "↓" : "→";
  const trendColor = member.trend === "up" ? "text-green-600" : member.trend === "down" ? "text-red-500" : "text-slate-400";
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-slate-800 text-xs font-semibold">{member.name}</p>
          <p className="text-slate-400 text-[10px]">{member.role}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${trendColor}`}>{trendIcon}</span>
          <span className={`${t.bg} ${t.border} ${t.color} border px-2 py-0.5 rounded-full text-[10px] font-bold`}>
            {t.icon} {member.score}
          </span>
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
        <div className={`h-1.5 rounded-full ${t.bar}`} style={{ width: `${member.score}%` }} />
      </div>
      <p className="text-slate-400 text-[10px] leading-relaxed">{member.concern}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StaffPerformance({ persona }: { persona: string }) {
  const data = STAFF_PERFORMANCE.find(d => d.persona === persona);
  if (!data) return null;

  const tier        = TIER[data.tier];
  const earnedCount = data.badges.filter(b => b.earned).length;
  const trendIcon   = data.weeklyTrend === "up" ? "↑" : data.weeklyTrend === "down" ? "↓" : "→";
  const trendColor  = data.weeklyTrend === "up" ? "text-green-600" : data.weeklyTrend === "down" ? "text-red-500" : "text-slate-400";

  const isManagerView = data.rank === null;
  const anonymizeLeaderboard = !isManagerView;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Tier header band */}
      <div className={`px-4 py-3 bg-gradient-to-r ${tier.glow} to-transparent flex items-center justify-between border-b border-slate-100`}>
        <div>
          <p className="text-slate-800 font-semibold text-sm">
            {isManagerView ? "Team Performance" : "Weekly Performance"}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{data.role}</p>
        </div>
        <div className="flex items-center gap-2.5">
          {data.streak > 0 && (
            <span className="text-orange-500 text-xs font-bold">🔥 {data.streak}w streak</span>
          )}
          <span className={`${tier.bg} ${tier.border} ${tier.color} border px-2.5 py-0.5 rounded-full text-xs font-bold`}>
            {tier.icon} {tier.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Rank hero (staff) / Team score summary (manager) */}
        {!isManagerView ? (
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{MEDAL[data.rank! - 1] ?? "🎯"}</span>
            <div>
              <p className="text-slate-800 font-bold text-2xl leading-none">{ordinal(data.rank!)}</p>
              <p className="text-slate-400 text-xs mt-0.5">of {data.rankTotal} {data.rankNoun}</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-xs font-medium ${trendColor}`}>{trendIcon} {data.trendDetail}</p>
              <p className="text-slate-400 text-xs mt-0.5">{earnedCount}/{data.badges.length} badges earned</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center shrink-0">
              <p className="text-slate-800 font-bold text-2xl leading-none">{data.score}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">team avg</p>
            </div>
            <div>
              <p className={`text-xs font-medium ${trendColor}`}>{trendIcon} {data.trendDetail}</p>
              <p className="text-slate-400 text-xs mt-1">{earnedCount}/{data.badges.length} team badges earned</p>
            </div>
          </div>
        )}

        {/* Manager: team member cards */}
        {data.teamMembers && data.teamMembers.length > 0 && (
          <div>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Team This Week</p>
            <div className="grid grid-cols-2 gap-2">
              {data.teamMembers.map((m, i) => <TeamMemberCard key={i} member={m} />)}
            </div>
          </div>
        )}

        {/* Manager: where to improve */}
        {data.improvements && data.improvements.length > 0 && (
          <div>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Where to Focus Next</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2.5">
              {data.improvements.map((item, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-amber-500 shrink-0 mt-px">→</span>
                  <p className="text-slate-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peer leaderboard */}
        {data.leaderboard.length > 0 && (
          <div>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
              {!isManagerView ? "Peer Leaderboard" : "Top Performers This Week"}
            </p>
            {anonymizeLeaderboard && (
              <p className="text-slate-300 text-[10px] mb-1">Colleague scores are anonymised</p>
            )}
            <div className="space-y-0.5">
              {data.leaderboard.map((entry, i) => (
                <LeaderRow key={i} entry={entry} rank={i + 1} anonymize={anonymizeLeaderboard} />
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Achievements</p>
          <div className="flex flex-wrap gap-1.5">
            {data.badges.map((b, i) => <BadgeChip key={i} badge={b} />)}
          </div>
        </div>

        {/* Weekly challenge */}
        <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-lg px-3 py-2.5">
          <p className="text-[#0099d4] text-[10px] font-semibold uppercase tracking-wider mb-1">Weekly Challenge</p>
          <p className="text-[#0099d4]/80 text-xs">{data.weeklyChallenge}</p>
        </div>

        {/* KPI targets */}
        <div>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            {isManagerView ? "Team KPIs" : "This Week's Targets"}
          </p>
          <div className="space-y-3">
            {data.kpis.map((kpi, i) => <KPIRow key={i} kpi={kpi} />)}
          </div>
        </div>

        {/* Insight */}
        <p className="text-[#0099d4]/70 text-xs italic border-l-2 border-[#00BDFE]/40 pl-3">
          {data.highlight}
        </p>

        <p className="text-slate-300 text-[10px]">
          {isManagerView ? "Individual scores shown to managers only. Peer rankings are anonymised for staff." : "Rankings are anonymised. Data refreshes daily."}
        </p>
      </div>
    </div>
  );
}
