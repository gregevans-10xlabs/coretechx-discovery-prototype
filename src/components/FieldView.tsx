import { useState } from "react";
import { JOBS, type Job, STARLINK_JOURNEY, HN_JOURNEY, INSURANCE_JOURNEY, AHO_JOURNEY } from "../data/jobs";
import PerformanceHub from "./PerformanceHub";
import AskAI from "./AskAI";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// helpers used in sub-components
function _cc(_v: number) { return ""; } void _cc;

// Background volume (illustrative — dataset is a subset)
const FIELD_REGION_TOTAL: Record<string, number> = {
  conner: 420,
  blake:  310,
};

// Sort: action-required first, then by priority, then rest
function sortDecisionFirst(jobs: Job[]): Job[] {
  const score = (j: Job) => {
    if (j.actionRequired && j.priority === "jeopardy") return 0;
    if (j.actionRequired && j.priority === "urgent")   return 1;
    if (j.actionRequired)                              return 2;
    return 10;
  };
  return [...jobs].sort((a, b) => score(a) - score(b));
}
function confBadge(v: number) {
  const base = "text-xs font-mono font-bold px-2 py-0.5 rounded-full border";
  if (v >= 0.75) return `${base} bg-green-50 text-green-700 border-green-200`;
  if (v >= 0.5)  return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  return `${base} bg-red-50 text-red-600 border-red-200`;
}

