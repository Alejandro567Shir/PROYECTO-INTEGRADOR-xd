import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerProyectosDocente } from "../services/api";

function DocenteDashboard({ usuario, onCerrarSesion }) {
  const [estudiantesAsignados, setEstudiantesAsignados] = useState([]);
  
  // Estados para Modal de Comentarios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [comentarios, setComentarios] = useState("");

  // Estados para el Visor de PDF
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [pdfActual, setPdfActual] = useState("");

  const cargarDatos = useCallback(async () => {
    const resultado = await obtenerProyectosDocente(usuario.id);
    if (resultado.success) {
      setEstudiantesAsignados(resultado.data);
    }
  }, [usuario.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getColorPorEstado = (estado) => {
    if (estado === "EN_REVISION_F1") return "estado-badge azul";
    if (estado === "ESPERANDO_CORRECCION") return "estado-badge"; 
    if (estado === "APROBADO_F1") return "estado-badge" /* Puedes ponerle clase verde en tu CSS */; 
    if (estado === "RECHAZADO_F1") return "estado-badge" /* Puedes ponerle clase roja en tu CSS */;
    return "estado-badge"; 
  };

  const verPDF = (rutaArchivo) => {
    if (!rutaArchivo) return alert("Sin archivo válido.");
    setPdfActual(`http://localhost:3001/${rutaArchivo.replace(/\\/g, '/')}`);
    setVisorAbierto(true);
  };

  const descargarPDF = (rutaArchivo, nombreEstudiante) => {
    if (!rutaArchivo) return alert("Sin archivo válido.");
    const link = document.createElement('a');
    link.href = `http://localhost:3001/${rutaArchivo.replace(/\\/g, '/')}`;
    link.download = `Anteproyecto_${nombreEstudiante.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirModalCorreccion = (estudiante) => {
    setProyectoActivo(estudiante);
    setComentarios("");
    setModalAbierto(true);
  };

  const enviarCorreccion = async () => {
    if (!comentarios) return alert("Por favor, escribe las pautas y correcciones.");
    const formData = new FormData();
    formData.append("comentarios", comentarios);
    try {
      const respuesta = await fetch(`http://localhost:3001/api/proyectos/correccion/${proyectoActivo.id}`, {
        method: "PUT",
        body: formData,
      });
      const data = await respuesta.json();
      if (data.success) {
        alert("✅ " + data.mensaje);
        setModalAbierto(false);
        cargarDatos(); 
      }
    } catch (error) {
      alert("Error al enviar la corrección.");
    }
  };

  // --- FUNCIÓN MAESTRA QUE MANDA A LA BASE DE DATOS LA DECISIÓN ---
  const cambiarEstadoProyecto = async (id, nuevoEstado) => {
    if(!window.confirm(`¿Seguro que deseas cambiar el estado a ${nuevoEstado.replace(/_/g, " ")}?`)) return;
    
    try {
      await fetch(`http://localhost:3001/api/proyectos/estado/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      cargarDatos(); // Recarga la tabla mágicamente
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  return (
    <section className="panel">
      <Sidebar nombre={usuario.nombre} rolTexto="DOCENTE F1" onCerrarSesion={onCerrarSesion} onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })} />

      <main className="content">
        <h1>Panel Docente - Fase 1</h1>

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
              {estudiantesAsignados.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No tienes proyectos.</td>
                </tr>
              ) : (
                estudiantesAsignados.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{estudiante.estudiante_nombre}</span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>ID Alumno: {estudiante.estudiante_codigo}</span>
                      </div>
                    </td>
                    <td>{estudiante.tema}</td>
                    <td>
                      <span className={getColorPorEstado(estudiante.estado)}>{estudiante.estado.replace(/_/g, " ")}</span>
                    </td>
                    <td>
                      <div className="acciones-mockup">
                        <button onClick={() => verPDF(estudiante.ruta_archivo)} className="btn-mockup btn-ver">👁️ Ver</button>
                        <button onClick={() => descargarPDF(estudiante.ruta_archivo, estudiante.estudiante_nombre)} className="btn-mockup btn-descargar">⬇️ Descargar</button>
                        <button onClick={() => abrirModalCorreccion(estudiante)} className="btn-mockup btn-devolver">📝 Comentar</button>

                        {/* BOTONES DE DECISIÓN FINAL CONECTADOS */}
                        <button onClick={() => cambiarEstadoProyecto(estudiante.id, 'RECHAZADO_F1')} className="btn-mockup" style={{background: '#ef4444', color: 'white'}} title="Rechazar Proyecto">
                          ❌ No Aprobado
                        </button>

                        <button onClick={() => cambiarEstadoProyecto(estudiante.id, 'APROBADO_F1')} className="btn-mockup" style={{background: '#10b981', color: 'white'}} title="Aprobar y pasar a F2">
                          ✅ Aprobar F1
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISOR DE PDF INTEGRADO */}
        {visorAbierto && (
          <div className="visor-pdf-overlay">
            <div className="visor-pdf-header">
              <button className="btn-cerrar-visor" onClick={() => setVisorAbierto(false)}>✖ Cerrar PDF</button>
            </div>
            <iframe src={pdfActual} className="visor-iframe" title="Visor de PDF"></iframe>
          </div>
        )}

        {/* VENTANA MODAL PARA COMENTARIOS */}
        {modalAbierto && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Comentarios para {proyectoActivo?.estudiante_nombre}</h2>
              <p className="modal-subtitle">Escribe las correcciones que debe realizar el estudiante en su PDF.</p>
              
              <textarea 
                className="modal-textarea" 
                placeholder="Ejemplo: Te falta mejorar los objetivos específicos y corregir la norma APA..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
              />

              <div className="modal-actions">
                <button onClick={() => setModalAbierto(false)} className="btn-cancelar">Cancelar</button>
                <button onClick={enviarCorreccion} className="btn-enviar-eval">Enviar Pautas</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </section>
  );
}

export default DocenteDashboard;