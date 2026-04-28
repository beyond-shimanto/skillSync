import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiContext } from "../ApiContext";

export function MentorProfileView() {
  const { mentorUserId } = useParams();
  const { api } = useContext(apiContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [packages, setPackages] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    mentorPackageId: "",
    scheduledAt: ""
  });
  const [bookingStatus, setBookingStatus] = useState("");

  useEffect(() => {
    async function fetchMentorProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/mentors/${mentorUserId}`);
        setData(res.data);
        const packagesRes = await api.get(`/mentors/${mentorUserId}/packages`);
        const availablePackages = Array.isArray(packagesRes.data) ? packagesRes.data : [];
        setPackages(availablePackages);
        setBookingForm((prev) => ({
          ...prev,
          mentorPackageId: availablePackages[0]?._id || ""
        }));
      } catch {
        setError("Failed to load mentor profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchMentorProfile();
  }, [mentorUserId]);

  async function handleBookSession(e) {
    e.preventDefault();
    setBookingStatus("");

    try {
      const res = await api.post("/mentors/sessions/book", {
        mentorPackageId: bookingForm.mentorPackageId,
        scheduledAt: bookingForm.scheduledAt || undefined
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setBookingStatus("Stripe checkout could not be started.");
    } catch (err) {
      setBookingStatus(err.response?.data?.error || "Failed to book session.");
    }
  }

  if (loading) return <div style={{ padding: "20px", color: "white" }}>Loading profile...</div>;
  if (error) return <div style={{ padding: "20px", color: "white" }}>{error}</div>;
  if (!data?.profile) return <div style={{ padding: "20px", color: "white" }}>Profile not found.</div>;

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={avatarStyle}>{(data.username || "M").slice(0, 1).toUpperCase()}</div>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>{data.username}</h2>
          <p style={{ margin: "0 0 10px", color: "#b9c6dd" }}>{data.profile.bio || "No bio yet."}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={metricStyle}>{data.profile.yearsOfExperience || 0} years</span>
            <span style={metricStyle}>{Number(data.profile.averageRating || 0).toFixed(1)} rating</span>
            <span style={metricStyle}>{data.profile.reviewCount || 0} reviews</span>
          </div>
        </div>
      </div>

      <section style={sectionStyle}>
        <h3>Expertise</h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(data.profile.expertiseTags || []).length === 0 ? <p>No expertise tags yet.</p> : null}
          {(data.profile.expertiseTags || []).map((tag) => (
            <span key={tag} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3>Recent Reviews</h3>
        {(data.recentReviews || []).length === 0 ? <p>No reviews yet.</p> : null}
        <div style={reviewGridStyle}>
          {(data.recentReviews || []).map((review) => (
            <div key={review.id} style={reviewCardStyle}>
              <strong>{review.learnerName || "Student"}</strong>
              <span style={reviewStarsStyle}>{renderStars(review.rating)}</span>
              <span>{review.packageTitle || "Mentor session"}</span>
              {review.comment ? <p style={{ margin: 0 }}>{review.comment}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <div style={bookingCardStyle}>
        <h3>Book a Package</h3>
        {packages.length === 0 ? <p>No packages available yet.</p> : null}
        {bookingStatus ? <p>{bookingStatus}</p> : null}
        <div style={packageGridStyle}>
          {packages.map((pkg) => (
            <label key={pkg._id} style={bookingForm.mentorPackageId === pkg._id ? selectedPackageStyle : packageCardStyle}>
              <input
                checked={bookingForm.mentorPackageId === pkg._id}
                name="mentorPackage"
                onChange={() => setBookingForm({ ...bookingForm, mentorPackageId: pkg._id })}
                type="radio"
                value={pkg._id}
              />
              <strong>{pkg.title}</strong>
              <span>{pkg.description || "Mentorship session"}</span>
              <span>{pkg.durationMinutes} min</span>
              <span>
                {(pkg.priceCents / 100).toFixed(2)} {String(pkg.currency || "usd").toUpperCase()}
              </span>
            </label>
          ))}
        </div>
        <form onSubmit={handleBookSession} style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
          <input
            type="datetime-local"
            value={bookingForm.scheduledAt}
            onChange={(e) => setBookingForm({ ...bookingForm, scheduledAt: e.target.value })}
            style={inputStyle}
          />
          <button disabled={packages.length === 0} style={buttonStyle} type="submit">
            Continue to Stripe Checkout
          </button>
        </form>
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

const pageStyle = {
  padding: "20px",
  color: "white"
};

const heroStyle = {
  background: "linear-gradient(135deg, #202633, #151922)",
  border: "1px solid #30394a",
  borderRadius: "8px",
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "90px 1fr",
  marginBottom: "16px",
  padding: "18px"
};

const avatarStyle = {
  alignItems: "center",
  background: "#1f6feb",
  borderRadius: "50%",
  display: "flex",
  fontSize: "2rem",
  fontWeight: 700,
  height: "80px",
  justifyContent: "center",
  width: "80px"
};

const metricStyle = {
  background: "#293349",
  border: "1px solid #415173",
  borderRadius: "999px",
  color: "#b9d3ff",
  padding: "5px 10px"
};

const sectionStyle = {
  marginBottom: "16px"
};

const reviewGridStyle = {
  display: "grid",
  gap: "10px",
  maxWidth: "620px"
};

const reviewCardStyle = {
  background: "#202633",
  border: "1px solid #30394a",
  borderRadius: "8px",
  display: "grid",
  gap: "6px",
  padding: "12px"
};

const reviewStarsStyle = {
  color: "#f7c948"
};

const bookingCardStyle = {
  background: "#2c2c2c",
  padding: "14px",
  marginTop: "18px",
  borderRadius: "8px",
  maxWidth: "520px"
};

const packageGridStyle = {
  display: "grid",
  gap: "10px"
};

const packageCardStyle = {
  border: "1px solid #444",
  borderRadius: "8px",
  cursor: "pointer",
  display: "grid",
  gap: "5px",
  padding: "10px"
};

const selectedPackageStyle = {
  ...packageCardStyle,
  border: "1px solid #00bcd4",
  background: "#18313a"
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

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}
