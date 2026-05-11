import { useMemo, useState } from "react";
import {
  STARLINK_GOALS, STARLINK_STANDALONE, PENDING_CHANGES, CONFIG_AUDIT,
  STAGE_NAMES, SEEDED_SIMULATIONS, simulateChange,
  type Goal, type StandaloneCommitment, type PendingChange, type ConfigAuditEntry,
} from "../data/goals";
import { CONFIG_ACCESS_META, PERSONAS, type ConfigAccessTier } from "../data/scenarios";
import GoalDrawer, { type DraftEntry } from "./GoalDrawer";
import SimulationModal from "./SimulationModal";
import NewClientWizard, { type NewClientPublish } from "./NewClientWizard";

// ConfigurationView — the workflow canvas + library entry point + Pending
// Changes panel. Read-only for most personas; edit affordances appear when
// access tier permits.
//
// Canvas layout:
//   - Top: access banner (current persona's tier + capability statement)
//   - Center: 8-stage backbone with goal/commitment cards docked in stage
//             columns, plus a floating lane below for goals that span stages
//             or activate on event
//   - Right: Pending Changes panel (drafts queue) + recent audit
//
// MVP scope: Starlink workflow only. Other workflows will follow the same
// shape; deferred to keep the demo focused.

type Props = {
  persona: string;
  onBack: () => void;
};

// ─── Card components ────────────────────────────────────────────────────────
// Goal card carries the count of underlying commitments + a glanceable health
// dot. Standalone-commitment card looks similar but has a single-commitment
// indicator and surfaces autonomy level inline.

function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const enabledCount = goal.commitments.filter(c => c.enabled).length;
  const allHealthy = goal.commitments.every(c => c.enabled && (c.accuracy ?? 1) >= 0.85);
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-white border-slate-200 hover:border-[#00BDFE]/50 hover:shadow-sm transition-all p-2.5"
    >
      <div className="flex items-start gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${allHealthy ? "bg-green-500" : "bg-amber-500"}`} />
        <p className="text-xs font-semibold text-slate-700 leading-tight flex-1">{goal.name}</p>
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">
        Goal · {enabledCount} of {goal.commitments.length} commitment{goal.commitments.length === 1 ? "" : "s"}
      </p>
    </button>
  );
}

function StandaloneCard({ commitment, onClick }: { commitment: StandaloneCommitment; onClick: () => void }) {
  const isHardLimit = commitment.hardLimit != null;
  const auto = ({ 1: "L1", 2: "L2", 3: "L3", 4: "L4" } as const)[commitment.autonomyLevel];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border hover:shadow-sm transition-all p-2.5 ${
        isHardLimit ? "bg-red-50 border-red-200 hover:border-red-300" : "bg-white border-slate-200 hover:border-[#00BDFE]/50"
      }`}
    >
      <div className="flex items-start gap-1.5 mb-1">
        <span className={`text-[10px] mt-0.5 flex-shrink-0 ${isHardLimit ? "text-red-500" : "text-slate-400"}`}>{isHardLimit ? "🔒" : "◆"}</span>
        <p className={`text-xs font-medium leading-tight flex-1 ${isHardLimit ? "text-red-700" : "text-slate-700"}`}>{commitment.promise}</p>
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">Commitment · {auto}{isHardLimit ? " · Hard limit" : ""}</p>
    </button>
  );
}

// ─── Floating lane row — span bar that crosses stage columns ─────────────────
// Renders a goal/commitment that spans multiple stages as a horizontal bar
// positioned across the column grid. The bar is clickable to open the drawer.

function FloatingLaneItem({
  spans, label, sublabel, triggered, onClick,
}: { spans: [number, number]; label: string; sublabel: string; triggered?: boolean; onClick: () => void }) {
  const [start, end] = spans;
  const stageCount = STAGE_NAMES.length;
  const leftPct = (start / stageCount) * 100;
  const widthPct = ((end - start + 1) / stageCount) * 100;
  return (
    <div className="relative h-9">
      <button
        onClick={onClick}
        className={`absolute top-0 bottom-0 rounded-md border ${triggered ? "bg-amber-50 border-amber-300 hover:border-amber-400" : "bg-sky-50 border-sky-200 hover:border-sky-400"} hover:shadow-sm transition-all px-2.5 text-left flex items-center gap-2 overflow-hidden`}
        style={{ left: `${leftPct}%`, width: `calc(${widthPct}% - 4px)` }}
      >
        {triggered && <span className="text-[10px] flex-shrink-0">⚡</span>}
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold truncate ${triggered ? "text-amber-800" : "text-sky-800"}`}>{label}</p>
          <p className={`text-[10px] truncate ${triggered ? "text-amber-600" : "text-sky-600"}`}>{sublabel}</p>
        </div>
      </button>
    </div>
  );
}

