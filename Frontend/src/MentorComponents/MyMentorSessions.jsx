import { useContext, useEffect, useState } from "react";
import { apiContext } from "../ApiContext";

export function MyMentorSessions() {
  const { api } = useContext(apiContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>My Mentor Sessions</h2>

      {loading ? <p>Loading mentor sessions...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {!loading && !error && sessions.length === 0 ? <p>No mentor sessions yet.</p> : null}

      {!loading &&
        !error &&
        sessions.map((session) => (
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
          </div>
        ))}
    </div>
  );
}

const cardStyle = {
  background: "#2c2c2c",
  padding: "14px",
  marginBottom: "10px",
  borderRadius: "8px"
};
