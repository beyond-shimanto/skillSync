import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";

export function MentorDirectory() {
  const { api } = useContext(apiContext);
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allSkills, setAllSkills] = useState([]);   // for the skill dropdown
  const [filters, setFilters] = useState({
    tag: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    sortBy: "experience",
    sortOrder: "desc",
    skill: ""
  });

  useEffect(() => {
    api.get("api/skills")
      .then(res => setAllSkills(res.data))
      .catch(() => {});
  }, []);

  async function fetchMentors(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (currentFilters.tag.trim()) params.tag = currentFilters.tag.trim();
      if (currentFilters.minPrice !== "") params.minPrice = currentFilters.minPrice;
      if (currentFilters.maxPrice !== "") params.maxPrice = currentFilters.maxPrice;
      if (currentFilters.minRating !== "") params.minRating = currentFilters.minRating;
      if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;
      if (currentFilters.sortOrder) params.sortOrder = currentFilters.sortOrder;
      if (currentFilters.skill) params.skill = currentFilters.skill;   // new

      const res = await api.get("/mentors", params);
      setMentors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load mentors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMentors();
  }, []);

  async function handleMessageMentor(mentorUserId) {
    try {
      const res = await api.post("/direct-messages/start-or-get-conversation", { otherUserId: mentorUserId });
      navigate(`/direct-messages/${res.data.conversationId}`);
    } catch {
      // silently fail
    }
  }

  function handleFilterChange(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Find Mentors</h2>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <input
          placeholder="Skill tag (e.g. react)"
          value={filters.tag}
          onChange={(e) => handleFilterChange("tag", e.target.value)}
          style={inputStyle}
        />

        <select
          value={filters.skill}
          onChange={(e) => handleFilterChange("skill", e.target.value)}
          style={inputStyle}
        >
          <option value="">Filter by skill</option>
          {allSkills.map(skill => (
            <option key={skill._id} value={skill._id}>{skill.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          min="0"
          max="5"
          step="0.1"
          placeholder="Min rating"
          value={filters.minRating}
          onChange={(e) => handleFilterChange("minRating", e.target.value)}
          style={inputStyle}
        />

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          style={inputStyle}
        >
          <option value="experience">Sort: Experience</option>
          <option value="price">Sort: Price</option>
          <option value="rating">Sort: Rating</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
          style={inputStyle}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <button style={buttonStyle} onClick={() => fetchMentors()}>
          Search
        </button>
      </div>

      {loading && <p>Loading mentors...</p>}
      {!loading && error && <p>{error}</p>}
      {!loading && !error && mentors.length === 0 && <p>No mentors found.</p>}

      {!loading &&
        !error &&
        mentors.map((mentor) => (
          <div key={mentor.mentorUserId} style={cardStyle}>
            <h4>{mentor.username}</h4>
            <p>{mentor.bio || "No bio yet."}</p>
            <p>
              Experience: {mentor.yearsOfExperience || 0} years | Price: ${mentor.hourlyRate || 0}/hr
            </p>
            <p>Rating: {mentor.averageRating || 0} ({mentor.reviewCount || 0} reviews)</p>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
              {(mentor.expertiseTags || []).map((tag) => (
                <span key={`${mentor.mentorUserId}-${tag}`} style={tagStyle}>
                  {tag}
                </span>
              ))}
            </div>

            {(mentor.expertise || []).length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {mentor.expertise.map((skill) => (
                  <span
                    key={skill._id || skill}
                    style={{ ...tagStyle, background: "#00bcd4", color: "#000" }}
                  >
                    {skill.name || skill}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" }}>
              <Link to={`/mentors/${mentor.mentorUserId}`} style={{ color: "#7fd1ff" }}>
                View Profile
              </Link>
              <button
                style={messageButtonStyle}
                onClick={() => handleMessageMentor(mentor.mentorUserId)}
              >
                Message
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  background: "#1e1e1e",
  border: "1px solid #444",
  color: "white"
};

const buttonStyle = {
  padding: "8px 12px",
  background: "#00bcd4",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const cardStyle = {
  background: "#2c2c2c",
  padding: "14px",
  marginBottom: "10px",
  borderRadius: "8px"
};

const tagStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  background: "#444",
  fontSize: "12px"
};

const messageButtonStyle = {
  padding: "5px 12px",
  background: "#00bcd4",
  border: "none",
  color: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px"
};