// ─── Pending Changes panel ──────────────────────────────────────────────────
// Drafts queue shown in the right column. Each row carries its routing
// destination so the chain of authority is visible.

function PendingPanel({ changes, currentPersona, accessTier, onSimulate }: { changes: PendingChange[]; currentPersona: string; accessTier: ConfigAccessTier; onSimulate: (change: PendingChange) => void }) {
  const access = CONFIG_ACCESS_META[accessTier];
  const myDrafts = changes.filter(c => c.draftedById === currentPersona);
  const awaitingMe = changes.filter(c => c.routedTo === currentPersona && c.draftedById !== currentPersona);
  const others = changes.filter(c => c.draftedById !== currentPersona && c.routedTo !== currentPersona);

  return (
    <div className="space-y-3">
      {awaitingMe.length > 0 && (
        <Section title={`Awaiting your review (${awaitingMe.length})`} accent="amber">
          {awaitingMe.map(c => <PendingCard key={c.id} change={c} canPublish={access.canPublish} onSimulate={() => onSimulate(c)} />)}
        </Section>
      )}
      {myDrafts.length > 0 && (
        <Section title={`Your drafts (${myDrafts.length})`} accent="sky">
          {myDrafts.map(c => <PendingCard key={c.id} change={c} canPublish={access.canPublish} onSimulate={() => onSimulate(c)} />)}
        </Section>
      )}
      {others.length > 0 && (
        <Section title={`Other pending (${others.length})`} accent="slate">
          {others.map(c => <PendingCard key={c.id} change={c} canPublish={access.canPublish} onSimulate={() => onSimulate(c)} />)}
        </Section>
      )}
      {changes.length === 0 && (
        <p className="text-slate-400 text-xs italic px-1">No pending changes.</p>
      )}
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent: "amber" | "sky" | "slate"; children: React.ReactNode }) {
  const colour = accent === "amber" ? "text-amber-700" : accent === "sky" ? "text-sky-700" : "text-slate-500";
  return (
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${colour}`}>{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function PendingCard({ change, canPublish, onSimulate }: { change: PendingChange; canPublish: boolean; onSimulate: () => void }) {
  const routedToLabel = PERSONAS.find(p => p.id === change.routedTo)?.label ?? change.routedTo;
  const showHighRisk = change.reviewState === "needs_authoriser";
  return (
    <div className={`rounded-lg border bg-white p-2.5 text-xs ${showHighRisk ? "border-l-4 border-l-amber-400 border-y border-r border-y-amber-200 border-r-amber-200" : "border-slate-200"}`}>
      <p className="text-slate-700 font-semibold leading-snug">{change.target}</p>
      <p className="text-slate-500 text-[11px] leading-snug mt-1">
        <span className="text-slate-400">{change.before}</span>
        <span className="text-slate-400 mx-1">→</span>
        <span className="text-slate-700 font-medium">{change.after}</span>
      </p>
      <div className="mt-1.5 text-[10px] text-slate-500 leading-snug">
        <p>{change.scope} · {change.blastRadius}</p>
        <p className="mt-0.5">By {change.draftedBy} · {change.draftedAt} · {showHighRisk ? <span className="text-amber-700 font-semibold">⚠ Authoriser only</span> : <span>Routes to {routedToLabel}</span>}</p>
      </div>
      {/* Simulate is always available — non-publishers can still inspect what
          a draft would do before deciding to advocate for or against it. */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={onSimulate} className="text-[11px] px-2 py-1 rounded border border-[#00BDFE] text-[#0077a8] hover:bg-[#e0f7ff] font-medium">▶ Simulate</button>
        {canPublish && (
          <>
            <button onClick={onSimulate} className="text-[11px] px-2 py-1 rounded bg-[#00BDFE] hover:bg-[#0099d4] text-white font-medium">Approve &amp; publish</button>
            <button className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">Request changes</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ConfigurationView({ persona, onBack }: Props) {
  const personaMeta = PERSONAS.find(p => p.id === persona)!;
  const accessTier = personaMeta.configAccess;
  const access = CONFIG_ACCESS_META[accessTier];

  // Drawer state — single drawer for both goals and standalones
  const [openGoal, setOpenGoal] = useState<Goal | null>(null);
  const [openStandalone, setOpenStandalone] = useState<StandaloneCommitment | null>(null);
  // Local pending-changes state seeded from the static data so drafts added
  // during the session show up in the panel.
  const [pendingChanges, setPendingChanges] = useState(() => [...PENDING_CHANGES]);
  // Local audit state seeded from CONFIG_AUDIT — published changes append here.
  const [auditEntries, setAuditEntries] = useState<ConfigAuditEntry[]>(() => [...CONFIG_AUDIT]);
  // Simulation modal — open when an operator clicks Simulate (or Approve &
  // publish, which goes through simulation as the default path).
  const [simulating, setSimulating] = useState<PendingChange | null>(null);
  // New client wizard — open from the workflow selector "+ New client" button.
  const [wizardOpen, setWizardOpen] = useState(false);
  // Toast feedback when a draft is added.
  const [toast, setToast] = useState<string | null>(null);

  // Resolve a simulation result for a pending change. Seeded data preferred;
  // otherwise heuristic generation based on changeType.
  const simulationFor = (change: PendingChange) =>
    SEEDED_SIMULATIONS[change.id] ?? simulateChange(change);

  // Open simulation modal for a given pending change.
  const handleSimulate = (change: PendingChange) => setSimulating(change);

  // New client wizard — publishing creates an audit entry. In production this
  // would also instantiate the cloned workflow, wire intake channels, and
  // create the client record. Prototype scope: the audit log entry is the
  // visible artefact.
  const handleNewClientPublish = (payload: NewClientPublish) => {
    const baseLabels: Record<string, string> = {
      starlink:     "Starlink Install",
      hn:           "Harvey Norman Install",
      insurance:    "Insurance Repair",
      construction: "AHO Construction",
      fm:           "Facilities Management",
      blank:        "universal-only baseline",
    };
    const baseLabel = baseLabels[payload.workflowBase] ?? payload.workflowBase;
    const entry: ConfigAuditEntry = {
      id: `CA-${Date.now()}`,
      publishedBy: personaMeta.label,
      publishedAt: "Just now",
      changeType: "new-goal",
      target: `New client onboarded — ${payload.clientName}`,
      summary: `Cloned ${baseLabel} workflow as base. ABN ${payload.abn} · ${payload.billingTerms} · ${payload.integrationChannel} · projected volume ${payload.volumeEstimate}. Initial autonomy posture conservative (L2 across AI commitments). ${payload.notes ? `Note: ${payload.notes}` : ""}`,
      version: "v1.0",
    };
    setAuditEntries(curr => [entry, ...curr]);
    setWizardOpen(false);
    setToast(`Client onboarded — ${payload.clientName}`);
    setTimeout(() => setToast(null), 2800);
  };

  // Publish from within the simulation modal — moves the draft to the audit
  // log, removes it from pending, and shows confirmation.
  const handlePublishFromSimulation = () => {
    if (!simulating) return;
    const entry: ConfigAuditEntry = {
      id: `CA-${Date.now()}`,
      publishedBy: personaMeta.label,
      publishedAt: "Just now",
      changeType: simulating.changeType,
      target: simulating.target,
      summary: `${simulating.before} → ${simulating.after}. Published with simulation log.${simulating.notes ? ` ${simulating.notes}` : ""}`,
      version: "v.next",
    };
    setAuditEntries(curr => [entry, ...curr]);
    setPendingChanges(curr => curr.filter(c => c.id !== simulating.id));
    setSimulating(null);
    setToast("Published — simulation log attached to audit");
    setTimeout(() => setToast(null), 2400);
  };

  const handleDraftChange = (entry: DraftEntry) => {
    // Routing: high-risk drafts (L4 promotion, threshold override, hard-limit
    // edits) always route to Authoriser regardless of who drafted them.
    // Otherwise, Reviewer and above can self-publish; Drafters route to
    // National for review.
    const routedTo = entry.highRisk
      ? "aaron"
      : access.canPublish
      ? persona
      : "national";
    const reviewState: PendingChange["reviewState"] = entry.highRisk && persona !== "aaron"
      ? "needs_authoriser"
      : access.canPublish
      ? "approved"
      : "awaiting_review";
    const newChange: PendingChange = {
      id: `PC-${Date.now()}`,
      draftedBy: personaMeta.label,
      draftedById: persona,
      draftedAt: "Just now",
      changeType: entry.changeType,
      target: entry.target,
      before: entry.before,
      after: entry.after,
      scope: openGoal ? `${openGoal.name} · ${openGoal.usedInWorkflows.length} workflows` : "Standalone commitment",
      blastRadius: openGoal ? `${openGoal.usedInWorkflows.length} workflow${openGoal.usedInWorkflows.length === 1 ? "" : "s"} · prototype scope` : "1 commitment · prototype scope",
      reviewState,
      routedTo,
      notes: entry.notes,
    };
    setPendingChanges(curr => [newChange, ...curr]);
    setOpenGoal(null);
    setOpenStandalone(null);
    setToast(reviewState === "approved" ? "Published — added to audit" : "Draft added to Pending Changes");
    setTimeout(() => setToast(null), 2400);
  };

  // Partition Starlink goals + standalones by anchor for the canvas vs
  // floating lane.
  const stagedGoals       = useMemo(() => STARLINK_GOALS.filter(g => g.anchor.kind === "staged"), []);
  const floatingGoals     = useMemo(() => STARLINK_GOALS.filter(g => g.anchor.kind !== "staged"), []);
  const stagedStandalones = useMemo(() => STARLINK_STANDALONE.filter(s => s.anchor.kind === "staged"), []);
  const floatingStandalones = useMemo(() => STARLINK_STANDALONE.filter(s => s.anchor.kind !== "staged"), []);

  // Group items by stage for the canvas columns.
  const itemsByStage = useMemo(() => {
    const map: Array<Array<{ kind: "goal"; goal: Goal } | { kind: "standalone"; commitment: StandaloneCommitment }>> = STAGE_NAMES.map(() => []);
    for (const g of stagedGoals) {
      if (g.anchor.kind === "staged") map[g.anchor.stage].push({ kind: "goal", goal: g });
    }
    for (const s of stagedStandalones) {
      if (s.anchor.kind === "staged") map[s.anchor.stage].push({ kind: "standalone", commitment: s });
    }
    return map;
  }, [stagedGoals, stagedStandalones]);

  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={onBack} className="text-[#00BDFE] hover:text-[#0099d4] text-sm">← Back</button>
          <h2 className="text-slate-800 font-bold text-lg mt-1">Configuration — Workflows & Commitments</h2>
          <p className="text-slate-400 text-xs mt-0.5">Configuration not Code. Edits create drafts, drafts are reviewed via diff with blast radius, history is immutable once published.</p>
        </div>
      </div>

      {/* Access banner */}
      <div className={`rounded-xl border p-3 ${access.bg} ${access.border}`}>
        <div className="flex items-start gap-3">
          <div className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${access.color} bg-white border ${access.border} flex-shrink-0`}>
            {access.label}
          </div>
          <p className={`text-xs leading-snug ${access.color}`}>
            <span className="font-semibold">{personaMeta.label}</span> · {personaMeta.title}. {access.description}
          </p>
        </div>
      </div>

      {/* Workflow selector + new-client wizard entry */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mr-1">Workflow:</span>
        <button className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-[#00BDFE] border-[#00BDFE] text-white">📡 Starlink Install</button>
        <button disabled className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-300 bg-slate-50">📺 Harvey Norman</button>
        <button disabled className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-300 bg-slate-50">🛡 Insurance</button>
        <button disabled className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-300 bg-slate-50">🏗 Construction</button>
        <span className="text-slate-200 mx-1">·</span>
        <button
          onClick={() => setWizardOpen(true)}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-dashed border-[#00BDFE] text-[#0077a8] hover:bg-[#e0f7ff] transition-colors"
          title="Onboard a new client / workflow"
        >
          + New client
        </button>
      </div>

      <div className="flex gap-4 items-start">

        {/* ── Workflow canvas (left, takes most width) ───────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 p-4">

          {/* Stage columns */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${STAGE_NAMES.length}, minmax(0, 1fr))` }}>
            {STAGE_NAMES.map((stage, idx) => (
              <div key={stage} className="space-y-1.5">
                <div className="text-center pb-2 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 font-mono">{idx + 1}</p>
                  <p className="text-xs font-semibold text-slate-700">{stage}</p>
                </div>
                <div className="space-y-1.5 min-h-[100px]">
                  {itemsByStage[idx].length === 0 ? (
                    <p className="text-[10px] text-slate-300 italic text-center pt-3">—</p>
                  ) : (
                    itemsByStage[idx].map((item, i) =>
                      item.kind === "goal"
                        ? <GoalCard key={i} goal={item.goal} onClick={() => { setOpenGoal(item.goal); setOpenStandalone(null); }} />
                        : <StandaloneCard key={i} commitment={item.commitment} onClick={() => { setOpenStandalone(item.commitment); setOpenGoal(null); }} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Floating lane */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Floating</p>
              <p className="text-slate-400 text-[10px]">Goals/commitments that span stages or activate on event</p>
            </div>
            <div className="space-y-2">
              {floatingGoals.map(g => {
                if (g.anchor.kind === "floating") {
                  return <FloatingLaneItem key={g.id} spans={g.anchor.spans} label={g.name} sublabel={`Goal · ${g.commitments.length} commitments`} onClick={() => { setOpenGoal(g); setOpenStandalone(null); }} />;
                }
                if (g.anchor.kind === "triggered") {
                  return <FloatingLaneItem key={g.id} spans={[g.anchor.stage, g.anchor.stage]} label={g.name} sublabel={`Triggered · ${g.anchor.trigger}`} triggered onClick={() => { setOpenGoal(g); setOpenStandalone(null); }} />;
                }
                return null;
              })}
              {floatingStandalones.map(s => {
                if (s.anchor.kind === "floating") {
                  return <FloatingLaneItem key={s.id} spans={s.anchor.spans} label={s.promise} sublabel="Commitment · floating" onClick={() => { setOpenGoal(null); setOpenStandalone(s); }} />;
                }
                if (s.anchor.kind === "triggered") {
                  return <FloatingLaneItem key={s.id} spans={[s.anchor.stage, s.anchor.stage]} label={s.promise} sublabel={`Triggered · ${s.anchor.trigger}`} triggered onClick={() => { setOpenGoal(null); setOpenStandalone(s); }} />;
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* ── Right column: Pending Changes + Audit ──────────────────────── */}
        <div className="w-72 xl:w-80 flex-shrink-0 space-y-4">

          {/* Pending Changes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-slate-700 font-semibold text-sm">Pending Changes</h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">{pendingChanges.length}</span>
            </div>
            <PendingPanel changes={pendingChanges} currentPersona={persona} accessTier={accessTier} onSimulate={handleSimulate} />
          </div>

          {/* Recent Audit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <h3 className="text-slate-700 font-semibold text-sm mb-2">Recent published changes</h3>
            <div className="space-y-1.5">
              {auditEntries.map(a => {
                const simulated = a.summary.includes("simulation log");
                return (
                  <div key={a.id} className={`border-l-2 pl-2 text-xs ${simulated ? "border-[#00BDFE]" : "border-slate-200"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-slate-700 font-medium leading-snug flex-1">{a.target}</p>
                      {simulated && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-[#e0f7ff] border-[#00BDFE]/30 text-[#0077a8] flex-shrink-0">Simulated</span>}
                    </div>
                    <p className="text-slate-500 text-[11px] leading-snug mt-0.5">{a.summary}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{a.publishedBy} · {a.publishedAt} · {a.version}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Library link — placeholder for the library surface deferred from MVP */}
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-3 text-xs">
            <p className="text-slate-500 font-semibold mb-1">Library</p>
            <p className="text-slate-400 leading-snug">
              Goal-first searchable list with cross-cutting templates and standalone commitments. Deferred from MVP — same edit drawer applies.
            </p>
          </div>

          {/* Simulation — now active. Open from any pending change card via
              the ▶ Simulate button (or the Approve & publish flow, which
              routes through simulation as the default path). */}
          <div className="bg-[#e0f7ff]/40 rounded-2xl border border-[#00BDFE]/20 p-3 text-xs">
            <p className="text-[#0077a8] font-semibold mb-1">Simulation — active</p>
            <p className="text-slate-500 leading-snug">
              Replay any pending change against the last 32 days of historical jobs before publishing. Click <span className="text-[#0077a8] font-semibold">▶ Simulate</span> on any draft to see projected metric deltas, side effects, and example jobs that would have behaved differently.
            </p>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <GoalDrawer
        open={openGoal !== null || openStandalone !== null}
        goal={openGoal}
        standalone={openStandalone}
        accessTier={accessTier}
        personaName={personaMeta.label}
        onClose={() => { setOpenGoal(null); setOpenStandalone(null); }}
        onDraftChange={handleDraftChange}
      />

      {/* Simulation modal — opens from any pending change card. Approve &
          publish moves the change from pending to audit. */}
      {simulating && (
        <SimulationModal
          change={simulating}
          result={simulationFor(simulating)}
          canPublish={access.canPublish}
          onCancel={() => setSimulating(null)}
          onPublish={handlePublishFromSimulation}
        />
      )}

      {/* New client wizard — opens from the "+ New client" button in the
          workflow selector row. Demonstrates the Configuration-not-Code
          claim: a new client is configured (cloned + customised) rather
          than coded. */}
      {wizardOpen && (
        <NewClientWizard
          accessTier={accessTier}
          onCancel={() => setWizardOpen(false)}
          onPublish={handleNewClientPublish}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fadeIn">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
