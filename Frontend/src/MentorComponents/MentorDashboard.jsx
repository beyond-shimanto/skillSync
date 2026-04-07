import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";
import "./MentorDashboard.css";

export function MentorDashboard({ username, onLogout }) {
  const navigate = useNavigate();
  const { api } = useContext(apiContext);
  const [stats, setStats] = useState({
    totalSessionsCompleted: 0,
    upcomingSessionsCount: 0,
    averageRating: 0,
    totalEarnings: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    async function loadMentorOverview() {
      try {
        const profileRes = await api.get("/mentors/profile/me");
        const profile = profileRes?.data?.profile;
        setStats((prev) => ({
          ...prev,
          averageRating: profile?.averageRating || 0
        }));
      } catch (e) {
        setStats((prev) => ({ ...prev, averageRating: 0 }));
      }

      // Feature scaffolding values until booking/review/payment modules are integrated.
      setUpcomingSessions([]);
      setRecentReviews([]);
      setStats((prev) => ({
        ...prev,
        totalSessionsCompleted: 0,
        upcomingSessionsCount: 0,
        totalEarnings: 0
      }));
    }

    loadMentorOverview();
  }, []);

  const navItems = useMemo(
    () => [
      { label: "My Profile", icon: "👤", action: () => navigate("/mentors/profile/edit") },
      { label: "My Sessions", icon: "📅", action: () => {} },
      { label: "Attendance Tracker", icon: "✅", action: () => {} },
      { label: "Earnings / Payments", icon: "💳", action: () => {} },
      { label: "Messages", icon: "💬", action: () => {} },
      { label: "Reviews & Reports", icon: "⭐", action: () => {} }
    ],
    [navigate]
  );

  return (
    <div className="mentor-dashboard-page">
      <aside className="mentor-sidebar">
        <div className="mentor-profile-block">
          <div className="mentor-avatar">{(username || "M").slice(0, 1).toUpperCase()}</div>
          <h3>{username}</h3>
          <span className="mentor-badge">Mentor</span>
        </div>

        <nav className="mentor-nav">
          {navItems.map((item) => (
            <button key={item.label} className="mentor-nav-item" onClick={item.action}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="mentor-main-content">
        <div className="mentor-main-header">
          <h2>Mentor Dashboard</h2>
          <button className="mentor-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        <section className="mentor-stat-grid">
          <StatCard title="Total Sessions Completed" value={stats.totalSessionsCompleted} />
          <StatCard title="Upcoming Sessions" value={stats.upcomingSessionsCount} />
          <StatCard
            title="Average Rating"
            value={`${Number(stats.averageRating || 0).toFixed(1)} ${renderStars(stats.averageRating)}`}
          />
          <StatCard title="Total Earnings" value={`$${Number(stats.totalEarnings || 0).toFixed(2)}`} />
        </section>

        <section className="mentor-panels">
          <div className="mentor-panel">
            <h3>Upcoming Sessions</h3>
            {upcomingSessions.length === 0 ? (
              <p className="mentor-empty-text">No upcoming sessions yet.</p>
            ) : (
              upcomingSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="mentor-row-card">
                  <div>
                    <p className="mentor-row-title">{session.learnerName}</p>
                    <p>{session.topic}</p>
                    <p>{session.time}</p>
                  </div>
                  <button className="mentor-action-btn">Mark Attendance</button>
                </div>
              ))
            )}
          </div>

          <div className="mentor-panel">
            <h3>Recent Reviews</h3>
            {recentReviews.length === 0 ? (
              <p className="mentor-empty-text">No reviews yet.</p>
            ) : (
              recentReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="mentor-row-card">
                  <div>
                    <p className="mentor-row-title">{review.learnerName}</p>
                    <p>{renderStars(review.rating)}</p>
                    <p>{review.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="mentor-stat-card">
      <p className="mentor-stat-title">{title}</p>
      <p className="mentor-stat-value">{value}</p>
    </div>
  );
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}
