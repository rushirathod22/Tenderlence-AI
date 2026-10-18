import time
from typing import Dict, Any, List
from datetime import datetime

class OutreachAgent:
    """Outreach Agent: Autonomous voice & SMS escalation agent triggered when vendors fail to respond within 12 hours."""

    def __init__(self):
        self.name = "Autonomous Outreach & Voice Escalation Agent"
        self.role = "Initiates autonomous voice phone calls and SLA escalations for unresponsive bidders"

    def initiate_vendor_call(
        self,
        tender_id: str = "GEM/2026/B/48213",
        clarification_id: str = "clar-oem",
        phone_number: str = "+91 98201 44821",
        contact_person: str = "Rajesh Sharma (Director)",
        vendor_name: str = "Shree Infotech Pvt Ltd",
    ) -> Dict[str, Any]:
        """Simulates and executes an autonomous agentic phone call to the unresponsive vendor."""
        call_id = f"CALL-GEM-{int(time.time())}"
        timestamp = datetime.now().strftime("%H:%M:%S")

        transcript: List[Dict[str, str]] = [
            {
                "speaker": "AI Voice Agent",
                "time": "00:03",
                "text": f"Namaste Mr. {contact_person}. This is the TenderLens Autonomous Compliance AI calling on behalf of the Tender Committee for Tender Reference {tender_id}.",
            },
            {
                "speaker": "Vendor (Rajesh Sharma)",
                "time": "00:14",
                "text": "Yes, Rajesh Sharma here. What is this regarding? Is there any issue with our bid?",
            },
            {
                "speaker": "AI Voice Agent",
                "time": "00:26",
                "text": "We issued an official clarification notice 12 hours ago regarding your Dell OEM Authorization Form, which expired on 31 December 2024. Your submission is at risk of immediate technical disqualification under RFP Section 4.2.",
            },
            {
                "speaker": "Vendor (Rajesh Sharma)",
                "time": "00:44",
                "text": "Oh! We received the renewed authorization letter from Dell India valid till 2027 yesterday, but our executive hadn't uploaded it yet. Thank you for alerting us directly.",
            },
            {
                "speaker": "AI Voice Agent",
                "time": "00:58",
                "text": "Please upload the renewed Dell MAF document on the GeM portal within the next 4 hours. A secure upload link has also been sent to your registered WhatsApp and email.",
            },
            {
                "speaker": "Vendor (Rajesh Sharma)",
                "time": "01:08",
                "text": "I am opening the portal now and uploading it immediately. Thank you so much for the prompt reminder.",
            },
            {
                "speaker": "AI Voice Agent",
                "time": "01:14",
                "text": "Your acknowledgment has been recorded in the official audit trail. Have a good day.",
            },
        ]

        return {
            "call_id": call_id,
            "status": "completed",
            "triggered_by": "12-Hour Vendor Unresponsiveness SLA Rule",
            "tender_id": tender_id,
            "clarification_id": clarification_id,
            "vendor_name": vendor_name,
            "contact_person": contact_person,
            "phone_number": phone_number,
            "duration_seconds": 74,
            "timestamp": timestamp,
            "sentiment": "Cooperative / Immediate Action Promised",
            "disposition": "Vendor Acknowledged & Promised Immediate Upload",
            "multi_channel_sync": {
                "sms_delivered": True,
                "whatsapp_delivered": True,
                "portal_alert_synced": True,
            },
            "transcript": transcript,
            "speech_full_text": "Namaste Mr. Rajesh Sharma. This is the TenderLens Autonomous Compliance AI calling on behalf of the Tender Committee for Tender Reference GEM/2026/B/48213. We issued an official clarification notice 12 hours ago regarding your expired Dell OEM Authorization Form. Please upload your renewed authorization on the GeM portal within the next 4 hours to avoid technical disqualification.",
            "next_step": "Awaiting Vendor Document Ingestion (Dell Extension 2027)",
        }
