import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiContext } from "../ApiContext";
import { MentorProfileEditor } from "./MentorProfileEditor";
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
  const [sessions, setSessions] = useState([]);
  const [attendanceForms, setAttendanceForms] = useState({});
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [recentReviews, setRecentReviews] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mentorProfileData, setMentorProfileData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packageForm, setPackageForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    price: 0,
    currency: "usd"
  });
  const [editingPackageId, setEditingPackageId] = useState("");
  const [packageMessage, setPackageMessage] = useState("");

  useEffect(() => {
    async function loadMentorOverview() {
      let nextStats = {
        totalSessionsCompleted: 0,
        upcomingSessionsCount: 0,
        averageRating: 0,
        totalEarnings: 0
      };

      try {
        const profileRes = await api.get("/mentors/profile/me");
        const profile = profileRes?.data?.profile;
        setMentorProfileData(profileRes?.data || null);
        nextStats = {
          ...nextStats,
          averageRating: profile?.averageRating || 0
        };
      } catch {
        nextStats.averageRating = 0;
      }

      try {
        const sessionsRes = await api.get("/mentors/sessions/me");
        const mentorSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        setSessions(mentorSessions);
        setAttendanceForms(
          mentorSessions.reduce((forms, session) => ({
            ...forms,
            [session._id]: {
              status: session.attendanceStatus === "no-show" ? "no-show" : "attended",
              notes: session.notes || ""
            }
          }), {})
        );
        nextStats = {
          ...nextStats,
          totalSessionsCompleted: mentorSessions.filter((session) => session.attendanceStatus === "attended").length,
          upcomingSessionsCount: mentorSessions.filter((session) => session.attendanceStatus === "pending").length,
          totalEarnings:
            mentorSessions
              .filter((session) => session.paymentStatus === "paid")
              .reduce(
                (total, session) => total + (session.packagePriceCentsSnapshot || session.amountCents || 0),
                0
              ) / 100
        };
      } catch {
        setSessions([]);
      }

      try {
        const packagesRes = await api.get("/mentors/packages/me");
        setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : []);
      } catch {
        setPackages([]);
      }

      setRecentReviews([]);
      setStats(nextStats);
    }

    loadMentorOverview();
  }, []);

  function updateAttendanceForm(sessionId, key, value) {
    setAttendanceForms((prev) => ({
      ...prev,
      [sessionId]: {
        status: "attended",
        notes: "",
        ...(prev[sessionId] || {}),
        [key]: value
      }
    }));
  }

  async function handleAttendanceSubmit(sessionId) {
    setAttendanceMessage("");
    const form = attendanceForms[sessionId] || { status: "attended", notes: "" };
    const session = sessions.find((item) => item._id === sessionId);

    if (!canMarkAttendance(session)) {
      setAttendanceMessage(getAttendanceUnavailableMessage(session));
      return;
    }

    try {
      const res = await api.put(`/mentors/sessions/${sessionId}/attendance`, {
        status: form.status,
        notes: form.notes
      });

      const nextSessions = sessions.map((session) => (session._id === sessionId ? res.data : session));
      setSessions(nextSessions);
      setStats((prev) => ({
        ...prev,
        totalSessionsCompleted: nextSessions.filter((session) => session.attendanceStatus === "attended").length,
        upcomingSessionsCount: nextSessions.filter((session) => session.attendanceStatus === "pending").length
      }));
      setAttendanceMessage("Attendance saved.");
    } catch (e) {
      setAttendanceMessage(e.response?.data?.error || "Failed to save attendance.");
    }
  }

  function resetPackageForm() {
    setEditingPackageId("");
    setPackageForm({
      title: "",
      description: "",
      durationMinutes: 60,
      price: 0,
      currency: "usd"
    });
  }

  function handlePackageEdit(pkg) {
    setEditingPackageId(pkg._id);
    setPackageForm({
      title: pkg.title || "",
      description: pkg.description || "",
      durationMinutes: pkg.durationMinutes || 60,
      price: Number(pkg.priceCents || 0) / 100,
      currency: pkg.currency || "usd"
    });
    setActiveSection("packages");
  }

  async function handlePackageSubmit(e) {
    e.preventDefault();
    setPackageMessage("");

    try {
      const payload = {
        title: packageForm.title,
        description: packageForm.description,
        durationMinutes: Number(packageForm.durationMinutes),
        price: Number(packageForm.price),
        currency: packageForm.currency
      };

      const res = editingPackageId
        ? await api.put(`/mentors/packages/${editingPackageId}`, payload)
        : await api.post("/mentors/packages", payload);

      setPackages((prev) => {
        if (!editingPackageId) return [res.data, ...prev];
        return prev.map((pkg) => (pkg._id === editingPackageId ? res.data : pkg));
      });
      resetPackageForm();
      setPackageMessage(editingPackageId ? "Package updated." : "Package created.");
    } catch (err) {
      setPackageMessage(err.response?.data?.error || "Failed to save package.");
    }
  }

  async function handlePackageDelete(packageId) {
    setPackageMessage("");

    try {
      const res = await api.delete(`/mentors/packages/${packageId}`);
      setPackages((prev) => prev.map((pkg) => (pkg._id === packageId ? res.data : pkg)));
      if (editingPackageId === packageId) resetPackageForm();
      setPackageMessage("Package deleted.");
    } catch (err) {
      setPackageMessage(err.response?.data?.error || "Failed to delete package.");
    }
  }

  const navItems = useMemo(
    () => [
      { label: "My Profile", icon: "👤", action: () => setActiveSection("profile") },
      { label: "Edit Profile", icon: "✏️", action: () => setActiveSection("editProfile") },
      { label: "My Packages", icon: "📦", action: () => setActiveSection("packages") },
      { label: "My Sessions", icon: "📅", action: () => setActiveSection("sessions") },
      { label: "Attendance Tracker", icon: "✅", action: () => setActiveSection("attendance") },
      { label: "Earnings / Payments", icon: "💳", action: () => setActiveSection("dashboard") },
      { label: "Messages", icon: "💬", action: () => navigate("/inbox") },
      { label: "Reviews & Reports", icon: "⭐", action: () => setActiveSection("dashboard") }
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
          <h2>{getActiveSectionTitle(activeSection)}</h2>
          <button className="mentor-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        {activeSection === "sessions" ? (
          <MentorSessionsView
            attendanceForms={attendanceForms}
            attendanceMessage={attendanceMessage}
            handleAttendanceSubmit={handleAttendanceSubmit}
            sessions={sessions}
            updateAttendanceForm={updateAttendanceForm}
          />
        ) : activeSection === "attendance" ? (
          <MentorAttendanceTrackerView sessions={sessions} />
        ) : activeSection === "profile" ? (
          <MentorProfileSummary mentorProfileData={mentorProfileData} stats={stats} username={username} />
        ) : activeSection === "editProfile" ? (
          <MentorProfileEditor onSaved={(updated) => setMentorProfileData(updated)} />
        ) : activeSection === "packages" ? (
          <MentorPackagesView
            editingPackageId={editingPackageId}
            handlePackageDelete={handlePackageDelete}
            handlePackageEdit={handlePackageEdit}
            handlePackageSubmit={handlePackageSubmit}
            packageForm={packageForm}
            packageMessage={packageMessage}
            packages={packages}
            resetPackageForm={resetPackageForm}
            setPackageForm={setPackageForm}
          />
        ) : (
          <DashboardSummary recentReviews={recentReviews} stats={stats} />
        )}
      </main>
    </div>
  );
}

