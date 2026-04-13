import { useState } from "react";
import {
  CHEKKU_TRADE, CHEKKU_TODAY, CHEKKU_TOMORROW,
  CHEKKU_COMPLIANCE, CHEKKU_AI_LOG, type TradeJob, type ComplianceDoc
} from "../data/chekku";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function confBadge(v: number) {
  const base = "text-xs font-mono font-bold px-2 py-0.5 rounded-full border";
  if (v >= 0.75) return `${base} bg-green-50 text-green-700 border-green-200`;
  if (v >= 0.5)  return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  return `${base} bg-red-50 text-red-600 border-red-200`;
}

function ComplianceRow({ doc }: { doc: ComplianceDoc }) {
  const cfg = {
    valid:         { dot: "bg-green-400",  text: "text-green-700",  label: "Valid"         },
    expiring_soon: { dot: "bg-amber-400",  text: "text-amber-700",  label: "Expiring soon" },
    expired:       { dot: "bg-red-400",    text: "text-red-700",    label: "Expired"       },
  }[doc.status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="text-slate-700 text-xs">{doc.label}</span>
      </div>
      <div className="text-right">
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
        <p className="text-slate-400 text-[10px]">{doc.expiry}</p>
      </div>
    </div>
  );
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({ job, onClose }: { job: TradeJob; onClose: () => void }) {
  const [responded, setResponded] = useState(false);
  const isAction = job.status === "action_required";

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{job.type}</span>
              {isAction && !responded && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Your action needed</span>
              )}
              {responded && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Responded</span>
              )}
            </div>
            <h2 className="text-slate-800 font-bold text-base mt-1">{job.suburb}</h2>
            <p className="text-slate-500 text-xs">{job.window} · {job.customer}</p>
            <p className="text-[9px] font-mono text-slate-300 mt-0.5">{job.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={confBadge(job.conf)}>{job.conf.toFixed(2)}</span>
            <p className="text-slate-800 font-bold text-sm">${job.earnings}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs mt-1">✕ close</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {/* Action required */}
        {isAction && !responded && (
          <div className="border-2 border-amber-400 bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500 text-base">⚡</span>
              <p className="text-amber-800 text-sm font-bold">{job.actionRequired}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setResponded(true)}
                className="text-sm bg-[#00BDFE] hover:bg-[#0099d4] text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                Confirm reschedule
              </button>
              <button onClick={() => setResponded(true)}
                className="text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Propose different time
              </button>
            </div>
          </div>
        )}
        {responded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-green-700 text-sm font-semibold">Response logged — Circl notified</p>
          </div>
        )}

        {/* AI handled */}
        {job.aiHandled && (
          <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-[#00BDFE] text-sm flex-shrink-0">✦</span>
              <div>
                <p className="text-[#0099d4] text-xs font-semibold mb-1">AI handled this for you</p>
                <p className="text-slate-600 text-sm">{job.aiHandled}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">JOB TYPE</p>
            <p className="text-slate-700 text-sm font-medium">{job.type}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">EARNINGS</p>
            <p className="text-slate-700 text-sm font-bold">${job.earnings}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 col-span-2">
            <p className="text-slate-400 text-xs mb-1">WINDOW</p>
            <p className="text-slate-700 text-sm font-medium">{job.window}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ChekkuView — Three-Column ───────────────────────────────────────────
export default function ChekkuView() {
  const T = CHEKKU_TRADE;
  const earningsPct = Math.round((T.earningsThisWeek / T.earningsTarget) * 100);

  const allJobs: (TradeJob & { day: "today" | "tomorrow" })[] = [
    ...CHEKKU_TODAY.map(j => ({ ...j, day: "today" as const })),
    ...CHEKKU_TOMORROW.map(j => ({ ...j, day: "tomorrow" as const })),
  ];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "today" | "tomorrow">("all");

  const selectedJob = selectedId ? allJobs.find(j => j.id === selectedId) ?? null : null;

  const filteredJobs = allJobs.filter(j => {
    if (filterTab === "today") return j.day === "today";
    if (filterTab === "tomorrow") return j.day === "tomorrow";
    return true;
  });

  const actionCount = allJobs.filter(j => j.status === "action_required").length;
  const expiringDocs = CHEKKU_COMPLIANCE.filter(d => d.status !== "valid");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
      <div className="flex h-full">

        {/* ── Column 1: My Jobs ───────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-700 font-semibold text-sm">My Jobs</h2>
              {actionCount > 0 && (
                <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  {actionCount} action
                </span>
              )}
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {(["all", "today", "tomorrow"] as const).map(tab => (
                <button key={tab} onClick={() => setFilterTab(tab)}
                  className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors capitalize ${filterTab === tab ? "bg-[#00BDFE] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin relative">
            <div className="space-y-1 px-2">
              {filteredJobs.map(job => {
                const isSelected = selectedId === job.id;
                const isAction = job.status === "action_required";
                return (
                  <button key={job.id} onClick={() => setSelectedId(isSelected ? null : job.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      isSelected ? "bg-[#e0f7ff] border-[#00BDFE]" :
                      isAction ? "bg-amber-50 border-amber-200 hover:border-amber-300" :
                      "bg-white border-slate-200 hover:border-slate-300"
                    }`}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-slate-800 text-xs font-semibold leading-tight">{job.suburb}</p>
                      <span className={confBadge(job.conf)}>{job.conf.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500 text-[10px]">{job.window} · {job.type}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${job.day === "today" ? "bg-[#e0f7ff] text-[#0099d4]" : "bg-slate-100 text-slate-500"}`}>
                        {job.day === "today" ? "Today" : "Tomorrow"}
                      </span>
                      <span className="text-slate-700 text-xs font-bold">${job.earnings}</span>
                    </div>
                    {isAction && (
                      <p className="text-amber-700 text-[10px] mt-1.5 font-medium">⚡ Action needed</p>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>

        {/* ── Column 2: Current Focus ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col border-r border-slate-200 min-w-0">
          <div className="px-5 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-slate-700 font-semibold text-sm">Current Focus</h2>
          </div>

          {selectedJob === null ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#e0f7ff] border-2 border-[#00BDFE]/30 flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-slate-700 font-semibold text-sm mb-1">Select a job to view details</p>
              <p className="text-slate-400 text-xs max-w-48 leading-relaxed">AI has handled everything — you only act when required</p>
              {actionCount > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-amber-700 text-xs font-semibold">⚡ {actionCount} job{actionCount > 1 ? "s" : ""} need{actionCount === 1 ? "s" : ""} your response</p>
                </div>
              )}
            </div>
          ) : (
            <JobDetailPanel job={selectedJob} onClose={() => setSelectedId(null)} />
          )}
        </div>

        {/* ── Column 3: My Earnings & Compliance ──────────────────────────── */}
        <div className="w-60 flex-shrink-0 flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-slate-700 font-semibold text-sm">My Account</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

            {/* Trade identity */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-[#e0f7ff] text-[#0099d4] px-2 py-0.5 rounded-full font-medium">{T.tier}</span>
                <span className="text-yellow-500 text-xs font-semibold">★ {T.rating}</span>
              </div>
              <p className="text-slate-800 font-bold text-sm">{T.tradeName}</p>
              <p className="text-slate-500 text-xs">{T.name} · {T.region}</p>
              {T.guaranteeActive && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                  <p className="text-green-700 text-xs font-semibold">✓ Work guarantee active</p>
                </div>
              )}
            </div>

            {/* Earnings */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-2">Earnings this week</p>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-700 font-bold text-lg">${T.earningsThisWeek.toLocaleString()}</span>
                <span className="text-slate-400">/ ${T.earningsTarget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                <div className="h-2 rounded-full bg-[#00BDFE] transition-all" style={{ width: `${Math.min(earningsPct, 100)}%` }} />
              </div>
              <p className="text-slate-400 text-xs">{T.jobsCompleted} of {T.jobsThisWeek} jobs done</p>
            </div>

            {/* AI activity log */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-slate-700 text-xs font-semibold mb-1">AI handled for you</p>
              <p className="text-slate-400 text-[10px] mb-3">{CHEKKU_AI_LOG.length} actions in last 24h — no input needed</p>
              <div className="space-y-2">
                {CHEKKU_AI_LOG.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#00BDFE] text-xs flex-shrink-0 mt-0.5">✦</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-xs font-medium leading-tight">{entry.action}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{entry.detail}</p>
                      <p className="text-slate-300 text-[10px]">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-700 text-xs font-semibold">Compliance documents</p>
                {expiringDocs.length > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">{expiringDocs.length} ⚠</span>
                )}
              </div>
              <div>
                {CHEKKU_COMPLIANCE.map((doc, i) => <ComplianceRow key={i} doc={doc} />)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
