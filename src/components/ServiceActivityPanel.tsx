import { useState } from "react";
import { ticketsForJob, TICKET_TYPE_META, TICKET_SEVERITY_META, TICKET_STATUS_META } from "../data/tickets";
import type { ServiceTicket } from "../data/tickets";

// ServiceActivityPanel — surfaces Hubspot service tickets attached to a job.
// Sits in JobDetail when the job has any tickets. Closed/resolved tickets
// collapse to a compact tag; active tickets get a fuller card with severity,
// type, AI recommendation, and a brief cascade summary if applicable.
//
// This is the "first signal" surface that addresses Aaron's concern about
// complaints landing on previously-clean jobs — the operator looking at the
// job sees the ticket immediately.

type Props = {
  jobId: string;
};

function TicketCard({ ticket }: { ticket: ServiceTicket }) {
  const [expanded, setExpanded] = useState(ticket.severity === "critical");
  const typeMeta = TICKET_TYPE_META[ticket.type];
  const sevMeta = TICKET_SEVERITY_META[ticket.severity];
  const statusMeta = TICKET_STATUS_META[ticket.status];
  const cascadeCount = ticket.cascadeEvents?.length ?? 0;
  const cascadeDone = ticket.cascadeEvents?.filter(e => e.status === "done").length ?? 0;

  return (
    <div className={`rounded-lg border-l-4 ${sevMeta.accent} border-y border-r border-y-slate-200 border-r-slate-200 bg-white`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-3"
      >
        <div className="flex items-start gap-2">
          <span className={`flex-shrink-0 w-5 h-5 rounded ${typeMeta.bg} ${typeMeta.color} text-[11px] font-bold flex items-center justify-center border ${typeMeta.border}`}>
            {typeMeta.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={`text-[9px] uppercase tracking-wider font-bold border px-1.5 py-0.5 rounded ${sevMeta.bg} ${sevMeta.color} ${sevMeta.border}`}>{sevMeta.label}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{typeMeta.label}</span>
              <span className={`text-[9px] uppercase tracking-wider font-semibold ${statusMeta.color}`}>· {statusMeta.label}</span>
              <span className="text-[9px] font-mono text-slate-400">· {ticket.id}</span>
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-snug">{ticket.subject}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ticket.createdAt} · via {ticket.channel}</p>
          </div>
          <span className="text-slate-400 text-xs flex-shrink-0">{expanded ? "▾" : "▸"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
          <p className="text-xs text-slate-700 leading-snug">{ticket.summary}</p>

          {ticket.aiRecommendedAction && (
            <div className="bg-[#e0f7ff]/40 border border-[#00BDFE]/20 rounded-lg p-2">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-[#0077a8] mb-1">AI recommendation</p>
              <p className="text-xs text-slate-700 leading-snug">{ticket.aiRecommendedAction}</p>
            </div>
          )}

          {/* Cascade — for severe tickets like trade injury */}
          {cascadeCount > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Operational cascade</p>
                <p className="text-[9px] text-slate-400">{cascadeDone} of {cascadeCount} done</p>
              </div>
              <div className="space-y-1 border-l-2 border-slate-200 pl-2">
                {ticket.cascadeEvents!.map((ev, i) => {
                  const dot = ev.status === "done" ? "bg-green-500" : ev.status === "in_progress" ? "bg-sky-500 animate-pulse" : ev.status === "blocked" ? "bg-red-500" : "bg-slate-300";
                  return (
                    <div key={i} className="flex items-baseline gap-2 text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${dot}`} />
                      <span className="font-mono text-slate-400 text-[10px] w-12 flex-shrink-0">{ev.time}</span>
                      <span className={`flex-1 leading-snug ${ev.status === "done" ? "text-slate-600" : ev.status === "blocked" ? "text-red-700 font-medium" : ev.status === "in_progress" ? "text-sky-700 font-medium" : "text-slate-700 font-medium"}`}>
                        {ev.event}
                        {ev.hardLimit && <span className="ml-1 text-[9px] text-red-600 font-bold">🔒 hard limit</span>}
                      </span>
                      <span className="text-slate-400 text-[10px] flex-shrink-0">{ev.actor}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ticket.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-green-700 mb-1">Resolution</p>
              <p className="text-xs text-slate-700 leading-snug">{ticket.resolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceActivityPanel({ jobId }: Props) {
  const tickets = ticketsForJob(jobId);
  if (tickets.length === 0) return null;

  // Sort: critical first, then by status (open > in_progress > resolved)
  const statusOrder: Record<string, number> = {
    open: 0, escalated: 1, in_progress: 2, awaiting_customer: 3, awaiting_trade: 4, resolved: 5, closed: 6,
  };
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...tickets].sort((a, b) => {
    const sevDiff = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
  });

  const active = sorted.filter(t => t.status !== "resolved" && t.status !== "closed");
  const resolved = sorted.filter(t => t.status === "resolved" || t.status === "closed");

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium">Service Activity</p>
        <p className="text-slate-400 text-[10px]">
          {active.length} active{resolved.length > 0 && ` · ${resolved.length} resolved`}
        </p>
      </div>
      <div className="space-y-1.5">
        {sorted.map(t => <TicketCard key={t.id} ticket={t} />)}
      </div>
    </div>
  );
}
