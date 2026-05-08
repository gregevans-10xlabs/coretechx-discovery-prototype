import { useState } from "react";
import { JOBS, type Job } from "../data/jobs";
import JourneyBar from "./JourneyBar";
import CommitmentAnatomy from "./CommitmentAnatomy";
import TradeLink from "./TradeLink";
import ShadowPlanPill from "./ShadowPlanPill";
import CountdownPill from "./CountdownPill";
import TradeChain from "./TradeChain";
import ConfidencePanel from "./ConfidencePanel";
import EquipmentPanel from "./EquipmentPanel";
import ServiceActivityPanel from "./ServiceActivityPanel";
import FinanceSection from "./FinanceSection";
import type { FinancialState } from "../data/finance";
import { MORNING, ALL_DECISIONS, ALL_PATTERNS, JOB_TYPES, TAG_VOCABULARY, MODEL_STATS, type FieldDeferral, type ModelFeedback, riskState, riskBadgeClass } from "../data/scenarios";
import { BUSINESS_OUTCOMES, STRATEGIC_PATTERNS, type BusinessOutcome, type StrategicPattern } from "../data/outcomes";
import { PENDING_CHANGES } from "../data/goals";
import AskAI from "./AskAI";

// ─── Local types ──────────────────────────────────────────────────────────────
type DecisionItem = typeof ALL_DECISIONS[0];
type PatternItem = typeof ALL_PATTERNS[0];

interface BriefingEx {
  kind: "briefing";
  id: string;
  severity: string;
  icon: string;
  msg: string;
  jobRef: string | null;
}
interface DecisionEx {
  kind: "decision";
  id: string;
  severity: string;
  icon: string;
  msg: string;
  conf: number;
}
interface PatternEx {
  kind: "pattern";
  id: string;
  severity: string;
  icon: string;
  msg: string;
}
interface JobTypeEx {
  kind: "jobtype";
  id: string;
  severity: string;
  icon: string;
  msg: string;
  jtLabel: string;
  conf: number;
  trend: string;
  count: number;
}

type ExceptionItem = BriefingEx | DecisionEx | PatternEx | JobTypeEx;

type FocusState =
  | { type: "job"; job: Job }
  | { type: "pattern"; pattern: PatternItem }
  | { type: "decision"; dec: DecisionItem }
  | { type: "jobtype"; jtLabel: string }
  | { type: "briefing"; msg: string; icon: string }
  | { type: "outcome"; outcome: BusinessOutcome }
  | { type: "strategic_pattern"; pattern: StrategicPattern }
  | null;

// ─── Confidence helpers ───────────────────────────────────────────────────────
// cb retained for the few aggregate-view places that still show coloured
// confidence pills. Per-job displays use riskState/riskBadgeClass via
// RiskBadge — see Discovery OS decision 17 Apr 2026 (raw scores not shown
// to operators). cc was dropped when JobTypeHealth left PlatformHealth.
const cb = (s: number) => s >= 0.80 ? "bg-green-100 border-green-300 text-green-700" : s >= 0.60 ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-red-100 border-red-300 text-red-700";

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
    <span className={`inline-flex items-center font-semibold border rounded ${text} ${riskBadgeClass(conf)}`}>
      {riskState(conf)}
    </span>
  );
}

// ─── Build exception queue ────────────────────────────────────────────────────
function buildExceptions(isAaron: boolean): ExceptionItem[] {
  const items: ExceptionItem[] = [];

  MORNING.forEach((m, i) => {
    items.push({
      kind: "briefing",
      id: `briefing-${i}`,
      severity: m.severity,
      icon: m.icon,
      msg: m.msg,
      jobRef: m.jobRef ?? null,
    });
  });

  const decisions = isAaron ? ALL_DECISIONS : ALL_DECISIONS.filter(d => d.region === "National");
  decisions.slice(0, 4).forEach(d => {
    items.push({
      kind: "decision",
      id: d.id,
      severity: d.conf < 0.5 ? "high" : "medium",
      icon: d.autonomyLevel === 1 ? "🔴" : "🟡",
      msg: d.label,
      conf: d.conf,
    });
  });

  ALL_PATTERNS.forEach(p => {
    items.push({
      kind: "pattern",
      id: p.id,
      severity: p.severity,
      icon: p.icon,
      msg: p.title,
    });
  });

  const declining = JOB_TYPES.filter(jt => jt.avgConf < 0.80);
  declining.forEach(jt => {
    items.push({
      kind: "jobtype",
      id: `jt-${jt.id}`,
      severity: jt.avgConf < 0.60 ? "high" : "medium",
      icon: "📉",
      msg: `${jt.label} — confidence ${(jt.avgConf * 100).toFixed(0)}% ${jt.trend}`,
      jtLabel: jt.label,
      conf: jt.avgConf,
      trend: jt.trend,
      count: jt.total,
    });
  });

  return items.sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1));
}

