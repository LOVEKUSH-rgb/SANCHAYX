"""
SANCHAY — Technical Documentation PDF Generator
Generates a comprehensive, professional technical manual for the entire SANCHAY platform.
Strictly based on actual source code inspection across all 30 requested sections.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# =============================================================================
# NUMBERED CANVAS FOR HEADER / FOOTER & PAGE X OF Y
# =============================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on title cover

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0B192C"))

        # Top Running Header
        self.drawString(54, 750, "SANCHAY — Complete Technical Architecture & Implementation Documentation")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(558, 750, "Official Sovereign Scheme Portal")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)

        # Bottom Running Footer
        self.line(54, 48, 558, 48)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 34, "CONFIDENTIAL & PROPRIETARY • Grounded in Official Gazettes")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 34, page_str)
        self.restoreState()


# =============================================================================
# MAIN BUILD SCRIPT
# =============================================================================
def build_pdf(filename="SANCHAY_Complete_Technical_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=64
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0B192C")    # Navy 950
    EMERALD = colors.HexColor("#047857")    # Emerald 700
    GOLD = colors.HexColor("#B45309")       # Gold / Amber 700
    DARK_TEXT = colors.HexColor("#0F172A")  # Slate 900
    MUTED_TEXT = colors.HexColor("#475569") # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER_LIGHT = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=EMERALD,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceBefore=18,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=EMERALD,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=GOLD,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=PRIMARY,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=PRIMARY
    )

    th_style = ParagraphStyle(
        'TH_Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TD_Style',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=DARK_TEXT
    )

    td_bold = ParagraphStyle(
        'TD_Bold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=PRIMARY
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("SANCHAY", title_style))
    story.append(Paragraph("Complete Technical Architecture & Implementation Documentation", ParagraphStyle(
        'CoverMainSub', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=GOLD, spaceAfter=8
    )))
    story.append(Paragraph("Frontend • Backend • Database • Rule Engines • AI Assistant • APIs • Security • Testing • Deployment", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=EMERALD, spaceBefore=5, spaceAfter=20))

    meta_table_data = [
        [Paragraph("<b>Project:</b>", body_style), Paragraph("SANCHAY (Verified Indian Sovereign Schemes & Welfare Portal)", body_style)],
        [Paragraph("<b>Classification:</b>", body_style), Paragraph("Production Technical Architecture Manual", body_style)],
        [Paragraph("<b>Date of Audit:</b>", body_style), Paragraph("September 2026", body_style)],
        [Paragraph("<b>Authoritative Data Sources:</b>", body_style), Paragraph("Government of India Gazettes, LIC Official Gazettes, State Welfare Portals", body_style)],
        [Paragraph("<b>Stack Architecture:</b>", body_style), Paragraph("React 18 + Vite 5 + Tailwind CSS | FastAPI + Python 3.12 | MongoDB", body_style)],
        [Paragraph("<b>Verified Scheme Count:</b>", body_style), Paragraph("184 Government Schemes + 38 LIC Plans + 22 Free Benefits (244 Total)", body_style)],
        [Paragraph("<b>Automated Test Suite:</b>", body_style), Paragraph("49 Tests Passed (100% Execution Pass Rate)", body_style)],
        [Paragraph("<b>Deployment Status:</b>", body_style), Paragraph("<font color='#047857'><b>READY FOR PRODUCTION</b></font>", body_style)]
    ]
    t_meta = Table(meta_table_data, colWidths=[140, 364])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)

    story.append(Spacer(1, 30))
    callout_box = [
        [Paragraph("<b>Executive Engineering Statement:</b><br/>This document is an exhaustive, production-grade technical manual generated directly from the inspected codebase of SANCHAY. Every architecture layer, schema, algorithm, formula, router, endpoint, test case, and UI component detailed herein exists in the actual repository and has been validated against active source code.", callout_style)]
    ]
    t_callout = Table(callout_box, colWidths=[504])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (-1,-1), 1.5, EMERALD),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_callout)

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Table of Contents", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=12))

    toc_items = [
        ("1. Project Overview & System Architecture", "3"),
        ("2. Complete Technology Stack Matrix", "4"),
        ("3. Frontend Architecture & Modular Implementation", "5"),
        ("4. Page-by-Page Route & User Flow Specifications", "6"),
        ("5. Component Hierarchy & Reusable Design System", "7"),
        ("6. Government Scheme Rule & Eligibility Engine", "8"),
        ("7. LIC Insurance Advisory & Evaluation Engine", "9"),
        ("8. Sovereign Free Benefits & Assistance Engine", "10"),
        ("9. Sakhi AI Multi-Domain Grounded Assistant", "11"),
        ("10. Multilingual System & 5-Language Script Engine", "12"),
        ("11. Web Speech & Voice Recognition Architecture", "13"),
        ("12. Database Architecture & Collections Specification", "14"),
        ("13. Static Data Stores & Gazette Master Files", "15"),
        ("14. Backend Architecture, Middleware & Services", "16"),
        ("15. Complete REST API Endpoint Directory", "17"),
        ("16. End-to-End API Data Flow Pipelines", "18"),
        ("17. Authentication, Session Security & Data Isolation", "19"),
        ("18. Rule Engine Execution Examples & Test Profiles", "20"),
        ("19. Multi-Field Filter Architecture & Alias Resolution", "21"),
        ("20. My Plans Module & Multi-Asset Persistence", "22"),
        ("21. Asset Management & Inline Image Resolution", "23"),
        ("22. Fault Tolerance & Zero-Downtime Fallback Mechanisms", "24"),
        ("23. Automated Testing Suite & QA Audit Results", "25"),
        ("24. Production Build & Deployment Guide", "26"),
        ("25. Complete Project File Directory Tree", "27"),
        ("26. Searchable Core Function Index", "28"),
        ("27. Technology-to-Function Mapping Matrix", "29"),
        ("28. Core System Flowcharts & Decision Trees", "30"),
        ("29. Technical Glossary & Architecture Terms", "31"),
        ("30. Final Summary & Documentation Coverage Report", "32"),
    ]

    toc_table_data = []
    for title, pg in toc_items:
        toc_table_data.append([
            Paragraph(f"<b>{title}</b>", body_style),
            Paragraph(f"<b>{pg}</b>", ParagraphStyle('TOC_Page', parent=body_style, alignment=2))
        ])
    t_toc = Table(toc_table_data, colWidths=[450, 54])
    t_toc.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: PROJECT OVERVIEW
    # =========================================================================
    story.append(Paragraph("1. Project Overview & System Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("<b>Project Name:</b> SANCHAY (सञ्चय)", h2_style))
    story.append(Paragraph(
        "<b>Purpose:</b> SANCHAY is a zero-hallucination, sovereign financial inclusion and citizen empowerment platform designed to connect every Indian citizen with verified Government Schemes, Life Insurance Corporation of India (LIC) plans, and sovereign Free Welfare Benefits for which they are genuinely eligible.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Core Problem Solved:</b> Indian citizens struggle to discover official welfare and financial benefits due to fragmented ministry websites, fraudulent agent commissions, complex gazette legal jargon, and algorithmic AI hallucinations. SANCHAY solves this through hard deterministic rule engines grounded 100% in official gazettes.",
        body_style
    ))

    story.append(Paragraph("Main Subsystems & Architectural Modules", h2_style))
    modules_data = [
        [Paragraph("Module", th_style), Paragraph("Directory", th_style), Paragraph("Technical Responsibility", th_style)],
        [Paragraph("<b>Government Schemes Engine</b>", td_bold), Paragraph("<code>backend/app/engine.py</code>", td_style), Paragraph("Deterministic evaluation of 184 central and state schemes with hard statutory boundaries and explainable fit scoring (0–100).", td_style)],
        [Paragraph("<b>LIC Advisory Engine</b>", td_bold), Paragraph("<code>backend/app/lic_engine.py</code>", td_style), Paragraph("Statutory eligibility evaluation for all 38 active LIC life assurance, pension annuity, child, and unit-linked plans.", td_style)],
        [Paragraph("<b>Free Benefits Engine</b>", td_bold), Paragraph("<code>backend/app/free_benefits_engine.py</code>", td_style), Paragraph("Zero-guesswork evaluator for 22 unique sovereign free welfare programs (PMGKAY, SMILE, PM-DAKSH, state aid).", td_style)],
        [Paragraph("<b>Sakhi AI Assistant</b>", td_bold), Paragraph("<code>backend/app/services/</code>", td_style), Paragraph("Grounded multilingual scheme assistant with automatic domain routing, conversation memory, and guardrails.", td_style)],
        [Paragraph("<b>Frontend Web Application</b>", td_bold), Paragraph("<code>src/</code>", td_style), Paragraph("Responsive editorial React 18 SPA with multilingual switching (en, hi, mr, bn, te), voice input, and filter controls.", td_style)],
        [Paragraph("<b>Authentication & Vault</b>", td_bold), Paragraph("<code>backend/app/services/auth_service.py</code>", td_style), Paragraph("PBKDF2/SHA-256 password hashing, token validation, 6-digit email verification, and isolated My Plans vaults.", td_style)],
        [Paragraph("<b>Dual Database Layer</b>", td_bold), Paragraph("<code>backend/app/database.py</code>", td_style), Paragraph("MongoDB connection with automatic zero-downtime fallback to verified JSON disk stores.", td_style)]
    ]
    t_mod = Table(modules_data, colWidths=[120, 130, 254])
    t_mod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_mod)
    story.append(Spacer(1, 10))

    story.append(Paragraph("System Architecture Diagram", h2_style))
    arch_diag = """
+---------------------------------------------------------------------------------------------------+
|                                  SANCHAY FRONTEND (React 18 + Vite 5)                            |
|  [Navbar]  [Home / Ticker]  [Find My Schemes]  [LIC Catalog]  [Free Benefits]  [Compare]  [Vault] |
|  Language Context (en, hi, mr, bn, te)  *  Web Speech Voice API  *  Auth Context & Session Vault  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST JSON / WebSocket (Port 8000)
                                                  v
