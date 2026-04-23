import mongoose from "mongoose";
import { mentorProfileModel, userModel } from "../../models.js";

function normalizeTag(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(normalizeTag)
    .filter((tag) => tag.length > 0);
}

export async function upsertMentorProfile(req, res) {
  const mentorUserId = req.userObject?.userId;
  const user = await userModel.findById(mentorUserId).select("userType username tags");

  if (!user || user.userType !== "mentor") {
    return res.status(403).json({ error: "Only mentors can create/update mentor profile." });
  }

  const bio = String(req.body.bio || "").trim();
  const expertiseTags = normalizeTags(req.body.expertiseTags);
  const yearsOfExperience = Number(req.body.yearsOfExperience ?? 0);
  const hourlyRate = Number(req.body.hourlyRate ?? 0);

  const updated = await mentorProfileModel.findOneAndUpdate(
    { mentorUserId: user._id },
    {
      mentorUserId: user._id,
      bio,
      expertiseTags,
      yearsOfExperience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : 0,
      hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    mentorUserId: user._id,
    username: user.username,
    profile: updated
  });
}

export async function getMyMentorProfile(req, res) {
  const mentorUserId = req.userObject?.userId;
  const user = await userModel.findById(mentorUserId).select("userType username tags");

  if (!user || user.userType !== "mentor") {
    return res.status(403).json({ error: "Only mentors have mentor profiles." });
  }

  const profile = await mentorProfileModel.findOne({ mentorUserId: user._id });
  if (!profile) {
    return res.status(404).json({ error: "Mentor profile not found." });
  }

  return res.status(200).json({
    mentorUserId: user._id,
    username: user.username,
    profile
  });
}

export async function listMentors(req, res) {
  const { tag, minPrice, maxPrice, minRating, sortBy, sortOrder } = req.query;
  const profileMatch = {};

  if (tag) {
    profileMatch.expertiseTags = normalizeTag(tag);
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    profileMatch.hourlyRate = {};

    if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
      profileMatch.hourlyRate.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
      profileMatch.hourlyRate.$lte = Number(maxPrice);
    }

    if (Object.keys(profileMatch.hourlyRate).length === 0) {
      delete profileMatch.hourlyRate;
    }
  }

  if (minRating !== undefined && !Number.isNaN(Number(minRating))) {
    profileMatch.averageRating = { $gte: Number(minRating) };
  }

  const sortFieldMap = {
    price: "hourlyRate",
    experience: "yearsOfExperience",
    rating: "averageRating"
  };

  const mappedSortField = sortFieldMap[sortBy] || "updatedAt";
  const mappedSortOrder = sortOrder === "asc" ? 1 : -1;

  const mentors = await mentorProfileModel.aggregate([
    { $match: profileMatch },
    {
      $lookup: {
        from: "users",
        localField: "mentorUserId",
        foreignField: "_id",
        as: "mentorUser"
      }
    },
    { $unwind: "$mentorUser" },
    { $match: { "mentorUser.userType": "mentor" } },
    {
      $project: {
        _id: 0,
        mentorUserId: "$mentorUser._id",
        username: "$mentorUser.username",
        userTags: "$mentorUser.tags",
        bio: 1,
        expertiseTags: 1,
        yearsOfExperience: 1,
        hourlyRate: 1,
        averageRating: 1,
        reviewCount: 1,
        updatedAt: 1
      }
    },
    { $sort: { [mappedSortField]: mappedSortOrder, updatedAt: -1 } }
  ]);

  return res.status(200).json(mentors);
}

export async function getMentorProfileByUserId(req, res) {
  const { mentorUserId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(mentorUserId)) {
    return res.status(400).json({ error: "Invalid mentor id." });
  }

  const user = await userModel.findById(mentorUserId).select("username userType tags bio");
  if (!user || user.userType !== "mentor") {
    return res.status(404).json({ error: "Mentor not found." });
  }

  const profile = await mentorProfileModel.findOne({ mentorUserId: user._id });
  if (!profile) {
    return res.status(404).json({ error: "Mentor profile not found." });
  }

  const profileObj = profile.toObject();
  if (!profileObj.bio) profileObj.bio = user.bio || "";

  return res.status(200).json({
    mentorUserId: user._id,
    username: user.username,
    userTags: user.tags,
    profile: profileObj
  });
}
