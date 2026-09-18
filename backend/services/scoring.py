
from typing import Any
import json


def build_scoring_prompt(
    profiles: list[dict[str, Any]],
    rubric: dict[str, Any]
) -> str:

    profiles_json = json.dumps(
        profiles,
        indent=2
    )

    rubric_json = json.dumps(
        rubric,
        indent=2
    )

    return f"""
You are an expert technical recruiter.

Evaluate the following candidates against the hiring rubric.

RUBRIC:
{rubric_json}

CANDIDATES:
{profiles_json}

Return ONLY valid JSON.
Do not use Markdown code fences.
Do not include any explanation outside the JSON.

Required format:
{{
  "ranked_profiles": [
    {{
      "id": "candidate_id",
      "score": 85,
      "explanation": "Brief explanation based only on actual profile fields."
    }}
  ]
}}

Rules:
- Score each candidate from 0 to 100.
- Rank candidates from highest to lowest score.
- Include every candidate exactly once.
- Use the original candidate IDs.
- Do not invent skills, experience, or achievements.
- Mention actual matching skills and experience.
- Return every candidate.
- Keep explanations concise and factual.

CRITICAL EXPERIENCE ACCURACY RULES:
- Use the exact value of the "years_experience" field as the candidate's experience.
- Do NOT add or sum years from "past_companies" with "years_experience".
- Do NOT calculate combined experience.
- Do NOT change, estimate, or reinterpret the years_experience value.
- Past-company years are historical details and must not be added to the stated experience.
- For example, if years_experience is 9, write "9 years of experience", not 12 years.
- For example, if years_experience is 2, write "2 years of experience", not 6 years.
- Only mention company names, education, skills, and achievements explicitly present in the candidate JSON.
- Every explanation must be grounded in the supplied candidate data.
"""


def parse_llm_json(text: str) -> dict:

    text = text.strip()

    # Remove Markdown code fences if present
    if text.startswith("```"):

        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    # Extract the JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            "No valid JSON object found."
        )

    parsed = json.loads(
        text[start:end + 1]
    )

    if not isinstance(parsed, dict):
        raise ValueError(
            "Expected a JSON object."
        )

    ranked_profiles = parsed.get(
        "ranked_profiles"
    )

    if not isinstance(ranked_profiles, list):
        raise ValueError(
            "Missing or invalid ranked_profiles."
        )

    # Validate each candidate result
    for profile in ranked_profiles:

        if not isinstance(profile, dict):
            raise ValueError(
                "Invalid profile result."
            )

        if not isinstance(profile.get("id"), str):
            raise ValueError(
                "Candidate ID must be a string."
            )

        if "score" not in profile:
            raise ValueError(
                "Candidate score is missing."
            )

        if not isinstance(
            profile["score"],
            (int, float)
        ):
            raise ValueError(
                "Candidate score must be numeric."
            )

        if not 0 <= profile["score"] <= 100:
            raise ValueError(
                "Candidate score must be between 0 and 100."
            )

        if not isinstance(
            profile.get("explanation"),
            str
        ):
            raise ValueError(
                "Candidate explanation must be text."
            )

    return parsed