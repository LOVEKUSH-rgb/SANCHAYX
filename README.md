# SANCHAY — Trusted Indian Savings & Scheme Guidance Engine

> **A Goal-First, Rule-Based Financial Discovery Platform for Indian Citizens**  
> Empowering everyday citizens with officially verified statutory savings, sovereign pensions, scholarships, farmer grants, health coverage, and LIC protection.

---

## 1. Architectural Overview

SANCHAY maintains a strict architectural separation between **deterministic rule execution**, **source-verified data**, and **natural language AI explanation**:

```
                              ┌────────────────────────────────────────┐
                              │            REACT FRONTEND              │
                              │ (Tailwind CSS + Framer Motion + Vite)  │
                              └──────────────────┬─────────────────────┘
                                                 │
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │        FASTAPI REST BACKEND            │
                              │       (Python 3.10+ / Pydantic v2)     │
                              └──────────────────┬─────────────────────┘
                                                 │
                  ┌──────────────────────────────┴──────────────────────────────┐
                  ▼                                                             ▼
     ┌─────────────────────────┐                                   ┌─────────────────────────┐
     │   RULE-BASED ENGINES    │                                   │   SAKHI AI ASSISTANT    │
     │                         │                                   │                         │
     │ 1. Mandatory Eligibility│                                   │ 1. Intent Classifier    │
     │    Filter (Hard Gate)   │                                   │ 2. MongoDB RAG Search   │
     │ 2. Fit-Score Ranking    │                                   │ 3. Strict Guardrails    │
     │    (0-100 Multi-Factor) │                                   │ 4. Gemini Model Adapter │
     └────────────┬────────────┘                                   └────────────┬────────────┘
                  │                                                             │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │       MONGODB STORE         │
                                  │ (Schemes, Logs, Citations)  │
                                  │   Strict Verification Gate  │
                                  └─────────────────────────────┘
```

---

## 2. Intelligence Layers

1. **DETERMINISTIC ELIGIBILITY ENGINE**:
   - Evaluates: Age boundaries, Residency (Strict NRI restriction), Minor/Guardian requirements, Gender specificity, Student/Farmer/Senior qualifications, Income ceilings, and active verification status.
   - **Guaranteed Zero Hallucination**: AI is **never** permitted to determine eligibility or calculate numerical fit scores.

2. **FIT-SCORE RANKING ENGINE (Stage 2)**:
   - Evaluates eligible schemes across 6 configurable dimensions:
     - **Goal Match**: 30%
     - **Monthly Budget Fit**: 20%
     - **Time Horizon Match**: 20%
     - **Liquidity Need Fit**: 15%
     - **Tax Preference Match**: 10%
     - **Life Stage Relevance**: 5%

3. **SAKHI AI ASSISTANT**:
   - Grounded strictly in MongoDB verified scheme documents.
   - Rejects speculative stock/crypto trading inquiries.
   - Supports English and Hindi with full official citations and `"View Official Details →"` direct links.

---

## 3. Supported Scheme Categories (12 Distinct Categories)

| # | Category | Official Source / Ministry | Example Schemes |
|---|----------|---------------------------|-----------------|
| 01 | **Savings & Investment** | Ministry of Finance & India Post | PPF, NSC, KVP, Mahila Samman (MSSC) |
| 02 | **Pension & Retirement** | PFRDA & Ministry of Finance | Atal Pension Yojana (APY), NPS, SCSS |
| 03 | **Protection & Insurance** | LIC & Dept. of Financial Services | PMJJBY, PMSBY, LIC Jeevan Umang |
| 04 | **Education & Scholarships** | Ministry of Education & NSP | Sukanya Samriddhi (SSY), PM-USP CSSS |
| 05 | **Women & Girls** | Ministry of Women & Child Dev | SSY, PMMVY, Stand-Up India |
| 06 | **Farmers & Agriculture** | Ministry of Agriculture | PM-KISAN, PM Fasal Bima (PMFBY), KCC |
| 07 | **Healthcare** | National Health Authority (NHA) | Ayushman Bharat PM-JAY |
| 08 | **Housing** | Ministry of Housing & Urban Affairs | Pradhan Mantri Awas Yojana (PMAY-U) |
| 09 | **Employment & Skills** | MSDE & NSDC | PMKVY 4.0, NAPS |
| 10 | **Social Security** | Ministry of Labour & Employment | PM-SYM, IGNOAPS |
| 11 | **Business & MSME** | MUDRA / Ministry of MSME | Pradhan Mantri MUDRA Yojana, PM SVANidhi |
| 12 | **Rural Development** | Ministry of Rural Development | DAY-NRLM (Women SHGs), MGNREGS |

---

## 4. Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MongoDB (Optional: Local `mongod` service or MongoDB Atlas; built-in zero-downtime storage is activated automatically if MongoDB is offline)

### Step 1: Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=sanchay_db
GEMINI_API_KEY=your_google_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
ADMIN_API_KEY=sanchay_admin_secret_key_2026
PORT=8000
```

### Step 3: Seed Database & Start Server
```bash
# Seed verified multi-category schemes
python seed_data.py

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API Documentation is available at: `http://localhost:8000/docs`.

### Step 4: Frontend Setup & Dev Server
```bash
# From repository root:
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 5. API Reference & Examples

### Health Check
```http
GET /api/health
```
```json
{
  "status": "healthy",
  "database": "connected",
  "active_verified_schemes": 16,
  "supported_categories": [
    "Savings & Investment",
    "Pension & Retirement",
    "Protection & Insurance (LIC & Statutory)",
    "..."
  ]
}
```

### Scheme Catalog & Search
```http
GET /api/schemes?category=savings&search=provident
```

### Generate Recommendations
```http
POST /api/recommendations
Content-Type: application/json

{
  "profile": {
    "age": 32,
    "gender": "Female",
    "saving_for": "self",
    "residency_status": "resident"
  },
  "goal": {
    "goal": "wealth"
  },
  "preferences": {
    "monthly_budget": 1500,
    "horizon_years": 15,
    "liquidity_preference": "medium",
    "tax_preference": true
  }
}
```

### Sakhi AI Chat (Grounded RAG)
```http
POST /api/sakhi/chat
Content-Type: application/json

{
  "message": "What is Public Provident Fund and what is its interest rate?",
  "language": "en"
}
```
**Response:**
```json
{
  "answer": "### Public Provident Fund\n\nPremier 15-year sovereign savings instrument with full EEE tax-exempt status.\n\n### Key Verified Highlights\n• **Interest / Benefit:** 7.1% per annum (compounded annually)\n• **Minimum Deposit:** ₹500\n• **Lock-in Period:** 15 Years\n• **Tax Treatment:** EEE Status\n\n### Verified Source\nVerified from **National Savings Institute** statutory notifications (Last verified: 2026-08-28).",
  "language": "en",
  "sources": [
    {
      "scheme_id": "ppf",
      "scheme_name": "Public Provident Fund",
      "authority": "National Savings Institute",
      "official_url": "https://www.nsiindia.gov.in",
      "last_verified_date": "2026-08-28"
    }
  ]
}
```

---

## 6. Running Tests

Run the complete backend test suite:
```bash
cd backend
pytest -v
```

---

## 7. Verification & Safety Philosophy
- **Verification Rule**: Only schemes marked `verified: true` and `verification_status: "verified"` appear in public recommendation pipelines.
- **Direct Official URLs**: Every scheme records its direct ministry / statutory portal link.
- **Guardrails**: Sakhi strictly refuses stock tips, crypto speculation, and unregistered schemes.
