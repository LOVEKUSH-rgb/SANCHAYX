"""
Financial Knowledge Engine (Lightweight Retrieval)
Grounded, verified financial knowledge for personal finance, sovereign schemes,
budgeting, emergency reserves, debt management, and wealth accumulation.
Zero external dependencies, fast lexical matching, fully deterministic.
"""

import re
from typing import Dict, List, Any, Optional

VERIFIED_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "budgeting_503020",
        "category": "BUDGETING",
        "keywords": [
            "budget", "manage money", "manage my money", "how should i manage", "50/30/20", "50 30 20",
            "cannot save", "can't save", "unable to save", "struggling to save", "earning", "salary",
            "पैसे कैसे खर्च करें", "बजट", "50/30/20 नियम", "पैसे वाचवा", "খবর বাজেট", "ఖర్చు"
        ],
        "verified_facts": [
            "50% for Needs: Rent, groceries, utilities, basic transit, essential insurance, statutory minimum dues.",
            "30% for Wants: Dining out, leisure, shopping, streaming subscriptions, hobbies.",
            "20% for Savings & Debt Acceleration: Emergency fund, PPF, NPS, SIP, extra loan principal reduction.",
            "Pay Yourself First: Transfer the 20% savings on salary day via automated mandate before discretionary spending begins."
        ],
        "practical_recommendations": [
            "Set up an automatic recurring deposit (RD) or liquid fund SIP on the 1st or salary credit day.",
            "Track the last 30 days of bank/UPI statements to identify invisible micro-spending leaks (e.g. food delivery, cab upgrades).",
            "If essential needs exceed 50% due to high metro rent, temporarily compress wants to 20% to keep savings at minimum 10-15%."
        ],
        "risks_and_limitations": [
            "Rigid percentage allocations must be adapted to individual family dependency, healthcare burdens, and income tiers.",
            "Does not account for sudden unbudgeted emergency expenses unless an emergency fund is in place."
        ],
        "suggested_follow_up": "What are your two largest monthly expense categories right now (e.g., rent, loan EMIs, or groceries)?",
        "localized_summary": {
            "en": "The 50/30/20 guideline allocates 50% to essential living needs, 30% to lifestyle wants, and 20% to savings and debt defense. Adopting 'Pay Yourself First' prevents lifestyle creep.",
            "hi": "50/30/20 नियम के अनुसार 50% अनिवार्य ज़रूरतों, 30% जीवनशैली व शौक और 20% बचत के लिए रखें। 'पहले खुद को भुगतान करें' (वेतन मिलते ही बचत अलग करें)।"
        }
    },
    {
        "id": "emergency_fund",
        "category": "EMERGENCY_FUND",
        "keywords": [
            "emergency fund", "emergency cushion", "emergency runway", "aapatkaleen", "emergency",
            "आपातकालीन निधि", "इमरजेंसी फंड", "आपत्कालीन निधी", "জরুরী তহবিল", "అత్యవసర నిధి"
        ],
        "verified_facts": [
            "Adequacy Target: 3 to 6 months of unavoidable monthly living expenses (Needs + essential EMIs).",
            "Self-employed or single-earner households should aim for 6 to 9 months of essential expenses.",
            "Liquidity Requirement: Capital preservation and instantaneous access outweigh yield. Must be accessible within 24 hours without exit penalties."
        ],
        "practical_recommendations": [
            "Store in high-liquidity, low-risk avenues: High-yield savings bank account with sweep-in FD, or overnight/liquid mutual funds.",
            "Never invest emergency funds in volatile equity shares, lock-in tax schemes, or speculative assets.",
            "Build incrementally: Start by targeting 1 month of essential expenses, then expand gradually."
        ],
        "risks_and_limitations": [
            "Keeping excess cash beyond 6-9 months in liquid accounts results in purchasing power erosion due to inflation.",
            "Using emergency funds for non-emergencies (vacations, gadgets) defeats the purpose."
        ],
        "suggested_follow_up": "How many months of basic household expenses do you currently have accessible in your savings account?",
        "localized_summary": {
            "en": "An emergency fund is a 3-6 month liquid safety cushion for medical or employment shocks, kept in safe, penalty-free accounts.",
            "hi": "आपातकालीन निधि (Emergency Fund) 3 से 6 महीने के अनिवार्य खर्च का सुरक्षा कवच है, जिसे बचत खाते या लिक्विड एफडी में रखना चाहिए।"
        }
    },
    {
        "id": "savings_kickstart",
        "category": "SAVINGS",
        "keywords": [
            "paise bachane", "kaise shuru karu", "how to start saving", "save money", "start saving",
            "struggle to save", "bachat kaise kare", "bachat suru", "बचत कैसे शुरू करें", "पैसे कैसे बचाएं",
            "पैसे वाचवा", "টাকা জমানো", "డబ్బు ఆదా"
        ],
        "verified_facts": [
            "Core Rule: Savings = Income - Expenses is flawed. The winning formula is Income - Target Savings = Allowable Expenses.",
            "Small Steps: Starting with even ₹500 or ₹1,000 per month builds psychological momentum and financial discipline.",
            "Automation: Automatic standing instructions on salary day remove reliance on willpower."
        ],
        "practical_recommendations": [
            "Step 1: Open a Post Office Recurring Deposit (RD) or Bank RD with an automated monthly transfer of ₹1,000–₹2,000 on salary day.",
            "Step 2: Maintain a separate zero-fee digital savings account dedicated exclusively to savings (do not carry its debit card).",
            "Step 3: Implement the 24-hour rule for non-essential purchases above ₹1,500 to eliminate impulse buying."
        ],
        "risks_and_limitations": [
            "Setting an over-ambitious savings target initially can lead to cash shortages before month-end and premature withdrawals.",
            "Keep savings liquid until an initial 1-month cushion is created."
        ],
        "suggested_follow_up": "What is an easy monthly amount (like ₹1,000 or ₹2,000) you could comfortably set aside on salary day without affecting your daily needs?",
        "localized_summary": {
            "en": "Begin saving using the 'Income - Savings = Expenses' principle. Automate ₹1,000 to ₹2,000 into a recurring deposit right on salary day.",
            "hi": "बचत की शुरुआत 'वेतन मिलते ही पहले बचत अलग करें' नियम से करें। वेतन वाले दिन ही ₹1,000 से ₹2,000 की ऑटोमैटिक आरडी (RD) शुरू करें।"
        }
    },
    {
        "id": "debt_management",
        "category": "DEBT_MANAGEMENT",
        "keywords": [
            "credit card", "credit card debt", "card debt", "debt", "loans", "loan", "emi",
            "manage debt", "clear debt", "pay off debt", "debt trap", "karz", "udhar", "कर्ज", "उधार",
            "क्रेडिट कार्ड", "ঋণ পরিশোধ", "అప్పులు"
        ],
        "verified_facts": [
            "Credit Card Interest Rate: Revolving credit card debt charges 36% to 42% p.a. (3.0% to 3.5% per month), making it the most expensive consumer debt.",
            "Minimum Amount Due (MAD) Trap: Paying only 5% MAD prolongs repayment for 10-15 years and multiplies total interest paid by 3x to 5x.",
            "Debt-to-Income (DTI) Benchmark: Total monthly EMIs should ideally never exceed 35-40% of net monthly take-home income."
        ],
        "practical_recommendations": [
            "Immediate Freeze: Temporarily stop all new spending on credit cards; switch strictly to debit card, UPI, or cash.",
            "Avalanche Method (Mathematically Best): Pay minimum due on all obligations, direct every surplus rupee to the card/loan with highest APR.",
            "Snowball Method (Psychological Momentum): Pay off the smallest loan balance first to eliminate accounts and gain momentum.",
            "Consolidation Option: If revolving card balances exceed 2 months' salary, explore a lower-interest personal loan (11-14%) or gold loan to clear 42% APR cards immediately."
        ],
        "risks_and_limitations": [
            "Consolidating debt only works if credit card usage is discontinued; otherwise, it doubles total indebtedness.",
            "Missed credit card payments severely damage your CIBIL/credit score for up to 36 months."
        ],
        "suggested_follow_up": "What is your approximate total credit card outstanding balance, and how many active cards do you currently carry?",
        "localized_summary": {
            "en": "Credit card debt carries punishing 36-42% annual interest. Stop card spending, avoid the minimum payment trap, and attack the highest-interest balance first.",
            "hi": "क्रेडिट कार्ड पर 36-42% वार्षिक ब्याज लगता है। केवल मिनिमम ड्यू भरने के जाल से बचें, कार्ड से खर्च तुरंत बंद करें और सबसे महंगे कर्ज को पहले चुकाएं।"
        }
    },
    {
        "id": "sip_and_investing",
        "category": "SIP_INVESTMENT",
        "keywords": [
            "sip", "systematic investment", "sip calculation", "mutual fund", "calculate sip",
            "rupee cost averaging", "एसआयपी", "एसआईपी", "म्यूचुअल फंड", "বিনিয়োগ", "ఎస్ఐపీ"
        ],
        "verified_facts": [
            "Rupee-Cost Averaging: Fixed monthly investments buy more units when market prices dip and fewer when prices rise, smoothing entry costs.",
            "Power of Time: The time horizon in the market matters far more than market timing. Staying invested for 5-10+ years reduces downside volatility.",
            "Ordinary Annuity Math: Standard SIP calculations assume end-of-month contribution with monthly compounding."
        ],
        "practical_recommendations": [
            "Align horizon with asset class: For horizons < 3 years use Post Office RD or liquid debt; for 5+ years consider diversified index/equity mutual funds.",
            "Automate via bank auto-debit on salary day to enforce disciplined monthly investing.",
            "Step-Up SIP: Increase monthly contribution by 5-10% annually with salary increments to accelerate corpus growth."
        ],
        "risks_and_limitations": [
            "Market-linked returns are illustrative and fluctuate with economic cycles; past returns do not guarantee future performance.",
            "Avoid stopping SIPs during market downturns, as downturns offer the lowest unit purchase costs."
        ],
        "suggested_follow_up": "What is your target investment time horizon (e.g., 3 years, 5 years, or 10+ years)?",
        "localized_summary": {
            "en": "SIP leverages rupee-cost averaging and compounding. 5+ year horizons smooth equity volatility, while short horizons require safe debt.",
            "hi": "एसआईपी (SIP) में रुपया-लागत औसत और चक्रवृद्धि ब्याज का लाभ मिलता है। 5 वर्ष या अधिक की अवधि के लिए अनुशासित मासिक निवेश आदर्श है।"
        }
    },
    {
        "id": "compounding_inflation",
        "category": "COMPOUNDING_INFLATION",
        "keywords": [
            "compound interest", "compounding", "chakravriddhi", "power of compounding", "inflation",
            "interest on interest", "rule of 72", "चक्रवृद्धि ब्याज", "चक्रवाढ व्याज", "চক্রবৃদ্ধি সুদ", "చక్రవడ్డీ"
        ],
        "verified_facts": [
            "Definition: Compound interest generates earnings on both the initial principal AND previously accumulated interest: A = P(1 + r/n)^(nt).",
            "Rule of 72: Divide 72 by the annual interest rate to find approximate years required to double your money (e.g. 72 / 7.1% ≈ 10.1 years in PPF).",
            "Inflation Reality: Historical headline inflation in India averages 5%–6% p.a. A return below inflation results in negative real purchasing power.",
            "Sovereign Compounding: Government schemes like PPF (7.1% p.a.) and Sukanya Samriddhi (8.2% p.a.) compound interest annually with 100% statutory sovereign safety."
        ],
        "practical_recommendations": [
            "Start as early as possible: An investor starting at age 25 accumulates nearly double the wealth of someone starting at 35 with identical contributions.",
            "Reinvest all earnings: Never withdraw annual interest payouts early if the goal is long-term wealth accumulation."
        ],
        "risks_and_limitations": [
            "Simple interest formulas underestimate long-term wealth, while ignoring inflation overestimates purchasing power.",
            "Fixed deposit interest is fully taxable at your income slab, reducing effective net post-tax returns."
        ],
        "suggested_follow_up": "Would you like to project the compound interest for a specific principal amount and time period?",
        "localized_summary": {
            "en": "Compound interest is 'interest on interest' (A = P(1+r/n)^nt). Schemes like PPF (7.1%) and SSY (8.2%) provide tax-free sovereign compounding.",
            "hi": "चक्रवृद्धि ब्याज में मूलधन के साथ-साथ संचित ब्याज पर भी नया ब्याज मिलता है। PPF (7.1%) और सुकन्या (8.2%) कर-मुक्त संप्रभु चक्रवृद्धि लाभ देते हैं।"
        }
    },
    {
        "id": "government_schemes_core",
        "category": "GOVERNMENT_SCHEMES",
        "keywords": [
            "ppf", "public provident fund", "ssy", "sukanya", "sukanya samriddhi", "apy",
            "atal pension", "scss", "senior citizen", "pmjdy", "post office rd", "sovereign",
            "पीपीएफ", "सुकन्या समृद्धि", "अटल पेंशन", "सरकारी योजनाएं", "সরকারি স্কিম", "ప్రభుత్వ పథకాలు"
        ],
        "verified_facts": [
            "PPF (Public Provident Fund): 7.1% p.a. compounded annually; 15-year tenure; ₹500 min, ₹1.5L max/year; EEE tax exemption; 100% sovereign guarantee.",
            "Sukanya Samriddhi Yojana (SSY): 8.2% p.a. compounded annually; for girl child under 10; max 2 daughters; 21-year maturity; EEE tax status; highest sovereign deposit yield.",
            "Atal Pension Yojana (APY): Guaranteed monthly pension of ₹1,000 to ₹5,000 from age 60; entry age 18–40; backed by PFRDA and Govt of India.",
            "Senior Citizens Savings Scheme (SCSS): 8.2% p.a. paid quarterly; age 60+; 5-year tenure extendable by 3 years; max deposit ₹30 Lakhs.",
            "Post Office 5-Year RD: 6.7% p.a. compounded quarterly; no upper investment limit; sovereign Post Office security."
        ],
        "practical_recommendations": [
            "Deposit in PPF between the 1st and 5th of the month to capture interest calculation for that calendar month.",
            "For families with daughters under age 10, SSY offers the highest guaranteed, tax-free sovereign interest in India.",
            "Combine APY for foundational pension security with PPF for long-term tax-free capital accumulation."
        ],
        "risks_and_limitations": [
            "Small savings rates are reset quarterly by the Ministry of Finance based on government bond yields.",
            "Strict lock-in rules apply: PPF restricts premature closure before 5 years and limits partial withdrawals to year 7 onward."
        ],
        "suggested_follow_up": "Are you exploring government schemes primarily for tax-saving (80C), child education, or retirement security?",
        "localized_summary": {
            "en": "Verified Government of India small savings schemes offer statutory sovereign guarantees: PPF at 7.1% (15-yr EEE), SSY at 8.2% (girl child), and SCSS at 8.2% (seniors).",
            "hi": "भारत सरकार की सत्यापित बचत योजनाएं: PPF (7.1% वार्षिक, EEE कर-मुक्त), सुकन्या समृद्धि (8.2% वार्षिक बालिका योजना), और APY (आजीवन पेंशन)।"
        }
    },
    {
        "id": "goal_planning_milestones",
        "category": "GOAL_PLANNING",
        "keywords": [
            "bike", "laptop", "car", "travel", "usa", "vacation", "buy a", "target", "milestone",
            "feasibility", "one lakh", "next year", "two years", "change the goal", "लक्ष्य", "बाईक",
            "गाड़ी", "विदेश यात्रा", "अमेरिका", "టార్గెట్"
        ],
        "verified_facts": [
            "Short-term goals (< 2 years): Capital preservation is paramount. Volatile equity must be avoided; use safe debt yielding ~6.5%–7.0% p.a. (Bank/Post Office RD, liquid funds).",
            "Extending Duration Effect: Doubling the timeframe (e.g. 1 year to 2 years) reduces the required monthly savings commitment by over 50%.",
            "Benchmark Costs: Commuter bikes standard range ₹70,000–₹1,00,000; standard 10-14 day US trip from India costs ₹2,20,000–₹3,50,000 per person."
        ],
        "practical_recommendations": [
            "Avoid expensive consumer credit: A two-wheeler personal loan at 16-20% interest adds ₹15,000–₹25,000 in interest on a ₹1 Lakh bike. Pre-saving in an RD earns interest instead of paying it.",
            "Factor in 10-15% overhead: Include on-road charges (RTO registration, insurance, road tax) for vehicles, and visa/transit insurance for travel.",
            "If monthly required contribution exceeds surplus, extend the timeframe rather than compromising your emergency fund."
        ],
        "risks_and_limitations": [
            "Prices inflate over time (e.g., annual 3-5% price hike on vehicles; foreign exchange fluctuations for international trips).",
            "Liquid funds are subject to capital gains tax as per applicable tax slab."
        ],
        "suggested_follow_up": "Would you like to compare the monthly savings requirement across 1 year versus 2 years for this goal?",
        "localized_summary": {
            "en": "For goals within 1-2 years, preserve capital in safe recurring deposits (yielding ~7%). Extending timeframes cuts required monthly contributions by half.",
            "hi": "1-2 साल के लक्ष्यों के लिए 7% सुरक्षित आरडी में बचत करें। अवधि को 1 से 2 साल करने पर मासिक बचत का बोझ आधा हो जाता है और महंगे लोन से बचाव होता है।"
        }
    }
]


