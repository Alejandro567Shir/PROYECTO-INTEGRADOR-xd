import { useState } from "react";
import Sidebar from "../components/Sidebar";

function DocenteDashboard({ usuario, onCerrarSesion }) {
 
  const [estudiantesAsignados] = useState([
    {
      id: 1,
      nombre: "María Gómez",
      codigo: "u10",
      tema: "Redes IoT para Agricultura",
      estado: "En Revisión F1",
      colorEstado: "estado-badge azul",
    }
  ]);

  const simularVerPDF = (nombre) => alert(`Abriendo visor de PDF para el perfil de ${nombre}...`);
  const simularDescargar = (nombre) => alert(`Descargando el documento original de ${nombre}...`);
  const simularSubirCorreccion = (nombre) => alert(`Abriendo ventana para subir el PDF con las marcas y correcciones hechas para ${nombre}...`);
  const simularComentarYDevolver = (nombre) => alert(`Abriendo formulario para escribir recomendaciones y devolver el trámite a ${nombre}...`);

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="DOCENTE F1"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <h1>Panel Docente - Fase 1 (Perfil y Anteproyecto)</h1>

        <div className="card" style={{ marginTop: "24px" }}>
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Tema</th>
                <th>Estado</th>
                <th>Acciones de Revisión</th>
              </tr>
            </thead>
            <tbody>
              {estudiantesAsignados.map((estudiante) => (
                <tr key={estudiante.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{estudiante.nombre}</span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{estudiante.codigo}</span>
                    </div>
                  </td>
                  <td>{estudiante.tema}</td>
                  <td>
                    <span className={estudiante.colorEstado}>{estudiante.estado}</span>
                  </td>
                  <td>
                
                    <div className="acciones-mockup">
                      <button onClick={() => simularVerPDF(estudiante.nombre)} className="btn-mockup btn-ver" title="Ver documento en el navegador">
                        Ver PDF
                      </button>
                      
                      <button onClick={() => simularDescargar(estudiante.nombre)} className="btn-mockup btn-descargar" title="Descargar documento original">
                        Descargar
                      </button>
                      
                      <button onClick={() => simularSubirCorreccion(estudiante.nombre)} className="btn-mockup btn-subir" title="Subir PDF con correcciones">
                        Subir Corrección
                      </button>
                      
                      <button onClick={() => simularComentarYDevolver(estudiante.nombre)} className="btn-mockup btn-devolver" title="Escribir recomendación y devolver al estudiante">
                        Comentar y Devolver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </section>
  );
}

export default DocenteDashboard;