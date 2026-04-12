const jwt = require("jsonwebtoken");

// Demo credentials — both hospitals use password123
// Replace with DB lookup + bcrypt in production
const HOSPITALS = {
  "hospital-a": { id: "hospital-a", name: "Hospital A", password: "password123" },
  "hospital-b": { id: "hospital-b", name: "Hospital B", password: "password123" }
};

module.exports = function login(req, res) {
  const { hospitalId, password } = req.body;
  const h = HOSPITALS[hospitalId];

  if (!h || h.password !== password) {
    return res.status(401).json({ error: "Invalid hospital ID or password" });
  }

  const token = jwt.sign(
    { id: h.id, name: h.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, hospital: { id: h.id, name: h.name } });
};
