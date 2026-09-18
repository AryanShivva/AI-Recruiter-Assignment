
import json
from typing import Any


def build_refinement_prompt(
    filters: dict[str, Any],
    rubric: dict[str, Any],
    feedback: str,
    candidate_feedback: dict[str, str]
) -> str:

    return f"""
You are an expert AI recruiter.

Update the hiring filters and rubric based on recruiter feedback.

CURRENT OBJECTIVE FILTERS:
{json.dumps(filters, indent=2)}

CURRENT SUBJECTIVE RUBRIC:
{json.dumps(rubric, indent=2)}

RECRUITER TEXT FEEDBACK:
{feedback}

CANDIDATE FEEDBACK:
{json.dumps(candidate_feedback, indent=2)}

Return ONLY valid JSON using this exact structure:

{{
  "objective_filters": {{
    "skills": [],
    "min_years_experience": null,
    "location": null,
    "education": null
  }},
  "subjective_rubric": {{
    "criteria": [],
    "priorities": [],
    "deal_breakers": []
  }},
  "changes": [],
  "reason": ""
}}

Rules:
- Preserve existing filters unless feedback requests a change.
- Do not invent unsupported requirements.
- Keep skills as a list of strings.
- Use null when a filter is not specified.
- Changes must describe actual modifications.
- Explain why the modifications were made.
- Return valid JSON only.
"""