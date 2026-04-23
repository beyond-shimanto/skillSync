import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";
import { authContext } from "../AuthContext";
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/account/profile");
        setProfile(res.data);
        setEditBio(res.data.bio);
        setEditAchievements(res.data.achievements ?? []);
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
      const res = await api.put("/account/profile", {
        bio: editBio,
        achievements: editAchievements,
      });
      setProfile(res.data);
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
      const res = await api.postFormData("/account/profile/picture", formData);
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
            {(editing ? editAchievements : profile?.achievements ?? []).length ===
              0 && (
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
            <button className="account-edit-btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
