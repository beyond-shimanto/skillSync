import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";
import "./BookmarksPage.css";

export function BookmarksPage() {
  const { api } = useContext(apiContext);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("api/bookmarks");
      setBookmarks(res.data);
    } catch (err) {
      setError("Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(bookmarkId) {
    try {
      await api.delete(`api/bookmarks/${bookmarkId}`);
      setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  }

  const filtered = bookmarks.filter(b => {
    if (activeTab === "all") return true;
    return b.type === activeTab;
  });

  const mentorCount = bookmarks.filter(b => b.type === "mentor").length;
  const resourceCount = bookmarks.filter(b => b.type === "resource").length;

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h2>My Bookmarks</h2>
        <p>Your saved mentors and resources</p>
      </div>

      <div className="bookmarks-tabs">
        <button
          className={`bookmarks-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({bookmarks.length})
        </button>
        <button
          className={`bookmarks-tab ${activeTab === "mentor" ? "active" : ""}`}
          onClick={() => setActiveTab("mentor")}
        >
          Mentors ({mentorCount})
        </button>
        <button
          className={`bookmarks-tab ${activeTab === "resource" ? "active" : ""}`}
          onClick={() => setActiveTab("resource")}
        >
          Resources ({resourceCount})
        </button>
      </div>

      {loading && <p className="bookmarks-loading">Loading bookmarks...</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="bookmarks-empty">
          {activeTab === "all"
            ? "You haven't bookmarked anything yet."
            : activeTab === "mentor"
            ? "No bookmarked mentors yet. Browse the Mentor Directory to save mentors."
            : "No bookmarked resources yet. Open a study group and bookmark resources."}
        </p>
      )}

      {!loading && !error && (
        <div className="bookmarks-list">
          {filtered.map(bookmark => (
            <div key={bookmark._id} className="bookmark-card">
              <div className="bookmark-card-info">
                <h4>
                  {bookmark.type === "mentor"
                    ? bookmark.mentorUsername || "Mentor"
                    : bookmark.resourceTitle || "Resource"}
                  <span className={`bookmark-type-badge bookmark-type-${bookmark.type}`}>
                    {bookmark.type}
                  </span>
                </h4>
                <p>
                  {bookmark.type === "mentor"
                    ? "Saved mentor profile"
                    : "Saved study group resource"}
                </p>
              </div>

              <div className="bookmark-actions">
                {bookmark.type === "mentor" && (
                  <button
                    className="bookmark-view-btn"
                    onClick={() => navigate(`/mentors/${bookmark.mentorUserId}`)}
                  >
                    View Profile
                  </button>
                )}
                {bookmark.type === "resource" && bookmark.resourceGroupId && (
                  <button
                    className="bookmark-view-btn"
                    onClick={() => navigate(`/study-groups/view-group/${bookmark.resourceGroupId}`)}
                  >
                    Go to Group
                  </button>
                )}
                <button
                  className="bookmark-remove-btn"
                  onClick={() => handleRemove(bookmark._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}