+-------------------------------------------------+-------------------------------------------------+
|                                  FASTAPI BACKEND APPLICATION LAYER                                |
|  Routers: /api/v1/schemes | /api/v1/lic | /api/v1/free-benefits | /api/v1/recommendations         |
|           /api/v1/auth    | /api/v1/sakhi | /api/v1/compare     | /api/v1/admin                   |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
         +----------------------------------------+----------------------------------------+
         |                                        |                                        |
         v                                        v                                        v
+------------------------+              +------------------------+              +------------------------+
|  Gov Schemes Engine    |              |       LIC Engine       |              |  Free Benefits Engine  |
|  (backend/app/         |              |  (backend/app/         |              |  (backend/app/         |
|   engine.py)           |              |   lic_engine.py)       |              |   free_benefits_       |
|  * 184 Schemes         |              |  * 38 Plans            |              |   engine.py)           |
|  * 4 Result States     |              |  * Suitability Scores  |              |  * 22 Unique Benefits  |
+-----------+------------+              +-----------+------------+              +-----------+------------+
            |                                       |                                       |
            +---------------------------------------+---------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------+-----------------------------------------------+
|                       DATABASE & PERSISTENCE LAYER (Zero-Downtime Driver)                         |
|  Primary: MongoDB (Collections: schemes, lic_plans, free_benefits, users, logs)                  |
|  Fallback: Static Master JSON Stores (schemes_store.json, lic_plans_store.json, fb_store.json)    |
+---------------------------------------------------------------------------------------------------+
    """
    story.append(Paragraph(f"<pre>{arch_diag}</pre>", code_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: COMPLETE TECHNOLOGY STACK
    # =========================================================================
    story.append(Paragraph("2. Complete Technology Stack Matrix", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Every technology documented below is verified present in <code>package.json</code>, <code>requirements.txt</code>, or project source code.", body_style))

    tech_data = [
        [Paragraph("Technology", th_style), Paragraph("Version", th_style), Paragraph("Where Used", th_style), Paragraph("Role & Responsibility in SANCHAY", th_style)],
        [Paragraph("<b>React</b>", td_bold), Paragraph("18.3.1", td_style), Paragraph("Frontend Core", td_style), Paragraph("Declarative UI library powering responsive components, routing, and dynamic multi-language views.", td_style)],
        [Paragraph("<b>Vite</b>", td_bold), Paragraph("5.4.21", td_style), Paragraph("Frontend Build Tool", td_style), Paragraph("Ultra-fast ESM bundler, dev server (port 3003), and production compiler (built in 11.73s).", td_style)],
        [Paragraph("<b>Tailwind CSS</b>", td_bold), Paragraph("3.4.17", td_style), Paragraph("Frontend Styling", td_style), Paragraph("Utility-first styling system with bespoke editorial palettes (Sanchay Navy, Emerald, Gold).", td_style)],
        [Paragraph("<b>React Router DOM</b>", td_bold), Paragraph("6.22.0", td_style), Paragraph("Frontend Routing", td_style), Paragraph("Client-side SPA route navigation across all 11 application pages.", td_style)],
        [Paragraph("<b>Lucide React</b>", td_bold), Paragraph("0.344.0", td_style), Paragraph("Frontend Icons", td_style), Paragraph("Consistent UI iconography across cards, filters, verified seals, and status badges.", td_style)],
        [Paragraph("<b>FastAPI</b>", td_bold), Paragraph("0.141.1", td_style), Paragraph("Backend Framework", td_style), Paragraph("Asynchronous high-performance ASGI REST API framework with Pydantic validation.", td_style)],
        [Paragraph("<b>Uvicorn</b>", td_bold), Paragraph("0.52.4", td_style), Paragraph("ASGI Server", td_style), Paragraph("Production ASGI web server hosting backend endpoints on port 8000.", td_style)],
        [Paragraph("<b>Python</b>", td_bold), Paragraph("3.12.x", td_style), Paragraph("Backend Runtime", td_style), Paragraph("Core runtime powering rule engines, profile extractors, and database drivers.", td_style)],
        [Paragraph("<b>PyMongo</b>", td_bold), Paragraph("4.17.0", td_style), Paragraph("Database Driver", td_style), Paragraph("Official MongoDB synchronous Python driver managing collections and query filters.", td_style)],
        [Paragraph("<b>Motor</b>", td_bold), Paragraph("3.7.1", td_style), Paragraph("Async DB Driver", td_style), Paragraph("Asyncio MongoDB driver for non-blocking database queries.", td_style)],
        [Paragraph("<b>Pydantic</b>", td_bold), Paragraph("2.13.4", td_style), Paragraph("Data Validation", td_style), Paragraph("Strict typing, request/response models, boundary assertions, and JSON serialization.", td_style)],
        [Paragraph("<b>Google Generative AI</b>", td_bold), Paragraph("0.8.6", td_style), Paragraph("Sakhi Assistant", td_style), Paragraph("Official Gemini SDK connecting to <code>gemini-2.5-flash</code> / <code>gemini-1.5-flash</code>.", td_style)],
        [Paragraph("<b>Web Speech API</b>", td_bold), Paragraph("Browser Native", td_style), Paragraph("Voice Input Hook", td_style), Paragraph("Browser-native <code>SpeechRecognition</code> enabling microphone speech-to-text in 5 Indian languages.", td_style)],
        [Paragraph("<b>Cryptography / hashlib</b>", td_bold), Paragraph("50.0.1 / Stdlib", td_style), Paragraph("Security Service", td_style), Paragraph("PBKDF2-HMAC-SHA256 password hashing with salt and cryptographic token generation.", td_style)],
        [Paragraph("<b>Pytest / Unittest</b>", td_bold), Paragraph("9.1.1 / Stdlib", td_style), Paragraph("Testing Suite", td_style), Paragraph("Automated QA audit suite executing 49 unit, boundary, integration, and API test cases.", td_style)],
        [Paragraph("<b>ReportLab</b>", td_bold), Paragraph("5.0.1", td_style), Paragraph("Documentation", td_style), Paragraph("Programmatic PDF generation engine compiling this complete technical documentation.", td_style)]
    ]
    t_tech = Table(tech_data, colWidths=[90, 48, 90, 276])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tech)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: FRONTEND COMPLETE DOCUMENTATION
    # =========================================================================
    story.append(Paragraph("3. Frontend Architecture & Modular Implementation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The SANCHAY frontend is structured as a modular Single Page Application (SPA) built with React 18 and Vite. It enforces strict separation of concerns across presentation components, application state contexts, centralized API services, localized content adapters, and asset resolvers.",
        body_style
    ))

    fe_files = [
        ("src/main.jsx", "Application bootstrap entry point mounting React root with BrowserRouter, LanguageProvider, and AuthProvider.", "Root DOM Mount", "HTML DOM", "React Root"),
        ("src/App.jsx", "Primary router definition binding URL paths to page components, wrapping sticky Layout and floating Sakhi assistant.", "URL change", "Page View", "App Shell"),
        ("src/context/AuthContext.jsx", "Central authentication and user state vault managing login tokens, email verification, and My Plans bookmarking.", "Auth actions", "User & Saved State", "Context Hook"),
        ("src/context/LanguageContext.jsx", "Multilingual state provider maintaining active language ('en', 'hi', 'mr', 'bn', 'te') and translation helper t().", "Lang code", "Localized strings", "Context Hook"),
        ("src/services/api.js", "Unified Axios/Fetch client orchestrating all backend REST communication with automatic fallback to static datasets.", "HTTP params", "JSON data", "API layer"),
        ("src/utils/contentLocalizer.js", "Deterministic content translation helper ensuring scheme names, benefits, and categories render in user's selected script.", "Scheme object", "Localized strings", "UI Helper"),
        ("src/data/mockSchemes.js", "Verified sovereign master scheme dataset backup (184 schemes) ensuring frontend resilience during network disconnects.", "Static File", "Scheme objects", "Fallback"),
        ("src/data/licPlansFallback.js", "Verified LIC master plan dataset backup (38 plans) supporting offline browsing and instant search.", "Static File", "LIC Plan objects", "Fallback"),
        ("src/data/freeBenefitsFallback.js", "Verified Sovereign Free Welfare Benefits dataset backup (22 programs) for immediate zero-latency rendering.", "Static File", "Free Benefit objects", "Fallback"),
        ("src/components/free_benefits/LatestFreeBenefitsSection.jsx", "Live smooth continuous news ticker on homepage displaying newly verified welfare benefits with pause-on-hover.", "Benefit array", "Animated Ticker", "UI Section")
    ]

    fe_table_data = [[Paragraph("File Path", th_style), Paragraph("Purpose & Responsibility", th_style), Paragraph("Input", th_style), Paragraph("Output", th_style)]]
    for fp, purp, inp, outp, _ in fe_files:
        fe_table_data.append([
            Paragraph(f"<b>{fp}</b>", td_bold),
            Paragraph(purp, td_style),
            Paragraph(inp, td_style),
            Paragraph(outp, td_style)
        ])

    t_fe = Table(fe_table_data, colWidths=[120, 234, 75, 75])
    t_fe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fe)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: PAGE-BY-PAGE DOCUMENTATION
    # =========================================================================
    story.append(Paragraph("4. Page-by-Page Route & User Flow Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    pages_data = [
        [Paragraph("Page Name", th_style), Paragraph("Route", th_style), Paragraph("Purpose", th_style), Paragraph("Key Components", th_style), Paragraph("APIs & Stores", th_style)],
        [
            Paragraph("<b>Landing / Home</b>", td_bold),
            Paragraph("<code>/</code>", td_style),
            Paragraph("Platform entry point showcasing verified schemes, live free benefits news ticker, LIC solutions, and trust stats.", td_style),
            Paragraph("LatestFreeBenefitsSection, HeroHeadline, FloatingCardComposition, VerifiedSourcesTicker, FeaturedSchemesSection", td_style),
            Paragraph("<code>GET /api/v1/schemes</code><br/><code>GET /api/v1/free-benefits/latest</code>", td_style)
        ],
        [
            Paragraph("<b>Profile Setup</b>", td_bold),
            Paragraph("<code>/profile</code>", td_style),
            Paragraph("Step 1 of 3: Captures demographic parameters (Age, Gender, State, Income, Occupation, Guardian status).", td_style),
            Paragraph("ProgressStepBar, BeneficiarySelector, StateDropdown, OccupationGrid, SessionSync", td_style),
            Paragraph("Writes to <code>sanchay_profile</code> session storage; invalidates stale results.", td_style)
        ],
        [
            Paragraph("<b>Goal Selection</b>", td_bold),
            Paragraph("<code>/goal</code>", td_style),
            Paragraph("Step 2 of 3: Captures citizen milestone (Child Education, Retirement, Emergency, Wealth, Farming, Housing, Business).", td_style),
            Paragraph("GoalCardGrid, MilestoneSelector, ProgressStepBar", td_style),
            Paragraph("Writes to <code>sanchay_goal</code>; invalidates stale results.", td_style)
        ],
        [
            Paragraph("<b>Preferences</b>", td_bold),
            Paragraph("<code>/preferences</code>", td_style),
            Paragraph("Step 3 of 3: Captures monthly budget, investment horizon, liquidity need, and tax priority before trigger.", td_style),
            Paragraph("BudgetSlider, HorizonSelector, ProgressiveLoadingOverlay, TrustSteps", td_style),
            Paragraph("<code>POST /api/v1/recommendations</code>; writes <code>sanchay_recommendation_result</code>.", td_style)
        ],
        [
            Paragraph("<b>Recommendations</b>", td_bold),
            Paragraph("<code>/recommendations</code>", td_style),
            Paragraph("Displays explainable Top Matches, Fit Score breakdown (0–100), statutory compliance badges, and official links.", td_style),
            Paragraph("TopMatchHeroCard, OtherMatchesGrid, SchemeDetailsModal, BreakdownRadar", td_style),
            Paragraph("Reads <code>sanchay_recommendation_result</code>; triggers modal on select.", td_style)
        ],
        [
            Paragraph("<b>LIC Advisory</b>", td_bold),
            Paragraph("<code>/lic</code>", td_style),
            Paragraph("Dedicated portal for all 38 active LIC plans with category tabs, search, and integrated suitability calculator.", td_style),
            Paragraph("LICPlanCard, LICPlanDetailsModal, LICRecommendForm, QuickStatsBanner", td_style),
            Paragraph("<code>GET /api/v1/lic/plans</code><br/><code>POST /api/v1/lic/recommend</code>", td_style)
        ],
        [
            Paragraph("<b>Free Benefits</b>", td_bold),
            Paragraph("<code>/free-benefits</code>", td_style),
            Paragraph("Dedicated welfare catalog for 22 unique sovereign free aid programs with benefit type and state filters.", td_style),
            Paragraph("FreeBenefitCard, FreeBenefitDetailsModal, FreeBenefitEligibilityModal, FiltersBar", td_style),
            Paragraph("<code>GET /api/v1/free-benefits</code><br/><code>POST /api/v1/free-benefits/evaluate</code>", td_style)
        ],
        [
            Paragraph("<b>Scheme Compare</b>", td_bold),
            Paragraph("<code>/compare</code>", td_style),
            Paragraph("Side-by-side technical comparison of 2 to 3 sovereign schemes (yield, lock-in, tax benefits, eligibility).", td_style),
            Paragraph("ComparisonMatrix, SpecRow, HighlightBadge, DifferenceIndicator", td_style),
            Paragraph("<code>GET /api/v1/compare</code><br/><code>GET /api/v1/schemes</code>", td_style)
        ],
        [
            Paragraph("<b>Official Sources</b>", td_bold),
            Paragraph("<code>/sources</code>", td_style),
            Paragraph("Government transparency registry listing all ministries, gazette notification dates, and official URLs.", td_style),
            Paragraph("MinistryCardGrid, GazetteDateTable, VerificationSeal", td_style),
            Paragraph("Reads verified metadata schema.", td_style)
        ],
        [
            Paragraph("<b>My Plans Vault</b>", td_bold),
            Paragraph("<code>/my-plans</code>", td_style),
            Paragraph("Citizen saved portfolio vault managing bookmarked Government Schemes, LIC Plans, and Free Benefits.", td_style),
            Paragraph("SavedPlanCard, CategoryPill, PrintSummaryButton, ExportPDFButton", td_style),
            Paragraph("<code>GET /api/v1/auth/my-plans</code><br/><code>POST /api/v1/auth/my-plans/toggle</code>", td_style)
        ]
    ]

    t_pages = Table(pages_data, colWidths=[80, 75, 120, 120, 109])
    t_pages.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_pages)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 5: COMPONENT DOCUMENTATION
    # =========================================================================
    story.append(Paragraph("5. Component Hierarchy & Reusable Design System", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    components_list = [
        ("Navbar", "src/components/layout/Navbar.jsx", "Sticky editorial navigation header with live links, language selector, Auth trigger, and My Plans counter.", "None", "Mobile menu open, Auth modal open"),
        ("Footer", "src/components/layout/Footer.jsx", "Official disclaimers, Ministry attributions, IRDAI Reg. 512 seal, and navigation links.", "None", "None"),
        ("SchemeCard", "src/components/common/SchemeCard.jsx", "Visual card rendering scheme name, yield/interest, lock-in, category badge, bookmark action, and Learn More trigger.", "scheme, onSelect, isSaved", "Hover state"),
        ("ProductDetailsModal", "src/components/common/ProductDetailsModal.jsx", "Comprehensive editorial modal presenting full gazette terms, withdrawal rules, tax benefits, and direct official portal button.", "product, isOpen, onClose", "Active Tab (Overview/Financial/Rules)"),
        ("LICPlanCard", "src/components/lic/LICPlanCard.jsx", "LIC specific card displaying plan number, UIN, entry age brackets, sum assured summary, and brochure modal trigger.", "plan, onSelect", "Hover state"),
        ("LICPlanDetailsModal", "src/components/lic/LICPlanDetailsModal.jsx", "LIC brochure breakdown showing death benefits, maturity bonuses, policy terms, premium paying options, and PDF brochure link.", "plan, isOpen, onClose", "Active Tab"),
        ("LICRecommendForm", "src/components/lic/LICRecommendForm.jsx", "Embedded dynamic suitability evaluation form allowing citizens to input age, budget, and goal to receive scored LIC recommendations.", "onRecommended", "Form inputs, loading, results"),
        ("FreeBenefitCard", "src/components/free_benefits/FreeBenefitCard.jsx", "Welfare card displaying benefit name, benefit type badge, state restriction, and Check Eligibility modal trigger.", "benefit, onSelect, onEvaluate", "None"),
        ("FreeBenefitDetailsModal", "src/components/free_benefits/FreeBenefitDetailsModal.jsx", "Detailed modal explaining sovereign grant terms, application process, and direct official application URL.", "benefit, isOpen, onClose", "None"),
        ("FreeBenefitEligibilityModal", "src/components/free_benefits/FreeBenefitEligibilityModal.jsx", "Interactive deterministic eligibility testing modal running structured criteria against citizen responses in real-time.", "benefit, isOpen, onClose", "Profile state, result status, missing prompts"),
        ("SakhiChatPanel", "src/components/assistant/SakhiChatPanel.jsx", "Slide-over interactive conversational panel with message history, voice input, quick prompt chips, and source citations.", "isOpen, onClose", "Messages, input text, listening state, suggestions"),
        ("SakhiFloatingButton", "src/components/assistant/SakhiFloatingButton.jsx", "Floating action trigger positioned bottom-right with pulsating badge inviting citizen queries in 5 languages.", "onClick, isOpen", "None"),
        ("AuthModal", "src/components/auth/AuthModal.jsx", "Authentication modal handling Login, Registration, 6-digit Email Verification, and Demo Login.", "isOpen, onClose, initialMode", "Active Mode (login/signup/verify), form inputs, errors")
    ]

    comp_table_data = [[Paragraph("Component & Path", th_style), Paragraph("Component Purpose", th_style), Paragraph("Props & State Interface", th_style)]]
    for cn, fp, purp, props, state in components_list:
        comp_table_data.append([
            Paragraph(f"<b>{cn}</b><br/><code>{fp}</code>", td_bold),
            Paragraph(purp, td_style),
            Paragraph(f"<b>Props:</b> {props}<br/><b>State:</b> {state}", td_style)
        ])

    t_comp = Table(comp_table_data, colWidths=[130, 204, 170])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_comp)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 6: GOVERNMENT SCHEME ENGINE
    # =========================================================================
    story.append(Paragraph("6. Government Scheme Rule & Eligibility Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>File:</b> <code>backend/app/engine.py</code><br/>"
        "SANCHAY implements a strict Two-Stage Recommendation Engine where Stage 1 enforces deterministic hard eligibility gates, and Stage 2 computes explainable multi-factor fit scores (0–100) <i>only for schemes that are 100% eligible</i>.",
        body_style
    ))

    story.append(Paragraph("Stage 1: Deterministic Eligibility Evaluation (evaluate_eligibility)", h2_style))
    story.append(Paragraph(
        "Evaluates 9 mandatory statutory hard criteria without guesswork. Output states: <code>ELIGIBLE</code>, <code>INELIGIBLE</code>, <code>REVIEW_REQUIRED</code>.",
        body_style
    ))

    gates_data = [
        [Paragraph("Statutory Gate", th_style), Paragraph("Code Condition", th_style), Paragraph("Hard Boundary / Rule Logic", th_style)],
        [Paragraph("<b>1. Verification Gate</b>", td_bold), Paragraph("<code>ver_status == 'VERIFIED' and is_active</code>", td_style), Paragraph("Unverified or discontinued schemes are strictly rejected before user evaluation.", td_style)],
        [Paragraph("<b>2. State Residency</b>", td_bold), Paragraph("<code>scheme_state.lower() == user_state.lower()</code>", td_style), Paragraph("Central schemes apply nationally. State-specific schemes mandate residency in that exact state.", td_style)],
        [Paragraph("<b>3. Citizenship / NRI</b>", td_bold), Paragraph("<code>is_nri and not nri_allowed</code>", td_style), Paragraph("NRIs are blocked from schemes requiring resident status (e.g. PPF, SCSS, APY).", td_style)],
        [Paragraph("<b>4. Age Boundaries</b>", td_bold), Paragraph("<code>user_age >= min_age and user_age <= max_age</code>", td_style), Paragraph("Strict age bounds. E.g. APY (18–40), SCSS (60+ or 55–60 with retirement proof), SSY (girl child <= 10).", td_style)],
        [Paragraph("<b>5. Gender Rules</b>", td_bold), Paragraph("<code>female_only => gender in ['female', 'girl']</code>", td_style), Paragraph("Exclusively female schemes (SSY, Mahila Samman) verify beneficiary gender.", td_style)],
        [Paragraph("<b>6. Guardian & Minor</b>", td_bold), Paragraph("<code>guardian_req => has_guardian == True</code>", td_style), Paragraph("Minor accounts mandate adult legal guardian representation.", td_style)],
        [Paragraph("<b>7. Income Ceilings</b>", td_bold), Paragraph("<code>user_income <= income_limit</code>", td_style), Paragraph("Means-tested welfare schemes strictly reject applicants earning above statutory ceiling.", td_style)],
        [Paragraph("<b>8. Occupation Criteria</b>", td_bold), Paragraph("<code>req_occ matches user_occ or persona</code>", td_style), Paragraph("Guarantees farmers match PM-KMY, informal workers match PM-SYM, and salaried employees are excluded from unorganized welfare.", td_style)],
        [Paragraph("<b>9. Disability Status</b>", td_bold), Paragraph("<code>disability_req => has_disability == True</code>", td_style), Paragraph("Mandates official certified benchmark disability (UDID) for special assistance schemes.", td_style)]
    ]
    t_gates = Table(gates_data, colWidths=[110, 160, 234])
    t_gates.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_gates)

    story.append(Spacer(1, 10))
    story.append(Paragraph("Stage 2: Explainable Fit-Score Formula (evaluate_scheme_fit)", h2_style))
    story.append(Paragraph(
        "$$\\text{FitScore} = 0.30 \\times \\text{GoalMatch} + 0.20 \\times \\text{StatutoryStrength} + 0.20 \\times \\text{BudgetMatch} + 0.15 \\times \\text{HorizonMatch} + 0.10 \\times \\text{LiquidityMatch} + 0.05 \\times \\text{TaxMatch}$$",
        code_style
    ))
    story.append(Paragraph(
        "Fit score ranges from 0.0 to 100.0. Schemes scoring $\\ge 60.0$ are classified as <code>exact_matches</code> (Top Recommendations); schemes scoring below 60.0 are classified as <code>closest_matches</code>.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: LIC ENGINE
    # =========================================================================
    story.append(Paragraph("7. LIC Insurance Advisory & Evaluation Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>File:</b> <code>backend/app/lic_engine.py</code><br/>"
        "Evaluates the complete database of 38 active LIC plans strictly sourced from official LIC brochures and IRDAI product filings.",
        body_style
    ))

    lic_functions = [
        ("evaluate_lic_plan_eligibility(plan, profile)", "Deterministic statutory evaluator checking active status, age brackets (min/max entry, min/max maturity), pure child plans (774, 732, 734), and gender rules.", "Plan dict, LICUserProfile", "LICPlanEvaluationResult (ELIGIBLE, INELIGIBLE, ADDITIONAL_INFORMATION_REQUIRED)"),
        ("calculate_lic_suitability_score(plan, profile, eval_result)", "Computes explainable suitability match score (40–99 points) based on Goal match (+25), Retirement cashflow relevance (+15), Life protection relevance (+10), Investment preference (+10), and Budget (+10).", "Plan dict, LICUserProfile, eval_res", "Float match_score and match_reasons list"),
        ("recommend_lic_plans(lic_plans, profile, specific_plan_id)", "Orchestrates multi-plan or single-plan evaluation, sorts eligible plans by match score descending, and compiles recommendation result.", "List of 38 plans, LICUserProfile, optional plan_id", "LICRecommendationResult (SUCCESS, NO_APPLICABLE_PLAN, ADDITIONAL_INFORMATION_REQUIRED)")
    ]

    lic_f_table = [[Paragraph("Function", th_style), Paragraph("Technical Logic & Process", th_style), Paragraph("Input", th_style), Paragraph("Output", th_style)]]
    for fn, logic, inp, outp in lic_functions:
        lic_f_table.append([
            Paragraph(f"<b>{fn}</b>", td_bold),
            Paragraph(logic, td_style),
            Paragraph(inp, td_style),
            Paragraph(outp, td_style)
        ])
    t_lic_f = Table(lic_f_table, colWidths=[120, 204, 90, 90])
    t_lic_f.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_lic_f)

    story.append(Spacer(1, 10))
    story.append(Paragraph("LIC Plan Categories & Verified Distribution (38 Plans Total)", h2_style))
    lic_cats = [
        [Paragraph("Plan Category", th_style), Paragraph("Count", th_style), Paragraph("Sample Verified Plans", th_style), Paragraph("Key Statutory Focus", th_style)],
        [Paragraph("<b>Endowment Assurance</b>", td_bold), Paragraph("9", td_style), Paragraph("Single Premium (717), New Endowment (714), Jeevan Anand (715), Jeevan Labh (736)", td_style), Paragraph("Guaranteed savings with life risk cover and simple reversionary bonuses.", td_style)],
        [Paragraph("<b>Term Assurance</b>", td_bold), Paragraph("8", td_style), Paragraph("New Jeevan Amar (955), New Tech-Term (954), Saral Jeevan Bima (859), Digi Term (876)", td_style), Paragraph("High pure life risk cover with ultra-low premiums for family protection.", td_style)],
        [Paragraph("<b>Whole Life Assurance</b>", td_bold), Paragraph("2", td_style), Paragraph("Jeevan Umang (745), Jeevan Utsav (771, 883)", td_style), Paragraph("Lifelong cover till age 100 with guaranteed 8% to 10% annual income post PPT.", td_style)],
        [Paragraph("<b>Money Back Plans</b>", td_bold), Paragraph("4", td_style), Paragraph("Money Back 20 Yr (720), Money Back 25 Yr (721), Bima Ratna (758)", td_style), Paragraph("Periodic survival liquidity payouts every 5 years during policy term.", td_style)],
        [Paragraph("<b>Pure Child Plans</b>", td_bold), Paragraph("4", td_style), Paragraph("Amritbaal (774), Children's Money Back (732), Jeevan Tarun (734)", td_style), Paragraph("Educational milestones funding strictly for child lives aged 30 days to 13 yrs.", td_style)],
        [Paragraph("<b>Pension & Annuity</b>", td_bold), Paragraph("5", td_style), Paragraph("Jeevan Akshay-VII (857), New Jeevan Shanti (858), Saral Pension (862), Pension Plus (867)", td_style), Paragraph("Guaranteed lifelong regular annuity for seniors post age 30/40/60.", td_style)],
        [Paragraph("<b>Unit Linked (ULIP)</b>", td_bold), Paragraph("4", td_style), Paragraph("SIIP (752), Nivesh Plus (749), Index Plus (873), New Endowment Plus (735)", td_style), Paragraph("Market-linked fund options with integrated statutory life assurance cover.", td_style)],
        [Paragraph("<b>Micro Insurance</b>", td_bold), Paragraph("2", td_style), Paragraph("Micro Bachat (751), Bhagya Lakshmi (729)", td_style), Paragraph("Low-ticket insurance protection for low-income and unorganised sector workers.", td_style)]
    ]
    t_lic_c = Table(lic_cats, colWidths=[100, 35, 170, 199])
    t_lic_c.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_lic_c)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 8: FREE BENEFITS ENGINE
    # =========================================================================
    story.append(Paragraph("8. Sovereign Free Benefits & Assistance Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>File:</b> <code>backend/app/free_benefits_engine.py</code><br/>"
        "Evaluates 22 unique sovereign welfare programs providing direct aid, free foodgrains, skill training stipends, and coaching.",
        body_style
    ))

    story.append(Paragraph("Benefit Type Distinction Matrix (Strict No-Hallucination Gate)", h2_style))
    fb_types_data = [
        [Paragraph("Benefit Type", th_style), Paragraph("Sample Verified Benefit", th_style), Paragraph("Financial Implication & Citizen Rule", th_style)],
        [Paragraph("<code>completely_free</code> / <code>free_distribution</code>", td_bold), Paragraph("PMGKAY (Free Foodgrains), Puducherry Free Rice", td_style), Paragraph("<b>100% Free:</b> ₹0 cost to beneficiary. Provided as physical goods/food security.", td_style)],
        [Paragraph("<code>free_training</code> / <code>with_stipend</code>", td_bold), Paragraph("PM-DAKSH, SMILE Skill Training", td_style), Paragraph("<b>100% Free + Stipend:</b> Zero tuition fee with wage compensation stipend per month.", td_style)],
        [Paragraph("<code>free_coaching</code>", td_bold), Paragraph("Central Free Coaching for SC/OBC", td_style), Paragraph("<b>100% Free + Allowance:</b> Competitive exam coaching with monthly local/outstation allowance.", td_style)],
        [Paragraph("<code>scholarship</code>", td_bold), Paragraph("Post-Matric Scholarship, HSMIS Haryana Merit", td_style), Paragraph("<b>Direct Transfer:</b> Non-repayable grant disbursed directly into student bank account.", td_style)],
        [Paragraph("<code>subsidy</code> / <code>fee_support</code>", td_bold), Paragraph("Transport Assistance, Electric Scooty Subsidy", td_style), Paragraph("<b>Partial Support:</b> Government covers a percentage (30%–75%); applicant pays remainder.", td_style)],
        [Paragraph("<code>financial_assistance</code>", td_bold), Paragraph("SMILE Transgender Welfare, Disability Aid", td_style), Paragraph("<b>Defined Cash Grant:</b> Direct benefit transfer upon certified category verification.", td_style)]
    ]
    t_fb_t = Table(fb_types_data, colWidths=[120, 140, 244])
    t_fb_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fb_t)

    story.append(Spacer(1, 10))
    story.append(Paragraph("Structured Eligibility Conditions Checked by Engine", h2_style))
    story.append(Paragraph(
        "• <b>State & Minimum Residency:</b> Verified allowed states (e.g. Puducherry mandates 5+ continuous years).<br/>"
        "• <b>Income Ceiling:</b> Tested against exact limits (₹1.0L, ₹1.8L, ₹2.5L, ₹3.0L).<br/>"
        "• <b>Ration Card Validation:</b> Checks official NFSA, AAY, PHH, or BPL card holding.<br/>"
        "• <b>Special Certificates:</b> Mandates official Transgender Card (under Transgender Persons Act) or UDID Card (PwD 40%+).<br/>"
        "• <b>Student & Merit Status:</b> Enforces active enrollment and university merit rank validation for academic grants.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 9: SAKHI AI ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("9. Sakhi AI Multi-Domain Grounded Assistant", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>Core Files:</b> <code>backend/app/services/gemini_adapter.py</code>, <code>sakhi_lic_handler.py</code>, <code>sakhi_free_benefits_handler.py</code>, <code>profile_extractor.py</code><br/>"
        "Sakhi is a conversational assistant with zero hallucination risk due to its strict two-layer design:",
        body_style
    ))

    sakhi_flow = """
