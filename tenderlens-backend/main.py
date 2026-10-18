import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ScreeningResponse,
    DocumentFinding,
    AgentResult,
    ClarificationItem,
    ClarificationActionRequest
)
from agents.tender_agent import TenderAgent
from agents.document_agent import DocumentAgent
from agents.verification_agent import VerificationAgent
from agents.evidence_agent import EvidenceAgent
from agents.clarification_agent import ClarificationAgent
from agents.report_agent import ReportAgent
from agents.outreach_agent import OutreachAgent

app = FastAPI(
    title="TenderLens AI Multi-Agent API",
    description="Autonomous Multi-Agent Procurement Compliance & Verification Engine",
    version="1.0.0"
)

# Enable CORS for frontend Vite/React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent singletons
tender_agent = TenderAgent()
doc_agent = DocumentAgent()
verify_agent = VerificationAgent()
evidence_agent = EvidenceAgent()
clar_agent = ClarificationAgent()
report_agent = ReportAgent()
outreach_agent = OutreachAgent()

# In-memory persistence
_state = {
    "documents": [
        DocumentFinding(
            id="gst",
            name="GST Registration Certificate",
            file="GST_Certificate.pdf",
            info="GSTIN 27AABCS1234F1Z5 · Active",
            status="Compliant",
            conf=98,
            auto_routed="auto_approved",
            routing_reason="Clean registry match (Confidence 98% > 90% threshold). Active tax filing verified.",
            page=1,
            rule_title="Valid GST Registration & Active Status",
            rule_text="GSTIN must follow valid 15-character format, match business entity state (27: Maharashtra), and carry active filing status on verification date.",
            fields=[
                ("Legal Name", "Shree Infotech Pvt Ltd"),
                ("GSTIN", "27AABCS1234F1Z5"),
                ("State", "Maharashtra (27)"),
                ("Registration Type", "Regular"),
                ("Filing Status", "Active")
            ],
            reason="GSTIN format valid; embedded PAN matches PAN card; registered business state matches tender eligibility."
        ),
        DocumentFinding(
            id="pan",
            name="PAN Card",
            file="PAN_Card.png",
            info="PAN AABCS1234F · Company",
            status="Compliant",
            conf=96,
            auto_routed="auto_approved",
            routing_reason="100% substring match with GSTIN chars 3–12. Entity category 'C' matches Company constitution.",
            page=1,
            rule_title="Entity PAN Consistency",
            rule_text="PAN entity category (4th char 'C' for Company) must match registered constitution and align with characters 3–12 of GSTIN.",
            fields=[
                ("Entity Name", "Shree Infotech Pvt Ltd"),
                ("PAN Number", "AABCS1234F"),
                ("Entity Type", "Company (C)"),
                ("Incorporation Date", "14/08/2014")
            ],
            reason="PAN matches GSTIN characters 3–12 exactly and entity name matches GST legal name."
        ),
        DocumentFinding(
            id="udyam",
            name="Udyam/MSME Certificate",
            file="Udyam_Certificate.pdf",
            info="UDYAM-MH-19-0012345 · Name Variance",
            status="Requires Review",
            conf=79,
            auto_routed="routed_to_officer",
            routing_reason="Fuzzy string similarity score 78% < 85% threshold ('Shree' vs 'Shri'). Routed to Human-in-the-Loop officer review.",
            page=1,
            rule_title="MSME Enterprise Name Reconciliation",
            rule_text="Enterprise name in Udyam registry must be reconciled with GST and PAN certificates to verify preferential SME procurement eligibility.",
            fields=[
                ("Enterprise Name", "Shri Infotech Private Limited"),
                ("Udyam Reg Number", "UDYAM-MH-19-0012345"),
                ("Enterprise Category", "Small Enterprise"),
                ("Linked PAN", "AABCS1234F"),
                ("Major Activity", "Services / IT Infrastructure")
            ],
            reason="Linked PAN matches, but enterprise name displays spelling variance: 'Shri Infotech Private Limited' vs GST/PAN 'Shree Infotech Pvt Ltd'. Procurement officer review required."
        ),
        DocumentFinding(
            id="oem",
            name="OEM Authorization Letter",
            file="OEM_Authorization.pdf",
            info="Expired 31 Dec 2024 · Tender: 17 Oct 2026",
            status="Non-Compliant",
            conf=94,
            auto_routed="disqualification_flagged",
            routing_reason="Critical Section 4.2 policy violation. Date expired 655 days prior to tender opening.",
            page=2,
            expiry_date="31 December 2024",
            days_expired=655,
            rule_title="OEM Authorization Validity on Tender Date",
            rule_text="Manufacturer Authorization Form (MAF) must be strictly valid on the tender opening date (17 October 2026). Expired authorizations are inadmissible.",
            fields=[
                ("Authorized Partner", "Shree Infotech Pvt Ltd"),
                ("OEM Manufacturer", "Dell Technologies India Pvt Ltd"),
                ("Tender Ref", "GEM/2026/B/48213"),
                ("Validity Expiry Date", "31 December 2024"),
                ("Tender Opening Date", "17 October 2026")
            ],
            reason="Validity date (31 Dec 2024) falls 655 days prior to tender opening date (17 Oct 2026). This document fails the mandatory tender validity check."
        )
    ],
    "clarifications": [
        ClarificationItem(
            id="clar-oem",
            doc_id="oem",
            target_field="Manufacturer Authorization Validity",
            title="Clarification on Expired OEM Authorization Letter",
            ai_drafted_letter=(
                "Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\n"
                "During the technical compliance evaluation of Tender No. GEM/2026/B/48213 (Supply of 500 Enterprise Laptops), "
                "the committee noted that the submitted Manufacturer Authorization Form (MAF) from Dell Technologies India Pvt Ltd specifies validity until 31 December 2024.\n\n"
                "Per Section 4.2 of the mandatory tender eligibility conditions, the OEM authorization must remain strictly valid on the tender opening date (17 October 2026).\n\n"
                "Please provide an official authorization extension letter issued by Dell Technologies confirming ongoing partner authorization through the delivery and warranty period. "
                "Submit within 72 hours via GeM portal."
            ),
            status="drafted_by_ai"
        ),
        ClarificationItem(
            id="clar-udyam",
            doc_id="udyam",
            target_field="Legal Name Spelling Consistency",
            title="Reconciliation of Enterprise Name on Udyam Certificate",
            ai_drafted_letter=(
                "Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\n"
                "Verification of your MSME Udyam Registration Certificate (UDYAM-MH-19-0012345) shows the enterprise name recorded as 'Shri Infotech Private Limited', "
                "whereas your PAN Card (AABCS1234F) and GSTIN (27AABCS1234F1Z5) specify the legal name as 'Shree Infotech Pvt Ltd'.\n\n"
                "To ensure proper eligibility under the Public Procurement Policy for MSEs, please upload an affidavit, board resolution, or MCA Certificate of Incorporation amendment confirming that both spellings refer to the identical legal entity."
            ),
            status="drafted_by_ai"
        )
    ],
    "audit_log": [
        ["10:02:11", "Tender RFP Uploaded", "Parsed GEM/2026/B/48213 rules", "Tender Agent"],
        ["10:02:12", "OCR Extraction Complete", "4 vendor documents parsed (19 entities)", "Document Agent"],
        ["10:02:13", "Rule Evaluation: GSTIN-PAN", "Auto-Approved: 100% PAN match", "Verification Agent"],
        ["10:02:14", "Fuzzy Name Check: Udyam", "Routed to Officer: Name variance (78% match)", "Verification Agent"],
        ["10:02:15", "Expiry Check: OEM MAF", "Critical Failure: Lapsed on 31 Dec 2024 (-655 days)", "Verification Agent"],
        ["10:02:16", "Evidence Pinned", "Source passages and page citations attached", "Evidence Agent"],
        ["10:02:17", "AI Clarification Drafted", "Legally precise letters prepared for OEM & Udyam", "AI Assistant"],
        ["10:02:18", "Dossier Compiled", "Risk score computed (Overall: Non-Compliant)", "Report Agent"]
    ]
}

