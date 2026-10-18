from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field

class EntityField(BaseModel):
    key: str
    value: str
    confidence: float = 0.95

class DocumentFinding(BaseModel):
    id: str
    name: str
    file: str
    info: str
    status: str  # Compliant | Requires Review | Non-Compliant
    conf: int
    auto_routed: str  # auto_approved | routed_to_officer | disqualification_flagged
    routing_reason: str
    fields: List[Tuple[str, str]]
    reason: str
    rule_title: str
    rule_text: str
    page: int
    expiry_date: Optional[str] = None
    days_expired: Optional[int] = None

class AgentResult(BaseModel):
    id: str
    name: str
    role: str
    status: str = "completed"
    output: str
    time_ms: int

class ClarificationItem(BaseModel):
    id: str
    doc_id: str
    target_field: str
    title: str
    ai_drafted_letter: str
    status: str = "drafted_by_ai"  # drafted_by_ai | sent_to_vendor | responded_by_vendor
    sent_at: Optional[str] = None
    response_remark: Optional[str] = None
    response_file: Optional[str] = None
    responded_at: Optional[str] = None

class ScreeningResponse(BaseModel):
    success: bool
    tender_id: str
    vendor_name: str
    overall_status: str
    disqualification_count: int
    review_count: int
    compliant_count: int
    agents: List[AgentResult]
    documents: List[DocumentFinding]
    clarifications: List[ClarificationItem]
    audit_log: List[List[str]]

class ClarificationActionRequest(BaseModel):
    clarification_id: str
    action: str  # approve_send | vendor_respond
    remark: Optional[str] = None
    response_file: Optional[str] = None
