import { useState } from "react";
import { loganQueueJobs, kerrieQueueJobs, STARLINK_JOURNEY, HN_JOURNEY, INSURANCE_JOURNEY } from "../data/jobs";
import type { Job } from "../data/jobs";
import { MORNING } from "../data/scenarios";

// ─── Types ────────────────────────────────────────────────────────────────────
type QueueFilter = "all" | "urgent" | "jeopardy" | "planned";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function journeyForJob(job: Job): string[] {
  if (job.type === "Insurance Repair") return INSURANCE_JOURNEY;
  if (job.type === "Harvey Norman Install") return HN_JOURNEY;
  return STARLINK_JOURNEY;
}

function geoStatusLabel(job: Job): string {
  switch (job.geoStatus) {
    case "confirmed_en_route": return `Trade confirmed en route (${job.geoTime})`;
    case "gps_active": return `GPS active — en route (${job.geoTime})`;
    case "not_confirmed": return "Scheduled — confirmation pending";
    case "no_checkin": return `No check-in — window started${job.minsToWindow < 0 ? ` ${Math.abs(job.minsToWindow)}m ago` : ""}`;
    case "unassigned": return "Unassigned — Trade Allocation Required";
    default: return "Scheduled";
  }
}

function geoStatusColor(job: Job): string {
  switch (job.geoStatus) {
    case "confirmed_en_route":
    case "gps_active": return "text-green-600 bg-green-50 border-green-200";
    case "not_confirmed": return "text-slate-500 bg-slate-50 border-slate-200";
    case "no_checkin": return "text-red-600 bg-red-50 border-red-200";
    case "unassigned": return "text-amber-600 bg-amber-50 border-amber-200";
    default: return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function priorityColor(priority: string): string {
  if (priority === "jeopardy") return "text-red-600 bg-red-50 border-red-200";
  if (priority === "urgent") return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-500 bg-slate-50 border-slate-200";
}

function flagSeverityColor(severity: string): string {
  if (severity === "high") return "bg-red-50 border-red-200 text-red-700";
  if (severity === "medium") return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-slate-50 border-slate-200 text-slate-600";
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfBadge({ conf }: { conf: number }) {
  const color = conf >= 0.8 ? "text-green-600 bg-green-50 border-green-200"
    : conf >= 0.6 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center font-mono font-bold text-sm border rounded-lg px-2 py-0.5 ${color}`}>
      {conf.toFixed(1)}
    </span>
  );
}

// ─── Journey Progress Bar ─────────────────────────────────────────────────────
function JourneyBar({ steps, currentStep, accentColor }: { steps: string[]; currentStep: number; accentColor: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-start">
        {steps.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const isLast = i === steps.length - 1;
          return (
            <div key={step} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    done ? "border-transparent text-white"
                    : active ? "bg-white"
                    : "bg-white border-slate-200 text-slate-300"
                  }`}
                  style={
                    done ? { background: accentColor, borderColor: accentColor }
                    : active ? { borderColor: accentColor, color: accentColor }
                    : {}
                  }
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[9px] mt-1 text-center leading-tight max-w-[44px] ${
                    active ? "font-semibold" : done ? "text-slate-400" : "text-slate-300"
                  }`}
                  style={active ? { color: accentColor } : {}}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-0.5 mx-0.5 mb-4 rounded"
                  style={{ background: done ? accentColor : "#e2e8f0", opacity: done ? 0.7 : 1 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
function ActivityLog({ items, actionRequired }: {
  items: { time: string; actor: "ai" | "human"; msg: string }[];
  actionRequired?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className={`flex gap-2 rounded-lg px-3 py-2 text-xs ${
          item.actor === "ai" ? "bg-slate-50 border border-slate-100" : "bg-[#e0f7ff] border border-[#00BDFE]/20"
        }`}>
          <span className="flex-shrink-0 font-mono text-slate-400 w-14 text-[10px]">{item.time}</span>
          <span className={`flex-shrink-0 font-bold uppercase tracking-wide text-[9px] w-6 mt-0.5 ${
            item.actor === "ai" ? "text-slate-400" : "text-[#00BDFE]"
          }`}>{item.actor === "ai" ? "AI" : "You"}</span>
          <span className="text-slate-600 flex-1">{item.msg}</span>
        </div>
      ))}
      {actionRequired && (
        <div className="flex gap-2 rounded-lg px-3 py-2.5 text-xs bg-amber-50 border-2 border-amber-300">
          <span className="flex-shrink-0 font-mono text-slate-400 w-14 text-[10px]">Now</span>
          <span className="flex-shrink-0 font-bold uppercase tracking-wide text-[9px] w-6 mt-0.5 text-amber-600">⚡</span>
          <span className="text-amber-700 flex-1 font-semibold">{actionRequired}</span>
        </div>
      )}
    </div>
  );
}

// ─── Job Detail Panel (unified — works for Logan and Kerrie) ──────────────────
function JobDetail({ job, persona, onAction }: {
  job: Job;
  persona: string;
  onAction: (id: string, action: string) => void;
}) {
  const [actionDone, setActionDone] = useState<string | null>(null);
  const isInsurance = job.type === "Insurance Repair";
  const accentColor = isInsurance ? "#f97316" : "#00BDFE";
  const journey = journeyForJob(job);

  const isReadOnly = job.readOnlyFor.includes(persona);

  const slaRef: Record<string, { acceptance: string; makesafe: string; repair: string }> = {
    "Allianz Australia Insurance Ltd": { acceptance: "1h", makesafe: "4h", repair: "10 days" },
    "IAG": { acceptance: "2h", makesafe: "4h", repair: "14 days" },
    "NRMA": { acceptance: "2h", makesafe: "4h", repair: "14 days" },
    "Suncorp": { acceptance: "1h", makesafe: "2h", repair: "21 days" },
    "QBE": { acceptance: "4h", makesafe: "8h", repair: "21 days" },
  };
  const sla = job.insurer ? slaRef[job.insurer] : null;
  const insurerShort = job.insurer?.replace(" Australia Insurance Ltd", "").replace(" Insurance", "") ?? "";

  return (
    <div className="space-y-4">
      {/* Job header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isInsurance && job.insurer && (
              <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg font-semibold">{insurerShort}</span>
            )}
            {!isInsurance && (
              <span className={`text-xs font-semibold border rounded-lg px-2 py-0.5 ${geoStatusColor(job)}`}>
                {geoStatusLabel(job)}
              </span>
            )}
            {job.priority !== "standard" && (
              <span className={`text-xs font-semibold border rounded-lg px-2 py-0.5 capitalize ${priorityColor(job.priority)}`}>
                {job.priority === "jeopardy" ? "⚠ Jeopardy" : "⚠ Urgent"}
              </span>
            )}
            {isReadOnly && (
              <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg font-medium">
                Read-only
              </span>
            )}
          </div>
          <p className="text-slate-800 font-semibold text-base leading-tight">
            {isInsurance ? job.customer : job.trade}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {isInsurance ? `${job.suburb} · ${job.tradeType}` : `${job.suburb} · ${job.window}`}
          </p>
          <p className="text-slate-300 text-[10px] font-mono mt-0.5">{job.id}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <ConfBadge conf={job.conf} />
          <p className="text-slate-400 text-[10px] mt-1">confidence</p>
        </div>
      </div>

      {/* Read-only notice */}
      {isReadOnly && job.readOnlyReason && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
          <span className="font-semibold">View only:</span> {job.readOnlyReason}
        </div>
      )}

      {/* KPI deadline */}
      {job.kpiDeadline && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 text-xs text-red-700 font-semibold">
          ⏱ {job.kpiDeadline}
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {isInsurance ? (
          ([
            { label: "Stage", value: job.insuranceStage ?? job.primeStatus, warn: false },
            { label: "Next Trade Date", value: job.nextTradeDate ?? "TBC", warn: !job.nextTradeDate },
            { label: "Trade", value: job.trade.length > 24 ? job.trade.slice(0, 24) + "…" : job.trade, warn: false },
            { label: "Value", value: `$${job.value.toLocaleString()}`, warn: false },
          ] as { label: string; value: string; warn: boolean }[]).map(f => (
            <div key={f.label} className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">{f.label}</p>
              <p className={`font-semibold mt-0.5 text-xs ${f.warn ? "text-amber-600" : "text-slate-700"}`}>{f.value}</p>
            </div>
          ))
        ) : (
          ([
            { label: "Stage", value: job.primeStatus.replace("Works Scheduled - ", "").replace("Trade Allocation Required", "Allocate"), warn: false },
            { label: "Priority", value: job.priority.charAt(0).toUpperCase() + job.priority.slice(1), warn: false },
            { label: "Trade Type", value: job.tradeType, warn: false },
            { label: "Value", value: `$${job.value.toLocaleString()}`, warn: false },
          ] as { label: string; value: string; warn: boolean }[]).map(f => (
            <div key={f.label} className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">{f.label}</p>
              <p className={`font-semibold mt-0.5 text-xs ${f.warn ? "text-amber-600" : "text-slate-700"}`}>{f.value}</p>
            </div>
          ))
        )}
      </div>

      {/* SLA reference — insurance only */}
      {sla && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-xs">
          <p className="text-orange-700 font-semibold mb-1.5">{insurerShort} SLA Requirements</p>
          <div className="grid grid-cols-3 gap-2 text-slate-600">
            <span>Accept: <strong>{sla.acceptance}</strong></span>
            <span>Makesafe: <strong>{sla.makesafe}</strong></span>
            <span>Repair: <strong>{sla.repair}</strong></span>
          </div>
        </div>
      )}

      {/* Flags */}
      {job.flags.map((flag, i) => (
        <div key={i} className={`rounded-lg px-3 py-2 text-xs border ${flagSeverityColor(flag.severity)}`}>
          ⚠ {flag.detail}
        </div>
      ))}

      {/* Journey */}
      <div>
        <p className="text-slate-500 text-xs font-medium mb-2">Journey Progress</p>
        <JourneyBar steps={journey} currentStep={job.journeyStep} accentColor={accentColor} />
      </div>

      {/* Activity log */}
      <div>
        <p className="text-slate-500 text-xs font-medium mb-2">Activity Log — AI handled everything below</p>
        <ActivityLog items={job.aiLog} actionRequired={!isReadOnly ? job.actionRequired : null} />
      </div>

      {/* Actions — only if not read-only */}
      {!isReadOnly && job.actionOptions.length > 0 && !actionDone && (
        <div className="flex flex-wrap gap-2 pt-1">
          {job.actionOptions.map((a, i) => (
            <button
              key={a}
              onClick={() => { setActionDone(a); onAction(job.id, a); }}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                i === 0
                  ? `text-white shadow-sm ${isInsurance ? "bg-orange-500 hover:bg-orange-600" : "bg-[#00BDFE] hover:bg-[#0099d4]"}`
                  : i === job.actionOptions.length - 1
                  ? "bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs"
                  : "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}
      {actionDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 text-sm">
          ✓ {actionDone} — logged
        </div>
      )}
    </div>
  );
}

// ─── KPI Panel — Logan ────────────────────────────────────────────────────────
function LoganKPIs({ jobs, onInspect }: { jobs: Job[]; onInspect: (supervisor: string) => void }) {
  const urgentCount = jobs.filter(j => j.geoStatus === "no_checkin" || j.priority === "urgent").length;
  const jeopardyCount = jobs.filter(j => j.priority === "jeopardy").length;
  const onTrackCount = jobs.filter(j => j.geoStatus === "confirmed_en_route" || j.geoStatus === "gps_active").length;

  const fieldSupervisors = [
    {
      name: "Troy Macpherson",
      region: "North East NSW",
      safety: 8, safetyTarget: 20,
      quality: 6, qualityTarget: 20,
      alert: true,
      alertMsg: "Both scores below threshold — 3 jobs flagged",
      id: "troy",
    },
    {
      name: "Kylie Tran",
      region: "QLD + Northern Rivers",
      safety: 14, safetyTarget: 20,
      quality: 11, qualityTarget: 20,
      alert: false,
      alertMsg: "",
      id: "kylie",
    },
  ];

  return (
    <div className="space-y-3">

      {/* Region summary */}
      <div className="bg-[#e0f7ff] border border-[#00BDFE]/30 rounded-xl p-3">
        <p className="text-[#0077a8] text-[10px] font-semibold uppercase tracking-wide mb-2">North East NSW/QLD</p>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">3,450</p>
            <p className="text-slate-500 text-[10px]">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">91%</p>
            <p className="text-slate-500 text-[10px]">On-time</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">96%</p>
            <p className="text-slate-500 text-[10px]">Compliance</p>
          </div>
        </div>
      </div>

      {/* Today queue breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center">
          <p className="text-lg font-bold text-green-600">{onTrackCount}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">On track</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
          <p className="text-lg font-bold text-amber-600">{urgentCount}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Urgent</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center">
          <p className="text-lg font-bold text-red-600">{jeopardyCount}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Jeopardy</p>
        </div>
      </div>

      {/* Region KPIs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Region KPIs — This Week</p>
        <div className="space-y-2">
          {[
            { label: "On-time completion", done: 91, target: 95, unit: "%" },
            { label: "Trade compliance", done: 96, target: 98, unit: "%" },
            { label: "FS inspections done", done: 14, target: 20, unit: "" },
            { label: "Evidence submitted", done: 94, target: 98, unit: "%" },
          ].map(t => {
            const pct = t.unit === "%" ? t.done : Math.round(t.done / t.target * 100);
            const isOk = pct >= 90;
            return (
              <div key={t.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{t.label}</span>
                  <span className={isOk ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {t.done}{t.unit}/{t.target}{t.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isOk ? "bg-green-400" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Field Supervisors */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Field Supervisors — North East</p>
        <div className="space-y-3">
          {fieldSupervisors.map(fs => (
            <div
              key={fs.id}
              className={`rounded-lg border p-2.5 ${fs.alert ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className={`text-xs font-semibold ${fs.alert ? "text-red-700" : "text-slate-700"}`}>
                    {fs.alert && <span className="mr-1">⚠</span>}{fs.name}
                  </p>
                  <p className="text-slate-400 text-[10px]">{fs.region}</p>
                </div>
                <button
                  onClick={() => onInspect(fs.id)}
                  className="text-[10px] text-[#0077a8] border border-[#00BDFE]/40 bg-[#e0f7ff] px-2 py-0.5 rounded-md hover:bg-[#00BDFE] hover:text-white transition-colors font-medium flex-shrink-0 ml-1"
                >
                  Inspect ▾
                </button>
              </div>
              {fs.alert && (
                <p className="text-red-600 text-[10px] mb-1.5 leading-snug">{fs.alertMsg}</p>
              )}
              <div className="space-y-1">
                {[
                  { label: "Safety", score: fs.safety, target: fs.safetyTarget },
                  { label: "Quality", score: fs.quality, target: fs.qualityTarget },
                ].map(m => {
                  const pct = Math.round(m.score / m.target * 100);
                  const isOk = pct >= 70;
                  return (
                    <div key={m.label}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-slate-500">{m.label}</span>
                        <span className={isOk ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {m.score}/{m.target}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${isOk ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Skill Profile</p>
        <div className="space-y-1.5">
          {[
            { label: "Starlink", level: "Advanced", color: "text-green-700 bg-green-50 border-green-200" },
            { label: "Harvey Norman", level: "Advanced", color: "text-green-700 bg-green-50 border-green-200" },
            { label: "Total Install", level: "Intermediate", color: "text-blue-700 bg-blue-50 border-blue-200" },
            { label: "Insurance", level: "Learning", color: "text-amber-700 bg-amber-50 border-amber-200" },
            { label: "Construction", level: "Not assigned", color: "text-slate-400 bg-slate-50 border-slate-200" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{s.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.color}`}>{s.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting line */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Reporting Line</p>
        <div className="space-y-2">
          {[
            { name: "Logan (You)", role: "Operations Manager", active: true },
            { name: "Ben Burns", role: "COO — 10x Labs", active: false },
            { name: "Aaron Aitken", role: "CEO — Circl", active: false },
          ].map((e, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${e.active ? "bg-[#e0f7ff] border border-[#00BDFE]/30" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${e.active ? "bg-[#00BDFE] text-white" : "bg-slate-100 text-slate-500"}`}>
                {e.name[0]}
              </div>
              <div>
                <p className={`font-semibold text-xs ${e.active ? "text-[#0099d4]" : "text-slate-600"}`}>{e.name}</p>
                <p className="text-slate-400 text-[10px]">{e.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function KerrieKPIs({ jobs }: { jobs: Job[] }) {
  const flaggedCount = jobs.filter(j => j.flags.length > 0).length;
  const jeopardyCount = jobs.filter(j => j.priority === "jeopardy").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-500">4</p>
          <p className="text-slate-400 text-xs mt-0.5">Closed today</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${flaggedCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <p className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-500" : "text-green-500"}`}>{flaggedCount}</p>
          <p className="text-slate-400 text-xs mt-0.5">Flagged</p>
        </div>
      </div>

      {jeopardyCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-600">{jeopardyCount}</p>
          <p className="text-slate-500 text-xs mt-0.5">In jeopardy</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Portfolio Health</p>
        <div className="space-y-2">
          {[
            { label: "Jobs within SLA", value: "84%", color: "text-amber-600" },
            { label: "Chekku match rate", value: "10%", color: "text-red-600", note: "Target 40% — 90% manual today" },
            { label: "Portal compliance", value: "89%", color: "text-amber-600" },
            { label: "Active jobs", value: `${jobs.length}`, color: "text-slate-800" },
          ].map(m => (
            <div key={m.label} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{m.label}</span>
                <span className={`font-bold ${m.color}`}>{m.value}</span>
              </div>
              {m.note && <p className="text-slate-400 text-[10px] mt-0.5">{m.note}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Stage Distribution</p>
        <div className="space-y-1.5">
          {[
            { stage: "Assessment", count: jobs.filter(j => j.insuranceStage === "Assessment booked").length || 1 },
            { stage: "Scope", count: jobs.filter(j => j.insuranceStage === "Scope approved").length },
            { stage: "In Progress", count: jobs.filter(j => j.insuranceStage === "Work in progress").length },
            { stage: "Portal due", count: jobs.filter(j => j.flags.some(f => f.type === "portal_update_due")).length },
          ].filter(s => s.count > 0).map(s => (
            <div key={s.stage} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-20 flex-shrink-0">{s.stage}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${(s.count / jobs.length) * 100}%` }} />
              </div>
              <span className="text-slate-600 font-semibold w-3 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Insurer SLA Reference</p>
        <div className="space-y-2">
          {[
            { name: "Allianz", acceptance: "1h", makesafe: "4h", repair: "10d", color: "text-blue-700" },
            { name: "IAG / NRMA", acceptance: "2h", makesafe: "4h", repair: "14d", color: "text-purple-700" },
            { name: "Suncorp", acceptance: "1h", makesafe: "2h", repair: "21d", color: "text-orange-700" },
            { name: "QBE", acceptance: "4h", makesafe: "8h", repair: "21d", color: "text-teal-700" },
          ].map(ins => (
            <div key={ins.name} className="text-xs">
              <p className={`font-semibold ${ins.color} mb-0.5`}>{ins.name}</p>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                <span>Accept: {ins.acceptance}</span>
                <span>Safe: {ins.makesafe}</span>
                <span>Repair: {ins.repair}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-slate-500 text-xs font-semibold mb-2">Escalation Chain</p>
        <div className="space-y-2">
          {[
            { name: "Kerrie (You)", tier: "Tier 2 — Specialist", active: true },
            { name: "Nicole B.", tier: "Tier 3 — Lead", active: false },
            { name: "Aaron A.", tier: "Management", active: false },
          ].map((e, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${e.active ? "bg-[#e0f7ff] border border-[#00BDFE]/30" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${e.active ? "bg-[#00BDFE] text-white" : "bg-slate-100 text-slate-500"}`}>
                {e.name[0]}
              </div>
              <div>
                <p className={`font-semibold text-xs ${e.active ? "text-[#0099d4]" : "text-slate-600"}`}>{e.name}</p>
                <p className="text-slate-400 text-[10px]">{e.tier}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Queue Items ──────────────────────────────────────────────────────────────
function LoganQueueItem({ job, selected, onClick }: { job: Job; selected: boolean; onClick: () => void }) {
  const urgent = job.geoStatus === "no_checkin" || job.priority === "urgent";
  const jeopardy = job.priority === "jeopardy";
  const unassigned = job.geoStatus === "unassigned";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
        selected ? "bg-[#e0f7ff] border-[#00BDFE] shadow-sm"
        : jeopardy ? "bg-red-50 border-red-200 hover:border-red-300"
        : urgent ? "bg-amber-50 border-amber-200 hover:border-amber-300"
        : unassigned ? "bg-amber-50 border-amber-200 hover:border-amber-300"
        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* Primary: customer name */}
      <p className="text-slate-800 font-semibold text-sm truncate leading-tight">{job.customer}</p>
      {/* Secondary: trade name */}
      <p className="text-slate-500 text-xs mt-0.5 truncate">{job.trade === "Trade Allocation Required" ? "⚠ No trade allocated" : job.trade}</p>
      {/* Tertiary: suburb + window */}
      <p className="text-slate-400 text-[10px] mt-0.5 truncate">{job.suburb} · {job.window}</p>
      {/* Status row */}
      <div className="flex items-center justify-between gap-1 mt-1.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">{job.type.replace(" Install", "")}</span>
          {jeopardy && <span className="text-[10px] text-red-600 font-semibold flex-shrink-0">Jeopardy</span>}
          {!jeopardy && urgent && <span className="text-[10px] text-amber-600 font-semibold flex-shrink-0">Urgent</span>}
          {unassigned && !urgent && !jeopardy && <span className="text-[10px] text-amber-600 font-semibold flex-shrink-0">Unassigned</span>}
        </div>
        <ConfBadge conf={job.conf} />
      </div>
      <p className="text-slate-300 text-[9px] font-mono mt-1">{job.id}</p>
    </button>
  );
}

function KerrieQueueItem({ job, selected, onClick }: { job: Job; selected: boolean; onClick: () => void }) {
  const hasFlags = job.flags.length > 0;
  const isJeopardy = job.priority === "jeopardy";
  const insurerShort = job.insurer?.replace(" Australia Insurance Ltd", "").replace(" Insurance", "") ?? "";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-150 ${
        selected ? "bg-[#e0f7ff] border-[#00BDFE] shadow-sm"
        : isJeopardy ? "bg-red-50 border-red-200 hover:border-red-300"
        : hasFlags ? "bg-amber-50 border-amber-200 hover:border-amber-300"
        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* Primary: customer name */}
      <p className="text-slate-800 font-semibold text-sm truncate leading-tight">{job.customer}</p>
      {/* Secondary: suburb + trade */}
      <p className="text-slate-500 text-xs mt-0.5 truncate">{job.suburb} · {job.tradeType}</p>
      {/* Tertiary: insurer + stage */}
      <div className="flex items-center justify-between gap-1 mt-1.5">
        <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">{insurerShort}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
          isJeopardy ? "bg-red-100 text-red-600 border border-red-200"
          : hasFlags ? "bg-amber-100 text-amber-700 border border-amber-200"
          : "bg-slate-100 text-slate-500"
        }`}>
          {isJeopardy ? "⚠ Jeopardy" : hasFlags ? "⚠ Flagged" : "On track"}
        </span>
      </div>
      {/* Stage + job ID */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-slate-400 text-[10px] truncate">{job.insuranceStage ?? job.primeStatus}</p>
        <p className="text-slate-300 text-[9px] font-mono">{job.id}</p>
      </div>
    </button>
  );
}

// ─── Main CockpitView ─────────────────────────────────────────────────────────
export default function CockpitView({ persona }: { persona: string }) {
  const isKerrie = persona === "kerrie";
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setActionsDone] = useState<Record<string, string>>({});

  const loganQueue = loganQueueJobs();
  const kerrieQueue = kerrieQueueJobs();

  const filteredLogan = loganQueue.filter(j => {
    if (filter === "all") return true;
    if (filter === "urgent") return j.geoStatus === "no_checkin" || j.priority === "urgent";
    if (filter === "jeopardy") return j.priority === "jeopardy" || j.conf < 0.5;
    if (filter === "planned") return j.minsToWindow > 60 && j.geoStatus !== "no_checkin";
    return true;
  });

  const filteredKerrie = kerrieQueue.filter(j => {
    if (filter === "all") return true;
    if (filter === "urgent") return j.flags.length > 0;
    if (filter === "jeopardy") return j.priority === "jeopardy";
    if (filter === "planned") return j.flags.length === 0;
    return true;
  });

  const isPatternView = selectedId?.startsWith("PATTERN:") ?? false;
  const isInspectView = selectedId?.startsWith("INSPECT:") ?? false;
  const selectedJob = selectedId && !isPatternView && !isInspectView
    ? (isKerrie ? kerrieQueue : loganQueue).find(j => j.id === selectedId) ?? null
    : null;
  const inspectSupervisor = isInspectView ? selectedId!.replace("INSPECT:", "") : null;

  const urgentCount = isKerrie
    ? kerrieQueue.filter(j => j.flags.length > 0).length
    : loganQueue.filter(j => j.geoStatus === "no_checkin" || j.priority === "urgent").length;

  const briefingItems = MORNING.filter(m => m.severity === "high").slice(0, 2);
  const queueList = isKerrie ? filteredKerrie : filteredLogan;

  return (
    <div className="flex rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden" style={{ minHeight: "calc(100vh - 220px)" }}>

      {/* ── Column 1: Work Queue ──────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-200 bg-white">
          <h2 className="text-slate-700 font-semibold text-sm">My Work Queue</h2>
          {urgentCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
              {urgentCount} urgent
            </span>
          )}
        </div>

        <div className="flex gap-1 px-3 py-2.5 border-b border-slate-200 bg-white">
          {(["all", "urgent", "jeopardy", "planned"] as QueueFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs py-1 rounded-md font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[#00BDFE] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {!isKerrie && briefingItems.length > 0 && (
          <div className="px-3 pt-2.5 space-y-1.5">
            {briefingItems.map((item, i) => {
              const hasLink = !!(item as {jobRef?: string | null}).jobRef;
              const jobRef = (item as {jobRef?: string | null}).jobRef;
              return hasLink ? (
                <button
                  key={i}
                  onClick={() => setSelectedId(jobRef!)}
                  className={`w-full text-left bg-amber-50 border rounded-lg px-2.5 py-2 text-xs text-amber-700 leading-snug transition-colors hover:bg-amber-100 hover:border-amber-300 ${selectedId === jobRef ? 'border-[#00BDFE] bg-[#e0f7ff] text-[#0077a8]' : 'border-amber-200'}`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.msg.slice(0, 80)}{item.msg.length > 80 ? "…" : ""}
                  <span className="ml-1 text-[10px] font-semibold opacity-60">→ view job</span>
                </button>
              ) : (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-amber-700 leading-snug">
                  <span className="mr-1">{item.icon}</span>{item.msg.slice(0, 80)}{item.msg.length > 80 ? "…" : ""}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 relative">
          {queueList.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">No jobs match this filter</p>
          ) : isKerrie ? (
            (filteredKerrie as Job[]).map(j => (
              <KerrieQueueItem key={j.id} job={j} selected={selectedId === j.id} onClick={() => setSelectedId(j.id)} />
            ))
          ) : (
            (filteredLogan as Job[]).map(j => (
              <LoganQueueItem key={j.id} job={j} selected={selectedId === j.id} onClick={() => setSelectedId(j.id)} />
            ))
          )}
          {queueList.length > 4 && (
            <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* ── Column 2: Current Focus ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-slate-200">
          <h2 className="text-slate-700 font-semibold text-sm">Current Focus</h2>
          {selectedJob && (
            <p className="text-slate-400 text-xs mt-0.5">{selectedJob.customer} · {selectedJob.suburb}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isPatternView ? (
            <div className="animate-fadeIn space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xl">📷</span>
                  <div>
                    <p className="text-amber-800 font-semibold text-sm">Evidence non-submission — York Digital Solutions</p>
                    <p className="text-amber-600 text-xs mt-0.5">Pattern detected · 3 affected jobs · Invoicing blocked</p>
                  </div>
                </div>
                <p className="text-amber-700 text-xs leading-relaxed">
                  York Digital Solutions completed 3 Starlink installs over 4 days with 0 photos submitted.
                  Invoicing is blocked on all 3 jobs. Auto-reminder sent at 07:01. No response after 48+ hours.
                  Pattern threshold exceeded — formal action required.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Affected Jobs</p>
                {[
                  { id: "CG35954", suburb: "Broke NSW", date: "7 Apr", status: "Complete — awaiting evidence" },
                  { id: "CG36003", suburb: "Fern Bay NSW", date: "5 Apr", status: "Complete — awaiting evidence" },
                  { id: "CG36015", suburb: "Moruya NSW", date: "3 Apr", status: "Complete — awaiting evidence" },
                ].map(j => (
                  <div key={j.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-slate-700 text-xs font-semibold">{j.id} · {j.suburb}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{j.date} · {j.status}</p>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">Invoice blocked</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">AI Activity Log</p>
                {[
                  { time: "07:01", action: "Auto-reminder sent to York Digital Solutions via Chekku", auto: true },
                  { time: "Yesterday 18:00", action: "Pattern threshold exceeded — 3 jobs, 0 photos, 48h+", auto: true },
                  { time: "Yesterday 14:00", action: "Second reminder sent — no response", auto: true },
                  { time: "Now", action: "Escalated to Logan — human action required", auto: false },
                ].map((entry, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs ${
                    !entry.auto ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50 border border-slate-200"
                  }`}>
                    <span className={`mt-0.5 flex-shrink-0 ${entry.auto ? "text-[#00BDFE]" : "text-amber-500"}`}>{entry.auto ? "✦" : "⚡"}</span>
                    <div className="flex-1">
                      <p className={entry.auto ? "text-slate-600" : "text-amber-700 font-semibold"}>{entry.action}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Action Required</p>
                <button className="w-full bg-[#00BDFE] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#009fd6] transition-colors">📞 Call York Digital Solutions</button>
                <button className="w-full border border-slate-300 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">📋 Log formal warning</button>
                <button className="w-full border border-slate-300 text-slate-500 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">🔄 Reassign future jobs</button>
              </div>
            </div>
          ) : isInspectView ? (
            <div className="animate-fadeIn space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-xs font-semibold mb-1">
                  {inspectSupervisor === "troy" ? "⚠ Troy Macpherson — Safety & Quality Alert" : "Kylie Tran — Inspection Queue"}
                </p>
                <p className="text-red-600 text-xs">
                  {inspectSupervisor === "troy"
                    ? "Safety 8/20 · Quality 6/20 — both below threshold. 3 jobs flagged for review."
                    : "Safety 14/20 · Quality 11/20 — within acceptable range. 2 jobs pending sign-off."}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Flagged Jobs</p>
                {(inspectSupervisor === "troy" ? [
                  { id: "CG35954", customer: "D. Harrington", suburb: "Broke NSW", issue: "No safety checklist submitted", risk: "high" },
                  { id: "CG36003", customer: "P. Nguyen", suburb: "Fern Bay NSW", issue: "Photo evidence missing — 3 items", risk: "high" },
                  { id: "CG36015", customer: "A. Kowalski", suburb: "Moruya NSW", issue: "SWMS not signed on site", risk: "medium" },
                ] : [
                  { id: "CG36044", customer: "S. Brennan", suburb: "Tweed Heads NSW", issue: "QA call not completed", risk: "medium" },
                  { id: "CG36071", customer: "R. Patel", suburb: "Murwillumbah NSW", issue: "Completion photos pending", risk: "low" },
                ]).map(j => (
                  <div key={j.id} className={`rounded-lg border p-3 ${
                    j.risk === "high" ? "bg-red-50 border-red-200" : j.risk === "medium" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{j.customer} — {j.suburb}</p>
                        <p className="text-slate-400 text-[10px] font-mono">{j.id}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        j.risk === "high" ? "bg-red-100 text-red-700 border-red-300" : j.risk === "medium" ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-slate-100 text-slate-500 border-slate-300"
                      }`}>{j.risk}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5">{j.issue}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-1">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Action Required</p>
                <button className="w-full bg-[#00BDFE] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#009fd6] transition-colors">
                  📞 Call {inspectSupervisor === "troy" ? "Troy Macpherson" : "Kylie Tran"}
                </button>
                <button className="w-full border border-slate-300 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">📋 Log performance note</button>
                <button className="w-full border border-slate-300 text-slate-500 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">📅 Schedule site visit</button>
              </div>
            </div>
          ) : !selectedJob ? (
            <div className="h-full flex items-center justify-center" style={{ minHeight: 300 }}>
              <div className="text-center px-8 py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 max-w-xs">
                <div className="w-12 h-12 rounded-full bg-[#e0f7ff] border border-[#00BDFE]/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-[#00BDFE] text-xl">✦</span>
                </div>
                <p className="text-slate-600 text-sm font-medium">Select a job from the queue</p>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">AI has handled everything — you only act when required</p>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <JobDetail
                job={selectedJob}
                persona={persona}
                onAction={(id, action) => setActionsDone(a => ({ ...a, [id]: action }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Column 3: My KPIs ─────────────────────────────────────────────────── */}
      <div className="w-56 flex-shrink-0 flex flex-col border-l border-slate-200">
        <div className="px-4 pt-4 pb-3 border-b border-slate-200">
          <h2 className="text-slate-700 font-semibold text-sm">My KPIs — Today</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isKerrie
            ? <KerrieKPIs jobs={kerrieQueue} />
            : <LoganKPIs jobs={loganQueue} onInspect={(id) => setSelectedId(`INSPECT:${id}`)} />
          }
        </div>
      </div>

    </div>
  );
}
