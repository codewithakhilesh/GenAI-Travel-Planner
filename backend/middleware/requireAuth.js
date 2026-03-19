const jwt = require("jsonwebtoken");

function sendUnauthorized(res) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}

function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  const authExists = Boolean(authHeader);
  console.log("requireAuth: Authorization header exists:", authExists);

  if (!authHeader.startsWith("Bearer ")) {
    return sendUnauthorized(res);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return sendUnauthorized(res);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("requireAuth: JWT_SECRET is missing.");
    return sendUnauthorized(res);
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || !payload.id) {
      return sendUnauthorized(res);
    }

    req.user = { id: String(payload.id) };
    console.log("requireAuth decoded user id:", req.user.id);
    return next();
  } catch (error) {
    console.warn("requireAuth: token verification failed:", error.message);
    return sendUnauthorized(res);
  }
}

module.exports = requireAuth;
