import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

function DirectorF2Dashboard({ usuario, onCerrarSesion }) {
  const API_URL = "http://localhost:3001";

  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [rubricaPdf, setRubricaPdf] = useState(null);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [pdfActual, setPdfActual] = useState("");

  const cargarProyectosF2 = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/proyectos/fase2/todos`);
      const data = await respuesta.json();

      if (data.success) {
        setProyectos(data.data);
      }
    } catch (error) {
      console.error("Error al cargar proyectos F2:", error);
      toast.error("Error al cargar proyectos F2");
    }
  }, []);

  useEffect(() => {
    cargarProyectosF2();
  }, [cargarProyectosF2]);

  const pendientes = proyectos.filter(
    (p) => p.estado === "APROBADO_COMISION" || p.estado === "EN_REVISION_F2"
  );

  const completados = proyectos.filter(
    (p) =>
      p.estado === "RUBRICA_SUBIDA" ||
      p.estado === "APROBADO_F2" ||
      p.estado === "VALIDACION_LOCAL"
  );

  const formatearEstado = (estado) => {
    if (!estado) return "Sin estado";
    return estado.replace(/_/g, " ");
  };

  const construirUrlArchivo = (ruta) => {
    if (!ruta) return "";
    return `${API_URL}/${ruta.replace(/\\/g, "/")}`;
  };

  const verPDF = (ruta) => {
    if (!ruta) {
      toast.error("Este proyecto no tiene PDF");
      return;
    }

    setPdfActual(construirUrlArchivo(ruta));
    setVisorAbierto(true);
  };

  const seleccionarProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setRubricaPdf(null);
  };

  const subirRubrica = async () => {
    if (!proyectoSeleccionado) {
      toast.error("Selecciona un proyecto primero");
      return;
    }

    if (!rubricaPdf) {
      toast.error("Selecciona la rúbrica evaluada en PDF");
      return;
    }

    const formData = new FormData();
    formData.append("rubricaPdf", rubricaPdf);

    // Datos para historial de actividad
    formData.append("usuario_id", usuario.id);
    formData.append("usuario_nombre", usuario.nombre);
    formData.append("usuario_rol", usuario.rol);
    formData.append(
      "detalle",
      "El Director de Titulación subió la rúbrica evaluada del expediente."
    );

    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/rubrica/${proyectoSeleccionado.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success(data.mensaje || "Rúbrica evaluada subida correctamente");
        setRubricaPdf(null);

        if (data.proyecto) {
          setProyectoSeleccionado({
            ...proyectoSeleccionado,
            ...data.proyecto,
            estudiante_nombre: proyectoSeleccionado.estudiante_nombre,
          });
        } else {
          setProyectoSeleccionado({
            ...proyectoSeleccionado,
            estado: "RUBRICA_SUBIDA",
          });
        }

        cargarProyectosF2();
      } else {
        toast.error(data.mensaje || "No se pudo subir la rúbrica");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al subir la rúbrica");
    }
  };

  const aprobarF2 = async (id) => {
    if (proyectoSeleccionado?.estado !== "RUBRICA_SUBIDA") {
      toast.error("Primero debes subir la rúbrica evaluada");
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/api/proyectos/estado/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "APROBADO_F2",
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_rol: usuario.rol,
          detalle:
            "El Director de Titulación aprobó la Fase 2 y envió el expediente a Coordinación.",
        }),
      });

      const data = await respuesta.json();

      if (data.success) {
        toast.success("Proyecto aprobado en Fase 2 y enviado a Coordinación");

        await cargarProyectosF2();
        setProyectoSeleccionado(null);
      } else {
        toast.error(data.mensaje || "No se pudo actualizar el proyecto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al aprobar Fase 2");
    }
  };

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="DIRECTOR F2"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content director-layout">
        <div className="director-left">
          <h2 className="director-title">Panel Director Titulación - Fase 2</h2>

          <div className="card director-card-section">
            <h4 className="director-section-title muted">PENDIENTES DE RÚBRICA</h4>

            {pendientes.length === 0 ? (
              <p className="director-empty">No hay pendientes.</p>
            ) : (
              pendientes.map((p) => (
                <div
                  key={p.id}
                  onClick={() => seleccionarProyecto(p)}
                  className={`director-expediente ${
                    proyectoSeleccionado?.id === p.id ? "active pending" : ""
                  }`}
                >
                  <div className="director-expediente-head">
                    <h4>{p.estudiante_nombre}</h4>
                    <span className="director-status pending">
                      {formatearEstado(p.estado)}
                    </span>
                  </div>
                  <p>{p.titulo}</p>
                </div>
              ))
            )}
          </div>

          <div className="card director-card-section">
            <h4 className="director-section-title success">
              RÚBRICAS / F2 COMPLETADAS
            </h4>

            {completados.length === 0 ? (
              <p className="director-empty">No hay expedientes completados.</p>
            ) : (
              completados.map((p) => (
                <div
                  key={p.id}
                  onClick={() => seleccionarProyecto(p)}
                  className={`director-expediente done ${
                    proyectoSeleccionado?.id === p.id ? "active done" : ""
                  }`}
                >
                  <div className="director-expediente-head">
                    <h4>{p.estudiante_nombre}</h4>
                    <span className="director-status done">
                      {formatearEstado(p.estado)}
                    </span>
                  </div>
                  <p>{p.titulo}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="director-right">
          {!proyectoSeleccionado ? (
            <div className="card director-placeholder">
              <h3>Selecciona un expediente de la lista izquierda</h3>
            </div>
          ) : (
            <div className="card director-detail">
              <div className="director-detail-header">
                <div>
                  <h2>Expediente: {proyectoSeleccionado.estudiante_nombre}</h2>
                  <p>{proyectoSeleccionado.titulo}</p>
                </div>

                <span className="estado-comision">
                  {formatearEstado(proyectoSeleccionado.estado)}
                </span>
              </div>

              <div className="director-info-box">
                <h4>Historial de aprobación</h4>
                <p>
                  Este proyecto fue aprobado por la Comisión de Titulación y está
                  listo para la revisión de Fase 2.
                </p>
              </div>

              {proyectoSeleccionado.estado === "APROBADO_F2" ||
              proyectoSeleccionado.estado === "VALIDACION_LOCAL" ? (
                <div className="director-completed-box">
                  <h3>Trámite F2 completado</h3>
                  <p>
                    Este expediente ya fue aprobado por Dirección de Titulación y
                    enviado a la siguiente etapa.
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="director-subtitle">
                    1. Leer documento aprobado por Comisión
                  </h4>

                  <div className="director-actions">
                    <button
                      className="director-btn primary"
                      onClick={() => verPDF(proyectoSeleccionado.ruta_archivo)}
                    >
                      👁️ Ver PDF
                    </button>
                  </div>

                  <h4 className="director-subtitle">2. Subir rúbrica evaluada</h4>

                  <div className="director-upload-box">
                    <input
                      type="file"
                      accept=".pdf"
                      className="director-file-input"
                      onChange={(e) => setRubricaPdf(e.target.files[0])}
                    />

                    <button className="director-btn outline" onClick={subirRubrica}>
                      📄 Subir Rúbrica Evaluada
                    </button>
                  </div>

                  {proyectoSeleccionado.estado === "RUBRICA_SUBIDA" && (
                    <div className="director-rubrica-ok">
                      ✅ Rúbrica evaluada subida correctamente. Ya puedes aprobar F2.
                    </div>
                  )}

                  <h4 className="director-subtitle">3. Aprobación final F2</h4>

                  <div className="director-actions">
                    {proyectoSeleccionado.estado === "RUBRICA_SUBIDA" ? (
                      <button
                        className="director-btn success"
                        onClick={() => aprobarF2(proyectoSeleccionado.id)}
                      >
                        ✅ Aprobar F2 y enviar a Coordinación
                      </button>
                    ) : (
                      <p className="director-note">
                        Primero debes subir la rúbrica evaluada para habilitar la
                        aprobación.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

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
              title="Visor PDF Director"
            ></iframe>
          </div>
        )}
      </main>
    </section>
  );
}

export default DirectorF2Dashboard;