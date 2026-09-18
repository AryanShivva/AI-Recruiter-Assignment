
import os
import time
import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

from services.filtering import filter_profiles
from services.scoring import (
    build_scoring_prompt,
    parse_llm_json
)
from services.refinement import build_refinement_prompt


load_dotenv()


app = FastAPI(title="Flexiple AI Recruiter")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")


client = genai.Client(api_key=api_key)


BASE_DIR = Path(__file__).resolve().parent
PROFILES_FILE = BASE_DIR / "data" / "profiles.json"


# -----------------------------------------
# JSON PARSER
# -----------------------------------------

def parse_json_object(text: str) -> dict:

    text = text.strip()

    if text.startswith("```"):

        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("No valid JSON object found.")

    parsed = json.loads(text[start:end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("Expected a JSON object.")

    return parsed


# -----------------------------------------
# REQUEST MODELS
# -----------------------------------------

class RequirementRequest(BaseModel):
    requirement: str


class FilterRequest(BaseModel):
    objective_filters: dict


class ScoreRequest(BaseModel):
    profiles: list[dict]
    subjective_rubric: dict


class RefineRequest(BaseModel):
    objective_filters: dict
    subjective_rubric: dict
    feedback: str
    candidate_feedback: dict[str, str]


# -----------------------------------------
# APPLICATION
# -----------------------------------------

@app.get("/")
def home():

    return {
        "message": "Flexiple AI Recruiter API"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }


# -----------------------------------------
# PARSE REQUIREMENT
# -----------------------------------------

@app.post("/api/parse-requirement")
def parse_requirement(data: RequirementRequest):

    if not data.requirement.strip():

        raise HTTPException(
            status_code=400,
            detail="Requirement cannot be empty"
        )

    prompt = f"""
You are an AI recruiter assistant.

Analyze the following hiring requirement:

{data.requirement}

Return ONLY valid JSON using this structure:

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
  }}
}}

Rules:
- Extract only information supported by the requirement.
- Do not invent candidate details.
- Use null when information is missing.
- Keep skills as a list of strings.
- Return valid JSON only.
"""

    for attempt in range(5):

        try:

            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )

            parsed_result = parse_json_object(
                response.text
            )

            return parsed_result

        except (json.JSONDecodeError, ValueError) as error:

            raise HTTPException(
                status_code=502,
                detail=f"Invalid requirement response: {str(error)}"
            )

        except Exception as error:

            error_message = str(error)

            if (
                "429" in error_message
                or "RESOURCE_EXHAUSTED" in error_message
            ):

                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Gemini quota exceeded. "
                        "Please wait or use an API key with available quota."
                    )
                )

            if (
                "503" in error_message
                or "UNAVAILABLE" in error_message
            ):

                if attempt < 4:

                    time.sleep(
                        min(2 ** attempt * 2, 20)
                    )

                    continue

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Gemini is temporarily busy "
                        "after multiple retries."
                    )
                )

            raise HTTPException(
                status_code=500,
                detail=f"LLM request failed: {error_message}"
            )


# -----------------------------------------
# FILTER PROFILES
# -----------------------------------------

@app.post("/api/filter-profiles")
def filter_candidates(data: FilterRequest):

    try:

        with open(PROFILES_FILE, "r") as file:

            profiles = json.load(file)

        filtered_profiles = filter_profiles(
            profiles,
            data.objective_filters
        )

        return {
            "total_matches": len(filtered_profiles),
            "profiles": filtered_profiles
        }

    except FileNotFoundError:

        raise HTTPException(
            status_code=404,
            detail="profiles.json not found."
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Filtering failed: {str(error)}"
        )


# -----------------------------------------
# SCORE PROFILES
# -----------------------------------------

@app.post("/api/score-profiles")
def score_profiles(data: ScoreRequest):

    if not data.profiles:

        return {
            "ranked_profiles": []
        }

    prompt = build_scoring_prompt(
        data.profiles,
        data.subjective_rubric
    )

    for attempt in range(5):

        try:

            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )

            parsed_result = parse_llm_json(
                response.text
            )

            if "ranked_profiles" not in parsed_result:

                raise ValueError(
                    "Missing ranked_profiles in Gemini response."
                )

            return parsed_result

        except (json.JSONDecodeError, ValueError) as error:

            raise HTTPException(
                status_code=502,
                detail=f"Invalid scoring response: {str(error)}"
            )

        except Exception as error:

            error_message = str(error)

            if (
                "429" in error_message
                or "RESOURCE_EXHAUSTED" in error_message
            ):

                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Gemini quota exceeded. "
                        "Please wait or use an API key with available quota."
                    )
                )

            if (
                "503" in error_message
                or "UNAVAILABLE" in error_message
            ):

                if attempt < 4:

                    time.sleep(
                        min(2 ** attempt * 2, 20)
                    )

                    continue

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Gemini is temporarily busy "
                        "after multiple retries."
                    )
                )

            raise HTTPException(
                status_code=500,
                detail=f"Scoring failed: {error_message}"
            )


# -----------------------------------------
# REFINE REQUIREMENTS
# -----------------------------------------

@app.post("/api/refine")
def refine_requirements(data: RefineRequest):

    if (
        not data.feedback.strip()
        and not data.candidate_feedback
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Provide recruiter feedback "
                "or candidate decisions."
            )
        )

    prompt = build_refinement_prompt(
        data.objective_filters,
        data.subjective_rubric,
        data.feedback,
        data.candidate_feedback
    )

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        result = parse_json_object(
            response.text
        )

        required_keys = [
            "objective_filters",
            "subjective_rubric",
            "changes",
            "reason"
        ]

        for key in required_keys:

            if key not in result:

                raise ValueError(
                    f"Missing field: {key}"
                )

        if not isinstance(
            result["objective_filters"],
            dict
        ):

            raise ValueError(
                "Objective filters must be an object."
            )

        if not isinstance(
            result["subjective_rubric"],
            dict
        ):

            raise ValueError(
                "Subjective rubric must be an object."
            )

        if not isinstance(
            result["changes"],
            list
        ):

            raise ValueError(
                "Changes must be a list."
            )

        if not isinstance(
            result["reason"],
            str
        ):

            raise ValueError(
                "Reason must be text."
            )

        return result

    except (json.JSONDecodeError, ValueError) as error:

        raise HTTPException(
            status_code=502,
            detail=f"Invalid refinement response: {str(error)}"
        )

    except Exception as error:

        error_message = str(error)

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
        ):

            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini quota exceeded. "
                    "Please wait or use an API key with available quota."
                )
            )

        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):

            raise HTTPException(
                status_code=503,
                detail=(
                    "Gemini is temporarily unavailable. "
                    "Please try again later."
                )
            )

        raise HTTPException(
            status_code=500,
            detail=f"Refinement failed: {error_message}"
        )