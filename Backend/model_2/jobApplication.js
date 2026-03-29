import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  company: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Applied", "Interview", "Accepted", "Rejected"],
    default: "Applied",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
});

export default mongoose.model("JobApplication", jobApplicationSchema);