def log_event(action: str, result: str, actor: str):
    time_str = datetime.now().strftime("%H:%M:%S")
    _state["audit_log"].append([time_str, action, result, actor])

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TenderLens AI Multi-Agent Backend",
        "version": "1.0.0",
        "agents": ["Tender Agent", "Document Agent", "Verification Agent", "Evidence Agent", "Report Agent"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/screen/autonomous", response_model=ScreeningResponse)
def run_autonomous_screening(tender_id: str = "GEM/2026/B/48213"):
    """Executes the full 5-agent autonomous verification workflow."""
    
    # 1. Tender Agent
    t_res = tender_agent.extract_criteria(tender_id)
    
    # 2. Document Agent
    d_res = doc_agent.parse_documents()
    
    # 3. Verification Agent
    v_res = verify_agent.verify(t_res, d_res["documents"])
    
    # 4. Evidence Agent
    e_res = evidence_agent.attach_evidence()
    
    # 5. Report Agent
    r_res = report_agent.generate_report([d.dict() for d in _state["documents"]])
    
    log_event("Autonomous Pipeline Completed", f"5 agents executed for tender {tender_id}", "Orchestrator")

    agents_list = [
        AgentResult(
            id=t_res["agent_id"],
            name=t_res["name"],
            role=t_res["role"],
            output=t_res["output"],
            time_ms=t_res["time_ms"]
        ),
        AgentResult(
            id=d_res["agent_id"],
            name=d_res["name"],
            role=d_res["role"],
            output=d_res["output"],
            time_ms=d_res["time_ms"]
        ),
        AgentResult(
            id=v_res["agent_id"],
            name=v_res["name"],
            role=v_res["role"],
            output=v_res["output"],
            time_ms=v_res["time_ms"]
        ),
        AgentResult(
            id=e_res["agent_id"],
            name=e_res["name"],
            role=e_res["role"],
            output=e_res["output"],
            time_ms=e_res["time_ms"]
        ),
        AgentResult(
            id=r_res["agent_id"],
            name=r_res["name"],
            role=r_res["role"],
            output=r_res["output"],
            time_ms=r_res["time_ms"]
        )
    ]

    return ScreeningResponse(
        success=True,
        tender_id=tender_id,
        vendor_name="Shree Infotech Pvt Ltd",
        overall_status=r_res["overall_status"],
        disqualification_count=r_res["fail_count"],
        review_count=r_res["review_count"],
        compliant_count=r_res["compliant_count"],
        agents=agents_list,
        documents=_state["documents"],
        clarifications=_state["clarifications"],
        audit_log=_state["audit_log"]
    )

@app.post("/api/clarifications/action")
def handle_clarification_action(req: ClarificationActionRequest):
    """Handles procurement officer transmission or vendor clarification submission."""
    target = next((c for c in _state["clarifications"] if c.id == req.clarification_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Clarification item not found")

    time_str = datetime.now().strftime("%H:%M:%S")

    if req.action == "approve_send":
        target.status = "sent_to_vendor"
        target.sent_at = time_str
        log_event("Clarification Transmitted", f"Official notice sent to vendor for {target.doc_id.upper()}", "Procurement Officer")
        return {"status": "success", "message": "Notice transmitted to vendor portal", "item": target}

    elif req.action == "vendor_respond":
        target.status = "responded_by_vendor"
        target.response_remark = req.remark or "Renewed letter attached."
        target.response_file = req.response_file or "Dell_Technologies_OEM_Extension_2026_2027.pdf"
        target.responded_at = time_str

        # Update the document finding to reflect renewed letter
        for d in _state["documents"]:
            if d.id == target.doc_id:
                d.status = "Requires Review"
                d.info = "Renewed Letter Submitted (Valid till 31 Dec 2027)"
                d.reason = "Vendor uploaded renewed Dell Technologies OEM Authorization (Ref: DELL/2026/EXT-081) valid through 31 Dec 2027. Awaiting officer verification."
                d.auto_routed = "routed_to_officer"

        log_event("Vendor Clarification Responded", f"Vendor uploaded {target.response_file}", "Vendor (Bidder)")
        return {"status": "success", "message": "Response submitted to Tender Committee", "item": target}

    else:
        raise HTTPException(status_code=400, detail="Unknown action")

@app.get("/api/report/{tender_id}")
def get_final_report(tender_id: str):
    return {
        "tender_id": tender_id,
        "vendor_name": "Shree Infotech Pvt Ltd",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "overall_status": "Non-Compliant (Disqualification Recommended)",
        "documents": _state["documents"],
        "clarifications": _state["clarifications"],
        "audit_log": _state["audit_log"]
    }

@app.post("/api/upload/file")
async def upload_document(file: UploadFile = File(...)):
    """Receives real document uploads."""
    content = await file.read()
    filename = file.filename
    size = len(content)
    log_event("File Uploaded", f"{filename} ({size} bytes)", "Officer")
    return {
        "status": "success",
        "filename": filename,
        "size_bytes": size,
        "message": f"File '{filename}' ingested into TenderLens OCR queue"
    }

@app.post("/api/outreach/call")
def trigger_vendor_voice_call(
    tender_id: str = "GEM/2026/B/48213",
    clarification_id: str = "clar-oem",
    phone: str = "+91 98201 44821"
):
    """Triggers autonomous voice outreach call when vendor is unresponsive > 12 hours."""
    res = outreach_agent.initiate_vendor_call(
        tender_id=tender_id,
        clarification_id=clarification_id,
        phone_number=phone
    )
    if "call_history" not in _state:
        _state["call_history"] = []
    _state["call_history"].append(res)
    log_event(
        "Autonomous AI Voice Call Completed",
        f"Dialed vendor {phone} (Rajesh Sharma) - 12h SLA Escalation. Vendor promised upload within 4h.",
        "Outreach Voice Agent"
    )
    return res

@app.get("/api/outreach/history")
def get_call_history():
    return _state.get("call_history", [])

