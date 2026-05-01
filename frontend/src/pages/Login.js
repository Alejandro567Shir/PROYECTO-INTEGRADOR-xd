import { useState } from "react";
import "../styles/login.css";
import { loginUsuario } from "../services/api";
import logoEspoch from "../assets/images/logo_espoch.png";

function Login({ onLoginExitoso }) {
  const [vista, setVista] = useState("roles");
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [tituloRol, setTituloRol] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");

  const abrirLogin = (rol, titulo) => {
    setRolSeleccionado(rol);
    setTituloRol(titulo);
    setVista("login");
    setCorreo("");
    setClave("");
    setMensaje("");
  };

  const volverRoles = () => {
    setVista("roles");
    setRolSeleccionado("");
    setTituloRol("");
    setCorreo("");
    setClave("");
    setMensaje("");
  };

  const manejarLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUsuario({
        correo,
        clave,
        rol: rolSeleccionado,
      });

      if (data.success) {
        setMensaje("");
        onLoginExitoso(data.usuario);
      } else {
        setMensaje(data.mensaje || "Datos incorrectos");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error al conectar con el servidor");
    }
  };

  if (vista === "roles") {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="logo-circle">
            <img src={logoEspoch} alt="Logo ESPOCH" className="logo-img" />
          </div>

          <h1>SGT-ESPOCH Orellana</h1>
          <p className="subtitle">Sistema de Gestión de Titulación</p>

          <h2>Seleccione su rol</h2>

          <div className="role-list">
            <button
              className="role-item"
              onClick={() => abrirLogin("ALUMNO", "Estudiante")}
            >
              <div className="role-info">
                <h3>ESTUDIANTE</h3>
                <p>Acceso para alumnos en proceso de titulación</p>
              </div>
              <span className="arrow">›</span>
            </button>

            <button
              className="role-item"
              onClick={() => abrirLogin("DOCENTE", "Docente")}
            >
              <div className="role-info">
                <h3>DOCENTE</h3>
                <p>Revisión de Fase 1</p>
              </div>
              <span className="arrow">›</span>
            </button>

            <button
              className="role-item"
              onClick={() => abrirLogin("COMISION DE TITULACION", "Comisión de Titulación")}
            >
              <div className="role-info">
                <h3>COMISIÓN DE TITULACIÓN</h3>
                <p>Revisión posterior a Fase 1</p>
              </div>
              <span className="arrow">›</span>
            </button>

            <button
              className="role-item"
              onClick={() => abrirLogin("DIRECTOR_TITULACION", "Director")}
            >
              <div className="role-info">
                <h3>DIRECTOR</h3>
                <p>Validación de Fase 2</p>
              </div>
              <span className="arrow">›</span>
            </button>

            <button
              className="role-item"
              onClick={() => abrirLogin("COORDINADOR_CARRERA", "Coordinador")}
            >
              <div className="role-info">
                <h3>COORDINADOR</h3>
                <p>Validación local de carrera</p>
              </div>
              <span className="arrow">›</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="logo-circle">
          <img src={logoEspoch} alt="Logo ESPOCH" className="logo-img" />
        </div>

        <h1>SGT-ESPOCH Orellana</h1>
        <p className="subtitle">Sistema de Gestión de Titulación</p>

        <h2>Iniciar Sesión - {tituloRol}</h2>

        <form className="login-form" onSubmit={manejarLogin}>
          <input
            type="email"
            placeholder="Correo institucional"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />

          <button type="submit" className="login-btn">
            Ingresar
          </button>

          <button type="button" className="back-btn" onClick={volverRoles}>
            Volver
          </button>
        </form>

        {mensaje && <p className="mensaje-login">{mensaje}</p>}
      </section>
    </main>
  );
}

export default Login;