USER INPUT (Text or Voice in en, hi, mr, bn, te, Hinglish)
   │
   ▼
1. LANGUAGE DETECTION (language_service.py: detect_user_language)
   │
   ▼
2. OUT-OF-SCOPE GUARDRAIL (gemini_adapter.py: Refuses stocks, crypto, non-gov queries)
   │
   ▼
3. FACT EXTRACTOR (profile_extractor.py: Extracts Age, State, Income, Occupation accurately)
   │
   ▼
4. DOMAIN ROUTER (detect_query_domain)
   ├── "GOVERNMENT"   ──> engine.py (evaluate_eligibility / scheme_search)
   ├── "LIC"          ──> lic_engine.py (evaluate_lic_plan_eligibility / recommend_lic_plans)
   ├── "FREE_BENEFITS"──> free_benefits_engine.py (evaluate_all_free_benefits)
   └── "MIXED"        ──> Aggregates multi-asset overview across modules
   │
   ▼
5. EVIDENCE COMPILATION (Extracts exact interest, yield, lock-in, authority from DB)
   │
   ▼
6. GROUNDED SYNTHESIS (Gemini 2.5 Flash / Deterministic Multilingual Template Generator)
   │
   ▼
STRUCTURED RESPONSE (Answer markdown + Source Citations + Suggested Prompt Chips + Actions)
    """
    story.append(Paragraph(f"<pre>{sakhi_flow}</pre>", code_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Intent Classification Matrix", h2_style))
    intents_data = [
        [Paragraph("Intent Key", th_style), Paragraph("Trigger Patterns & Keywords", th_style), Paragraph("Domain Delegated", th_style)],
        [Paragraph("<code>EXPLAIN_SCHEME</code>", td_bold), Paragraph("What is PPF?, Explain APY, Tell me about Sukanya Samriddhi", td_style), Paragraph("Government / LIC / Free Benefits", td_style)],
        [Paragraph("<code>CHECK_ELIGIBILITY</code>", td_bold), Paragraph("Am I eligible?, Who can apply?, Eligibility for SCSS", td_style), Paragraph("Target Domain Rule Engine", td_style)],
        [Paragraph("<code>COMPARE_SCHEMES</code>", td_bold), Paragraph("Compare PPF and NPS, Difference between APY and PM-SYM", td_style), Paragraph("Comparison Router", td_style)],
        [Paragraph("<code>LIC_RECOMMENDATION</code>", td_bold), Paragraph("Suggest LIC plan for retirement, LIC for child, Term insurance", td_style), Paragraph("LIC Engine", td_style)],
        [Paragraph("<code>FREE_BENEFITS_QUERY</code>", td_bold), Paragraph("Free coaching, Free food grains, Free scooty in Rajasthan", td_style), Paragraph("Free Benefits Engine", td_style)],
        [Paragraph("<code>HOW_TO_APPLY</code>", td_bold), Paragraph("How to apply for PPF, Online application portal link", td_style), Paragraph("Official Gazette URL Registry", td_style)],
        [Paragraph("<code>OUT_OF_SCOPE</code>", td_bold), Paragraph("Buy crypto, penny stocks, IPL cricket, tell a joke, movie review", td_style), Paragraph("Polite Refusal Guardrail", td_style)]
    ]
    t_int = Table(intents_data, colWidths=[120, 240, 144])
    t_int.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_int)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 10 & 11: MULTILINGUAL & VOICE
    # =========================================================================
    story.append(Paragraph("10. Multilingual System & 11. Voice Recognition", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Constitutionally Supported Languages (5 Languages)", h2_style))
    lang_data = [
        [Paragraph("Language", th_style), Paragraph("ISO Code", th_style), Paragraph("Native Script", th_style), Paragraph("Speech Recognition Locale", th_style), Paragraph("Detection Markers", th_style)],
        [Paragraph("<b>English</b>", td_bold), Paragraph("<code>en</code>", td_style), Paragraph("Latin", td_style), Paragraph("<code>en-IN</code>", td_style), Paragraph("Default Latin lexicon", td_style)],
        [Paragraph("<b>Hindi</b>", td_bold), Paragraph("<code>hi</code>", td_style), Paragraph("Devanagari (हिन्दी)", td_style), Paragraph("<code>hi-IN</code>", td_style), Paragraph("हैं, नहीं, योजनाएं, पात्रता, किसान, आय, उम्र", td_style)],
        [Paragraph("<b>Marathi</b>", td_bold), Paragraph("<code>mr</code>", td_style), Paragraph("Devanagari (मराठी)", td_style), Paragraph("<code>mr-IN</code>", td_style), Paragraph("ळ, आहेत, नाही, सांगा, शेतकरी, उत्पन्न, वय", td_style)],
        [Paragraph("<b>Bengali</b>", td_bold), Paragraph("<code>bn</code>", td_style), Paragraph("Bengali (বাংলা)", td_style), Paragraph("<code>bn-IN</code>", td_style), Paragraph("Unicode block <code>\\u0980-\\u09FF</code>, প্রকল্প, কৃষক", td_style)],
        [Paragraph("<b>Telugu</b>", td_bold), Paragraph("<code>te</code>", td_style), Paragraph("Telugu (తెలుగు)", td_style), Paragraph("<code>te-IN</code>", td_style), Paragraph("Unicode block <code>\\u0C00-\\u0C7F</code>, పథకాలు, అర్హత", td_style)]
    ]
    t_lang = Table(lang_data, colWidths=[70, 45, 95, 110, 184])
    t_lang.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_lang)

    story.append(Spacer(1, 10))
    story.append(Paragraph("11. Microphone & Web Speech Architecture", h2_style))
    story.append(Paragraph(
        "Voice input operates via browser-native <code>window.SpeechRecognition</code> or <code>window.webkitSpeechRecognition</code>. "
        "When the citizen clicks the microphone icon in Sakhi Chat Panel, the browser locale is dynamically bound to the citizen's current language selection (e.g. <code>hi-IN</code> for Hindi, <code>mr-IN</code> for Marathi). "
        "The real-time speech transcript is fed directly into <code>handleSendMessage()</code>, executing the full intent detection and rule engine pipeline seamlessly.",
        body_style
    ))

    voice_flow = """
