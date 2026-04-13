import { useState } from "react";
import { KERRIE_JOBS, type InsuranceJob, type JobFlag } from "../data/scenarios";

// ─── Insurance lifecycle stages (in order) ───────────────────────────────────
const LIFECYCLE_STAGES = [
  "Assessment booked",
  "Scope approved",
  "Trades allocated",
  "Work in progress",
  "Awaiting completion",
  "Pending portal update",
] as const;

const STAGE_STYLE: Record<InsuranceJob["stage"], { badge: string; dot: string; order: number }> = {
  "Assessment booked":   { badge: "bg-slate-100 text-slate-600",   dot: "bg-slate-400",   order: 1 },
  "Scope approved":      { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",   order: 2 },
  "Trades allocated":    { badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-400",    order: 3 },
  "Work in progress":    { badge: "bg-green-100 text-green-700",   dot: "bg-green-500",   order: 4 },
  "Awaiting completion": { badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400",  order: 5 },
  "Pending portal update":{ badge: "bg-orange-100 text-orange-700",dot: "bg-orange-400",  order: 6 },
};

const FLAG_CONFIG: Record<JobFlag["type"], { icon: string; color: string; bg: string; label: string }> = {
  kpi_timer:         { icon: "⏱", color: "text-red-600",    bg: "bg-red-50 border-red-200",    label: "KPI timer"    },
  portal_update_due: { icon: "🔔", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Portal due"   },
  trade_overdue:     { icon: "⚠",  color: "text-red-600",    bg: "bg-red-50 border-red-200",    label: "Trade overdue" },
};

// ─── SLA reference per insurer ────────────────────────────────────────────────
const INSURER_SLAS: Record<string, { acceptance: string; scope: string; completion: string; portal: string }> = {
  "IAG":     { acceptance: "1h",  scope: "5 days", completion: "21 days", portal: "24h"  },
  "Suncorp": { acceptance: "2h",  scope: "5 days", completion: "21 days", portal: "24h"  },
  "Allianz": { acceptance: "1h",  scope: "3 days", completion: "28 days", portal: "Same day" },
  "NRMA":    { acceptance: "2h",  scope: "5 days", completion: "21 days", portal: "24h"  },
  "QBE":     { acceptance: "4h",  scope: "5 days", completion: "21 days", portal: "EOD"  },
};

function FlagBadge({ flag }: { flag: JobFlag }) {
  const cfg = FLAG_CONFIG[flag.type];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}
      title={flag.detail}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function LifecycleBar({ stage }: { stage: InsuranceJob["stage"] }) {
  const currentOrder = STAGE_STYLE[stage].order;
  return (
    <div className="flex gap-0.5 mt-2">
      {LIFECYCLE_STAGES.map((s, i) => {
        const order = i + 1;
        const active = order === currentOrder;
        const done = order < currentOrder;
        return (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              done ? "bg-[#00BDFE]" : active ? "bg-[#00BDFE] opacity-60" : "bg-slate-200"
            }`}
            title={s}
          />
        );
      })}
    </div>
  );
}

function JobRow({ job, urgent }: { job: InsuranceJob; urgent: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const stage = STAGE_STYLE[job.stage];
  const sla = INSURER_SLAS[job.insurer];

  return (
    <div className={`rounded-xl border ${urgent ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <button className="w-full text-left px-4 py-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">

          {/* Job ID + customer */}
          <div className="flex-shrink-0 w-28">
            <p className="text-slate-500 font-mono text-xs font-semibold">{job.id}</p>
            <p className="text-slate-800 text-xs font-semibold mt-0.5 leading-tight">{job.customer}</p>
            <p className="text-slate-400 text-xs">{job.suburb}</p>
          </div>

          {/* Insurer + stage */}
          <div className="flex-shrink-0 w-28">
            <p className="text-slate-500 text-xs mb-1 font-medium">{job.insurer}</p>
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${stage.badge}`}>
              {job.stage}
            </span>
          </div>

          {/* Next action */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs leading-snug ${urgent ? "text-red-700 font-medium" : "text-slate-600"}`}>
              {job.nextAction}
            </p>
            {job.nextTradeDate && (
              <p className="text-slate-400 text-xs mt-0.5">Trade: {job.nextTradeDate}</p>
            )}
          </div>

          {/* Flags + expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.flags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.flags.map((f, i) => <FlagBadge key={i} flag={f} />)}
              </div>
            )}
            <span className="text-slate-400 text-xs ml-1">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Lifecycle progress bar */}
        <LifecycleBar stage={job.stage} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {/* SLA reference */}
          {sla && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">{job.insurer} SLA Reference</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Acceptance</span><span className="text-slate-700 font-medium">{sla.acceptance}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Scope booking</span><span className="text-slate-700 font-medium">{sla.scope}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Completion</span><span className="text-slate-700 font-medium">{sla.completion}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Portal update</span><span className="text-slate-700 font-medium">{sla.portal}</span></div>
              </div>
            </div>
          )}

          {/* Flag details */}
          {job.flags.map((f, i) => {
            const cfg = FLAG_CONFIG[f.type];
            return (
              <div key={i} className={`rounded-lg border p-3 ${cfg.bg}`}>
                <p className={`text-xs font-semibold ${cfg.color} mb-0.5`}>{cfg.icon} {cfg.label}</p>
                <p className={`text-xs ${cfg.color}`}>{f.detail}</p>
              </div>
            );
          })}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="text-xs bg-[#00BDFE] hover:bg-[#0099d4] text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              Update portal
            </button>
            <button className="text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Contact trade
            </button>
            <button className="text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Log note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TOTAL_JOBS = 80;

// ─── Stage distribution summary ───────────────────────────────────────────────
function StageSummary({ jobs }: { jobs: InsuranceJob[] }) {
  const counts = LIFECYCLE_STAGES.map(s => ({
    stage: s,
    count: jobs.filter(j => j.stage === s).length,
    style: STAGE_STYLE[s],
  })).filter(s => s.count > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {counts.map(s => (
        <div key={s.stage} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.style.dot}`} />
          <span className="text-xs text-slate-600">{s.stage}</span>
          <span className="text-xs font-semibold text-slate-800">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function CoordinatorView() {
  const urgent  = KERRIE_JOBS.filter(j => j.flags.length > 0);
  const routine = KERRIE_JOBS.filter(j => j.flags.length === 0)
    .sort((a, b) => STAGE_STYLE[a.stage].order - STAGE_STYLE[b.stage].order);

  const flagCounts = {
    kpi_timer:         KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "kpi_timer").length,
    portal_update_due: KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "portal_update_due").length,
    trade_overdue:     KERRIE_JOBS.flatMap(j => j.flags).filter(f => f.type === "trade_overdue").length,
  };

  // Systemic pattern: 90% Chekku no-match on insurance
  const chekku_no_match_pct = 90;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="text-slate-800 font-semibold text-sm">My Jobs — Insurance</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {KERRIE_JOBS.length} shown · {TOTAL_JOBS} total · National
            </p>
          </div>
          {urgent.length > 0 && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-medium">
              {urgent.length} need attention now
            </span>
          )}
        </div>

        {/* Flag summary */}
        <div className="flex flex-wrap gap-2 mb-3">
          {flagCounts.kpi_timer > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
              <span className="text-red-500 text-sm">⏱</span>
              <span className="text-xs text-red-700">{flagCounts.kpi_timer} KPI timer{flagCounts.kpi_timer > 1 ? "s" : ""}</span>
            </div>
          )}
          {flagCounts.portal_update_due > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
              <span className="text-orange-500 text-sm">🔔</span>
              <span className="text-xs text-orange-700">{flagCounts.portal_update_due} portal update{flagCounts.portal_update_due > 1 ? "s" : ""} due</span>
            </div>
          )}
          {flagCounts.trade_overdue > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
              <span className="text-red-500 text-sm">⚠</span>
              <span className="text-xs text-red-700">{flagCounts.trade_overdue} trade{flagCounts.trade_overdue > 1 ? "s" : ""} overdue</span>
            </div>
          )}
          {urgent.length === 0 && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
              <span className="text-green-500 text-sm">✓</span>
              <span className="text-xs text-green-700">No urgent flags</span>
            </div>
          )}
        </div>

        {/* Stage distribution */}
        <StageSummary jobs={KERRIE_JOBS} />
      </div>

      {/* Systemic pattern alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-base flex-shrink-0">📉</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Systemic: {chekku_no_match_pct}% Chekku no-match on insurance jobs</p>
            <p className="text-amber-700 text-xs mt-1">
              Carpenter and plasterer availability in Newcastle–Hunter corridor is the binding constraint.
              Every no-match forces manual procurement, adding 1–2 days to scope-to-trade allocation.
              Confidence on Allianz NSW portfolio has dropped from 0.81 → 0.71 over 10 days.
            </p>
            <button className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Raise trade recruitment request
            </button>
          </div>
        </div>
      </div>

      {/* Urgent jobs */}
      {urgent.length > 0 && (
        <div>
          <p className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-2">
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
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            On track — {routine.length} job{routine.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {routine.map(j => <JobRow key={j.id} job={j} urgent={false} />)}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-slate-400 text-xs pb-1">
        Showing {KERRIE_JOBS.length} of {TOTAL_JOBS} jobs · Sorted by urgency then stage · Flags auto-generated from SLA rules
      </p>
    </div>
  );
}
