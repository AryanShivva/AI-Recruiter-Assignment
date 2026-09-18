
import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [rankedProfiles, setRankedProfiles] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [candidateFeedback, setCandidateFeedback] = useState({});
  const [changes, setChanges] = useState([]);
  const [changeReason, setChangeReason] = useState("");
  const [frozen, setFrozen] = useState(false);

  async function getErrorMessage(response, fallback) {
    const data = await response.json().catch(() => ({}));
    return data.detail || fallback;
  }

  async function handleSearch() {
    if (!requirement.trim()) {
      setError("Please enter a hiring requirement.");
      return;
    }

    setLoading(true);
    setError("");
    setFrozen(false);
    setChanges([]);
    setChangeReason("");
    setCandidateFeedback({});

    try {
      const response = await fetch(
        `${API_URL}/api/parse-requirement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirement }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to parse requirement."
          )
        );
      }

      const parsed = await response.json();

      setFilters(parsed.objective_filters);
      setRubric(parsed.subjective_rubric);

      await runFilteringAndScoring(
        parsed.objective_filters,
        parsed.subjective_rubric
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function runFilteringAndScoring(
    currentFilters,
    currentRubric
  ) {
    const filterResponse = await fetch(
      `${API_URL}/api/filter-profiles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective_filters: currentFilters,
        }),
      }
    );

    if (!filterResponse.ok) {
      throw new Error(
        await getErrorMessage(filterResponse, "Filtering failed.")
      );
    }

    const filtered = await filterResponse.json();
    const matchingProfiles = filtered.profiles || [];

    setProfiles(matchingProfiles);

    if (matchingProfiles.length === 0) {
      setRankedProfiles([]);
      return;
    }

    const scoreResponse = await fetch(
      `${API_URL}/api/score-profiles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profiles: matchingProfiles,
          subjective_rubric: currentRubric,
        }),
      }
    );

    if (!scoreResponse.ok) {
      throw new Error(
        await getErrorMessage(scoreResponse, "Scoring failed.")
      );
    }

    const scored = await scoreResponse.json();

    setRankedProfiles(
      (scored.ranked_profiles || []).slice(0, 5)
    );
  }

  async function handleRefine() {
    if (!filters || !rubric) return;

    if (
      !feedback.trim() &&
      Object.keys(candidateFeedback).length === 0
    ) {
      setError("Please provide feedback or candidate decisions.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective_filters: filters,
          subjective_rubric: rubric,
          feedback,
          candidate_feedback: candidateFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Refinement failed.")
        );
      }

      const refined = await response.json();

      setFilters(refined.objective_filters);
      setRubric(refined.subjective_rubric);
      setChanges(refined.changes || []);
      setChangeReason(refined.reason || "");

      await runFilteringAndScoring(
        refined.objective_filters,
        refined.subjective_rubric
      );

      setFeedback("");
      setCandidateFeedback({});
    } catch (err) {
      setError(err.message || "Refinement failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(field, value) {
    setFilters({
      ...filters,
      [field]: value,
    });
  }

  function updateRubric(field, value) {
    setRubric({
      ...rubric,
      [field]: value,
    });
  }

  function getProfileDetails(profileId) {
    return profiles.find((profile) => profile.id === profileId);
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>AI</div>

          <p style={styles.eyebrow}>
            FLEXIPLE AI RECRUITING WORKSPACE
          </p>

          <h1 style={styles.title}>
            FLEXIPLE
            <br />
            <span style={styles.titleAccent}>
              ASSIGNMENT
            </span>
          </h1>

          <p style={styles.subtitle}>
            Transform hiring requirements into an explainable,
            continuously refined candidate shortlist.
          </p>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionTop}>
            <span style={styles.step}>01</span>
            <div>
              <h2 style={styles.sectionTitle}>
                Hiring Requirement
              </h2>
              <p style={styles.sectionDescription}>
                Describe the candidate you are looking for.
              </p>
            </div>
          </div>

          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Find a Data Engineer with Python and Spark experience..."
            rows={4}
            style={styles.textarea}
            disabled={frozen}
          />

          <button
            onClick={handleSearch}
            disabled={loading || frozen}
            style={styles.primaryButton}
          >
            {loading ? "Processing..." : "Search Candidates"}
            <span>→</span>
          </button>
        </section>

        {loading && (
          <div style={styles.loadingBox}>
            <span style={styles.loadingDot}>●</span>
            AI is analyzing requirements and scoring candidates...
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {filters && (
          <section style={styles.section}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>02</span>

              <div style={styles.flexOne}>
                <h2 style={styles.sectionTitle}>
                  Objective Filters
                </h2>
                <p style={styles.sectionDescription}>
                  Structured constraints generated by AI.
                </p>
              </div>

              <span style={styles.badge}>EDITABLE</span>
            </div>

            <label style={styles.label}>Skills</label>
            <input
              value={(filters.skills || []).join(", ")}
              onChange={(e) =>
                updateFilter(
                  "skills",
                  e.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                )
              }
              style={styles.input}
              disabled={frozen}
            />

            <label style={styles.label}>
              Minimum Experience (Years)
            </label>
            <input
              type="number"
              value={filters.min_years_experience ?? ""}
              onChange={(e) =>
                updateFilter(
                  "min_years_experience",
                  e.target.value === ""
                    ? null
                    : Number(e.target.value)
                )
              }
              style={styles.input}
              disabled={frozen}
            />

            <label style={styles.label}>Location</label>
            <input
              value={filters.location || ""}
              onChange={(e) =>
                updateFilter("location", e.target.value || null)
              }
              style={styles.input}
              disabled={frozen}
            />

            <label style={styles.label}>Education</label>
            <input
              value={filters.education || ""}
              onChange={(e) =>
                updateFilter("education", e.target.value || null)
              }
              style={styles.input}
              disabled={frozen}
            />
          </section>
        )}

        {rubric && (
          <section style={styles.section}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>03</span>

              <div>
                <h2 style={styles.sectionTitle}>
                  Subjective Rubric
                </h2>
                <p style={styles.sectionDescription}>
                  Qualitative criteria used for candidate scoring.
                </p>
              </div>
            </div>

            <label style={styles.label}>Criteria</label>
            <textarea
              value={(rubric.criteria || []).join("\n")}
              onChange={(e) =>
                updateRubric(
                  "criteria",
                  e.target.value.split("\n").filter(Boolean)
                )
              }
              rows={3}
              style={styles.textarea}
              disabled={frozen}
            />

            <label style={styles.label}>Priorities</label>
            <textarea
              value={(rubric.priorities || []).join("\n")}
              onChange={(e) =>
                updateRubric(
                  "priorities",
                  e.target.value.split("\n").filter(Boolean)
                )
              }
              rows={3}
              style={styles.textarea}
              disabled={frozen}
            />

            <label style={styles.label}>Deal Breakers</label>
            <textarea
              value={(rubric.deal_breakers || []).join("\n")}
              onChange={(e) =>
                updateRubric(
                  "deal_breakers",
                  e.target.value.split("\n").filter(Boolean)
                )
              }
              rows={3}
              style={styles.textarea}
              disabled={frozen}
            />
          </section>
        )}

        {filters && (
          <section style={styles.section}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>04</span>

              <div style={styles.flexOne}>
                <h2 style={styles.sectionTitle}>
                  Matching Profiles
                </h2>
                <p style={styles.sectionDescription}>
                  Candidates matching the objective filters.
                </p>
              </div>

              <span style={styles.badge}>
                {profiles.length} FOUND
              </span>
            </div>

            {profiles.length === 0 && (
              <div style={styles.emptyBox}>
                No profiles match the current filters.
              </div>
            )}

            {profiles.slice(0, 5).map((profile) => (
              <div key={profile.id} style={styles.profileCard}>
                <div style={styles.profileHeader}>
                  <div style={styles.avatar}>
                    {profile.name?.charAt(0) || "?"}
                  </div>

                  <div>
                    <h3 style={styles.profileName}>
                      {profile.name}
                    </h3>

                    <p style={styles.profileTitle}>
                      {profile.current_title}
                    </p>
                  </div>
                </div>

                <div style={styles.profileDetails}>
                  <span>
                    <strong>Experience:</strong>{" "}
                    {profile.years_experience} years
                  </span>

                  <span>
                    <strong>Location:</strong>{" "}
                    {profile.location}
                  </span>
                </div>

                <p>
                  <strong>Skills:</strong>{" "}
                  {(profile.skills || []).join(", ")}
                </p>

                <p style={styles.summary}>
                  {profile.summary}
                </p>

                <label style={styles.label}>
                  Recruiter Decision
                </label>

                <select
                  value={candidateFeedback[profile.id] || ""}
                  onChange={(e) =>
                    setCandidateFeedback({
                      ...candidateFeedback,
                      [profile.id]: e.target.value,
                    })
                  }
                  style={styles.input}
                  disabled={frozen}
                >
                  <option value="">Select feedback</option>
                  <option value="yes">Yes - Relevant</option>
                  <option value="no">No - Not Relevant</option>
                </select>
              </div>
            ))}
          </section>
        )}

        {rankedProfiles.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>05</span>

              <div style={styles.flexOne}>
                <h2 style={styles.sectionTitle}>
                  AI Ranked Shortlist
                </h2>
                <p style={styles.sectionDescription}>
                  Top candidates ranked with grounded explanations.
                </p>
              </div>

              <span style={styles.badge}>TOP 5</span>
            </div>

            {rankedProfiles.map((rankedProfile, index) => {
              const profile = getProfileDetails(rankedProfile.id);

              return (
                <div
                  key={rankedProfile.id}
                  style={styles.rankingCard}
                >
                  <div style={styles.rankNumber}>
                    #{index + 1}
                  </div>

                  <div style={styles.flexOne}>
                    <h3 style={styles.profileName}>
                      {profile
                        ? profile.name
                        : rankedProfile.id}
                    </h3>

                    {profile && (
                      <p style={styles.profileTitle}>
                        {profile.current_title}
                      </p>
                    )}

                    <div style={styles.score}>
                      Score: {rankedProfile.score}/100
                    </div>

                    <p style={styles.summary}>
                      {rankedProfile.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {filters && (
          <section style={styles.section}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>06</span>

              <div>
                <h2 style={styles.sectionTitle}>
                  Recruiter Refinement
                </h2>
                <p style={styles.sectionDescription}>
                  Provide feedback to update the search criteria.
                </p>
              </div>
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Example: Prioritize candidates with more than 5 years of experience and strong Python and Spark skills."
              rows={4}
              style={styles.textarea}
              disabled={frozen}
            />

            <div style={styles.buttonRow}>
              <button
                onClick={handleRefine}
                disabled={loading || frozen}
                style={styles.primaryButton}
              >
                {loading ? "Refining..." : "Refine and Rerun"}
                <span>↻</span>
              </button>

              <button
                onClick={() => setFrozen(true)}
                disabled={loading || frozen}
                style={styles.secondaryButton}
              >
                Freeze Shortlist
              </button>
            </div>
          </section>
        )}

        {changes.length > 0 && (
          <section style={styles.changeSection}>
            <div style={styles.sectionTop}>
              <span style={styles.step}>07</span>

              <div>
                <h2 style={styles.sectionTitle}>
                  What Changed and Why
                </h2>
                <p style={styles.sectionDescription}>
                  Changes applied after recruiter feedback.
                </p>
              </div>
            </div>

            <ul style={styles.changeList}>
              {changes.map((change, index) => (
                <li key={index} style={styles.changeItem}>
                  {change}
                </li>
              ))}
            </ul>

            {changeReason && (
              <p style={styles.reason}>
                <strong>Reason:</strong> {changeReason}
              </p>
            )}
          </section>
        )}

        {frozen && (
          <section style={styles.frozenBox}>
            <h2 style={styles.frozenTitle}>
              ✓ Final Shortlist Frozen
            </h2>

            <p>
              Filters, rubric, and shortlist are now locked.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    padding: "30px 16px",
  },

  container: {
    maxWidth: "950px",
    margin: "0 auto",
    color: "#172033",
  },

  header: {
    textAlign: "center",
    marginBottom: "36px",
  },

  logo: {
    width: "46px",
    height: "46px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "16px",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    color: "#64748b",
    marginBottom: "14px",
  },

  title: {
    fontSize: "clamp(34px, 6vw, 58px)",
    lineHeight: "1.1",
    letterSpacing: "-2px",
    margin: "0",
    color: "#111827",
  },

  titleAccent: {
    color: "#2563eb",
  },

  subtitle: {
    maxWidth: "570px",
    margin: "20px auto 0",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.7",
  },

  section: {
    marginTop: "22px",
    padding: "26px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },

  changeSection: {
    marginTop: "22px",
    padding: "26px",
    border: "1px solid #bfdbfe",
    borderRadius: "18px",
    background: "#eff6ff",
    color: "#172033",
  },

  sectionTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "22px",
  },

  step: {
    minWidth: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "bold",
  },

  flexOne: {
    flex: 1,
  },

  sectionTitle: {
    margin: "0",
    fontSize: "21px",
    color: "#111827",
  },

  sectionDescription: {
    margin: "5px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#e0e7ff",
    color: "#3730a3",
    fontSize: "10px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#334155",
  },

  textarea: {
    width: "100%",
    padding: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "15px",
    lineHeight: "1.6",
    boxSizing: "border-box",
    resize: "vertical",
    outlineColor: "#2563eb",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    padding: "13px 20px",
    marginTop: "16px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "13px 20px",
    marginTop: "16px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  loadingBox: {
    marginTop: "22px",
    padding: "15px",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "14px",
  },

  loadingDot: {
    marginRight: "8px",
  },

  errorBox: {
    marginTop: "22px",
    padding: "15px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
  },

  emptyBox: {
    padding: "18px",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#64748b",
  },

  profileCard: {
    marginTop: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#f8fafc",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    fontWeight: "bold",
  },

  profileName: {
    margin: "0",
    fontSize: "17px",
    color: "#111827",
  },

  profileTitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  profileDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    marginTop: "16px",
    fontSize: "13px",
    color: "#475569",
  },

  summary: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  rankingCard: {
    display: "flex",
    gap: "16px",
    marginTop: "16px",
    padding: "20px",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    background: "#f8fbff",
  },

  rankNumber: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#2563eb",
  },

  score: {
    display: "inline-block",
    marginTop: "12px",
    padding: "6px 10px",
    borderRadius: "7px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "bold",
  },

  changeList: {
    paddingLeft: "22px",
    color: "#1e40af",
  },

  changeItem: {
    marginBottom: "9px",
    lineHeight: "1.5",
  },

  reason: {
    color: "#1e3a8a",
    lineHeight: "1.6",
  },

  frozenBox: {
    marginTop: "22px",
    padding: "26px",
    borderRadius: "16px",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
  },

  frozenTitle: {
    marginTop: "0",
    color: "#065f46",
  },
};

export default App;