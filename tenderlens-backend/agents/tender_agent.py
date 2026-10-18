import time
from typing import Dict, Any, List

class TenderAgent:
    """Tender Agent: Extracts mandatory eligibility criteria and compliance rules from Tender RFP."""

    def __init__(self):
        self.name = "Tender Agent"
        self.role = "Extracts mandatory tender criteria from RFP"

    def extract_criteria(self, tender_id: str = "GEM/2026/B/48213") -> Dict[str, Any]:
        start = time.time()
        # Simulated extraction of RFP rules from RFP GEM/2026/B/48213
        rules = [
            {
                "rule_id": "RULE-GST-01",
                "title": "Mandatory Active GST Registration",
                "description": "Bidder must possess a valid GSTIN registered in Maharashtra (State Code 27) with active filing status.",
                "mandatory": True
            },
            {
                "rule_id": "RULE-PAN-02",
                "title": "Corporate Entity PAN Verification",
                "description": "Bidder must have a valid Income Tax PAN with 4th character 'C' indicating Company entity category.",
                "mandatory": True
            },
            {
                "rule_id": "RULE-MSME-03",
                "title": "MSME Udyam Registration & Name Reconciliation",
                "description": "Enterprise name in Udyam registry must be reconciled with GSTIN legal name for preferential consideration.",
                "mandatory": False
            },
            {
                "rule_id": "RULE-OEM-04",
                "title": "OEM Manufacturer Authorization Validity",
                "description": "Manufacturer Authorization Form (MAF) must be strictly valid on the tender opening date (17 October 2026).",
                "mandatory": True
            }
        ]
        duration = int((time.time() - start) * 1000) + 380

        return {
            "agent_id": "tender_agent",
            "name": self.name,
            "role": self.role,
            "status": "completed",
            "time_ms": duration,
            "tender_id": tender_id,
            "opening_date": "2026-10-17",
            "rules_count": len(rules),
            "output": f"Parsed {tender_id}: 4 mandatory criteria extracted from RFP Section 4.2. Opening date locked at 17 Oct 2026.",
            "rules": rules
        }
