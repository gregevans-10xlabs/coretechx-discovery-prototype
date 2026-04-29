import { useState } from "react";
import { type Job, UNIVERSAL_STAGES, journeyMapForJob } from "../data/jobs";
import { TAG_VOCABULARY } from "../data/scenarios";

// Shared journey bar — renders the 8 Universal Stages backbone with
// client-specific terminology annotated under each stage. When tags or
// edit callbacks are provided, also renders a TagsBar above the journey
// (per CLAUDE.md: "On Hold" / "Needs Variation" are tags overlaid on
// stages, not separate workflow states).
//
// The 8 universal stages are the canonical structure (Discovery OS decision,
// 7 Apr 2026). Client labels are configurable presentation.
//
// Two visual sizes:
//   - "default": circles + connecting lines (CockpitView, FieldView job detail)
//   - "compact": thin pill bar (PortfolioView job detail)

type Props = {
  job: Job;
  accentColor?: string;
  size?: "default" | "compact";
  // Tags applied to this job (from App-level state; pass [] if none).
  tags?: string[];
  // Edit callbacks — both required to enable add/remove UI; omit either to
  // render tags read-only (e.g. National view).
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
};

// ─── Tags bar — overlay above the journey ────────────────────────────────────
function TagsBar({ tags, onAdd, onRemove }: {
  tags: string[];
  onAdd?: (tag: string) => void;
  onRemove?: (tag: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const canEdit = !!onAdd && !!onRemove;
  const available = TAG_VOCABULARY.filter(v => !tags.includes(v.label));

  if (tags.length === 0 && !canEdit) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {tags.map(t => {
        const meta = TAG_VOCABULARY.find(v => v.label === t);
        if (!meta) return null;
        return (
          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 ${meta.color}`}>
            <span>{meta.icon}</span>
            <span>{t}</span>
            {canEdit && (
              <button
                onClick={() => onRemove!(t)}
                title={`Remove ${t}`}
                className="hover:bg-white/40 rounded px-0.5 -mr-0.5 leading-none"
              >×</button>
            )}
          </span>
        );
      })}
      {canEdit && available.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setPickerOpen(p => !p)}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            + Add tag
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-20 min-w-[170px]">
                {available.map(t => (
                  <button
                    key={t.label}
                    onClick={() => { onAdd!(t.label); setPickerOpen(false); }}
                    className="w-full text-left text-[11px] px-2 py-1.5 hover:bg-slate-50 rounded flex items-center gap-1.5"
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function JourneyBar({ job, accentColor = "#00BDFE", size = "default", tags, onAddTag, onRemoveTag }: Props) {
  const map = journeyMapForJob(job);
  const clientStep = Math.min(job.journeyStep, map.toUniversal.length - 1);
  const universalStage = map.toUniversal[clientStep] ?? 0;
  const showTags = tags !== undefined || onAddTag !== undefined;

  if (size === "compact") {
    return (
      <div>
        {showTags && <TagsBar tags={tags ?? []} onAdd={onAddTag} onRemove={onRemoveTag} />}
        <div className="flex items-start gap-1">
        {UNIVERSAL_STAGES.map((stage, i) => {
          const done = i < universalStage;
          const active = i === universalStage;
          const labels = map.clientLabels[i];
          return (
            <div key={stage} className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
              <div className={`h-1.5 w-full rounded-full ${done ? "bg-[#00BDFE]" : active ? "bg-amber-400" : "bg-slate-200"}`} />
              <span className={`text-[8px] font-semibold leading-tight truncate w-full text-center ${active ? "text-amber-600" : done ? "text-[#00BDFE]" : "text-slate-300"}`} title={stage}>{stage}</span>
              {labels.length > 0 && (
                <span className="text-[7px] text-slate-400 leading-tight truncate w-full text-center" title={labels.join(" · ")}>
                  {labels.join(" · ")}
                </span>
              )}
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  // Default: each universal stage gets an equal flex column. Connectors are drawn
  // as half-segments inside each column so labels can truncate without overlapping.
  return (
    <div className="mb-2">
      {showTags && <TagsBar tags={tags ?? []} onAdd={onAddTag} onRemove={onRemoveTag} />}
      <div className="flex items-start">
        {UNIVERSAL_STAGES.map((stage, i) => {
          const done = i < universalStage;
          const active = i === universalStage;
          const labels = map.clientLabels[i];
          const showLeft  = i > 0;
          const showRight = i < UNIVERSAL_STAGES.length - 1;
          // Connector colour rules: a segment is "filled" when both its endpoints are reached.
          const leftFilled  = i <= universalStage;          // circles 0..universalStage are reached
          const rightFilled = i < universalStage;
          return (
            <div key={stage} className="flex-1 min-w-0 flex flex-col items-center">
              {/* Circle row with half-connectors */}
              <div className="flex items-center w-full">
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{
                    background: showLeft ? (leftFilled ? accentColor : "#e2e8f0") : "transparent",
                    opacity: leftFilled ? 0.7 : 1,
                  }}
                />
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all flex-shrink-0 ${
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
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{
                    background: showRight ? (rightFilled ? accentColor : "#e2e8f0") : "transparent",
                    opacity: rightFilled ? 0.7 : 1,
                  }}
                />
              </div>
              {/* Universal stage name */}
              <span
                className={`text-[9px] mt-1 text-center leading-tight truncate w-full ${
                  active ? "font-semibold" : done ? "text-slate-500" : "text-slate-300"
                }`}
                style={active ? { color: accentColor } : {}}
                title={stage}
              >
                {stage}
              </span>
              {/* Client annotation */}
              {labels.length > 0 && (
                <span
                  className={`text-[8px] mt-0.5 text-center leading-tight truncate w-full ${active ? "text-slate-600 font-medium" : "text-slate-400"}`}
                  title={labels.join(" · ")}
                >
                  {labels.join(" · ")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
