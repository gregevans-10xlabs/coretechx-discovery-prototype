import { useState } from "react";
import type { ConfigAccessTier } from "../data/scenarios";
import { CONFIG_ACCESS_META } from "../data/scenarios";

// NewClientWizard — multi-step modal for onboarding a new client / workflow
// per Aaron's question "How do I onboard a new client workflow?". Demonstrates
// the Configuration-not-Code claim end-to-end: a configuration operation, not
// an engineering project.
//
// MVP scope (prototype): Steps 1, 2, and 7 of the full proposal — basic
// client capture, workflow base selection, review and publish. Steps 3-6
// (overlay editing, autonomy posture, simulation) are implicit; production
// would interleave them through the existing Goal Drawer + autonomy editor +
// SimulationModal. Same draft → review → publish machinery as everything
// else in the configuration system.

type Step = 1 | 2 | 3;

export type NewClientPublish = {
  clientName: string;
  abn: string;
  contactEmail: string;
  contactPhone: string;
  billingTerms: string;
  integrationChannel: string;
  volumeEstimate: string;
  workflowBase: string;
  notes: string;
};

type Props = {
  accessTier: ConfigAccessTier;
  onCancel: () => void;
  onPublish: (payload: NewClientPublish) => void;
};

// Workflow bases the operator can clone or start from
const WORKFLOW_BASES = [
  { id: "starlink",     label: "Clone Starlink Install",      description: "Tier S — Single trade, single visit, rate-card driven. Good for installs of similar shape." },
  { id: "hn",           label: "Clone Harvey Norman Install", description: "Tier S — Retail-customer install with portal sync (HN/JB pattern)." },
  { id: "insurance",    label: "Clone Insurance Repair",      description: "Tier MT — Multi-trade with insurer SLA, scope variations, portal compliance." },
  { id: "construction", label: "Clone AHO Construction",      description: "Tier C — Complex multi-trade with milestone payments, lead-trade coordination." },
  { id: "fm",           label: "Clone Facilities Management", description: "Tier ST — Reactive + preventive maintenance, mostly standing client." },
  { id: "blank",        label: "Start from universal goals",  description: "Universal-only baseline (intake, allocate, evidence, settle). Use when no existing workflow fits." },
];

const INTEGRATION_CHANNELS = [
  "Hubspot ticket source",
  "Dedicated client portal",
  "REST API integration",
  "Email-only (manual intake)",
  "EDI / batch file feed",
];

const BILLING_TERMS_OPTIONS = ["Net 7 days", "Net 14 days", "Net 30 days", "Pay on completion", "Negotiated"];

const VOLUME_ESTIMATES = ["< 10 jobs / month", "10-50 jobs / month", "50-200 jobs / month", "200-1,000 jobs / month", "1,000+ jobs / month"];

