import { useContext, useEffect, useState } from "react";
import { apiContext } from "../ApiContext";

export function MentorProfileEditor({ onSaved } = {}) {
  const { api } = useContext(apiContext);
  const [form, setForm] = useState({
    bio: "",
    expertiseTagsText: "",
    yearsOfExperience: 0,
    hourlyRate: 0
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyMentorProfile() {
      setLoading(true);
      setStatus("");
      try {
        const res = await api.get("/mentors/profile/me");
        const profile = res.data.profile;
        setForm({
          bio: profile.bio || "",
          expertiseTagsText: (profile.expertiseTags || []).join(", "),
          yearsOfExperience: profile.yearsOfExperience || 0,
          hourlyRate: profile.hourlyRate || 0
        });
      } catch (e) {
        if (e.response?.status === 404) {
          setStatus("No mentor profile yet. Fill the form to create one.");
        } else if (e.response?.status === 403) {
          setStatus("Only users with userType mentor can edit mentor profile.");
        } else {
          setStatus("Could not load mentor profile.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadMyMentorProfile();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      const expertiseTags = form.expertiseTagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const res = await api.put("/mentors/profile/me", {
        bio: form.bio,
        expertiseTags,
        yearsOfExperience: Number(form.yearsOfExperience),
        hourlyRate: Number(form.hourlyRate)
      });
      onSaved?.(res.data);
      setStatus("Mentor profile saved.");
    } catch (e2) {
      setStatus(e2.response?.data?.error || "Failed to save mentor profile.");
    }
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Edit Mentor Profile</h2>
      {loading ? <p>Loading...</p> : null}
      {status ? <p>{status}</p> : null}

      <form onSubmit={handleSubmit} style={formStyle}>
        <textarea
          rows={5}
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Expertise tags (comma separated)"
          value={form.expertiseTagsText}
          onChange={(e) => setForm({ ...form, expertiseTagsText: e.target.value })}
          style={inputStyle}
        />
        <label style={fieldLabelStyle}>
          Years of Experience
          <input
            type="number"
            placeholder="Years of Experience"
            value={form.yearsOfExperience}
            onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
            style={inputStyle}
          />
        </label>
        <button style={buttonStyle} type="submit">
          Save Profile
        </button>
      </form>
    </div>
  );
}

const formStyle = {
  background: "#1a1f29",
  border: "1px solid #2c3340",
  borderRadius: "12px",
  display: "grid",
  gap: "12px",
  maxWidth: "600px",
  padding: "16px"
};

const fieldLabelStyle = {
  color: "#cbd6ea",
  display: "grid",
  gap: "6px",
  fontSize: "0.95rem",
  fontWeight: 600
};

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
