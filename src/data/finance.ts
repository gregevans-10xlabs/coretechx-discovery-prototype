// ─────────────────────────────────────────────────────────────────────────────
// Financial state — operational finance perspective
//
// Per Pending Changes Item [5]. Mission Control surfaces the operational
// financial state of jobs. Xero is the assumed bookkeeping platform; this
// layer captures the operational view (what's billed, what's paid, what's
// in exception, what's pending sync) and feeds Mei's Mission Control queue.
//
// Phase 1 (demonstrable from prototype data):
//   - billing / RCTI / Xero sync state per job
//   - DSO + aged receivables
//   - Variation audit trail (already partial)
//
// Phase 2 (awaits real cost instrumentation):
//   - Margin per job / client / department
//   - Forecast cashflow
//   - Real bidirectional Xero API sync
//
// FinancialState is attached to JOBS via a post-processing pass at module
// load time, mirroring the Sharon visibility-rule pattern in jobs.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { JOBS } from "./jobs";

// ─── Types ──────────────────────────────────────────────────────────────────

export type BillingStatus =
  | "not_due"           // job not yet at billable stage
  | "ready_to_invoice"  // complete, invoice not yet generated
  | "invoiced"          // invoice generated + sent to client
  | "paid"              // client has paid
  | "overdue"           // past due date, not paid
  | "exception";        // billing-side problem (sync failure, dispute)

export type TradePaymentStatus =
  | "not_due"           // work not yet complete
  | "rcti_generated"    // RCTI created, awaiting Xero sync
  | "synced"            // synced to Xero, awaiting payment run
  | "paid"              // remitted to trade
  | "failed"            // RCTI sync or payment failed
  | "exception";        // explicit problem (compliance hold, dispute)

export type RateCard = "standard" | "negotiated" | "exception";

export type XeroSyncStatus = "synced" | "pending" | "failed" | "drift" | "n/a";

export type Variation = {
  date: string;
  amount: number;        // AUD, signed
  reason: string;
  approvedBy?: string;   // persona id (or undefined if pending)
  approvedAt?: string;
};

export type FinancialState = {
  // Billing (client side)
  billingStatus: BillingStatus;
  invoiceDate?: string;
  dueDate?: string;
  paidDate?: string;
  daysToDue?: number;     // negative = overdue
  xeroInvoiceId?: string;

  // Trade payment
  tradePaymentStatus: TradePaymentStatus;
  rctiDate?: string;
  tradePaidDate?: string;
  xeroBillId?: string;

  // Pricing
  rateCard: RateCard;
  variations?: Variation[];

  // Margin (Phase 2 — populated only when production cost data exists)
  costEstimate?: number;
  marginEstimate?: number;
  phase2?: boolean;       // marker if margin is the only Phase-2 piece

  // Reconciliation
  xeroSyncedAt?: string;
  xeroSyncStatus: XeroSyncStatus;

  // Audit trail
  notes?: string[];

  // Exception detail — populated when status is "exception" / "failed"
  exceptionReason?: string;
  exceptionSince?: string;
};

// ─── Per-job financial seed data ────────────────────────────────────────────
// Populated on a representative subset of jobs covering the spread of states
// Mei needs to see.