function getActiveSectionTitle(activeSection) {
  if (activeSection === "sessions") return "My Sessions";
  if (activeSection === "attendance") return "Attendance Tracker";
  if (activeSection === "profile") return "My Profile";
  if (activeSection === "editProfile") return "Edit Profile";
  if (activeSection === "packages") return "My Packages";
  return "Mentor Dashboard";
}

function isFutureSession(session) {
  if (!session?.scheduledAt) return false;

  const scheduledAt = new Date(session.scheduledAt);
  return !Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now();
}

function canMarkAttendance(session) {
  return session?.bookingStatus === "booked" && session?.paymentStatus === "paid" && !isFutureSession(session);
}

function getAttendanceUnavailableMessage(session) {
  if (isFutureSession(session)) return "You can't mark attendance in advance.";
  return "Attendance can only be marked for paid booked sessions.";
}

function MentorProfileSummary({ mentorProfileData, stats, username }) {
  const profile = mentorProfileData?.profile;
  const displayName = mentorProfileData?.username || username || "Mentor";
  const averageRating = Number(profile?.averageRating || 0);
  const reviewCount = profile?.reviewCount || 0;
  const expertiseTags = profile?.expertiseTags || [];

  return (
    <section className="mentor-profile-summary">
      <div className="mentor-profile-card">
        <div className="mentor-profile-hero">
          <div className="mentor-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="mentor-profile-heading">
            <div className="mentor-profile-title-row">
              <h3>{displayName}</h3>
              <span className="mentor-badge">Mentor</span>
            </div>
            <p className="mentor-profile-rating">
              {averageRating.toFixed(1)} rating · {reviewCount} reviews
            </p>
          </div>
        </div>

        {!profile ? (
          <p className="mentor-empty-text">Mentor profile not loaded.</p>
        ) : (
          <div className="mentor-profile-body">
            <div className="mentor-profile-bio">
              <span className="mentor-profile-label">Bio</span>
              <p>{profile.bio || "No bio yet."}</p>
            </div>

            <div className="mentor-profile-stat-grid">
              <div className="mentor-profile-stat">
                <span>Experience</span>
                <strong>{profile.yearsOfExperience || 0} years</strong>
              </div>
              <div className="mentor-profile-stat">
                <span>Earnings</span>
                <strong>${Number(stats?.totalEarnings || 0).toFixed(2)}</strong>
              </div>
              <div className="mentor-profile-stat">
                <span>Rating</span>
                <strong>{averageRating.toFixed(1)}</strong>
              </div>
              <div className="mentor-profile-stat">
                <span>Reviews</span>
                <strong>{reviewCount}</strong>
              </div>
            </div>

            <div className="mentor-profile-expertise">
              <span className="mentor-profile-label">Expertise</span>
              {expertiseTags.length === 0 ? (
                <p className="mentor-empty-text">No expertise tags yet.</p>
              ) : (
                <div className="mentor-profile-chip-list">
                  {expertiseTags.map((tag) => (
                    <span key={tag} className="mentor-profile-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MentorPackagesView({
  editingPackageId,
  handlePackageDelete,
  handlePackageEdit,
  handlePackageSubmit,
  packageForm,
  packageMessage,
  packages,
  resetPackageForm,
  setPackageForm
}) {
  return (
    <section className="mentor-panels">
      <div className="mentor-panel">
        <h3>My Packages</h3>
        {packageMessage ? <p className="mentor-empty-text">{packageMessage}</p> : null}
        <form onSubmit={handlePackageSubmit} style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
          <label style={fieldLabelStyle}>
            Package title
            <input
              placeholder="Package title"
              value={packageForm.title}
              onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
            />
          </label>
          <label style={fieldLabelStyle}>
            Description
            <textarea
              placeholder="Description"
              rows={3}
              value={packageForm.description}
              onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
            />
          </label>
          <label style={fieldLabelStyle}>
            Duration (minutes)
            <input
              min="1"
              placeholder="60"
              type="number"
              value={packageForm.durationMinutes}
              onChange={(e) => setPackageForm({ ...packageForm, durationMinutes: e.target.value })}
            />
          </label>
          <label style={fieldLabelStyle}>
            Price
            <input
              min="0"
              step="0.01"
              placeholder="10"
              type="number"
              value={packageForm.price}
              onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
            />
          </label>
          <label style={fieldLabelStyle}>
            Currency
            <input
              maxLength={3}
              placeholder="usd"
              value={packageForm.currency}
              onChange={(e) => setPackageForm({ ...packageForm, currency: e.target.value })}
            />
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="mentor-action-btn" type="submit">
              {editingPackageId ? "Update Package" : "Create Package"}
            </button>
            {editingPackageId ? (
              <button className="mentor-action-btn" type="button" onClick={resetPackageForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
        {packages.length === 0 ? (
          <p className="mentor-empty-text">No packages yet.</p>
        ) : (
          packages.map((pkg) => (
            <div key={pkg._id} className="mentor-row-card" style={{ alignItems: "stretch" }}>
              <div>
                <p className="mentor-row-title">{pkg.title}</p>
                <p>{pkg.description || "No description."}</p>
                <p>{pkg.durationMinutes} min</p>
                <p>
                  {(pkg.priceCents / 100).toFixed(2)} {String(pkg.currency || "usd").toUpperCase()}
                </p>
                <p>Status: {pkg.isActive ? "Active" : "Deleted"}</p>
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                <button className="mentor-action-btn" type="button" onClick={() => handlePackageEdit(pkg)}>
                  Edit
                </button>
                {pkg.isActive ? (
                  <button className="mentor-action-btn" type="button" onClick={() => handlePackageDelete(pkg._id)}>
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const fieldLabelStyle = {
  color: "#cbd6ea",
  display: "grid",
  gap: "6px",
  fontSize: "0.95rem",
  fontWeight: 600
};

function DashboardSummary({ recentReviews, stats }) {
  return (
    <>
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
          <h3>Session Overview</h3>
          <p className="mentor-empty-text">Use My Sessions to manage booked sessions and attendance.</p>
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
    </>
  );
}

function MentorSessionsView({
  attendanceForms,
  attendanceMessage,
  handleAttendanceSubmit,
  sessions,
  updateAttendanceForm
}) {
  return (
    <section className="mentor-panels">
      <div className="mentor-panel">
        <h3>Booked Sessions</h3>
        {attendanceMessage ? <p className="mentor-empty-text">{attendanceMessage}</p> : null}
        {sessions.length === 0 ? (
          <p className="mentor-empty-text">No booked mentor sessions yet.</p>
        ) : (
          sessions.map((session) => {
            const attendanceDisabled = !canMarkAttendance(session);

            return (
              <div key={session._id} className="mentor-row-card" style={{ alignItems: "stretch" }}>
                <div style={{ flex: 1 }}>
                  <p className="mentor-row-title">{session.studentName || "Student"}</p>
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
                  <p>Status: {session.attendanceStatus || "pending"}</p>
                  {session.notes ? <p>Notes: {session.notes}</p> : null}
                </div>
                <div style={{ display: "grid", gap: "8px", minWidth: "180px" }}>
                  {attendanceDisabled ? (
                    <p className="mentor-empty-text">{getAttendanceUnavailableMessage(session)}</p>
                  ) : null}
                  <select
                    disabled={attendanceDisabled}
                    value={attendanceForms[session._id]?.status || "attended"}
                    onChange={(e) => updateAttendanceForm(session._id, "status", e.target.value)}
                  >
                    <option value="attended">Attended</option>
                    <option value="no-show">No-show</option>
                  </select>
                  <textarea
                    disabled={attendanceDisabled}
                    rows={3}
                    placeholder="Notes"
                    value={attendanceForms[session._id]?.notes || ""}
                    onChange={(e) => updateAttendanceForm(session._id, "notes", e.target.value)}
                  />
                  <button
                    className="mentor-action-btn"
                    disabled={attendanceDisabled}
                    onClick={() => handleAttendanceSubmit(session._id)}
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function MentorAttendanceTrackerView({ sessions }) {
  const groups = [
    { title: "Pending", status: "pending" },
    { title: "Attended", status: "attended" },
    { title: "No-show", status: "no-show" }
  ].map((group) => ({
    ...group,
    records: sessions.filter((session) => (session.attendanceStatus || "pending") === group.status)
  }));

  return (
    <section className="mentor-panels">
      {groups.map((group) => (
        <div key={group.status} className="mentor-panel">
          <h3>{group.title}</h3>
          {group.records.length === 0 ? (
            <p className="mentor-empty-text">No {group.title.toLowerCase()} attendance records.</p>
          ) : (
            group.records.map((session) => {
              const attendanceStatus = session.attendanceStatus || "pending";
              const statusLabel = attendanceStatus === "no-show" ? "No-show" : attendanceStatus;

              return (
                <div key={session._id} className="mentor-row-card" style={{ alignItems: "stretch" }}>
                  <div>
                    <p className="mentor-row-title">{session.studentName || "Student"}</p>
                    <p>{session.packageTitleSnapshot || session.topic || "Mentor session"}</p>
                    <p>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "No scheduled time"}</p>
                    <p>Attendance: {statusLabel}</p>
                    <p>Notes: {session.notes || "No notes."}</p>
                    {session.paymentStatus ? <p>Payment: {session.paymentStatus}</p> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </section>
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
