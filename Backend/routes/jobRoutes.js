import express from "express";
import { authenticate } from "../server.js";
import {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

// All routes protected with authenticate
router.post("/", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.put("/:id", authenticate, updateJob);
router.delete("/:id", authenticate, deleteJob);

export default router;