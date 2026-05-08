// ─────────────────────────────────────────────────────────────────────────────
// Service Tickets — Hubspot integration surface
//
// Hubspot is the assumed CRM / ticketing platform. Tickets live there;
// CoreTechX ingests them, links them to operational artefacts (jobs, trades),
// surfaces operational consequences, and drives the cascade for severe
// events. Status flows bidirectionally — Mission Control updates Hubspot
// when an action is taken; Hubspot updates Mission Control when the ticket
// state changes.
//
// Two scenarios anchor the design:
//   1. Customer complaint on a previously-clean job — the ticket is the FIRST
//      signal something is wrong (the operational layer didn't flag it).
//   2. Significant trade event (withdrawal / injury) — operational cascade
//      that affects multiple jobs, customers, and triggers regulatory
//      commitments.
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceTicketType =
  | "customer_complaint"   // post-completion quality / satisfaction issue
  | "customer_query"       // information request, not a complaint
  | "billing_query"        // client/customer asking about invoice / pricing
  | "trade_request"        // trade asking us a question
  | "trade_withdrawal"     // trade leaving the network
  | "trade_injury"         // workplace incident — potentially notifiable
  | "other";

export type ServiceTicketStatus =
  | "open"                 // newly created, not yet triaged
  | "in_progress"          // assigned, work underway
  | "awaiting_customer"    // waiting on customer response
  | "awaiting_trade"       // waiting on trade response
  | "escalated"            // bumped up the chain (Aaron, safety officer, etc.)
  | "resolved"             // closed with resolution
  | "closed";              // closed without resolution (e.g. duplicate)

export type ServiceTicketSeverity = "low" | "medium" | "high" | "critical";

export type ServiceTicketChannel = "phone" | "email" | "chat" | "portal" | "system";

// Cascade event — for severe tickets where the ticket triggers multiple
// operational consequences. Each event is timestamped, captures the actor
// (often AI Cascade Agent or AI Service Agent), and tracks status.
export type CascadeEvent = {
  time: string;
  event: string;            // human-readable description
  actor: string;            // who/what did this — "AI Cascade Agent", "Maya", etc.
  status: "done" | "in_progress" | "pending" | "blocked";
  jobRef?: string;          // optional job ref this event touches
  hardLimit?: boolean;      // true if this event is a hard-limit action (e.g. SafeWork notification)
};

export type ServiceTicket = {
  id: string;                  // Hubspot ticket ref e.g. "HS-44892"
  type: ServiceTicketType;
  status: ServiceTicketStatus;
  severity: ServiceTicketSeverity;
  channel: ServiceTicketChannel;

  // Linkage
  jobIds: string[];            // jobs this ticket touches
  tradeName?: string;          // trade this ticket touches (for trade events / complaints)
  customerName?: string;
  clientName?: string;         // for billing queries — "Allianz", "Harvey Norman", etc.

  // Content
  subject: string;
  summary: string;             // plain-English summary of the ticket

  // AI handling
  aiTriaged: boolean;
  aiRecommendedAction?: string;
  aiRecommendedOwner?: string; // persona id

  // Lifecycle
  createdAt: string;           // human-readable e.g. "Today 11:14"
  updatedAt: string;
  assignedTo?: string;         // persona id (current owner)
  resolvedAt?: string;
  resolution?: string;

  // Cascade — populated for severe tickets that trigger multi-step operational
  // consequences (canonical example: trade injury).
  cascadeEvents?: CascadeEvent[];
};

// ─── Seeded tickets ─────────────────────────────────────────────────────────
// Spread covers: trade injury cascade (the rich centerpiece), customer
// complaint on a previously-clean job, customer query (low-severity), trade
// withdrawal, billing query, trade request, and one historical resolved item
// for the audit trail.

