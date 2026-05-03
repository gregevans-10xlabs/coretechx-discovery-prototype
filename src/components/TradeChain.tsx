import type { TradeActor, TradeActorStatus } from "../data/jobs";
import TradeLink, { isAIAgent } from "./TradeLink";

// TradeChain — horizontal strip of trade actors on a multi-trade job. Shows
// who's doing what right now, what stage each is at, and who's waiting on
// whom. Aaron specifically calls out trade-chain visibility as one of the
// things he cares about — flat commitment lists don't show the coordination
// muscle for Tier MT (multi-trade) work.
//
// Renders inline above the journey/commitment block. Hidden when the job has
// 0 or 1 trade actor (the standard single-trade case is already covered by
// the Job header). Trade names route to TradeDrawer via TradeLink.

const STATUS_META: Record<TradeActorStatus, { label: string; bg: string; border: string; text: string; dot: string; accent: string }> = {
  complete:    { label: "Complete",    bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500", accent: "border-l-green-400" },
  in_progress: { label: "In progress", bg: "bg-sky-50",   border: "border-sky-200",   text: "text-sky-700",   dot: "bg-sky-500",   accent: "border-l-sky-400" },
  waiting:     { label: "Waiting",     bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", accent: "border-l-amber-400" },
  scheduled:   { label: "Scheduled",   bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400", accent: "border-l-slate-300" },
  blocked:     { label: "Blocked",     bg: "bg-red-50",   border: "border-red-200",   text: "text-red-700",   dot: "bg-red-500",   accent: "border-l-red-400" },
};

function TradeActorCard({ actor, onSelectTrade }: { actor: TradeActor; onSelectTrade?: (name: string) => void }) {
  const meta = STATUS_META[actor.status];
  // Non-trade actors (e.g. AHO Inspector, Field Supervisor) shouldn't be
  // clickable as trades — TradeLink already handles AI agents the same way.
  const isInspector = /inspector/i.test(actor.role);
  const isFieldSupervisor = /field supervisor/i.test(actor.role);
  const disableLink = isAIAgent(actor.name) || isInspector || isFieldSupervisor;

  return (
    <div className={`rounded-lg border bg-white border-slate-200 border-l-4 ${meta.accent} p-2.5 min-w-[180px] flex-1`}>
      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1 truncate">{actor.role}</p>
      <p className="text-sm text-slate-800 font-medium leading-tight mb-1.5">
        <TradeLink name={actor.name} onSelectTrade={onSelectTrade} disabled={disableLink} className="text-slate-800 font-medium" />
      </p>
      <p className="text-xs text-slate-600 leading-snug mb-1.5">{actor.stage}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold border ${meta.bg} ${meta.border} ${meta.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        {actor.dependsOn && actor.dependsOn.length > 0 && (
          <span className="text-[10px] text-slate-500">
            ↑ on {actor.dependsOn.length === 1 ? actor.dependsOn[0].replace(/ Pty Ltd$/i, "") : `${actor.dependsOn.length} trades`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TradeChain({ actors, onSelectTrade }: { actors: TradeActor[]; onSelectTrade?: (name: string) => void }) {
  if (!actors || actors.length < 2) return null;
  // Compute a one-line summary for the section header — operators reading the
  // header alone should know what stage the chain is at without scanning each
  // card. Identifies the bottleneck if there's an obvious one (the trade
  // blocking the most others).
  const inProgress = actors.filter(a => a.status === "in_progress");
  const waiting    = actors.filter(a => a.status === "waiting");
  const summary = waiting.length > 0 && inProgress.length > 0
    ? `${inProgress.map(a => a.name.split(" ")[0]).join(", ")} working · ${waiting.length} waiting`
    : actors.every(a => a.status === "complete")
    ? "All trades complete"
    : actors.every(a => a.status === "scheduled" || a.status === "complete")
    ? "Awaiting next stage"
    : `${actors.length} trades`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium">Trade Chain</p>
        <p className="text-slate-400 text-[10px]">{summary}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actors.map(a => <TradeActorCard key={a.name} actor={a} onSelectTrade={onSelectTrade} />)}
      </div>
    </div>
  );
}
