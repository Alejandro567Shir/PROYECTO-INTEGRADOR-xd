import { useState } from "react";
import Sidebar from "../components/Sidebar";

function CoordinadorDashboard({ usuario, onCerrarSesion }) {
  // Mockup del proyecto pendiente de Ana Ruiz
  const [proyectosPendientes] = useState([
    {
      id: 1,
      estudiante: "Ana Ruiz",
      tema: "Migración a IPv6",
      ultimaAccion: "Validado Fase 2",
    }
  ]);

  // MOCKUP: Lista de ingenieros a cargo
  const [personalComision] = useState([
    { id: 1, nombre: "Ing. Ramiro Bonilla", rol: "Docente Evaluador (F1)", correo: "ramiro.bonilla@espoch.edu.ec" },
    { id: 2, nombre: "Ing. Roberto Basconez", rol: "Director de Titulación", correo: "roberto.basconez@espoch.edu.ec" },
    { id: 3, nombre: "Ing. Mariana Moposita", rol: "Comisión Administrativa", correo: "mariana.moposita@espoch.edu.ec" }
  ]);

  const simularAprobacion = (estudiante) => alert(`¡Documentación de ${estudiante} sellada y enviada a Matriz Riobamba!`);
  const simularEdicionCargos = () => alert("Abriendo panel de configuración para editar o añadir nuevos Ingenieros a la base de datos...");

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="COORDINADOR"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <h1>Validación de Coordinación (Sede Orellana)</h1>
        <p className="coordinador-subtitle">Proyectos aprobados por F1 y F2 que requieren visto bueno antes del envío a Matriz.</p>

        {/* Sección 1: Proyectos por aprobar */}
        <div className="coordinador-card-wrap">
          {proyectosPendientes.map((proyecto) => (
            <div className="card coordinador-card" key={proyecto.id}>
              <h3>{proyecto.estudiante}</h3>
              <p>{proyecto.tema}</p>

              <div className="ultima-accion-box">
                <strong>Última acción:</strong>
                <span>{proyecto.ultimaAccion}</span>
              </div>

              <button 
                className="sellar-btn"
                onClick={() => simularAprobacion(proyecto.estudiante)}
              >
                Sellar y Aprobar Documentación
              </button>
            </div>
          ))}
        </div>

        <hr className="separador-seccion" />

        {/* Sección 2: Gestión de Cargos */}
        <div className="gestion-cargos-header">
          <h2>Gestión de Personal y Comisión</h2>
          <button className="btn-editar-cargos" onClick={simularEdicionCargos}>
            ⚙️ Editar / Añadir Cargos
          </button>
        </div>

        <div className="cargos-grid">
          {personalComision.map((persona) => (
            <div className="cargo-card" key={persona.id}>
              <div className="cargo-avatar">
                {persona.nombre.charAt(4)} 
              </div>
              <div className="cargo-info">
                <h4>{persona.nombre}</h4>
                <span className="cargo-rol">{persona.rol}</span>
                <span className="cargo-correo">{persona.correo}</span>
              </div>
            </div>
          ))}
        </div>

      </main>
    </section>
  );
}

export default CoordinadorDashboard;