// ─── Exception Queue Card ─────────────────────────────────────────────────────
function ExceptionCard({ item, selected, onClick }: { item: ExceptionItem; selected: boolean; onClick: () => void }) {
  // Card body always white. Severity shown via thin coloured left border so the
  // queue scans cleanly — high severity catches the eye without the rest receding.
  const accentBorder = item.severity === "high" ? "border-l-4 border-l-red-400"
    : item.severity === "medium" ? "border-l-4 border-l-amber-400"
    : "";
  const baseBorder = selected ? "border-[#00BDFE]" : "border-slate-200 hover:border-slate-300";

  const kindLabel: Record<ExceptionItem["kind"], string> = {
    briefing: "Briefing",
    decision: "Decision",
    pattern: "Pattern",
    jobtype: "Job Type",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border bg-white p-3 transition-all cursor-pointer ${baseBorder} ${accentBorder} ${selected ? "shadow-sm" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 leading-snug">{item.msg}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              item.severity === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}>{item.severity}</span>
            <span className="text-[10px] text-slate-400">{kindLabel[item.kind]}</span>
            {item.kind === "decision" && (
              <RiskBadge conf={(item as DecisionEx).conf} size="sm" />
            )}
          </div>
        </div>
        <span className="text-slate-300 text-xs flex-shrink-0">›</span>
      </div>
    </button>
  );
}

// ─── Pattern Detail Panel ─────────────────────────────────────────────────────
function PatternDetailPanel({ pattern, onClose, onSelectTrade }: { pattern: PatternItem; onClose: () => void; onSelectTrade?: (name: string) => void }) {
  const [actioned, setActioned] = useState(false);

  const affectedIds: string[] = (pattern.detail.match(/CG\d{5}/g) ?? []);
  const affectedJobs = JOBS.filter(j => affectedIds.includes(j.id));

  const aiLog: { time: string; msg: string; auto: boolean }[] = pattern.id === "P-041" ? [
    { time: "Mon 09:14", msg: "Sandbar Electrical Services unresponsive — shadow plan activated for CG36110", auto: true },
    { time: "Mon 11:30", msg: "DRC Solar declined CG35978 — no available capacity in zone", auto: true },
    { time: "Tue 08:00", msg: "CG36015 rescheduled — third attempt. Pattern threshold exceeded.", auto: true },
    { time: "Now",       msg: "Coverage gap confirmed. Targeted recruitment required for 2428–2430 postcodes.", auto: false },
  ] : pattern.id === "P-039" ? [
    { time: "Sat 18:00", msg: "CG35954 completed — photo submission window opened (48h)", auto: true },
    { time: "Sun 14:00", msg: "CG36003 completed — photo submission window opened (48h)", auto: true },
    { time: "Mon 07:01", msg: "Auto-reminder sent to York Digital Solutions via Chekku", auto: true },
    { time: "Mon 07:30", msg: "CG36015 completed — 3rd job with 0 photos. Pattern threshold exceeded.", auto: true },
    { time: "Now",       msg: "Escalated to Logan — invoicing blocked on all 3 jobs. Human action required.", auto: false },
  ] : [
    { time: "10 days ago", msg: "Allianz NSW portfolio confidence: 0.81", auto: true },
    { time: "7 days ago",  msg: "Chekku no-match rate rising — 67% of jobs requiring manual procurement", auto: true },
    { time: "5 days ago",  msg: "Confidence dropped to 0.76 — carpenter availability flagged as constraint", auto: true },
    { time: "Now",         msg: "Confidence at 0.71 and declining. 90% Chekku no-match. Escalated to Aaron.", auto: false },
  ];

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{pattern.icon}</span>
            <div>
              <h2 className={`text-base font-bold ${pattern.severity === "high" ? "text-red-700" : "text-amber-700"}`}>{pattern.title}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded">{pattern.type}</span>
                <span className="text-xs text-slate-400">{pattern.affected}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-4">
        <div className={`rounded-xl p-4 border ${pattern.severity === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <p className={`text-sm leading-relaxed ${pattern.severity === "high" ? "text-red-700" : "text-amber-700"}`}>{pattern.detail}</p>
        </div>

        {affectedJobs.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Affected Jobs</p>
            <div className="space-y-2">
              {affectedJobs.map(j => (
                <div key={j.id} className={`rounded-lg border p-3 text-xs ${
                  j.priority === "jeopardy" ? "bg-red-50 border-red-200" : j.priority === "urgent" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">
                      <TradeLink name={j.trade} onSelectTrade={onSelectTrade} className="text-slate-700 font-semibold" />
                    </span>
                    <span className="font-mono text-slate-300 text-[10px]">{j.id}</span>
                  </div>
                  <p className="text-slate-500">{j.suburb} · {j.primeStatus}</p>
                  {j.flags[0] && <p className="text-amber-700 mt-1">⚠ {j.flags[0].detail}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">AI Activity Log</p>
          <div className="space-y-1.5">
            {aiLog.map((entry, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs ${
                !entry.auto ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50 border border-slate-200"
              }`}>
                <span className={`mt-0.5 flex-shrink-0 ${entry.auto ? "text-[#00BDFE]" : "text-amber-500"}`}>{entry.auto ? "●" : "!"}</span>
                <div className="flex-1">
                  <p className={entry.auto ? "text-slate-600" : "text-amber-700 font-semibold"}>{entry.msg}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-1">
          {!actioned ? (
            <button onClick={() => setActioned(true)}
              className={`w-full text-sm px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                pattern.severity === "high" ? "bg-[#00BDFE] hover:bg-[#009fd6] text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}>
              {pattern.action}
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <p className="text-green-700 text-sm font-semibold">Action logged to audit trail</p>
                <p className="text-green-600 text-xs mt-0.5">Immutably recorded</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Decision Detail Panel ────────────────────────────────────────────────────
function DecisionDetailPanel({ dec, onClose }: { dec: DecisionItem; onClose: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RiskBadge conf={dec.conf} />
              <span className="text-xs text-slate-400">{dec.type} · {dec.region}</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">{dec.label}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">AI Recommendation</p>
          <p className="text-sm text-amber-800 leading-relaxed">{dec.rec}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
          <p><span className="font-semibold">Urgency:</span> {dec.urgency}</p>
          <p className="mt-1"><span className="font-semibold">Age:</span> {dec.age}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Choose an action</p>
          {!chosen ? (
            <div className="space-y-2">
              {dec.options.map((opt, i) => (
                <button key={i} onClick={() => setChosen(opt)}
                  className={`w-full text-left text-sm px-4 py-2.5 rounded-lg font-medium border transition-colors ${
                    i === 0 ? "bg-[#00BDFE] text-white border-[#00BDFE] hover:bg-[#009fd6]"
                    : i === dec.options.length - 1 ? "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <p className="text-green-700 text-sm font-semibold">"{chosen}" — logged to audit trail</p>
                <p className="text-green-600 text-xs mt-0.5">Immutably recorded · {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>
        <div className="font-mono text-[10px] text-slate-300 pt-2">{dec.id}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Job Type Detail Panel ────────────────────────────────────────────────────
function JobTypeDetailPanel({ jtLabel, onClose, tagsByJob, onSelectTrade }: { jtLabel: string; onClose: () => void; tagsByJob: Record<string, string[]>; onSelectTrade?: (name: string) => void }) {
  const jobs = JOBS.filter(j => j.type === jtLabel);
  const jt = JOB_TYPES.find(j => j.label === jtLabel);
  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">{jtLabel}</h2>
            {jt && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${cb(jt.avgConf)}`}>{(jt.avgConf * 100).toFixed(0)}% avg confidence</span>
                <span className="text-xs text-slate-400">{jt.trend} · {jt.total} total</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-3">
        {jt && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "At Risk", value: jt.atRisk, color: "text-amber-600" },
              { label: "Critical", value: jt.critical, color: "text-red-600" },
              { label: "Decisions", value: jt.needsDecision, color: "text-[#00BDFE]" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No active jobs in this dataset for {jtLabel}</p>
        ) : jobs.map(j => (
          <div key={j.id} className={`rounded-xl border p-3 text-xs ${
            j.priority === "jeopardy" ? "bg-red-50 border-red-200" : j.priority === "urgent" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">
                <TradeLink name={j.trade} onSelectTrade={onSelectTrade} className="text-slate-700 font-semibold" />
              </span>
              <RiskBadge conf={j.conf} size="sm" />
            </div>
            <p className="text-slate-500">{j.suburb} · {j.primeStatus}</p>
            {j.flags[0] && <p className="text-amber-700 mt-1">⚠ {j.flags[0].detail}</p>}
            <CardTags tags={tagsByJob[j.id] ?? []} />
            <p className="font-mono text-slate-300 text-[10px] mt-1">{j.id}</p>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({ job, onClose, onAskWhy, tags, onAddTag, onRemoveTag, onSelectTrade }: { job: Job; onClose: () => void; onAskWhy: () => void; tags: string[]; onAddTag?: (tag: string) => void; onRemoveTag?: (tag: string) => void; onSelectTrade?: (name: string) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RiskBadge conf={job.conf} />
              {!job.riskNarrative && (
                <button
                  onClick={onAskWhy}
                  className="text-[11px] text-[#00BDFE] hover:text-[#0099d4] hover:underline font-medium"
                >
                  Why is this here?
                </button>
              )}
              <span className="text-xs text-slate-400">{job.type}</span>
              {job.priority === "jeopardy" && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">JEOPARDY</span>}
              {job.priority === "urgent" && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>}
            </div>
            <h2 className="text-base font-bold text-slate-800">{job.customer}</h2>
            <p className="text-slate-500 text-xs">{job.suburb} {job.state} · <TradeLink name={job.trade} onSelectTrade={onSelectTrade} className="text-slate-500" /></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-4">
        {/* Confidence panel — narrative + signal breakdown for modelled jobs */}
        {(job.riskNarrative || job.confidenceBreakdown) && (
          <ConfidencePanel
            narrative={job.riskNarrative}
            breakdown={job.confidenceBreakdown}
            conf={job.conf}
            onAskFollowUp={onAskWhy}
          />
        )}
        {/* Trade Chain — multi-trade jobs only. */}
        {job.tradeActors && job.tradeActors.length > 1 && (
          <TradeChain actors={job.tradeActors} onSelectTrade={onSelectTrade} />
        )}

        {/* Equipment — 4th actor */}
        {job.equipment && job.equipment.length > 0 && (
          <EquipmentPanel items={job.equipment} />
        )}

        {/* Service activity — Hubspot tickets attached to this job */}
        <ServiceActivityPanel jobId={job.id} />

        {/* Financial state */}
        {job.financial && (
          <FinanceSection jobValue={job.value} financial={job.financial as FinancialState} />
        )}

        {/* Journey */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Journey</p>
          <JourneyBar job={job} size="compact" tags={tags} onAddTag={onAddTag} onRemoveTag={onRemoveTag} />
        </div>

        <div>
          <CommitmentAnatomy job={job} onSelectTrade={onSelectTrade} />
        </div>

        {/* Flags */}
        {job.flags.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Flags</p>
            <div className="space-y-1.5">
              {job.flags.map((f, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 text-xs border ${
                  f.severity === "high" ? "bg-red-50 border-red-200 text-red-700" :
                  f.severity === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" :
                  "bg-slate-50 border-slate-200 text-slate-600"
                }`}>⚠ {f.detail}</div>
              ))}
            </div>
          </div>
        )}

        {/* Shadow plan — pre-computed backup trade. */}
        {job.shadowTrade && (
          <ShadowPlanPill shadow={job.shadowTrade} onSelectTrade={onSelectTrade} />
        )}

        {/* AI Log */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">AI Activity Log</p>
          <div className="space-y-1.5">
            {job.aiLog.map((entry, i) => {
              const isAction = i === job.aiLog.length - 1 && !!job.actionRequired;
              return (
                <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs ${
                  isAction ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50 border border-slate-200"
                }`}>
                  <span className={`mt-0.5 flex-shrink-0 ${isAction ? "text-amber-500" : "text-[#00BDFE]"}`}>{isAction ? "!" : "●"}</span>
                  <div className="flex-1">
                    <p className={isAction ? "text-amber-700 font-semibold" : "text-slate-600"}>{entry.msg}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{entry.time} · {entry.actor === "ai" ? "AI" : "Human"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Required */}
        {job.actionRequired && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
            <p className="text-amber-700 text-xs font-semibold mb-1">Action Required</p>
            <p className="text-amber-800 text-sm font-bold">{job.actionRequired}</p>
          </div>
        )}

        {/* Auto-execute countdown — sits above the action buttons so executives
            see what AI will do if no operator overrides. */}
        {job.actionRequired && job.actionDeadlineMin != null && (
          <CountdownPill deadlineMin={job.actionDeadlineMin} autoExecuteOption={job.autoExecuteOption} />
        )}

        {/* Buttons */}
        {!chosen ? (
          <div className="space-y-2 pt-1">
            {job.actionOptions.length > 0 ? job.actionOptions.map((opt, i) => (
              <button key={i} onClick={() => setChosen(opt)}
                className={`w-full text-left text-sm px-4 py-2.5 rounded-lg font-medium border transition-colors ${
                  i === 0 ? "bg-[#00BDFE] text-white border-[#00BDFE] hover:bg-[#009fd6]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}>
                {opt}
              </button>
            )) : (
              <button onClick={() => setChosen("reviewed")} className="w-full bg-[#00BDFE] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#009fd6] transition-colors">
                Mark reviewed
              </button>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="text-green-700 text-sm font-semibold">"{chosen}" — logged to audit trail</p>
              <p className="text-green-600 text-xs mt-0.5">Immutably recorded · {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Briefing Detail Panel ────────────────────────────────────────────────────
function BriefingDetailPanel({ msg, icon, onClose }: { msg: string; icon: string; onClose: () => void }) {
  const [actioned, setActioned] = useState(false);
  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 className="text-base font-bold text-amber-700">Unallocated Job — Action Required</h2>
              <p className="text-slate-400 text-xs mt-0.5">No trade assigned · Window approaching</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 text-sm leading-relaxed">{msg}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">AI Activity Log</p>
          <div className="space-y-1.5">
            {[
              { time: "Yesterday 16:00", msg: "CG36003 intake received — Starlink Install, Fern Bay NSW", auto: true },
              { time: "Yesterday 16:01", msg: "Auto-qualified: Starlink standard scope confirmed", auto: true },
              { time: "Yesterday 16:02", msg: "Trade matching: 4 candidates in zone. York Digital Solutions top match (4.1 stars)", auto: true },
              { time: "Yesterday 16:05", msg: "York Digital Solutions offered job via Chekku — no response after 2h", auto: true },
              { time: "Yesterday 18:30", msg: "Second offer sent to Compulance Computer Services — declined (capacity)", auto: true },
              { time: "Today 07:00",     msg: "Shadow plan activated — no confirmed trade. 26h to window.", auto: true },
              { time: "Now",             msg: "Escalated to Logan — manual procurement required", auto: false },
            ].map((entry, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs ${
                !entry.auto ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50 border border-slate-200"
              }`}>
                <span className={`mt-0.5 flex-shrink-0 ${entry.auto ? "text-[#00BDFE]" : "text-amber-500"}`}>{entry.auto ? "●" : "!"}</span>
                <div className="flex-1">
                  <p className={entry.auto ? "text-slate-600" : "text-amber-700 font-semibold"}>{entry.msg}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {!actioned ? (
          <div className="space-y-2 pt-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Action Required</p>
            <button onClick={() => setActioned(true)} className="w-full bg-[#00BDFE] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#009fd6] transition-colors">Call York Digital Solutions directly</button>
            <button className="w-full border border-slate-300 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">Expand trade search radius</button>
            <button className="w-full border border-slate-300 text-slate-500 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">Log and escalate to National</button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="text-green-700 text-sm font-semibold">Action logged to audit trail</p>
              <p className="text-green-600 text-xs mt-0.5">Immutably recorded · {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Business Outcomes — Aaron's outcomes-led PortfolioView (Column 1 + 2) ──
// Per Pending Changes Item [1]: PortfolioView leads with business outcomes
// (revenue, margin, work orders, capacity, KPI/lifecycle, satisfaction,
// safety, compliance) rather than operational/platform health. Phase 1
// outcomes are demonstrable from current data; Phase 2 outcomes are honestly
// framed as pending production instrumentation rather than faking numbers.

const OUTCOME_ICON: Record<string, string> = {
  revenue:       "$",
  cashflow:      "↻",
  work_orders:   "✓",
  margin:        "△",
  capacity:      "▭",
  kpi:           "◷",
  satisfaction:  "♡",
  safety:        "⛨",
  compliance:    "✓",
};

// ─── OutcomesScoreboard — top-of-page strip on PortfolioView ───────────────
// Per Aaron's feedback: business outcomes deserve top prominence, not "below
// the fold in column 1." The scoreboard sits above the 3-column working area,
// always visible. Each card is clickable and opens the full OutcomeDetailPanel
// in column 2. Phase 2 cards visibly muted with "P2" tag rather than mocked.
function OutcomeScoreCard({ outcome, selected, onClick }: { outcome: BusinessOutcome; selected: boolean; onClick: () => void }) {
  const isPhase2 = outcome.phase === "phase_2";
  const trendArrow = outcome.trend?.direction === "up" ? "↑" : outcome.trend?.direction === "down" ? "↓" : "→";
  const trendColor = !outcome.trend ? "text-slate-400" : outcome.trend.good ? "text-green-600" : "text-amber-600";
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-2.5 transition-all ${
        selected
          ? "border-[#00BDFE] shadow-sm bg-[#e0f7ff]/40"
          : isPhase2
          ? "border-slate-200 bg-slate-50 hover:border-slate-300"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="w-4 h-4 rounded bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{OUTCOME_ICON[outcome.category] ?? "•"}</span>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 truncate flex-1">{outcome.title}</p>
        {isPhase2 && (
          <span className="text-[8px] px-1 py-0 rounded font-semibold border bg-slate-100 text-slate-500 border-slate-200 flex-shrink-0">P2</span>
        )}
      </div>
      <p className={`text-xl font-bold leading-tight ${isPhase2 ? "text-slate-300" : "text-slate-800"}`}>{outcome.primaryValue}</p>
      <p className="text-[10px] text-slate-400 leading-tight truncate">{outcome.primaryLabel}</p>
      {outcome.trend && (
        <p className={`text-[10px] mt-1 leading-tight truncate ${trendColor}`}>
          <span className="font-semibold">{trendArrow}</span> {outcome.trend.detail}
        </p>
      )}
    </button>
  );
}

function OutcomesScoreboard({ outcomes, focusedId, onSelect }: {
  outcomes: BusinessOutcome[];
  focusedId: string | null;
  onSelect: (outcome: BusinessOutcome) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Today's Business</p>
        <p className="text-[10px] text-slate-400">Click any card to drill down</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {outcomes.map(o => (
          <OutcomeScoreCard
            key={o.id}
            outcome={o}
            selected={focusedId === o.id}
            onClick={() => onSelect(o)}
          />
        ))}
      </div>
    </div>
  );
}

function OutcomeDetailPanel({ outcome, onClose }: { outcome: BusinessOutcome; onClose: () => void }) {
  const isPhase2 = outcome.phase === "phase_2";
  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Business Outcome</p>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">{outcome.title}</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <p className={`text-3xl font-black ${isPhase2 ? "text-slate-300" : "text-slate-800"}`}>{outcome.primaryValue}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{outcome.primaryLabel}</p>
            </div>
            {outcome.trend && (
              <p className={`text-xs mt-1 font-medium ${outcome.trend.good ? "text-green-600" : "text-amber-600"}`}>
                {outcome.trend.direction === "up" ? "↑" : outcome.trend.direction === "down" ? "↓" : "→"} {outcome.trend.detail}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-4 max-w-3xl mx-auto w-full">

        {/* Phase 2 honest framing */}
        {isPhase2 && outcome.phase2Note && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Phase 2 — instrumentation pending</p>
            <p className="text-xs text-slate-600 leading-snug">{outcome.phase2Note}</p>
          </div>
        )}

        {/* Secondary stats */}
        {outcome.secondary && outcome.secondary.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {outcome.secondary.map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className={`text-base font-bold mt-1 ${isPhase2 ? "text-slate-300" : "text-slate-800"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Breakdowns */}
        {outcome.breakdownByDepartment && (
          <BreakdownTable title="By Department" rows={outcome.breakdownByDepartment} />
        )}
        {outcome.breakdownByClient && (
          <BreakdownTable title="By Client" rows={outcome.breakdownByClient} />
        )}
        {outcome.breakdownByRegion && (
          <BreakdownTable title="By Region" rows={outcome.breakdownByRegion} />
        )}

        {/* Drill-down hint */}
        {outcome.drillDown && (
          <div className="bg-[#e0f7ff]/40 border border-[#00BDFE]/20 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#0077a8] mb-1">Drill-down</p>
            <p className="text-xs text-slate-700 leading-snug">{outcome.drillDown}</p>
          </div>
        )}

        {/* Phase 2 caveat at bottom for outcomes that have it but show data */}
        {!isPhase2 && outcome.phase2Note && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-500 italic leading-snug">
            <span className="font-semibold not-italic">Note:</span> {outcome.phase2Note}
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: { label: string; value: string; pct?: number }[] }) {
  return (
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
      <div className="border border-slate-200 rounded-lg bg-white">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center gap-3 px-3 py-2 text-xs ${i < rows.length - 1 ? "border-b border-slate-100" : ""}`}>
            <span className="text-slate-700 flex-1 truncate">{r.label}</span>
            {r.pct != null && (
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#00BDFE]/70 rounded-full" style={{ width: `${Math.min(r.pct, 100)}%` }} />
              </div>
            )}
            <span className="text-slate-800 font-semibold tabular-nums flex-shrink-0">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Strategic Patterns (Item [2]) ──────────────────────────────────────────
// Distinct from operational patterns Logan sees — these aggregate across
// departments / clients / regions / workflows / time and surface concerns
// at the executive tier with AI-recommended action.

const STRATEGIC_CATEGORY_LABEL: Record<string, string> = {
  department_kpi:      "Department KPI",
  client_margin:       "Client margin",
  region_quality:      "Region quality",
  workflow_bottleneck: "Workflow bottleneck",
  capacity:            "Capacity",
  revenue_forecast:    "Revenue forecast",
  satisfaction:        "Satisfaction",
  compliance:          "Compliance",
  lifecycle:           "Lifecycle",
};

function StrategicPatternCard({ pattern, selected, onClick }: { pattern: StrategicPattern; selected: boolean; onClick: () => void }) {
  const sevColor = pattern.severity === "high" ? "border-l-red-400" : pattern.severity === "medium" ? "border-l-amber-400" : "border-l-slate-300";
  const sevPill = pattern.severity === "high" ? "bg-red-100 text-red-700 border-red-300" : pattern.severity === "medium" ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border bg-white p-3 border-l-4 transition-all ${sevColor} ${
        selected ? "border-[#00BDFE] shadow-sm" : "border-y-slate-200 border-r-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">Strategic</span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{STRATEGIC_CATEGORY_LABEL[pattern.category]}</span>
        <span className={`text-[9px] uppercase tracking-wider font-bold border px-1.5 py-0.5 rounded ${sevPill}`}>{pattern.severity}</span>
      </div>
      <p className="text-xs font-semibold text-slate-700 leading-snug">{pattern.title}</p>
      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{pattern.scope}</p>
    </button>
  );
}

function StrategicPatternDetail({ pattern, onClose }: { pattern: StrategicPattern; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col animate-fadeIn">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">Strategic Pattern</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{STRATEGIC_CATEGORY_LABEL[pattern.category]}</span>
              <span className={`text-[10px] uppercase tracking-wider font-bold border px-2 py-0.5 rounded ${pattern.severity === "high" ? "bg-red-100 text-red-700 border-red-300" : pattern.severity === "medium" ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{pattern.severity}</span>
              {pattern.phase === "phase_2" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-slate-100 text-slate-500 border-slate-200">Phase 2 data</span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800 leading-snug">{pattern.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0">✕ close</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin space-y-4 max-w-3xl mx-auto w-full">

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Scope</p>
            <p className="text-xs text-slate-700 mt-1 leading-snug">{pattern.scope}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Trend</p>
            <p className="text-xs text-slate-700 mt-1 leading-snug">{pattern.trend}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Context</p>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-700 leading-snug">{pattern.context}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">AI-recommended action</p>
          <div className="bg-[#e0f7ff]/40 border border-[#00BDFE]/30 rounded-lg p-3">
            <p className="text-sm text-slate-700 leading-snug">{pattern.aiRecommendedAction}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Supporting data</p>
          <div className="border border-slate-200 rounded-lg bg-white">
            {pattern.supportingData.map((d, i) => (
              <div key={i} className={`grid grid-cols-3 gap-3 px-3 py-2 text-xs ${i < pattern.supportingData.length - 1 ? "border-b border-slate-100" : ""}`}>
                <span className="text-slate-600">{d.metric}</span>
                <span className="text-slate-800 font-semibold tabular-nums">{d.current}</span>
                <span className="text-slate-400 italic">{d.historical}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Health (Column 3) — CEO-focused ────────────────────────────────
// Per Aaron's feedback: column 3 was carrying low-level operational detail
// (recent settlement activity, individual equipment items, full team
// deferrals, per-supervisor scores) that doesn't belong on a CEO surface.
// Trimmed to: platform automation top-line, items awaiting THIS persona's
// authority, AI improvement signal, workflow configuration entry. Settlement
// and Equipment health panels are removed — their aggregate signal is
// covered by the outcome scoreboard at the top of the page; their per-job
// detail belongs in CockpitView/FieldView for the people who actually act
// on those items.
function PlatformHealth({ persona, isAaron, onWorkflowConfig, deferrals, modelFeedback }: { persona: string; isAaron: boolean; onWorkflowConfig?: () => void; deferrals: FieldDeferral[]; modelFeedback: ModelFeedback[] }) {
  // Items awaiting this persona's authority — config drafts routed to them
  // plus operational deferrals currently held with them. The actionable
  // queue, not the entire roll-up.
  const pendingForMe = PENDING_CHANGES.filter(c => c.routedTo === persona);
  const deferralsForMe = deferrals.filter(d => d.currentHolder === persona);
  const authorityCount = pendingForMe.length + deferralsForMe.length;

  // AI improvement — single compact signal, not a per-model breakdown
  const totalFlags7d = MODEL_STATS.reduce((a, m) => a + m.flagsLast7d, 0);
  const totalRetrains30d = MODEL_STATS.reduce((a, m) => a + m.retrainsLast30d, 0);
  const sessionFlags = modelFeedback.filter(f => f.isFlag).length;
  const queuedRetrains = MODEL_STATS.filter(m => m.lastRetrainDays === null).length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">

      {/* Platform Automation top-line — kept as the headline platform efficacy
          metric. Slightly smaller than before; the scoreboard at the top of
          the page now carries the broader business-outcome story. */}
      <div className="bg-gradient-to-br from-[#00BDFE]/10 to-[#00BDFE]/5 border border-[#00BDFE]/30 rounded-xl p-4">
        <p className="text-xs font-semibold text-[#00BDFE] uppercase tracking-wider mb-1">Platform Automation</p>
        <p className="text-3xl font-black text-[#00BDFE]">96%</p>
        <p className="text-xs text-slate-500 mt-1">of all job actions taken by AI today</p>
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#00BDFE] rounded-full" style={{ width: "96%" }} />
        </div>
      </div>

      {/* Awaiting your authority — drafts + deferrals routed to this persona.
          Replaces the previous full team-deferrals roll-up with just the
          actionable subset. CEO-actionable, not operational reference. */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Awaiting Your Authority</p>
          {authorityCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">{authorityCount}</span>
          )}
        </div>
        {authorityCount === 0 ? (
          <p className="text-slate-400 text-xs italic px-1">Nothing waiting on you.</p>
        ) : (
          <div className="space-y-1.5">
            {pendingForMe.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 border-l-4 border-l-amber-400 rounded-lg p-2.5 text-xs">
                <p className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 mb-1">Configuration draft</p>
                <p className="text-slate-700 font-semibold leading-snug">{c.target}</p>
                <p className="text-slate-500 text-[10px] mt-1 leading-snug">
                  <span className="text-slate-400">{c.before}</span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className="text-slate-700 font-medium">{c.after}</span>
                </p>
                <p className="text-slate-400 text-[10px] mt-1">By {c.draftedBy} · {c.draftedAt}</p>
              </div>
            ))}
            {deferralsForMe.map((d, i) => (
              <div key={`def-${i}`} className="bg-white border border-slate-200 border-l-4 border-l-orange-400 rounded-lg p-2.5 text-xs">
                <p className="text-[9px] uppercase tracking-wider font-semibold text-orange-700 mb-1">Operational deferral</p>
                <p className="text-slate-700 font-semibold leading-snug">{d.task}</p>
                <p className="text-slate-500 text-[10px] mt-1 leading-snug italic">"{d.who.split(" ")[0]}: {d.reason}"</p>
                <p className="text-slate-400 text-[10px] mt-1">{d.jobId} · since {d.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Improvement — single compact signal that "AI is getting better".
          Was previously a per-model breakdown with per-step flag counts;
          that level of detail belongs in CockpitView's AI Audit tab, not on
          a CEO surface. */}
      <div>
        <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">AI Improvement</p>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold text-slate-800">{totalFlags7d + sessionFlags}</p>
              <p className="text-[10px] text-slate-400 leading-tight">Flags / 7d</p>
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{totalRetrains30d}</p>
              <p className="text-[10px] text-slate-400 leading-tight">Retrains / 30d</p>
            </div>
            <div>
              <p className={`text-base font-bold ${queuedRetrains > 0 ? "text-amber-600" : "text-green-600"}`}>{queuedRetrains}</p>
              <p className="text-[10px] text-slate-400 leading-tight">Queued</p>
            </div>
          </div>
          <p className="text-slate-400 text-[10px] mt-2 leading-snug">Operator flags from AI Audit feed each model's training queue. Auto-retrain triggers when patterns shift.</p>
        </div>
      </div>

      {/* Workflow configuration entry — preserved. Aaron is the Authoriser. */}
      <div className={`rounded-xl border p-3 ${isAaron ? "bg-[#e0f7ff] border-[#00BDFE]/40" : "bg-white border-slate-200"}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <p className="text-slate-800 text-xs font-semibold">Workflow Configuration</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Goals, commitments, autonomy levels. Audit-logged.</p>
          </div>
          {onWorkflowConfig && (
            <button
              onClick={onWorkflowConfig}
              className={`text-xs underline flex-shrink-0 ${isAaron ? "text-[#0099d4] hover:text-[#00BDFE]" : "text-slate-400 hover:text-slate-600"}`}
            >
              {isAaron ? "Configure →" : "View →"}
            </button>
          )}
        </div>
        {isAaron
          ? <p className="text-green-600 text-[10px]">Authoriser tier — full configuration access.</p>
          : <p className="text-slate-400 text-[10px]">Reviewer tier — publish low-risk, route high-risk to Aaron.</p>
        }
      </div>

      {isAaron && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Reporting Line</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Aaron Aitken — CEO, Circl</p>
            <p className="pl-3 border-l-2 border-slate-200">Alex Retzlaff — CTO, Unify Ventures</p>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── PortfolioView ────────────────────────────────────────────────────────────
export default function PortfolioView({ persona, onWorkflowConfig, tagsByJob, onAddTag, onRemoveTag, deferrals, modelFeedback, onSelectTrade }: {
  persona: string;
  onWorkflowConfig?: () => void;
  tagsByJob: Record<string, string[]>;
  onAddTag: (jobId: string, tag: string) => void;
  onRemoveTag: (jobId: string, tag: string) => void;
  deferrals: FieldDeferral[];
  modelFeedback: ModelFeedback[];
  onSelectTrade?: (name: string) => void;
}) {
  const isAaron = persona === "aaron";
  const exceptions = buildExceptions(isAaron);
  const [focus, setFocus] = useState<FocusState>(null);
  // Column-1 tab: Patterns (default) vs Exceptions. Business outcomes moved
  // out of column 1 entirely and now live in the OutcomesScoreboard strip
  // at the top of the view (per Aaron's feedback round 2 — outcomes deserve
  // top prominence, not below-the-fold-in-a-column).
  const [columnTab, setColumnTab] = useState<"patterns" | "exceptions">("patterns");
  const [filter, setFilter] = useState<"all" | "high" | "decisions" | "patterns">("all");
  // Prefill question fired into the AI bar by the "Why is this here?" button.
  const [aiTrigger, setAiTrigger] = useState<{ text: string; nonce: number } | undefined>(undefined);
  // Reset key forces AskAI to remount with fresh state on Clear or persona change.
  const [aiResetCounter, setAiResetCounter] = useState(0);
  const [aiHasConversation, setAiHasConversation] = useState(false);

  const filtered = exceptions.filter(e => {
    if (filter === "high") return e.severity === "high";
    if (filter === "decisions") return e.kind === "decision";
    if (filter === "patterns") return e.kind === "pattern";
    return true;
  });

  const handleClick = (e: ExceptionItem) => {
    if (e.kind === "briefing") {
      const item = e as BriefingEx;
      if (item.jobRef && !item.jobRef.startsWith("PATTERN:")) {
        const job = JOBS.find(j => j.id === item.jobRef);
        if (job) { setFocus({ type: "job", job }); return; }
      }
      if (item.jobRef?.startsWith("PATTERN:")) {
        const p = ALL_PATTERNS.find(p => p.id === "P-039");
        if (p) { setFocus({ type: "pattern", pattern: p }); return; }
      }
      setFocus({ type: "briefing", msg: item.msg, icon: item.icon });
    } else if (e.kind === "decision") {
      const dec = ALL_DECISIONS.find(d => d.id === e.id);
      if (dec) setFocus({ type: "decision", dec });
    } else if (e.kind === "pattern") {
      const p = ALL_PATTERNS.find(p => p.id === e.id);
      if (p) setFocus({ type: "pattern", pattern: p });
    } else if (e.kind === "jobtype") {
      const item = e as JobTypeEx;
      setFocus({ type: "jobtype", jtLabel: item.jtLabel });
    }
  };

  const isSelected = (e: ExceptionItem): boolean => {
    if (!focus) return false;
    if (focus.type === "job" && e.kind === "briefing") return (e as BriefingEx).jobRef === focus.job.id;
    if (focus.type === "pattern" && e.kind === "pattern") return e.id === focus.pattern.id;
    if (focus.type === "decision" && e.kind === "decision") return e.id === focus.dec.id;
    if (focus.type === "jobtype" && e.kind === "jobtype") return (e as JobTypeEx).jtLabel === focus.jtLabel;
    if (focus.type === "briefing" && e.kind === "briefing") return (e as BriefingEx).jobRef === null;
    return false;
  };

  const highCount = exceptions.filter(e => e.severity === "high").length;

  // Portfolio-level summary block — appended to every AI context so synthesis
  // questions ("which job type is declining most?", "where am I exposed?") work
  // without needing the AI to traverse separate data calls.
  const jobTypeBlock = JOB_TYPES.map(jt =>
    `- ${jt.label}: ${jt.total} active · avg conf ${(jt.avgConf*100).toFixed(0)}% · trend ${jt.trend} · ${jt.atRisk} at risk · ${jt.critical} critical · ${jt.needsDecision} need decision`
  ).join("\n");
  const patternBlock = ALL_PATTERNS.map(p =>
    `- ${p.id} (${p.severity}) · ${p.title} · affects ${p.affected} · suggested action: ${p.action}`
  ).join("\n");
  const decisionBlock = ALL_DECISIONS.map(d =>
    `- ${d.id} (autonomy L${d.autonomyLevel}) · ${d.type} · ${d.label} · AI recommends: ${d.rec}`
  ).join("\n");
  const portfolioBlock = `\nJob type health:\n${jobTypeBlock}\n\nActive AI-detected patterns:\n${patternBlock}\n\nDecisions awaiting human:\n${decisionBlock}`;

  // AI bar: context tracks the current focus item, but the portfolio block is
  // always appended so platform-level questions can be answered.
  const aiContext = (focus?.type === "job"
    ? `${isAaron ? "Aaron (CEO)" : "National Operations"} reviewing job ${focus.job.id} — ${focus.job.type}, ${focus.job.suburb}. Priority: ${focus.job.priority}. Confidence: ${focus.job.conf.toFixed(2)}. Action: ${focus.job.actionRequired ?? "AI handling"}.`
    : focus?.type === "pattern"
    ? `${isAaron ? "Aaron" : "National"} reviewing AI-detected pattern ${focus.pattern.id}: "${focus.pattern.title}". Severity: ${focus.pattern.severity}. ${focus.pattern.detail}`
    : focus?.type === "decision"
    ? `${isAaron ? "Aaron" : "National"} reviewing decision ${focus.dec.id}: ${focus.dec.label}. AI recommendation: ${focus.dec.rec}.`
    : focus?.type === "outcome"
    ? `${isAaron ? "Aaron" : "National"} reviewing business outcome "${focus.outcome.title}" — ${focus.outcome.primaryValue} ${focus.outcome.primaryLabel}.${focus.outcome.trend ? ` Trend: ${focus.outcome.trend.detail}.` : ""}${focus.outcome.phase === "phase_2" ? " Phase 2 outcome — instrumentation pending." : ""}`
    : focus?.type === "strategic_pattern"
    ? `${isAaron ? "Aaron" : "National"} reviewing strategic pattern ${focus.pattern.id}: "${focus.pattern.title}". Severity: ${focus.pattern.severity}. ${focus.pattern.context} AI recommendation: ${focus.pattern.aiRecommendedAction}`
    : `${isAaron ? "Aaron (CEO/Founder)" : "National Operations"} — portfolio view. ${exceptions.filter(e => e.kind === "decision").length} decisions pending, ${exceptions.filter(e => e.kind === "pattern").length} AI patterns detected, ${exceptions.filter(e => e.severity === "high").length} high-severity items.${isAaron ? " Has workflow configuration access." : ""}`)
    + portfolioBlock;

  // Suggestion chips — Aaron/National operate at portfolio level, so chips ask
  // synthesis questions (where's the exposure, what's slipping, what needs my
  // attention), not job-level lookups. Aaron's first chip is the
  // workflow-config angle since he's the only one who can adjust autonomy.
  const aiSuggestions = isAaron
    ? [
        { label: "Where should I focus?", question: "I have limited time today. Looking across the platform — which 1 or 2 things would most benefit from my attention right now? Be direct about the trade-offs." },
        { label: "What's slipping?", question: "Which job type or AI workflow step is showing the most concerning trend, and what's driving the decline? Use the data you can see." },
        { label: "Anything I should sign off?", question: "Are there workflow autonomy changes you'd recommend I review — promotions where the data justifies it, or demotions I should make permanent? Walk me through the case." },
      ]
    : [
        { label: "What's exposed today?", question: "Across all regions, where is the platform most exposed today — which decisions, patterns, or jobs need senior eyes? Prioritise by risk." },
        { label: "What's slipping?", question: "Which job type or region is showing the most concerning trend, and what's driving the decline?" },
        { label: "How are we tracking this week?", question: "Give me a frank read on platform health this week. What's healthy, what's slipping, where's the biggest exposure?" },
      ];
  const aiContextLabel = focus?.type === "job"
    ? `Focused on ${focus.job.id}`
    : focus?.type === "pattern"
    ? `Pattern ${focus.pattern.id}`
    : focus?.type === "decision"
    ? `Decision ${focus.dec.id}`
    : focus?.type === "outcome"
    ? `Outcome: ${focus.outcome.title}`
    : focus?.type === "strategic_pattern"
    ? `Strategic: ${focus.pattern.id}`
    : "Watching portfolio";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {isAaron && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
          <span className="text-green-500">✓</span>
          <p className="text-green-700 text-xs font-semibold">Workflow configuration access enabled — Aaron Aitken</p>
        </div>
      )}

      {/* Outcomes scoreboard — top of view, full-width strip. Aaron's "today's
          business" view is the first thing he sees. Click any card to open
          the OutcomeDetailPanel in column 2. */}
      <div className="mx-4 mt-4 flex-shrink-0">
        <OutcomesScoreboard
          outcomes={BUSINESS_OUTCOMES}
          focusedId={focus?.type === "outcome" ? focus.outcome.id : null}
          onSelect={(o) => setFocus({ type: "outcome", outcome: o })}
        />
      </div>

      <div className="flex-1 flex min-h-0 mx-4 mt-4 mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Column 1 — Patterns (default) or Exceptions Queue.
            Outcomes moved out — they live in the scoreboard above. */}
        <div className="w-72 xl:w-80 2xl:w-96 flex-shrink-0 flex flex-col border-r border-slate-200">

          {/* Top-level tab — Patterns vs Exceptions. Outcomes moved to the
              top-of-page scoreboard, so column 1 now has only the two
              attention-shaped lists. */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-200 flex-shrink-0 bg-slate-50">
            <div className="flex bg-white rounded-lg p-0.5 gap-0.5 border border-slate-200">
              <button
                onClick={() => setColumnTab("patterns")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                  columnTab === "patterns" ? "bg-[#00BDFE] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Patterns
              </button>
              <button
                onClick={() => setColumnTab("exceptions")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all relative ${
                  columnTab === "exceptions" ? "bg-[#00BDFE] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Exceptions
                {highCount > 0 && columnTab !== "exceptions" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0 rounded-full leading-tight">{highCount}</span>
                )}
              </button>
            </div>
          </div>

          {columnTab === "patterns" ? (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin">
              <div className="flex items-baseline justify-between px-1 mb-1.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-700">Strategic Patterns</p>
                <p className="text-[9px] text-slate-400">{STRATEGIC_PATTERNS.length} active</p>
              </div>
              {STRATEGIC_PATTERNS.map(p => (
                <StrategicPatternCard
                  key={p.id}
                  pattern={p}
                  selected={focus?.type === "strategic_pattern" && focus.pattern.id === p.id}
                  onClick={() => setFocus({ type: "strategic_pattern", pattern: p })}
                />
              ))}
            </div>
          ) : (
            <>
              {/* Exceptions queue — preserved from previous design */}
              <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
                <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                  {(["all", "high", "decisions", "patterns"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all capitalize ${
                        filter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}>
                      {f === "all" ? "All" : f === "high" ? "Urgent" : f === "decisions" ? "Decisions" : "Patterns"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {filtered.map(e => (
                  <ExceptionCard
                    key={e.id}
                    item={e}
                    selected={isSelected(e)}
                    onClick={() => handleClick(e)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Column 2 — AI Assistant + Current Focus
            AI repositioned to first-class prominence at the top of column 2
            per Aaron's feedback. */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">

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
                key={`${persona}-${aiResetCounter}`}
                context={aiContext}
                placeholder={focus ? `Ask, search, or instruct about this ${focus.type}...` : "Ask, search, or instruct..."}
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
              {focus ? (
                <span className="text-xs text-slate-600 capitalize">{focus.type === "job" ? `${focus.job.customer} · ${focus.job.suburb}` : focus.type}</span>
              ) : (
                <span className="text-xs text-slate-400 italic">— select an item from the queue —</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!focus ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
                <div className="w-14 h-14 rounded-full bg-[#00BDFE]/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">⌘</span>
                </div>
                <p className="text-slate-700 font-semibold text-sm mb-1">{columnTab === "patterns" ? "Pick something to drill into" : "Select an exception"}</p>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs">{columnTab === "patterns" ? "Click any business outcome above, any strategic pattern on the left, or switch to Exceptions to see the operational queue." : "Click any item in the queue to see full context, AI activity log, and available actions."}</p>
              </div>
            ) : focus.type === "job" ? (
              <JobDetailPanel
                job={focus.job}
                onClose={() => setFocus(null)}
                onAskWhy={() => setAiTrigger({
                  text: `Why is job ${focus.job.id} in my queue right now? Explain in plain English what happened, what risk it carries, and what I'd typically need to decide.`,
                  nonce: Date.now(),
                })}
                tags={tagsByJob[focus.job.id] ?? []}
                onAddTag={isAaron ? (t) => onAddTag(focus.job.id, t) : undefined}
                onRemoveTag={isAaron ? (t) => onRemoveTag(focus.job.id, t) : undefined}
                onSelectTrade={onSelectTrade}
              />
            ) : focus.type === "pattern" ? (
              <PatternDetailPanel pattern={focus.pattern} onClose={() => setFocus(null)} onSelectTrade={onSelectTrade} />
            ) : focus.type === "decision" ? (
              <DecisionDetailPanel dec={focus.dec} onClose={() => setFocus(null)} />
            ) : focus.type === "jobtype" ? (
              <JobTypeDetailPanel jtLabel={focus.jtLabel} onClose={() => setFocus(null)} tagsByJob={tagsByJob} onSelectTrade={onSelectTrade} />
            ) : focus.type === "briefing" ? (
              <BriefingDetailPanel msg={focus.msg} icon={focus.icon} onClose={() => setFocus(null)} />
            ) : focus.type === "outcome" ? (
              <OutcomeDetailPanel outcome={focus.outcome} onClose={() => setFocus(null)} />
            ) : focus.type === "strategic_pattern" ? (
              <StrategicPatternDetail pattern={focus.pattern} onClose={() => setFocus(null)} />
            ) : null}
          </div>

        </div>

        {/* Column 3 — Platform Health */}
        <div className="w-64 xl:w-72 2xl:w-80 flex-shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-sm font-bold text-slate-800">Platform Health</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <PlatformHealth persona={persona} isAaron={isAaron} onWorkflowConfig={onWorkflowConfig} deferrals={deferrals} modelFeedback={modelFeedback} />
          </div>
        </div>

      </div>
    </div>
  );
}
