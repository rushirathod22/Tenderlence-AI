import time
from typing import Dict, Any, List

class ClarificationAgent:
    """Clarification Agent: LLM-powered automatic drafting of formal procurement clarification notices."""

    def __init__(self):
        self.name = "AI Clarification Assistant"
        self.role = "Drafts legally compliant clarification letters"

    def draft_clarifications(self, tender_id: str = "GEM/2026/B/48213") -> List[Dict[str, Any]]:
        return [
            {
                "id": "clar-oem",
                "doc_id": "oem",
                "target_field": "Manufacturer Authorization Validity",
                "title": "Clarification on Expired OEM Authorization Letter",
                "ai_drafted_letter": (
                    f"Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\n"
                    f"During the technical compliance evaluation of Tender No. {tender_id} (Supply of 500 Enterprise Laptops), "
                    f"the committee noted that the submitted Manufacturer Authorization Form (MAF) from Dell Technologies India Pvt Ltd specifies validity until 31 December 2024.\n\n"
                    f"Per Section 4.2 of the mandatory tender eligibility conditions, the OEM authorization must remain strictly valid on the tender opening date (17 October 2026).\n\n"
                    f"Please provide an official authorization extension letter issued by Dell Technologies confirming ongoing partner authorization through the delivery and warranty period. "
                    f"Submit within 72 hours via GeM portal."
                ),
                "status": "drafted_by_ai"
            },
            {
                "id": "clar-udyam",
                "doc_id": "udyam",
                "target_field": "Legal Name Spelling Consistency",
                "title": "Reconciliation of Enterprise Name on Udyam Certificate",
                "ai_drafted_letter": (
                    f"Dear Bidder (M/s Shree Infotech Pvt Ltd),\n\n"
                    f"Verification of your MSME Udyam Registration Certificate (UDYAM-MH-19-0012345) shows the enterprise name recorded as 'Shri Infotech Private Limited', "
                    f"whereas your PAN Card (AABCS1234F) and GSTIN (27AABCS1234F1Z5) specify the legal name as 'Shree Infotech Pvt Ltd'.\n\n"
                    f"To ensure proper eligibility under the Public Procurement Policy for MSEs, please upload an affidavit, board resolution, or MCA Certificate of Incorporation amendment confirming that both spellings refer to the identical legal entity."
                ),
                "status": "drafted_by_ai"
            }
        ]
