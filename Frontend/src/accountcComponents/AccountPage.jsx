import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";
import { authContext } from "../AuthContext";
import { SkillTagInput } from "../components/SkillTagInput";
import "./AccountPage.css";

export function AccountPage() {
  const { api } = useContext(apiContext);
  const { username } = useContext(authContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAchievements, setEditAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [error, setError] = useState("");
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [streak, setStreak] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("account/profile");
        setProfile(res.data);
        setEditBio(res.data.bio);
        setEditAchievements(res.data.achievements ?? []);

        const existingSkills = res.data.skillsWanted ?? [];
        setSkillsWanted(existingSkills.map(s => s._id || s));

        try {
          const streakRes = await api.get("api/streak");
          setStreak(streakRes.data);
        } catch {
          setStreak(null);
        }

      } catch (e) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("account/profile", {
        bio: editBio,
        achievements: editAchievements,
      });

      await api.put("api/skills/save", { skillsWanted });

      const refreshed = await api.get("account/profile");
      setProfile(refreshed.data);

      const refreshedSkills = refreshed.data.skillsWanted ?? [];
      setSkillsWanted(refreshedSkills.map(s => s._id || s));

      setEditing(false);
    } catch (e) {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditBio(profile.bio);
    setEditAchievements(profile.achievements ?? []);
    setNewAchievement("");
    const existingSkills = profile.skillsWanted ?? [];
    setSkillsWanted(existingSkills.map(s => s._id || s));
    setEditing(false);
  };

  const addAchievement = () => {
    const trimmed = newAchievement.trim();
    if (!trimmed) return;
    setEditAchievements((prev) => [...prev, trimmed]);
    setNewAchievement("");
  };

  const removeAchievement = (index) => {
    setEditAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePictureClick = () => {
    if (editing) fileInputRef.current?.click();
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const res = await api.postFormData("account/profile/picture", formData);
      setProfile((prev) => ({ ...prev, profilePicture: res.data.profilePicture }));
    } catch (e) {
      setError("Failed to upload picture.");
    } finally {
      setUploadingPic(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-loading">Loading profile...</div>
      </div>
    );
  }

  const pictureUrl = profile?.profilePicture
    ? `http://localhost:5000${profile.profilePicture}`
    : null;

  return (
    <div className="account-page">
      <div className="account-header">
        <button className="account-back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h2>My Account</h2>
      </div>

      <div className="account-card">
        <div className="account-picture-section">
          <div
            className={`account-avatar ${editing ? "account-avatar-editable" : ""}`}
            onClick={handlePictureClick}
            title={editing ? "Click to change picture" : ""}
          >
            {uploadingPic ? (
              <div className="account-avatar-spinner" />
            ) : pictureUrl ? (
              <img src={pictureUrl} alt="Profile" />
            ) : (
              <div className="account-avatar-placeholder">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            {editing && <div className="account-avatar-overlay">Change</div>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePictureChange}
          />
          <h3 className="account-username">@{profile?.username}</h3>
        </div>

        {error && <p className="account-error">{error}</p>}

        <div className="account-section">
          <div className="account-section-header">
            <h4>Bio</h4>
          </div>
          {editing ? (
            <textarea
              className="account-bio-input"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Write something about yourself..."
              rows={4}
            />
          ) : (
            <p className="account-bio-text">
              {profile?.bio || <span className="account-empty">No bio yet.</span>}
            </p>
          )}
        </div>

        <div className="account-section">
          <div className="account-section-header">
            <h4>Skills I want to learn</h4>
          </div>
          {editing ? (
            <SkillTagInput
              selected={skillsWanted}
              onChange={setSkillsWanted}
              placeholder="Pick skills you want to learn"
            />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(profile?.skillsWanted ?? []).length === 0 ? (
                <span className="account-empty">No skills selected yet.</span>
              ) : (
                (profile?.skillsWanted ?? []).map(skill => (
                  <span
                    key={skill._id || skill}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "12px",
                      background: "#00bcd4",
                      color: "#000",
                      fontSize: "12px"
                    }}
                  >
                    {skill.name || skill}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        {!editing && streak !== null && (
          <div className="account-section">
            <div className="account-section-header">
              <h4>Learning Streak</h4>
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "12px",
                padding: "16px 24px",
                minWidth: "100px"
              }}>
                <span style={{ fontSize: "36px", fontWeight: 700, color: "#00bcd4" }}>
                  {streak.currentStreak}
                </span>
                <span style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  day streak
                </span>
                <span style={{ fontSize: "20px", marginTop: "4px" }}>
                  {streak.currentStreak >= 7 ? "🔥" : streak.currentStreak >= 3 ? "⚡" : "📅"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#aaa" }}>
                  Sessions attended:{" "}
                  <span style={{ color: "white", fontWeight: 600 }}>
                    {streak.totalSessionsAttended}
                  </span>
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                  {streak.currentStreak === 0
                    ? "Attend a past session to start your streak!"
                    : "Keep it up! Don't miss the next session."}
                </p>
                {streak.attendanceDates?.length > 0 && (
                  <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                    Last attended: {streak.attendanceDates[streak.attendanceDates.length - 1]}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="account-section">
          <div className="account-section-header">
            <h4>Achievements</h4>
          </div>
          <ul className="account-achievements-list">
            {(editing ? editAchievements : profile?.achievements ?? []).map(
              (a, i) => (
                <li key={i} className="account-achievement-item">
                  <span>{a}</span>
                  {editing && (
                    <button
                      className="account-remove-btn"
                      onClick={() => removeAchievement(i)}
                    >
                      ✕
                    </button>
                  )}
                </li>
              )
            )}
            {(editing ? editAchievements : profile?.achievements ?? []).length === 0 && (
              <li className="account-empty">No achievements yet.</li>
            )}
          </ul>
          {editing && (
            <div className="account-add-achievement">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAchievement()}
                placeholder="Add an achievement..."
                className="account-achievement-input"
              />
              <button className="account-add-btn" onClick={addAchievement}>
                Add
              </button>
            </div>
          )}
        </div>

        <div className="account-actions">
          {editing ? (
            <>
              <button
                className="account-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button className="account-cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="account-inbox-btn" onClick={() => navigate("/inbox")}>
                Inbox
              </button>
              <button className="account-edit-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}