def retrieve_financial_knowledge(query: str, language: str = "en", limit: int = 2) -> List[Dict[str, Any]]:
    """
    Lightweight, fast lexical and semantic keyword matching across verified financial knowledge entries.
    Returns the top matching knowledge cards sorted by relevance score.
    """
    if not query:
        return []

    q_lower = query.lower().strip()
    # Normalize punctuation and currency symbols
    q_norm = re.sub(r'[^\w\s]', ' ', q_lower)
    tokens = set(q_norm.split())

    scored_entries = []
    for item in VERIFIED_KNOWLEDGE_BASE:
        score = 0
        
        # 1. Exact phrase matches in query
        for kw in item["keywords"]:
            kw_clean = kw.lower()
            if kw_clean in q_lower:
                score += 5
            else:
                kw_tokens = set(kw_clean.split())
                overlap = tokens.intersection(kw_tokens)
                if overlap:
                    score += len(overlap) * 1.5

        # 2. Category specific boosts
        cat = item["category"]
        if cat == "BUDGETING" and any(w in tokens for w in ["manage", "budget", "salary", "earn", "earning", "income", "spend", "40000", "30000"]):
            score += 4
        elif cat == "DEBT_MANAGEMENT" and any(w in tokens for w in ["debt", "credit", "card", "loan", "emi", "karz", "udhar"]):
            score += 6
        elif cat == "SAVINGS" and any(w in tokens for w in ["shuru", "bachane", "save", "saving", "start", "bachat"]):
            score += 4
        elif cat == "COMPOUNDING_INFLATION" and any(w in tokens for w in ["compound", "compounding", "interest", "inflation", "chakravriddhi"]):
            score += 6
        elif cat == "SIP_INVESTMENT" and any(w in tokens for w in ["sip", "invest", "investment", "2000", "3000"]):
            score += 4
        elif cat == "GOVERNMENT_SCHEMES" and any(w in tokens for w in ["ppf", "ssy", "sukanya", "apy", "scss", "pmjdy", "scheme", "yojana"]):
            score += 6
        elif cat == "GOAL_PLANNING" and any(w in tokens for w in ["bike", "laptop", "car", "usa", "travel", "goal", "target", "lakh", "year", "years"]):
            score += 4

        if score > 0:
            scored_entries.append((score, item))

    # Sort descending by score
    scored_entries.sort(key=lambda x: x[0], reverse=True)
    results = [entry[1] for entry in scored_entries[:limit]]
    return results


def format_knowledge_for_context(knowledge_items: List[Dict[str, Any]], language: str = "en") -> str:
    """
    Formats retrieved knowledge items into a compact markdown context string for LLM injection.
    """
    if not knowledge_items:
        return ""

    lines = ["\nVERIFIED FINANCIAL KNOWLEDGE CONTEXT:"]
    for idx, item in enumerate(knowledge_items, 1):
        lines.append(f"[{idx}] Topic: {item['category']} ({item['id']})")
        lines.append("  Verified Facts:")
        for fact in item["verified_facts"][:3]:
            lines.append(f"    • {fact}")
        lines.append("  Practical Recommendations:")
        for rec in item["practical_recommendations"][:2]:
            lines.append(f"    • {rec}")
        lines.append("  Risks & Limitations:")
        for rk in item["risks_and_limitations"][:2]:
            lines.append(f"    • {rk}")
        lines.append(f"  Suggested Follow-Up: {item['suggested_follow_up']}")

    lines.append("Use these verified parameters and facts directly. Never contradict official sovereign rates or statutory facts.\n")
    return "\n".join(lines)
