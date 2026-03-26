import { KERRIE_JOBS, type InsuranceJob, type JobFlag } from "../data/scenarios";

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_STYLE: Record<InsuranceJob["stage"], { badge: string; dot: string; order: number }> = {
  "Pending portal update": { badge: "bg-orange-900 text-orange-300", dot: "bg-orange-400", order: 1 },
  "Awaiting completion":   { badge: "bg-purple-900 text-purple-300", dot: "bg-purple-400", order: 2 },
  "Work in progress":      { badge: "bg-green-900  text-green-300",  dot: "bg-green-400",  order: 3 },
  "Trades allocated":      { badge: "bg-blue-900   text-blue-300",   dot: "bg-blue-400",   order: 4 },
  "Scope approved":        { badge: "bg-yellow-900 text-yellow-300", dot: "bg-yellow-400", order: 5 },
  "Assessment booked":     { badge: "bg-gray-700   text-gray-300",   dot: "bg-gray-400",   order: 6 },
};

const FLAG_CONFIG: Record<JobFlag["type"], { icon: string; color: string; label: string }> = {
  kpi_timer:        { icon: "⏱", color: "text-red-400",    label: "KPI timer"    },
  portal_update_due:{ icon: "🔔", color: "text-orange-400", label: "Portal due"   },
  trade_overdue:    { icon: "⚠", color: "text-red-400",    label: "Trade overdue" },
};

function FlagBadge({ flag }: { flag: JobFlag }) {
  const cfg = FLAG_CONFIG[flag.type];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-gray-700 ${cfg.color}`}
      title={flag.detail}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function JobRow({ job, urgent }: { job: InsuranceJob; urgent: boolean }) {
  const stage = STAGE_STYLE[job.stage];
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${urgent ? "bg-red-950/20 border-red-900/50" : "bg-gray-800 border-gray-700"}`}>
      <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">

        {/* Job ID + customer */}
        <div className="flex-shrink-0 w-28">
          <p className="text-gray-300 font-mono text-xs font-semibold">{job.id}</p>
          <p className="text-white text-xs font-medium mt-0.5 leading-tight">{job.customer}</p>
          <p className="text-gray-500 text-xs">{job.suburb}</p>
        </div>

        {/* Insurer + stage */}
        <div className="flex-shrink-0 w-24">
          <p className="text-gray-400 text-xs mb-1">{job.insurer}</p>
          <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${stage.badge}`}>
            {job.stage}
          </span>
        </div>

        {/* Next action */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-snug ${urgent ? "text-red-200" : "text-gray-200"}`}>
            {job.nextAction}
          </p>
          {job.nextTradeDate && (
            <p className="text-gray-500 text-xs mt-0.5">Trade: {job.nextTradeDate}</p>
          )}
        </div>

        {/* Flags */}
        {job.flags.length > 0 && (
          <div className="flex flex-wrap gap-1 flex-shrink-0">
            {job.flags.map((f, i) => <FlagBadge key={i} flag={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const TOTAL_JOBS = 80;

export default function CoordinatorView() {
  const urgent  = KERRIE_JOBS.filter(j => j.flags.length > 0);
  const routine = KERRIE_JOBS.filter(j => j.flags.length === 0)
    .sort((a, b) => STAGE_STYLE[a.stage].order - STAGE_STYLE[b.stage].order);

  const flagCounts = {
    kpi_timer:         KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "kpi_timer").length,
    portal_update_due: KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "portal_update_due").length,
    trade_overdue:     KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "trade_overdue").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="text-white font-semibold text-sm">My Jobs</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {KERRIE_JOBS.length} shown · {TOTAL_JOBS} total · Insurance · National
            </p>
          </div>
          {urgent.length > 0 && (
            <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-3 py-1 rounded-full font-medium">
              {urgent.length} need attention now
            </span>
          )}
        </div>

        {/* Flag summary */}
        <div className="flex flex-wrap gap-2">
          {flagCounts.kpi_timer > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-700/60 rounded-lg px-2.5 py-1.5">
              <span className="text-red-400 text-sm">⏱</span>
              <span className="text-xs text-gray-300">{flagCounts.kpi_timer} KPI timer{flagCounts.kpi_timer > 1 ? "s" : ""}</span>
            </div>
          )}
          {flagCounts.portal_update_due > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-700/60 rounded-lg px-2.5 py-1.5">
              <span className="text-orange-400 text-sm">🔔</span>
              <span className="text-xs text-gray-300">{flagCounts.portal_update_due} portal update{flagCounts.portal_update_due > 1 ? "s" : ""} due</span>
            </div>
          )}
          {flagCounts.trade_overdue > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-700/60 rounded-lg px-2.5 py-1.5">
              <span className="text-red-400 text-sm">⚠</span>
              <span className="text-xs text-gray-300">{flagCounts.trade_overdue} trade{flagCounts.trade_overdue > 1 ? "s" : ""} overdue</span>
            </div>
          )}
          {urgent.length === 0 && (
            <div className="flex items-center gap-1.5 bg-gray-700/60 rounded-lg px-2.5 py-1.5">
              <span className="text-green-400 text-sm">✓</span>
              <span className="text-xs text-gray-300">No urgent flags</span>
            </div>
          )}
        </div>
      </div>

      {/* Urgent jobs */}
      {urgent.length > 0 && (
        <div>
          <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Needs attention now — {urgent.length} job{urgent.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {urgent.map(j => <JobRow key={j.id} job={j} urgent />)}
          </div>
        </div>
      )}

      {/* Routine jobs */}
      {routine.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            On track — {routine.length} job{routine.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {routine.map(j => <JobRow key={j.id} job={j} urgent={false} />)}
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-gray-600 text-xs pb-1">
        Showing {KERRIE_JOBS.length} of {TOTAL_JOBS} jobs · Sorted by urgency then stage · Flags auto-generated from SLA rules
      </p>
    </div>
  );
}
