import { useState } from "react";
import { JOBS, type Job } from "../data/jobs";
import { SERVICE_TICKETS, TICKET_TYPE_META, TICKET_SEVERITY_META, TICKET_STATUS_META, type ServiceTicket } from "../data/tickets";
import AskAI from "./AskAI";

// ServiceView — Maya's three-column Mission Control view, scoped to service
// tickets. Same convention as CockpitView (left = queue, middle = focus +
// AI, right = KPIs) but the queue is tickets rather than jobs. Drilling into
// a ticket shows the ticket detail with linked jobs, cascade events, and
// AI recommendation.
//
// Hubspot is the assumed source — tickets carry HS- prefix and channel.
// AI Service Agent triages on inbound; AI Cascade Agent computes the
// operational consequences for severe events.

type Props = {
  persona: string;
};

// ─── Ticket queue card (column 1) ───────────────────────────────────────────

function TicketQueueCard({ ticket, selected, onClick }: { ticket: ServiceTicket; selected: boolean; onClick: () => void }) {
  const typeMeta = TICKET_TYPE_META[ticket.type];
  const sevMeta = TICKET_SEVERITY_META[ticket.severity];
  const statusMeta = TICKET_STATUS_META[ticket.status];
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
        selected ? "border-[#00BDFE] shadow-sm bg-white" : "border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white"
      } border-l-4 ${sevMeta.accent} ${isResolved ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className={`flex-shrink-0 w-5 h-5 rounded ${typeMeta.bg} ${typeMeta.color} text-[11px] font-bold flex items-center justify-center border ${typeMeta.border}`}>
          {typeMeta.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`text-[9px] uppercase tracking-wider font-bold border px-1 py-0 rounded ${sevMeta.bg} ${sevMeta.color} ${sevMeta.border}`}>{sevMeta.label}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{typeMeta.label}</span>
          </div>
          <p className="text-xs font-semibold text-slate-700 leading-tight mt-1 line-clamp-2">{ticket.subject}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] mt-1">
        <span className={statusMeta.color}>{statusMeta.label}</span>
        <span className="text-slate-400 font-mono">{ticket.id}</span>
      </div>
      {ticket.tradeName && (
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">↳ {ticket.tradeName}</p>
      )}
      {ticket.customerName && !ticket.tradeName && (
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">↳ {ticket.customerName}</p>
      )}
      {ticket.clientName && (
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">↳ {ticket.clientName}</p>
      )}
      <p className="text-[10px] text-slate-400 mt-1">{ticket.createdAt} · via {ticket.channel}</p>
    </button>
  );
}

// ─── Ticket detail (column 2) ───────────────────────────────────────────────

