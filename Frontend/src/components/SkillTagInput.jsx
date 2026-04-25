import { useState, useEffect, useContext } from "react";
import { apiContext } from "../ApiContext";

export function SkillTagInput({ selected = [], onChange, placeholder = "Select skills" }) {
  const { api } = useContext(apiContext);
  const [allSkills, setAllSkills] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("api/skills")
      .then(res => setAllSkills(res.data))
      .catch(err => console.error("Could not load skills", err));
  }, []);

  function toggleSkill(skillId) {
    if (selected.includes(skillId)) {
      onChange(selected.filter(id => id !== skillId));
    } else {
      onChange([...selected, skillId]);
    }
  }

  const filtered = allSkills.filter(skill =>
    skill.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ color: "white", fontWeight: 500, marginBottom: "6px" }}>{placeholder}</p>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search skills..."
        style={{
          width: "100%",
          padding: "6px 8px",
          marginBottom: "8px",
          background: "#1e1e1e",
          border: "1px solid #444",
          color: "white",
          borderRadius: "4px",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {filtered.map(skill => {
          const isSelected = selected.includes(skill._id);
          return (
            <button
              key={skill._id}
              type="button"
              onClick={() => toggleSkill(skill._id)}
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "13px",
                backgroundColor: isSelected ? "#00bcd4" : "#1e1e1e",
                color: isSelected ? "#000" : "#ccc",
                borderColor: isSelected ? "#00bcd4" : "#555",
                transition: "all 0.15s",
              }}
            >
              {skill.name}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p style={{ fontSize: "12px", color: "#aaa", marginTop: "6px" }}>
          {selected.length} skill{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}