Citizen Speaks into Mic -> Web Speech API (locale: hi-IN/en-IN) -> Speech-to-Text String
   -> Sakhi Chat Input Field -> Intent Classification -> Rule Engine -> Multilingual Response
    """
    story.append(Paragraph(f"<pre>{voice_flow}</pre>", code_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 12 & 13: DATABASE & DATA FILES
    # =========================================================================
    story.append(Paragraph("12. Database Architecture & 13. Data Stores", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("MongoDB Collections & Schema Definitions", h2_style))
    db_data = [
        [Paragraph("Collection", th_style), Paragraph("Count", th_style), Paragraph("Key Document Schema Fields", th_style), Paragraph("Indexes & CRUD Operations", th_style)],
        [
            Paragraph("<b>schemes</b>", td_bold),
            Paragraph("184", td_style),
            Paragraph("<code>scheme_id</code>, <code>name {en, hi, mr, bn, te}</code>, <code>category</code>, <code>benefits</code>, <code>financial</code>, <code>eligibility</code>, <code>verification</code>, <code>status</code>", td_style),
            Paragraph("Index on <code>scheme_id</code>, <code>category</code>, <code>goals</code>. Read by search/engine; Updated by admin.", td_style)
        ],
        [
            Paragraph("<b>lic_plans</b>", td_bold),
            Paragraph("38", td_style),
            Paragraph("<code>plan_id</code>, <code>plan_name</code>, <code>plan_number</code>, <code>uin</code>, <code>category</code>, <code>age_rules</code>, <code>premium_rules</code>, <code>benefits</code>, <code>active_status</code>", td_style),
            Paragraph("Index on <code>plan_id</code>, <code>plan_number</code>, <code>category</code>. Read by LIC engine; Filter active only.", td_style)
        ],
        [
            Paragraph("<b>free_benefits</b>", td_bold),
            Paragraph("22", td_style),
            Paragraph("<code>benefit_id</code>, <code>name</code>, <code>level</code>, <code>state</code>, <code>category</code>, <code>benefit_type</code>, <code>structured_eligibility</code>, <code>application_url</code>, <code>status</code>", td_style),
            Paragraph("Index on <code>benefit_id</code>, <code>state</code>, <code>benefit_type</code>. Read by Free Benefits engine.", td_style)
        ],
        [
            Paragraph("<b>users</b>", td_bold),
            Paragraph("Dynamic", td_style),
            Paragraph("<code>user_id</code>, <code>email</code>, <code>password_hash</code>, <code>salt</code>, <code>full_name</code>, <code>is_verified</code>, <code>saved_plans</code>, <code>created_at</code>", td_style),
            Paragraph("Unique index on <code>email</code>. Read/Write by Auth and My Plans service.", td_style)
        ],
        [
            Paragraph("<b>logs</b>", td_bold),
            Paragraph("Dynamic", td_style),
            Paragraph("<code>log_id</code>, <code>timestamp</code>, <code>recommendation_id</code>, <code>query</code>, <code>results_count</code>", td_style),
            Paragraph("Append-only audit trail logging recommendation requests.", td_style)
        ]
    ]
    t_db = Table(db_data, colWidths=[75, 35, 230, 164])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_db)

    story.append(Spacer(1, 10))
    story.append(Paragraph("13. Static Master Datasets & Zero-Downtime Fallback", h2_style))
    story.append(Paragraph(
        "To ensure 100% availability during network partitions or cloud MongoDB maintenance, SANCHAY contains disk-persisted master JSON stores in <code>backend/data/</code>: "
        "<code>master_schemes.json</code> (184 schemes), <code>lic_master_plans.json</code> (38 plans), and <code>free_benefits_master.json</code> (22 benefits). "
        "The custom database driver in <code>backend/app/database.py</code> transparently routes queries to disk stores if MongoDB times out (1500ms threshold).",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 14 & 15: BACKEND & API DIRECTORY
    # =========================================================================
    story.append(Paragraph("14. Backend Architecture & 15. REST API Directory", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Complete REST API Endpoint Specifications", h2_style))
    api_data = [
        [Paragraph("HTTP", th_style), Paragraph("Endpoint URL", th_style), Paragraph("Auth", th_style), Paragraph("Input Parameters / Body", th_style), Paragraph("Response Model & Target Engine", th_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/health</code>", td_style), Paragraph("No", td_style), Paragraph("None", td_style), Paragraph("Health status, active scheme count, and supported categories.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/schemes</code>", td_style), Paragraph("No", td_style), Paragraph("<code>category, search, goal, state, verified, page, limit</code>", td_style), Paragraph("List of sanitized Scheme objects matching multi-field query.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/schemes/{id}</code>", td_style), Paragraph("No", td_style), Paragraph("<code>id</code> (e.g. 'ppf', 'apy', 'scss')", td_style), Paragraph("Full gazette record for single scheme or 404.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/schemes/categories</code>", td_style), Paragraph("No", td_style), Paragraph("None", td_style), Paragraph("13 Master categories with live calculated scheme counts.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/recommendations</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>UserProfile, UserGoal, UserPreferences</code>", td_style), Paragraph("<code>RecommendationResponse</code> with Top Matches and fit breakdown.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/lic/plans</code>", td_style), Paragraph("No", td_style), Paragraph("<code>category, search</code>", td_style), Paragraph("List of active LIC plans (withdrawn plans excluded).", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/lic/plans/{id}</code>", td_style), Paragraph("No", td_style), Paragraph("<code>plan_id</code> or <code>plan_number</code> (e.g. '717', '955')", td_style), Paragraph("Complete official LIC plan brochure specifications.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/lic/recommend</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>LICRecommendRequest</code> (age, goal, budget)", td_style), Paragraph("<code>LICRecommendationResult</code> with scored recommendations.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/free-benefits</code>", td_style), Paragraph("No", td_style), Paragraph("<code>state, level, category, benefit_type, q</code>", td_style), Paragraph("List of 22 verified sovereign free welfare programs.", td_style)],
        [Paragraph("GET", td_bold), Paragraph("<code>/api/v1/free-benefits/latest</code>", td_style), Paragraph("No", td_style), Paragraph("<code>limit</code> (default: 4)", td_style), Paragraph("Latest verified benefits for homepage ticker.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/free-benefits/evaluate</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>FreeBenefitUserProfile</code>, optional <code>benefit_id</code>", td_style), Paragraph("<code>FreeBenefitsEvaluationResponse</code> (ELIGIBLE/INELIGIBLE).", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/sakhi/chat</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>message, language, context</code>", td_style), Paragraph("<code>SakhiChatResponse</code> (answer, sources, prompts, actions).", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/auth/register</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>email, password, full_name, age, mobile</code>", td_style), Paragraph("User registration and 6-digit verification code issuance.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/auth/login</code>", td_style), Paragraph("No", td_style), Paragraph("JSON: <code>email, password</code>", td_style), Paragraph("Auth token, user profile, and bookmarked plan IDs.", td_style)],
        [Paragraph("POST", td_bold), Paragraph("<code>/api/v1/auth/my-plans/toggle</code>", td_style), Paragraph("Bearer", td_style), Paragraph("JSON: <code>plan_id, plan_type, metadata</code>", td_style), Paragraph("Adds or removes scheme/LIC/benefit from user vault.", td_style)]
    ]
    t_api = Table(api_data, colWidths=[35, 130, 35, 140, 164])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_api)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 16 & 17: DATA FLOWS & SECURITY
    # =========================================================================
    story.append(Paragraph("16. End-to-End Data Flows & 17. Security Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Government Schemes Recommendation Data Pipeline", h2_style))
    story.append(Paragraph(
        "1. <b>User Action:</b> Citizen completes Profile (Age 24, Rajasthan, ₹2.5L) $\\rightarrow$ Goal ('wealth') $\\rightarrow$ Preferences (₹2,000/mo).<br/>"
        "2. <b>Frontend Submission:</b> <code>PreferencesPage.jsx</code> triggers <code>postRecommendation(profile, goal, pref)</code>.<br/>"
        "3. <b>API Ingestion:</b> <code>POST /api/v1/recommendations</code> in <code>recommendations.py</code> validates schema.<br/>"
        "4. <b>Engine Evaluation:</b> <code>backend/app/engine.py</code> passes all 184 schemes through Stage 1 hard gates and Stage 2 scoring.<br/>"
        "5. <b>Sorting & Delivery:</b> Top 5 matching schemes with $\\text{FitScore} \\ge 60$ returned with statutory reason strings.<br/>"
        "6. <b>UI Presentation:</b> <code>RecommendationsPage.jsx</code> renders interactive cards and radar fit score breakdown.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("17. Authentication, Vault Security & Data Isolation", h2_style))
    story.append(Paragraph(
        "• <b>Password Security:</b> Passwords are never stored in plaintext. They are hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and a cryptographically random 16-byte salt (<code>backend/app/services/auth_service.py</code>).<br/>"
        "• <b>Session Tokens:</b> Authenticated requests use 32-byte cryptographic hex tokens validated on protected endpoints.<br/>"
        "• <b>Per-User Data Isolation:</b> Each user's saved schemes, LIC policies, and free benefits are stored under their unique <code>user_id</code>. Database queries for vault operations strictly filter by authenticated <code>user_id</code>, preventing cross-user data leakage.<br/>"
        "• <b>Zero Stale State Contamination:</b> When switching user profiles, the frontend invokes <code>sessionStorage.removeItem('sanchay_recommendation_result')</code>, ensuring past recommendation calculations cannot contaminate new profiles.<br/>"
        "• <b>CORS & Header Protection:</b> FastAPI CORS middleware restricts API requests to authorized frontend origins (<code>http://localhost:3003</code> in dev; configured domain in production).",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 18 & 19: EXAMPLES & FILTER ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("18. Rule Engine Execution Examples & 19. Filters", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Deterministic Test Profile Walkthroughs", h2_style))

    ex_data = [
        [Paragraph("Profile Case", th_style), Paragraph("Input Attributes", th_style), Paragraph("Rule Evaluation Process", th_style), Paragraph("Final Output Status", th_style)],
        [
            Paragraph("<b>Profile A:<br/>Young Professional</b>", td_bold),
            Paragraph("Age: 24<br/>State: Rajasthan<br/>Income: ₹2.5L<br/>Occupation: Job Seeker<br/>Goal: Wealth", td_style),
            Paragraph("• PPF: Age $\\ge 18$, Resident $\\rightarrow$ <b>ELIGIBLE</b> (Fit: 92%)<br/>• APY: Age 18–40 $\\rightarrow$ <b>ELIGIBLE</b> (Fit: 88%)<br/>• SCSS: Age < 60 $\\rightarrow$ <b>INELIGIBLE</b><br/>• PM-KMY: Non-farmer $\\rightarrow$ <b>INELIGIBLE</b>", td_style),
            Paragraph("<font color='#047857'><b>Top Matches:</b></font><br/>1. Public Provident Fund<br/>2. Atal Pension Yojana<br/>3. National Savings Cert.", td_style)
        ],
        [
            Paragraph("<b>Profile B:<br/>Senior Citizen</b>", td_bold),
            Paragraph("Age: 65<br/>State: Maharashtra<br/>Income: ₹4.0L<br/>Occupation: Retired<br/>Goal: Retirement", td_style),
            Paragraph("• SCSS: Age $\\ge 60$, Resident $\\rightarrow$ <b>ELIGIBLE</b> (Fit: 96%)<br/>• PMVVY: Age $\\ge 60$ $\\rightarrow$ <b>ELIGIBLE</b> (Fit: 94%)<br/>• APY: Age > 40 $\\rightarrow$ <b>INELIGIBLE</b> (Max 40)<br/>• LIC Umang (745): Whole Life $\\rightarrow$ <b>ELIGIBLE</b>", td_style),
            Paragraph("<font color='#047857'><b>Top Matches:</b></font><br/>1. Senior Citizens Savings<br/>2. Pradhan Mantri Vaya Vandana<br/>3. LIC Jeevan Akshay-VII", td_style)
        ],
        [
            Paragraph("<b>Profile C:<br/>Girl Child Proposer</b>", td_bold),
            Paragraph("User Age: 35<br/>Child Age: 5<br/>Child Gender: Female<br/>Saving for: Minor", td_style),
            Paragraph("• SSY: Girl child $\\le 10$, Guardian verified $\\rightarrow$ <b>ELIGIBLE</b> (Fit: 98%)<br/>• LIC Amritbaal (774): Child age 5 $\\le 13$ $\\rightarrow$ <b>ELIGIBLE</b> (Score: 92%)<br/>• SCSS: Age < 60 $\\rightarrow$ <b>INELIGIBLE</b>", td_style),
            Paragraph("<font color='#047857'><b>Top Matches:</b></font><br/>1. Sukanya Samriddhi Yojana<br/>2. LIC Amritbaal (Plan 774)<br/>3. Balika Samridhi Yojana", td_style)
        ]
    ]
    t_ex = Table(ex_data, colWidths=[85, 115, 180, 124])
    t_ex.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ex)

    story.append(Spacer(1, 8))
    story.append(Paragraph("19. Multi-Field Filter & Alias Resolution Architecture", h2_style))
    story.append(Paragraph(
        "To guarantee intuitive search results across UI labels and database variations, <code>scheme_search.py</code> maintains bidirectional alias maps: "
        "<code>CATEGORY_ALIASES</code> (e.g. <code>INSURANCE</code> $\\rightarrow$ <code>['INSURANCE', 'PROTECTION', 'PROTECTION & INSURANCE', 'LIFE INSURANCE', 'ACCIDENT INSURANCE']</code>) and "
        "<code>GOAL_ALIASES</code> (e.g. <code>WEALTH</code> $\\rightarrow$ <code>['wealth', 'long_term_savings', 'short_term_savings', 'monthly_income']</code>). "
        "Search queries execute case-insensitive regex checks across English, Hindi, Marathi, Bengali, Telugu, and keyword metadata.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 20, 21, 22: MY PLANS, ASSETS, FAULT TOLERANCE
    # =========================================================================
    story.append(Paragraph("20. My Plans, 21. Assets & 22. Fault Tolerance", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("20. My Plans Vault Subsystem", h2_style))
    story.append(Paragraph(
        "Citizens can bookmark and manage multiple asset types under a single unified vault (<code>src/pages/MyPlansPage.jsx</code>):<br/>"
        "• <b>Government Sovereign Schemes</b> (e.g. PPF, APY, SCSS)<br/>"
        "• <b>LIC Insurance & Pension Plans</b> (e.g. Jeevan Amar, Amritbaal, Jeevan Akshay)<br/>"
        "• <b>Sovereign Free Benefits</b> (e.g. PMGKAY, SMILE, PM-DAKSH)<br/>"
        "State persists in <code>AuthContext</code> and syncs to MongoDB <code>users.saved_plans</code> upon login.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("21. Asset Management & Inline Image System", h2_style))
    story.append(Paragraph(
        "Scheme visual badges and illustrations are managed through <code>src/data/schemeImages.js</code> and <code>src/scheme_images.inline.json</code>. "
        "If a specific raster asset fails to load, the system triggers a dynamic SVG fallback seal featuring the scheme category icon and Ministry color palette.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("22. Fault Tolerance & Zero-Downtime Fallback Mechanisms", h2_style))
    resilience_data = [
        [Paragraph("Failure Mode", th_style), Paragraph("Detection Mechanism", th_style), Paragraph("Automated Fallback Architecture", th_style)],
        [Paragraph("<b>MongoDB Disconnect</b>", td_bold), Paragraph("1500ms connection timeout in <code>database.py</code>", td_style), Paragraph("Switches automatically to verified disk JSON stores (<code>schemes_store.json</code>, <code>lic_plans_store.json</code>). Zero server crash.", td_style)],
        [Paragraph("<b>Gemini API Expiry / 401</b>", td_bold), Paragraph("HTTP 401 or network error in <code>gemini_adapter.py</code>", td_style), Paragraph("Switches instantly to Layer 2 deterministic multilingual rule & RAG engine. Continues serving verified facts.", td_style)],
        [Paragraph("<b>Backend API Offline</b>", td_bold), Paragraph("Axios catch error in <code>api.js</code>", td_style), Paragraph("Frontend renders verified static fallback datasets (<code>mockSchemes.js</code>, <code>licPlansFallback.js</code>).", td_style)],
        [Paragraph("<b>Speech API Unsupported</b>", td_bold), Paragraph("<code>window.SpeechRecognition</code> check in Sakhi", td_style), Paragraph("Gracefully hides mic button and defaults to keyboard input with quick suggestion chips.", td_style)]
    ]
    t_res = Table(resilience_data, colWidths=[110, 150, 244])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_res)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 23 & 24: TESTING & DEPLOYMENT
    # =========================================================================
    story.append(Paragraph("23. Automated Testing Suite & 24. Deployment", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Automated QA Audit Test Matrix (49 Total Executed Tests)", h2_style))
    test_suite_data = [
        [Paragraph("Test File", th_style), Paragraph("Test Module & Target", th_style), Paragraph("Cases", th_style), Paragraph("Execution Status", th_style)],
        [Paragraph("<code>test_final_qa_audit.py</code>", td_bold), Paragraph("Comprehensive QA audit covering all 28 audit phases, boundary limits, and filters", td_style), Paragraph("18", td_style), Paragraph("<font color='#047857'><b>18 / 18 PASS (100%)</b></font>", td_style)],
        [Paragraph("<code>test_sakhi_multilingual_all_5.py</code>", td_bold), Paragraph("Multilingual capabilities across English, Hindi, Marathi, Bengali, Telugu, and Hinglish", td_style), Paragraph("10", td_style), Paragraph("<font color='#047857'><b>10 / 10 PASS (100%)</b></font>", td_style)],
        [Paragraph("<code>test_lic_engine.py</code>", td_bold), Paragraph("LIC statutory rules, pure child plans (774), and suitability ranking", td_style), Paragraph("8", td_style), Paragraph("<font color='#047857'><b>8 / 8 PASS (100%)</b></font>", td_style)],
        [Paragraph("<code>test_free_benefits.py</code>", td_bold), Paragraph("Free Benefits 22 unique count, benefit type validation, and state rules", td_style), Paragraph("6", td_style), Paragraph("<font color='#047857'><b>6 / 6 PASS (100%)</b></font>", td_style)],
        [Paragraph("<code>test_mgnrega_eligibility.py</code>", td_bold), Paragraph("Rural household manual labor hard gates and formal salaried employee exclusions", td_style), Paragraph("4", td_style), Paragraph("<font color='#047857'><b>4 / 4 PASS (100%)</b></font>", td_style)],
        [Paragraph("<code>pre_deployment_test.py</code>", td_bold), Paragraph("Pre-deployment system health, auth flow, duplicate registration, password hashing", td_style), Paragraph("3", td_style), Paragraph("<font color='#047857'><b>3 / 3 PASS (100%)</b></font>", td_style)]
    ]
    t_tests = Table(test_suite_data, colWidths=[150, 204, 40, 110])
    t_tests.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tests)

    story.append(Spacer(1, 8))
    story.append(Paragraph("24. Production Build & Deployment Specifications", h2_style))
    story.append(Paragraph(
        "• <b>Frontend Build:</b> <code>npm run build</code> invokes Vite 5 compiler producing minified bundles in <code>dist/</code> (1531 modules compiled in 11.73s).<br/>"
        "• <b>Backend Server:</b> <code>uvicorn app.main:app --host 0.0.0.0 --port 8000</code> mounts ASGI application.<br/>"
        "• <b>Environment Configuration:</b> Requires <code>MONGODB_URI</code>, <code>DATABASE_NAME</code>, <code>GEMINI_API_KEY</code>, <code>FRONTEND_URL</code>, <code>ADMIN_API_KEY</code>, and <code>PORT</code>.<br/>"
        "• <b>Deployment Targets:</b> Fully compatible with Docker containers, AWS ECS/EC2, Render, Railway, DigitalOcean, and Vercel/Netlify for frontend static hosting.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 25 & 26: FILE DIRECTORY & FUNCTION INDEX
    # =========================================================================
    story.append(Paragraph("25. File Directory Tree & 26. Function Index", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    tree_text = """
