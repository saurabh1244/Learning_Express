const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; 

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ message: " Invalid or expired token" });
  }
}

module.exports = verifyToken;
