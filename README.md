# AI Recruiting Workspace — The Sourcing Refinement Loop

A full-stack prototype of Flexiple’s AI recruiter sourcing workflow. The application converts a recruiter’s natural-language hiring requirement into structured filters and a subjective fit rubric, searches a local candidate dataset, ranks the matching candidates, and supports recruiter-driven refinement before freezing the shortlist.

# Loom Walkthrough : [Watch the Loom Demo](https://www.loom.com/share/06f554fa3a3043bbb0419398d556320d)


<img width="700" alt="Initial Search" src="https://github.com/user-attachments/assets/914daafc-d67d-4ed3-be8a-0b8551c44ca8" />

<img width="700" alt="Candidate Profiles" src="https://github.com/user-attachments/assets/c0aa3111-2648-4793-9047-7c59a9ccdff2" />

<img width="700" alt="Refinement Results" src="https://github.com/user-attachments/assets/98ea3ddc-a18a-4253-95c1-c4a8f8657ece" />

<img width="700" alt="Final Shortlist" src="https://github.com/user-attachments/assets/33b71c8c-6b54-41fa-96da-a50718ec8ee9" />





## Assignment

This project was built for the **Flexiple Engineering Challenge: The Sourcing Refinement Loop**.

The implementation focuses on one complete search session:

1. Enter a hiring requirement in free text.
2. Generate objective filters and a subjective scoring rubric using a real server-side LLM API.
3. Apply the filters to the supplied local `profiles.json` dataset.
4. Score and rank matching candidates.
5. Provide recruiter feedback and refine the search.
6. Freeze the final shortlist with the latest filters, rubric, and ranked candidates.

## Features

- Natural-language hiring requirement input.
- LLM-generated objective filters, such as:
  - Skills
  - Years of experience
  - Location
  - Company background
- LLM-generated subjective fit rubric.
- Local filtering against the supplied fictional candidate dataset.
- LLM-based candidate scoring and ranking.
- Display of the top five candidate profiles.
- Candidate-specific matching explanations.
- Recruiter feedback through refinement input and candidate-level decisions.
- Refinement and rerun of the search.
- Display of refinement changes and reasoning.
- Final shortlist freeze state.
- Loading, empty-result, and error-state handling.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- React state management with hooks
- Responsive recruiter-focused interface

### Backend

- Python
- FastAPI
- Gemini API
- JSON-based candidate dataset
- Environment-based API key configuration

## Project Structure

```text
project-root/
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── ...
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── profiles.json
│   └── ...
├── profiles.json
├── .env
├── .gitignore
└── README.md
```

> Update the structure above if the final repository uses different folder names.

## LLM Configuration

The application uses a server-side Gemini API call.

Create a `.env` file in the backend directory and add:

```env
GEMINI_API_KEY=your_api_key_here
```

**Important:** Never commit `.env` or expose the API key in frontend code.

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**macOS/Linux**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Configure the API key in `.env`, then start FastAPI:

```bash
uvicorn main:app --reload
```

The backend normally runs at:

```text
http://127.0.0.1:8000
```

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## How to Use

1. Enter a requirement, for example:

   ```text
   Find a Data Engineer with Python, SQL, and Spark experience,
   preferably with experience in cloud data platforms.
   ```

2. Click **Search Candidates**.
3. Review the generated filters and fit rubric.
4. Review the ranked candidate profiles and matching explanations.
5. Enter recruiter feedback, for example:

   ```text
   Candidate 1 is too junior. Prioritize stronger Spark and
   production data engineering experience.
   ```

6. Use the candidate-level feedback options where available.
7. Click **Refine and Rerun**.
8. Review the updated filters, rubric, and candidate ranking.
9. Click **Freeze Shortlist** to display the final search state.

## Design and Engineering Decisions

### What I prioritised

- A complete end-to-end sourcing loop instead of isolated features.
- Clear visibility of the current filters and subjective rubric.
- A simple recruiter workflow with minimal interaction friction.
- Showing a maximum of five profiles at a time to match the assignment’s intended experience.
- Keeping the candidate dataset local and easy to inspect.
- Separating objective filtering from LLM-based scoring.
- Providing user-facing loading and error states.

### What I cut

- Authentication and multiple recruiter roles.
- Persistent storage and search history across sessions.
- Integration with a real talent database.
- Advanced candidate pagination and large-scale search infrastructure.
- Complex analytics dashboards.
- A full conversational history interface.

These features were excluded to stay within the assignment’s three-hour time box and keep the implementation focused on the sourcing refinement loop.

### Why these decisions

The assignment evaluates the quality of the sourcing loop rather than the number of additional features. Therefore, the implementation focuses on the main user journey: requirement → filters and rubric → candidate results → recruiter feedback → refinement → freeze.

## Error and Recovery Handling

The frontend provides user-facing feedback for common failure cases, including:

- Empty hiring requirements.
- Requirement parsing errors.
- Candidate filtering errors.
- Candidate scoring errors.
- Refinement errors.
- Backend/API failures.
- Empty search results.

If a request fails, verify:

1. The backend is running.
2. The Gemini API key is configured correctly.
3. The required Python dependencies are installed.
4. The frontend is calling the correct backend URL.
5. The API has not exceeded its rate limit.

## Prompts

The LLM prompts are maintained in the backend/repository so that they can be reviewed and improved independently of the frontend.

The prompts are responsible for:

- Extracting structured objective filters.
- Generating the subjective fit rubric.
- Scoring candidate profiles against the rubric.
- Updating the filters and rubric based on recruiter feedback.

## Security Notes

- Store `GEMINI_API_KEY` only in an environment variable.
- Do not commit `.env`, credentials, or API keys.
- Do not expose the API key in frontend code.
- The supplied candidate profiles are fictional assignment data.
- Authentication and persistent user accounts are intentionally outside the scope.

## Scope Limitations

- The application uses the supplied local sample dataset instead of a real 98-million-person talent map.
- The search state is designed for a single session.
- Candidate data is not persisted between sessions.
- LLM output quality depends on API availability and model responses.
- The prototype is not intended for production-scale recruitment infrastructure.

## Submission Checklist

- [ ] Repository is accessible and contains the source code.
- [ ] README includes setup instructions and API key variable name.
- [ ] `.env` is excluded using `.gitignore`.
- [ ] LLM prompts are included in the repository.
- [ ] Backend and frontend run locally.
- [ ] Free-text search and candidate ranking work.
- [ ] At least one refinement round works.
- [ ] Freeze shortlist works.
- [ ] Loom walkthrough demonstrates the complete loop.
- [ ] Loom walkthrough includes a failure or recovery scenario.

## Author

**Aryan Shivva**
