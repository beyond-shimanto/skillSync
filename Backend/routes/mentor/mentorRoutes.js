import express from "express";
import { authenticate } from "../../server.js";
import {
  getMentorProfileByUserId,
  getMyMentorProfile,
  listMentors,
  upsertMentorProfile
} from "../../controllers/mentor/mentorController.js";

const mentorRouter = express.Router();

mentorRouter.get("/", listMentors);
mentorRouter.get("/profile/me", authenticate, getMyMentorProfile);
mentorRouter.put("/profile/me", authenticate, upsertMentorProfile);
mentorRouter.get("/:mentorUserId", getMentorProfileByUserId);

export { mentorRouter };
