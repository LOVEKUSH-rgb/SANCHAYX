import traceback
from app.services.gemini_adapter import sakhi_adapter

prompts = [
    "Highest interest rate",
    "Tell me about Sukanya Samriddhi Yojana (SSY)",
    "What is PPF?",
    "Compare APY and NPS",
    "₹500 महीने इन्वेस्ट करने है?"
]

for p in prompts:
    print(f"\n--- Testing: '{p}' ---")
    try:
        res = sakhi_adapter.chat(p, "en")
        print(f"SUCCESS: intent={res.intent}, sources={len(res.sources)}, answer_preview={res.answer[:80]}...")
    except Exception as e:
        print(f"FAILED: {e}")
        traceback.print_exc()