function getJourney(job: Job) {
  if (job.type === "Insurance Repair")  return INSURANCE_JOURNEY;
  if (job.type === "AHO Construction")  return AHO_JOURNEY;
  if (job.type === "Harvey Norman Install" || job.type === "JB Hi-Fi Install") return HN_JOURNEY;
  return STARLINK_JOURNEY;
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({ job, onClose }: { job: Job; onClose: () => void }) {
  const journey = getJourney(job);
  const [actionDone, setActionDone] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="text-slate-400 text-xs">{job.customer} · {job.suburb}</p>
            <p className="text-[9px] font-mono text-slate-300 mt-0.5">{job.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>

        {job.flags.length > 0 && (
          <div className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 mt-2 ${
            job.priority === "jeopardy" ? "bg-red-50 border border-red-200 text-red-700" :
            job.priority === "urgent"   ? "bg-amber-50 border border-amber-200 text-amber-700" :
            "bg-slate-50 border border-slate-200 text-slate-600"
          }`}>
            <span>{job.priority === "jeopardy" ? "🔴" : job.priority === "urgent" ? "⚠️" : "ℹ️"}</span>
            <span>{job.flags[0]?.detail}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <h2 className="text-slate-800 font-bold text-base leading-tight">{job.trade}</h2>
          <span className={confBadge(job.conf)}>{job.conf.toFixed(1)}</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">{job.suburb} · {job.window}</p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">STAGE</p>
            <p className="text-slate-700 text-sm font-medium">{job.primeStatus}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">PRIORITY</p>
            <p className={`text-sm font-medium capitalize ${job.priority === "jeopardy" ? "text-red-600" : job.priority === "urgent" ? "text-amber-600" : "text-slate-700"}`}>{job.priority}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">TRADE TYPE</p>
            <p className="text-slate-700 text-sm font-medium">{job.tradeType}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">VALUE</p>
            <p className="text-slate-700 text-sm font-medium">${job.value.toLocaleString()}</p>
          </div>
          {job.kpiDeadline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 col-span-2">
              <p className="text-amber-600 text-xs mb-1">⏱ KPI DEADLINE</p>
              <p className="text-amber-700 text-sm font-medium">{job.kpiDeadline}</p>
            </div>
          )}
        </div>

        {/* Journey */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Journey Progress</p>
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {journey.map((step, i) => {
              const done = i < job.journeyStep;
              const active = i === job.journeyStep;
              return (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done   ? "bg-[#00BDFE] border-[#00BDFE] text-white" :
                      active ? "bg-white border-[#00BDFE] text-[#00BDFE]" :
                               "bg-white border-slate-200 text-slate-300"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-[9px] mt-1 text-center w-12 leading-tight ${active ? "text-[#00BDFE] font-semibold" : done ? "text-slate-400" : "text-slate-300"}`}>{step}</p>
                  </div>
                  {i < journey.length - 1 && (
                    <div className={`h-0.5 w-4 flex-shrink-0 mb-4 ${i < job.journeyStep ? "bg-[#00BDFE]" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Log */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Activity Log — AI handled everything below</p>
          <div className="space-y-1.5">
            {job.aiLog.map((entry, i) => (
              <div key={i} className="flex gap-2.5 text-xs">
                <span className="text-slate-300 font-mono w-16 flex-shrink-0 pt-0.5">{entry.time}</span>
                <span className="text-[10px] font-semibold text-[#00BDFE] flex-shrink-0 pt-0.5 w-5">AI</span>
                <span className="text-slate-600 leading-relaxed">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action required */}
        {job.actionRequired && !actionDone && (
          <div className="border-2 border-amber-400 bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500 text-base">⚡</span>
              <p className="text-amber-800 text-sm font-bold">{job.actionRequired}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.actionOptions.map((opt, i) => (
                <button key={i} onClick={() => setActionDone(opt)}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    i === 0 ? "bg-[#00BDFE] hover:bg-[#0099d4] text-white" :
                    i === job.actionOptions.length - 1 ? "bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 text-xs" :
                    "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}>{opt}</button>
              ))}
            </div>
          </div>
        )}
        {actionDone && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="text-green-700 text-sm font-semibold">Action logged</p>
              <p className="text-green-600 text-xs mt-0.5">"{actionDone}" — recorded in audit trail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FieldView ────────────────────────────────────────────────────────────────
const FIELD_CONFIG: Record<string, {
  role: string;
  jobTypes: string[];
  kpiLabel: string;
  kpis: { label: string; value: string; sub?: string; color?: string }[];
  skills: { label: string; level: string; color: string }[];
}> = {
  conner: {
    role: "Construction & AHO",
    jobTypes: ["AHO Construction"],
    kpiLabel: "My KPIs — Construction",
    kpis: [
      { label: "Active projects", value: "2", sub: "AHO NSW", color: "text-slate-800" },
      { label: "On-site today", value: "2", sub: "Both geo-confirmed", color: "text-green-600" },
      { label: "QA calls due", value: "1", sub: "Minto — today 2–4pm", color: "text-amber-600" },
      { label: "Avg project value", value: "$16.4k", sub: "This quarter", color: "text-slate-800" },
    ],
    skills: [
      { label: "AHO Construction", level: "Expert", color: "text-green-600" },
      { label: "FM Emergency", level: "Proficient", color: "text-[#00BDFE]" },
      { label: "Insurance Repair", level: "Learning", color: "text-amber-500" },
    ],
  },
  blake: {
    role: "FM & Home Repair",
    jobTypes: ["Home Repair"],
    kpiLabel: "My KPIs — FM",
    kpis: [
      { label: "Active jobs", value: "2", sub: "Home Repair", color: "text-slate-800" },
      { label: "Awaiting approval", value: "1", sub: "Karuah — 5 days", color: "text-amber-600" },
      { label: "Completed this week", value: "1", sub: "Bulahdelah — invoiced", color: "text-green-600" },
      { label: "Avg response time", value: "4.2h", sub: "vs 6h target", color: "text-green-600" },
    ],
    skills: [
      { label: "Home Repair", level: "Expert", color: "text-green-600" },
      { label: "FM Emergency", level: "Expert", color: "text-green-600" },
      { label: "AHO Construction", level: "Learning", color: "text-amber-500" },
    ],
  },
};

export default function FieldView({ persona }: { persona: string }) {
  const config  = FIELD_CONFIG[persona] ?? FIELD_CONFIG.blake;
  const allJobs = sortDecisionFirst(JOBS.filter(j => j.visibleTo.includes(persona)));

  const decisionJobs = allJobs.filter(j => j.actionRequired !== null);
  const regionTotal  = FIELD_REGION_TOTAL[persona] ?? 300;
  const aiHandling   = regionTotal - decisionJobs.length;

  const [filterTab, setFilterTab] = useState<"action" | "browse" | "complete">("action");
  const [selectedId, setSelectedId] = useState<string | null>(decisionJobs[0]?.id ?? null);

  const selectedJob = selectedId ? allJobs.find(j => j.id === selectedId) ?? null : null;

  const filteredJobs = allJobs.filter(j => {
    if (filterTab === "action")   return j.actionRequired !== null;
    if (filterTab === "complete") return j.primeStatus === "Works Complete" || j.primeStatus === "Invoiced";
    return true;
  });

  const decisionCount = decisionJobs.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
      <div className="flex h-full">

        {/* ── Column 1: Decision Queue ─────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-slate-700 font-semibold text-sm">Action Required</h2>
              {decisionCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                  {decisionCount}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[10px] mb-3">AI handling {aiHandling.toLocaleString()} others</p>
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {([
                { key: "action",   label: `Decisions (${decisionCount})` },
                { key: "browse",   label: "Browse all" },
                { key: "complete", label: "Complete" },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setFilterTab(tab.key)}
                  className={`flex-1 text-[10px] py-1 rounded-md font-semibold transition-colors ${filterTab === tab.key ? "bg-[#00BDFE] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin relative">
            <div className="space-y-1 px-2">
              {filteredJobs.length === 0 && filterTab === "action" ? (
                <div className="text-center px-3 py-8 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                    <span className="text-green-500 text-lg">✓</span>
                  </div>
                  <p className="text-slate-600 text-xs font-semibold">Nothing needs your attention</p>
                  <p className="text-slate-400 text-[10px] leading-relaxed">AI is handling all {regionTotal.toLocaleString()} active jobs</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-xs">No jobs in this view</p>
                </div>
              ) : filteredJobs.map(job => {
                const isSelected = selectedId === job.id;
                return (
                  <button key={job.id} onClick={() => setSelectedId(isSelected ? null : job.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      isSelected ? "bg-[#e0f7ff] border-[#00BDFE]" :
                      job.priority === "jeopardy" ? "bg-red-50 border-red-200 hover:border-red-300" :
                      job.priority === "urgent"   ? "bg-amber-50 border-amber-200 hover:border-amber-300" :
                      "bg-white border-slate-200 hover:border-slate-300"
                    }`}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-slate-800 text-xs font-semibold leading-tight truncate">{job.trade}</p>
                      <span className={confBadge(job.conf)}>{job.conf.toFixed(1)}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] truncate">{job.suburb} · {job.window}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{job.type}</span>
                      {job.priority !== "standard" && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${job.priority === "jeopardy" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{job.priority}</span>
                      )}
                    </div>
                    {job.actionRequired && (
                      <p className="text-amber-700 text-[10px] mt-1.5 font-medium truncate">⚡ {job.actionRequired}</p>
                    )}
                    <p className="text-[9px] font-mono text-slate-300 mt-1">{job.id}</p>
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
              {decisionCount === 0 ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4">
                    <span className="text-green-500 text-2xl">✓</span>
                  </div>
                  <p className="text-slate-700 font-semibold text-sm mb-1">Nothing needs your attention</p>
                  <p className="text-slate-400 text-xs max-w-48 leading-relaxed">AI is handling all {regionTotal.toLocaleString()} active jobs in your region</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#e0f7ff] border-2 border-[#00BDFE]/30 flex items-center justify-center mb-4">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <p className="text-slate-700 font-semibold text-sm mb-1">Select a job to review</p>
                  <p className="text-slate-400 text-xs max-w-48 leading-relaxed">AI is handling {aiHandling.toLocaleString()} others — only these {decisionCount} need you</p>
                </>
              )}
            </div>
          ) : (
            <JobDetailPanel job={selectedJob} onClose={() => setSelectedId(null)} />
          )}
        </div>

        {/* ── Column 3: My Performance ────────────────────────────────────── */}
        <div className="w-60 flex-shrink-0 flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-slate-700 font-semibold text-sm">My Performance</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

            <PerformanceHub persona={persona} />

            {/* Escalation chain */}
            <div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Escalation Chain</p>
              <div className="space-y-1.5">
                {[
                  { name: persona === "conner" ? "Conner" : "Blake", role: config.role, you: true },
                  { name: "National Ops", role: "Portfolio oversight", you: false },
                  { name: "Aaron", role: "Executive sponsor", you: false },
                ].map((e, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${e.you ? "text-[#00BDFE] font-semibold" : "text-slate-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.you ? "bg-[#00BDFE]" : "bg-slate-300"}`} />
                    <span>{e.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className={e.you ? "text-[#00BDFE]/70" : "text-slate-400"}>{e.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask AI */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-slate-500 text-xs font-semibold mb-2">Ask AI</p>
              <AskAI
                context={`${persona === "conner" ? "Conner — Construction / AHO Ops Manager" : "Blake — FM & Home Repair Ops Manager"}. ${decisionJobs.length} decision${decisionJobs.length !== 1 ? "s" : ""} pending from ${allJobs.length} visible jobs. Region total: ${regionTotal.toLocaleString()} (AI handling ${aiHandling.toLocaleString()} others).`}
                placeholder="e.g. What's the best next action on the jeopardy job?"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
