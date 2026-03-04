const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middlewares/authMiddleware");

const CLAVE_JWT = process.env.JWT_SECRET || "Patojwt";

describe("Middleware: authenticateToken", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test("Debe devolver 401 si no hay encabezado de autorización", () => {
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token no proporcionado" });
    expect(next).not.toHaveBeenCalled();
  });

  test("Debe devolver 401 si el token es inválido o mal formado", () => {
    req.headers.authorization = "Bearer token-falso";

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
  });


});