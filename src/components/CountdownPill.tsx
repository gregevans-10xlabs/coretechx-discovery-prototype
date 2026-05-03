import { useEffect, useState } from "react";

// CountdownPill — live ticking countdown for action-required items, with the
// auto-execute option that fires when the timer hits zero.
//
// Why this exists: without a countdown, "Action Required" reads as a backlog.
// With one, it visibly demonstrates AI-first / human-governed: the AI is going
// to act, the human gets a window to override. This is the most direct
// expression of the "exception-driven, not monitoring" principle.
//
// Demo behaviour: deadlines are minutes-from-session-start (NOT wall-clock).
// SESSION_START_MS is module-level so all instances agree, and remounts (e.g.
// from persona switching) preserve the same session clock.

const SESSION_START_MS = Date.now();

type Props = {
  deadlineMin: number;
  autoExecuteOption?: string;
  compact?: boolean;
};

function formatRemaining(remainingSec: number): string {
  if (remainingSec <= 0) return "0s";
  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}

export default function CountdownPill({ deadlineMin, autoExecuteOption, compact }: Props) {
  // We track a `now` timestamp and update it once per second — cheap, and lets
  // the component re-render with the new remaining value.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = now - SESSION_START_MS;
  const remainingMs = deadlineMin * 60_000 - elapsedMs;
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const expired = remainingMs <= 0;

  // Color thresholds — calm at first, warning under 5 min, critical under 1 min,
  // resolved (green) once the AI has executed.
  let palette: { bg: string; border: string; text: string; muted: string };
  if (expired) {
    palette = { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", muted: "text-green-600" };
  } else if (remainingSec < 60) {
    palette = { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", muted: "text-red-600" };
  } else if (remainingSec < 300) {
    palette = { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", muted: "text-amber-600" };
  } else {
    palette = { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", muted: "text-slate-500" };
  }

  if (compact) {
    // Compact mode for the queue card — single small chip with just the
    // remaining time + a verb. Auto-execute option is hidden here; the
    // operator opens the job to see what AI is about to do.
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border inline-flex items-center gap-1 ${palette.bg} ${palette.border} ${palette.text}`}
        title={expired
          ? `AI auto-executed${autoExecuteOption ? ": " + autoExecuteOption : ""}`
          : `AI will auto-execute in ${formatRemaining(remainingSec)}${autoExecuteOption ? " — " + autoExecuteOption : ""}`}
      >
        <span aria-hidden>{expired ? "✓" : "⏱"}</span>
        {expired ? "Auto-executed" : `AI in ${formatRemaining(remainingSec)}`}
      </span>
    );
  }

  // Detail mode — fuller panel slotted above the action buttons. Operator
  // sees what AI will do and how long they have to override.
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${palette.bg} ${palette.border}`}>
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${palette.muted}`}>
          <span className="mr-1" aria-hidden>{expired ? "✓" : "⏱"}</span>
          {expired ? "AI auto-executed" : "AI will auto-execute"}
        </span>
        {!expired && (
          <span className={`text-xs font-bold tabular-nums ${palette.text}`}>
            {formatRemaining(remainingSec)}
          </span>
        )}
      </div>
      <p className={`text-xs leading-snug ${palette.text}`}>
        {expired
          ? <>AI executed: <span className="font-semibold">{autoExecuteOption ?? "recommended option"}</span> — logged.</>
          : <><span className="font-semibold">{autoExecuteOption ?? "Recommended option"}</span> — override below or it runs automatically.</>
        }
      </p>
    </div>
  );
}
