import json
from pathlib import Path
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load env
backend_env = Path(__file__).resolve().parent / ".env"
if backend_env.exists():
    load_dotenv(backend_env)

mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
db_name = os.getenv("DATABASE_NAME", "sanchay_db")

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
db = client[db_name]
col = db["schemes"]

# URL mapping fixes for government schemes
url_fixes = {
    "https://wcd.nic.in/bbbp-schemes": "https://wcd.nic.in",
    "http://wcd.nic.in/bbbp-schemes": "https://wcd.nic.in",
    "https://wcd.nic.in/schemes": "https://wcd.nic.in",
    "https://pmkmy.gov.in/schemes": "https://pmkmy.gov.in",
    "https://financialservices.gov.in/banking-divisions/Important-Schemes": "https://financialservices.gov.in",
}

# Fix in MongoDB
for old_url, new_url in url_fixes.items():
    res = col.update_many(
        {"verification.official_url": old_url},
        {"$set": {"verification.official_url": new_url}}
    )
    col.update_many(
        {"official_url": old_url},
        {"$set": {"official_url": new_url}}
    )
    print(f"Updated {res.modified_count} records from {old_url} to {new_url}")

# Also check any schemes with missing or invalid official_url and set to fallback
cursor = col.find({})
fixed_count = 0
for doc in cursor:
    sid = doc.get("scheme_id", doc.get("id"))
    ver = doc.get("verification", {})
    url = ver.get("official_url") or doc.get("official_url")
    if not url or not url.startswith("http"):
        col.update_one({"_id": doc["_id"]}, {"$set": {"verification.official_url": "https://www.india.gov.in", "official_url": "https://www.india.gov.in"}})
        fixed_count += 1

print(f"Fixed {fixed_count} invalid URLs in MongoDB.")

# Also update JSON files
json_path = Path(__file__).resolve().parent / "data" / "master_schemes.json"
if json_path.exists():
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    modified = False
    for item in data:
        ver = item.get("verification", {})
        if ver.get("official_url") in url_fixes:
            ver["official_url"] = url_fixes[ver["official_url"]]
            modified = True
        if item.get("official_url") in url_fixes:
            item["official_url"] = url_fixes[item["official_url"]]
            modified = True
            
    if modified:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Updated master_schemes.json")
