import { useEffect } from "react";
import { JOBS, type Job } from "../data/jobs";
import { findTradeByName, COMPLIANCE_STATUS_META, type Trade } from "../data/trades";

// Trade detail drawer — slide-out from right. Operator clicks any trade name
// (queue card, job detail header, commitment owner) and gets a structured
// reference view: profile, compliance, performance, active work, recent jobs.
//
// Read-only in v1 — actioning happens in the job detail. This is lookup only
// (the most common operator workflow: phone rings, who is this trade?).

type Props = {
  tradeName: string | null;
  onClose: () => void;
  onSelectJob?: (jobId: string) => void;  // optional — clicking a job row in the drawer can drill in
};

export default function TradeDrawer({ tradeName, onClose, onSelectJob }: Props) {
  const trade = findTradeByName(tradeName);

  // Esc closes the drawer
  useEffect(() => {
    if (!tradeName) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tradeName, onClose]);

  if (!tradeName) return null;

  // Active jobs derived from JOBS dataset (live work for this trade)
  const activeJobs = JOBS.filter(j => j.trade === tradeName);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slideInRight">
        {trade ? (
          <FullProfile trade={trade} activeJobs={activeJobs} onSelectJob={onSelectJob} onClose={onClose} />
        ) : (
          <PlaceholderProfile name={tradeName} activeJobs={activeJobs} onSelectJob={onSelectJob} onClose={onClose} />
        )}
      </div>
    </>
  );
}

// ─── Full profile (modelled trade) ────────────────────────────────────────────

function FullProfile({ trade, activeJobs, onSelectJob, onClose }: {
  trade: Trade;
  activeJobs: Job[];
  onSelectJob?: (jobId: string) => void;
  onClose: () => void;
}) {
  const p = trade.performance;
  const ratingStars = "★".repeat(Math.floor(p.customerRating)) + (p.customerRating % 1 >= 0.5 ? "½" : "");

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-800 font-bold text-base leading-tight">{trade.name}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{trade.tradeTypes.join(" · ")} · {trade.region}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0">✕ close</button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="text-amber-500">{ratingStars}</span>
          <span>{p.customerRating.toFixed(1)} ({p.reviewCount} reviews)</span>
          {trade.abn && <span>· ABN {trade.abn}</span>}
        </div>
        {trade.primaryContact && (
          <p className="text-slate-500 text-[11px] mt-1">{trade.primaryContact}</p>
        )}
        {trade.narrative && (
          <p className="text-slate-600 text-[11px] mt-2 italic leading-snug">{trade.narrative}</p>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* Compliance */}
        <Section title="Compliance">
          <div className="space-y-1">
            {trade.compliance.map(c => {
              const meta = COMPLIANCE_STATUS_META[c.status];
              return (
                <div key={c.type} className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-b-0">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-slate-700 text-xs font-medium leading-tight">{c.label}</p>
                      <span className={`text-[10px] font-medium uppercase tracking-wide flex-shrink-0 ${meta.color}`}>
                        {meta.label}{c.expiry ? ` · ${c.expiry}` : ""}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">{c.authority}</p>
                    {c.detail && <p className="text-slate-500 text-[10px] mt-0.5 italic leading-snug">{c.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Performance */}
        <Section title="Performance — last 90 days">
          <div className="space-y-1.5">
            <PerfRow label="On-time"        value={p.onTime}        target={p.onTimeTarget} />
            <PerfRow label="Completion"     value={p.completion}    target={p.completionTarget} />
            <PerfRow label="Photo evidence" value={p.photoEvidence} target={p.photoEvidenceTarget} />
            <div className="flex justify-between text-xs pt-1">
              <span className="text-slate-500">Customer rating</span>
              <span className="text-slate-700 font-medium">{p.customerRating.toFixed(1)}★ ({p.reviewCount} reviews)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Complaints (90d)</span>
              <span className={`font-medium ${p.complaints90d === 0 ? "text-slate-700" : p.complaints90d <= 1 ? "text-amber-700" : "text-red-700"}`}>
                {p.complaints90d}
              </span>
            </div>
          </div>
        </Section>

        {/* Active work */}
        <Section title={`Active work (${activeJobs.length})`}>
          {activeJobs.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No active jobs in current dataset.</p>
          ) : (
            <div className="space-y-1.5">
              {activeJobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => onSelectJob?.(j.id)}
                  className="w-full text-left rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors p-2 group"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-slate-700 text-xs font-medium truncate">{j.id} · {j.customer}</p>
                    <span className={`text-[10px] font-medium flex-shrink-0 ${
                      j.priority === "jeopardy" ? "text-red-700" :
                      j.priority === "urgent" ? "text-amber-700" :
                      "text-slate-500"
                    }`}>
                      {j.priority === "jeopardy" ? "Jeopardy" : j.priority === "urgent" ? "Urgent" : j.primeStatus.replace("Works ","")}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-0.5">{j.suburb} · {j.window}</p>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Recent */}
        <Section title={`Recent (${trade.recent.length})`}>
          <div className="space-y-1">
            {trade.recent.map(r => (
              <div key={r.id} className="flex items-baseline justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 truncate">
                    <span className="font-mono text-slate-400 text-[10px]">{r.id}</span> · {r.customer} · {r.suburb}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-400 text-[10px]">{r.date}</span>
                  <RecentOutcomeBadge outcome={r.outcome} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="h-4" />
      </div>
    </>
  );
}

// ─── Placeholder for unmodelled trades ────────────────────────────────────────

function PlaceholderProfile({ name, activeJobs, onSelectJob, onClose }: {
  name: string;
  activeJobs: Job[];
  onSelectJob?: (jobId: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-slate-800 font-bold text-base leading-tight">{name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
          <p className="text-slate-500 text-xs leading-relaxed">
            Limited profile — full details not yet captured for this trade.
          </p>
          <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
            Demo coverage: <strong className="text-slate-500">Sandbar Electrical · York Digital · TAYLOR MADE Roofing · Shane's Roofing · UNITED INFOCOM · AusCorp Energy</strong>.
          </p>
        </div>
        {activeJobs.length > 0 && (
          <Section title={`Active work (${activeJobs.length})`}>
            <div className="space-y-1.5">
              {activeJobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => onSelectJob?.(j.id)}
                  className="w-full text-left rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors p-2"
                >
                  <p className="text-slate-700 text-xs font-medium truncate">{j.id} · {j.customer}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{j.suburb} · {j.window}</p>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-slate-100">
      <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function PerfRow({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.round(value * 100);
  const targetPct = Math.round(target * 100);
  const isOk = value >= target;
  const isWeak = value < target * 0.85;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-500">{label}</span>
        <span className={isOk ? "text-green-600 font-medium" : isWeak ? "text-red-700 font-medium" : "text-amber-700 font-medium"}>
          {pct}% <span className="text-slate-400 font-normal">target {targetPct}%</span>
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1">
        <div
          className={`h-1 rounded-full ${isOk ? "bg-green-400" : isWeak ? "bg-red-400" : "bg-amber-400"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RecentOutcomeBadge({ outcome }: { outcome: "complete" | "late" | "complaint" | "cancelled" }) {
  const meta = {
    complete:  { label: "✓ Complete",  color: "text-green-600" },
    late:      { label: "⚠ Late",       color: "text-amber-600" },
    complaint: { label: "✗ Complaint",  color: "text-red-600" },
    cancelled: { label: "Cancelled",   color: "text-slate-500" },
  }[outcome];
  return <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>;
}
