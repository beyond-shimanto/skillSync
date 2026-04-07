import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiContext } from "../ApiContext";

export function MentorProfileView() {
  const { mentorUserId } = useParams();
  const { api } = useContext(apiContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMentorProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/mentors/${mentorUserId}`);
        setData(res.data);
      } catch (e) {
        setError("Failed to load mentor profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchMentorProfile();
  }, [mentorUserId]);

  if (loading) return <div style={{ padding: "20px", color: "white" }}>Loading profile...</div>;
  if (error) return <div style={{ padding: "20px", color: "white" }}>{error}</div>;
  if (!data?.profile) return <div style={{ padding: "20px", color: "white" }}>Profile not found.</div>;

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>{data.username}</h2>
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
