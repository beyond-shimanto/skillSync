import mongoose from "mongoose";
import Stripe from "stripe";
import { mentorPackageModel, mentorProfileModel, mentorSessionModel, userModel } from "../../models.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function normalizeTag(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(normalizeTag)
    .filter((tag) => tag.length > 0);
}

function createAttendanceItems(count) {
  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    sessionNumber: index + 1,
    status: "pending",
    notes: ""
  }));
}

function getAttendanceItems(session) {
  if (Array.isArray(session.attendanceItems) && session.attendanceItems.length > 0) {
    return session.attendanceItems.map((item) => ({
      sessionNumber: item.sessionNumber,
      status: item.status || "pending",
      notes: item.notes || "",
      attendanceMarkedAt: item.attendanceMarkedAt
    }));
  }

  return [
    {
      sessionNumber: 1,
      status: session.attendanceStatus || "pending",
      notes: session.notes || "",
      attendanceMarkedAt: session.attendanceMarkedAt
    }
  ];
}

function getAttendanceSummary(attendanceItems) {
  const items = attendanceItems.length > 0 ? attendanceItems : createAttendanceItems(1);

  if (items.every((item) => item.status === "attended")) return "attended";
  if (items.every((item) => item.status === "pending")) return "pending";
  if (items.some((item) => item.status === "pending")) return "pending";
  return "no-show";
}

function serializeSession(session) {
  return {
    _id: session._id,
    mentorUserId: session.mentorUserId?._id || session.mentorUserId,
    mentorName: session.mentorUserId?.username || "",
    studentUserId: session.studentUserId?._id || session.studentUserId,
    studentName: session.studentUserId?.username || "",
    topic: session.topic,
    mentorPackageId: session.mentorPackageId?._id || session.mentorPackageId,
    scheduledAt: session.scheduledAt,
    packageTitleSnapshot: session.packageTitleSnapshot,
    packageDescriptionSnapshot: session.packageDescriptionSnapshot,
    packageDurationMinutesSnapshot: session.packageDurationMinutesSnapshot,
    packageSessionCountSnapshot: session.packageSessionCountSnapshot || 1,
    packagePriceCentsSnapshot: session.packagePriceCentsSnapshot,
    currencySnapshot: session.currencySnapshot,
    hourlyRateSnapshot: session.hourlyRateSnapshot,
    amountCents: session.amountCents,
    currency: session.currency,
    bookingStatus: session.bookingStatus,
    paymentStatus: session.paymentStatus,
    stripeCheckoutSessionId: session.stripeCheckoutSessionId,
    stripePaymentIntentId: session.stripePaymentIntentId,
    attendanceStatus: session.attendanceStatus,
    notes: session.notes,
    attendanceMarkedAt: session.attendanceMarkedAt,
    attendanceItems: getAttendanceItems(session),
    reviewRating: session.reviewRating,
    reviewText: session.reviewText,
    reviewSubmittedAt: session.reviewSubmittedAt
  };
}

function serializePackage(pkg) {
  return {
    _id: pkg._id,
    mentorUserId: pkg.mentorUserId,
    title: pkg.title,
    description: pkg.description,
    durationMinutes: pkg.durationMinutes,
    sessionCount: pkg.sessionCount || 1,
    priceCents: pkg.priceCents,
    currency: pkg.currency,
    isActive: pkg.isActive,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt
  };
}

function normalizeCurrency(value) {
  const currency = String(value || "usd").trim().toLowerCase();
  return /^[a-z]{3}$/.test(currency) ? currency : "usd";
}

function serializeReview(session) {
  return {
    id: session._id,
    sessionId: session._id,
    learnerName: session.studentUserId?.username || "Student",
    packageTitle: session.packageTitleSnapshot || session.topic || "Mentor session",
    rating: session.reviewRating,
    comment: session.reviewText || "",
    submittedAt: session.reviewSubmittedAt
  };
}

async function getRecentMentorReviews(mentorUserId, limit = 3) {
  const reviews = await mentorSessionModel
    .find({
      mentorUserId,
      reviewSubmittedAt: { $exists: true },
      reviewRating: { $gte: 1, $lte: 5 }
    })
    .sort({ reviewSubmittedAt: -1 })
    .limit(limit)
    .populate("studentUserId", "username")
    .lean();

  return reviews.map(serializeReview);
}