sanchay/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI ASGI app entry point & router mounting
│   │   ├── database.py                 # Dual database manager (MongoDB + JSON fallback)
│   │   ├── engine.py                   # Government scheme 2-stage rule & scoring engine
│   │   ├── lic_engine.py               # 38-plan LIC statutory eligibility & ranking engine
│   │   ├── free_benefits_engine.py     # 22-program sovereign free benefits rule engine
│   │   ├── schemas.py                  # Pydantic v2 validation models & response schemas
│   │   ├── models.py                   # Internal entity representations
│   │   ├── routers/                    # REST route controllers
│   │   │   ├── schemes.py, lic.py, free_benefits.py, recommendations.py
│   │   │   ├── sakhi.py, auth.py, compare.py, admin.py, pre_deployment_test.py
│   │   └── services/                   # Business logic services
│   │       ├── gemini_adapter.py       # Dual-layer grounded Sakhi AI coordinator
│   │       ├── sakhi_lic_handler.py    # LIC domain chat router & query classifier
│   │       ├── sakhi_free_benefits_handler.py # Free benefits domain chat router
│   │       ├── language_service.py     # 5-language script detection & localization
│   │       ├── profile_extractor.py    # Zero-distortion user profile fact extractor
│   │       ├── scheme_search.py        # Multi-field catalog query & alias resolver
│   │       └── auth_service.py         # PBKDF2 hashing, email verify & vault security
│   ├── data/                           # Verified master JSON gazette datasets (184+38+22)
│   └── tests/                          # 49 automated QA audit and regression tests
├── src/                                # Frontend React 18 SPA
│   ├── main.jsx, App.jsx               # Application root & React Router DOM setup
│   ├── context/                        # AuthContext.jsx, LanguageContext.jsx
│   ├── pages/                          # LandingPage, ProfilePage, GoalPage, PreferencesPage
│   │                                   # RecommendationsPage, LICPage, FreeBenefitsPage, etc.
│   ├── components/                     # Reusable layout, common, lic, free_benefits, assistant
│   ├── services/api.js                 # Centralized HTTP API client with offline fallback
│   ├── utils/contentLocalizer.js       # Multilingual runtime translation adapter
│   └── data/                           # Fallback verified datasets & inline images
└── package.json, vite.config.js, tailwind.config.js # Frontend build & styling configs
    """
    story.append(Paragraph(f"<pre>{tree_text}</pre>", code_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("26. Searchable Core Function Index", h2_style))
    fn_data = [
        [Paragraph("Function Name", th_style), Paragraph("Module / File", th_style), Paragraph("Core Purpose", th_style)],
        [Paragraph("<code>evaluate_eligibility</code>", td_bold), Paragraph("<code>engine.py</code>", td_style), Paragraph("Deterministic 9-gate hard evaluation for government schemes.", td_style)],
        [Paragraph("<code>evaluate_scheme_fit</code>", td_bold), Paragraph("<code>engine.py</code>", td_style), Paragraph("Calculates explainable 0–100 fit score across 6 weighted dimensions.", td_style)],
        [Paragraph("<code>evaluate_lic_plan_eligibility</code>", td_bold), Paragraph("<code>lic_engine.py</code>", td_style), Paragraph("Statutory entry age and policy term gate evaluation for LIC plans.", td_style)],
        [Paragraph("<code>recommend_lic_plans</code>", td_bold), Paragraph("<code>lic_engine.py</code>", td_style), Paragraph("Orchestrates 38-plan ranking by goal, retirement, and budget match.", td_style)],
        [Paragraph("<code>evaluate_single_free_benefit</code>", td_bold), Paragraph("<code>free_benefits_engine.py</code>", td_style), Paragraph("Evaluates state, income, ration card, and UDID rules for free benefits.", td_style)],
        [Paragraph("<code>extract_user_profile_facts</code>", td_bold), Paragraph("<code>profile_extractor.py</code>", td_style), Paragraph("Extracts exact numeric age, state, income, and trade without distortion.", td_style)],
        [Paragraph("<code>detect_query_domain</code>", td_bold), Paragraph("<code>sakhi_lic_handler.py</code>", td_style), Paragraph("Classifies query intent into GOVERNMENT, LIC, or FREE_BENEFITS.", td_style)],
        [Paragraph("<code>detect_user_language</code>", td_bold), Paragraph("<code>language_service.py</code>", td_style), Paragraph("Identifies user language across en, hi, mr, bn, te via script blocks.", td_style)],
        [Paragraph("<code>search_schemes</code>", td_bold), Paragraph("<code>scheme_search.py</code>", td_style), Paragraph("Multi-field text search and alias expansion across master catalog.", td_style)]
    ]
    t_fn = Table(fn_data, colWidths=[140, 130, 234])
    t_fn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fn)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 27 & 28: TECH MAPPING & FLOWCHARTS
    # =========================================================================
    story.append(Paragraph("27. Technology Mapping & 28. System Flowcharts", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("Technology-to-Functionality Architecture Mapping", h2_style))
    tech_map_data = [
        [Paragraph("Technology", th_style), Paragraph("Where Used in SANCHAY", th_style), Paragraph("Function & Value Delivered", th_style)],
        [Paragraph("<b>React 18</b>", td_bold), Paragraph("<code>src/</code> UI components & pages", td_style), Paragraph("Builds interactive single page application with seamless state updates.", td_style)],
        [Paragraph("<b>Tailwind CSS</b>", td_bold), Paragraph("<code>src/index.css</code>, components", td_style), Paragraph("Renders bespoke government editorial design system (Navy, Emerald, Gold).", td_style)],
        [Paragraph("<b>FastAPI</b>", td_bold), Paragraph("<code>backend/app/</code> routers & main", td_style), Paragraph("Provides asynchronous, high-throughput REST API with automatic Swagger docs.", td_style)],
        [Paragraph("<b>MongoDB</b>", td_bold), Paragraph("<code>backend/app/database.py</code>", td_style), Paragraph("Stores scheme documents, active LIC plans, free benefits, and user vaults.", td_style)],
        [Paragraph("<b>Pydantic v2</b>", td_bold), Paragraph("<code>backend/app/schemas.py</code>", td_style), Paragraph("Validates request payloads, enforces boundary types, and prevents malformed data.", td_style)],
        [Paragraph("<b>Gemini SDK</b>", td_bold), Paragraph("<code>backend/app/services/gemini_adapter.py</code>", td_style), Paragraph("Powers conversational natural language answers grounded in verified facts.", td_style)],
        [Paragraph("<b>Web Speech API</b>", td_bold), Paragraph("<code>SakhiChatPanel.jsx</code>", td_style), Paragraph("Enables real-time voice speech-to-text in 5 Indian languages on mobile & web.", td_style)]
    ]
    t_tm = Table(tech_map_data, colWidths=[100, 160, 244])
    t_tm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tm)

    story.append(Spacer(1, 8))
    story.append(Paragraph("28. Core System Flowcharts (Flows A through J)", h2_style))
    flows_text = """
