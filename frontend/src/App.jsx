import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const DUCK_VIDEO_BY_STATE = {
  neutral: "/patomp4/Pato neutral.mp4",
  happy: "/patomp4/pato feliz.mp4",
  angry: "/patomp4/Pato Enojado.mp4"
};

const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const headersWithAuth = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

function App() {
  const [mode, setMode] = useState("login");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [duckState, setDuckState] = useState("neutral");
  const [subjects, setSubjects] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: "", studyMinutes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasRunning = useMemo(
    () => subjects.some((subject) => subject.status === "running"),
    [subjects]
  );

  const currentCounterSeconds = useMemo(() => {
    const runningSubject = subjects.find((subject) => subject.status === "running");
    if (runningSubject) {
      return runningSubject.remainingSeconds;
    }

    if (subjects.length > 0) {
      return subjects[0].remainingSeconds;
    }

    return 0;
  }, [subjects]);

  const fetchProfileAndSubjects = async (authToken) => {
    const profileResponse = await fetch(`${API_URL}/users/me`, {
      headers: headersWithAuth(authToken)
    });

    if (!profileResponse.ok) {
      throw new Error("No se pudo cargar la información del usuario");
    }

    const profileData = await profileResponse.json();
    setUser(profileData);

    if (profileData.role === "admin") {
      const adminListResponse = await fetch(`${API_URL}/users/admin/list`, {
        headers: headersWithAuth(authToken)
      });

      if (adminListResponse.ok) {
        const adminListData = await adminListResponse.json();
        setAdminUsers(adminListData || []);
      } else {
        setAdminUsers([]);
      }

      setSubjects([]);
      setDuckState("neutral");
    } else {
      const subjectsResponse = await fetch(`${API_URL}/subjects`, {
        headers: headersWithAuth(authToken)
      });

      if (!subjectsResponse.ok) {
        throw new Error("No se pudo cargar la información del usuario");
      }

      const subjectsData = await subjectsResponse.json();
      setDuckState(subjectsData.duckState || profileData.duckState || "neutral");
      setSubjects(subjectsData.subjects || []);
      setAdminUsers([]);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchProfileAndSubjects(token).catch((err) => {
      setError(err.message);
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
      setSubjects([]);
      setAdminUsers([]);
      setDuckState("neutral");
    });
  }, [token]);

  useEffect(() => {
    if (!token || !hasRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchProfileAndSubjects(token).catch(() => {});
    }, 1000);

    return () => clearInterval(intervalId);
  }, [token, hasRunning]);

  const handleAuth = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!credentials.username || !credentials.password) {
        throw new Error("Usuario y contraseña son obligatorios");
      }

      if (mode === "register") {
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        const registerData = await registerResponse.json();
        if (!registerResponse.ok) {
          throw new Error(registerData.message || "No se pudo registrar");
        }

        setMode("login");
        setError("Usuario creado. Ahora inicia sesión.");
        return;
      }

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.message || "Credenciales inválidas");
      }

      localStorage.setItem("token", loginData.token);
      setToken(loginData.token);
      setUser(loginData.user);
      setDuckState(loginData.user?.duckState || "neutral");
      setCredentials({ username: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (event) => {
    event.preventDefault();
    setError("");

    const studyMinutes = Number(newSubject.studyMinutes);

    if (!newSubject.name.trim() || !Number.isFinite(studyMinutes) || studyMinutes <= 0) {
      setError("Ingresa un nombre y un tiempo de estudio válido");
      return;
    }

    const response = await fetch(`${API_URL}/subjects`, {
      method: "POST",
      headers: headersWithAuth(token),
      body: JSON.stringify({
        name: newSubject.name,
        studyMinutes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "No se pudo crear la materia");
      return;
    }

    setNewSubject({ name: "", studyMinutes: "" });
    await fetchProfileAndSubjects(token);
  };

  const editSubjectTime = async (subject) => {
    const nextMinutes = window.prompt("Nuevo tiempo de estudio (minutos)", Math.ceil(subject.totalSeconds / 60));
    if (nextMinutes === null) {
      return;
    }

    const minutes = Number(nextMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError("Tiempo inválido");
      return;
    }

    const response = await fetch(`${API_URL}/subjects/${subject.id}/time`, {
      method: "PATCH",
      headers: headersWithAuth(token),
      body: JSON.stringify({ studyMinutes: minutes })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "No se pudo editar la materia");
      return;
    }

    await fetchProfileAndSubjects(token);
  };

  const deleteSubject = async (subjectId) => {
    const response = await fetch(`${API_URL}/subjects/${subjectId}`, {
      method: "DELETE",
      headers: headersWithAuth(token)
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "No se pudo eliminar la materia");
      return;
    }

    await fetchProfileAndSubjects(token);
  };

  const startSubject = async (subjectId) => {
    const response = await fetch(`${API_URL}/subjects/${subjectId}/start`, {
      method: "POST",
      headers: headersWithAuth(token)
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "No se pudo iniciar el estudio");
      return;
    }

    setDuckState(data.duckState || "neutral");
    await fetchProfileAndSubjects(token);
  };

  const stopSubject = async (subjectId) => {
    const response = await fetch(`${API_URL}/subjects/${subjectId}/stop`, {
      method: "POST",
      headers: headersWithAuth(token)
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "No se pudo detener el estudio");
      return;
    }

    setDuckState(data.duckState || "angry");
    await fetchProfileAndSubjects(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setSubjects([]);
    setAdminUsers([]);
    setDuckState("neutral");
    setError("");
  };

  if (!token) {
    return (
      <main className="page auth-page">
        <section className="habit-card auth-card">
          <span className="chip">Pato Study</span>
          <h1>{mode === "login" ? "Iniciar sesión" : "Registrarte"}</h1>

          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="text"
              placeholder="Usuario"
              value={credentials.username}
              onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button className="btn btn-si" type="submit" disabled={loading}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-no switch-btn"
            onClick={() => {
              setError("");
              setMode((prev) => (prev === "login" ? "register" : "login"));
            }}
          >
            {mode === "login" ? "No tengo cuenta" : "Ya tengo cuenta"}
          </button>

          {error && <p className="message">{error}</p>}
        </section>

        <section className="duck-panel" aria-label="Panel del pato tamagotchi">
          <h2>Pato Tamagotchi</h2>
          <div className="video-box">
            <video key="neutral" src={DUCK_VIDEO_BY_STATE.neutral} autoPlay loop muted playsInline />
          </div>
          <p className="duck-state">Estado: neutral.</p>
        </section>
      </main>
    );
  }

  if (token && !user) {
    return (
      <main className="page app-page">
        <section className="habit-card full-width">
          <h1>Cargando...</h1>
        </section>
      </main>
    );
  }

  if (user?.role === "admin") {
    return (
      <main className="page app-page">
        <section className="habit-card full-width">
          <div className="header-row">
            <div>
              <span className="chip">Panel Admin</span>
              <h1>Bienvenido, {user.username}</h1>
            </div>
            <button type="button" className="btn btn-no" onClick={logout}>Cerrar sesión</button>
          </div>

          {error && <p className="message">{error}</p>}

          <section className="subjects-box">
            <h2>Usuarios registrados</h2>
            {adminUsers.length === 0 && <p className="hint">No hay usuarios para mostrar.</p>}
            {adminUsers.length > 0 && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((adminUser) => (
                      <tr key={adminUser.username}>
                        <td>{adminUser.username}</td>
                        <td>{adminUser.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page app-page">
      <section className="habit-card full-width">
        <div className="header-row">
          <div>
            <span className="chip">Panel de Estudio</span>
            <h1>Bienvenido, {user?.username}</h1>
          </div>
          <button type="button" className="btn btn-no" onClick={logout}>Cerrar sesión</button>
        </div>

        {error && <p className="message">{error}</p>}

        <div className="top-grid">
          <div className="timer-box">
            <p className="counter-value">{formatTime(currentCounterSeconds)}</p>
          </div>

          <section className="duck-panel">
            <h2>Pato Tamagotchi</h2>
            <div className="video-box">
              <video
                key={duckState}
                src={DUCK_VIDEO_BY_STATE[duckState] || DUCK_VIDEO_BY_STATE.neutral}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            <p className="duck-state">Estado: {duckState}.</p>
          </section>
        </div>

        <section className="subjects-box">
          <h2>Materias</h2>
          <form onSubmit={createSubject} className="create-form">
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={newSubject.name}
              onChange={(event) => setNewSubject((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="Tiempo (min)"
              value={newSubject.studyMinutes}
              onChange={(event) => setNewSubject((prev) => ({ ...prev, studyMinutes: event.target.value }))}
            />
            <button type="submit" className="btn btn-si">Agregar</button>
          </form>

          <ul className="habit-list">
            {subjects.map((subject) => {
              const isRunning = subject.status === "running";

              return (
                <li className="habit-item" key={subject.id}>
                  <div>
                    <h2>{subject.name}</h2>
                    <p>Tiempo total: {formatTime(subject.totalSeconds)}</p>
                  </div>

                  <div className="actions">
                    <button className="btn btn-si" type="button" onClick={() => startSubject(subject.id)} disabled={isRunning}>
                      Iniciar
                    </button>
                    <button className="btn btn-no" type="button" onClick={() => stopSubject(subject.id)} disabled={!isRunning}>
                      Detener
                    </button>
                    <button className="btn btn-si" type="button" onClick={() => editSubjectTime(subject)} disabled={isRunning}>
                      Editar tiempo
                    </button>
                    <button className="btn btn-no" type="button" onClick={() => deleteSubject(subject.id)} disabled={isRunning}>
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </section>
    </main>
  );
}

export default App;
