import { useContext, useEffect, useState } from "react";
import { apiContext } from "../ApiContext";

export function MyMentorSessions() {
  const { api } = useContext(apiContext);
  const [sessions, setSessions] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    async function fetchMySessions() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/mentors/sessions/me");
        setSessions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError("Failed to load mentor sessions.");
      } finally {
        setLoading(false);
      }
    }

    fetchMySessions();
  }, []);

  function updateReviewForm(sessionId, key, value) {
    setReviewForms((prev) => ({
      ...prev,
      [sessionId]: {
        rating: 5,
        text: "",
        ...(prev[sessionId] || {}),
        [key]: value
      }
    }));
  }

  async function handleReviewSubmit(sessionId) {
    setReviewMessage("");

    if (!window.confirm("Are you sure you want to submit this review? This cannot be undone.")) return;

    const form = reviewForms[sessionId] || { rating: 5, text: "" };

    try {
      const res = await api.post(`/mentors/sessions/${sessionId}/review`, {
        rating: Number(form.rating),
        text: form.text
      });
      setSessions((prev) => prev.map((session) => (session._id === sessionId ? res.data.session : session)));
      setReviewMessage("Review submitted.");
    } catch (err) {
      setReviewMessage(err.response?.data?.error || "Failed to submit review.");
    }
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>My Mentor Sessions</h2>

      {loading ? <p>Loading mentor sessions...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {!loading && reviewMessage ? <p>{reviewMessage}</p> : null}
      {!loading && !error && sessions.length === 0 ? <p>No mentor sessions yet.</p> : null}

      {!loading &&
        !error &&
        sessions.map((session) => {
          const canReview =
            session.bookingStatus === "booked" &&
            session.paymentStatus === "paid" &&
            session.attendanceStatus === "attended" &&
            !session.reviewSubmittedAt;
          const form = reviewForms[session._id] || { rating: 5, text: "" };

          return (
            <div key={session._id} style={cardStyle}>
              <h4>{session.mentorName || "Mentor"}</h4>
              <p>{session.packageTitleSnapshot || session.topic || "Mentor session"}</p>
              {session.packageDescriptionSnapshot ? <p>{session.packageDescriptionSnapshot}</p> : null}
              <p>{session.packageDurationMinutesSnapshot || 0} min</p>
              <p>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "No scheduled time"}</p>
              <p>Booking: {session.bookingStatus || "booked"}</p>
              <p>Payment: {session.paymentStatus || "pending"}</p>
              <p>
                Paid: {((session.packagePriceCentsSnapshot || session.amountCents || 0) / 100).toFixed(2)}{" "}
                {String(session.currencySnapshot || session.currency || "usd").toUpperCase()}
              </p>
              <p>Attendance: {session.attendanceStatus || "pending"}</p>
              {session.notes ? <p>Mentor notes: {session.notes}</p> : null}

              {session.reviewSubmittedAt ? (
                <div style={reviewBoxStyle}>
                  <strong>Your review</strong>
                  <p style={starTextStyle}>{renderStars(session.reviewRating)}</p>
                  {session.reviewText ? <p>{session.reviewText}</p> : <p>No written review.</p>}
                </div>
              ) : null}

              {canReview ? (
                <div style={reviewBoxStyle}>
                  <strong>Leave a review</strong>
                  <div style={starButtonRowStyle}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateReviewForm(session._id, "rating", rating)}
                        style={rating <= form.rating ? activeStarButtonStyle : starButtonStyle}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Optional review"
                    value={form.text}
                    onChange={(e) => updateReviewForm(session._id, "text", e.target.value)}
                    style={textareaStyle}
                  />
                  <button type="button" onClick={() => handleReviewSubmit(session._id)} style={buttonStyle}>
                    Submit Review
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

const cardStyle = {
  background: "#2c2c2c",
  padding: "14px",
  marginBottom: "10px",
  borderRadius: "8px"
};

const reviewBoxStyle = {
  background: "#1f2430",
  border: "1px solid #3a4558",
  borderRadius: "8px",
  display: "grid",
  gap: "8px",
  marginTop: "12px",
  padding: "12px"
};

const starButtonRowStyle = {
  display: "flex",
  gap: "4px"
};

const starButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#6f7d92",
  cursor: "pointer",
  fontSize: "24px",
  padding: "0 2px"
};

const activeStarButtonStyle = {
  ...starButtonStyle,
  color: "#f7c948"
};

const starTextStyle = {
  color: "#f7c948",
  fontSize: "18px",
  margin: 0
};

const textareaStyle = {
  background: "#1e1e1e",
  border: "1px solid #444",
  color: "white",
  padding: "8px"
};

const buttonStyle = {
  background: "#00bcd4",
  border: "none",
  color: "white",
  cursor: "pointer",
  padding: "8px 12px"
};

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}
