import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_tender_documents")
os.makedirs(OUT_DIR, exist_ok=True)

def create_tender_rfp():
    path = os.path.join(OUT_DIR, "Tender_RFP_GEM_2026_48213.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFillColor(colors.HexColor("#071B49"))
    c.rect(0, height - 80, width, 80, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 40, "GOVERNMENT OF INDIA - GeM BID DOCUMENT")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 60, "Tender Reference: GEM/2026/B/48213 | Ministry of Electronics & IT")

    # Body
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, height - 120, "1. INVITATION FOR BIDS (IFB)")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 140, "Procurement of 500 Enterprise Workstations & Data Center Infrastructure.")
    c.drawString(40, height - 155, "Tender Opening Date: 17 October 2026 | Bid Closing: 24 October 2026")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, height - 190, "4. MANDATORY ELIGIBILITY CRITERIA (SECTION 4.2)")
    c.setFont("Helvetica", 9)
    items = [
        "4.2.1 The Bidder must have a valid and Active Goods & Services Tax Registration (GSTIN) in Maharashtra.",
        "4.2.2 The Permanent Account Number (PAN) must match the registered constitution of the bidder.",
        "4.2.3 Micro & Small Enterprises (MSEs) seeking exemption must produce a valid Udyam Registration Certificate.",
        "4.2.4 CRITICAL CLAUSE: The Bidder must submit a Manufacturer Authorization Form (MAF) from the OEM (Dell/HP/Lenovo).",
        "      The OEM Authorization MUST BE STRICTLY VALID on the Tender Opening Date (17 October 2026).",
        "      Expired authorization forms will result in immediate disqualification or clarification review."
    ]
    y = height - 210
    for it in items:
        c.drawString(40, y, it)
        y -= 18

    c.setStrokeColor(colors.HexColor("#2563EB"))
    c.setLineWidth(1)
    c.line(40, y - 10, width - 40, y - 10)

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(40, y - 30, "Authorized Tender Inviting Authority - Ministry of Electronics & Information Technology, GoI")
    c.save()
    print("Created:", path)

