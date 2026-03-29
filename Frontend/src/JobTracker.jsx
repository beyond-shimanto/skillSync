import { useEffect, useState, useContext } from "react";
import { apiContext } from "./ApiContext";

export default function JobTracker() {
  const { api } = useContext(apiContext); // use API with authentication
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    company: "",
    role: "",
  });

  const fetchJobs = async () => {
    try {
      const res = await api.get("/api/jobs"); // fetch only logged-in user's jobs
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/api/jobs", form); // backend automatically adds userId
    setForm({ company: "", role: "" });
    fetchJobs();
  };

  const deleteJob = async (id) => {
    await api.delete(`/api/jobs/${id}`);
    fetchJobs();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/jobs/${id}`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Job Tracker</h2>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          style={inputStyle}
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />

        <input
          style={inputStyle}
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />

        <button style={buttonStyle}>Add</button>
      </form>

      {/* JOB LIST */}
      {jobs.length === 0 ? (
        <p>No job applications yet.</p>
      ) : (
        jobs.map((job) => (
          <div key={job._id} style={cardStyle}>
            <h4>{job.company} - {job.role}</h4>

            {/* Status dropdown */}
            <select
              value={job.status}
              onChange={(e) => updateStatus(job._id, e.target.value)}
              style={{
                marginTop: "10px",
                padding: "5px",
                background: "#1e1e1e",
                color: "white",
                border: "1px solid #444",
              }}
            >
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button style={deleteButton} onClick={() => deleteJob(job._id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// Styles
const inputStyle = {
  padding: "8px",
  marginRight: "10px",
  background: "#1e1e1e",
  border: "1px solid #444",
  color: "white",
};

const buttonStyle = {
  padding: "8px 12px",
  background: "#00bcd4",
  border: "none",
  color: "white",
  cursor: "pointer",
};

const deleteButton = {
  marginTop: "10px",
  padding: "5px 10px",
  background: "#e74c3c",
  border: "none",
  color: "white",
  cursor: "pointer",
};

const cardStyle = {
  background: "#2c2c2c",
  padding: "15px",
  marginBottom: "10px",
  borderRadius: "8px",
};