export default function NewClientWizard({ accessTier, onCancel, onPublish }: Props) {
  const [step, setStep] = useState<Step>(1);
  const access = CONFIG_ACCESS_META[accessTier];

  // Step 1 fields
  const [clientName, setClientName] = useState("");
  const [abn, setAbn] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [billingTerms, setBillingTerms] = useState("Net 14 days");
  const [integrationChannel, setIntegrationChannel] = useState("Hubspot ticket source");
  const [volumeEstimate, setVolumeEstimate] = useState("10-50 jobs / month");

  // Step 2 fields
  const [workflowBase, setWorkflowBase] = useState("starlink");

  // Step 3 fields
  const [notes, setNotes] = useState("");

  const step1Valid = clientName.trim().length > 0 && abn.trim().length > 0;
  const step2Valid = workflowBase.length > 0;

  const canPublish = step1Valid && step2Valid && access.canPublish;

  const handlePublish = () => {
    onPublish({
      clientName: clientName.trim(),
      abn: abn.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      billingTerms,
      integrationChannel,
      volumeEstimate,
      workflowBase,
      notes: notes.trim(),
    });
  };

  const baseLabel = WORKFLOW_BASES.find(w => w.id === workflowBase)?.label ?? workflowBase;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Onboard new client</p>
              <h2 className="text-slate-800 font-bold text-base mt-0.5">{clientName.trim() || "New client"}</h2>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs">✕ close</button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-3">
            {([
              { n: 1 as Step, label: "Client basics" },
              { n: 2 as Step, label: "Workflow base" },
              { n: 3 as Step, label: "Review & publish" },
            ]).map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${step === s.n ? "" : step > s.n ? "opacity-100" : "opacity-50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s.n ? "bg-[#00BDFE] text-white" : step > s.n ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                  }`}>{step > s.n ? "✓" : s.n}</div>
                  <span className={`text-xs font-medium ${step === s.n ? "text-slate-800" : "text-slate-500"}`}>{s.label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-green-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-snug">Capture the basics. Required: client name and ABN. Other fields can be filled in later but the more we have here, the better the workflow base recommendation in the next step.</p>

              <Field label="Client name *">
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Bunnings Trade Centre" className={inputClass} />
              </Field>
              <Field label="ABN *">
                <input value={abn} onChange={e => setAbn(e.target.value)} placeholder="11-digit Australian Business Number" className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary contact email">
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="ops@client.com.au" className={inputClass} />
                </Field>
                <Field label="Primary contact phone">
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+61 ..." className={inputClass} />
                </Field>
              </div>
              <Field label="Billing terms">
                <select value={billingTerms} onChange={e => setBillingTerms(e.target.value)} className={inputClass}>
                  {BILLING_TERMS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Integration channel">
                <select value={integrationChannel} onChange={e => setIntegrationChannel(e.target.value)} className={inputClass}>
                  {INTEGRATION_CHANNELS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Volume estimate">
                <select value={volumeEstimate} onChange={e => setVolumeEstimate(e.target.value)} className={inputClass}>
                  {VOLUME_ESTIMATES.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-snug">Pick the workflow this client most resembles. Cloning gives them all the goals, commitments, and AI agents from the chosen base. You can customise (overlay) any goal in Step 3 of the production wizard — for the prototype demo, those edits live in the Goal Drawer post-publish.</p>

              <div className="space-y-2">
                {WORKFLOW_BASES.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setWorkflowBase(b.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      workflowBase === b.id ? "border-[#00BDFE] bg-[#e0f7ff]" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-3 h-3 rounded-full border mt-1 flex-shrink-0 ${workflowBase === b.id ? "bg-[#00BDFE] border-[#00BDFE]" : "bg-white border-slate-300"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">{b.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{b.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-snug">Review the new-client config below. Publishing creates the client record, instantiates the chosen workflow base, and routes initial intakes via the integration channel. Conservative autonomy posture by default — AI commitments start at L2 (Recommend) and earn promotion through measured accuracy.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <Detail label="Client" value={clientName} />
                  <Detail label="ABN" value={abn} />
                  <Detail label="Contact email" value={contactEmail || "—"} />
                  <Detail label="Contact phone" value={contactPhone || "—"} />
                  <Detail label="Billing terms" value={billingTerms} />
                  <Detail label="Volume estimate" value={volumeEstimate} />
                  <Detail label="Integration" value={integrationChannel} />
                  <Detail label="Workflow base" value={baseLabel} />
                </div>
              </div>

              <div className="bg-[#e0f7ff]/40 border border-[#00BDFE]/30 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#0077a8] mb-1">What happens on publish</p>
                <ul className="text-xs text-slate-700 space-y-1 leading-snug">
                  <li>• Client record created with above details</li>
                  <li>• Workflow cloned from <span className="font-semibold">{baseLabel}</span> — all goals + commitments + AI agents inherited</li>
                  <li>• Initial autonomy posture: AI commitments at L2 (Recommend, requires human approval); promotion path tracked via accuracy</li>
                  <li>• Intake channel <span className="font-semibold">{integrationChannel}</span> wired and ready to receive jobs</li>
                  <li>• Configuration draft logged to audit trail; Pending Changes panel reflects publish event</li>
                </ul>
              </div>

              <Field label="Internal notes (optional)">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything the team should know about this client onboarding..."
                  className={inputClass}
                />
              </Field>

              {!access.canPublish && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">
                  <p className="font-semibold">Authoriser-only publish</p>
                  <p className="mt-0.5">New-client onboarding is high-leverage — only the Authoriser tier (Aaron) can publish. You can save this as a draft and route to him for approval.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 sticky bottom-0 bg-white flex items-center justify-between gap-2">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as Step)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                ← Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            {step < 3 && (
              <button
                onClick={() => setStep(s => (s + 1) as Step)}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#00BDFE] hover:bg-[#0099d4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
              >
                Next →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#00BDFE] hover:bg-[#0099d4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
              >
                {access.canPublish ? "Publish — onboard client" : "Save as draft (publish requires Authoriser)"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputClass = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#00BDFE] focus:ring-2 focus:ring-[#00BDFE]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-slate-700 text-xs mt-0.5">{value}</p>
    </div>
  );
}
