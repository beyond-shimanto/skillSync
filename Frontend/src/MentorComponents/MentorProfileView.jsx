import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiContext } from "../ApiContext";
import { authContext } from "../AuthContext";

export function MentorProfileView() {
  const { mentorUserId } = useParams();
  const { api } = useContext(apiContext);
  const { userId: currentUserId } = useContext(authContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [userType, setUserType] = useState("");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        // Fetch mentor profile
        const res = await api.get(`mentors/${mentorUserId}`);
        setData(res.data);

        // Fetch current user type
        const profileRes = await api.get("get-profile-info");
        setUserType(profileRes.data.userType ?? "");

        // Checking if already bookmarked (only for students)
        if (profileRes.data.userType === "student") {
          const checkRes = await api.get(`api/bookmarks/check/mentor/${mentorUserId}`);
          setBookmarked(checkRes.data.bookmarked);
          setBookmarkId(checkRes.data.bookmarkId);
        }
      } catch (e) {
        setError("Failed to load mentor profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [mentorUserId]);

  async function handleBookmark() {
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`api/bookmarks/${bookmarkId}`);
        setBookmarked(false);
        setBookmarkId(null);
      } else {
        const res = await api.post("api/bookmarks/mentor", {
          mentorUserId,
          mentorUsername: data.username
        });
        setBookmarked(true);
        setBookmarkId(res.data.bookmark._id);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setBookmarkLoading(false);
    }
  }

  if (loading) return <div style={{ padding: "20px", color: "white" }}>Loading profile...</div>;
  if (error) return <div style={{ padding: "20px", color: "white" }}>{error}</div>;
  if (!data?.profile) return <div style={{ padding: "20px", color: "white" }}>Profile not found.</div>;

  const isOwnProfile = String(mentorUserId) === String(currentUserId);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h2>{data.username}</h2>

        {/* Show bookmark button only for students viewing someone else's profile */}
        {userType === "student" && !isOwnProfile && (
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            style={{
              padding: "8px 16px",
              background: bookmarked ? "#444" : "#00bcd4",
              color: bookmarked ? "#ccc" : "#000",
              border: "none",
              borderRadius: "8px",
              cursor: bookmarkLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "13px",
              opacity: bookmarkLoading ? 0.6 : 1
            }}
          >
            {bookmarkLoading ? "..." : bookmarked ? "★ Bookmarked" : "☆ Bookmark Mentor"}
          </button>
        )}
      </div>

      <p>{data.profile.bio || "No bio yet."}</p>
      <p>Experience: {data.profile.yearsOfExperience || 0} years</p>
      <p>Pricing: ${data.profile.hourlyRate || 0} per hour</p>
      <p>
        Rating: {data.profile.averageRating || 0} ({data.profile.reviewCount || 0} reviews)
      </p>
      <h4>Expertise</h4>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(data.profile.expertiseTags || []).map((tag) => (
          <span key={tag} style={tagStyle}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const tagStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  background: "#444",
  fontSize: "12px"
};