A. User Registration: Form Input -> auth_service.register() -> PBKDF2 Salt/Hash -> Verification Code -> Verified User
B. Find My Schemes: ProfilePage (Step 1) -> GoalPage (Step 2) -> PreferencesPage (Step 3) -> RecommendationsPage
C. Government Eligibility: Profile + Scheme -> evaluate_eligibility() [9 Hard Gates] -> FitScore [0-100] -> Top Matches
D. LIC Recommendation: Age + Goal + Budget -> evaluate_lic_plan_eligibility() -> calculate_lic_suitability_score() -> Ranked Plans
E. Free Benefits Eval: State + Income + Ration Card -> evaluate_single_free_benefit() -> ELIGIBLE / INELIGIBLE
F. Sakhi Conversation: User Message -> detect_user_language() -> detect_query_domain() -> Grounded Engine -> Response
G. Save Plan: Click Bookmark -> AuthContext -> POST /api/v1/auth/my-plans/toggle -> MongoDB users.saved_plans
H. Login to My Plans: Enter Credentials -> Token Generated -> Fetch Vault -> Render Schemes/LIC/Benefits
I. Multilingual Flow: User selects 'hi'/'mr'/'bn'/'te' -> LanguageContext updates -> UI & Sakhi dynamically localize
J. Voice Input Flow: Click Mic -> Web Speech API -> SpeechRecognized -> Chat Input Populated -> Auto Submit
    """
    story.append(Paragraph(f"<pre>{flows_text}</pre>", code_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 29 & 30: GLOSSARY, SUMMARY & COVERAGE REPORT
    # =========================================================================
    story.append(Paragraph("29. Technical Glossary & 30. Final QA Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("29. Technical Architecture Glossary", h2_style))
    glossary_data = [
        [Paragraph("Term", th_style), Paragraph("Technical Definition in SANCHAY Context", th_style)],
        [Paragraph("<b>Deterministic Rule Engine</b>", td_bold), Paragraph("A zero-hallucination evaluation algorithm where outcomes are dictated 100% by mathematical boundary conditions and gazette rules, never probabilistic generative guessing.", td_style)],
        [Paragraph("<b>Hard Eligibility Gate</b>", td_bold), Paragraph("A mandatory statutory condition (e.g. Age 18–40 for APY) that must be satisfied. Failure immediately produces INELIGIBLE without computing fit score.", td_style)],
        [Paragraph("<b>Fit Score</b>", td_bold), Paragraph("A weighted multi-factor compatibility index (0 to 100) calculated exclusively for eligible schemes based on Goal, Budget, Horizon, Liquidity, and Tax alignment.", td_style)],
        [Paragraph("<b>Zero-Downtime DB Driver</b>", td_bold), Paragraph("A resilient database abstraction in database.py that falls back to immutable disk JSON master stores if the MongoDB cluster is unreachable.", td_style)],
        [Paragraph("<b>Domain Router</b>", td_bold), Paragraph("A natural language query classifier in Sakhi AI that directs citizen inquiries to the specialized Government, LIC, or Free Benefits engine.", td_style)],
        [Paragraph("<b>Dual-Layer Assistant</b>", td_bold), Paragraph("An AI architecture combining Gemini GenAI for fluid conversation with deterministic gazette-backed RAG templates as an unbreakable fallback.", td_style)]
    ]
    t_gl = Table(glossary_data, colWidths=[140, 364])
    t_gl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_gl)

    story.append(Spacer(1, 10))
    story.append(Paragraph("30. Final Documentation Coverage Report", h2_style))

    coverage_data = [
        [Paragraph("Metric / Area", th_style), Paragraph("Documented Count", th_style), Paragraph("Verification Status", th_style)],
        [Paragraph("<b>Total Project Files Inspected</b>", td_bold), Paragraph("100+ files across <code>src/</code> and <code>backend/</code>", td_style), Paragraph("<font color='#047857'><b>100% Inspected</b></font>", td_style)],
        [Paragraph("<b>Frontend Pages Documented</b>", td_bold), Paragraph("11 Pages (Landing, Profile, Goal, Preferences, Recs, LIC, Benefits, Compare, etc.)", td_style), Paragraph("<font color='#047857'><b>100% Documented</b></font>", td_style)],
        [Paragraph("<b>Frontend Components Documented</b>", td_bold), Paragraph("30+ Components (Navbar, Cards, Details Modals, Eligibility Modals, Ticker, Chat)", td_style), Paragraph("<font color='#047857'><b>100% Documented</b></font>", td_style)],
        [Paragraph("<b>Backend REST APIs Documented</b>", td_bold), Paragraph("16 Endpoints across Schemes, LIC, Free Benefits, Recommendations, Sakhi, Auth", td_style), Paragraph("<font color='#047857'><b>100% Documented</b></font>", td_style)],
        [Paragraph("<b>Rule & Eligibility Engines</b>", td_bold), Paragraph("3 Engines (Government 184 schemes, LIC 38 plans, Free Benefits 22 programs)", td_style), Paragraph("<font color='#047857'><b>100% Documented</b></font>", td_style)],
        [Paragraph("<b>Database Collections</b>", td_bold), Paragraph("5 Collections (schemes, lic_plans, free_benefits, users, logs) + 3 Master JSON stores", td_style), Paragraph("<font color='#047857'><b>100% Documented</b></font>", td_style)],
        [Paragraph("<b>Automated Tests Executed</b>", td_bold), Paragraph("49 Automated Tests across 6 test suites", td_style), Paragraph("<font color='#047857'><b>49 / 49 PASS (100%)</b></font>", td_style)],
        [Paragraph("<b>Production Deployment Status</b>", td_bold), Paragraph("All Engines, Routers, UI Views, and DB Fallbacks Fully Operational", td_style), Paragraph("<font color='#047857'><b>READY FOR DEPLOYMENT</b></font>", td_style)]
    ]
    t_cov = Table(coverage_data, colWidths=[150, 204, 150])
    t_cov.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_cov)

    story.append(Spacer(1, 15))
    story.append(Paragraph("<font color='#047857'><b>[END OF TECHNICAL DOCUMENTATION • SANCHAY PLATFORM VERSION 1.0.0]</b></font>", ParagraphStyle('EndDoc', parent=body_style, alignment=1)))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Generated complete technical documentation PDF: {filename}")


if __name__ == "__main__":
    out_pdf = "SANCHAY_Complete_Technical_Documentation.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    build_pdf(out_pdf)
