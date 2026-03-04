const Song = require("../models/Song");

const listMySongs = async (req, res, next) => {
  try {
    const songs = await Song.find({ userId: req.user.userId });
    return res.json(songs);
  } catch (error) {
    return next(error);
  }
};

const createSong = async (req, res, next) => {
  try {
    const { title, artist } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: "Título y artista son obligatorios" });
    }

    if (req.user.role === "free") {
      const songsCount = await Song.countDocuments({ userId: req.user.userId });
      if (songsCount >= 3) {
        return res.status(403).json({
          message: "Los usuarios free solo pueden agregar 3 canciones"
        });
      }
    }

    const song = new Song({
      title,
      artist,
      userId: req.user.userId
    });

    await song.save();
    return res.status(201).json(song);
  } catch (error) {
    return next(error);
  }
};

const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist } = req.body;

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: "Canción no encontrada" });
    }

    const isOwner = song.userId.toString() === req.user.userId;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "No autorizado" });
    }

    song.title = title ?? song.title;
    song.artist = artist ?? song.artist;

    await song.save();

    return res.json({ message: "Canción actualizada", song });
  } catch (error) {
    return next(error);
  }
};

const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: "Canción no encontrada" });
    }

    const isOwner = song.userId.toString() === req.user.userId;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "No autorizado" });
    }

    await Song.findByIdAndDelete(id);
    return res.json({ message: "Canción eliminada" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMySongs,
  createSong,
  updateSong,
  deleteSong
};
