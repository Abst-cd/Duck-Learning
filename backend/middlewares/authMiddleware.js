const jwt = require("jsonwebtoken");

const CLAVE_JWT = process.env.JWT_SECRET || "cambiar_clave_jwt_en_env";

const authenticateToken = (req, res, next) => {
  const encabezadoAuth = req.headers.authorization;

  if (!encabezadoAuth || !encabezadoAuth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = encabezadoAuth.split(" ")[1];

  try {
    const datosToken = jwt.verify(token, CLAVE_JWT);
    req.user = datosToken;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  return next();
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