function TicketDetail({ ticket }: { ticket: ServiceTicket }) {
  const typeMeta = TICKET_TYPE_META[ticket.type];
  const sevMeta = TICKET_SEVERITY_META[ticket.severity];
  const statusMeta = TICKET_STATUS_META[ticket.status];
  const linkedJobs = ticket.jobIds.map(id => JOBS.find(j => j.id === id)).filter((j): j is Job => !!j);

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className={`flex-shrink-0 w-6 h-6 rounded ${typeMeta.bg} ${typeMeta.color} text-sm font-bold flex items-center justify-center border ${typeMeta.border}`}>
            {typeMeta.icon}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-bold border px-1.5 py-0.5 rounded ${sevMeta.bg} ${sevMeta.color} ${sevMeta.border}`}>{sevMeta.label}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{typeMeta.label}</span>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${statusMeta.color}`}>· {statusMeta.label}</span>
          <span className="text-[10px] font-mono text-slate-400">· {ticket.id}</span>
        </div>
        <h2 className="text-base font-bold text-slate-800 leading-snug">{ticket.subject}</h2>
        <p className="text-xs text-slate-500 mt-1">
          Created {ticket.createdAt} via {ticket.channel} · Assigned to {ticket.assignedTo ? "Maya" : "—"}
          {ticket.tradeName && <> · Trade: <span className="text-slate-700 font-medium">{ticket.tradeName}</span></>}
          {ticket.customerName && <> · Customer: <span className="text-slate-700 font-medium">{ticket.customerName}</span></>}
          {ticket.clientName && <> · Client: <span className="text-slate-700 font-medium">{ticket.clientName}</span></>}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Summary</p>
        <p className="text-sm text-slate-700 leading-snug">{ticket.summary}</p>
      </div>

      {/* AI recommendation */}
      {ticket.aiRecommendedAction && (
        <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#0077a8] mb-1">AI Recommendation</p>
          <p className="text-sm text-slate-700 leading-snug">{ticket.aiRecommendedAction}</p>
          {ticket.aiRecommendedOwner && (
            <p className="text-[10px] text-slate-500 mt-1.5">Routed to {ticket.aiRecommendedOwner}.</p>
          )}
        </div>
      )}

      {/* Linked jobs */}
      {linkedJobs.length > 0 && (
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Linked job{linkedJobs.length === 1 ? "" : "s"}</p>
          <div className="space-y-1.5">
            {linkedJobs.map(j => (
              <div key={j.id} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="font-semibold text-slate-700">{j.customer}</span>
                  <span className="font-mono text-[10px] text-slate-400">{j.id}</span>
                </div>
                <p className="text-[11px] text-slate-500">{j.type} · {j.suburb}, {j.state} · {j.window}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Trade: {j.trade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cascade events — for severe tickets */}
      {ticket.cascadeEvents && ticket.cascadeEvents.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Operational Cascade</p>
            <p className="text-[10px] text-slate-400">
              {ticket.cascadeEvents.filter(e => e.status === "done").length} done ·{" "}
              {ticket.cascadeEvents.filter(e => e.status === "in_progress").length} in progress ·{" "}
              {ticket.cascadeEvents.filter(e => e.status === "pending").length} pending
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="space-y-2">
              {ticket.cascadeEvents.map((ev, i) => {
                const dot = ev.status === "done" ? "bg-green-500" : ev.status === "in_progress" ? "bg-sky-500 animate-pulse" : ev.status === "blocked" ? "bg-red-500" : "bg-slate-300";
                return (
                  <div key={i} className="flex items-baseline gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${dot}`} />
                    <span className="font-mono text-slate-400 text-[10px] w-12 flex-shrink-0">{ev.time}</span>
                    <div className="flex-1">
                      <p className={`leading-snug ${ev.status === "done" ? "text-slate-600" : ev.status === "blocked" ? "text-red-700 font-medium" : ev.status === "in_progress" ? "text-sky-700 font-medium" : "text-slate-700 font-medium"}`}>
                        {ev.event}
                        {ev.hardLimit && <span className="ml-1 text-[10px] text-red-600 font-bold">🔒 hard limit</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ev.actor} {ev.jobRef && `· ${ev.jobRef}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resolution */}
      {ticket.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-green-700 mb-1">Resolution</p>
          <p className="text-sm text-slate-700 leading-snug">{ticket.resolution}</p>
          {ticket.resolvedAt && <p className="text-[10px] text-slate-400 mt-1">Resolved {ticket.resolvedAt}</p>}
        </div>
      )}

      {/* Action buttons (illustrative — wire to flows in production) */}
      {ticket.status !== "resolved" && ticket.status !== "closed" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="text-sm bg-[#00BDFE] hover:bg-[#0099d4] text-white px-4 py-2 rounded-lg font-medium">Take action</button>
          <button className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium">Reply via Hubspot</button>
          <button className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 px-3 py-2 rounded-lg text-xs">Escalate</button>
        </div>
      )}
    </div>
  );
}

// ─── Service KPI panel (column 3) ───────────────────────────────────────────

function ServiceKPIPanel({ tickets }: { tickets: ServiceTicket[] }) {
  const open = tickets.filter(t => t.status !== "resolved" && t.status !== "closed");
  const critical = open.filter(t => t.severity === "critical").length;
  const high = open.filter(t => t.severity === "high").length;
  const complaints = open.filter(t => t.type === "customer_complaint").length;
  const tradeEvents = open.filter(t => t.type === "trade_injury" || t.type === "trade_withdrawal").length;
  const billing = open.filter(t => t.type === "billing_query").length;
  const aiHandledRecently = tickets.filter(t => t.aiTriaged).length;

  return (
    <div className="space-y-3">

      {/* Headline — open tickets */}
      <div className="bg-gradient-to-br from-[#00BDFE]/10 to-[#00BDFE]/5 border border-[#00BDFE]/30 rounded-xl p-3">
        <p className="text-xs font-semibold text-[#00BDFE] uppercase tracking-wider mb-1">Service Queue</p>
        <p className="text-3xl font-black text-slate-800">{open.length}</p>
        <p className="text-xs text-slate-500 mt-1">open tickets · {critical} critical · {high} high</p>
      </div>

      {/* Type breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Today's Mix</p>
        <div className="space-y-1.5 text-xs">
          {[
            { label: "Customer complaints",  value: complaints,  alertWhen: 1 },
            { label: "Trade events",         value: tradeEvents, alertWhen: 1 },
            { label: "Billing queries",      value: billing,     alertWhen: 0 },
            { label: "AI-triaged today",     value: aiHandledRecently, alertWhen: 0 },
          ].map(m => (
            <div key={m.label} className="flex items-baseline justify-between">
              <span className="text-slate-500">{m.label}</span>
              <span className={`font-bold ${m.alertWhen > 0 && m.value >= m.alertWhen ? "text-amber-600" : "text-slate-700"}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SLA snapshot — illustrative */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Response SLA — This Week</p>
        <div className="space-y-2 text-xs">
          {[
            { label: "Avg first-response time", value: "8 min", target: "15 min", good: true },
            { label: "Within-SLA resolution",   value: "92%",   target: "85%",    good: true },
            { label: "Tickets closed",           value: "47",    target: "—",      good: true },
            { label: "Escalations to senior",    value: "3",     target: "<5",     good: true },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">{m.label}</span>
                <span className={`font-bold ${m.good ? "text-green-600" : "text-amber-600"}`}>{m.value}</span>
              </div>
              {m.target !== "—" && <p className="text-[10px] text-slate-400 mt-0.5">Target {m.target}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Hubspot integration health */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Hubspot Sync</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-700 font-medium">Healthy</span>
          <span className="text-slate-400 ml-auto">last sync 14s ago</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Bidirectional with Hubspot — ticket creation, status, assignments, replies all sync. Cynnch outbound notifications fire from cascade events.</p>
      </div>
    </div>
  );
}

// ─── Main view ──────────────────────────────────────────────────────────────

export default function ServiceView({ persona }: Props) {
  // For prototype: Maya sees all tickets. National + Aaron also routed here
  // for executive-tier service oversight, but in real product they'd see
  // only severity ≥ high. Maya is the primary user.
  const allTickets = SERVICE_TICKETS;

  // Sort: critical first, then high, then by status (open → resolved last)
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<string, number> = { open: 0, escalated: 1, in_progress: 2, awaiting_customer: 3, awaiting_trade: 4, resolved: 5, closed: 6 };
  const sortedTickets = [...allTickets].sort((a, b) => {
    const sevDiff = (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
  });

  const [selectedId, setSelectedId] = useState<string | null>(sortedTickets[0]?.id ?? null);
  const [aiTrigger, setAiTrigger] = useState<{ text: string; nonce: number } | undefined>(undefined);
  void setAiTrigger;
  const [aiResetCounter, setAiResetCounter] = useState(0);
  const [aiHasConversation, setAiHasConversation] = useState(false);

  const [filter, setFilter] = useState<"all" | "critical" | "complaints" | "trade">("all");

  const selectedTicket = selectedId ? sortedTickets.find(t => t.id === selectedId) ?? null : null;

  const filteredTickets = sortedTickets.filter(t => {
    if (filter === "critical") return t.severity === "critical" || t.severity === "high";
    if (filter === "complaints") return t.type === "customer_complaint";
    if (filter === "trade") return t.type === "trade_injury" || t.type === "trade_withdrawal" || t.type === "trade_request";
    return true;
  });

  const openCount = allTickets.filter(t => t.status !== "resolved" && t.status !== "closed").length;
  const criticalCount = allTickets.filter(t => t.severity === "critical" && t.status !== "resolved" && t.status !== "closed").length;

  // AI context
  const aiContextLabel = selectedTicket ? `Focused on ${selectedTicket.id}` : "Watching service queue";
  const ticketSummary = sortedTickets.map(t =>
    `- ${t.id} · ${t.severity} · ${t.type} · ${t.status} · ${t.subject}${t.tradeName ? ` · trade: ${t.tradeName}` : ""}${t.customerName ? ` · customer: ${t.customerName}` : ""}`
  ).join("\n");
  const aiContext = (selectedTicket
    ? `Maya — Service Officer (T2). Reviewing ticket ${selectedTicket.id}: "${selectedTicket.subject}". Type: ${selectedTicket.type}. Severity: ${selectedTicket.severity}. Status: ${selectedTicket.status}. Summary: ${selectedTicket.summary}.${selectedTicket.aiRecommendedAction ? ` AI recommendation: ${selectedTicket.aiRecommendedAction}` : ""}`
    : `Maya — Service Officer (T2). Service queue: ${openCount} open tickets, ${criticalCount} critical. Hubspot is the source-of-truth ticketing system; CoreTechX surfaces operational consequences.`)
    + `\n\nFull ticket queue:\n${ticketSummary}`;

  const aiSuggestions = [
    { label: "Customer ringing about a complaint", question: "A customer is calling about something. Please ask me which job number, customer name, or area, then bring up the matching ticket(s) and any operational context I should know to help them." },
    { label: "What's the cascade impact?", question: "For the active critical or high-severity tickets — walk me through the operational cascade. Which jobs are affected, which trades, which customers, which compliance commitments are triggered?" },
    { label: "Anything I should escalate?", question: "Looking at my open queue — which tickets should I escalate to Aaron, Logan, or the safety officer? Be specific about why and the time pressure." },
  ];

  void persona; // currently uses Maya-shaped layout regardless; persona param reserved for future tier-based filtering

  return (
    <div className="flex rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden" style={{ minHeight: "calc(100vh - 220px)" }}>

      {/* ── Column 1: Ticket Queue ─────────────────────────────────────────── */}
      <div className="w-64 xl:w-72 2xl:w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">

        <div className="px-4 pt-4 pb-3 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-slate-700 font-semibold text-sm">Service Queue</h2>
            {criticalCount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">{criticalCount} critical</span>
            )}
          </div>
          <p className="text-slate-400 text-[10px]">{openCount} open · all via Hubspot</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b border-slate-200 bg-white">
          {([
            { key: "all", label: "All" },
            { key: "critical", label: "Urgent" },
            { key: "complaints", label: "Complaints" },
            { key: "trade", label: "Trade" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex-1 text-[10px] py-1 rounded-md font-semibold transition-colors ${
                filter === t.key
                  ? "bg-[#00BDFE] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
          {filteredTickets.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6 italic">No tickets in this view</p>
          ) : (
            filteredTickets.map(t => (
              <TicketQueueCard
                key={t.id}
                ticket={t}
                selected={selectedId === t.id}
                onClick={() => setSelectedId(t.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Column 2: AI Assistant + Ticket Focus ───────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Sticky AI bar at the top */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BDFE] animate-pulse flex-shrink-0" />
            <span className="text-[#00BDFE] text-xs font-semibold">CoreTechX AI</span>
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-slate-200 text-xs truncate flex-1">{aiContextLabel}</span>
            <button
              onClick={() => setAiResetCounter(c => c + 1)}
              title="Clear conversation"
              className={`text-[10px] px-2 py-0.5 rounded transition-colors flex-shrink-0 ${
                aiHasConversation
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ↻ Clear
            </button>
          </div>
          <div className="bg-white px-4 pt-3 pb-3">
            <AskAI
              key={`maya-${aiResetCounter}`}
              context={aiContext}
              placeholder={selectedTicket ? `Ask, search, or instruct about ${selectedTicket.id}...` : "Ask, search, or instruct..."}
              trigger={aiTrigger}
              suggestions={aiSuggestions}
              onConversationChange={setAiHasConversation}
            />
          </div>
        </div>

        {/* Focus subhead */}
        <div className="px-5 py-2 border-b border-slate-100 flex-shrink-0 bg-slate-50">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Current focus</span>
            {selectedTicket ? (
              <span className="text-xs text-slate-600 truncate">
                {selectedTicket.subject} · <span className="font-mono text-slate-400">{selectedTicket.id}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">— select a ticket from the queue —</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          <div className="max-w-3xl mx-auto">
            {!selectedTicket ? (
              <div className="h-full flex items-center justify-center" style={{ minHeight: 300 }}>
                <div className="text-center px-8 py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 max-w-xs">
                  <p className="text-slate-600 text-sm font-medium">Select a ticket</p>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">Click any ticket from the queue to see details, AI recommendation, linked jobs, and operational cascade.</p>
                </div>
              </div>
            ) : (
              <TicketDetail ticket={selectedTicket} />
            )}
          </div>
        </div>
      </div>

      {/* ── Column 3: Service KPIs ──────────────────────────────────────────── */}
      <div className="w-56 xl:w-64 2xl:w-72 flex-shrink-0 flex flex-col border-l border-slate-200">
        <div className="px-4 pt-4 pb-3 border-b border-slate-200">
          <h2 className="text-slate-700 font-semibold text-sm">Service Health</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ServiceKPIPanel tickets={allTickets} />
        </div>
      </div>
    </div>
  );
}
