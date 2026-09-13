import pytest
from app.services.profile_extractor import (
    extract_user_profile_facts,
    extract_age_from_text,
    extract_occupation_from_text,
    extract_income_from_text,
    extract_state_from_text
)


def test_hard_case_1():
    text = "मैं 24 साल का हूं और नौकरी की तलाश कर रहा हूं।"
    p = extract_user_profile_facts(text)
    assert p.age == 24, f"Expected 24, got {p.age}"
    assert p.occupation == "job_seeker", f"Expected job_seeker, got {p.occupation}"
    assert p.occupation != "farmer"
    assert p.age != 25


def test_hard_case_2():
    text = "मैं किसान हूं और मेरी उम्र 35 साल है।"
    p = extract_user_profile_facts(text)
    assert p.occupation == "farmer", f"Expected farmer, got {p.occupation}"
    assert p.age == 35, f"Expected 35, got {p.age}"


def test_hard_case_3():
    text = "मैं किसान नहीं हूं, मैं नौकरी ढूंढ रहा हूं।"
    p = extract_user_profile_facts(text)
    assert p.occupation == "job_seeker", f"Expected job_seeker, got {p.occupation}"
    assert p.occupation != "farmer"
    assert p.goal != "farmer_support"


def test_hard_case_4():
    text = "मेरी उम्र 24 साल है।"
    p = extract_user_profile_facts(text)
    assert p.age == 24
    assert p.age != 25


def test_hard_case_5():
    text = "मेरी सालाना आय 2.5 लाख रुपये है।"
    p = extract_user_profile_facts(text)
    assert p.annual_family_income == 250000.0, f"Expected 250000.0, got {p.annual_family_income}"


def test_hard_case_6():
    text = "मैं राजस्थान से हूं।"
    p = extract_user_profile_facts(text)
    assert p.state == "Rajasthan"


def test_hard_case_7_latest_overrides_history():
    history = [{"sender": "user", "text": "मैं किसान हूं।"}]
    current_msg = "नहीं, मैं नौकरी ढूंढ रहा हूं।"
    p = extract_user_profile_facts(current_msg, history=history)
    assert p.occupation == "job_seeker", f"Expected job_seeker, got {p.occupation}"
    assert p.occupation != "farmer"


def test_multi_turn_retention():
    # Turn 1
    t1 = "मैं 24 साल का हूं।"
    p1 = extract_user_profile_facts(t1)
    assert p1.age == 24

    # Turn 2
    h2 = [{"sender": "user", "text": t1}]
    t2 = "मैं राजस्थान से हूं।"
    p2 = extract_user_profile_facts(t2, history=h2)
    assert p2.age == 24
    assert p2.state == "Rajasthan"

    # Turn 3
    h3 = [{"sender": "user", "text": t1}, {"sender": "user", "text": t2}]
    t3 = "मैं नौकरी की तलाश में हूं।"
    p3 = extract_user_profile_facts(t3, history=h3)
    assert p3.age == 24
    assert p3.state == "Rajasthan"
    assert p3.occupation == "job_seeker"
    assert p3.occupation != "farmer"
    assert p3.goal != "farmer_support"


def test_full_urgent_prompt():
    prompt = (
        "मैं 24 साल का राजस्थान का रहने वाला हूं, मेरी सालाना पारिवारिक आय ₹2.5 लाख है और मैं अभी नौकरी की तलाश कर रहा हूं। "
        "मुझे ऐसी सरकारी योजनाएं बताओ जिनके लिए मैं वास्तव में पात्र हो सकता हूं, साथ ही अगर मेरे लिए कोई मुफ्त skill training "
        "या financial assistance available है तो वह भी बताओ। अगर LIC में मेरे लिए कोई suitable plan है तो उसे सरकारी योजनाओं से अलग समझाओ। "
        "पहले मेरी eligibility के लिए जो जरूरी जानकारी missing है वो मुझसे पूछो, बिना अनुमान लगाए।"
    )
    p = extract_user_profile_facts(prompt)
    assert p.age == 24, f"Expected 24, got {p.age}"
    assert p.state == "Rajasthan", f"Expected Rajasthan, got {p.state}"
    assert p.annual_family_income == 250000.0, f"Expected 250000.0, got {p.annual_family_income}"
    assert p.occupation == "job_seeker", f"Expected job_seeker, got {p.occupation}"
    assert p.goal == "employment"
    assert "Farmer" not in p.occupation_label
    assert p.goal != "farmer_support"
    assert p.provenance.get("age") == "USER_EXPLICIT"
    assert p.provenance.get("state") == "USER_EXPLICIT"
    assert p.provenance.get("annual_family_income") == "USER_EXPLICIT"
    assert p.provenance.get("occupation") == "USER_EXPLICIT"


def test_lic_profile_extraction_no_income_budget_confusion():
    from app.services.sakhi_lic_handler import extract_lic_user_profile
    prompt = (
        "मैं 24 साल का राजस्थान का रहने वाला हूं, मेरी सालाना पारिवारिक आय ₹2.5 लाख है और मैं अभी नौकरी की तलाश कर रहा हूं। "
        "अगर LIC में मेरे लिए कोई suitable plan है तो उसे समझाओ।"
    )
    profile, flags = extract_lic_user_profile(prompt)
    assert profile.age == 24.0, f"Expected 24.0, got {profile.age}"
    assert profile.profession == "Job Seeker", f"Expected Job Seeker, got {profile.profession}"
    # Income ₹2.5 lakh MUST NOT be set as annual or monthly budget
    assert profile.annual_budget is None, f"Expected None, got {profile.annual_budget}"
    assert profile.monthly_budget is None, f"Expected None, got {profile.monthly_budget}"


def test_free_benefits_profile_extraction():
    from app.services.sakhi_free_benefits_handler import extract_user_profile_from_text
    prompt = (
        "मैं 24 साल का राजस्थान का रहने वाला हूं, मेरी सालाना पारिवारिक आय ₹2.5 लाख है और मैं अभी नौकरी की तलाश कर रहा हूं। "
        "मुफ्त skill training या financial assistance बताओ।"
    )
    p = extract_user_profile_from_text(prompt)
    assert p.age == 24, f"Expected 24, got {p.age}"
    assert p.state == "Rajasthan", f"Expected Rajasthan, got {p.state}"
    assert p.annual_family_income == 250000.0, f"Expected 250000.0, got {p.annual_family_income}"
    assert p.occupation == "job_seeker", f"Expected job_seeker, got {p.occupation}"

