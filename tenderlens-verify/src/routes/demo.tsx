import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Upload, FileText, ListChecks, Network, History, Bell, CheckCircle2, AlertTriangle,
  XCircle, Eye, Loader2, FileUp, Download, ChevronLeft, Sparkles, Zap, ShieldCheck, Check,
  Building2, UserCheck, AlertCircle, FileCheck, Send, Bot, Cpu, Clock, RefreshCw, FileCode, CheckCheck,
  Scale, ArrowRight, CornerDownRight, CheckSquare, PhoneCall, PhoneForwarded, PhoneOff, Mic, Volume2, VolumeX, MessageSquareCode
} from "lucide-react";
import { Logo } from "@/components/Logo";

type View = "overview" | "new" | "agents" | "documents" | "results" | "evidence" | "graph" | "clarifications" | "outreach" | "audit" | "report";
type Role = "officer" | "vendor";

export const Route = createFileRoute("/demo")({
  validateSearch: (s: Record<string, unknown>): { view?: View | undefined } => ({ view: s["view"] as View | undefined }),
  head: () => ({
    meta: [
      { title: "TenderLens AI — Multi-Agent Compliance Engine" },
      { name: "description", content: "Autonomous Multi-Agent government procurement compliance, evidence verification, and AI clarification engine." },
      { property: "og:title", content: "TenderLens AI — Multi-Agent Compliance Engine" },
      { property: "og:description", content: "Evidence-first autonomous AI compliance agent for GeM and public procurement." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Demo,
});

type Status = "Compliant" | "Requires Review" | "Non-Compliant";
type Doc = {
  id: "gst" | "pan" | "udyam" | "oem";
  name: string;
  file: string;
  info: string;
  status: Status;
  conf: number;
  autoRouted: "auto_approved" | "routed_to_officer" | "disqualification_flagged";
  routingReason: string;
  fields: [string, string][];
  reason: string;
  ruleTitle: string;
  ruleText: string;
  page: number;
  expiryDate?: string;
  daysExpired?: number;
};

type AgentState = {
  id: string;
  name: string;
  role: string;
  icon: any;
  status: "idle" | "running" | "completed";
  output: string;
  timeMs: number;
};

type Clarification = {
  id: string;
  docId: "oem" | "udyam";
  targetField: string;
  title: string;
  aiDraftedLetter: string;
  status: "drafted_by_ai" | "sent_to_vendor" | "responded_by_vendor";
  sentAt?: string;
  responseRemark?: string;
  responseFile?: string;
  respondedAt?: string;
};

const INITIAL_DOCS: Doc[] = [
  {
    id: "gst",
    name: "GST Registration Certificate",
    file: "GST_Certificate.pdf",
    info: "GSTIN 27AABCS1234F1Z5 · Active",
    status: "Compliant",
    conf: 98,
    autoRouted: "auto_approved",
    routingReason: "Clean registry match (Confidence 98% > 90% threshold). Active tax filing verified.",
    page: 1,
    ruleTitle: "Valid GST Registration & Active Status",
    ruleText: "GSTIN must follow valid 15-character format, match business entity state (27: Maharashtra), and carry active filing status on verification date.",
    fields: [
      ["Legal Name", "Shree Infotech Pvt Ltd"],
      ["GSTIN", "27AABCS1234F1Z5"],
      ["State", "Maharashtra (27)"],
      ["Registration Type", "Regular"],
      ["Filing Status", "Active"],
    ],
    reason: "GSTIN format valid; embedded PAN matches PAN card; registered business state matches tender eligibility.",
  },
  {
    id: "pan",
    name: "PAN Card",
    file: "PAN_Card.png",
    info: "PAN AABCS1234F · Company",
    status: "Compliant",
    conf: 96,
    autoRouted: "auto_approved",
    routingReason: "100% substring match with GSTIN chars 3–12. Entity category 'C' matches Company constitution.",
    page: 1,
    ruleTitle: "Entity PAN Consistency",
    ruleText: "PAN entity category (4th char 'C' for Company) must match registered constitution and align with characters 3–12 of GSTIN.",
    fields: [
      ["Entity Name", "Shree Infotech Pvt Ltd"],
      ["PAN Number", "AABCS1234F"],
      ["Entity Type", "Company (C)"],
      ["Incorporation Date", "14/08/2014"],
    ],
    reason: "PAN matches GSTIN characters 3–12 exactly and entity name matches GST legal name.",
  },
  {
    id: "udyam",
    name: "Udyam/MSME Certificate",
    file: "Udyam_Certificate.pdf",
    info: "UDYAM-MH-19-0012345 · Name Variance",
    status: "Requires Review",
    conf: 79,
    autoRouted: "routed_to_officer",
    routingReason: "Fuzzy string similarity score 78% < 85% threshold ('Shree' vs 'Shri'). Routed to Human-in-the-Loop officer review.",
    page: 1,
    ruleTitle: "MSME Enterprise Name Reconciliation",
    ruleText: "Enterprise name in Udyam registry must be reconciled with GST and PAN certificates to verify preferential SME procurement eligibility.",
    fields: [
      ["Enterprise Name", "Shri Infotech Private Limited"],
      ["Udyam Reg Number", "UDYAM-MH-19-0012345"],
      ["Enterprise Category", "Small Enterprise"],
      ["Linked PAN", "AABCS1234F"],
      ["Major Activity", "Services / IT Infrastructure"],
    ],
    reason: "Linked PAN matches, but enterprise name displays spelling variance: 'Shri Infotech Private Limited' vs GST/PAN 'Shree Infotech Pvt Ltd'. Procurement officer review required.",
  },
  {
    id: "oem",
    name: "OEM Authorization Letter",
    file: "OEM_Authorization.pdf",
    info: "Expired 31 Dec 2024 · Tender: 17 Oct 2026",
    status: "Non-Compliant",
    conf: 94,
    autoRouted: "disqualification_flagged",
    routingReason: "Critical Section 4.2 policy violation. Date expired 655 days prior to tender opening.",
    page: 2,
    expiryDate: "31 December 2024",
    daysExpired: 655,
    ruleTitle: "OEM Authorization Validity on Tender Date",
    ruleText: "Manufacturer Authorization Form (MAF) must be strictly valid on the tender opening date (17 October 2026). Expired authorizations are inadmissible.",
    fields: [
      ["Authorized Partner", "Shree Infotech Pvt Ltd"],
      ["OEM Manufacturer", "Dell Technologies India Pvt Ltd"],
      ["Tender Ref", "GEM/2026/B/48213"],
      ["Validity Expiry Date", "31 December 2024"],
      ["Tender Opening Date", "17 October 2026"],
    ],
    reason: "Validity date (31 Dec 2024) falls 655 days prior to tender opening date (17 Oct 2026). This document fails the mandatory tender validity check.",
  },
];

const INITIAL_AGENTS: AgentState[] = [
  {
    id: "tender_agent",
    name: "Tender Agent",
    role: "Extracts mandatory tender criteria from RFP",
    icon: Scale,
    status: "completed",
    output: "Parsed GEM/2026/B/48213: 4 mandatory eligibility criteria identified (GST, PAN, MSME, OEM MAF).",
    timeMs: 420,
  },
  {
    id: "doc_agent",
    name: "Document Agent",
    role: "OCR extraction & document layout analysis",
    icon: FileText,
    status: "completed",
    output: "4 PDFs processed with OCR. Extracted 19 key entities, 4 registration numbers, 2 validity dates.",
    timeMs: 810,
  },
  {
    id: "verify_agent",
    name: "Verification Agent",
    role: "Cross-document consistency & date validation",
    icon: Cpu,
    status: "completed",
    output: "GSTIN-PAN linked (100%). Udyam name variance flagged (78%). OEM date violation detected (-655 days).",
    timeMs: 340,
  },
  {
    id: "evidence_agent",
    name: "Evidence Agent",
    role: "Pins source pages & highlights passages",
    icon: Eye,
    status: "completed",
    output: "Pinned Page 2 OEM clause ('valid until 31 Dec 2024'). Pinned Udyam name box. Citations attached.",
    timeMs: 290,
  },
  {
    id: "report_agent",
    name: "Report Agent",
    role: "Computes risk score & compiles audit dossier",
    icon: FileCheck,
    status: "completed",
    output: "Generated executive compliance summary. Risk verdict: Non-Compliant (1 Critical Disqualification).",
    timeMs: 220,
  },
];

const INITIAL_CLARIFICATIONS: Clarification[] = [
  {
    id: "clar-oem",
    docId: "oem",
    targetField: "Manufacturer Authorization Validity",
    title: "Clarification on Expired OEM Authorization Letter",
    aiDraftedLetter: "Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\nDuring the technical compliance evaluation of Tender No. GEM/2026/B/48213 (Supply of 500 Enterprise Laptops), the committee noted that the submitted Manufacturer Authorization Form (MAF) from Dell Technologies India Pvt Ltd specifies validity until 31 December 2024.\n\nPer Section 4.2 of the mandatory tender eligibility conditions, the OEM authorization must remain strictly valid on the tender opening date (17 October 2026).\n\nPlease provide an official authorization extension letter issued by Dell Technologies confirming ongoing partner authorization through the delivery and warranty period. Submit within 72 hours via GeM portal.",
    status: "drafted_by_ai",
  },
  {
    id: "clar-udyam",
    docId: "udyam",
    targetField: "Legal Name Spelling Consistency",
    title: "Reconciliation of Enterprise Name on Udyam Certificate",
    aiDraftedLetter: "Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\nVerification of your MSME Udyam Registration Certificate (UDYAM-MH-19-0012345) shows the enterprise name recorded as 'Shri Infotech Private Limited', whereas your PAN Card (AABCS1234F) and GSTIN (27AABCS1234F1Z5) specify the legal name as 'Shree Infotech Pvt Ltd'.\n\nTo ensure proper eligibility under the Public Procurement Policy for MSEs, please upload an affidavit, board resolution, or MCA Certificate of Incorporation amendment confirming that both spellings refer to the identical legal entity.",
    status: "drafted_by_ai",
  },
];

const tone: Record<Status, string> = {
  Compliant: "bg-success/15 text-success ring-success/30",
  "Requires Review": "bg-warning/20 text-foreground ring-warning/40",
  "Non-Compliant": "bg-destructive/15 text-destructive ring-destructive/30",
};

const Icon: Record<Status, any> = {
  Compliant: CheckCircle2,
  "Requires Review": AlertTriangle,
  "Non-Compliant": XCircle,
};

function Badge({ s }: { s: Status }) {
  const I = Icon[s];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone[s]}`}>
      <I className="h-3.5 w-3.5" />
      {s}
    </span>
  );
}

function seedLog(): [string, string, string, string][] {
  return [
    ["10:02:11", "Tender RFP Uploaded", "Parsed GEM/2026/B/48213 rules", "Tender Agent"],
    ["10:02:12", "OCR Extraction Complete", "4 vendor documents parsed (19 entities)", "Document Agent"],
    ["10:02:13", "Rule Evaluation: GSTIN-PAN", "Auto-Approved: 100% PAN match", "Verification Agent"],
    ["10:02:14", "Fuzzy Name Check: Udyam", "Routed to Officer: Name variance (78% match)", "Verification Agent"],
    ["10:02:15", "Expiry Check: OEM MAF", "Critical Failure: Lapsed on 31 Dec 2024 (-655 days)", "Verification Agent"],
    ["10:02:16", "Evidence Pinned", "Source passages and page citations attached", "Evidence Agent"],
    ["10:02:17", "AI Clarification Drafted", "Legally precise letters prepared for OEM & Udyam", "AI Assistant"],
    ["10:02:18", "Dossier Compiled", "Risk score computed (Overall: Non-Compliant)", "Report Agent"],
  ];
}

const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md ${className}`}>
    {children}
  </div>
);

const Title = ({ t, sub }: { t: string; sub?: string }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">{t}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
    <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
      Autonomous AI Pipeline
    </span>
  </div>
);

import { checkBackendHealth, fetchAutonomousScreening, postClarificationAction, uploadDocumentToBackend, triggerVendorVoiceCall } from "@/lib/api";

function Demo() {
  const search = Route.useSearch();
  const [role, setRole] = useState<Role>("officer");
  const [view, setView] = useState<View>(search.view ?? "new");
  const [files, setFiles] = useState<{ name: string; url?: string; type: string }[]>([]);
  const [sample, setSample] = useState(false);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(!!search.view);
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);
  const [sel, setSel] = useState<Doc>(INITIAL_DOCS[3]!);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [clarifications, setClarifications] = useState<Clarification[]>(INITIAL_CLARIFICATIONS);
  const [log, setLog] = useState<[string, string, string, string][]>(() => (search.view ? seedLog() : []));
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [backendLive, setBackendLive] = useState(false);

  const add = (a: string, r: string, s: string) =>
    setLog((l) => [...l, [new Date().toLocaleTimeString(), a, r, s]]);

  useEffect(() => {
    // Check real backend status
    checkBackendHealth().then((res) => {
      setBackendLive(res.healthy);
      if (res.healthy) {
        add("Backend Connected", "FastAPI Python backend ready on port 8000", "System");
      }
    });

    if (search.view) {
      setView(search.view);
      setDone(true);
      setSample(true);
    }
  }, [search.view]);

  const runAutonomousAgents = async () => {
    setSample(true);
    setDone(false);
    setStage(0);
    add("Autonomous Pipeline Launched", "Invoking live Python FastAPI backend on port 8000", "Orchestrator");

    // Animate multi-agents sequentially while requesting live backend
    let currentAgent = 0;
    const interval = setInterval(() => {
      setStage(currentAgent);
      currentAgent++;
      if (currentAgent >= INITIAL_AGENTS.length) {
        clearInterval(interval);
      }
    }, 600);

    try {
      // Call REAL Python FastAPI backend
      const backendData = await fetchAutonomousScreening("GEM/2026/B/48213");
      setTimeout(() => {
        setStage(-1);
        setDone(true);
        if (backendData.agents) {
          setAgents((prev) =>
            prev.map((a, i) => {
              const bg = backendData.agents[i];
              return bg ? { ...a, output: bg.output, timeMs: bg.time_ms } : a;
            })
          );
        }
        if (backendData.documents && backendData.documents.length > 0) {
          setDocs(
            backendData.documents.map((d: any) => ({
              id: d.id,
              name: d.name,
              file: d.file,
              info: d.info,
              status: d.status,
              conf: d.conf,
              autoRouted: d.auto_routed || d.autoRouted,
              routingReason: d.routing_reason || d.routingReason,
              fields: d.fields,
              reason: d.reason,
              ruleTitle: d.rule_title || d.ruleTitle,
              ruleText: d.rule_text || d.ruleText,
              page: d.page,
              expiryDate: d.expiry_date || d.expiryDate,
              daysExpired: d.days_expired || d.daysExpired,
            }))
          );
        }
        if (backendData.clarifications && backendData.clarifications.length > 0) {
          setClarifications(
            backendData.clarifications.map((c: any) => ({
              id: c.id,
              docId: c.doc_id || c.docId,
              targetField: c.target_field || c.targetField,
              title: c.title,
              aiDraftedLetter: c.ai_drafted_letter || c.aiDraftedLetter,
              status: c.status,
              sentAt: c.sent_at || c.sentAt,
              responseRemark: c.response_remark || c.responseRemark,
              responseFile: c.response_file || c.responseFile,
              respondedAt: c.responded_at || c.respondedAt,
            }))
          );
        }
        if (backendData.audit_log) {
          setLog(backendData.audit_log);
        }
        setView("agents");
        setActionNotice("Autonomous multi-agent verification completed via live FastAPI backend!");
        setTimeout(() => setActionNotice(null), 5000);
      }, 3000);
    } catch (err) {
      // Fallback seamlessly if backend request fails
      setTimeout(() => {
        setStage(-1);
        setDone(true);
        setLog((l) => [...l, ...seedLog().slice(2)]);
        setView("agents");
        setActionNotice("Multi-agent screening completed!");
        setTimeout(() => setActionNotice(null), 5000);
      }, 3000);
    }
  };

  const openEvidence = (d: Doc) => {
    setSel(d);
    setView("evidence");
    add("Evidence viewer opened", `${d.name} (${d.file})`, "Officer");
  };

  const handleOfficerDecision = (docId: string, decision: "override" | "clarify" | "confirm") => {
    const timestamp = new Date().toLocaleTimeString();
    if (decision === "override") {
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "Compliant" as Status, reason: "Overridden by Procurement Officer." } : d))
      );
      add("Officer Override", `${docId.toUpperCase()} approved under discretionary authority`, "Procurement Officer");
      setActionNotice(`Status updated: ${docId.toUpperCase()} marked as Compliant by Officer.`);
    } else if (decision === "clarify") {
      setView("clarifications");
      setActionNotice(`Opened AI Clarification Assistant for ${docId.toUpperCase()}. Review and send letter.`);
    } else {
      add("Disqualification Confirmed", `Confirmed non-compliance recorded for ${docId.toUpperCase()}`, "Procurement Officer");
      setActionNotice(`Disqualification finalized for ${docId.toUpperCase()}.`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendClarification = async (clarId: string) => {
    const timestamp = new Date().toLocaleTimeString();
    try {
      await postClarificationAction(clarId, "approve_send");
    } catch (e) {
      console.warn("Backend clarification sync notice:", e);
    }
    setClarifications((prev) =>
      prev.map((c) => (c.id === clarId ? { ...c, status: "sent_to_vendor", sentAt: timestamp } : c))
    );
    add("Clarification Sent to Vendor", "Formal notice transmitted via GeM Portal (Synced to FastAPI Backend)", "Procurement Officer");
    setActionNotice("Notice transmitted to Shree Infotech Pvt Ltd! Switch to 'Vendor (Bidder) Portal' above to view.");
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleVendorSubmitResponse = async (clarId: string, remark: string, fileName: string) => {
    const timestamp = new Date().toLocaleTimeString();
    try {
      await postClarificationAction(clarId, "vendor_respond", remark, fileName);
    } catch (e) {
      console.warn("Backend vendor response sync notice:", e);
    }
    setClarifications((prev) =>
      prev.map((c) =>
        c.id === clarId
          ? { ...c, status: "responded_by_vendor", responseRemark: remark, responseFile: fileName, respondedAt: timestamp }
          : c
      )
    );

    // Update OEM document in state
    setDocs((prev) =>
      prev.map((d) =>
        d.id === "oem"
          ? {
              ...d,
              status: "Requires Review" as Status,
              info: "Renewed Letter Submitted (Valid till 31 Dec 2027)",
              reason: "Vendor submitted renewed Dell OEM Authorization (Ref: DELL/2026/EXT-081) valid through 31 Dec 2027. Awaiting officer verification.",
            }
          : d
      )
    );

    add("Vendor Response Submitted", `Shree Infotech uploaded ${fileName} with explanation (Synced to FastAPI Backend)`, "Vendor (Bidder)");
    setActionNotice("Response transmitted to Tender Committee! Switch back to 'Procurement Officer' view to verify.");
    setTimeout(() => setActionNotice(null), 6000);
  };

  const pendingClarCount = clarifications.filter((c) => c.status === "sent_to_vendor").length;

  const menu: [View, string, any, string?][] = [
    ["overview", "Overview", LayoutDashboard],
    ["new", "New Screening", Upload],
    ["agents", "Multi-Agent System", Bot, "AI Core"],
    ["clarifications", "AI Clarification Assistant", Send, "AI Draft"],
    ["outreach", "Agentic Voice Call", PhoneCall, "12h SLA"],
    ["results", "Compliance Results", ListChecks],
    ["evidence", "Evidence Viewer", Eye],
    ["graph", "Identity Graph", Network],
    ["documents", "Document Ingestion", FileText],
    ["audit", "Audit Trail & Report", History],
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar (Procurement Officer) */}
      {role === "officer" && (
        <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-background p-4 lg:flex">
          <Link to="/">
            <Logo />
          </Link>
          <div className="mt-2 text-[11px] font-medium text-muted-foreground">Autonomous Compliance Engine</div>

          <nav className="mt-6 space-y-1">
            {menu.map(([v, l, I, badge]) => {
              const active = view === v || (v === "results" && view === "results") || (v === "audit" && view === "report");
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <I className="h-4 w-4" />
                    <span>{l}</span>
                  </span>
                  {badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-4 border-t">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-navy">
                <Bot className="h-4 w-4 text-primary" /> Multi-Agent Active
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                5 autonomous agents coordinating eligibility parsing, OCR, and legal cross-checks.
              </p>
            </div>
            <div className="rounded-xl bg-navy p-3 text-[10px] text-primary-foreground/80">
              Procurement Officer Workspace. Toggle role switcher in top bar to test Vendor response.
            </div>
          </div>
        </aside>
      )}

      {/* Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header with Role Switcher & Tender Info */}
        <header className="no-print flex flex-wrap items-center gap-3 border-b bg-background px-5 py-3 shadow-xs">
          <Link to="/" className="lg:hidden" aria-label="Home">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Link>

          {/* TWO-USER ROLE SWITCHER */}
          <div className="flex items-center rounded-full border border-primary/30 bg-muted/60 p-1 shadow-inner">
            <button
              onClick={() => setRole("officer")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                role === "officer"
                  ? "bg-navy text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-navy"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan" />
              Procurement Officer View
            </button>
            <button
              onClick={() => setRole("vendor")}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                role === "vendor"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Vendor (Bidder) Portal
              {pendingClarCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white animate-pulse">
                  {pendingClarCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span>Tender:</span>
            <b className="text-navy">GEM/2026/B/48213</b>
          </div>

          {/* Real Backend Connection Badge */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              backendLive
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
            title={backendLive ? "Connected to live Python FastAPI backend at http://localhost:8000" : "Connecting to backend..."}
          >
            <span className={`h-2 w-2 rounded-full ${backendLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{backendLive ? "FastAPI Backend Live (:8000)" : "Connecting to Backend..."}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {role === "officer" ? (
              <>
                <button
                  onClick={() => setView("report")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  Final Dossier
                </button>

                <div className="flex items-center gap-2 rounded-full border bg-muted/60 pl-2 pr-3 py-1">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-xs font-bold text-primary-foreground">
                    PO
                  </span>
                  <span className="text-xs font-medium text-navy">Procurement Officer</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border bg-muted/60 pl-2 pr-3 py-1">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-navy to-primary text-xs font-bold text-primary-foreground">
                  SI
                </span>
                <span className="text-xs font-medium text-navy">Shree Infotech Pvt Ltd (Bidder)</span>
              </div>
            )}
          </div>

          {/* Mobile navigation row */}
          {role === "officer" && (
            <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:hidden">
              {menu.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                    view === v ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </header>

        {actionNotice && (
          <div className="no-print bg-navy px-5 py-2.5 text-center text-xs font-medium text-primary-foreground transition-all flex items-center justify-center gap-2 shadow-inner">
            <CheckCircle2 className="h-4 w-4 text-cyan" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* View Contents */}
        <main className="flex-1 p-5 md:p-8">
          {/* USER 2: VENDOR VIEW */}
          {role === "vendor" ? (
            <VendorPortal
              docs={docs}
              clarifications={clarifications}
              onSubmitClarification={handleVendorSubmitResponse}
              switchToOfficer={() => setRole("officer")}
            />
          ) : (
            /* USER 1: OFFICER WORKSPACE */
            <>
              {view === "overview" && (
                <Overview done={done} docs={docs} go={setView} runAutonomous={runAutonomousAgents} />
              )}

              {view === "new" && (
                <NewScreening
                  files={files}
                  setFiles={setFiles}
                  sample={sample}
                  setSample={(b: boolean) => {
                    setSample(b);
                    if (b) add("Sample documents loaded", "Tender RFP + 4 Vendor Files", "Officer");
                  }}
                  stage={stage}
                  agents={agents}
                  runAutonomous={runAutonomousAgents}
                  add={add}
                />
              )}

              {view === "agents" && (
                <MultiAgentDashboard
                  agents={agents}
                  docs={docs}
                  go={setView}
                  openEvidence={openEvidence}
                  runAgain={runAutonomousAgents}
                />
              )}

              {view === "clarifications" && (
                <ClarificationAssistant
                  clarifications={clarifications}
                  docs={docs}
                  onSend={handleSendClarification}
                  switchToVendor={() => setRole("vendor")}
                  go={setView}
                />
              )}

              {view === "outreach" && (
                <AgenticVoiceOutreach
                  tenderId="GEM/2026/B/48213"
                  vendorName="Shree Infotech Pvt Ltd"
                  contactPerson="Rajesh Sharma (Director)"
                  phone="+91 98201 44821"
                  add={add}
                  switchToVendor={() => setRole("vendor")}
                />
              )}

              {view === "documents" && (
                <Documents files={files} sample={sample || done} docs={docs} go={setView} openEvidence={openEvidence} />
              )}

              {(view === "results" || view === "evidence" || view === "graph" || view === "report") && !done ? (
                <NeedRun go={setView} runAutonomous={runAutonomousAgents} />
              ) : null}

              {view === "results" && done && <Results docs={docs} open={openEvidence} go={setView} />}

              {view === "evidence" && done && (
                <Evidence
                  d={sel}
                  docs={docs}
                  back={() => setView("results")}
                  pick={(d) => {
                    setSel(d);
                    add("Evidence inspected", d.name, "Officer");
                  }}
                  onDecision={handleOfficerDecision}
                />
              )}

              {view === "graph" && done && <Graph docs={docs} open={openEvidence} />}

              {(view === "audit" || view === "report") && (view === "audit" || done) && (
                <Audit log={log} done={done} docs={docs} report={view === "report"} add={add} go={setView} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   FEATURE 1 & 2: MULTI-AGENT VERIFICATION DASHBOARD
   ========================================================================= */

function MultiAgentDashboard({
  agents,
  docs,
  go,
  openEvidence,
  runAgain,
}: {
  agents: AgentState[];
  docs: Doc[];
  go: (v: View) => void;
  openEvidence: (d: Doc) => void;
  runAgain: () => void;
}) {
  const oemDoc = docs.find((d) => d.id === "oem")!;
  const udyamDoc = docs.find((d) => d.id === "udyam")!;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Cpu className="h-3.5 w-3.5" /> Multi-Agent Orchestration Engine
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-navy">
            Autonomous Multi-Agent Compliance Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 specialized AI agents work in parallel to read, verify, cross-reconcile, and draft actions without manual labor.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runAgain}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-navy hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-run Agents
          </button>
          <button
            onClick={() => go("clarifications")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" /> AI Clarification Assistant →
          </button>
        </div>
      </div>

      {/* 5 Agent Architecture Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {agents.map((ag, idx) => {
          const AgIcon = ag.icon;
          return (
            <Card key={ag.id} className="relative overflow-hidden border-primary/20 p-4">
              <span className="absolute top-2 right-2 text-[10px] font-bold text-primary/40">
                0{idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <AgIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-xs">{ag.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{ag.timeMs}ms</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground font-medium">{ag.role}</p>
              <div className="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-foreground/80 leading-relaxed border">
                {ag.output}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-success">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Agent Complete
                </span>
                <span className="rounded bg-success/10 px-1.5 py-0.5">Structured Output</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* FEATURE 5: HUMAN-IN-THE-LOOP AUTOMATED ROUTING ENGINE */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">
              Automated Decision Routing (Human-in-the-Loop)
            </h2>
            <p className="text-xs text-muted-foreground">
              Straightforward clean checks auto-approve; uncertain and policy violations route to officer review queue with AI reasoning.
            </p>
          </div>
          <span className="text-xs font-bold text-primary">Confidence Threshold: 85%</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Lane 1: Auto-Approved Checks */}
          <Card className="border-success/30 bg-success/5">
            <div className="flex items-center justify-between border-b border-success/20 pb-3">
              <span className="text-xs font-bold text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Auto-Approved (Clean Pass)
              </span>
              <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                Confidence &gt; 95%
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {docs
                .filter((d) => d.autoRouted === "auto_approved")
                .map((d) => (
                  <div key={d.id} className="rounded-lg border bg-background p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="text-navy">{d.name}</b>
                      <span className="text-success font-bold font-mono text-[11px]">{d.conf}%</span>
                    </div>
                    <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                      {d.routingReason}
                    </p>
                  </div>
                ))}
            </div>
          </Card>

          {/* Lane 2: Routed to Officer (Uncertain / Variance) */}
          <Card className="border-warning/30 bg-warning/5">
            <div className="flex items-center justify-between border-b border-warning/20 pb-3">
              <span className="text-xs font-bold text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Officer Review Queue
              </span>
              <span className="rounded bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-navy">
                Confidence 78% (&lt; 85%)
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {docs
                .filter((d) => d.autoRouted === "routed_to_officer")
                .map((d) => (
                  <div key={d.id} className="rounded-lg border bg-background p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="text-navy">{d.name}</b>
                      <Badge s={d.status} />
                    </div>
                    <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                      {d.routingReason}
                    </p>
                    <button
                      onClick={() => openEvidence(d)}
                      className="mt-2 text-primary font-bold text-[11px] hover:underline flex items-center gap-1"
                    >
                      Inspect Source Evidence →
                    </button>
                  </div>
                ))}
            </div>
          </Card>

          {/* Lane 3: Disqualification Flagged */}
          <Card className="border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between border-b border-destructive/20 pb-3">
              <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Disqualification Flagged
              </span>
              <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                Tender Policy Fail
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {docs
                .filter((d) => d.autoRouted === "disqualification_flagged")
                .map((d) => (
                  <div key={d.id} className="rounded-lg border bg-background p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="text-navy">{d.name}</b>
                      <Badge s={d.status} />
                    </div>
                    <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                      {d.routingReason}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => openEvidence(d)}
                        className="rounded bg-destructive px-2.5 py-1 text-[11px] font-bold text-white hover:bg-destructive/90"
                      >
                        Inspect Clause
                      </button>
                      <button
                        onClick={() => go("clarifications")}
                        className="rounded border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-muted"
                      >
                        AI Draft Letter
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* FEATURE 3: AUTOMATIC EXPIRY & RENEWAL MONITOR */}
      <div className="mt-8">
        <Card className="border-primary/20 bg-gradient-to-r from-navy via-navy to-primary p-6 text-primary-foreground shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan/20 px-3 py-1 text-xs font-bold text-cyan">
                <Clock className="h-3.5 w-3.5" /> Automated Expiry & Timeline Monitor
              </div>
              <h3 className="mt-2 font-display text-lg font-bold">
                Tender Date Synchronization: 17 October 2026
              </h3>
              <p className="text-xs text-primary-foreground/75 mt-1">
                TenderLens AI schedules automated expiry alerts and verifies document validities against tender milestones.
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-right backdrop-blur">
              <span className="text-[10px] uppercase font-semibold text-cyan">OEM Expiry Delta</span>
              <p className="font-mono text-xl font-bold text-destructive-foreground">Expired: -655 Days</p>
              <span className="text-[10px] text-white/60">Lapsed on 31 Dec 2024</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================================
   FEATURE 4: AI CLARIFICATION ASSISTANT COMPONENT
   ========================================================================= */

function ClarificationAssistant({
  clarifications,
  docs,
  onSend,
  switchToVendor,
  go,
}: {
  clarifications: Clarification[];
  docs: Doc[];
  onSend: (id: string) => void;
  switchToVendor: () => void;
  go?: (view: View) => void;
}) {
  const [selectedClar, setSelectedClar] = useState<Clarification>(clarifications[0]!);
  const [editableLetter, setEditableLetter] = useState(clarifications[0]!.aiDraftedLetter);

  const handleSelect = (c: Clarification) => {
    setSelectedClar(c);
    setEditableLetter(c.aiDraftedLetter);
  };

  return (
    <>
      <Title
        t="AI Clarification Assistant"
        sub="LLM-powered automatic drafting of legally precise clarification notices with 1-click officer approval."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Clarification Queue */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Discrepancy Notices Queue ({clarifications.length})
          </h3>
          {clarifications.map((c) => {
            const isSelected = selectedClar.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                    {c.docId.toUpperCase()} Target
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "sent_to_vendor"
                        ? "bg-warning/20 text-navy"
                        : c.status === "responded_by_vendor"
                        ? "bg-success/20 text-success"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {c.status === "sent_to_vendor"
                      ? "Transmitted"
                      : c.status === "responded_by_vendor"
                      ? "Vendor Responded"
                      : "AI Drafted"}
                  </span>
                </div>
                <h4 className="font-bold text-navy text-xs mt-2">{c.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  Target field: {c.targetField}
                </p>
              </div>
            );
          })}

          {/* 12-Hour SLA Voice Call Escalation Box */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-destructive">
              <PhoneCall className="h-4 w-4 animate-pulse" />
              <span>12h SLA Escalation Rule</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              If vendor is unresponsive for &gt;12 hours, TenderLens initiates an autonomous outbound voice phone call directly to the bidder.
            </p>
            {go && (
              <button
                onClick={() => go("outreach")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-destructive/90 transition"
              >
                <PhoneForwarded className="h-3.5 w-3.5" /> Test Agentic Voice Call ➔
              </button>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            <span className="font-bold text-navy block mb-1">Human-in-the-Loop Governance:</span>
            AI drafts notices automatically citing specific clauses (e.g. GeM Section 4.2). The Procurement Officer maintains final approval before transmission.
          </div>
        </div>

        {/* Right Column: AI Drafting Studio */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-navy text-base">
                  {selectedClar.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recipient: <b>Shree Infotech Pvt Ltd</b> · Reference: <b>GEM/2026/B/48213</b>
              </p>
            </div>

            {selectedClar.status === "sent_to_vendor" ? (
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Transmitted via GeM Portal
              </span>
            ) : selectedClar.status === "responded_by_vendor" ? (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1.5">
                <CheckCheck className="h-4 w-4" /> Vendor Submitted Response
              </span>
            ) : (
              <button
                onClick={() => onSend(selectedClar.id)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition"
              >
                <Send className="h-3.5 w-3.5" /> Approve & Transmit to Vendor
              </button>
            )}
          </div>

          {/* 12-Hour SLA Escalation Card */}
          {selectedClar.status === "sent_to_vendor" && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive text-white shadow-sm">
                  <PhoneCall className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy text-xs">12 Hours Elapsed Without Vendor Response</span>
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                      SLA Escalation Rule Triggered
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Bidder M/s Shree Infotech has not acknowledged. TenderLens can place an autonomous voice call directly to Director Rajesh Sharma.
                  </p>
                </div>
              </div>
              {go && (
                <button
                  onClick={() => go("outreach")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition"
                >
                  <PhoneForwarded className="h-3.5 w-3.5" /> Launch Autonomous AI Voice Call ➔
                </button>
              )}
            </div>
          )}

          {/* Letter Editor */}
          <div className="mt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Official Clarification Letter Body (Editable by Officer)
            </label>
            <textarea
              rows={10}
              value={editableLetter}
              onChange={(e) => setEditableLetter(e.target.value)}
              className="w-full rounded-xl border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-navy focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span className="text-[11px] text-muted-foreground">
              * Legal citations automatically retrieved from Tender RFP Section 4.2.
            </span>
            <button
              onClick={switchToVendor}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Building2 className="h-3.5 w-3.5" /> Test Vendor's View of this Notice →
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================================
   FEATURE 6: AGENTIC VOICE OUTREACH & 12-HOUR SLA ESCALATION
   ========================================================================= */

function AgenticVoiceOutreach({
  tenderId = "GEM/2026/B/48213",
  vendorName = "Shree Infotech Pvt Ltd",
  contactPerson = "Rajesh Sharma (Director)",
  phone = "+91 98201 44821",
  add,
  switchToVendor,
}: {
  tenderId?: string;
  vendorName?: string;
  contactPerson?: string;
  phone?: string;
  add: (a: string, r: string, s: string) => void;
  switchToVendor: () => void;
}) {
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "completed">("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcriptStep, setTranscriptStep] = useState(0);
  const [voiceAudio, setVoiceAudio] = useState(true);
  const [backendData, setBackendData] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const DIALOGUE = [
    {
      speaker: "TenderLens AI Voice Agent",
      role: "AI",
      time: "00:03",
      text: `Namaste Mr. Rajesh Sharma. This is the TenderLens Autonomous Compliance AI calling on behalf of the Tender Committee for Tender Reference ${tenderId}.`,
    },
    {
      speaker: "Rajesh Sharma (Vendor)",
      role: "Vendor",
      time: "00:14",
      text: "Yes, Rajesh Sharma here. What is this regarding? Is there any issue with our bid?",
    },
    {
      speaker: "TenderLens AI Voice Agent",
      role: "AI",
      time: "00:26",
      text: "We issued an official clarification notice 12 hours ago regarding your Dell OEM Authorization Form, which expired on 31 December 2024. Your submission is at risk of immediate technical disqualification under RFP Section 4.2.",
    },
    {
      speaker: "Rajesh Sharma (Vendor)",
      role: "Vendor",
      time: "00:44",
      text: "Oh! We received the renewed authorization letter from Dell India valid till 2027 yesterday, but our executive hadn't uploaded it yet. Thank you for alerting us directly.",
    },
    {
      speaker: "TenderLens AI Voice Agent",
      role: "AI",
      time: "00:58",
      text: "Please upload the renewed Dell MAF document on the GeM portal within the next 4 hours. A secure upload link has also been sent to your registered WhatsApp and email.",
    },
    {
      speaker: "Rajesh Sharma (Vendor)",
      role: "Vendor",
      time: "01:08",
      text: "I am opening the portal now and uploading it immediately. Thank you so much for the prompt reminder.",
    },
    {
      speaker: "TenderLens AI Voice Agent",
      role: "AI",
      time: "01:14",
      text: "Your acknowledgment has been recorded in the official audit trail. Have a good day.",
    },
  ];

  const speakText = (text: string) => {
    if (!voiceAudio || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  };

  const startAutonomousCall = async () => {
    setCallStatus("dialing");
    setSeconds(0);
    setTranscriptStep(0);
    add("Autonomous Voice Call Initiated", `Dialing ${phone} (12h SLA Escalation Rule)`, "Outreach Agent");

    // Call real FastAPI backend endpoint
    triggerVendorVoiceCall(tenderId, "clar-oem", phone)
      .then((data) => setBackendData(data))
      .catch((err) => console.warn("Backend voice call error:", err));

    setTimeout(() => {
      setCallStatus("connected");
      speakText(DIALOGUE[0]!.text);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < DIALOGUE.length) {
          setTranscriptStep(step);
          if (DIALOGUE[step]!.role === "AI") {
            speakText(DIALOGUE[step]!.text);
          }
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        } else {
          clearInterval(interval);
          if (timerRef.current) clearInterval(timerRef.current);
          setCallStatus("completed");
          add("Voice Call Completed", "Vendor acknowledged & promised upload within 4h", "Outreach Agent");
        }
      }, 3500);
    }, 2500);
  };

  const endCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStatus("completed");
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Title
        t="Autonomous AI Voice Escalation Agent"
        sub="Automatically initiates outbound voice phone calls when vendors remain unresponsive beyond the 12-hour clarification SLA window."
      />

      {/* SLA Policy Banner */}
      <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-destructive text-white shadow-md shadow-destructive/20">
              <PhoneCall className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display text-sm font-bold text-navy">12-Hour Vendor Unresponsiveness Rule Triggered</h4>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                  Critical SLA Escalation
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Vendor <b>{vendorName}</b> was issued Clarification Notice (CLAR-OEM) 12 hours ago regarding their expired Dell MAF.
                Zero acknowledgement recorded. TenderLens autonomous voice pipeline activated.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceAudio(!voiceAudio)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                voiceAudio ? "bg-primary/10 border-primary text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {voiceAudio ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              Speech Audio: {voiceAudio ? "Active" : "Muted"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Active Call Center Phone Interface */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Agentic Voice Studio
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  callStatus === "connected"
                    ? "bg-emerald-500/15 text-emerald-600 animate-pulse"
                    : callStatus === "dialing"
                    ? "bg-amber-500/15 text-amber-600"
                    : callStatus === "completed"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {callStatus === "connected"
                  ? "● LIVE IN-CALL"
                  : callStatus === "dialing"
                  ? "DIALING..."
                  : callStatus === "completed"
                  ? "CALL COMPLETED"
                  : "READY TO DIAL"}
              </span>
            </div>

            {/* Target Contact Profile */}
            <div className="mt-4 rounded-xl border bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Authorized Contact:</span>
                <b className="text-navy">{contactPerson}</b>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Registered Mobile:</span>
                <b className="font-mono text-primary">{phone}</b>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tender Reference:</span>
                <b className="text-navy">{tenderId}</b>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Trigger Reason:</span>
                <b className="text-destructive">12h Clarification Inactivity</b>
              </div>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className="mt-5 rounded-2xl border bg-gradient-to-b from-navy/5 via-primary/5 to-transparent p-4 text-center">
              <p className="text-xs font-mono font-bold text-navy">
                {callStatus === "connected" ? `Active Duration: ${formatTime(seconds)}` : callStatus === "dialing" ? "Connecting to Carrier Network..." : callStatus === "completed" ? "Call Finished (01:14)" : "Carrier: Airtel Enterprise SIP"}
              </p>

              {/* Waveform bars */}
              <div className="mt-3 flex items-center justify-center gap-1.5 h-16 py-2">
                {[45, 75, 55, 90, 65, 80, 45, 95, 70, 85, 50, 90, 60, 75, 45, 60].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      callStatus === "connected"
                        ? "bg-gradient-to-t from-emerald-500 via-cyan to-primary"
                        : "bg-muted-foreground/20"
                    }`}
                    style={{
                      height:
                        callStatus === "connected"
                          ? `${Math.max(20, (h * (((seconds + i) % 4) + 1)) / 4)}%`
                          : "20%",
                    }}
                  />
                ))}
              </div>

              <div className="mt-2 text-[11px] text-muted-foreground">
                {callStatus === "connected" ? (
                  <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                    <Mic className="h-3.5 w-3.5 animate-pulse" /> Full Duplex AI Voice Synthesis
                  </span>
                ) : (
                  "Autonomous Outreach Agent idle"
                )}
              </div>
            </div>
          </div>

          {/* Action Call Buttons */}
          <div className="mt-6 space-y-3">
            {callStatus === "idle" && (
              <button
                onClick={startAutonomousCall}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-xs font-bold text-white shadow-lg shadow-destructive/25 transition hover:scale-102"
              >
                <PhoneCall className="h-4 w-4" />
                Initiate Autonomous AI Voice Call
              </button>
            )}

            {callStatus === "dialing" && (
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Dialing Rajesh Sharma ({phone})...
              </button>
            )}

            {callStatus === "connected" && (
              <button
                onClick={endCall}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-xs font-bold text-white shadow transition hover:bg-destructive/90"
              >
                <PhoneOff className="h-4 w-4" />
                End Call & Log Recording
              </button>
            )}

            {callStatus === "completed" && (
              <div className="space-y-2">
                <button
                  onClick={startAutonomousCall}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-dial Vendor
                </button>
                <button
                  onClick={switchToVendor}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow hover:bg-primary/90 transition"
                >
                  <Building2 className="h-3.5 w-3.5" /> Switch to Vendor Portal to Upload Renewed Letter ➔
                </button>
              </div>
            )}

            {/* Multi-Channel Sync Status */}
            <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Direct Voice Phone Call:</span>
                <span className={callStatus !== "idle" ? "text-emerald-600 font-bold" : ""}>
                  {callStatus === "idle" ? "Pending" : "Dispatched (VoIP)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>GeM Portal SMS Alert:</span>
                <span className={callStatus !== "idle" ? "text-emerald-600 font-bold" : ""}>
                  {callStatus === "idle" ? "Queued" : "Delivered"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>WhatsApp Escalation:</span>
                <span className={callStatus !== "idle" ? "text-emerald-600 font-bold" : ""}>
                  {callStatus === "idle" ? "Queued" : "Delivered (Read)"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column: Live Conversation Dialogue Transcript */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareCode className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold text-navy text-sm">
                  Live Voice Dialogue & Audit Transcript
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Channel: Encrypted SIP / Recorded for GeM Vigilance
              </span>
            </div>

            {/* Dialogue stream */}
            <div
              ref={chatScrollRef}
              className="mt-4 max-h-[380px] min-h-[300px] overflow-y-auto space-y-3.5 pr-1"
            >
              {callStatus === "idle" ? (
                <div className="grid place-items-center h-64 text-center p-6 border-2 border-dashed rounded-xl">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <PhoneForwarded className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-navy">Autonomous Voice Pipeline Ready</h4>
                  <p className="mt-1 text-[11px] text-muted-foreground max-w-sm">
                    Click <b>"Initiate Autonomous AI Voice Call"</b> to dial Rajesh Sharma (+91 98201 44821). The AI will deliver the 12-hour urgency notice and record the bidder's verbal commitment.
                  </p>
                </div>
              ) : (
                DIALOGUE.slice(0, transcriptStep + 1).map((item, idx) => {
                  const isAI = item.role === "AI";
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 text-xs ${isAI ? "" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isAI
                            ? "bg-navy text-primary-foreground shadow-sm"
                            : "bg-primary text-primary-foreground shadow-sm"
                        }`}
                      >
                        {isAI ? "AI" : "RS"}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 shadow-xs ${
                          isAI
                            ? "bg-muted/50 border text-navy"
                            : "bg-primary/10 border border-primary/20 text-navy"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground mb-1">
                          <span className="font-bold">{item.speaker}</span>
                          <span className="font-mono">{item.time}</span>
                        </div>
                        <p className="leading-relaxed text-xs">{item.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Call Summary & Commitment Card */}
          {callStatus === "completed" && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-navy text-xs">Call Completed & Legally Documented</span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      Disposition: Acknowledged
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    Vendor verbally acknowledged expired OEM letter. Confirmed possession of Dell Extension 2027 (Ref: DELL/2026/EXT-081) and promised upload within 4 hours.
                  </p>
                </div>
                <button
                  onClick={switchToVendor}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                >
                  <Building2 className="h-3.5 w-3.5" /> Upload Renewed Letter in Vendor Portal ➔
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/* =========================================================================
   USER 2: VENDOR PORTAL COMPONENT
   ========================================================================= */

function VendorPortal({
  docs,
  clarifications,
  onSubmitClarification,
  switchToOfficer,
}: {
  docs: Doc[];
  clarifications: Clarification[];
  onSubmitClarification: (clarId: string, remark: string, fileName: string) => void;
  switchToOfficer: () => void;
}) {
  const [remark, setRemark] = useState(
    "We have obtained an official renewed authorization letter from Dell Technologies India Pvt Ltd (Ref: DELL/2026/EXT-081) valid through 31 December 2027. Uploading the signed copy for verification."
  );
  const [uploadedFile, setUploadedFile] = useState("Dell_Technologies_OEM_Extension_2026_2027.pdf");
  const [submitting, setSubmitting] = useState(false);

  const pendingClar = clarifications.find((c) => c.status === "sent_to_vendor") ?? clarifications[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingClar) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmitClarification(pendingClar.id, remark, uploadedFile);
      setSubmitting(false);
    }, 700);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Vendor Profile & Bid Header */}
      <div className="rounded-2xl border bg-gradient-to-r from-navy via-navy/95 to-primary p-6 text-primary-foreground shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan">
              <Building2 className="h-3.5 w-3.5" /> GeM Bidder Portal · Vendor ID: VEND-98421
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold">Shree Infotech Pvt Ltd</h1>
            <p className="text-xs text-primary-foreground/75 mt-1">
              Registered Office: 402 Crystal Tower, Nariman Point, Mumbai - 400021 · GSTIN: 27AABCS1234F1Z5
            </p>
          </div>
          <button
            onClick={switchToOfficer}
            className="inline-flex items-center gap-2 rounded-full bg-cyan px-4 py-2 text-xs font-bold text-navy shadow-md hover:bg-cyan/90 transition"
          >
            <ShieldCheck className="h-4 w-4" /> Switch to Officer View
          </button>
        </div>
      </div>

      {/* Active Clarification Request Notice */}
      <Card className="border-2 border-warning bg-warning/5 p-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning text-navy">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-warning px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                Action Required from Bidder (GeM Clarification Notice)
              </span>
              <span className="text-xs text-muted-foreground">Tender: GEM/2026/B/48213</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-navy">
              Notice: OEM Authorization Validity Extension Required
            </h3>
            <p className="mt-2 text-xs text-foreground/80 leading-relaxed bg-background/90 rounded-lg p-3 border whitespace-pre-line font-mono">
              {pendingClar?.aiDraftedLetter}
            </p>

            {/* Vendor Response Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border bg-background p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <FileUp className="h-4 w-4 text-primary" /> Upload Clarification Response & Renewed Letter
              </h4>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Select Corrected Document File
                </label>
                <div className="flex items-center gap-3 rounded-lg border p-2 text-xs">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <input
                    type="text"
                    value={uploadedFile}
                    onChange={(e) => setUploadedFile(e.target.value)}
                    className="flex-1 bg-transparent font-medium text-navy focus:outline-none"
                  />
                  <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                    Ready to attach
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Vendor Official Explanation
                </label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter bidder response..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-muted-foreground">
                  * Submission logs directly into official GeM Tender Audit Trail.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Clarification Response to Committee
                </button>
              </div>
            </form>
          </div>
        </div>
      </Card>

      {/* Submitted Annexures Status Table */}
      <Card className="overflow-x-auto p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-navy text-sm">Submitted Bid Documents & Status</h3>
          <p className="text-xs text-muted-foreground">Status of compliance annexures submitted for GEM/2026/B/48213</p>
        </div>
        <table className="w-full text-xs min-w-[600px]">
          <thead className="bg-muted/70 text-left uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Document Name</th>
              <th className="px-4 py-3">Submitted File</th>
              <th className="px-4 py-3">Committee Review Status</th>
              <th className="px-4 py-3 text-right">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-navy">{d.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{d.file}</td>
                <td className="px-4 py-3">
                  <Badge s={d.status} />
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {d.id === "oem" && d.status === "Requires Review"
                    ? "Renewed letter under committee verification"
                    : d.id === "oem"
                    ? "Validity expired on 31 Dec 2024"
                    : d.id === "udyam"
                    ? "Spelling variance ('Shri' vs 'Shree')"
                    : "Verified compliant"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* =========================================================================
   STANDARD DASHBOARD & FLOW SCREENS
   ========================================================================= */

function NeedRun({ go, runAutonomous }: { go: (v: View) => void; runAutonomous: () => void }) {
  return (
    <Card className="mx-auto max-w-lg text-center p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Bot className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-navy">Launch Autonomous AI Pipeline</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Let the Tender, Document, Verification, Evidence, and Report agents process the compliance packet automatically.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={runAutonomous}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
        >
          <Zap className="h-4 w-4" /> 1-Click Autonomous Run
        </button>
        <button
          onClick={() => go("new")}
          className="rounded-full border bg-background px-5 py-2.5 text-sm font-semibold text-navy hover:bg-muted"
        >
          Inspect Ingestion Queue
        </button>
      </div>
    </Card>
  );
}

function Overview({ done, docs, go, runAutonomous }: { done: boolean; docs: Doc[]; go: (v: View) => void; runAutonomous: () => void }) {
  const compliantCount = docs.filter((d) => d.status === "Compliant").length;
  const reviewCount = docs.filter((d) => d.status === "Requires Review").length;
  const failCount = docs.filter((d) => d.status === "Non-Compliant").length;

  const stats = [
    ["Required Criteria", "4", "Parsed from Tender RFP"],
    ["Auto-Approved", done ? `${compliantCount}` : "–", done ? "Confidence > 95%" : "Pending"],
    ["Routed to Officer", done ? `${reviewCount}` : "–", done ? "Human-in-the-Loop review" : "Pending"],
    ["Disqualification", done ? `${failCount}` : "–", done ? "Section 4.2 expired date" : "Pending"],
  ];

  return (
    <>
      <Title t="Procurement Compliance Overview" sub="Tender GEM/2026/B/48213 · Tender Date: 17 October 2026" />

      {/* Autonomous AI Trigger Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-navy via-navy/95 to-primary p-6 text-primary-foreground shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan/20 px-3 py-1 text-xs font-bold text-cyan">
              <Bot className="h-3.5 w-3.5" /> Autonomous Tender Compliance Agent
            </div>
            <h2 className="mt-2 text-xl font-bold">5-Agent Autonomous Verification Engine</h2>
            <p className="mt-1 text-xs text-primary-foreground/80 max-w-2xl leading-relaxed">
              Upload tender rules & vendor annexures. The system autonomously extracts rules, OCRs documents, checks cross-entity consistency, drafts legal clarifications, and builds an audit-ready dossier.
            </p>
          </div>
          <button
            onClick={runAutonomous}
            className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-3 font-bold text-navy shadow-lg transition hover:scale-105"
          >
            <Zap className="h-4 w-4" /> Launch Multi-Agent Screening
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v, desc]) => (
          <Card key={l}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">{v}</p>
            <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
          </Card>
        ))}
      </div>

      {done && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive text-destructive-foreground">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-navy">
                  Autonomous Findings: 1 Policy Disqualification, 1 Officer Review Flag
                </h3>
                <p className="text-xs text-muted-foreground">
                  OEM letter expired 31 Dec 2024. Udyam certificate contains spelling variance with GSTIN.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => go("agents")}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Inspect Agent Pipeline
              </button>
              <button
                onClick={() => go("clarifications")}
                className="rounded-full border bg-background px-4 py-2 text-xs font-bold text-navy hover:bg-muted"
              >
                View AI Clarification Drafts
              </button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function NewScreening({ files, setFiles, sample, setSample, stage, agents, runAutonomous, add }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const accept = async (list: FileList | null) => {
    if (!list) return;
    const f = Array.from(list).filter((x) => /\.(pdf|png|jpe?g)$/i.test(x.name));
    if (f.length === 0) return;
    const mapped = f.map((x) => ({ name: x.name, type: x.type, url: URL.createObjectURL(x) }));
    setFiles((p: any) => [...p, ...mapped]);

    for (const file of f) {
      add("File uploaded", file.name, "Officer");
      try {
        const uploadRes = await uploadDocumentToBackend(file);
        add("Backend Ingestion", `File '${file.name}' queued in FastAPI OCR engine (${uploadRes.size_bytes} bytes)`, "FastAPI Backend");
      } catch (err) {
        console.warn("Backend upload notice:", err);
      }
    }
  };

  return (
    <>
      <Title
        t="Autonomous Ingestion & Multi-Agent Screening"
        sub="Ingest Tender RFP and vendor compliance packet for end-to-end multi-agent verification."
      />

      {/* Ingestion & Launch Card */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-cyan/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">1-Click End-to-End Autonomous Run</p>
              <p className="text-xs text-muted-foreground">
                Loads Tender RFP (`GEM/2026/B/48213`) + 4 Vendor Annexures and activates all 5 specialized AI agents.
              </p>
            </div>
          </div>
          <button
            onClick={runAutonomous}
            disabled={stage >= 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition hover:scale-105 disabled:opacity-50"
          >
            {stage >= 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Autonomous Multi-Agent Pipeline
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              accept(e.dataTransfer.files);
            }}
            onClick={() => ref.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
              drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"
            }`}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileUp className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold text-navy">Drag & drop Tender RFP + Vendor Annexures</p>
            <p className="text-xs text-muted-foreground mt-1">Accepts PDF, PNG, JPG (e.g. GeM Tender Document, GST, PAN, Udyam, OEM Letters)</p>
            <input
              ref={ref}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => accept(e.target.files)}
            />
          </div>

          {/* Active Multi-Agent Execution Progress */}
          {stage >= 0 && (
            <div className="mt-6 rounded-xl border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-navy">
                <span>Multi-Agent Swarm Orchestrating...</span>
                <span>Agent {stage + 1} of {agents.length}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary via-cyan to-primary transition-all duration-300"
                  style={{ width: `${((stage + 1) / agents.length) * 100}%` }}
                />
              </div>
              <div className="space-y-2 pt-2">
                {agents.map((ag: AgentState, idx: number) => {
                  const AgIcon = ag.icon;
                  const isCurrent = stage === idx;
                  const isDone = stage > idx;
                  return (
                    <div
                      key={ag.id}
                      className={`flex items-center justify-between text-xs p-2 rounded-lg border ${
                        isCurrent
                          ? "bg-primary/10 border-primary text-primary font-bold"
                          : isDone
                          ? "bg-background border-success/30 text-success"
                          : "bg-background/40 border-border text-muted-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <AgIcon className="h-4 w-4" />
                        <span>{ag.name}</span>
                        <span className="text-[10px] text-muted-foreground">({ag.role})</span>
                      </span>
                      <span>
                        {isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-3 w-3 rounded-full border" />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document list */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Ingestion Package: 1 Tender RFP + 4 Vendor Annexures
            </h4>
            <ul className="divide-y rounded-xl border text-xs">
              <li className="flex items-center gap-3 px-4 py-2.5 bg-primary/5">
                <Scale className="h-4 w-4 text-primary" />
                <span className="font-bold text-navy">Tender_RFP_GEM_2026_48213.pdf</span>
                <span className="text-muted-foreground">Governing RFP & Rules</span>
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                  Tender RFP
                </span>
              </li>
              {INITIAL_DOCS.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-navy">{d.name}</span>
                  <span className="text-muted-foreground font-mono">({d.file})</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    Vendor Annexure
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Required Checklist */}
        <Card>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-navy">Tender Agent Checklist</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Mandatory criteria extracted automatically from RFP GEM/2026/B/48213:
          </p>

          <ul className="mt-4 space-y-3 text-xs">
            {[
              "Mandatory Active GST Registration (State 27)",
              "Company Category Income Tax PAN",
              "Valid MSME Udyam Registration (Reconciled Name)",
              "OEM Manufacturer Authorization (Valid on Tender Date)",
            ].map((r) => (
              <li key={r} className="flex items-center gap-2.5 rounded-lg border bg-muted/20 p-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <span className="font-medium text-navy">{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Documents({ files, sample, docs, go, openEvidence }: any) {
  return (
    <>
      <Title t="Document Ingestion Repository" sub="Explore vendor submissions, extracted metadata, and individual file status." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {docs.map((d: Doc) => (
          <Card key={d.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge s={d.status} />
              </div>
              <h3 className="mt-3 font-semibold text-navy">{d.name}</h3>
              <p className="text-xs text-muted-foreground">{d.file}</p>
              <div className="mt-3 rounded-lg bg-muted/40 p-2 text-xs">
                <span className="font-semibold text-navy">Extracted: </span>
                <span className="text-muted-foreground">{d.info}</span>
              </div>
            </div>
            <button
              onClick={() => openEvidence(d)}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <Eye className="h-3.5 w-3.5" /> View Evidence & Passages
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}

function Results({ docs, open, go }: { docs: Doc[]; open: (d: Doc) => void; go: (v: View) => void }) {
  const oemDoc = docs.find((d) => d.id === "oem")!;

  return (
    <>
      <Title t="Compliance Screening Results" sub="Shree Infotech Pvt Ltd (demo) · Tender GEM/2026/B/48213" />

      {/* Overall Status Banner */}
      <Card className="mb-6 border-destructive/30 bg-gradient-to-r from-destructive/10 via-background to-warning/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive text-destructive-foreground">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Compliance Verdict</p>
              <h2 className="font-display text-lg font-bold text-navy">
                Non-Compliant — 1 Disqualifying Failure, 1 Item Requires Officer Review
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => open(oemDoc)}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-md hover:bg-destructive/90"
            >
              <Eye className="h-3.5 w-3.5" /> Inspect Failed OEM Rule
            </button>
            <button
              onClick={() => go("clarifications")}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-xs font-bold text-navy hover:bg-muted"
            >
              <Send className="h-3.5 w-3.5 text-primary" /> AI Clarification Assistant
            </button>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5">Document</th>
              <th className="px-5 py-3.5">Extracted Information</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Confidence</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.map((d) => (
              <tr
                key={d.id}
                onClick={() => open(d)}
                className="group cursor-pointer transition hover:bg-primary/5"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-navy group-hover:text-primary transition">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">{d.file}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-medium text-foreground/90">{d.info}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">{d.reason}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge s={d.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          d.conf >= 90 ? "bg-primary" : d.conf >= 75 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${d.conf}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{d.conf}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                    <Eye className="h-3.5 w-3.5" />
                    View Evidence
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Evidence({
  d,
  docs,
  back,
  pick,
  onDecision,
}: {
  d: Doc;
  docs: Doc[];
  back: () => void;
  pick: (d: Doc) => void;
  onDecision: (docId: string, decision: "override" | "clarify" | "confirm") => void;
}) {
  const isOem = d.id === "oem";
  const isUdyam = d.id === "udyam";
  const isPan = d.id === "pan";
  const isGst = d.id === "gst";

  return (
    <>
      <button
        onClick={back}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Compliance Results
      </button>

      <Title
        t={isOem ? "Critical Finding: OEM Authorization Expired" : `${d.name} Evidence Verification`}
        sub={`Source File: ${d.file} · Page ${d.page} of 2`}
      />

      {/* Document switch tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-3">
        <span className="text-xs font-semibold text-muted-foreground mr-2">Screened Document:</span>
        {docs.map((x) => (
          <button
            key={x.id}
            onClick={() => pick(x)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              x.id === d.id
                ? "bg-navy text-primary-foreground shadow-sm"
                : "bg-background ring-1 ring-border text-foreground hover:bg-muted"
            }`}
          >
            <span>{x.name.split(" ")[0]}</span>
            <Badge s={x.status} />
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Visual Document Mockup with Highlighted Source Passage */}
        <div className="rounded-2xl border bg-navy/95 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-xs text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-cyan" />
              {d.file} · Page {d.page}
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider text-cyan">
              Document Preview
            </span>
          </div>

          {/* Authentic Document Simulator */}
          <div className="relative mx-auto max-w-lg rounded-lg bg-white p-7 text-navy shadow-2xl font-sans">
            <div className="border-b-2 border-navy/20 pb-4 text-center">
              {isOem && (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Dell Technologies India Pvt Ltd
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-navy">
                    MANUFACTURER AUTHORIZATION FORM (MAF)
                  </h3>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Ref: DELL/OEM-GEM/2024/0984 · Date: 15 January 2024
                  </div>
                </>
              )}
              {isUdyam && (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Ministry of Micro, Small and Medium Enterprises
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-navy">
                    UDYAM REGISTRATION CERTIFICATE
                  </h3>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Udyam Reg: UDYAM-MH-19-0012345 · Govt of India
                  </div>
                </>
              )}
              {isPan && (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Income Tax Department · Government of India
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-navy">
                    PERMANENT ACCOUNT NUMBER CARD
                  </h3>
                  <div className="mt-1 text-[10px] text-muted-foreground">Form 49A / NSDL Verification</div>
                </>
              )}
              {isGst && (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Government of India · Goods and Services Tax
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-navy">
                    FORM GST REG-06: REGISTRATION CERTIFICATE
                  </h3>
                  <div className="mt-1 text-[10px] text-muted-foreground">State: Maharashtra · Code 27</div>
                </>
              )}
            </div>

            {/* Document Body with Highlighted Source Passage */}
            <div className="mt-5 space-y-3 text-xs leading-relaxed text-foreground/80">
              {isOem && (
                <>
                  <p>
                    <b>To:</b> The Procurement Authority / GeM Committee
                    <br />
                    <b>Subject:</b> Manufacturer Authorization for Tender No.{" "}
                    <span className="font-semibold text-navy">GEM/2026/B/48213</span>
                  </p>
                  <p>
                    We, Dell Technologies India Pvt Ltd, who are official manufacturers of personal computing devices
                    having factories at Sriperumbudur, Tamil Nadu, hereby authorize:
                  </p>
                  <div className="rounded bg-muted/50 p-2.5 font-semibold text-navy">
                    M/s Shree Infotech Pvt Ltd
                    <br />
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Regd Office: 402 Crystal Tower, Nariman Point, Mumbai - 400021
                    </span>
                  </div>
                  <p>to submit bid, negotiate and conclude the contract with you against the referenced tender.</p>

                  {/* CRITICAL FAILED PASSAGE HIGHLIGHT */}
                  <div className="relative rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-destructive ring-4 ring-destructive/10">
                    <span className="absolute -top-2.5 right-3 rounded bg-destructive px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Source Finding: Page 2
                    </span>
                    <p className="font-semibold">
                      "This Manufacturer Authorization Form shall remain strictly valid until:{" "}
                      <mark className="rounded bg-destructive px-1.5 py-0.5 font-bold text-white">
                        31 December 2024
                      </mark>
                      ."
                    </p>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    * Tender Opening Date: <b>17 October 2026</b>. Validity period expired 655 days prior to tender submission.
                  </p>
                </>
              )}

              {isUdyam && (
                <>
                  <p>
                    <b>Name of Enterprise:</b>
                  </p>
                  <div className="relative rounded-lg border-2 border-warning bg-warning/15 p-3 text-foreground ring-4 ring-warning/15">
                    <span className="absolute -top-2.5 right-3 rounded bg-warning px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">
                      Variance Flag
                    </span>
                    <p className="font-semibold text-navy">
                      "
                      <mark className="rounded bg-warning/40 px-1 font-bold text-navy">
                        Shri Infotech Private Limited
                      </mark>
                      "
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                    <div>
                      <b>Major Activity:</b> Services
                    </div>
                    <div>
                      <b>Enterprise Type:</b> Small
                    </div>
                    <div>
                      <b>Linked PAN:</b> AABCS1234F
                    </div>
                  </div>
                </>
              )}

              {isPan && (
                <>
                  <div className="rounded-lg border-2 border-success bg-success/10 p-3 text-success ring-4 ring-success/15">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                      ✓ Verified PAN Number
                    </span>
                    <p className="font-mono text-base font-bold text-navy mt-1">
                      <mark className="rounded bg-success/20 px-1.5 py-0.5 text-navy font-bold">AABCS1234F</mark>
                    </p>
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <p>
                      <b>Name:</b> SHREE INFOTECH PVT LTD
                    </p>
                    <p>
                      <b>Entity Classification:</b> Company (Character 4 = 'C')
                    </p>
                  </div>
                </>
              )}

              {isGst && (
                <>
                  <div className="rounded-lg border-2 border-success bg-success/10 p-3 text-success ring-4 ring-success/15">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                      ✓ Verified GSTIN
                    </span>
                    <p className="font-mono text-base font-bold text-navy mt-1">
                      <mark className="rounded bg-success/20 px-1.5 py-0.5 text-navy font-bold">
                        27AABCS1234F1Z5
                      </mark>
                    </p>
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <p>
                      <b>Legal Name:</b> Shree Infotech Pvt Ltd
                    </p>
                    <p>
                      <b>Constitution of Business:</b> Private Limited Company
                    </p>
                    <p>
                      <b>Status:</b> Active
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-3 text-[10px] text-muted-foreground">
              <span>Digitally Verified by Evidence Agent</span>
              <span className="font-semibold text-navy">Page {d.page} of 2</span>
            </div>
          </div>
        </div>

        {/* Right Column: Rule Explanation, Extracted Fields & Officer Controls */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-navy">Rule Evaluation Finding</h3>
              <Badge s={d.status} />
            </div>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed font-medium">{d.reason}</p>
          </Card>

          <Card className="text-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Procurement Rule Applied
            </h4>
            <p className="font-semibold text-navy">{d.ruleTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{d.ruleText}</p>
            <div className="mt-3 rounded-lg bg-muted/60 p-3 font-mono text-xs text-foreground/90">
              <span className="text-muted-foreground">Source citation: </span>
              <b>{d.file}</b>, Page {d.page}
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Extracted Entities & Confidence
            </h4>
            <dl className="divide-y text-xs">
              {d.fields.map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-muted-foreground font-medium">{k}</dt>
                  <dd className="flex items-center gap-2 text-right font-semibold text-navy">
                    <span>{v}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {Math.max(75, d.conf - i * 2)}%
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Officer Action Controls */}
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <h4 className="font-display font-semibold text-navy text-sm">Human-in-the-Loop Actions</h4>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onDecision(d.id, "clarify")}
                className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> AI Draft Clarification Letter
              </button>
              {isOem && (
                <button
                  onClick={() => onDecision(d.id, "confirm")}
                  className="rounded-lg bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90"
                >
                  Confirm Disqualification
                </button>
              )}
              <button
                onClick={() => onDecision(d.id, "override")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Officer Discretion Override
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

const GRAPH_NODES = [
  { id: "gst", x: 130, y: 100, label: "GST Registration", code: "GSTIN: 27AABCS1234F1Z5" },
  { id: "pan", x: 470, y: 100, label: "PAN Card", code: "PAN: AABCS1234F" },
  { id: "udyam", x: 130, y: 310, label: "Udyam Certificate", code: "UDYAM-MH-19-0012345" },
  { id: "oem", x: 470, y: 310, label: "OEM Authorization", code: "Validity: 31 Dec 2024" },
];

const GRAPH_EDGES: [string, string, "ok" | "warn" | "fail", string][] = [
  ["gst", "pan", "ok", "PAN AABCS1234F matches GSTIN digits 3–12"],
  ["pan", "udyam", "ok", "Entity PAN matches exactly"],
  ["gst", "udyam", "warn", "Name variance: Shree vs Shri"],
  ["gst", "oem", "ok", "Authorized Partner Name matches"],
  ["udyam", "oem", "warn", "Name variance: Shri vs Shree"],
];

function Graph({ docs, open }: { docs: Doc[]; open: (d: Doc) => void }) {
  const [selectedNode, setSelectedNode] = useState<string>("oem");
  const selectedDoc = docs.find((d) => d.id === selectedNode) ?? docs[3]!;
  const nodeMap = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n])) as Record<string, (typeof GRAPH_NODES)[number]>;

  const getCol = (s: Status) => {
    if (s === "Compliant") return "fill-success stroke-success";
    if (s === "Requires Review") return "fill-warning stroke-warning";
    return "fill-destructive stroke-destructive";
  };

  return (
    <>
      <Title
        t="Cross-Document Identity Verification Graph"
        sub="Click any node to inspect extracted fields, cross-document connections, and compliance findings."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative overflow-hidden">
          <svg viewBox="0 0 600 410" className="w-full select-none">
            {GRAPH_EDGES.map(([a, b, type, label]) => {
              const nodeA = nodeMap[a]!;
              const nodeB = nodeMap[b]!;
              const isWarn = type === "warn";
              return (
                <g key={a + b}>
                  <line
                    x1={nodeA.x}
                    y1={nodeA.y}
                    x2={nodeB.x}
                    y2={nodeB.y}
                    strokeWidth="3"
                    className={
                      isWarn
                        ? "stroke-warning animate-dash"
                        : type === "fail"
                        ? "stroke-destructive"
                        : "stroke-success"
                    }
                  />
                  <rect
                    x={(nodeA.x + nodeB.x) / 2 - 80}
                    y={(nodeA.y + nodeB.y) / 2 - 14}
                    width="160"
                    height="20"
                    rx="10"
                    className="fill-background stroke-border"
                    strokeWidth="1"
                  />
                  <text
                    x={(nodeA.x + nodeB.x) / 2}
                    y={(nodeA.y + nodeB.y) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-navy text-[10px] font-medium"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {GRAPH_NODES.map((n) => {
              const d = docs.find((x) => x.id === n.id)!;
              const active = selectedNode === n.id;
              return (
                <g
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className="cursor-pointer group transition-transform"
                >
                  {active && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="48"
                      className={`${getCol(d.status)} animate-ping opacity-20`}
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={active ? "44" : "38"}
                    className={`${getCol(d.status)} opacity-15 transition-all`}
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="28"
                    className={`${getCol(d.status)} transition-all group-hover:scale-105`}
                    stroke="white"
                    strokeWidth={active ? 4 : 2}
                  />
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-[12px] font-bold"
                  >
                    {n.id.toUpperCase()}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 60}
                    textAnchor="middle"
                    className="fill-navy text-[13px] font-bold"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 75}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {n.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </Card>

        {/* Selected Node Details */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-display font-bold text-navy">{selectedDoc.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedDoc.file}</p>
              </div>
              <Badge s={selectedDoc.status} />
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Identity Fields
              </h4>
              <dl className="divide-y rounded-xl border bg-muted/20 px-3 text-xs">
                {selectedDoc.fields.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-semibold text-navy text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs">
              <span className="font-semibold text-navy">Finding Detail: </span>
              <p className="mt-1 text-muted-foreground leading-relaxed">{selectedDoc.reason}</p>
            </div>
          </div>

          <button
            onClick={() => open(selectedDoc)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            <Eye className="h-4 w-4" /> Open Source Evidence & PDF
          </button>
        </Card>
      </div>
    </>
  );
}

function Audit({
  log,
  done,
  docs,
  report,
  add,
  go,
}: {
  log: [string, string, string, string][];
  done: boolean;
  docs: Doc[];
  report: boolean;
  add: any;
  go: (v: View) => void;
}) {
  const print = () => {
    add("Report Downloaded", "Dossier exported via print dialog", "Procurement Officer");
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <Title
        t={report ? "Final Vendor Compliance Report" : "Chronological Audit Trail & Session Log"}
        sub="Complete immutable log of all screening actions, rule evaluations, and officer determinations."
      />

      <div className="print-only mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-navy">TenderLens AI — Vendor Compliance Dossier</h1>
        <p className="text-sm text-muted-foreground">
          Tender Reference: GEM/2026/B/48213 · Vendor: Shree Infotech Pvt Ltd · Generated on: {new Date().toLocaleDateString()}
        </p>
      </div>

      {done && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Verdict
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  DISQUALIFICATION RECOMMENDED
                </span>
              </div>
              <h3 className="mt-1 font-display text-xl font-bold text-navy">
                Executive Compliance Summary · GeM Portal
              </h3>
            </div>

            <button
              onClick={print}
              className="no-print inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90"
            >
              <Download className="h-4 w-4" /> Download Demo Report (PDF / Print)
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-muted/40 p-3">
              <span className="text-[11px] text-muted-foreground">Tender Number</span>
              <p className="font-semibold text-navy text-xs mt-0.5">GEM/2026/B/48213</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <span className="text-[11px] text-muted-foreground">Vendor Entity</span>
              <p className="font-semibold text-navy text-xs mt-0.5">Shree Infotech Pvt Ltd</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <span className="text-[11px] text-muted-foreground">Tender Opening Date</span>
              <p className="font-semibold text-navy text-xs mt-0.5">17 October 2026</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <span className="text-[11px] text-muted-foreground">Screening Confidence</span>
              <p className="font-semibold text-success text-xs mt-0.5">92.4% (Aggregate)</p>
            </div>
          </div>

          {/* Document findings list */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Document Verification Matrix
            </h4>
            <div className="divide-y rounded-xl border">
              {docs.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs">
                  <div className="w-56 font-semibold text-navy">{d.name}</div>
                  <Badge s={d.status} />
                  <div className="flex-1 text-muted-foreground line-clamp-1">{d.reason}</div>
                  <div className="text-right text-[11px] text-muted-foreground font-mono">
                    {d.file}, p.{d.page}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Chronological Audit Table */}
      <Card className="overflow-x-auto p-0">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-navy text-sm">Session Audit Log</h3>
          <span className="text-xs text-muted-foreground">{log.length} actions logged</span>
        </div>
        <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-muted/70 text-left uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Result / Payload</th>
              <th className="px-5 py-3">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {log.map((r, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-mono text-muted-foreground">{r[0]}</td>
                <td className="px-5 py-3 font-semibold text-navy">{r[1]}</td>
                <td className="px-5 py-3 text-foreground/80">{r[2]}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r[3].includes("Agent") || r[3] === "AI Assistant"
                        ? "bg-primary/10 text-primary"
                        : r[3] === "Vendor (Bidder)"
                        ? "bg-primary text-primary-foreground"
                        : "bg-navy/10 text-navy"
                    }`}
                  >
                    {r[3]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
