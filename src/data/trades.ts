// ─── Trade reference data ────────────────────────────────────────────────────
// Trades are Circl's competitive moat. Operators look up trade details when:
// - a customer or trade is calling about a job
// - they're considering allocation / reallocation
// - they're checking compliance before next attendance
// - they're reviewing performance trends
//
// Compliance items are grounded in NSW + QLD requirements as of 2026:
// - NSW Fair Trading licences (Electrical, Plumbing, Builder, etc.)
// - QBCC licences (QLD's broader scheme, required for many trade types regardless of value)
// - Public Liability ($5M / $10M / $20M depending on trade and contract)
// - Workers Compensation (NSW: icare; QLD: WorkCover)
// - White Card (General Construction Induction Training — Safe Work Australia)
// - SWMS (Safe Work Method Statements) — mandatory for all 19 HRCW categories
// - Working at Heights, Confined Spaces, Asbestos Awareness/Removal
// - ARC (Australian Refrigeration Council) — AC/HVAC/refrigeration techs
// - ACMA Cabling Registration — telecommunications/antenna installers
// - HBC (Home Building Compensation) — NSW residential jobs >$20k
//
// Source: NSW Fair Trading, QBCC, Safe Work Australia, ARC, ACMA (Apr 2026).

export type ComplianceStatus = "valid" | "expiring" | "expired" | "outstanding";

export type ComplianceItem = {
  type: string;            // stable id: "electrical_licence_nsw", "swms", etc.
  label: string;           // human-readable: "NSW Electrical Licence"
  authority: string;       // issuer: "NSW Fair Trading", "QBCC", "SafeWork NSW", "ARC", etc.
  status: ComplianceStatus;
  expiry?: string;         // human-friendly date when valid/expiring/expired
  detail?: string;         // optional context (e.g. "outstanding on 3 jobs")
};

export type TradePerformance = {
  onTime: number;          // 0–1
  onTimeTarget: number;
  completion: number;
  completionTarget: number;
  photoEvidence: number;
  photoEvidenceTarget: number;
  customerRating: number;  // 0–5
  reviewCount: number;
  complaints90d: number;
};

export type TradeRecentJob = {
  id: string;
  customer: string;
  suburb: string;
  jobType: string;
  outcome: "complete" | "late" | "complaint" | "cancelled";
  date: string;            // human-friendly
  value?: number;
};

export type Trade = {
  id: string;              // slug, lowercase-no-spaces
  name: string;            // exact match against Job.trade
  tradeTypes: string[];
  region: string;
  abn?: string;
  primaryContact?: string;
  narrative?: string;      // one-line context for operator
  compliance: ComplianceItem[];
  performance: TradePerformance;
  recent: TradeRecentJob[];
};

// ─── 6 fully modelled trades ──────────────────────────────────────────────────

