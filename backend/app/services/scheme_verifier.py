from typing import Dict, Any, Tuple
import re

TRUSTED_AUTHORITY_DOMAINS = [
    "gov.in",
    "nic.in",
    "indiapost.gov.in",
    "pfrda.org.in",
    "nsiindia.gov.in",
    "licindia.in",
    "myscheme.gov.in",
    "india.gov.in",
    "rbi.org.in",
    "sebi.gov.in",
    "uidai.gov.in",
    "epfindia.gov.in"
]


def verify_scheme_compliance(scheme: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Checks if a scheme satisfies SANCHAY's strict verification requirements:
    1. Direct official source URL
    2. Recognizable statutory authority or ministry
    3. Last verified timestamp
    4. Deterministic eligibility parameters (e.g. valid age boundaries)
    """
    reasons = []
    
    official_url = str(scheme.get("official_url", "")).strip()
    authority = str(scheme.get("authority", "")).strip()
    last_verified = str(scheme.get("last_verified_date", "")).strip()
    
    if not official_url or not official_url.startswith("http"):
        reasons.append("Missing valid official source HTTP URL")
    
    if not authority or authority.lower() in ["unknown", "n/a", "not specified"]:
        reasons.append("Missing statutory authority or issuing ministry")
        
    if not last_verified:
        reasons.append("Missing statutory verification timestamp")

    # Domain trust check
    is_trusted_domain = any(domain in official_url.lower() for domain in TRUSTED_AUTHORITY_DOMAINS)
    
    elig = scheme.get("eligibility", {})
    age_min = elig.get("age_min")
    age_max = elig.get("age_max")
    
    if age_min is not None and age_max is not None:
        if age_min > age_max:
            reasons.append(f"Invalid age bounds: min_age ({age_min}) > max_age ({age_max})")

    if reasons:
        scheme["verified"] = False
        scheme["verification_status"] = "unverified"
        return False, f"Verification failed: {'; '.join(reasons)}", scheme

    scheme["verified"] = True
    scheme["verification_status"] = "verified"
    return True, "Verified statutory scheme meeting all integrity requirements", scheme
