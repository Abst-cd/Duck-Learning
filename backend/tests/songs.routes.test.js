jest.mock("../models/Song", () => {
  const SongMock = jest.fn(function SongMock(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });

  SongMock.find = jest.fn();
  SongMock.countDocuments = jest.fn();
  SongMock.findById = jest.fn();
  SongMock.findByIdAndDelete = jest.fn();

  return SongMock;
});

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const songsRouter = require("../routes/songs");
const Song = require("../models/Song");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/songs", songsRouter);
  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });
  return app;
};

describe("songs routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verifica que un usuario free pueda agregar canción si tiene menos de 3
  test("agrega canción correctamente para usuario free con menos de 3 canciones", async () => {
    const app = buildApp();
    const token = jwt.sign(
      { userId: "507f191e810c19729de860ea", role: "free", username: "pepe" },
      "jwt_clave_local"
    );

    Song.countDocuments.mockResolvedValue(2);

    const res = await request(app)
      .post("/songs")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Song X", artist: "Artist Y" });

    expect(res.status).toBe(201);
    expect(Song.countDocuments).toHaveBeenCalledWith({ userId: "507f191e810c19729de860ea" });
    expect(res.body.title).toBe("Song X");
    expect(res.body.artist).toBe("Artist Y");
    expect(res.body.userId).toBe("507f191e810c19729de860ea");
  });
});