async function updateMentorReviewStats(mentorUserId) {
  const [stats] = await mentorSessionModel.aggregate([
    {
      $match: {
        mentorUserId: new mongoose.Types.ObjectId(String(mentorUserId)),
        reviewSubmittedAt: { $exists: true },
        reviewRating: { $gte: 1, $lte: 5 }
      }
    },
    {
      $group: {
        _id: "$mentorUserId",
        averageRating: { $avg: "$reviewRating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  return mentorProfileModel.findOneAndUpdate(
    { mentorUserId },
    {
      averageRating: stats?.averageRating || 0,
      reviewCount: stats?.reviewCount || 0
    },
    { new: true }
  );
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

  const recentReviews = await getRecentMentorReviews(user._id);

  return res.status(200).json({
    mentorUserId: user._id,
    username: user.username,
    profile,
    recentReviews
  });
}

export async function getMyMentorPackages(req, res) {
  const mentorUserId = req.userObject?.userId;
  const user = await userModel.findById(mentorUserId).select("userType");

  if (!user || user.userType !== "mentor") {
    return res.status(403).json({ error: "Only mentors can manage packages." });
  }

  const packages = await mentorPackageModel
    .find({ mentorUserId: user._id })
    .sort({ isActive: -1, updatedAt: -1 })
    .lean();

  return res.status(200).json(packages.map(serializePackage));
}

export async function createMentorPackage(req, res) {
  const mentorUserId = req.userObject?.userId;
  const user = await userModel.findById(mentorUserId).select("userType");

  if (!user || user.userType !== "mentor") {
    return res.status(403).json({ error: "Only mentors can create packages." });
  }

  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const durationMinutes = Number(req.body.durationMinutes);
  const sessionCount = Number(req.body.sessionCount ?? 1);
  const priceCents = Math.round(Number(req.body.price || 0) * 100);
  const currency = normalizeCurrency(req.body.currency);

  if (!title) {
    return res.status(400).json({ error: "Package title is required." });
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return res.status(400).json({ error: "Package duration must be at least 1 minute." });
  }

  if (!Number.isInteger(sessionCount) || sessionCount < 1) {
    return res.status(400).json({ error: "Package session count must be at least 1." });
  }

  if (!Number.isFinite(priceCents) || priceCents < 50) {
    return res.status(400).json({ error: "Package price per session must be at least 0.50." });
  }

  const pkg = await mentorPackageModel.create({
    mentorUserId: user._id,
    title,
    description,
    durationMinutes,
    sessionCount,
    priceCents,
    currency,
    isActive: true
  });

  return res.status(201).json(serializePackage(pkg.toObject()));
}

export async function updateMentorPackage(req, res) {
  const { packageId } = req.params;
  const mentorUserId = req.userObject?.userId;

  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    return res.status(400).json({ error: "Invalid package id." });
  }

  const pkg = await mentorPackageModel.findOne({ _id: packageId, mentorUserId });
  if (!pkg) {
    return res.status(404).json({ error: "Package not found." });
  }

  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const durationMinutes = Number(req.body.durationMinutes);
  const sessionCount = Number(req.body.sessionCount ?? 1);
  const priceCents = Math.round(Number(req.body.price || 0) * 100);
  const currency = normalizeCurrency(req.body.currency);

  if (!title) {
    return res.status(400).json({ error: "Package title is required." });
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return res.status(400).json({ error: "Package duration must be at least 1 minute." });
  }

  if (!Number.isInteger(sessionCount) || sessionCount < 1) {
    return res.status(400).json({ error: "Package session count must be at least 1." });
  }

  if (!Number.isFinite(priceCents) || priceCents < 50) {
    return res.status(400).json({ error: "Package price per session must be at least 0.50." });
  }

  pkg.title = title;
  pkg.description = description;
  pkg.durationMinutes = durationMinutes;
  pkg.sessionCount = sessionCount;
  pkg.priceCents = priceCents;
  pkg.currency = currency;
  pkg.isActive = req.body.isActive !== false;

  await pkg.save();

  return res.status(200).json(serializePackage(pkg.toObject()));
}

export async function deleteMentorPackage(req, res) {
  const { packageId } = req.params;
  const mentorUserId = req.userObject?.userId;

  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    return res.status(400).json({ error: "Invalid package id." });
  }

  const pkg = await mentorPackageModel.findOne({ _id: packageId, mentorUserId });
  if (!pkg) {
    return res.status(404).json({ error: "Package not found." });
  }

  pkg.isActive = false;
  await pkg.save();

  return res.status(200).json(serializePackage(pkg.toObject()));
}

export async function listMentorPackages(req, res) {
  const { mentorUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(mentorUserId)) {
    return res.status(400).json({ error: "Invalid mentor id." });
  }

  const packages = await mentorPackageModel
    .find({ mentorUserId, isActive: true })
    .sort({ priceCents: 1, updatedAt: -1 })
    .lean();

  return res.status(200).json(packages.map(serializePackage));
}

export async function getMyMentorSessions(req, res) {
  const userId = req.userObject?.userId;
  const user = await userModel.findById(userId).select("_id");

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const sessions = await mentorSessionModel
    .find({
      bookingStatus: "booked",
      $or: [
        { mentorUserId: user._id },
        { studentUserId: user._id }
      ]
    })
    .sort({ scheduledAt: -1, createdAt: -1 })
    .populate("mentorUserId", "username")
    .populate("studentUserId", "username")
    .lean();

  return res.status(200).json(sessions.map(serializeSession));
}

export async function bookMentorSession(req, res) {
  const studentUserId = req.userObject?.userId;
  const student = await userModel.findById(studentUserId).select("userType username");

  if (!student || student.userType !== "student") {
    return res.status(403).json({ error: "Only students can book mentor sessions." });
  }

  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured." });
  }

  const { mentorPackageId } = req.body;
  const scheduledAtInput = req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined;

  if (!mongoose.Types.ObjectId.isValid(mentorPackageId)) {
    return res.status(400).json({ error: "Invalid package id." });
  }

  if (scheduledAtInput && Number.isNaN(scheduledAtInput.getTime())) {
    return res.status(400).json({ error: "Invalid scheduled date." });
  }

  const pkg = await mentorPackageModel.findOne({ _id: mentorPackageId, isActive: true });
  if (!pkg) {
    return res.status(404).json({ error: "Package not found." });
  }

  const mentor = await userModel.findById(pkg.mentorUserId).select("userType username");
  if (!mentor || mentor.userType !== "mentor") {
    return res.status(404).json({ error: "Mentor not found." });
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const sessionCount = pkg.sessionCount || 1;
  const totalPriceCents = pkg.priceCents * sessionCount;

  const session = await mentorSessionModel.create({
    mentorUserId: mentor._id,
    studentUserId: student._id,
    mentorPackageId: pkg._id,
    topic: pkg.title,
    scheduledAt: scheduledAtInput,
    packageTitleSnapshot: pkg.title,
    packageDescriptionSnapshot: pkg.description,
    packageDurationMinutesSnapshot: pkg.durationMinutes,
    packageSessionCountSnapshot: sessionCount,
    packagePriceCentsSnapshot: totalPriceCents,
    currencySnapshot: pkg.currency,
    hourlyRateSnapshot: totalPriceCents / 100,
    amountCents: totalPriceCents,
    currency: pkg.currency,
    bookingStatus: "pending_payment",
    paymentStatus: "pending",
    attendanceItems: createAttendanceItems(sessionCount)
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${frontendUrl}/mentors/sessions?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/mentors/${mentor._id}?checkout=cancelled`,
    client_reference_id: String(session._id),
    metadata: {
      mentorSessionId: String(session._id),
      mentorPackageId: String(pkg._id),
      mentorUserId: String(mentor._id),
      studentUserId: String(student._id)
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: pkg.currency,
          unit_amount: totalPriceCents,
          product_data: {
            name: pkg.title,
            description: pkg.description || `${sessionCount} session mentorship package`
          }
        }
      }
    ]
  });

  session.stripeCheckoutSessionId = checkoutSession.id;
  await session.save();
  await session.populate("mentorUserId", "username");
  await session.populate("studentUserId", "username");

  return res.status(201).json({
    session: serializeSession(session.toObject()),
    checkoutUrl: checkoutSession.url
  });
}

export async function updateMentorSessionAttendance(req, res) {
  const { sessionId } = req.params;
  const mentorUserId = req.userObject?.userId;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const user = await userModel.findById(mentorUserId).select("userType");
  if (!user || user.userType !== "mentor") {
    return res.status(403).json({ error: "Only mentors can mark attendance." });
  }

  const status = String(req.body.status || "").trim();
  if (!["pending", "attended", "no-show"].includes(status)) {
    return res.status(400).json({ error: "Attendance status must be pending, attended, or no-show." });
  }

  const session = await mentorSessionModel.findById(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (String(session.mentorUserId) !== String(user._id)) {
    return res.status(403).json({ error: "Only the assigned mentor can mark this session." });
  }

  if (session.bookingStatus !== "booked" || session.paymentStatus !== "paid") {
    return res.status(400).json({ error: "Attendance can only be marked for paid booked sessions." });
  }

  if (session.scheduledAt && session.scheduledAt.getTime() > Date.now()) {
    return res.status(400).json({ error: "Attendance can be marked only after the scheduled session time." });
  }

  const notes = String(req.body.notes || "").trim();
  const sessionNumber = Number(req.body.sessionNumber ?? 1);
  const attendanceItems = getAttendanceItems(session);
  const itemIndex = attendanceItems.findIndex((item) => item.sessionNumber === sessionNumber);

  if (!Number.isInteger(sessionNumber) || itemIndex === -1) {
    return res.status(400).json({ error: "Invalid package session number." });
  }

  attendanceItems[itemIndex] = {
    ...attendanceItems[itemIndex],
    status,
    notes,
    attendanceMarkedAt: new Date()
  };

  session.attendanceItems = attendanceItems;
  session.attendanceStatus = getAttendanceSummary(attendanceItems);
  session.notes = attendanceItems
    .filter((item) => item.notes)
    .map((item) => `Session ${item.sessionNumber}: ${item.notes}`)
    .join("\n");
  session.attendanceMarkedAt = attendanceItems[itemIndex].attendanceMarkedAt;

  await session.save();
  await session.populate("mentorUserId", "username");
  await session.populate("studentUserId", "username");

  return res.status(200).json(serializeSession(session.toObject()));
}

export async function submitMentorSessionReview(req, res) {
  const { sessionId } = req.params;
  const studentUserId = req.userObject?.userId;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Review rating must be between 1 and 5." });
  }

  const session = await mentorSessionModel.findById(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (String(session.studentUserId) !== String(studentUserId)) {
    return res.status(403).json({ error: "Only the student who booked this session can review it." });
  }

  if (session.bookingStatus !== "booked" || session.paymentStatus !== "paid" || session.attendanceStatus !== "attended") {
    return res.status(400).json({ error: "Only paid attended sessions can be reviewed." });
  }

  if (session.reviewSubmittedAt) {
    return res.status(400).json({ error: "This session has already been reviewed." });
  }

  session.reviewRating = rating;
  session.reviewText = String(req.body.text || "").trim();
  session.reviewSubmittedAt = new Date();

  await session.save();
  const mentorUserId = session.mentorUserId;
  const profile = await updateMentorReviewStats(mentorUserId);
  await session.populate("mentorUserId", "username");
  await session.populate("studentUserId", "username");

  return res.status(200).json({
    session: serializeSession(session.toObject()),
    profile,
    recentReviews: await getRecentMentorReviews(mentorUserId)
  });
}

async function markCheckoutSessionPaid(checkoutSession) {
  const mentorSessionId = checkoutSession.metadata?.mentorSessionId;
  const query = mentorSessionId && mongoose.Types.ObjectId.isValid(mentorSessionId)
    ? { _id: mentorSessionId }
    : { stripeCheckoutSessionId: checkoutSession.id };

  const session = await mentorSessionModel.findOne(query);
  if (!session) return;

  session.bookingStatus = "booked";
  session.paymentStatus = "paid";
  session.stripeCheckoutSessionId = checkoutSession.id;
  session.stripePaymentIntentId = typeof checkoutSession.payment_intent === "string"
    ? checkoutSession.payment_intent
    : checkoutSession.payment_intent?.id || "";

  await session.save();
}

async function markCheckoutSessionFailed(checkoutSession) {
  const mentorSessionId = checkoutSession.metadata?.mentorSessionId;
  const query = mentorSessionId && mongoose.Types.ObjectId.isValid(mentorSessionId)
    ? { _id: mentorSessionId }
    : { stripeCheckoutSessionId: checkoutSession.id };

  await mentorSessionModel.findOneAndUpdate(query, {
    bookingStatus: "cancelled",
    paymentStatus: "failed",
    stripeCheckoutSessionId: checkoutSession.id
  });
}

export async function handleStripeWebhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe webhook is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (
      (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await markCheckoutSessionPaid(event.data.object);
    }

    if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      await markCheckoutSessionFailed(event.data.object);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: "Webhook processing failed." });
  }
}

export async function listMentors(req, res) {
  const { tag, minPrice, maxPrice, minRating, sortBy, sortOrder, skill } = req.query;
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

  let skillUserIds = null;
  if (skill) {
    const { userModel: UserModel } = await import('../../models.js');
    const matchingUsers = await UserModel.find(
      { expertise: skill },
      { _id: 1 }
    );
    skillUserIds = matchingUsers.map(u => u._id);
  }

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
    {
      $match: {
        "mentorUser.userType": "mentor",
        ...(skillUserIds !== null && {
          "mentorUser._id": { $in: skillUserIds }
        })
      }
    },
    {
      $project: {
        _id: 0,
        mentorUserId: "$mentorUser._id",
        username: "$mentorUser.username",
        userTags: "$mentorUser.tags",
        expertise: "$mentorUser.expertise",
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

  const recentReviews = await getRecentMentorReviews(user._id);

  return res.status(200).json({
    mentorUserId: user._id,
    username: user.username,
    userTags: user.tags,
    profile: profileObj,
    recentReviews
  });
}
