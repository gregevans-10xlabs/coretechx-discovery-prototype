import { useState } from "react";
import { JOBS, type Job } from "../data/jobs";
import { jobsWithFinancialState, financeExceptions, cashflowSnapshot, BILLING_STATUS_META, TRADE_PAYMENT_STATUS_META, XERO_SYNC_META, type FinancialState } from "../data/finance";
import AskAI from "./AskAI";
import FinanceSection from "./FinanceSection";

// FinanceView — Mei's three-column Mission Control view, scoped to financial
// state. Same convention as ServiceView / CockpitView but the queue is jobs
// with financial exceptions or notable state, the column-2 detail surfaces
// the FinanceSection prominently, and column 3 carries finance KPIs (DSO,
// RCTI throughput, Xero sync health, hard-limit financial decisions
// awaiting Aaron).
//
// Xero is the assumed bookkeeping platform — sync state is shown
// throughout. Variation approval routing is preserved as a hard-limit
// concern (Aaron-only) but Mei has visibility on the queue.

type Props = {
  persona: string;
};

// ─── Job queue card with finance framing (column 1) ─────────────────────────

function FinanceQueueCard({ job, selected, onClick }: { job: Job; selected: boolean; onClick: () => void }) {
  const f = job.financial as FinancialState;
  const billing = BILLING_STATUS_META[f.billingStatus];
  const tradePay = TRADE_PAYMENT_STATUS_META[f.tradePaymentStatus];
  const isException = f.billingStatus === "exception" || f.billingStatus === "overdue"
                   || f.tradePaymentStatus === "exception" || f.tradePaymentStatus === "failed"
                   || f.xeroSyncStatus === "failed" || f.xeroSyncStatus === "drift"
                   || (f.variations?.some(v => !v.approvedBy) ?? false);
  const accentBorder = isException ? "border-l-amber-400" : "border-l-slate-200";

  const totalValue = (f.variations ?? []).reduce((sum, v) => sum + v.amount, job.value);
  const variationDelta = totalValue - job.value;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border bg-white p-3 transition-all duration-150 border-l-4 ${accentBorder} ${
        selected ? "border-[#00BDFE] shadow-sm" : "border-y-slate-200 border-r-slate-200 hover:shadow-sm"
      }`}
    >
      {/* Customer + value */}
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <p className="text-sm font-semibold text-slate-800 truncate">{job.customer}</p>
        <span className="text-sm font-bold text-slate-700 flex-shrink-0">${totalValue.toLocaleString()}</span>
      </div>
      <p className="text-[10px] text-slate-500 truncate">{job.suburb} · {job.type}</p>

      {/* Status pills */}
      <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${billing.bg} ${billing.color} ${billing.border}`}>{billing.label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${tradePay.bg} ${tradePay.color} ${tradePay.border}`}>Trade: {tradePay.label}</span>
        {variationDelta !== 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${variationDelta > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
            {variationDelta > 0 ? "+" : ""}${variationDelta.toLocaleString()} variation
          </span>
        )}
      </div>

      {f.exceptionReason && (
        <p className="text-[10px] text-amber-700 mt-1 leading-snug line-clamp-2">{f.exceptionReason}</p>
      )}
      <p className="text-[10px] font-mono text-slate-300 mt-1">{job.id}</p>
    </button>
  );
}

// ─── Finance KPI panel (column 3) ───────────────────────────────────────────

function FinanceKPIPanel() {
  const cashflow = cashflowSnapshot();
  const exceptions = financeExceptions();
  const allFinJobs = jobsWithFinancialState();
  const overdue = allFinJobs.filter(j => (j.financial as FinancialState).billingStatus === "overdue");
  const syncFailed = allFinJobs.filter(j => (j.financial as FinancialState).xeroSyncStatus === "failed");
  const variationsPending = allFinJobs.filter(j => (j.financial as FinancialState).variations?.some(v => !v.approvedBy));

  return (
    <div className="space-y-3">

      {/* Cashflow headline */}
      <div className="bg-gradient-to-br from-[#00BDFE]/10 to-[#00BDFE]/5 border border-[#00BDFE]/30 rounded-xl p-3">
        <p className="text-xs font-semibold text-[#00BDFE] uppercase tracking-wider mb-1">Cashflow Today</p>
        <p className="text-2xl font-black text-slate-800">${cashflow.collectedToday.toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-0.5">collected · ${cashflow.invoicedToday.toLocaleString()} invoiced today</p>
        {cashflow.overdue > 0 && (
          <div className="mt-2 pt-2 border-t border-[#00BDFE]/20">
            <p className="text-[10px] text-slate-500">Overdue · <span className="font-bold text-amber-700">${cashflow.overdue.toLocaleString()}</span></p>
            <p className="text-[10px] text-slate-500">Open invoices · <span className="font-bold text-slate-700">${cashflow.openInvoiceTotal.toLocaleString()}</span></p>
          </div>
        )}
      </div>

      {/* Exception buckets */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Exception Buckets</p>
        <div className="space-y-1.5 text-xs">
          {[
            { label: "Aged receivables (>0d)",   value: overdue.length,           alert: overdue.length > 0 },
            { label: "Xero sync failed",         value: syncFailed.length,        alert: syncFailed.length > 0 },
            { label: "Variations awaiting Aaron", value: variationsPending.length, alert: variationsPending.length > 0 },
            { label: "Total exceptions",         value: exceptions.length,        alert: exceptions.length > 0 },
          ].map(m => (
            <div key={m.label} className="flex items-baseline justify-between">
              <span className="text-slate-500">{m.label}</span>
              <span className={`font-bold ${m.alert ? "text-amber-600" : "text-slate-700"}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DSO snapshot — illustrative */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">DSO — Days Sales Outstanding</p>
        <div className="space-y-2 text-xs">
          {[
            { label: "Overall", value: "21 days", target: "<30 days", good: true },
            { label: "Allianz", value: "18 days", target: "<14 days", good: false },
            { label: "Harvey Norman", value: "11 days", target: "<14 days", good: true },
            { label: "AHO Construction", value: "27 days", target: "<30 days", good: true },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">{m.label}</span>
                <span className={`font-bold ${m.good ? "text-green-600" : "text-amber-600"}`}>{m.value}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Target {m.target}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Xero sync health */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Xero Sync</p>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${syncFailed.length > 0 ? "bg-red-500" : "bg-green-500"}`} />
          <span className="text-slate-700 font-medium">{syncFailed.length > 0 ? `${syncFailed.length} failed` : "Healthy"}</span>
          <span className="text-slate-400 ml-auto">last sync 22s ago</span>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
          <div>
            <p className="text-slate-400">Synced today</p>
            <p className="font-bold text-slate-700">{allFinJobs.filter(j => (j.financial as FinancialState).xeroSyncStatus === "synced").length}</p>
          </div>
          <div>
            <p className="text-slate-400">Pending / drift</p>
            <p className="font-bold text-slate-700">{allFinJobs.filter(j => ["pending","drift"].includes((j.financial as FinancialState).xeroSyncStatus)).length}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Bidirectional with Xero — invoices, bills, payments, sync drift detection. Mei reviews drift and failed syncs.</p>
      </div>
    </div>
  );
}

// ─── Main view ──────────────────────────────────────────────────────────────

export default function FinanceView({ persona }: Props) {
  // For prototype: Mei sees all jobs with financial state. National + Aaron
  // also routed here (cross-cutting executive view).
  const allFinanceJobs = jobsWithFinancialState();

  const [filter, setFilter] = useState<"all" | "exceptions" | "overdue" | "variations" | "synced">("exceptions");

  // Sort: exceptions first, then by status
  const sevOrder: Record<string, number> = { exception: 0, overdue: 1, ready_to_invoice: 2, invoiced: 3, paid: 4, not_due: 5 };
  const sortedJobs = [...allFinanceJobs].sort((a, b) => {
    const fa = a.financial as FinancialState;
    const fb = b.financial as FinancialState;
    return (sevOrder[fa.billingStatus] ?? 9) - (sevOrder[fb.billingStatus] ?? 9);
  });

  const filteredJobs = sortedJobs.filter(j => {
    const f = j.financial as FinancialState;
    if (filter === "exceptions") {
      return f.billingStatus === "exception" || f.billingStatus === "overdue"
          || f.tradePaymentStatus === "exception" || f.tradePaymentStatus === "failed"
          || f.xeroSyncStatus === "failed" || f.xeroSyncStatus === "drift"
          || (f.variations?.some(v => !v.approvedBy) ?? false);
    }
    if (filter === "overdue") return f.billingStatus === "overdue";
    if (filter === "variations") return (f.variations?.length ?? 0) > 0;
    if (filter === "synced") return f.xeroSyncStatus === "synced";
    return true;
  });

  const [selectedId, setSelectedId] = useState<string | null>(filteredJobs[0]?.id ?? null);
  const [aiTrigger, setAiTrigger] = useState<{ text: string; nonce: number } | undefined>(undefined);
  void setAiTrigger;
  const [aiResetCounter, setAiResetCounter] = useState(0);
  const [aiHasConversation, setAiHasConversation] = useState(false);

  const selectedJob = selectedId ? JOBS.find(j => j.id === selectedId) ?? null : null;

  const exceptionsCount = financeExceptions().length;
  const cashflow = cashflowSnapshot();

  // AI context
  const aiContextLabel = selectedJob ? `Focused on ${selectedJob.id}` : "Watching finance queue";
  const queueSummary = sortedJobs.map(j => {
    const f = j.financial as FinancialState;
    return `- ${j.id} · ${j.customer} · $${j.value.toLocaleString()} · billing:${f.billingStatus} · trade:${f.tradePaymentStatus} · xero:${f.xeroSyncStatus}${f.exceptionReason ? ` · "${f.exceptionReason.slice(0, 80)}..."` : ""}`;
  }).join("\n");
  const aiContext = (selectedJob && selectedJob.financial
    ? `Mei — Finance Officer (T2). Reviewing ${selectedJob.id}: ${selectedJob.customer}, $${selectedJob.value.toLocaleString()}. Billing: ${(selectedJob.financial as FinancialState).billingStatus}. Trade payment: ${(selectedJob.financial as FinancialState).tradePaymentStatus}. Xero: ${(selectedJob.financial as FinancialState).xeroSyncStatus}.`
    : `Mei — Finance Officer (T2). Operational finance queue: ${exceptionsCount} jobs with exceptions. Today's cashflow: $${cashflow.collectedToday.toLocaleString()} collected, $${cashflow.invoicedToday.toLocaleString()} invoiced, $${cashflow.overdue.toLocaleString()} overdue.`)
    + `\n\nFull finance queue:\n${queueSummary}`;

  const aiSuggestions = [
    { label: "What's blocking my close-out?", question: "Which jobs in my queue have failed RCTI sync, billing exceptions, or other blockers I need to clear before they age into receivables? Prioritise by value." },
    { label: "Aged receivables today", question: "Walk me through the overdue invoices today — by client, by age bucket. What action would you recommend on each?" },
    { label: "Variations needing sign-off", question: "Which scope variations are awaiting approval? Who needs to sign off, what's the deadline, and what's the financial impact?" },
  ];

  void persona;

  return (
    <div className="flex rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden" style={{ minHeight: "calc(100vh - 220px)" }}>

      {/* ── Column 1: Finance queue ────────────────────────────────────────── */}
      <div className="w-64 xl:w-72 2xl:w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">

        <div className="px-4 pt-4 pb-3 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-slate-700 font-semibold text-sm">Finance Queue</h2>
            {exceptionsCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{exceptionsCount} exceptions</span>
            )}
          </div>
          <p className="text-slate-400 text-[10px]">{allFinanceJobs.length} jobs in flight · synced with Xero</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-0.5 px-3 py-2 border-b border-slate-200 bg-white">
          {([
            { key: "exceptions", label: "Exceptions" },
            { key: "overdue", label: "Overdue" },
            { key: "variations", label: "Variations" },
            { key: "synced", label: "Synced" },
            { key: "all", label: "All" },
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
          {filteredJobs.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6 italic">No jobs in this view</p>
          ) : (
            filteredJobs.map(j => (
              <FinanceQueueCard
                key={j.id}
                job={j}
                selected={selectedId === j.id}
                onClick={() => setSelectedId(j.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Column 2: AI Assistant + Job Detail ─────────────────────────────── */}
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
              key={`mei-${aiResetCounter}`}
              context={aiContext}
              placeholder={selectedJob ? `Ask, search, or instruct about ${selectedJob.id}...` : "Ask, search, or instruct..."}
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
            {selectedJob ? (
              <span className="text-xs text-slate-600 truncate">
                {selectedJob.customer} · {selectedJob.suburb} · <span className="font-mono text-slate-400">{selectedJob.id}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">— select a job from the queue —</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          <div className="max-w-3xl mx-auto">
            {!selectedJob ? (
              <div className="h-full flex items-center justify-center" style={{ minHeight: 300 }}>
                <div className="text-center px-8 py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 max-w-xs">
                  <p className="text-slate-600 text-sm font-medium">Select a job from the queue</p>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">Mei's view focuses on financial state — billing, trade payment, Xero sync, variations. Click any item.</p>
                </div>
              </div>
            ) : selectedJob.financial ? (
              <div className="animate-fadeIn space-y-4">
                {/* Job header — finance-shaped */}
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Job</p>
                  <h2 className="text-base font-bold text-slate-800 mt-0.5">{selectedJob.customer} — {selectedJob.suburb}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedJob.type} · {selectedJob.window} · Trade: <span className="text-slate-700">{selectedJob.trade}</span></p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{selectedJob.id}</p>
                </div>

                {/* Headline value */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Job value</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">${selectedJob.value.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Billing</p>
                    <p className={`text-sm font-bold mt-0.5 ${BILLING_STATUS_META[(selectedJob.financial as FinancialState).billingStatus].color}`}>{BILLING_STATUS_META[(selectedJob.financial as FinancialState).billingStatus].label}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Xero</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${XERO_SYNC_META[(selectedJob.financial as FinancialState).xeroSyncStatus].dot}`} />
                      <span className={`text-sm font-bold ${XERO_SYNC_META[(selectedJob.financial as FinancialState).xeroSyncStatus].color}`}>{XERO_SYNC_META[(selectedJob.financial as FinancialState).xeroSyncStatus].label}</span>
                    </div>
                  </div>
                </div>

                {/* Full FinanceSection (auto-expanded for exception jobs) */}
                <FinanceSection jobValue={selectedJob.value} financial={selectedJob.financial as FinancialState} />

                {/* Action buttons (illustrative) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button className="text-sm bg-[#00BDFE] hover:bg-[#0099d4] text-white px-4 py-2 rounded-lg font-medium">Take action</button>
                  <button className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium">Open in Xero</button>
                  {(selectedJob.financial as FinancialState).variations?.some(v => !v.approvedBy) && (
                    <button className="text-sm bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-medium">Escalate to Aaron</button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No financial state captured for this job.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Column 3: Finance KPIs ─────────────────────────────────────────── */}
      <div className="w-56 xl:w-64 2xl:w-72 flex-shrink-0 flex flex-col border-l border-slate-200">
        <div className="px-4 pt-4 pb-3 border-b border-slate-200">
          <h2 className="text-slate-700 font-semibold text-sm">Finance Health</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <FinanceKPIPanel />
        </div>
      </div>
    </div>
  );
}