export const FINANCIAL_DATA: Record<string, FinancialState> = {

  // CG36245 — Settle stage with RCTI portal sync failed (canonical exception)
  "CG36245": {
    billingStatus: "exception",
    tradePaymentStatus: "failed",
    rateCard: "standard",
    xeroSyncStatus: "failed",
    rctiDate: "Yesterday",
    exceptionReason: "RCTI portal sync to Newcastle TV failed 3 times. Trade payment blocked. Sharon (T1) is working the manual remittance path; finance needs to confirm Xero entry once resolved.",
    exceptionSince: "08:30 today",
    notes: ["3 retry attempts logged", "Newcastle TV portal known intermittent fault"],
  },

  // CG36210 — HN install settling cleanly (happy path)
  "CG36210": {
    billingStatus: "invoiced",
    tradePaymentStatus: "synced",
    rateCard: "standard",
    xeroSyncStatus: "synced",
    invoiceDate: "Yesterday",
    dueDate: "13 days",
    daysToDue: 13,
    xeroInvoiceId: "INV-2407",
    rctiDate: "Yesterday",
    xeroBillId: "BILL-1992",
    xeroSyncedAt: "Yesterday 14:08",
    notes: ["Customer satisfaction survey returned 5/5"],
  },

  // CG36069 — Mardi scope variation pending Aaron sign-off
  "CG36069": {
    billingStatus: "not_due",
    tradePaymentStatus: "not_due",
    rateCard: "negotiated",
    xeroSyncStatus: "n/a",
    variations: [
      { date: "Today 09:05", amount: 1800, reason: "Additional water damage to ceiling joists discovered during makesafe", approvedBy: undefined },
    ],
    notes: ["Variation routed to Aaron — hard limit (>$1k requires Authoriser)", "Allianz client awaiting clarification (HS-44801)"],
  },

  // CG36080 — Macmasters Beach happy path, ready to invoice
  "CG36080": {
    billingStatus: "ready_to_invoice",
    tradePaymentStatus: "not_due",
    rateCard: "standard",
    xeroSyncStatus: "pending",
    notes: ["Auto-invoice on Settle completion (default flow)"],
  },

  // CG35958 — Point Clare HN paid both sides
  "CG35958": {
    billingStatus: "paid",
    tradePaymentStatus: "paid",
    rateCard: "standard",
    xeroSyncStatus: "synced",
    invoiceDate: "8 days ago",
    paidDate: "Today",
    rctiDate: "8 days ago",
    tradePaidDate: "5 days ago",
    xeroInvoiceId: "INV-2351",
    xeroBillId: "BILL-1944",
    xeroSyncedAt: "Today 09:14",
  },

  // CG36031 — Bulahdelah Home Repair, OVERDUE (canonical aged-receivable case)
  "CG36031": {
    billingStatus: "overdue",
    tradePaymentStatus: "paid",
    rateCard: "standard",
    xeroSyncStatus: "drift",
    invoiceDate: "21 days ago",
    dueDate: "5 days ago",
    daysToDue: -5,
    paidDate: undefined,
    rctiDate: "20 days ago",
    tradePaidDate: "16 days ago",
    xeroInvoiceId: "INV-2218",
    xeroBillId: "BILL-1817",
    xeroSyncedAt: "21 days ago 14:00",
    exceptionReason: "Customer hasn't paid 5 days past due. Trade has been paid in full ($2,400). Suggested action: collections call OR write down (small amount).",
    exceptionSince: "5 days ago",
    notes: ["Customer paid for similar past job after gentle nudge", "Xero shows last sync drift on 21 days ago"],
  },

  // CG36011 — Port Macquarie roofing, pricing exception (manual procurement)
  "CG36011": {
    billingStatus: "not_due",
    tradePaymentStatus: "not_due",
    rateCard: "exception",
    xeroSyncStatus: "n/a",
    notes: ["Manual procurement — outside standard rate card", "Compliance exception decision required before proceeding (Kerrie)"],
  },

  // CG35930 — Smart Techie second no-show, billing held
  "CG35930": {
    billingStatus: "exception",
    tradePaymentStatus: "exception",
    rateCard: "standard",
    xeroSyncStatus: "n/a",
    exceptionReason: "Job in jeopardy — second no-show from Smart Techie. Allocation likely transferred to Remiria. Billing held pending re-allocation outcome.",
    exceptionSince: "Today 10:35",
    notes: ["Awaiting shadow-plan activation decision"],
  },
};

