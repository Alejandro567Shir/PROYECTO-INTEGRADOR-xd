import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { obtenerProyectosDocente } from "../services/api";

function DocenteDashboard({ usuario, onCerrarSesion }) {
  const API_URL = "http://localhost:3001";

  const [estudiantesAsignados, setEstudiantesAsignados] = useState([]);

  // Modal comentarios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [comentarios, setComentarios] = useState("");

  // Visor PDF
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [pdfActual, setPdfActual] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      const resultado = await obtenerProyectosDocente(usuario.id);

      if (resultado.success) {
        setEstudiantesAsignados(resultado.data);
      } else {
        toast.error(resultado.mensaje || "No se pudieron cargar los proyectos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar proyectos del docente");
    }
  }, [usuario.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getColorPorEstado = (estado) => {
    if (estado === "EN_REVISION_F1") return "estado-badge azul";
    if (estado === "ESPERANDO_CORRECCION") return "estado-badge naranja";
    if (estado === "APROBADO_F1") return "estado-badge verde";
    if (estado === "EN_COMISION") return "estado-badge morado-suave";
    if (estado === "RECHAZADO_F1") return "estado-badge rojo";
    return "estado-badge";
  };

  const verPDF = (rutaArchivo) => {
    if (!rutaArchivo) {
      toast.error("Sin archivo válido.");
      return;
    }

    const rutaLimpia = rutaArchivo.replace(/\\/g, "/");
    setPdfActual(`${API_URL}/${rutaLimpia}`);
    setVisorAbierto(true);
  };

  const descargarPDF = (rutaArchivo, nombreEstudiante) => {
    if (!rutaArchivo) {
      toast.error("Sin archivo válido.");
      return;
    }

    const rutaLimpia = rutaArchivo.replace(/\\/g, "/");
    const link = document.createElement("a");

    link.href = `${API_URL}/${rutaLimpia}`;
    link.download = `Anteproyecto_${nombreEstudiante.replace(/\s+/g, "_")}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Descarga iniciada");
  };

  const abrirModalCorreccion = (estudiante) => {
    setProyectoActivo(estudiante);
    setComentarios("");
    setModalAbierto(true);
  };

  const enviarCorreccion = async () => {
    if (!comentarios.trim()) {
      toast.error("Por favor, escribe las pautas y correcciones.");
      return;
    }

    if (!proyectoActivo?.id) {
      toast.error("No hay proyecto seleccionado.");
      return;
    }

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/proyectos/correccion/${proyectoActivo.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comentarios,
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre,
            usuario_rol: usuario.rol,
            detalle: `${usuario.nombre} solicitó correcciones al proyecto de ${proyectoActivo.estudiante_nombre}: ${comentarios}`,
          }),
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success(data.mensaje || "Correcciones enviadas correctamente");
        setModalAbierto(false);
        setComentarios("");
        setProyectoActivo(null);
        cargarDatos();
      } else {
        toast.error(data.mensaje || "No se pudieron enviar las correcciones");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la corrección.");
    }
  };

  const cambiarEstadoProyecto = async (proyecto, nuevoEstado) => {
    let detalle = "";

    if (nuevoEstado === "EN_COMISION") {
      detalle = `El docente ${usuario.nombre} aprobó la Fase 1 del proyecto de ${proyecto.estudiante_nombre} y lo envió a Comisión de Titulación.`;
    } else if (nuevoEstado === "RECHAZADO_F1") {
      detalle = `El docente ${usuario.nombre} no aprobó el proyecto de ${proyecto.estudiante_nombre}.`;
    } else {
      detalle = `El docente ${usuario.nombre} cambió el estado del proyecto a ${nuevoEstado.replace(/_/g, " ")}.`;
    }

    try {
      const respuesta = await fetch(`${API_URL}/api/proyectos/estado/${proyecto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_rol: usuario.rol,
          detalle,
        }),
      });

      const data = await respuesta.json();

      if (data.success) {
        if (nuevoEstado === "EN_COMISION") {
          toast.success("Proyecto aprobado y enviado a Comisión");
        } else if (nuevoEstado === "RECHAZADO_F1") {
          toast.success("Proyecto marcado como no aprobado");
        } else {
          toast.success(data.mensaje || "Estado actualizado correctamente");
        }

        cargarDatos();
      } else {
        toast.error(data.mensaje || "No se pudo actualizar el estado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="DOCENTE F1"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <h1>Panel Docente - Fase 1</h1>

        <div className="card tabla-docente-card">
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
                  <td colSpan="4" className="tabla-vacia">
                    No tienes proyectos.
                  </td>
                </tr>
              ) : (
                estudiantesAsignados.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td>
                      <div className="estudiante-info-tabla">
                        <span>{estudiante.estudiante_nombre}</span>
                        <span className="estudiante-codigo">
                          ID Alumno: {estudiante.estudiante_codigo}
                        </span>
                      </div>
                    </td>

                    <td>{estudiante.tema}</td>

                    <td>
                      <span className={getColorPorEstado(estudiante.estado)}>
                        {estudiante.estado.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td>
                      <div className="acciones-mockup">
                        <button
                          onClick={() => verPDF(estudiante.ruta_archivo)}
                          className="btn-mockup btn-ver"
                          title="Ver PDF"
                        >
                          👁️ Ver
                        </button>

                        <button
                          onClick={() =>
                            descargarPDF(
                              estudiante.ruta_archivo,
                              estudiante.estudiante_nombre
                            )
                          }
                          className="btn-mockup btn-descargar"
                          title="Descargar PDF"
                        >
                          ⬇️ Descargar
                        </button>

                        {estudiante.estado === "EN_REVISION_F1" && (
                          <>
                            <button
                              onClick={() => abrirModalCorreccion(estudiante)}
                              className="btn-mockup btn-devolver"
                              title="Enviar correcciones"
                            >
                              📝 Comentar
                            </button>

                            <button
                              onClick={() =>
                                cambiarEstadoProyecto(estudiante, "RECHAZADO_F1")
                              }
                              className="btn-mockup btn-rechazar"
                              title="No aprobar proyecto"
                            >
                              ❌ No Aprobado
                            </button>

                            <button
                              onClick={() =>
                                cambiarEstadoProyecto(estudiante, "EN_COMISION")
                              }
                              className="btn-mockup btn-aprobar"
                              title="Aprobar y enviar a Comisión"
                            >
                              ✅ Aprobar F1
                            </button>
                          </>
                        )}

                        {estudiante.estado === "ESPERANDO_CORRECCION" && (
                          <span className="estado-info-text">
                            Esperando corrección del estudiante
                          </span>
                        )}

                        {estudiante.estado === "EN_COMISION" && (
                          <span className="estado-info-text estado-aprobado-text">
                            ✅ Aprobado y enviado a Comisión
                          </span>
                        )}

                        {estudiante.estado === "APROBADO_F1" && (
                          <span className="estado-info-text estado-aprobado-text">
                            ✅ Aprobado F1
                          </span>
                        )}

                        {estudiante.estado === "RECHAZADO_F1" && (
                          <span className="estado-info-text estado-rechazado-text">
                            ❌ Proyecto no aprobado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISOR PDF */}
        {visorAbierto && (
          <div className="visor-pdf-overlay">
            <div className="visor-pdf-header">
              <button
                className="btn-cerrar-visor"
                onClick={() => setVisorAbierto(false)}
              >
                ✕ Cerrar PDF
              </button>
            </div>

            <iframe
              src={pdfActual}
              className="visor-iframe"
              title="Visor de PDF"
            ></iframe>
          </div>
        )}

        {/* MODAL COMENTARIOS */}
        {modalAbierto && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Comentarios para {proyectoActivo?.estudiante_nombre}</h2>

              <p className="modal-subtitle">
                Escribe las correcciones que debe realizar el estudiante en su PDF.
              </p>

              <textarea
                className="modal-textarea"
                placeholder="Ejemplo: Te falta mejorar los objetivos específicos y corregir la norma APA..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
              />

              <div className="modal-actions">
                <button
                  onClick={() => setModalAbierto(false)}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>

                <button onClick={enviarCorreccion} className="btn-enviar-eval">
                  Enviar Pautas
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </section>
  );
}

export default DocenteDashboard;