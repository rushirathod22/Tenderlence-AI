# TenderLens AI — Autonomous Multi-Agent Backend

A production-grade Python FastAPI service powering the TenderLens autonomous procurement verification platform.

## Architecture

- **FastAPI Core (`main.py`)**: High-performance asynchronous REST endpoints with CORS enabled for frontend communication.
- **Pydantic Schemas (`models.py`)**: Strict typing for documents, validation findings, agents, and clarification letters.
- **Specialized Multi-Agent Swarm (`agents/`)**:
  - `tender_agent.py`: Extracts mandatory eligibility clauses from tender RFPs (e.g. GeM Section 4.2).
  - `document_agent.py`: OCR parsing and layout entity extraction (GSTIN, PAN, Udyam, OEM Letters).
  - `verification_agent.py`: Cross-document consistency matching, PAN-in-GSTIN substring extraction, fuzzy name reconciliation, and OEM expiry calculation.
  - `evidence_agent.py`: Clause provenance tracking and bounding-box coordinate anchoring.
  - `clarification_agent.py`: Automated legal clarification letter generation for procurement officers.
  - `report_agent.py`: Aggregates compliance scores and generates final audit trail dossier.

## Endpoints

- `GET /api/health`: Health status and registered agents checklist.
- `POST /api/screen/autonomous?tender_id={id}`: Runs full 5-agent pipeline sequentially and returns complete audit report.
- `POST /api/clarifications/action`: Handles 1-click officer notice transmission and vendor document submission.
- `POST /api/upload/file`: Ingests multipart document uploads into the OCR queue.
- `GET /api/report/{tender_id}`: Outputs the complete tender compliance audit dossier.

## Running Locally

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python run.py
# Or directly via uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at `http://localhost:8000/docs`.
