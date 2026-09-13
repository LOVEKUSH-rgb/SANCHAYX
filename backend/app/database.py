import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
backend_env = BACKEND_DIR / ".env"
if backend_env.exists():
    load_dotenv(backend_env, override=True)
else:
    load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sanchay_db")

# Path for persistent local fallback storage if MongoDB service is not running
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
FALLBACK_SCHEMES_FILE = DATA_DIR / "schemes_store.json"
FALLBACK_LOGS_FILE = DATA_DIR / "logs_store.json"
FALLBACK_USERS_FILE = DATA_DIR / "users_store.json"
FALLBACK_LIC_PLANS_FILE = DATA_DIR / "lic_plans_store.json"
FALLBACK_LIC_INFO_FILE = DATA_DIR / "lic_information_store.json"
FALLBACK_FREE_BENEFITS_FILE = DATA_DIR / "free_benefits_store.json"

_mongo_client = None
_db = None
_use_fallback = False


class InMemoryMongoCollection:
    """
    High-fidelity MongoDB collection emulator used for zero-downtime fallback
    and test environments where MongoDB service is optional.
    Implements standard MongoDB query operators ($regex, $in, $gte, $lte, $eq, $ne, $or, $and).
    """
    def __init__(self, filename: Path, default_master: Optional[Path] = None):
        self.filename = filename
        self.default_master = default_master
        self._data: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        docs = []
        # Priority 1: load master file if provided and exists
        if self.default_master and self.default_master.exists():
            try:
                with open(self.default_master, "r", encoding="utf-8") as f:
                    docs = json.load(f)
            except Exception as e:
                print(f"Notice: Failed loading master dataset {self.default_master}: {e}")

        # Priority 2: fallback to filename store
        if not docs and self.filename.exists():
            try:
                with open(self.filename, "r", encoding="utf-8") as f:
                    docs = json.load(f)
            except Exception as e:
                print(f"Notice: Failed loading fallback dataset {self.filename}: {e}")

        if isinstance(docs, list):
            self._data = {doc.get("user_id", doc.get("benefit_id", doc.get("plan_id", doc.get("scheme_id", doc.get("id", str(idx)))))): doc for idx, doc in enumerate(docs)}
        elif isinstance(docs, dict):
            self._data = docs
        else:
            self._data = {}

    def _save(self):
        try:
            with open(self.filename, "w", encoding="utf-8") as f:
                json.dump(list(self._data.values()), f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Warning: Failed to save store to {self.filename}: {e}")

    def _match_doc(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not any(self._match_doc(doc, sub_q) for sub_q in v):
                    return False
                continue
            if k == "$and":
                if not all(self._match_doc(doc, sub_q) for sub_q in v):
                    return False
                continue

            # Nested field resolution (e.g., "eligibility.gender")
            curr = doc
            parts = k.split(".")
            found = True
            for part in parts:
                if isinstance(curr, dict) and part in curr:
                    curr = curr[part]
                else:
                    found = False
                    break

            if not found:
                if v is None:
                    continue
                return False

            # Evaluate Operators
            if isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$regex":
                        pattern = re.compile(str(op_val), re.IGNORECASE)
                        if not pattern.search(str(curr or "")):
                            return False
                    elif op == "$in":
                        if isinstance(curr, list):
                            if not any(x in op_val for x in curr):
                                return False
                        elif curr not in op_val:
                            return False
                    elif op == "$nin":
                        if curr in op_val:
                            return False
                    elif op == "$gte":
                        if curr is None or curr < op_val:
                            return False
                    elif op == "$lte":
                        if curr is None or curr > op_val:
                            return False
                    elif op == "$gt":
                        if curr is None or curr <= op_val:
                            return False
                    elif op == "$lt":
                        if curr is None or curr >= op_val:
                            return False
                    elif op == "$ne":
                        if curr == op_val:
                            return False
                    elif op == "$eq":
                        if curr != op_val:
                            return False
            else:
                # Direct equality or element in list
                if isinstance(curr, list) and not isinstance(v, list):
                    if v not in curr:
                        return False
                elif curr != v:
                    return False
        return True

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        query = query or {}
        results = [doc for doc in self._data.values() if self._match_doc(doc, query)]
        
        class Cursor:
            def __init__(self, items):
                self._items = items

            def sort(self, key, direction=1):
                reverse = direction < 0
                self._items.sort(key=lambda x: x.get(key, 0), reverse=reverse)
                return self

            def skip(self, n):
                self._items = self._items[n:]
                return self

            def limit(self, n):
                if n > 0:
                    self._items = self._items[:n]
                return self

            def to_list(self, length=None):
                if length is not None:
                    return self._items[:length]
                return self._items

            def __iter__(self):
                return iter(self._items)

            def __len__(self):
                return len(self._items)

        return Cursor(results)

    def find_one(self, query: Dict[str, Any]):
        for doc in self._data.values():
            if self._match_doc(doc, query):
                return doc
        return None

    def insert_one(self, doc: Dict[str, Any]):
        key = doc.get("user_id", doc.get("benefit_id", doc.get("scheme_id", doc.get("id", str(len(self._data) + 1)))))
        self._data[key] = doc
        self._save()
        class Result:
            inserted_id = key
        return Result()

    def insert_many(self, docs: List[Dict[str, Any]]):
        for doc in docs:
            key = doc.get("user_id", doc.get("benefit_id", doc.get("scheme_id", doc.get("id", str(len(self._data) + 1)))))
            self._data[key] = doc
        self._save()
        class Result:
            inserted_ids = [doc.get("user_id", doc.get("benefit_id", doc.get("scheme_id", doc.get("id")))) for doc in docs]
        return Result()

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        doc = self.find_one(query)
        if doc:
            if "$set" in update:
                for k, v in update["$set"].items():
                    parts = k.split(".")
                    target = doc
                    for part in parts[:-1]:
                        if part not in target or not isinstance(target[part], dict):
                            target[part] = {}
                        target = target[part]
                    target[parts[-1]] = v
            self._save()
            class Result:
                matched_count = 1
                modified_count = 1
            return Result()
        elif upsert:
            new_doc = update.get("$set", {})
            self.insert_one(new_doc)
            class Result:
                matched_count = 0
                modified_count = 1
                upserted_id = new_doc.get("user_id", new_doc.get("scheme_id"))
            return Result()
        class Result:
            matched_count = 0
            modified_count = 0
        return Result()

    def delete_one(self, query: Dict[str, Any]):
        doc = self.find_one(query)
        if doc:
            key = doc.get("user_id", doc.get("benefit_id", doc.get("scheme_id", doc.get("id"))))
            if key in self._data:
                del self._data[key]
                self._save()
                class Result:
                    deleted_count = 1
                return Result()
        class Result:
            deleted_count = 0
        return Result()

    def delete_many(self, query: Dict[str, Any]):
        keys_to_delete = [k for k, doc in self._data.items() if self._match_doc(doc, query)]
        for k in keys_to_delete:
            del self._data[k]
        self._save()
        class Result:
            deleted_count = len(keys_to_delete)
        return Result()

    def count_documents(self, query: Dict[str, Any]) -> int:
        return len([doc for doc in self._data.values() if self._match_doc(doc, query)])

    def distinct(self, key: str, query: Optional[Dict[str, Any]] = None) -> List[Any]:
        docs = [doc for doc in self._data.values() if self._match_doc(doc, query or {})]
        vals = set()
        for doc in docs:
            curr = doc
            for part in key.split("."):
                if isinstance(curr, dict) and part in curr:
                    curr = curr[part]
                else:
                    curr = None
                    break
            if curr is not None:
                if isinstance(curr, list):
                    vals.update(curr)
                else:
                    vals.add(curr)
        return sorted(list(vals), key=lambda x: str(x))

    def create_index(self, *args, **kwargs):
        # In-memory indices are no-ops
        pass


class MongoDatabaseWrapper:
    def __init__(self, real_db=None):
        self.real_db = real_db
        self._fallback_schemes = InMemoryMongoCollection(FALLBACK_SCHEMES_FILE, default_master=DATA_DIR / "master_schemes.json")
        self._fallback_logs = InMemoryMongoCollection(FALLBACK_LOGS_FILE)
        self._fallback_users = InMemoryMongoCollection(FALLBACK_USERS_FILE)
        self._fallback_lic_plans = InMemoryMongoCollection(FALLBACK_LIC_PLANS_FILE, default_master=DATA_DIR / "lic_master_plans.json")
        self._fallback_lic_info = InMemoryMongoCollection(FALLBACK_LIC_INFO_FILE, default_master=DATA_DIR / "lic_information.json")
        self._fallback_free_benefits = InMemoryMongoCollection(FALLBACK_FREE_BENEFITS_FILE, default_master=DATA_DIR / "free_benefits_master.json")

    def get_collection(self, name: str):
        if self.real_db is not None:
            return self.real_db[name]
        if name == "schemes":
            return self._fallback_schemes
        if name == "users":
            return self._fallback_users
        if name == "lic_plans":
            return self._fallback_lic_plans
        if name == "lic_information":
            return self._fallback_lic_info
        if name == "free_benefits":
            return self._fallback_free_benefits
        return self._fallback_logs

    def __getitem__(self, name: str):
        return self.get_collection(name)


def init_db():
    global _mongo_client, _db, _use_fallback
    try:
        from pymongo import MongoClient
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1500)
        # Test connection
        client.server_info()
        _mongo_client = client
        _db = client[DATABASE_NAME]
        _use_fallback = False
        print(f"Connected successfully to MongoDB at {MONGODB_URI}/{DATABASE_NAME}")

        # Setup Indexes for schemes
        schemes_col = _db["schemes"]
        schemes_col.create_index("scheme_id", unique=True)
        schemes_col.create_index("name")
        schemes_col.create_index("category")
        schemes_col.create_index("sub_category")
        schemes_col.create_index("verified")
        schemes_col.create_index("verification_status")
        schemes_col.create_index("authority")
        schemes_col.create_index("active")
        schemes_col.create_index("goals")
        schemes_col.create_index("life_stages")
        schemes_col.create_index([("name", "text"), ("short_description", "text"), ("full_description", "text")])

        # Setup Indexes for users
        users_col = _db["users"]
        users_col.create_index("email", unique=True)
        users_col.create_index("user_id", unique=True)

        # Setup Indexes for lic_plans
        lic_col = _db["lic_plans"]
        lic_col.create_index("plan_id", unique=True)
        lic_col.create_index("plan_number")
        lic_col.create_index("uin")
        lic_col.create_index("category")
        lic_col.create_index("active_status")

        # Setup Indexes for lic_information
        lic_info_col = _db["lic_information"]
        lic_info_col.create_index("organization_name")

        # Setup Indexes for free_benefits
        fb_col = _db["free_benefits"]
        fb_col.create_index("benefit_id", unique=True)
        fb_col.create_index("name")
        fb_col.create_index("level")
        fb_col.create_index("state")
        fb_col.create_index("category")
        fb_col.create_index("benefit_type")
        fb_col.create_index("status")
    except Exception as e:
        print(f"MongoDB connection notice: {e}. Activating persistent zero-downtime database driver.")
        _use_fallback = True
        _db = MongoDatabaseWrapper()


def get_db():
    global _db
    if _db is None:
        init_db()
    return _db


def get_schemes_collection():
    db = get_db()
    return db["schemes"]


def get_logs_collection():
    db = get_db()
    return db["recommendation_logs"]


def get_users_collection():
    db = get_db()
    return db["users"]


def get_lic_plans_collection():
    db = get_db()
    return db["lic_plans"]


def get_lic_information_collection():
    db = get_db()
    return db["lic_information"]


def get_free_benefits_collection():
    db = get_db()
    return db["free_benefits"]

