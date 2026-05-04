import type { EquipmentItem, EquipmentStatus } from "../data/jobs";

// EquipmentPanel — surfaces the kit/parts needed to execute a job. The 4th
// actor (alongside customer, trade, Circl staff). Most jobs are uneventful
// (everything on-hand with the trade) and render as a one-line summary.
// Exception jobs (delayed/missing/wrong) get the full panel with status,
// supplier, ETA, and blocker indicator.
//
// Equipment status also feeds into the ConfidenceBreakdown of the job (under
// the "equipment" category) — the two surfaces tell the same story from
// different angles.

const STATUS_META: Record<EquipmentStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
  on_hand:        { label: "On hand",        dot: "bg-green-500",  bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  ordered:        { label: "Ordered",        dot: "bg-slate-400",  bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600" },
  in_transit:     { label: "In transit",     dot: "bg-sky-500",    bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700" },
  at_destination: { label: "At destination", dot: "bg-sky-500",    bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700" },
  delivered:      { label: "Delivered",      dot: "bg-green-500",  bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  delayed:        { label: "Delayed",        dot: "bg-amber-500",  bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700" },
  exception:      { label: "Exception",      dot: "bg-red-500",    bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700" },
};

const READY_STATUSES: EquipmentStatus[] = ["on_hand", "delivered"];

function ItemRow({ item }: { item: EquipmentItem }) {
  const meta = STATUS_META[item.status];
  const isExceptional = item.status === "delayed" || item.status === "exception";
  return (
    <div className={`rounded-lg border px-3 py-2 ${isExceptional ? meta.bg + " " + meta.border : "bg-white border-slate-200"}`}>
      <div className="flex items-baseline gap-2">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
        <p className="text-sm font-medium text-slate-800 leading-snug flex-1 min-w-0">{item.description}</p>
        <span className={`text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${meta.text}`}>{meta.label}</span>
        {item.blockingJob && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border bg-red-100 text-red-700 border-red-300 flex-shrink-0">⚠ blocker</span>
        )}
      </div>
      <div className="pl-4 mt-1 text-[11px] text-slate-500 leading-snug">
        <p>{item.supplier}{item.qty > 1 ? ` · qty ${item.qty}` : ""}{item.deliveryPoint ? ` · ${item.deliveryPoint}` : ""}</p>
        {item.status === "delayed" && item.originalEta && item.etaDate && (
          <p className="text-amber-700 mt-0.5">
            ETA: <span className="line-through opacity-70">{item.originalEta}</span> → <span className="font-semibold">{item.etaDate}</span>
          </p>
        )}
        {item.status !== "delayed" && item.etaDate && (
          <p className="mt-0.5">ETA: <span className="text-slate-700">{item.etaDate}</span></p>
        )}
        {item.trackingRef && (
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Tracking: {item.trackingRef}</p>
        )}
        {item.notes && (
          <p className={`text-[10px] mt-0.5 italic leading-snug ${isExceptional ? meta.text : "text-slate-400"}`}>{item.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function EquipmentPanel({ items }: { items: EquipmentItem[] }) {
  if (!items || items.length === 0) return null;

  const allReady = items.every(i => READY_STATUSES.includes(i.status));
  const exceptions = items.filter(i => i.status === "delayed" || i.status === "exception");
  const blockers = items.filter(i => i.blockingJob);

  // Compact rendering when everything is on-hand / delivered. Single line
  // says "no equipment story to tell here" — keeps the JobDetail tidy.
  if (allReady) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Equipment</span>
        <span className="text-slate-700">All on hand with trade ({items.length} item{items.length === 1 ? "" : "s"})</span>
      </div>
    );
  }

  // Full panel — sort exceptions to the top so the operator sees blockers first.
  const sorted = [...items].sort((a, b) => {
    const aRank = a.status === "exception" ? 0 : a.status === "delayed" ? 1 : a.blockingJob ? 2 : 3;
    const bRank = b.status === "exception" ? 0 : b.status === "delayed" ? 1 : b.blockingJob ? 2 : 3;
    return aRank - bRank;
  });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium">Equipment</p>
        <p className="text-slate-400 text-[10px]">
          {items.length} item{items.length === 1 ? "" : "s"}
          {exceptions.length > 0 && ` · ${exceptions.length} ${exceptions.length === 1 ? "delayed" : "exceptions"}`}
          {blockers.length > 0 && ` · ${blockers.length} blocking`}
        </p>
      </div>
      <div className="space-y-1.5">
        {sorted.map(item => <ItemRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
