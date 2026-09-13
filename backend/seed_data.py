import os
import sys
from typing import Tuple

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from seed_master import seed_master_schemes, MASTER_DATA_PATH


def seed_database():
    return seed_master_schemes(MASTER_DATA_PATH)


if __name__ == "__main__":
    seed_database()
