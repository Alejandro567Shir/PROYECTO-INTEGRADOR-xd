import { useState } from "react";
import { Toaster } from "react-hot-toast";

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

  let contenido;

  if (!usuarioLogueado) {
    contenido = <Login onLoginExitoso={setUsuarioLogueado} />;
  } else if (usuarioLogueado.rol === "ALUMNO") {
    contenido = (
      <EstudianteDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  } else if (usuarioLogueado.rol === "DOCENTE") {
    contenido = (
      <DocenteDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  } else if (usuarioLogueado.rol === "DIRECTOR_TITULACION") {
    contenido = (
      <DirectorDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  } else if (usuarioLogueado.rol === "COMISION DE TITULACION") {
    contenido = (
      <ComisionDeTitulacion
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  } else if (usuarioLogueado.rol === "COORDINADOR_CARRERA") {
    contenido = (
      <CoordinadorDashboard
        usuario={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
    );
  } else {
    contenido = <Login onLoginExitoso={setUsuarioLogueado} />;
  }

return (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2500,
        className: "toast-sgt",
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />

    {contenido}
  </>
);
}

export default App;