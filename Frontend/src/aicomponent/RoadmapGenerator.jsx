import { useState, useContext } from "react";
import { apiContext } from "../ApiContext";
import "./RoadmapGenerator.css";

export function RoadmapGenerator() {
  const { api } = useContext(apiContext);
  const [targetRole, setTargetRole] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setLoading(true);
    setError("");
    setRoadmap(null);

    try {
      const res = await api.post("ai/roadmap", { targetRole });
      if (res.data.success) {
        setRoadmap(res.data.roadmap);
      } else {
        setError(res.data.error || "Failed to generate roadmap");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to generate roadmap. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <h2>Learning Roadmap Generator</h2>
        <p>
          Enter your target role and we'll generate a personalized learning
          roadmap based on your skills
        </p>
      </div>

      <form className="roadmap-form" onSubmit={handleGenerate}>
        <input
          className="roadmap-input"
          type="text"
          placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          disabled={loading}
        />
        <button
          className="roadmap-generate-btn"
          type="submit"
          disabled={loading || !targetRole.trim()}
        >
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
      </form>

      {error && <p className="roadmap-error">{error}</p>}

      {loading && (
        <div className="roadmap-loading">
          <div className="roadmap-spinner" />
          <p>Generating your personalized roadmap...</p>
        </div>
      )}

      {roadmap && !loading && (
        <div className="roadmap-result">
          <div className="roadmap-result-header">
            <h3>{roadmap.title}</h3>
            <span className="roadmap-estimated-time">
              {roadmap.estimatedTime}
            </span>
          </div>

          {roadmap.phases.map((phase) => (
            <div key={phase.phase} className="roadmap-phase-card">
              <div className="roadmap-phase-header">
                <span className="roadmap-phase-number">
                  Phase {phase.phase}
                </span>
                <h4 className="roadmap-phase-title">{phase.title}</h4>
                <span className="roadmap-phase-duration">
                  {phase.duration}
                </span>
              </div>

              <div className="roadmap-phase-section">
                <h5>Topics</h5>
                <div className="roadmap-topics">
                  {phase.topics.map((topic, i) => (
                    <span key={i} className="roadmap-topic-tag">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="roadmap-phase-section">
                <h5>Resources</h5>
                <ul className="roadmap-resources">
                  {phase.resources.map((resource, i) => (
                    <li key={i}>{resource}</li>
                  ))}
                </ul>
              </div>

              <div className="roadmap-phase-section">
                <h5>Milestone</h5>
                <p className="roadmap-milestone">{phase.milestone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}