export const SERVICE_TICKETS: ServiceTicket[] = [

  // 1. The canonical severe scenario — trade injury cascade
  {
    id: "HS-44892",
    type: "trade_injury",
    status: "in_progress",
    severity: "critical",
    channel: "phone",
    jobIds: ["CG36080"],          // primary site of incident
    tradeName: "Metro Handyman Services Pty Ltd",
    customerName: "P. Whitfield",  // customer at site of incident
    subject: "Lead installer fall on roof — suspected fracture",
    summary: "Metro Handyman lead installer fell from roof at customer site (CG36080) at approximately 11:10am. Suspected ankle fracture. Ambulance attended; customer's young child witnessed event. Trade contacted Maya immediately. Notifiable injury — SafeWork NSW 24h reporting clock active.",
    aiTriaged: true,
    aiRecommendedAction: "Cascade response: secure site (Troy en route), pause Metro Handyman allocations, notify affected customers (4 jobs today), trigger SafeWork notification commitment, brief Aaron + safety officer.",
    aiRecommendedOwner: "maya",
    createdAt: "Today 11:14",
    updatedAt: "Today 11:32",
    assignedTo: "maya",
    cascadeEvents: [
      { time: "11:14", event: "Hubspot ticket created from inbound phone call. AI Service Agent triaged as critical.", actor: "AI Service Agent", status: "done" },
      { time: "11:14", event: "Notified Maya, Aaron, Logan, safety officer.", actor: "AI Cascade Agent", status: "done" },
      { time: "11:15", event: "Identified 4 of Metro Handyman's other active jobs for re-allocation review.", actor: "AI Cascade Agent", status: "done", jobRef: "+CG36115, CG36241, +2 more" },
      { time: "11:15", event: "Troy dispatched to CG36080 site (field supervisor floating commitment activated).", actor: "AI Cascade Agent", status: "in_progress" },
      { time: "11:16", event: "Customer at CG36080 notified via Cynnch SMS — incident occurred, will be in touch.", actor: "AI Customer Comms Agent", status: "done", jobRef: "CG36080" },
      { time: "11:17", event: "Metro Handyman compliance status flipped to 'paused pending investigation'.", actor: "AI Compliance Agent", status: "done" },
      { time: "11:17", event: "SafeWork NSW 24h notification commitment activated (notifiable injury — hard limit).", actor: "AI Compliance Agent", status: "in_progress", hardLimit: true },
      { time: "11:20", event: "Metro Handyman's 4 active jobs flagged for re-allocation. Shadow plans pre-checked.", actor: "AI Trade Matching Agent", status: "in_progress" },
      { time: "11:32", event: "Aaron + safety officer brief. Action plan agreed.", actor: "Maya", status: "done" },
      { time: "—", event: "SafeWork NSW notification (Aaron sign-off required, 24h hard limit).", actor: "Aaron", status: "pending", hardLimit: true },
      { time: "—", event: "Re-allocate Metro Handyman's 4 active jobs.", actor: "Logan", status: "pending" },
      { time: "—", event: "Trade investigation + return-to-work plan.", actor: "Troy + safety officer", status: "pending" },
    ],
  },

  // 2. Customer complaint on a previously-clean job — the "first signal" case
  {
    id: "HS-44755",
    type: "customer_complaint",
    status: "open",
    severity: "medium",
    channel: "phone",
    jobIds: ["CG35958"],          // Point Clare HN install — was a happy path
    tradeName: "UNITED INFOCOM TECH PTY LTD",
    customerName: "M. Stavros",
    subject: "TV mounted off-level — customer wants trade to return",
    summary: "Customer rang to report TV is mounted approximately 8 degrees off level. Job was completed yesterday, evidence pack passed QA, customer signed off at install. Customer requests trade return at no cost. AI assessed: legitimate quality issue, not customer misuse.",
    aiTriaged: true,
    aiRecommendedAction: "Trade return at no cost. UNITED INFOCOM is high-performer with no prior complaints in 6 months — likely one-off. Send polite request via Chekku; no formal warning warranted at this stage. Track outcome for trade quality scoring.",
    aiRecommendedOwner: "maya",
    createdAt: "Today 09:42",
    updatedAt: "Today 09:43",
    assignedTo: "maya",
  },

  // 3. Trade withdrawal — operational impact, less severe than injury
  {
    id: "HS-44783",
    type: "trade_withdrawal",
    status: "in_progress",
    severity: "high",
    channel: "email",
    jobIds: ["CG36110"],          // Sandbar already in compliance trouble
    tradeName: "Sandbar Electrical Services",
    subject: "Trade requesting to leave Circl network — effective end of week",
    summary: "Sandbar Electrical owner emailed to advise they are exiting the contractor network at end of this week. Cited business pressure (SWMS gap was a precipitating factor — they don't have admin capacity to maintain compliance docs at our cadence). 1 active job (CG36110) requires re-allocation. Coverage gap implication for the Mid North Coast corridor (P-039 already active).",
    aiTriaged: true,
    aiRecommendedAction: "Re-allocate CG36110 to DRC Solar (already shadow-reserved). Update P-039 strategic pattern with worsening severity. Maya to handle exit conversation; Logan to assess corridor recruitment (already with Aaron in deferral chain).",
    aiRecommendedOwner: "maya",
    createdAt: "Yesterday 14:20",
    updatedAt: "Today 08:15",
    assignedTo: "maya",
    cascadeEvents: [
      { time: "Yesterday 14:20", event: "Hubspot ticket created from inbound email.", actor: "AI Service Agent", status: "done" },
      { time: "Yesterday 14:21", event: "Identified Sandbar's 1 active job (CG36110); shadow trade DRC Solar already reserved.", actor: "AI Cascade Agent", status: "done", jobRef: "CG36110" },
      { time: "Yesterday 14:21", event: "Linked to active strategic pattern — Mid North Coast coverage gap (P-039) — worsening implication.", actor: "AI Cascade Agent", status: "done" },
      { time: "Today 08:15", event: "Maya called Sandbar owner; confirmed exit, agreed graceful handover. CG36110 re-allocation to be confirmed.", actor: "Maya", status: "done" },
      { time: "—", event: "Re-allocate CG36110 to DRC Solar.", actor: "Sharon (T1)", status: "pending", jobRef: "CG36110" },
      { time: "—", event: "Update strategic pattern P-039 with worsening severity.", actor: "AI Cascade Agent", status: "pending" },
    ],
  },

  // 4. Customer query (low-severity, AI handled most of it)
  {
    id: "HS-44820",
    type: "customer_query",
    status: "awaiting_customer",
    severity: "low",
    channel: "chat",
    jobIds: ["CG36080"],
    customerName: "P. Whitfield",
    subject: "How do I connect a second device to my Starlink router?",
    summary: "Customer asked via Cynnch chat about adding a second device. AI Service Agent provided the standard support article + offered to send a follow-up if not enough. Customer hasn't responded in 2h — Maya would close in 24h if no further response.",
    aiTriaged: true,
    aiRecommendedAction: "No action required — AI provided support article. Auto-close in 24h if no response. Note: this customer is also tied to the active CG36080 incident; check that the support article wasn't seen as inappropriate timing.",
    aiRecommendedOwner: "maya",
    createdAt: "Today 08:50",
    updatedAt: "Today 09:05",
    assignedTo: "maya",
  },

  // 5. Billing query from insurer
  {
    id: "HS-44801",
    type: "billing_query",
    status: "open",
    severity: "medium",
    channel: "email",
    jobIds: ["CG36069"],          // Mardi scope variation
    clientName: "Allianz Australia Insurance Ltd",
    customerName: "H. Osei",
    subject: "Allianz requesting clarification on +$1,800 variation",
    summary: "Allianz claims processor emailed asking for the photographic evidence and itemised cost breakdown that supported the +$1,800 variation submitted by TAYLOR MADE on CG36069. Variation has not yet been approved by Aaron (hard-limit decision pending in his queue). Maya to coordinate response with Mei (Finance) once available.",
    aiTriaged: true,
    aiRecommendedAction: "Forward photo evidence pack to Allianz via portal. Hold formal approval response until Aaron has signed off the variation. Cross-reference with PendingChanges item routed to Aaron.",
    aiRecommendedOwner: "maya",
    createdAt: "Today 10:18",
    updatedAt: "Today 10:18",
    assignedTo: "maya",
  },

  // 6. Trade request — compliance question
  {
    id: "HS-44841",
    type: "trade_request",
    status: "in_progress",
    severity: "low",
    channel: "chat",
    jobIds: [],
    tradeName: "Coastal Comms Pty Ltd",
    subject: "Question about new SWMS requirement",
    summary: "Coastal Comms asked via Chekku chat whether the SWMS template was updated last week. Their previous version is from Feb. AI Service Agent provided the latest template + 14-day grace period for resubmission. Trade acknowledged.",
    aiTriaged: true,
    aiRecommendedAction: "No action required — AI handled. Logged for compliance tracking.",
    aiRecommendedOwner: "maya",
    createdAt: "Today 07:32",
    updatedAt: "Today 07:34",
    resolvedAt: "Today 07:34",
    resolution: "Latest SWMS template provided via Chekku. Trade acknowledged. 14-day grace period to resubmit.",
  },

  // 7. Resolved historical example — for audit trail
  {
    id: "HS-44712",
    type: "customer_complaint",
    status: "resolved",
    severity: "medium",
    channel: "phone",
    jobIds: ["CG35954"],
    tradeName: "York Digital Solutions",
    customerName: "J. Papadopoulos",
    subject: "Dish intermittent — needs reset",
    summary: "Customer reported intermittent service 3 days post-install. Trade returned next business day, identified loose connector, fixed at no cost. Customer satisfied (CSAT 4/5 on follow-up survey).",
    aiTriaged: true,
    aiRecommendedOwner: "maya",
    assignedTo: "maya",
    createdAt: "5 days ago",
    updatedAt: "3 days ago",
    resolvedAt: "3 days ago",
    resolution: "Trade returned within 24h, identified loose connector, fixed at no cost. Customer signed satisfaction survey (4/5).",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** All tickets visible to a given persona. For prototype: Maya sees all,
 *  other personas see tickets that touch jobs in their visibility scope. */
export function ticketsForPersona(personaId: string): ServiceTicket[] {
  if (personaId === "maya" || personaId === "national" || personaId === "aaron") {
    return SERVICE_TICKETS;
  }
  // Other personas see only tickets that touch their jobs — handled by
  // Job-level lookup; this helper returns the open ticket list scoped to
  // critical/high severity that they should be aware of.
  return SERVICE_TICKETS.filter(t => t.severity === "critical" || t.severity === "high");
}

/** Tickets attached to a specific job — used by the Service Activity panel
 *  on JobDetail. */
export function ticketsForJob(jobId: string): ServiceTicket[] {
  return SERVICE_TICKETS.filter(t => t.jobIds.includes(jobId));
}

/** Active (non-resolved) tickets — used for queue counts and Aaron's safety
 *  outcome card. */
export function activeTickets(): ServiceTicket[] {
  return SERVICE_TICKETS.filter(t => t.status !== "resolved" && t.status !== "closed");
}

/** Active critical tickets — used for cross-cutting alerts (Safety outcome
 *  card flips when there's an active critical incident). */
export function activeCriticalTickets(): ServiceTicket[] {
  return activeTickets().filter(t => t.severity === "critical");
}

// ─── Display metadata ───────────────────────────────────────────────────────

export const TICKET_TYPE_META: Record<ServiceTicketType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  customer_complaint: { label: "Complaint",        icon: "!",  color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  customer_query:     { label: "Query",            icon: "?",  color: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200" },
  billing_query:      { label: "Billing query",    icon: "$",  color: "text-violet-700", bg: "bg-violet-50",  border: "border-violet-200" },
  trade_request:      { label: "Trade request",    icon: "@",  color: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200" },
  trade_withdrawal:   { label: "Trade exit",       icon: "↗",  color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  trade_injury:       { label: "Trade incident",   icon: "⚠",  color: "text-red-700",    bg: "bg-red-50",     border: "border-red-300" },
  other:              { label: "Other",            icon: "•",  color: "text-slate-600",  bg: "bg-slate-50",   border: "border-slate-200" },
};

export const TICKET_SEVERITY_META: Record<ServiceTicketSeverity, { label: string; color: string; bg: string; border: string; accent: string }> = {
  low:      { label: "Low",      color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-200",  accent: "border-l-slate-300" },
  medium:   { label: "Medium",   color: "text-amber-700",  bg: "bg-amber-100",  border: "border-amber-200",  accent: "border-l-amber-400" },
  high:     { label: "High",     color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200", accent: "border-l-orange-400" },
  critical: { label: "Critical", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300",    accent: "border-l-red-500" },
};

export const TICKET_STATUS_META: Record<ServiceTicketStatus, { label: string; color: string }> = {
  open:               { label: "Open",               color: "text-amber-700" },
  in_progress:        { label: "In progress",        color: "text-sky-700" },
  awaiting_customer:  { label: "Awaiting customer",  color: "text-slate-600" },
  awaiting_trade:     { label: "Awaiting trade",     color: "text-slate-600" },
  escalated:          { label: "Escalated",          color: "text-red-700" },
  resolved:           { label: "Resolved",           color: "text-green-700" },
  closed:             { label: "Closed",             color: "text-slate-500" },
};
