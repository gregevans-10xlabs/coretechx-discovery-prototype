import { useState } from "react";
import type { FinancialState } from "../data/finance";
import { BILLING_STATUS_META, TRADE_PAYMENT_STATUS_META, XERO_SYNC_META } from "../data/finance";

// FinanceSection — surfaces the operational financial state of a job inside
// JobDetail. Sits next to the Service Activity panel as a parallel concern.
// Compact when state is uneventful (paid both sides, no exceptions);
// expanded when there's something Mei should look at.

type Props = {
  jobValue: number;
  financial: FinancialState;
};

function StatusPill({ label, status, meta }: { label: string; status: string; meta: { label: string; color: string; bg: string; border: string; dot: string } }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      <span className="text-slate-400 uppercase tracking-wider text-[9px] font-semibold">{label}</span>
      <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
      {status === meta.label.toLowerCase() && null /* no-op */}
    </div>
  );
}

export default function FinanceSection({ jobValue, financial }: Props) {
  const billing = BILLING_STATUS_META[financial.billingStatus];
  const tradePay = TRADE_PAYMENT_STATUS_META[financial.tradePaymentStatus];
  const xero = XERO_SYNC_META[financial.xeroSyncStatus];

  const isException = financial.billingStatus === "exception"
                   || financial.billingStatus === "overdue"
                   || financial.tradePaymentStatus === "exception"
                   || financial.tradePaymentStatus === "failed"
                   || financial.xeroSyncStatus === "failed"
                   || financial.xeroSyncStatus === "drift"
                   || (financial.variations?.some(v => !v.approvedBy) ?? false);

  const [expanded, setExpanded] = useState(isException);

  const totalValue = (financial.variations ?? []).reduce((sum, v) => sum + v.amount, jobValue);
  const variationDelta = totalValue - jobValue;

  return (
    <div className={`rounded-lg border ${isException ? "bg-amber-50/50 border-amber-200" : "bg-slate-50 border-slate-200"} overflow-hidden`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-3 py-2 flex items-center gap-3"
      >
        <span className="text-slate-500 text-xs flex-shrink-0">{expanded ? "▾" : "▸"}</span>
        <p className="text-slate-500 text-xs font-medium flex-1">Finance</p>
        <div className="flex items-center gap-3 text-[11px] flex-shrink-0">
          <StatusPill label="Billing" status={financial.billingStatus} meta={billing} />
          <StatusPill label="Trade pay" status={financial.tradePaymentStatus} meta={tradePay} />
          {financial.xeroSyncStatus !== "n/a" && (
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${xero.dot}`} />
              <span className="text-slate-400 uppercase tracking-wider text-[9px] font-semibold">Xero</span>
              <span className={`font-semibold ${xero.color}`}>{xero.label}</span>
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-200/60 pt-2.5">

          {/* Exception detail */}
          {isException && financial.exceptionReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1">Exception {financial.exceptionSince ? `· since ${financial.exceptionSince}` : ""}</p>
              <p className="text-xs text-slate-700 leading-snug">{financial.exceptionReason}</p>
            </div>
          )}

          {/* Value + variation */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Job value</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">${jobValue.toLocaleString()}</p>
              {variationDelta !== 0 && (
                <p className={`text-[10px] mt-0.5 ${variationDelta > 0 ? "text-amber-600" : "text-green-600"} font-semibold`}>
                  {variationDelta > 0 ? "+" : ""}${variationDelta.toLocaleString()} variation → ${totalValue.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Rate card</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{financial.rateCard.replace(/_/g, " ")}</p>
              {financial.rateCard === "exception" && (
                <p className="text-[10px] text-amber-600 mt-0.5">Manual procurement</p>
              )}
            </div>
          </div>

          {/* Billing details */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Client billing</p>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-0.5">
              <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className={`font-semibold ${billing.color}`}>{billing.label}</span></div>
              {financial.invoiceDate && <div className="flex justify-between"><span className="text-slate-400">Invoice date:</span> <span className="text-slate-700">{financial.invoiceDate}</span></div>}
              {financial.dueDate && <div className="flex justify-between"><span className="text-slate-400">Due date:</span> <span className={`text-slate-700 ${(financial.daysToDue ?? 0) < 0 ? "text-amber-700 font-semibold" : ""}`}>{financial.dueDate}</span></div>}
              {financial.paidDate && <div className="flex justify-between"><span className="text-slate-400">Paid date:</span> <span className="text-green-700">{financial.paidDate}</span></div>}
              {financial.xeroInvoiceId && <div className="flex justify-between"><span className="text-slate-400">Xero invoice:</span> <span className="text-slate-700 font-mono text-[10px]">{financial.xeroInvoiceId}</span></div>}
            </div>
          </div>

          {/* Trade payment details */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Trade payment</p>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-0.5">
              <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className={`font-semibold ${tradePay.color}`}>{tradePay.label}</span></div>
              {financial.rctiDate && <div className="flex justify-between"><span className="text-slate-400">RCTI generated:</span> <span className="text-slate-700">{financial.rctiDate}</span></div>}
              {financial.tradePaidDate && <div className="flex justify-between"><span className="text-slate-400">Trade paid:</span> <span className="text-green-700">{financial.tradePaidDate}</span></div>}
              {financial.xeroBillId && <div className="flex justify-between"><span className="text-slate-400">Xero bill:</span> <span className="text-slate-700 font-mono text-[10px]">{financial.xeroBillId}</span></div>}
            </div>
          </div>

          {/* Variations */}
          {financial.variations && financial.variations.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Variations</p>
              <div className="space-y-1">
                {financial.variations.map((v, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-bold ${v.amount > 0 ? "text-amber-700" : "text-green-700"}`}>{v.amount > 0 ? "+" : ""}${v.amount.toLocaleString()}</span>
                      <span className="text-slate-400 text-[10px]">{v.date}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-snug">{v.reason}</p>
                    <p className={`mt-1 text-[10px] ${v.approvedBy ? "text-green-600" : "text-amber-700 font-semibold"}`}>
                      {v.approvedBy ? `✓ Approved by ${v.approvedBy}${v.approvedAt ? ` · ${v.approvedAt}` : ""}` : "⚠ Awaiting Authoriser sign-off"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Margin — Phase 2 honesty */}
          {!financial.marginEstimate && (
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-500 italic leading-snug">
              <span className="font-semibold not-italic text-slate-600">Margin (Phase 2):</span> requires per-job cost instrumentation. Currently shown as Phase 2 in Aaron's outcomes scoreboard.
            </div>
          )}

          {/* Notes */}
          {financial.notes && financial.notes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Notes</p>
              <ul className="space-y-0.5">
                {financial.notes.map((n, i) => (
                  <li key={i} className="text-[11px] text-slate-600 leading-snug flex gap-2">
                    <span className="text-slate-300 flex-shrink-0">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
