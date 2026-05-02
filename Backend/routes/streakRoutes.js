import express from "express";
import { authenticate } from "../server.js";
import { sessionAttendanceModel, studySessionModel, studyGroupMembershipModel } from "../models.js";

export const streakRouter = express.Router();

// Returns current streak and attendance history for user
streakRouter.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;

    // Get all groups the user is a member of
    const memberships = await studyGroupMembershipModel.find({ userId });
    const groupIds = memberships.map(m => m.studyGroupId);

    if (groupIds.length === 0) {
      return res.status(200).json({
        currentStreak: 0,
        totalSessionsAttended: 0,
        attendanceDates: []
      });
    }

    // Get all past sessions across all the user's groups
    const now = new Date();
    const allSessions = await studySessionModel.find({
      parentStudyGroupId: { $in: groupIds },
      scheduledAt: { $lte: now }
    }).sort({ scheduledAt: 1 });

    if (allSessions.length === 0) {
      return res.status(200).json({
        currentStreak: 0,
        totalSessionsAttended: 0,
        attendanceDates: []
      });
    }

    // Get all attendance records for this user
    const attendances = await sessionAttendanceModel.find({ userId });
    const attendedSessionIds = new Set(attendances.map(a => String(a.sessionId)));

    // Helper: convert a date to a YYYY-MM-DD string
    function toDateStr(date) {
      return date.toISOString().slice(0, 10);
    }

    // Build a map of date -> sessions on that day
    const sessionsByDay = {};
    for (const session of allSessions) {
      const day = toDateStr(new Date(session.scheduledAt));
      if (!sessionsByDay[day]) sessionsByDay[day] = [];
      sessionsByDay[day].push(String(session._id));
    }

    // Build a set of days the user attended
    const attendedDays = new Set();
    for (const [day, sessionIds] of Object.entries(sessionsByDay)) {
      const attendedAny = sessionIds.some(id => attendedSessionIds.has(id));
      if (attendedAny) attendedDays.add(day);
    }

    // Get sorted list of all session days (only past)
    const allSessionDays = Object.keys(sessionsByDay).sort();

    // Calculate streak: walk backwards from the most recent session day
    let streak = 0;
    for (let i = allSessionDays.length - 1; i >= 0; i--) {
      const day = allSessionDays[i];
      if (attendedDays.has(day)) {
        streak++;
      } else {
        break;
      }
    }

    // Total sessions attended
    const totalSessionsAttended = attendances.length;

    // Return attendance dates for display (In array of YYYY-MM-DD strings)
    const attendanceDates = Array.from(attendedDays).sort();

    res.status(200).json({
      currentStreak,
      totalSessionsAttended,
      attendanceDates,
      allSessionDays
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});