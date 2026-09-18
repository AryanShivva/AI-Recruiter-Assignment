
from typing import Any


SKILL_ALIASES = {
    "data engineering": {
        "data engineering",
        "pyspark",
        "spark",
        "apache spark",
        "databricks",
        "etl",
        "elt",
        "data pipelines"
    },
    "machine learning": {
        "machine learning",
        "ml",
        "tensorflow",
        "pytorch",
        "scikit-learn"
    }
}


def skill_matches(
    required_skill: str,
    profile_skills: list[str]
) -> bool:

    required = required_skill.lower().strip()

    expanded_skills = SKILL_ALIASES.get(
        required,
        {required}
    )

    for profile_skill in profile_skills:

        profile_skill = profile_skill.lower().strip()

        if profile_skill in expanded_skills:
            return True

        if required in profile_skill:
            return True

        if profile_skill in required:
            return True

    return False


def filter_profiles(
    profiles: list[dict[str, Any]],
    filters: dict[str, Any]
) -> list[dict[str, Any]]:

    skills = filters.get("skills", [])
    min_years = filters.get("min_years_experience")
    location = filters.get("location")
    education = filters.get("education")

    results = []

    for profile in profiles:

        if (
            min_years is not None
            and profile.get("years_experience", 0) < min_years
        ):
            continue

        if (
            location
            and profile.get("location", "").lower()
            != location.lower()
        ):
            continue

        profile_skills = profile.get("skills", [])

        if skills and not all(
            skill_matches(skill, profile_skills)
            for skill in skills
        ):
            continue

        if (
            education
            and education.lower()
            not in profile.get("education", "").lower()
        ):
            continue

        results.append(profile)

    return results