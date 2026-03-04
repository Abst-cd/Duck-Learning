require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const authRoutes = require("./routes/auth");
const subjectRoutes = require("./routes/subjects");
const userRoutes = require("./routes/users");
const User = require("./models/User");

const app = express();
const PUERTO = process.env.PORT || 3000;
const URI_MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/patoStudyDB";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const crearAdminSiNoExiste = async () => {
  const usuarioAdmin = process.env.ADMIN_USER || "admin_demo";
  const passwordAdmin = process.env.ADMIN_PASSWORD || "admin456";

  const adminActual = await User.findOne({ username: usuarioAdmin });
  if (!adminActual) {
    const passwordHasheada = await bcrypt.hash(passwordAdmin, 10);
    await User.create({
      username: usuarioAdmin,
      password: passwordHasheada,
      role: "admin",
      duckState: "neutral"
    });
    console.log(`Usuario admin creado: ${usuarioAdmin}`);
  }
};

mongoose.connect(URI_MONGO)
  .then(async () => {
    console.log("MongoDB conectado");
    await crearAdminSiNoExiste();
  })
  .catch(err => console.log(err));

app.use("/auth", authRoutes);
app.use("/subjects", subjectRoutes);
app.use("/users", userRoutes);

// Middleware de errores
app.use((err, req, res, _next) => {
  res.status(500).json({ error: err.message });
});

if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en puerto ${PUERTO}`);
  });
}

module.exports = app;
