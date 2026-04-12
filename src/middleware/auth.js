const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  try {
    req.hospital = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Token invalid or expired" });
  }
};
