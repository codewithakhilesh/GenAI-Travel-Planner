const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || "");
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing." });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured." });
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("_id name email phone photo provider");
    if (!user) {
      return res.status(401).json({ message: "User not found for token." });
    }

    req.user = {
      id: String(user._id),
      name: user.name || "",
      email: user.email || null,
      phone: user.phone || null,
      photo: user.photo || null,
      provider: user.provider || null
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = authMiddleware;
module.exports.requireAuth = authMiddleware;
