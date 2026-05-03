import { useState } from "react";
import { JOBS, type Job } from "../data/jobs";
import { riskState, riskBadgeClass, TAG_VOCABULARY, SILENT_DECISIONS, RECALL_REASON_CHIPS, type ModelFeedback, type FieldDeferral } from "../data/scenarios";
import PerformanceHub from "./PerformanceHub";
import AskAI from "./AskAI";
import JourneyBar from "./JourneyBar";
import CommitmentAnatomy from "./CommitmentAnatomy";
import AIAuditTab from "./AIAuditTab";
import DeferralReasonModal from "./DeferralReasonModal";
import TradeLink from "./TradeLink";
import ShadowPlanPill from "./ShadowPlanPill";
import CountdownPill from "./CountdownPill";

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
function CardTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map(t => {
        const meta = TAG_VOCABULARY.find(v => v.label === t);
        if (!meta) return null;
        return (
          <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${meta.color}`}>
            {meta.icon} {t}
          </span>
        );
      })}
    </div>
  );
}

function RiskBadge({ conf, size = "md" }: { conf: number; size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span className={`inline-flex items-center font-semibold border rounded-full ${text} ${riskBadgeClass(conf)}`}>
      {riskState(conf)}
    </span>
  );
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({ job, onClose, onAskWhy, tags, onAddTag, onRemoveTag, activeDeferral, onDeferRequest, onRecallRequest, onSelectTrade }: { job: Job; onClose: () => void; onAskWhy: () => void; tags: string[]; onAddTag?: (tag: string) => void; onRemoveTag?: (tag: string) => void; activeDeferral?: FieldDeferral; onDeferRequest?: () => void; onRecallRequest?: () => void; onSelectTrade?: (name: string) => void }) {
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
          <h2 className="text-slate-800 font-bold text-base leading-tight">
            <TradeLink name={job.trade} onSelectTrade={onSelectTrade} className="text-slate-800 font-bold" />
          </h2>
          <div className="text-right flex-shrink-0">
            <RiskBadge conf={job.conf} />
            <button
              onClick={onAskWhy}
              className="text-[10px] mt-1 text-[#00BDFE] hover:text-[#0099d4] hover:underline font-medium block ml-auto"
            >
              Why is this here?
            </button>
          </div>
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
          <JourneyBar job={job} tags={tags} onAddTag={onAddTag} onRemoveTag={onRemoveTag} />
        </div>

        <CommitmentAnatomy job={job} onSelectTrade={onSelectTrade} />

        {/* Shadow plan — pre-computed backup trade. Shown above the AI log so
            the safety net is visible before the prose. */}
        {job.shadowTrade && (
          <ShadowPlanPill shadow={job.shadowTrade} onSelectTrade={onSelectTrade} />
        )}

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

        {/* Deferred state — shown when this operator deferred the job upward */}
        {activeDeferral && !actionDone && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-amber-800 text-xs font-semibold uppercase tracking-wide">
                Deferred — with {activeDeferral.currentHolder === "aaron" ? "Aaron / National" : activeDeferral.currentHolder} since {activeDeferral.time}
              </p>
              {onRecallRequest && (
                <button
                  onClick={onRecallRequest}
                  className="text-[11px] text-[#0077a8] hover:text-[#00BDFE] hover:underline font-medium flex-shrink-0"
                >
                  ↻ Recall from senior
                </button>
              )}
            </div>
            <p className="text-slate-700 text-xs italic leading-snug">"You: {activeDeferral.reason}"</p>
            {(activeDeferral.escalations ?? []).map((e, i) => (
              <p key={i} className="text-slate-700 text-xs italic leading-snug">"{e.by}: {e.reason}"</p>
            ))}
            <p className="text-slate-500 text-[11px] mt-1">Action returns to you when senior responds — or recall now if you've worked it out.</p>
          </div>
        )}

        {/* Action required — hidden when job has been deferred upward */}
        {job.actionRequired && !actionDone && !activeDeferral && (
          <div className="border-2 border-amber-400 bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500 text-base">⚡</span>
              <p className="text-amber-800 text-sm font-bold">{job.actionRequired}</p>
            </div>
            {job.actionDeadlineMin != null && (
              <div className="mb-3">
                <CountdownPill deadlineMin={job.actionDeadlineMin} autoExecuteOption={job.autoExecuteOption} />
              </div>
            )}
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
            {onDeferRequest && (
              <button
                onClick={onDeferRequest}
                className="text-[11px] text-[#0077a8] hover:text-[#00BDFE] hover:underline font-medium mt-2"
              >
                ↑ Defer to senior
              </button>
            )}
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

export default function FieldView({ persona, tagsByJob, onAddTag, onRemoveTag, modelFeedback, onAddModelFeedback, deferrals, onAddDeferral, onRecallDeferral, onSelectTrade }: {
  persona: string;
  tagsByJob: Record<string, string[]>;
  onAddTag: (jobId: string, tag: string) => void;
  onRemoveTag: (jobId: string, tag: string) => void;
  modelFeedback: ModelFeedback[];
  onAddModelFeedback: (entry: ModelFeedback) => void;
  deferrals: FieldDeferral[];
  onAddDeferral: (entry: FieldDeferral) => void;
  onRecallDeferral: (jobId: string, reason: string) => void;
  onSelectTrade?: (name: string) => void;
}) {
  const config  = FIELD_CONFIG[persona] ?? FIELD_CONFIG.blake;
  const allJobs = sortDecisionFirst(JOBS.filter(j => j.visibleTo.includes(persona)));

  const decisionJobs = allJobs.filter(j => j.actionRequired !== null);
  const regionTotal  = FIELD_REGION_TOTAL[persona] ?? 300;
  const aiHandling   = regionTotal - decisionJobs.length;

  const [filterTab, setFilterTab] = useState<"action" | "browse" | "complete" | "audit">("action");
  const [deferJobTarget, setDeferJobTarget] = useState<Job | null>(null);
  const [recallJobTarget, setRecallJobTarget] = useState<Job | null>(null);

  const submitJobRecall = (reason: string) => {
    if (!recallJobTarget) return;
    onRecallDeferral(recallJobTarget.id, reason);
    setRecallJobTarget(null);
  };

  // AI Audit — silent decisions scoped to this persona's job type.
  const auditDecisions = SILENT_DECISIONS.filter(d => {
    if (persona === "conner") return d.jobType === "AHO Construction";
    if (persona === "blake")  return d.jobType === "Facilities Management";
    return false;
  });

  const findActiveJobDeferral = (jobId: string) =>
    deferrals.find(d => d.jobId === jobId && d.whoId === persona);

  const submitJobDeferral = (reason: string) => {
    if (!deferJobTarget) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    const personaName = persona === "conner" ? "Conner Reilly" : "Blake Henderson";
    const personaRole = persona === "conner" ? "Ops Manager — Construction" : "Ops Manager — FM";
    onAddDeferral({
      task: deferJobTarget.actionRequired ?? `Action on ${deferJobTarget.id}`,
      who: personaName, whoId: persona, role: personaRole,
      time, jobId: deferJobTarget.id,
      urgent: deferJobTarget.priority === "jeopardy" || deferJobTarget.priority === "urgent",
      reason,
      tierPath: [persona, "national", "aaron"],
      currentHolder: "aaron",
    });
    setDeferJobTarget(null);
  };
  const [selectedId, setSelectedId] = useState<string | null>(decisionJobs[0]?.id ?? null);
  // Prefill question fired into the AI bar by the "Why is this here?" button.
  const [aiTrigger, setAiTrigger] = useState<{ text: string; nonce: number } | undefined>(undefined);
  // Reset key forces AskAI to remount with fresh state on Clear or persona change.
  const [aiResetCounter, setAiResetCounter] = useState(0);
  const [aiHasConversation, setAiHasConversation] = useState(false);

  const selectedJob = selectedId ? allJobs.find(j => j.id === selectedId) ?? null : null;

  const filteredJobs = allJobs.filter(j => {
    if (filterTab === "action")   return j.actionRequired !== null;
    if (filterTab === "complete") return j.primeStatus === "Works Complete" || j.primeStatus === "Invoiced";
    return true;
  });

  const decisionCount = decisionJobs.length;

  // AI bar: context shifts to the selected job when one is open
  const aiContext = selectedJob
    ? `${persona === "conner" ? "Conner — Construction / AHO Ops Manager" : "Blake — FM & Home Repair Ops Manager"}. Reviewing: ${selectedJob.id} (${selectedJob.type}), ${selectedJob.suburb}. Priority: ${selectedJob.priority}. Confidence: ${selectedJob.conf.toFixed(2)}. Action required: ${selectedJob.actionRequired ?? "none (AI handling)"}. ${selectedJob.flags.length > 0 ? `Flags: ${selectedJob.flags.map(f => f.detail).join("; ")}.` : ""}`
    : `${persona === "conner" ? "Conner — Construction / AHO Ops Manager" : "Blake — FM & Home Repair Ops Manager"}. ${decisionJobs.length} decisions pending. Region total: ${regionTotal.toLocaleString()} (AI handling ${aiHandling.toLocaleString()} others).`;
  const aiContextLabel = selectedJob ? `Focused on ${selectedJob.id}` : `Watching ${persona === "conner" ? "Construction" : "FM"} queue`;

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
                { key: "browse",   label: "Browse" },
                { key: "complete", label: "Complete" },
                { key: "audit",    label: `AI Audit (${auditDecisions.length})` },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setFilterTab(tab.key)}
                  className={`flex-1 text-[10px] py-1 rounded-md font-semibold transition-colors ${filterTab === tab.key ? "bg-[#00BDFE] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-0 scrollbar-thin relative">
            {filterTab === "audit" ? (
              <AIAuditTab
                decisions={auditDecisions}
                feedback={modelFeedback}
                onAddFeedback={onAddModelFeedback}
                flaggedByName={persona === "conner" ? "Conner Reilly" : "Blake Henderson"}
                flaggedById={persona}
              />
            ) : (
            <div className="space-y-1 px-2 py-2">
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
                const accentBorder = job.priority === "jeopardy" ? "border-l-4 border-l-red-400"
                  : job.priority === "urgent" ? "border-l-4 border-l-amber-400"
                  : "";
                return (
                  <button key={job.id} onClick={() => setSelectedId(isSelected ? null : job.id)}
                    className={`w-full text-left rounded-xl p-3 border bg-white transition-all ${
                      isSelected ? "border-[#00BDFE]" : "border-slate-200 hover:border-slate-300"
                    } ${accentBorder}`}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-slate-800 text-xs font-semibold leading-tight truncate">
                        <TradeLink name={job.trade} onSelectTrade={onSelectTrade} className="text-slate-800 font-semibold" />
                      </p>
                      <RiskBadge conf={job.conf} size="sm" />
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
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <CardTags tags={tagsByJob[job.id] ?? []} />
                      {findActiveJobDeferral(job.id) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium border bg-amber-50 text-amber-700 border-amber-200">
                          ↑ Deferred
                        </span>
                      )}
                      {job.shadowTrade && <ShadowPlanPill shadow={job.shadowTrade} compact />}
                      {job.actionRequired && job.actionDeadlineMin != null && (
                        <CountdownPill deadlineMin={job.actionDeadlineMin} autoExecuteOption={job.autoExecuteOption} compact />
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-slate-300 mt-1">{job.id}</p>
                  </button>
                );
              })}
            </div>
            )}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>

        {/* ── Column 2: Current Focus ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col border-r border-slate-200 min-w-0">
          <div className="px-5 pt-4 pb-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-slate-700 font-semibold text-sm">Current Focus</h2>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
              <JobDetailPanel
                job={selectedJob}
                onClose={() => setSelectedId(null)}
                onAskWhy={() => setAiTrigger({
                  text: `Why is job ${selectedJob.id} in my queue right now? Explain in plain English what happened, what risk it carries, and what I'd typically need to decide.`,
                  nonce: Date.now(),
                })}
                tags={tagsByJob[selectedJob.id] ?? []}
                onAddTag={(t) => onAddTag(selectedJob.id, t)}
                onRemoveTag={(t) => onRemoveTag(selectedJob.id, t)}
                activeDeferral={findActiveJobDeferral(selectedJob.id)}
                onDeferRequest={() => setDeferJobTarget(selectedJob)}
                onRecallRequest={findActiveJobDeferral(selectedJob.id) ? () => setRecallJobTarget(selectedJob) : undefined}
                onSelectTrade={onSelectTrade}
              />
            )}
          </div>

          {/* ── AI Bar: pinned to bottom of column 2 ─────────────────────── */}
          <div className="flex-shrink-0 border-t border-slate-200">
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BDFE] animate-pulse flex-shrink-0" />
              <span className="text-[#00BDFE] text-xs font-semibold">CoreTechX AI</span>
              <span className="text-slate-400 text-[10px] ml-auto truncate hidden lg:block">{aiContextLabel}</span>
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
            <div className="bg-white px-4 pt-2 pb-3">
              <AskAI
                key={`${persona}-${aiResetCounter}`}
                context={aiContext}
                placeholder={selectedJob ? `Ask about ${selectedJob.id}...` : "Ask about your queue..."}
                trigger={aiTrigger}
                onConversationChange={setAiHasConversation}
              />
            </div>
          </div>
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

          </div>
        </div>

      </div>

      {/* Defer-from-job modal */}
      <DeferralReasonModal
        open={deferJobTarget !== null}
        title="Defer to senior"
        itemDescription={deferJobTarget ? `${deferJobTarget.id} · ${deferJobTarget.actionRequired ?? deferJobTarget.customer}` : ""}
        destinationLabel="Going to Aaron / National"
        submitLabel="Defer to senior"
        onSubmit={submitJobDeferral}
        onCancel={() => setDeferJobTarget(null)}
      />

      {/* Recall modal */}
      <DeferralReasonModal
        open={recallJobTarget !== null}
        title="Recall from senior"
        itemDescription={recallJobTarget ? `${recallJobTarget.id} · ${recallJobTarget.actionRequired ?? recallJobTarget.customer}` : ""}
        destinationLabel="Action returns to you"
        submitLabel="Recall"
        chips={RECALL_REASON_CHIPS}
        requireText={false}
        textareaLabel="Add a note"
        textareaPlaceholder="e.g. Trade just rang back and confirmed they're on their way."
        onSubmit={submitJobRecall}
        onCancel={() => setRecallJobTarget(null)}
      />
    </div>
  );
}
