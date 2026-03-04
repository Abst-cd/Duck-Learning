jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  find: jest.fn()
}));

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const authRouter = require("../routes/auth");
const usersRouter = require("../routes/users");
const User = require("../models/User");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });
  return app;
};

describe("admin login + users list flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verifica login de admin y listado de usuarios
  test("admin inicia sesión y ve usuarios con estado free/premium", async () => {
    const app = buildApp();

    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    // Mock del admin para login
    User.findOne.mockResolvedValue({
      _id: "admin-id",
      username: "admin",
      password: hashedAdminPassword,
      role: "admin"
    });
    // Mock de usuarios para el listado
    User.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { username: "ana", role: "free" },
        { username: "luis", role: "premium" }
      ])
    });
    // Login como admin
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe("admin");
    expect(loginRes.body.token).toBeTruthy();
    // Listado de usuarios
    const listRes = await request(app)
      .get("/users/admin/list")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual([
      { username: "ana", role: "free" },
      { username: "luis", role: "premium" }
    ]);
  });
});
