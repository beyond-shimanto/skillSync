import JobApplication from "../model_2/jobApplication.js";

// Creating
export const createJob = async (req, res) => {
  try {
    const job = new JobApplication({
      ...req.body,
      userId: req.userObject.userId, // link to logged-in user
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Getting
export const getJobs = async (req, res) => {
  try {
    const jobs = await JobApplication.find({ userId: req.userObject.userId });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Updating
export const updateJob = async (req, res) => {
  try {
    const { status } = req.body;

    if (status && !["Applied", "Interview", "Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const job = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userObject.userId },
      req.body,
      { new: true }
    );

    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deleting
export const deleteJob = async (req, res) => {
  try {
    const job = await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.userObject.userId });

    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};