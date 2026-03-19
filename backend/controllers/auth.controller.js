const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Trip = require("../models/Trip");
const { deleteTripsByUserId } = require("../services/trip.store");

const SALT_ROUNDS = 10;

function normalizeIndianPhone(rawValue) {
  let digits = String(rawValue || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  return `+91${digits}`;
}

function cleanName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function toClientUser(user) {
  const fallbackName = cleanName(user.name || "");
  const [fallbackFirst, ...fallbackRest] = fallbackName.split(" ").filter(Boolean);

  const firstName = cleanName(user.firstName || fallbackFirst || "");
  const lastName = cleanName(user.lastName || fallbackRest.join(" "));

  return {
    id: String(user._id),
    firstName,
    lastName,
    phone: user.phone || null
  };
}

function issueJwt(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.sign({ id: String(user._id) }, secret, { expiresIn: "7d" });
}

function sendAuthSuccess(res, statusCode, message, user) {
  return res.status(statusCode).json({
    message,
    token: issueJwt(user),
    user: toClientUser(user)
  });
}

exports.registerPhone = async (req, res) => {
  try {
    const firstName = cleanName(req.body.firstName);
    const lastName = cleanName(req.body.lastName);
    const phone = normalizeIndianPhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!firstName || firstName.length < 2) {
      return res.status(400).json({ message: "First name must be at least 2 characters." });
    }

    if (!lastName || lastName.length < 2) {
      return res.status(400).json({ message: "Last name must be at least 2 characters." });
    }

    if (!phone) {
      return res.status(400).json({ message: "Enter a valid Indian mobile number." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ message: "Account already exists for this mobile number." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      phone,
      passwordHash
    });

    return sendAuthSuccess(res, 201, "Account created successfully.", user);
  } catch (error) {
    console.error("registerPhone error:", error);
    return res.status(500).json({ message: "Unable to register right now." });
  }
};

exports.loginPhone = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!phone) {
      return res.status(400).json({ message: "Enter a valid Indian mobile number." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid mobile number or password." });
    }

    const matched = await bcrypt.compare(password, user.passwordHash || "");
    if (!matched) {
      return res.status(401).json({ message: "Invalid mobile number or password." });
    }

    return sendAuthSuccess(res, 200, "Login successful.", user);
  } catch (error) {
    console.error("loginPhone error:", error);
    return res.status(500).json({ message: "Unable to login right now." });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    console.log("DELETE /api/auth/delete-account called");
    console.log("req.headers.authorization exists or not:", Boolean(req.headers.authorization));

    const userId = String((req.user && req.user.id) || "").trim();
    console.log("decoded user id:", userId || "(empty)");

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoTripsDeleted = 0;
    if (Trip && typeof Trip.deleteMany === "function") {
      const mongoDeleteResult = await Trip.deleteMany({ userId: userId });
      mongoTripsDeleted = Number((mongoDeleteResult && mongoDeleteResult.deletedCount) || 0);
    }

    const fileTripsDeleted = await deleteTripsByUserId(userId);
    console.log("trips deletion result:", {
      mongoDeletedCount: mongoTripsDeleted,
      fileDeletedCount: fileTripsDeleted
    });

    const deletedUser = await User.findByIdAndDelete(userId);
    console.log("user deletion result:", deletedUser ? "deleted" : "not_found");

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete account right now." });
  }
};
