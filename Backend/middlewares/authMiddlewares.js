const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifica se o token é válido
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, isAdmin }
    next();
  } catch (err) {
    res.status(403).json({ error: "Token inválido ou expirado" });
  }
}

// Verifica se o usuário é admin
function verificarAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}

module.exports = { verificarToken, verificarAdmin };
