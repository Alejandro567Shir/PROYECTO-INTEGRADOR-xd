import { useState } from "react";
import Login from "./pages/Login";
import EstudianteDashboard from "./pages/EstudianteDashboard";
import DocenteDashboard from "./pages/DocenteDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import ComisionDeTitulacion from "./pages/ComisionDeTitulacion"; 
import CoordinadorDashboard from "./pages/CoordinadorDashboard";
import "./styles/sidebar.css";
import "./styles/dashboard.css";

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const cerrarSesion = () => {
    setUsuarioLogueado(null);
  };

  if (!usuarioLogueado) {
    return <Login onLoginExitoso={setUsuarioLogueado} />;
  }

  if (usuarioLogueado.rol === "ALUMNO") {
    return (
      <EstudianteDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuarioLogueado.rol === "DOCENTE") {
    return (
      <DocenteDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuarioLogueado.rol === "DIRECTOR_TITULACION") {
    return (
      <DirectorDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }


  if (usuarioLogueado.rol === "COMISION DE TITULACION") {
    return (
      <ComisionDeTitulacion
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  if (usuarioLogueado.rol === "COORDINADOR_CARRERA") {
    return (
      <CoordinadorDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  }

  return <Login onLoginExitoso={setUsuarioLogueado} />;
}

export default App;