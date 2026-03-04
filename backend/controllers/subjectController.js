const Subject = require("../models/Subject");
const User = require("../models/User");

const parseStudyTime = (body) => {
  const { studyMinutes, studySeconds } = body;

  if (typeof studySeconds === "number") {
    return Math.floor(studySeconds);
  }

  if (typeof studyMinutes === "number") {
    return Math.floor(studyMinutes * 60);
  }

  return null;
};

const currentRemaining = (subject) => {
  if (subject.status !== "running" || !subject.startedAt) {
    return subject.remainingSeconds;
  }

  const elapsed = Math.floor((Date.now() - new Date(subject.startedAt).getTime()) / 1000);
  const remaining = subject.remainingSeconds - elapsed;
  return remaining > 0 ? remaining : 0;
};

const syncRunningIfNeeded = async (subject) => {
  if (subject.status !== "running") {
    return subject;
  }

  const remaining = currentRemaining(subject);
  if (remaining > 0) {
    return subject;
  }

  subject.remainingSeconds = 0;
  subject.status = "completed";
  subject.startedAt = null;
  await subject.save();

  await User.findByIdAndUpdate(subject.userId, { duckState: "happy" });
  return subject;
};

const toClientSubject = (subject) => ({
  id: subject._id,
  name: subject.name,
  totalSeconds: subject.totalSeconds,
  remainingSeconds: currentRemaining(subject),
  status: subject.status,
  startedAt: subject.startedAt
});

const listMySubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    for (const subject of subjects) {
      await syncRunningIfNeeded(subject);
    }

    const freshSubjects = await Subject.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.userId).select("duckState");

    return res.json({
      duckState: user?.duckState || "neutral",
      subjects: freshSubjects.map(toClientSubject)
    });
  } catch (error) {
    return next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    const totalSeconds = parseStudyTime(req.body);

    if (!name || !name.trim() || !totalSeconds || totalSeconds < 1) {
      return res.status(400).json({ message: "Nombre y tiempo de estudio válidos son obligatorios" });
    }

    const subject = new Subject({
      name: name.trim(),
      totalSeconds,
      remainingSeconds: totalSeconds,
      status: "idle",
      userId: req.user.userId
    });

    await subject.save();
    return res.status(201).json(toClientSubject(subject));
  } catch (error) {
    return next(error);
  }
};

const updateSubjectTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const totalSeconds = parseStudyTime(req.body);

    if (!totalSeconds || totalSeconds < 1) {
      return res.status(400).json({ message: "Tiempo de estudio inválido" });
    }

    const subject = await Subject.findById(id);
    if (!subject || subject.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    await syncRunningIfNeeded(subject);

    if (subject.status === "running") {
      return res.status(409).json({ message: "No puedes editar una materia con timer en funcionamiento" });
    }

    subject.totalSeconds = totalSeconds;
    subject.remainingSeconds = totalSeconds;
    subject.status = "idle";
    subject.startedAt = null;

    await subject.save();
    return res.json({ message: "Tiempo actualizado", subject: toClientSubject(subject) });
  } catch (error) {
    return next(error);
  }
};

const startSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject || subject.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    await syncRunningIfNeeded(subject);

    if (subject.status === "running") {
      return res.status(409).json({ message: "La materia ya está en funcionamiento" });
    }

    if (subject.status === "completed") {
      subject.remainingSeconds = subject.totalSeconds;
      subject.status = "idle";
      subject.startedAt = null;
    }

    subject.status = "running";
    subject.startedAt = new Date();
    await subject.save();

    await User.findByIdAndUpdate(req.user.userId, { duckState: "neutral" });

    return res.json({
      message: "Estudio iniciado",
      duckState: "neutral",
      subject: toClientSubject(subject)
    });
  } catch (error) {
    return next(error);
  }
};

const stopSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject || subject.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    await syncRunningIfNeeded(subject);

    if (subject.status !== "running") {
      return res.status(409).json({ message: "La materia no está en funcionamiento" });
    }

    const remaining = currentRemaining(subject);

    if (remaining <= 0) {
      subject.remainingSeconds = 0;
      subject.status = "completed";
      subject.startedAt = null;
      await subject.save();
      await User.findByIdAndUpdate(req.user.userId, { duckState: "happy" });

      return res.json({
        message: "Tiempo completado",
        duckState: "happy",
        subject: toClientSubject(subject)
      });
    }

    subject.remainingSeconds = remaining;
    subject.status = "stopped";
    subject.startedAt = null;
    await subject.save();

    await User.findByIdAndUpdate(req.user.userId, { duckState: "angry" });

    return res.json({
      message: "Estudio detenido",
      duckState: "angry",
      subject: toClientSubject(subject)
    });
  } catch (error) {
    return next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject || subject.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    await syncRunningIfNeeded(subject);

    if (subject.status === "running") {
      return res.status(409).json({ message: "No puedes eliminar una materia con timer en funcionamiento" });
    }

    await Subject.findByIdAndDelete(id);
    return res.json({ message: "Materia eliminada" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMySubjects,
  createSubject,
  updateSubjectTime,
  startSubject,
  stopSubject,
  deleteSubject
};