export const TRADES: Trade[] = [

  // — 1. Sandbar Electrical Services — antenna installer, the SWMS issue
  {
    id: "sandbar-electrical",
    name: "Sandbar Electrical Services",
    tradeTypes: ["Antenna Installer", "Electrician"],
    region: "NSW Mid North Coast (2428–2440)",
    abn: "12 345 678 901",
    primaryContact: "Brett Sandford · 0421 ··· ···",
    narrative: "Solid mid-corridor electrician with antenna specialty. Public liability renewed but SWMS lapsed mid-March — flagged on 3 active jobs.",
    compliance: [
      { type: "electrical_licence_nsw",   label: "NSW Electrical Licence (Qualified Supervisor)", authority: "NSW Fair Trading",   status: "valid",       expiry: "Mar 2027" },
      { type: "public_liability",         label: "Public Liability — $10M",                       authority: "icare insurance",    status: "valid",       expiry: "Jul 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",          status: "valid",       expiry: "Jun 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia",status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",       status: "outstanding", detail: "Submitted Mar 2025; expired. 3 jobs flagged. Allocations paused pending re-submission." },
      { type: "working_at_heights",       label: "Working at Heights",                             authority: "SafeWork NSW",       status: "valid",       expiry: "Sep 2026" },
      { type: "test_and_tag",             label: "Test & Tag (electrical equipment)",              authority: "AS/NZS 3760",        status: "valid",       expiry: "Mar 2026", detail: "Due for renewal" },
      { type: "acma_cabling",             label: "ACMA Cabling Registration (Open)",              authority: "ACMA",               status: "valid",       expiry: "Aug 2027" },
    ],
    performance: {
      onTime:           0.86, onTimeTarget:           0.95,
      completion:       0.94, completionTarget:       0.98,
      photoEvidence:    0.79, photoEvidenceTarget:    0.90,
      customerRating:   3.9,  reviewCount: 42,
      complaints90d:    1,
    },
    recent: [
      { id: "CG36055", customer: "S. Patel",       suburb: "Forster",       jobType: "Starlink Install",   outcome: "complete", date: "8 Apr",  value: 359 },
      { id: "CG36041", customer: "T. Henderson",   suburb: "Tuncurry",      jobType: "Starlink Install",   outcome: "complete", date: "7 Apr",  value: 359 },
      { id: "CG36028", customer: "R. Phelps",      suburb: "Pacific Palms", jobType: "Starlink Install",   outcome: "late",     date: "6 Apr",  value: 359 },
      { id: "CG36019", customer: "M. Adcock",      suburb: "Hawks Nest",    jobType: "Starlink Install",   outcome: "complete", date: "5 Apr",  value: 359 },
      { id: "CG35987", customer: "L. Roper",       suburb: "Smiths Lake",   jobType: "Starlink Install",   outcome: "complete", date: "4 Apr",  value: 359 },
      { id: "CG35963", customer: "D. Costas",      suburb: "Coomba Bay",    jobType: "Starlink Install",   outcome: "complete", date: "3 Apr",  value: 359 },
      { id: "CG35945", customer: "P. Whittingham", suburb: "Forster",       jobType: "Starlink Install",   outcome: "complete", date: "2 Apr",  value: 359 },
      { id: "CG35921", customer: "K. Fielding",    suburb: "Tuncurry",      jobType: "Starlink Install",   outcome: "complaint",date: "1 Apr",  value: 359 },
      { id: "CG35903", customer: "B. Marsh",       suburb: "Bulahdelah",    jobType: "Starlink Install",   outcome: "complete", date: "31 Mar", value: 359 },
      { id: "CG35892", customer: "C. Tyrell",      suburb: "Hawks Nest",    jobType: "Starlink Install",   outcome: "complete", date: "30 Mar", value: 359 },
    ],
  },

  // — 2. York Digital Solutions — pattern: photo non-submission
  {
    id: "york-digital",
    name: "York Digital Solutions",
    tradeTypes: ["Antenna Installer", "Telecommunications"],
    region: "NSW Hunter Valley + Lower Mid Coast",
    abn: "98 765 432 101",
    primaryContact: "Daniel York · 0408 ··· ···",
    narrative: "Reliable installs but persistent evidence non-submission. Pattern flagged 8 days ago — last 3 installs missing photo packs (48+ hours).",
    compliance: [
      { type: "electrical_licence_nsw",   label: "NSW Electrical Licence (Restricted)",            authority: "NSW Fair Trading",    status: "valid",       expiry: "Nov 2026" },
      { type: "public_liability",         label: "Public Liability — $10M",                       authority: "Allianz",             status: "valid",       expiry: "Sep 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",           status: "valid",       expiry: "Sep 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia", status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",        status: "valid",       expiry: "Aug 2026" },
      { type: "working_at_heights",       label: "Working at Heights",                             authority: "SafeWork NSW",        status: "valid",       expiry: "Oct 2026" },
      { type: "acma_cabling",             label: "ACMA Cabling Registration (Open)",              authority: "ACMA",                status: "valid",       expiry: "Feb 2028" },
      { type: "first_aid",                label: "First Aid (HLTAID011)",                          authority: "RTO-issued",          status: "expiring",    expiry: "May 2026", detail: "Renewal reminder sent 17 Mar; not yet actioned" },
    ],
    performance: {
      onTime:           0.93, onTimeTarget:           0.95,
      completion:       1.00, completionTarget:       0.98,
      photoEvidence:    0.34, photoEvidenceTarget:    0.90,  // the issue
      customerRating:   4.2,  reviewCount: 78,
      complaints90d:    0,
    },
    recent: [
      { id: "CG36015", customer: "G. Larkin",      suburb: "Moruya",      jobType: "Starlink Install", outcome: "complete", date: "8 Apr",  value: 359 },
      { id: "CG36003", customer: "D. Nguyen",      suburb: "Fern Bay",    jobType: "Starlink Install", outcome: "complete", date: "8 Apr",  value: 359 },
      { id: "CG35954", customer: "J. Papadopoulos",suburb: "Broke",       jobType: "Starlink Install", outcome: "complete", date: "8 Apr",  value: 359 },
      { id: "CG35918", customer: "M. Cuthbertson", suburb: "Pokolbin",    jobType: "Starlink Install", outcome: "complete", date: "7 Apr",  value: 359 },
      { id: "CG35891", customer: "F. Holst",       suburb: "Singleton",   jobType: "Starlink Install", outcome: "complete", date: "6 Apr",  value: 359 },
      { id: "CG35866", customer: "N. Wilcox",      suburb: "Cessnock",    jobType: "Starlink Install", outcome: "complete", date: "5 Apr",  value: 359 },
      { id: "CG35842", customer: "I. Marek",       suburb: "Maitland",    jobType: "Starlink Install", outcome: "complete", date: "4 Apr",  value: 359 },
      { id: "CG35819", customer: "T. Pickering",   suburb: "Branxton",    jobType: "Starlink Install", outcome: "complete", date: "3 Apr",  value: 359 },
      { id: "CG35796", customer: "L. Borowski",    suburb: "Greta",       jobType: "Starlink Install", outcome: "complete", date: "2 Apr",  value: 359 },
      { id: "CG35774", customer: "A. Olusegun",    suburb: "Lochinvar",   jobType: "Starlink Install", outcome: "late",     date: "1 Apr",  value: 359 },
    ],
  },

  // — 3. TAYLOR MADE ROOFING AND CARPENTRY — insurance, the variation case
  {
    id: "taylor-made",
    name: "TAYLOR MADE ROOFING AND CARPENTRY",
    tradeTypes: ["Roofer", "Carpenter"],
    region: "NSW Central Coast",
    abn: "44 558 233 091",
    primaryContact: "Brendan Taylor · 0414 ··· ···",
    narrative: "Long-standing Allianz-approved roofing partner. Strong on scope-change capture mid-job — the kind of variation flag that makes the audit work.",
    compliance: [
      { type: "builder_licence_nsw",      label: "NSW Builder Licence (Roofing & Carpentry)",      authority: "NSW Fair Trading",    status: "valid",       expiry: "Apr 2027" },
      { type: "public_liability",         label: "Public Liability — $20M",                       authority: "QBE",                 status: "valid",       expiry: "Aug 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",           status: "valid",       expiry: "Sep 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia", status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",        status: "valid",       expiry: "Aug 2026" },
      { type: "working_at_heights",       label: "Working at Heights",                             authority: "SafeWork NSW",        status: "valid",       expiry: "Mar 2027" },
      { type: "asbestos_awareness",       label: "Asbestos Awareness (CPCCWHS3001)",               authority: "RTO-issued",          status: "valid",       expiry: "Sep 2027" },
      { type: "first_aid",                label: "First Aid (HLTAID011)",                          authority: "RTO-issued",          status: "valid",       expiry: "Nov 2026" },
      { type: "hbc_insurance",            label: "Home Building Compensation (HBC)",               authority: "icare HBC",           status: "valid",       expiry: "Jul 2026", detail: "Required for residential jobs >$20k" },
    ],
    performance: {
      onTime:           0.91, onTimeTarget:           0.95,
      completion:       0.98, completionTarget:       0.98,
      photoEvidence:    0.94, photoEvidenceTarget:    0.90,
      customerRating:   4.4,  reviewCount: 31,
      complaints90d:    0,
    },
    recent: [
      { id: "CG35988", customer: "P. Stephens",    suburb: "Wamberal",    jobType: "Insurance Repair", outcome: "complete", date: "6 Apr",  value: 7800 },
      { id: "CG35942", customer: "N. Boddington",  suburb: "Erina",       jobType: "Insurance Repair", outcome: "complete", date: "1 Apr",  value: 4200 },
      { id: "CG35896", customer: "A. McCarthy",    suburb: "Avoca Beach", jobType: "Insurance Repair", outcome: "complete", date: "27 Mar", value: 6400 },
      { id: "CG35844", customer: "K. Lim",         suburb: "Terrigal",    jobType: "Insurance Repair", outcome: "complete", date: "22 Mar", value: 9600 },
      { id: "CG35799", customer: "E. Hartwell",    suburb: "The Entrance",jobType: "Insurance Repair", outcome: "complete", date: "18 Mar", value: 5500 },
      { id: "CG35756", customer: "B. Gillespie",   suburb: "Bateau Bay",  jobType: "Insurance Repair", outcome: "complete", date: "13 Mar", value: 3200 },
      { id: "CG35712", customer: "J. Owusu",       suburb: "Killarney Vale",jobType: "Insurance Repair",outcome: "complete", date: "9 Mar",  value: 11200 },
      { id: "CG35669", customer: "R. Sands",       suburb: "Long Jetty",  jobType: "Insurance Repair", outcome: "complete", date: "5 Mar",  value: 4800 },
      { id: "CG35624", customer: "M. Devine",      suburb: "Forresters Beach", jobType: "Insurance Repair", outcome: "complete", date: "1 Mar", value: 7100 },
      { id: "CG35583", customer: "C. Hilton",      suburb: "Mardi",       jobType: "Insurance Repair", outcome: "late",     date: "26 Feb", value: 6300 },
    ],
  },

  // — 4. Shane's Roofing Pty Ltd — insurance, the compliance exception case
  {
    id: "shanes-roofing",
    name: "Shane's Roofing Pty Ltd",
    tradeTypes: ["Roofer"],
    region: "NSW Mid North Coast",
    abn: "67 902 144 821",
    primaryContact: "Shane Mosley · 0407 ··· ···",
    narrative: "Only available licensed roofer in 2444 postcode. SWMS lapsed Feb 2026; flagged for compliance exception decision before next allocation.",
    compliance: [
      { type: "builder_licence_nsw",      label: "NSW Builder Licence (Roofing)",                  authority: "NSW Fair Trading",    status: "valid",       expiry: "Sep 2026" },
      { type: "public_liability",         label: "Public Liability — $20M",                       authority: "Suncorp",             status: "valid",       expiry: "Jun 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",           status: "valid",       expiry: "Jul 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia", status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",        status: "outstanding", detail: "Lapsed Feb 2026. Compliance exception requested — pending Kerrie review." },
      { type: "working_at_heights",       label: "Working at Heights",                             authority: "SafeWork NSW",        status: "valid",       expiry: "Jan 2027" },
      { type: "asbestos_awareness",       label: "Asbestos Awareness (CPCCWHS3001)",               authority: "RTO-issued",          status: "valid",       expiry: "Mar 2027" },
      { type: "first_aid",                label: "First Aid (HLTAID011)",                          authority: "RTO-issued",          status: "expired",     expiry: "Jan 2026", detail: "Expired; renewal not yet booked" },
    ],
    performance: {
      onTime:           0.88, onTimeTarget:           0.95,
      completion:       0.92, completionTarget:       0.98,
      photoEvidence:    0.78, photoEvidenceTarget:    0.90,
      customerRating:   3.7,  reviewCount: 19,
      complaints90d:    2,
    },
    recent: [
      { id: "CG35873", customer: "T. Whittaker",   suburb: "Port Macquarie", jobType: "Insurance Repair", outcome: "complete", date: "26 Mar", value: 5400 },
      { id: "CG35814", customer: "N. Ratcliffe",   suburb: "Lake Cathie",    jobType: "Insurance Repair", outcome: "complete", date: "20 Mar", value: 8200 },
      { id: "CG35759", customer: "L. Esposito",    suburb: "Kempsey",        jobType: "Insurance Repair", outcome: "late",     date: "15 Mar", value: 4400 },
      { id: "CG35702", customer: "M. Doulgeris",   suburb: "Wauchope",       jobType: "Insurance Repair", outcome: "complete", date: "11 Mar", value: 6700 },
      { id: "CG35648", customer: "B. Erskine",     suburb: "Crescent Head",  jobType: "Insurance Repair", outcome: "complaint",date: "6 Mar",  value: 7100 },
      { id: "CG35594", customer: "R. Stowe",       suburb: "Camden Haven",   jobType: "Insurance Repair", outcome: "complete", date: "2 Mar",  value: 3800 },
      { id: "CG35538", customer: "K. Marbeck",     suburb: "Laurieton",      jobType: "Insurance Repair", outcome: "complete", date: "26 Feb", value: 5900 },
      { id: "CG35484", customer: "F. Cosic",       suburb: "Bonny Hills",    jobType: "Insurance Repair", outcome: "complete", date: "21 Feb", value: 4200 },
      { id: "CG35432", customer: "P. Salt",        suburb: "Telegraph Point",jobType: "Insurance Repair", outcome: "complaint",date: "16 Feb", value: 6800 },
      { id: "CG35381", customer: "D. Hooper",      suburb: "Wingham",        jobType: "Insurance Repair", outcome: "complete", date: "11 Feb", value: 5100 },
    ],
  },

  // — 5. UNITED INFOCOM TECH PTY LTD — Harvey Norman, the high performer
  {
    id: "united-infocom",
    name: "UNITED INFOCOM TECH PTY LTD",
    tradeTypes: ["AV Installer", "Telecommunications"],
    region: "NSW Central Coast + Hunter",
    abn: "21 348 990 762",
    primaryContact: "Manny Patel · 0411 ··· ···",
    narrative: "Top-decile performer for HN installs. 99% on-time across 47 jobs in last 90 days; zero complaints; evidence packs always complete.",
    compliance: [
      { type: "electrical_licence_nsw",   label: "NSW Electrical Licence (Restricted)",            authority: "NSW Fair Trading",    status: "valid",       expiry: "Jun 2027" },
      { type: "public_liability",         label: "Public Liability — $10M",                       authority: "Vero",                status: "valid",       expiry: "Oct 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",           status: "valid",       expiry: "Aug 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia", status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",        status: "valid",       expiry: "Dec 2026" },
      { type: "acma_cabling",             label: "ACMA Cabling Registration (Open)",              authority: "ACMA",                status: "valid",       expiry: "Apr 2028" },
      { type: "test_and_tag",             label: "Test & Tag (electrical equipment)",              authority: "AS/NZS 3760",        status: "valid",       expiry: "Sep 2026" },
      { type: "first_aid",                label: "First Aid (HLTAID011)",                          authority: "RTO-issued",          status: "valid",       expiry: "Feb 2027" },
    ],
    performance: {
      onTime:           0.99, onTimeTarget:           0.95,
      completion:       1.00, completionTarget:       0.98,
      photoEvidence:    0.98, photoEvidenceTarget:    0.90,
      customerRating:   4.7,  reviewCount: 132,
      complaints90d:    0,
    },
    recent: [
      { id: "CG35949", customer: "H. Paterson",    suburb: "Erina",        jobType: "Harvey Norman Install", outcome: "complete", date: "8 Apr", value: 280 },
      { id: "CG35920", customer: "S. Akers",       suburb: "Wyong",        jobType: "Harvey Norman Install", outcome: "complete", date: "8 Apr", value: 280 },
      { id: "CG35890", customer: "B. Foley",       suburb: "Bateau Bay",   jobType: "Harvey Norman Install", outcome: "complete", date: "7 Apr", value: 280 },
      { id: "CG35862", customer: "T. Ng",          suburb: "Lisarow",      jobType: "Harvey Norman Install", outcome: "complete", date: "7 Apr", value: 280 },
      { id: "CG35835", customer: "K. Vasquez",     suburb: "Niagara Park", jobType: "Harvey Norman Install", outcome: "complete", date: "6 Apr", value: 280 },
      { id: "CG35808", customer: "M. Tyrrell",     suburb: "Gosford",      jobType: "Harvey Norman Install", outcome: "complete", date: "6 Apr", value: 280 },
      { id: "CG35781", customer: "C. Drysdale",    suburb: "Woy Woy",      jobType: "Harvey Norman Install", outcome: "complete", date: "5 Apr", value: 280 },
      { id: "CG35753", customer: "L. Beerens",     suburb: "Umina",        jobType: "Harvey Norman Install", outcome: "complete", date: "5 Apr", value: 280 },
      { id: "CG35726", customer: "P. Iverson",     suburb: "Ettalong",     jobType: "Harvey Norman Install", outcome: "complete", date: "4 Apr", value: 280 },
      { id: "CG35699", customer: "R. Khoury",      suburb: "Avoca Beach",  jobType: "Harvey Norman Install", outcome: "complete", date: "4 Apr", value: 280 },
    ],
  },

  // — 6. AusCorp Energy Pty Ltd — multi-trade construction lead
  {
    id: "auscorp-energy",
    name: "AusCorp Energy Pty Ltd",
    tradeTypes: ["Builder", "Project Manager"],
    region: "Greater Sydney + Newcastle",
    abn: "53 821 446 092",
    primaryContact: "Marko Stojanović · 0419 ··· ···",
    narrative: "AHO Construction lead-trade specialist. Tier C complexity; multi-trade coordination with sub-allocated HVAC. Strong stage sign-off discipline.",
    compliance: [
      { type: "builder_licence_nsw",      label: "NSW Builder Licence (Class 1A — Open)",          authority: "NSW Fair Trading",    status: "valid",       expiry: "May 2027" },
      { type: "public_liability",         label: "Public Liability — $20M",                       authority: "Zurich",              status: "valid",       expiry: "Nov 2026" },
      { type: "workers_comp_nsw",         label: "Workers Compensation",                          authority: "icare NSW",           status: "valid",       expiry: "Oct 2026" },
      { type: "white_card",               label: "White Card (Construction Induction)",            authority: "Safe Work Australia", status: "valid" },
      { type: "swms",                     label: "Safe Work Method Statement (HRCW)",              authority: "SafeWork NSW",        status: "valid",       expiry: "Sep 2026" },
      { type: "working_at_heights",       label: "Working at Heights",                             authority: "SafeWork NSW",        status: "valid",       expiry: "Apr 2027" },
      { type: "confined_spaces",          label: "Confined Spaces (Entry & Stand-by)",             authority: "SafeWork NSW",        status: "valid",       expiry: "Aug 2026" },
      { type: "asbestos_class_b",         label: "Asbestos Removal Licence (Class B)",             authority: "SafeWork NSW",        status: "valid",       expiry: "Mar 2028" },
      { type: "first_aid",                label: "First Aid (HLTAID011)",                          authority: "RTO-issued",          status: "valid",       expiry: "Jul 2026" },
      { type: "hbc_insurance",            label: "Home Building Compensation (HBC)",               authority: "icare HBC",           status: "valid",       expiry: "Aug 2026" },
    ],
    performance: {
      onTime:           0.87, onTimeTarget:           0.90,
      completion:       0.96, completionTarget:       0.95,
      photoEvidence:    0.91, photoEvidenceTarget:    0.85,
      customerRating:   4.2,  reviewCount: 24,
      complaints90d:    0,
    },
    recent: [
      { id: "CG36209", customer: "AHO Property — Unit 3",  suburb: "Mt Druitt",      jobType: "AHO Construction", outcome: "complete", date: "5 Apr",  value: 22400 },
      { id: "CG36148", customer: "AHO Property — Unit 8",  suburb: "Blacktown",       jobType: "AHO Construction", outcome: "complete", date: "29 Mar", value: 18900 },
      { id: "CG36094", customer: "AHO Property — Unit 2",  suburb: "Cabramatta",      jobType: "AHO Construction", outcome: "complete", date: "22 Mar", value: 24600 },
      { id: "CG36038", customer: "AHO Property — Unit 11", suburb: "Doonside",        jobType: "AHO Construction", outcome: "late",     date: "16 Mar", value: 19400 },
      { id: "CG35982", customer: "AHO Property — Unit 5",  suburb: "Tregear",         jobType: "AHO Construction", outcome: "complete", date: "9 Mar",  value: 21800 },
      { id: "CG35925", customer: "AHO Property — Unit 6",  suburb: "Whalan",          jobType: "AHO Construction", outcome: "complete", date: "3 Mar",  value: 17600 },
      { id: "CG35870", customer: "AHO Property — Unit 9",  suburb: "Lethbridge Park", jobType: "AHO Construction", outcome: "complete", date: "25 Feb", value: 23200 },
      { id: "CG35814", customer: "AHO Property — Unit 1",  suburb: "Bidwill",         jobType: "AHO Construction", outcome: "complete", date: "18 Feb", value: 20100 },
      { id: "CG35758", customer: "AHO Property — Unit 4",  suburb: "Hebersham",       jobType: "AHO Construction", outcome: "complete", date: "11 Feb", value: 18700 },
      { id: "CG35702", customer: "AHO Property — Unit 7",  suburb: "Minto",           jobType: "AHO Construction", outcome: "complete", date: "4 Feb",  value: 25400 },
    ],
  },

];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function findTradeByName(name: string | undefined | null): Trade | undefined {
  if (!name) return undefined;
  return TRADES.find(t => t.name === name);
}

// Compliance status visual metadata
export const COMPLIANCE_STATUS_META: Record<ComplianceStatus, { label: string; color: string; dot: string }> = {
  valid:       { label: "Valid",        color: "text-slate-600",   dot: "bg-green-400" },
  expiring:    { label: "Expiring",     color: "text-amber-700",   dot: "bg-amber-400" },
  expired:     { label: "Expired",      color: "text-red-700",     dot: "bg-red-400" },
  outstanding: { label: "Outstanding",  color: "text-red-700",     dot: "bg-red-500" },
};
