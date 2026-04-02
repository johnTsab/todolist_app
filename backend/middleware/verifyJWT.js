const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  if (!req.headers || !req.headers.authorization) {
    return res.status(401).json({ message: "No token provided" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });

    req.user = decoded;
    console.log("DECODED TOKEN =", decoded);

    next();
  });
};
module.exports = verifyJWT;