// ─── Post-processing pass — attach financial state to JOBS ──────────────────
// Mirrors the Sharon visibility pattern in jobs.ts. Mutates JOBS items in
// place at module load time.
for (const job of JOBS) {
  const fin = FINANCIAL_DATA[job.id];
  if (fin) job.financial = fin;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Jobs with finance-relevant state — Mei's queue source. */
export function jobsWithFinancialState(): typeof JOBS {
  return JOBS.filter(j => j.financial);
}

/** Jobs with active financial exceptions — Mei's exception queue. */
export function financeExceptions(): typeof JOBS {
  return JOBS.filter(j => {
    const f = j.financial as FinancialState | undefined;
    if (!f) return false;
    return f.billingStatus === "exception"
        || f.billingStatus === "overdue"
        || f.tradePaymentStatus === "exception"
        || f.tradePaymentStatus === "failed"
        || f.xeroSyncStatus === "failed"
        || f.xeroSyncStatus === "drift"
        || (f.variations?.some(v => !v.approvedBy) ?? false);
  });
}

/** Aggregate cashflow stats — feeds Aaron's outcome scoreboard. */
export function cashflowSnapshot(): { invoicedToday: number; collectedToday: number; overdue: number; readyToInvoice: number; openInvoiceTotal: number } {
  let invoicedToday = 0;
  let collectedToday = 0;
  let overdue = 0;
  let readyToInvoice = 0;
  let openInvoiceTotal = 0;
  for (const job of JOBS) {
    const f = job.financial as FinancialState | undefined;
    if (!f) continue;
    if (f.billingStatus === "ready_to_invoice") readyToInvoice += job.value;
    if (f.billingStatus === "invoiced") openInvoiceTotal += job.value;
    if (f.invoiceDate?.includes("Yesterday") || f.invoiceDate?.includes("Today")) invoicedToday += job.value;
    if (f.paidDate?.includes("Today")) collectedToday += job.value;
    if (f.billingStatus === "overdue") overdue += job.value;
  }
  return { invoicedToday, collectedToday, overdue, readyToInvoice, openInvoiceTotal };
}

// ─── Display metadata ───────────────────────────────────────────────────────

export const BILLING_STATUS_META: Record<BillingStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  not_due:           { label: "Not due",           color: "text-slate-500", bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300" },
  ready_to_invoice:  { label: "Ready to invoice",  color: "text-sky-700",   bg: "bg-sky-50",    border: "border-sky-200",    dot: "bg-sky-500" },
  invoiced:          { label: "Invoiced",          color: "text-sky-700",   bg: "bg-sky-50",    border: "border-sky-200",    dot: "bg-sky-500" },
  paid:              { label: "Paid",              color: "text-green-700", bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500" },
  overdue:           { label: "Overdue",           color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-300",  dot: "bg-amber-500" },
  exception:         { label: "Exception",         color: "text-red-700",   bg: "bg-red-50",    border: "border-red-300",    dot: "bg-red-500" },
};

export const TRADE_PAYMENT_STATUS_META: Record<TradePaymentStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  not_due:         { label: "Not due",         color: "text-slate-500", bg: "bg-slate-50",  border: "border-slate-200",  dot: "bg-slate-300" },
  rcti_generated:  { label: "RCTI generated",  color: "text-sky-700",   bg: "bg-sky-50",    border: "border-sky-200",    dot: "bg-sky-500" },
  synced:          { label: "Synced to Xero",  color: "text-sky-700",   bg: "bg-sky-50",    border: "border-sky-200",    dot: "bg-sky-500" },
  paid:            { label: "Paid",            color: "text-green-700", bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500" },
  failed:          { label: "Sync failed",     color: "text-red-700",   bg: "bg-red-50",    border: "border-red-300",    dot: "bg-red-500" },
  exception:       { label: "Exception",       color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-300",  dot: "bg-amber-500" },
};

export const XERO_SYNC_META: Record<XeroSyncStatus, { label: string; color: string; dot: string }> = {
  synced:  { label: "Synced",  color: "text-green-600", dot: "bg-green-500" },
  pending: { label: "Pending", color: "text-slate-500", dot: "bg-slate-400" },
  failed:  { label: "Failed",  color: "text-red-600",   dot: "bg-red-500" },
  drift:   { label: "Drift",   color: "text-amber-600", dot: "bg-amber-500" },
  "n/a":   { label: "—",       color: "text-slate-400", dot: "bg-slate-300" },
};
