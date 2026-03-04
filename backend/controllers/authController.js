const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const CLAVE_JWT = process.env.JWT_SECRET || "cambiar_clave_jwt_en_env";

const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
    }

    const usuarioExistente = await User.findOne({ username });
    if (usuarioExistente) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    const passwordHasheada = await bcrypt.hash(password, 10);
    const usuario = new User({
      username,
      password: passwordHasheada,
      role: "user",
      duckState: "neutral"
    });

    await usuario.save();

    return res.status(201).json({ message: "Usuario registrado" });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
    }

    const usuario = await User.findOne({ username });
    if (!usuario) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    let passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida && usuario.password === password) {
      passwordValida = true;
      usuario.password = await bcrypt.hash(password, 10);
      await usuario.save();
    }

    if (!passwordValida) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      {
        userId: usuario._id.toString(),
        username: usuario.username,
        role: usuario.role
      },
      CLAVE_JWT,
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      user: {
        id: usuario._id,
        username: usuario.username,
        role: usuario.role,
        duckState: usuario.duckState
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login
};
