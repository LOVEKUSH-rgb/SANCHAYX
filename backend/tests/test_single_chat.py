import sys
import unittest
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import init_db
from app.services.gemini_adapter import sakhi_adapter


class TestSingleChat(unittest.TestCase):
    def test_single_chat_compare(self):
        init_db()
        res = sakhi_adapter.chat("Compare APY and NPS")
        self.assertIsNotNone(res)
        self.assertIn(res.intent, ["COMPARE_SCHEMES", "GENERAL_SCHEME_SEARCH", "RECOMMENDATION_EXPLANATION"])


if __name__ == "__main__":
    unittest.main()