def create_gst_cert():
    path = os.path.join(OUT_DIR, "GST_Certificate.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    
    c.setFillColor(colors.HexColor("#0B3954"))
    c.rect(0, height - 70, width, 70, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(40, height - 42, "GOVERNMENT OF INDIA - GST REGISTRATION CERTIFICATE")

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(40, height - 110, "Registration Number (GSTIN): 27AABCS1234F1Z5")
    
    c.setFont("Helvetica", 10)
    data = [
        ("Legal Name:", "Shree Infotech Pvt Ltd"),
        ("Trade Name:", "Shree Infotech"),
        ("Constitution of Business:", "Private Limited Company"),
        ("Principal Place of Business:", "Plot 42, MIDC Andheri East, Mumbai, Maharashtra 400093"),
        ("State Code:", "27 (Maharashtra)"),
        ("Date of Liability:", "01/07/2017"),
        ("Period of Validity:", "From 01/07/2017 to Regular (Active)"),
        ("PAN Embedded:", "AABCS1234F (Chars 3 to 12)")
    ]
    y = height - 140
    for k, v in data:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y, k)
        c.setFont("Helvetica", 10)
        c.drawString(200, y, v)
        y -= 22
    
    c.setFillColor(colors.HexColor("#059669"))
    c.rect(40, y - 10, 160, 24, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y - 3, "STATUS: ACTIVE / COMPLIANT")
    c.save()
    print("Created:", path)

def create_pan_cert():
    path = os.path.join(OUT_DIR, "PAN_Card.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.HexColor("#1E3A8A"))
    c.rect(0, height - 60, width, 60, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 38, "INCOME TAX DEPARTMENT - GOVT OF INDIA (PAN)")

    c.setFillColor(colors.black)
    y = height - 100
    rows = [
        ("Permanent Account Number (PAN):", "AABCS1234F"),
        ("Name of Entity:", "Shree Infotech Pvt Ltd"),
        ("Entity Category:", "C (Company / Incorporated Body)"),
        ("Date of Incorporation:", "14/03/2012"),
        ("Jurisdiction:", "ITO Ward 12(3), Mumbai")
    ]
    for k, v in rows:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y, k)
        c.setFont("Helvetica", 10)
        c.drawString(250, y, v)
        y -= 24
    c.save()
    print("Created:", path)

def create_udyam_cert():
    path = os.path.join(OUT_DIR, "Udyam_Certificate.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.HexColor("#D97706"))
    c.rect(0, height - 65, width, 65, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 40, "MINISTRY OF MSME - UDYAM REGISTRATION CERTIFICATE")

    c.setFillColor(colors.black)
    y = height - 110
    rows = [
        ("Udyam Registration Number:", "UDYAM-MH-19-0012345"),
        ("Enterprise Name (On Certificate):", "Shri Infotech Private Limited  <-- [NOTE SPELLING VARIANCE]"),
        ("Linked PAN Number:", "AABCS1234F"),
        ("Enterprise Type:", "Small Enterprise"),
        ("Major Activity:", "Services / IT Hardware Infrastructure"),
        ("DIC Office:", "Mumbai Suburban, Maharashtra")
    ]
    for k, v in rows:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y, k)
        c.setFont("Helvetica", 10)
        c.drawString(240, y, v)
        y -= 24

    c.setFillColor(colors.HexColor("#DC2626"))
    c.drawString(40, y - 10, "* Note: Fuzzy Name Similarity 78% vs GST Legal Name 'Shree Infotech Pvt Ltd'.")
    c.save()
    print("Created:", path)

def create_oem_expired():
    path = os.path.join(OUT_DIR, "OEM_Authorization_Dell_Expired.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.HexColor("#0076CE")) # Dell Blue
    c.rect(0, height - 70, width, 70, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 45, "DELL TECHNOLOGIES - MANUFACTURER AUTHORIZATION FORM")

    c.setFillColor(colors.black)
    y = height - 110
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y, "Date of Issuance: 15 January 2024")
    y -= 20
    c.drawString(40, y, "To: The Tender Inviting Authority, Ministry of Electronics & IT (GeM/2026/B/48213)")
    y -= 30

    c.setFont("Helvetica", 10)
    c.drawString(40, y, "We, Dell Technologies India Pvt Ltd, hereby confirm that:")
    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y, "M/s Shree Infotech Pvt Ltd (Plot 42, MIDC Andheri East, Mumbai)")
    y -= 18
    c.setFont("Helvetica", 10)
    c.drawString(40, y, "is an authorized partner for supplying Dell Latitude 5440 Enterprise Workstations.")
    y -= 35

    # The failing clause
    c.setFillColor(colors.HexColor("#FEF2F2"))
    c.rect(35, y - 30, width - 70, 45, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#B91C1C"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(45, y - 5, "CRITICAL VALIDITY PERIOD (EXPIRED):")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(45, y - 22, "This authorization is strictly valid from 15 January 2024 until 31 DECEMBER 2024.")
    y -= 60

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 9)
    c.drawString(40, y, "* NOTE: Tender Opening Date is 17 October 2026. This letter expired 655 days prior.")
    c.save()
    print("Created:", path)

def create_oem_renewed():
    path = os.path.join(OUT_DIR, "Dell_Technologies_OEM_Extension_2026_2027.pdf")
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter

    c.setFillColor(colors.HexColor("#0076CE"))
    c.rect(0, height - 70, width, 70, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(40, height - 45, "DELL TECHNOLOGIES - OFFICIAL AUTHORIZATION EXTENSION")

    c.setFillColor(colors.black)
    y = height - 110
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y, "Reference: DELL/2026/EXT-081 | Date of Issuance: 18 October 2026")
    y -= 20
    c.drawString(40, y, "To: The Procurement Officer & Tender Committee, GeM Bid GEM/2026/B/48213")
    y -= 30

    c.setFont("Helvetica", 10)
    c.drawString(40, y, "In response to Clarification Notice Ref CLAR-OEM issued to M/s Shree Infotech Pvt Ltd:")
    y -= 25

    c.setFillColor(colors.HexColor("#F0FDF4"))
    c.rect(35, y - 35, width - 70, 50, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#15803D"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(45, y - 5, "RENEWED VALIDITY CONFIRMATION (ACTIVE & COMPLIANT):")
    c.setFont("Helvetica", 10)
    c.drawString(45, y - 25, "Dell Technologies confirms authorization is EXTENDED and VALID until 31 DECEMBER 2027.")
    y -= 65

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 9)
    c.drawString(40, y, "Authorized Signatory: Vice President - Commercial Channels, Dell Technologies India Pvt Ltd")
    c.save()
    print("Created:", path)

if __name__ == "__main__":
    create_tender_rfp()
    create_gst_cert()
    create_pan_cert()
    create_udyam_cert()
    create_oem_expired()
    create_oem_renewed()
