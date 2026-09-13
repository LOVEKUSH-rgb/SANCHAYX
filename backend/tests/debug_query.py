import sys
import traceback
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import init_db
from app.services.gemini_adapter import GeminiSakhiAdapter

init_db()
adapter = GeminiSakhiAdapter()

q = "i am 28 years old, a private employee, earning ₹35,000 per month. I can save ₹3,000 monthly. I want to build savings for my child's education after 10 years. What schemes are suitable for me"

try:
    res = adapter.chat(q)
    print("SUCCESS! INTENT:", res.intent)
    print("ANSWER:\n", res.answer)
except Exception as e:
    print("FAILED WITH ERROR:", e)
    traceback.print_exc()
