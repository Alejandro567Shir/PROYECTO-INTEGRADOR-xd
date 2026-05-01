import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

function ComisionDeTitulacion({ usuario, onCerrarSesion }) {
  const API_URL = "http://localhost:3001";

  const [proyectos, setProyectos] = useState([]);
  const [revisiones, setRevisiones] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [comentario, setComentario] = useState("");
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [pdfActual, setPdfActual] = useState("");

  const rolReal = usuario.rol_original || usuario.rol;
  const esSecretaria = rolReal === "SECRETARIA";

  const formatearRol = (rol) => {
    if (!rol) return "Sin rol";
    return rol.replace(/_/g, " ");
  };

  const formatearEstado = (estado) => {
    if (!estado) return "Sin estado";
    return estado.replace(/_/g, " ");
  };

  const obtenerRevisionesVigentes = (proyecto) => {
    const revs = revisiones[proyecto.id] || [];

    if (!proyecto.fecha_creacion) return revs;

    const fechaProyecto = new Date(proyecto.fecha_creacion).getTime();

    return revs.filter((rev) => {
      if (!rev.fecha) return true;

      const fechaRevision = new Date(rev.fecha).getTime();

      if (Number.isNaN(fechaRevision) || Number.isNaN(fechaProyecto)) {
        return true;
      }

      return fechaRevision >= fechaProyecto;
    });
  };

  const obtenerMiRevision = (proyecto) => {
    const revs = obtenerRevisionesVigentes(proyecto);

    return revs.find(
      (rev) =>
        Number(rev.usuario_id) === Number(usuario.id) ||
        rev.rol_revision === rolReal
    );
  };

  const yaDiVistoBueno = (proyecto) => {
    const miRevision = obtenerMiRevision(proyecto);
    return miRevision?.decision === "APROBADO";
  };

  const yaPediCorreccion = (proyecto) => {
    const miRevision = obtenerMiRevision(proyecto);
    return miRevision?.decision === "CORRECCION";
  };

  const hayCorreccionesPendientes = (proyecto) => {
    const revs = obtenerRevisionesVigentes(proyecto);
    return revs.some((rev) => rev.decision === "CORRECCION");
  };

  const puedeEnviarADirector = (proyecto) => {
    const revs = obtenerRevisionesVigentes(proyecto);

    const docenteOk = revs.some(
      (rev) => rev.rol_revision === "DOCENTE" && rev.decision === "APROBADO"
    );

    const directorOk = revs.some(
      (rev) =>
        rev.rol_revision === "DIRECTOR_TITULACION" &&
        rev.decision === "APROBADO"
    );

    const coordinadorOk = revs.some(
      (rev) =>
        rev.rol_revision === "COORDINADOR_CARRERA" &&
        rev.decision === "APROBADO"
    );

    const existeCorreccion = revs.some((rev) => rev.decision === "CORRECCION");

    return docenteOk && directorOk && coordinadorOk && !existeCorreccion;
  };

  const cargarRevisiones = useCallback(async (proyectoId) => {
    try {
      const res = await fetch(`${API_URL}/api/comision/revisiones/${proyectoId}`);
      const data = await res.json();

      if (data.success) {
        setRevisiones((prev) => ({
          ...prev,
          [proyectoId]: data.data,
        }));
      }
    } catch (error) {
      console.error("Error al cargar revisiones:", error);
      toast.error("Error al cargar revisiones de comisión");
    }
  }, []);

  const cargarProyectos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/comision/proyectos`);
      const data = await res.json();

      if (data.success) {
        setProyectos(data.data);
        data.data.forEach((proyecto) => cargarRevisiones(proyecto.id));
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar proyectos de comisión");
    }
  }, [cargarRevisiones]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  const construirUrlArchivo = (rutaArchivo) => {
    if (!rutaArchivo) return "";
    return `${API_URL}/${rutaArchivo.replace(/\\/g, "/")}`;
  };

  const verPDF = (rutaArchivo) => {
    if (!rutaArchivo) {
      toast.error("Este proyecto no tiene PDF");
      return;
    }

    setPdfActual(construirUrlArchivo(rutaArchivo));
    setVisorAbierto(true);
  };

  const descargarPDF = (rutaArchivo, estudiante) => {
    if (!rutaArchivo) {
      toast.error("Este proyecto no tiene PDF");
      return;
    }

    const link = document.createElement("a");
    link.href = construirUrlArchivo(rutaArchivo);
    link.download = `Tesis_${estudiante.replace(/\s+/g, "_")}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirModalCorreccion = (proyecto) => {
    setProyectoActivo(proyecto);
    setComentario("");
    setModalAbierto(true);
  };

  const guardarRevision = async (decision, proyecto = proyectoActivo) => {
    if (!proyecto?.id) {
      toast.error("No hay proyecto seleccionado");
      return;
    }

    if (decision === "CORRECCION" && !comentario.trim()) {
      toast.error("Escribe la corrección antes de guardar");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/comision/revision/${proyecto.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          rol_revision: rolReal,
          decision,
          comentario: decision === "APROBADO" ? "Visto bueno" : comentario,
          usuario_nombre: usuario.nombre,
          usuario_rol: rolReal,
          detalle:
            decision === "APROBADO"
              ? `${formatearRol(rolReal)} ${usuario.nombre} dio visto bueno al proyecto de ${proyecto.estudiante_nombre}.`
              : `${formatearRol(rolReal)} ${usuario.nombre} solicitó correcciones al proyecto de ${proyecto.estudiante_nombre}: ${comentario}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          decision === "APROBADO"
            ? "Visto bueno registrado"
            : "Corrección registrada"
        );

        setModalAbierto(false);
        setComentario("");
        setProyectoActivo(null);

        await cargarRevisiones(proyecto.id);
      } else {
        toast.error(data.mensaje || "Error al guardar revisión");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor");
    }
  };

  const enviarCorrecciones = async (proyecto) => {
    if (!hayCorreccionesPendientes(proyecto)) {
      toast.error("No hay correcciones para notificar");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/comision/enviar-correcciones/${proyecto.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre,
            usuario_rol: rolReal,
            detalle: `Secretaría notificó al estudiante ${proyecto.estudiante_nombre} las correcciones solicitadas por Comisión.`,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(data.mensaje || "Correcciones notificadas al estudiante");
        cargarProyectos();
      } else {
        toast.error(data.mensaje || "Error al enviar correcciones");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar correcciones");
    }
  };

  const aprobarComision = async (proyecto) => {
    if (!puedeEnviarADirector(proyecto)) {
      toast.error("Faltan vistos buenos o existen correcciones pendientes");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/comision/aprobar/${proyecto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_rol: rolReal,
          detalle: `Secretaría envió el proyecto de ${proyecto.estudiante_nombre} al Director F2 después de recibir el visto bueno de Docente, Director y Coordinador.`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.mensaje || "Proyecto enviado a Director F2");
        cargarProyectos();
      } else {
        toast.error(data.mensaje || "Error al aprobar comisión");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al aprobar comisión");
    }
  };

  const renderAccionesMiembroComision = (proyecto) => {
    if (proyecto.estado === "CORRECCION_COMISION") {
      return (
        <span className="estado-info-text estado-correccion-text">
          ⏳ Esperando corrección del estudiante
        </span>
      );
    }

    if (yaDiVistoBueno(proyecto)) {
      return (
        <span className="estado-info-text estado-aprobado-text">
          ✅ Aprobado por ti
        </span>
      );
    }

    if (yaPediCorreccion(proyecto)) {
      return (
        <span className="estado-info-text estado-correccion-text">
          📝 Corrección registrada
        </span>
      );
    }

    return (
      <>
        <button
          className="btn-mockup btn-aprobar"
          onClick={() => guardarRevision("APROBADO", proyecto)}
        >
          ✅ Visto Bueno
        </button>

        <button
          className="btn-mockup btn-devolver"
          onClick={() => abrirModalCorreccion(proyecto)}
        >
          📝 Corrección
        </button>
      </>
    );
  };

  const renderAccionesSecretaria = (proyecto) => {
    if (proyecto.estado === "CORRECCION_COMISION") {
      return (
        <span className="estado-info-text estado-correccion-text">
          📩 Correcciones notificadas
        </span>
      );
    }

    if (hayCorreccionesPendientes(proyecto)) {
      return (
        <button
          className="btn-mockup btn-devolver"
          onClick={() => enviarCorrecciones(proyecto)}
        >
          📩 Notificar Correcciones
        </button>
      );
    }

    if (puedeEnviarADirector(proyecto)) {
      return (
        <button
          className="btn-mockup btn-aprobar"
          onClick={() => aprobarComision(proyecto)}
        >
          ✅ Enviar a Director F2
        </button>
      );
    }

    return (
      <span className="estado-info-text">
        ⏳ Esperando vistos buenos
      </span>
    );
  };

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="COMISIÓN"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <div className="secretaria-header">
          <h1>Comisión de Titulación</h1>
        </div>

        <div className="cards-grid">
          <div className="mini-card">
            <p>En Comisión</p>
            <h2 className="azul-num">{proyectos.length}</h2>
          </div>

          <div className="mini-card">
            <p>Mi Rol</p>
            <h2 className="naranja-num">{formatearRol(rolReal)}</h2>
          </div>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Tema / Proyecto</th>
                <th>Estado</th>
                <th>Revisiones de Comisión</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {proyectos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="tabla-vacia">
                    No hay proyectos en comisión.
                  </td>
                </tr>
              ) : (
                proyectos.map((proyecto) => {
                  const revisionesVigentes = obtenerRevisionesVigentes(proyecto);

                  return (
                    <tr key={proyecto.id}>
                      <td>{proyecto.estudiante_nombre}</td>

                      <td>{proyecto.titulo}</td>

                      <td>
                        <span className="estado-comision">
                          {formatearEstado(proyecto.estado)}
                        </span>
                      </td>

                      <td>
                        <div className="revision-lista">
                          {revisionesVigentes.length === 0 ? (
                            <span className="revision-pendiente">
                              Sin revisiones todavía
                            </span>
                          ) : (
                            revisionesVigentes.map((rev) => (
                              <div key={rev.id} className="revision-item">
                                <strong>{formatearRol(rev.rol_revision)}:</strong>{" "}
                                <span
                                  className={
                                    rev.decision === "APROBADO"
                                      ? "texto-ok"
                                      : "texto-correccion"
                                  }
                                >
                                  {rev.decision === "APROBADO"
                                    ? "✅ Visto bueno"
                                    : `⚠️ ${rev.comentario}`}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="acciones-mockup">
                          <button
                            className="btn-mockup btn-ver"
                            onClick={() => verPDF(proyecto.ruta_archivo)}
                          >
                            👁️ Ver
                          </button>

                          <button
                            className="btn-mockup btn-descargar"
                            onClick={() =>
                              descargarPDF(
                                proyecto.ruta_archivo,
                                proyecto.estudiante_nombre
                              )
                            }
                          >
                            ⬇️ Descargar
                          </button>

                          {esSecretaria
                            ? renderAccionesSecretaria(proyecto)
                            : renderAccionesMiembroComision(proyecto)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {modalAbierto && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Corrección para {proyectoActivo?.estudiante_nombre}</h2>

              <p className="modal-subtitle">
                Escribe tu observación como miembro de comisión.
              </p>

              <textarea
                className="modal-textarea"
                placeholder="Ejemplo: corregir objetivos, mejorar marco teórico..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />

              <div className="modal-actions">
                <button
                  className="btn-cancelar"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>

                <button
                  className="btn-enviar-eval"
                  onClick={() => guardarRevision("CORRECCION")}
                >
                  Guardar Corrección
                </button>
              </div>
            </div>
          </div>
        )}

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
              title="Visor PDF Comisión"
            ></iframe>
          </div>
        )}
      </main>
    </section>
  );
}

export default ComisionDeTitulacion;