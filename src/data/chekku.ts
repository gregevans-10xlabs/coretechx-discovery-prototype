// ─── Chekku Trade View Data ───────────────────────────────────────────────────
// "Employment Hero for Trades" — AI handles everything routine, trade acts only when required

export type TradeJob = {
  id: string;
  customer: string;
  suburb: string;
  type: string;
  window: string;
  status: "confirmed" | "action_required" | "completed" | "upcoming";
  actionRequired?: string;
  aiHandled?: string;
  conf: number;
  earnings: number;
};

export type ComplianceDoc = {
  label: string;
  status: "valid" | "expiring_soon" | "expired";
  expiry: string;
};

export type AILogEntry = {
  time: string;
  action: string;
  detail: string;
  type: "booking" | "comms" | "compliance" | "invoice";
};

export const CHEKKU_TRADE = {
  name: "Marcus Johnson",
  tradeName: "MJ Electrical Services",
  rating: 4.8,
  reviewCount: 312,
  tier: "Verified Trade",
  region: "Sydney Metro",
  guaranteeActive: true,
  earningsThisWeek: 2340,
  earningsTarget: 2800,
  jobsThisWeek: 8,
  jobsCompleted: 6,
};

export const CHEKKU_TODAY: TradeJob[] = [
  {
    id: "JOB-3201",
    customer: "Sarah M.",
    suburb: "Bondi Beach NSW",
    type: "Appliance Install",
    window: "9:00 – 11:00 AM",
    status: "confirmed",
    aiHandled: "AI confirmed booking, sent customer ETA, pre-loaded job checklist",
    conf: 0.94,
    earnings: 310,
  },
  {
    id: "JOB-3204",
    customer: "David K.",
    suburb: "Surry Hills NSW",
    type: "Appliance Install",
    window: "1:00 – 3:00 PM",
    status: "action_required",
    actionRequired: "Customer requested reschedule to tomorrow 10am. Confirm or propose alternative.",
    conf: 0.71,
    earnings: 285,
  },
];

export const CHEKKU_TOMORROW: TradeJob[] = [
  {
    id: "JOB-3215",
    customer: "Priya N.",
    suburb: "Newtown NSW",
    type: "Appliance Install",
    window: "8:00 – 10:00 AM",
    status: "upcoming",
    aiHandled: "AI matched and booked. Customer confirmed. Checklist ready.",
    conf: 0.91,
    earnings: 295,
  },
  {
    id: "JOB-3218",
    customer: "Tom R.",
    suburb: "Glebe NSW",
    type: "Appliance Install",
    window: "11:00 AM – 1:00 PM",
    status: "upcoming",
    aiHandled: "AI matched and booked. Customer confirmed.",
    conf: 0.88,
    earnings: 310,
  },
];

export const CHEKKU_COMPLIANCE: ComplianceDoc[] = [
  { label: "Public Liability Insurance",   status: "valid",          expiry: "30 Jun 2026" },
  { label: "Electrical Contractor Licence",status: "valid",          expiry: "15 Sep 2026" },
  { label: "Police Check",                 status: "expiring_soon",  expiry: "22 Apr 2026" },
  { label: "Working at Heights",           status: "valid",          expiry: "1 Dec 2026"  },
];

export const CHEKKU_AI_LOG: AILogEntry[] = [
  { time: "7:02 AM", action: "Sent customer ETA for JOB-3201",        detail: "Notified Sarah M. that you're en route. ETA 9:05 AM.",                         type: "comms"      },
  { time: "6:48 AM", action: "Loaded job checklist for JOB-3201",     detail: "Pre-loaded Harvey Norman scope: 1× dishwasher install, plumbing connection.",  type: "booking"    },
  { time: "Yesterday 4:15 PM", action: "Booked JOB-3215 for tomorrow", detail: "Matched to your availability. Customer Priya N. confirmed 8–10 AM.",          type: "booking"    },
  { time: "Yesterday 3:50 PM", action: "Invoice sent for JOB-3198",   detail: "$295 invoice dispatched to Harvey Norman. Payment due in 7 days.",              type: "invoice"    },
  { time: "Yesterday 2:30 PM", action: "Compliance reminder sent",    detail: "Police check expires 22 Apr. Renewal link sent to your email.",                 type: "compliance" },
];
