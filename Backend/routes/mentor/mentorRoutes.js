import express from "express";
import { authenticate } from "../../server.js";
import {
  bookMentorSession,
  createMentorPackage,
  deleteMentorPackage,
  getMentorProfileByUserId,
  getMyMentorPackages,
  getMyMentorProfile,
  getMyMentorSessions,
  listMentorPackages,
  listMentors,
  updateMentorPackage,
  updateMentorSessionAttendance,
  upsertMentorProfile
} from "../../controllers/mentor/mentorController.js";

const mentorRouter = express.Router();

mentorRouter.get("/", listMentors);
mentorRouter.get("/packages/me", authenticate, getMyMentorPackages);
mentorRouter.post("/packages", authenticate, createMentorPackage);
mentorRouter.put("/packages/:packageId", authenticate, updateMentorPackage);
mentorRouter.delete("/packages/:packageId", authenticate, deleteMentorPackage);
mentorRouter.get("/sessions/me", authenticate, getMyMentorSessions);
mentorRouter.post("/sessions/book", authenticate, bookMentorSession);
mentorRouter.put("/sessions/:sessionId/attendance", authenticate, updateMentorSessionAttendance);
mentorRouter.get("/profile/me", authenticate, getMyMentorProfile);
mentorRouter.put("/profile/me", authenticate, upsertMentorProfile);
mentorRouter.get("/:mentorUserId/packages", listMentorPackages);
mentorRouter.get("/:mentorUserId", getMentorProfileByUserId);

export { mentorRouter };
