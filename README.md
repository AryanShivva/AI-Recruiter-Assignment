# FLEXIPLE - AI Recruiting Workspace — The Sourcing Refinement Loop 

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

### What I Prioritised

- Built an end-to-end sourcing refinement loop for a single search session.
- Converted natural-language requirements into structured objective filters and a subjective fit rubric using Gemini.
- Applied objective filters to the supplied local candidate dataset.
- Used LLM-based scoring to rank matching candidate profiles.
- Implemented recruiter feedback and iterative refinement.
- Displayed up to five candidate profiles with explanations based on actual profile details.
- Added loading, error, and empty-result states.
- Implemented shortlist freezing with final filters, rubric, and ranked candidates.

### Technical Decisions

- **Frontend:** React for a clear and interactive recruiter experience.
- **Backend:** FastAPI for API orchestration and search logic.
- **LLM:** Gemini API for filter generation, rubric creation, candidate scoring, and refinement.
- **Data:** Local JSON dataset supplied for the assignment.
- **Security:** API keys are stored in environment variables and excluded from version control.

### Scope Decisions

The implementation focuses on the core sourcing refinement workflow within the three-hour timebox. Authentication, multiple recruiter roles, persistent search history, and production-scale talent database integration were kept outside the scope of this assignment.

### Error Handling

The application provides user-facing feedback for:

- Empty or invalid hiring requirements.
- LLM and API failures.
- Candidate filtering and scoring errors.
- Refinement errors.
- Empty search results.

### LLM Prompts

The prompts are maintained in the repository and support:

- Structured objective filter generation.
- Subjective fit rubric generation.
- Candidate scoring and ranking.
- Filter and rubric refinement based on recruiter feedback.

## Author

**Aryan Shivva**
