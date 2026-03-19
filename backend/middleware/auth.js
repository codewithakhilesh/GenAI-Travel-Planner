const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const secret = String(process.env.JWT_SECRET || "").trim();
  if (!secret) {
    return res.status(500).json({ message: "JWT_SECRET missing in environment" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || !payload.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = { id: String(payload.id) };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
