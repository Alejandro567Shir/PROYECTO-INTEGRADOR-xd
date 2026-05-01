import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:3001";

function CoordinadorDashboard({ usuario, onCerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState("principal");

  const [proyectosCoordinacion, setProyectosCoordinacion] = useState([]);
  const [personalComision, setPersonalComision] = useState([]);
  const [historialActividad, setHistorialActividad] = useState([]);
  const [estudianteHistorialActivo, setEstudianteHistorialActivo] =
    useState("TODOS");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  const [documentosSellados, setDocumentosSellados] = useState({});
  const [documentosAdicionales, setDocumentosAdicionales] = useState({});

  const [visorAbierto, setVisorAbierto] = useState(false);
  const [pdfActual, setPdfActual] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    clave: "",
    rol: "DOCENTE",
    es_comision: false,
  });

  const cargarProyectosCoordinador = useCallback(async () => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/coordinacion/pendientes`
      );
      const data = await respuesta.json();

      if (data.success) {
        setProyectosCoordinacion(data.data);
      }
    } catch (error) {
      console.error("Error al cargar proyectos de coordinación:", error);
      toast.error("Error al cargar proyectos de coordinación");
    }
  }, []);

  const cargarPersonal = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/personal`);
      const data = await respuesta.json();

      if (data.success) {
        setPersonalComision(data.data);
      }
    } catch (error) {
      console.error("Error al cargar personal:", error);
      toast.error("Error al conectar con el servidor");
    }
  }, []);

  const cargarHistorialActividad = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/historial/actividad`);
      const data = await respuesta.json();

      if (data.success) {
        setHistorialActividad(data.data);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  }, []);

  useEffect(() => {
    cargarProyectosCoordinador();
    cargarPersonal();
    cargarHistorialActividad();
  }, [cargarProyectosCoordinador, cargarPersonal, cargarHistorialActividad]);

  // Esto hace que el historial se actualice automático cada 5 segundos.
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarHistorialActividad();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [cargarHistorialActividad]);

  // Esto actualiza el historial apenas entras al apartado.
  useEffect(() => {
    if (vistaActiva === "historial") {
      cargarHistorialActividad();
    }
  }, [vistaActiva, cargarHistorialActividad]);

  const proyectosPendientes = proyectosCoordinacion.filter(
    (proyecto) => proyecto.estado === "APROBADO_F2"
  );

  const proyectosEnviados = proyectosCoordinacion.filter(
    (proyecto) => proyecto.estado === "REVISION_SEDE_CENTRAL"
  );

  const personalVisible = personalComision.filter(
    (persona) =>
      persona.rol !== "COORDINADOR_CARRERA" &&
      persona.correo !== usuario.correo
  );

  const obtenerClaveHistorial = (item) => {
    return String(
      item.proyecto_id ||
        `${item.estudiante_nombre || "Sin estudiante"}-${
          item.titulo || "Sin título"
        }`
    );
  };

  const estudiantesHistorial = Array.from(
    historialActividad
      .reduce((mapa, item) => {
        const clave = obtenerClaveHistorial(item);

        if (!mapa.has(clave)) {
          mapa.set(clave, {
            key: clave,
            estudiante_nombre: item.estudiante_nombre || "Sin estudiante",
            titulo: item.titulo || "Sin título",
            total: 0,
          });
        }

        mapa.get(clave).total += 1;
        return mapa;
      }, new Map())
      .values()
  );

  const historialFiltrado =
    estudianteHistorialActivo === "TODOS"
      ? historialActividad
      : historialActividad.filter(
          (item) => obtenerClaveHistorial(item) === estudianteHistorialActivo
        );

  const formatearAccion = (accion) => {
    if (!accion) return "Actividad registrada";

    return accion
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  };

  const obtenerIconoActividad = (accion) => {
    if (!accion) return "🕒";
    if (accion.includes("CORRECCION")) return "📝";
    if (accion.includes("APROB")) return "✅";
    if (accion.includes("MATRIZ")) return "📤";
    if (accion.includes("RUBRICA")) return "📄";
    if (accion.includes("COMISION")) return "👥";
    if (accion.includes("DOCENTE")) return "👨‍🏫";
    return "🕒";
  };

  const construirUrlArchivo = (ruta) => {
    if (!ruta) return "";
    return `${API_URL}/${ruta.replace(/\\/g, "/")}`;
  };

  const verPDF = (ruta) => {
    if (!ruta) {
      toast.error("No existe archivo para visualizar");
      return;
    }

    setPdfActual(construirUrlArchivo(ruta));
    setVisorAbierto(true);
  };

  const descargarArchivo = (ruta, nombreArchivo = "documento.pdf") => {
    if (!ruta) {
      toast.error("No existe archivo para descargar");
      return;
    }

    const link = document.createElement("a");
    link.href = construirUrlArchivo(ruta);
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const seleccionarDocumentoSellado = (proyectoId, archivo) => {
    setDocumentosSellados((prev) => ({
      ...prev,
      [proyectoId]: archivo,
    }));
  };

  const seleccionarDocumentosAdicionales = (proyectoId, archivos) => {
    setDocumentosAdicionales((prev) => ({
      ...prev,
      [proyectoId]: Array.from(archivos),
    }));
  };

  const subirDocumentoSellado = async (proyecto) => {
    const documentoSellado = documentosSellados[proyecto.id];

    if (!documentoSellado) {
      toast.error("Debes subir el PDF sellado y firmado");
      return;
    }

    const formData = new FormData();
    formData.append("documentoSellado", documentoSellado);

    const adicionales = documentosAdicionales[proyecto.id] || [];
    adicionales.forEach((archivo) => {
      formData.append("documentosAdicionales", archivo);
    });

    formData.append("usuario_id", usuario.id);
    formData.append("usuario_nombre", usuario.nombre);
    formData.append("usuario_rol", usuario.rol);
    formData.append(
      "detalle",
      `El coordinador ${usuario.nombre} subió el documento sellado y firmado del expediente de ${proyecto.estudiante_nombre}, y lo envió a Matriz.`
    );

    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/coordinacion/sellar/${proyecto.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success(data.mensaje || "Documento sellado enviado correctamente");

        setDocumentosSellados((prev) => ({
          ...prev,
          [proyecto.id]: null,
        }));

        setDocumentosAdicionales((prev) => ({
          ...prev,
          [proyecto.id]: [],
        }));

        cargarProyectosCoordinador();
        cargarHistorialActividad();
      } else {
        toast.error(data.mensaje || "No se pudo subir el documento sellado");
      }
    } catch (error) {
      console.error("Error al subir documento sellado:", error);
      toast.error("Error al enviar documento sellado");
    }
  };

  const abrirModalNuevo = () => {
    setModoEditar(false);
    setPersonaSeleccionada(null);
    setFormulario({
      nombre: "",
      correo: "",
      clave: "",
      rol: "DOCENTE",
      es_comision: false,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (persona) => {
    setModoEditar(true);
    setPersonaSeleccionada(persona);
    setFormulario({
      nombre: persona.nombre || "",
      correo: persona.correo || "",
      clave: "",
      rol: persona.rol || "DOCENTE",
      es_comision: persona.es_comision || false,
    });
    setModalAbierto(true);
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;

    setFormulario({
      ...formulario,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const guardarPersonal = async (e) => {
    e.preventDefault();

    if (!formulario.nombre || !formulario.correo || !formulario.rol) {
      toast.error("Completa nombre, correo y rol");
      return;
    }

    if (!modoEditar && !formulario.clave) {
      toast.error("Para crear un usuario nuevo debes poner contraseña");
      return;
    }

    try {
      const url = modoEditar
        ? `${API_URL}/api/usuarios/personal/${personaSeleccionada.id}`
        : `${API_URL}/api/usuarios/personal`;

      const metodo = modoEditar ? "PUT" : "POST";

      const payload = {
        nombre: formulario.nombre,
        correo: formulario.correo,
        rol: formulario.rol,
        es_comision: formulario.es_comision,
      };

      if (formulario.clave.trim() !== "") {
        payload.clave = formulario.clave;
      }

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await respuesta.json();

      if (data.success) {
        toast.success(
          modoEditar
            ? "Personal actualizado correctamente"
            : "Personal agregado correctamente"
        );

        setModalAbierto(false);
        cargarPersonal();
      } else {
        toast.error(data.mensaje || "Error al guardar");
      }
    } catch (error) {
      console.error("Error al guardar personal:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  const eliminarPersonal = async (persona) => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios/personal/${persona.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success(`${persona.nombre} eliminado correctamente`);
        cargarPersonal();
      } else {
        toast.error(data.mensaje || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error al eliminar personal:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  const mostrarRolBonito = (rol, esComision) => {
    if (esComision) return "Comisión de Titulación";

    const roles = {
      DOCENTE: "Docente Evaluador F1",
      DIRECTOR_TITULACION: "Director de Titulación",
      SECRETARIA: "Secretaría",
    };

    return roles[rol] || rol;
  };

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="COORDINADOR"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => setVistaActiva("principal")}
      >
        <button
          className={`sidebar-extra-btn ${
            vistaActiva === "gestion" ? "activo" : ""
          }`}
          onClick={() => setVistaActiva("gestion")}
        >
          Gestión Personal y Comisión
        </button>

        <button
          className={`sidebar-extra-btn ${
            vistaActiva === "historial" ? "activo" : ""
          }`}
          onClick={() => setVistaActiva("historial")}
        >
          Historial de Actividad
        </button>
      </Sidebar>

      <main className="content">
        {vistaActiva === "principal" && (
          <>
            <h1>Validación de Coordinación (Sede Orellana)</h1>

            <p className="coordinador-subtitle">
              Revisa el expediente aprobado por Fase 2, descarga el documento,
              coloca el sello/firma institucional y sube la versión final.
            </p>

            <div className="coordinador-card-wrap">
              {proyectosPendientes.length === 0 ? (
                <div className="card coordinador-card-empty">
                  <h3>No hay proyectos pendientes</h3>
                  <p>
                    Cuando el Director apruebe Fase 2, el proyecto aparecerá
                    aquí.
                  </p>
                </div>
              ) : (
                proyectosPendientes.map((proyecto) => (
                  <div
                    className="card coordinador-expediente-card"
                    key={proyecto.id}
                  >
                    <div className="coordinador-expediente-header">
                      <div>
                        <h3>{proyecto.estudiante_nombre}</h3>
                        <p>{proyecto.titulo}</p>
                      </div>

                      <span className="estado-coordinacion">APROBADO F2</span>
                    </div>

                    <div className="ultima-accion-box">
                      <strong>Última acción:</strong>
                      <span>Validado por Director F2</span>
                    </div>

                    <div className="coordinador-actions">
                      <button
                        className="director-btn primary"
                        onClick={() => verPDF(proyecto.ruta_archivo)}
                      >
                        👁️ Ver PDF
                      </button>

                      <button
                        className="director-btn outline"
                        onClick={() =>
                          descargarArchivo(
                            proyecto.ruta_archivo,
                            `Tesis_${proyecto.estudiante_nombre}.pdf`
                          )
                        }
                      >
                        ⬇️ Descargar PDF
                      </button>

                      {proyecto.ruta_rubrica && (
                        <button
                          className="director-btn outline"
                          onClick={() => verPDF(proyecto.ruta_rubrica)}
                        >
                          📄 Ver Rúbrica
                        </button>
                      )}
                    </div>

                    <div className="coordinador-upload-section">
                      <h4>Subir documento sellado y firmado</h4>

                      <input
                        type="file"
                        accept=".pdf"
                        className="director-file-input"
                        onChange={(e) =>
                          seleccionarDocumentoSellado(
                            proyecto.id,
                            e.target.files[0]
                          )
                        }
                      />

                      <h4>Documentos adicionales opcionales</h4>

                      <input
                        type="file"
                        multiple
                        className="director-file-input"
                        onChange={(e) =>
                          seleccionarDocumentosAdicionales(
                            proyecto.id,
                            e.target.files
                          )
                        }
                      />

                      <button
                        className="sellar-btn"
                        onClick={() => subirDocumentoSellado(proyecto)}
                      >
                        ✅ Subir sellado y enviar a Matriz
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {proyectosEnviados.length > 0 && (
              <>
                <hr className="separador-seccion" />

                <h2>Expedientes enviados a Matriz</h2>

                <div className="cargos-grid">
                  {proyectosEnviados.map((proyecto) => (
                    <div className="cargo-card" key={proyecto.id}>
                      <div className="cargo-avatar">✓</div>

                      <div className="cargo-info">
                        <h4>{proyecto.estudiante_nombre}</h4>
                        <span className="cargo-rol">
                          Enviado a Sede Central
                        </span>
                        <span className="cargo-correo">{proyecto.titulo}</span>

                        {proyecto.ruta_documento_sellado && (
                          <button
                            className="btn-editar-personal"
                            onClick={() =>
                              verPDF(proyecto.ruta_documento_sellado)
                            }
                          >
                            Ver sellado
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {vistaActiva === "gestion" && (
          <>
            <div className="gestion-cargos-header">
              <div>
                <h1>Gestión de Personal y Comisión</h1>
                <p className="coordinador-subtitle">
                  Administra docentes, director y secretaría que participan en
                  la Comisión de Titulación.
                </p>
              </div>

              <button className="btn-editar-cargos" onClick={abrirModalNuevo}>
                ➕ Añadir Cargo
              </button>
            </div>

            <div className="cargos-grid">
              {personalVisible.length === 0 ? (
                <div className="card coordinador-card-empty">
                  <h3>No hay personal registrado</h3>
                  <p>
                    Agrega docentes, director o secretaría desde el botón
                    superior.
                  </p>
                </div>
              ) : (
                personalVisible.map((persona) => (
                  <div className="cargo-card" key={persona.id}>
                    <div className="cargo-avatar">
                      {persona.nombre ? persona.nombre.charAt(0) : "?"}
                    </div>

                    <div className="cargo-info">
                      <h4>{persona.nombre}</h4>

                      <span className="cargo-rol">
                        {mostrarRolBonito(persona.rol, persona.es_comision)}
                      </span>

                      <span className="cargo-correo">{persona.correo}</span>

                      <div className="cargo-actions">
                        <button
                          className="btn-editar-personal"
                          onClick={() => abrirModalEditar(persona)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-eliminar-personal"
                          onClick={() => eliminarPersonal(persona)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {vistaActiva === "historial" && (
          <>
            <div className="historial-header-pro">
              <div>
                <h1>Historial de Actividad</h1>
                <p className="coordinador-subtitle">
                  Consulta las acciones realizadas por estudiantes, docentes,
                  comisión, director y coordinación durante el proceso de
                  titulación.
                </p>
              </div>

              <div className="historial-resumen-card">
                <span>Total de actividades</span>
                <strong>{historialActividad.length}</strong>
              </div>
            </div>

            <div className="historial-layout-pro">
              <div className="historial-estudiantes-panel card">
                <div className="historial-panel-title">
                  <h3>Estudiantes</h3>
                  <span>{estudiantesHistorial.length}</span>
                </div>

                <button
                  className={`historial-estudiante-btn ${
                    estudianteHistorialActivo === "TODOS" ? "activo" : ""
                  }`}
                  onClick={() => setEstudianteHistorialActivo("TODOS")}
                >
                  <div>
                    <strong>Todos los procesos</strong>
                    <small>Ver actividad general</small>
                  </div>

                  <span>{historialActividad.length}</span>
                </button>

                {estudiantesHistorial.length === 0 ? (
                  <p className="historial-vacio">
                    Todavía no hay estudiantes con actividad.
                  </p>
                ) : (
                  estudiantesHistorial.map((estudiante) => (
                    <button
                      key={estudiante.key}
                      className={`historial-estudiante-btn ${
                        estudianteHistorialActivo === estudiante.key
                          ? "activo"
                          : ""
                      }`}
                      onClick={() =>
                        setEstudianteHistorialActivo(estudiante.key)
                      }
                    >
                      <div>
                        <strong>{estudiante.estudiante_nombre}</strong>
                        <small>{estudiante.titulo}</small>
                      </div>

                      <span>{estudiante.total}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="historial-detalle-panel card">
                <div className="historial-detalle-header">
                  <div>
                    <h3>
                      {estudianteHistorialActivo === "TODOS"
                        ? "Actividad general"
                        : "Historial del estudiante"}
                    </h3>

                    <p>
                      {estudianteHistorialActivo === "TODOS"
                        ? "Mostrando todos los movimientos registrados en el sistema."
                        : "Mostrando solamente las acciones realizadas sobre este estudiante."}
                    </p>
                  </div>

                  <span className="historial-count-badge">
                    {historialFiltrado.length} registros
                  </span>
                </div>

                {historialFiltrado.length === 0 ? (
                  <p className="historial-vacio">
                    Todavía no hay actividades registradas.
                  </p>
                ) : (
                  <div className="timeline-actividad">
                    {historialFiltrado.map((item) => (
                      <div className="timeline-item" key={item.id}>
                        <div className="timeline-icon">
                          {obtenerIconoActividad(item.accion)}
                        </div>

                        <div className="timeline-content">
                          <div className="timeline-top">
                            <h4>
                              {item.estudiante_nombre || "Sin estudiante"} -{" "}
                              {item.titulo || "Sin título"}
                            </h4>

                            <span>
                              {item.fecha
                                ? new Date(item.fecha).toLocaleString()
                                : "Fecha no disponible"}
                            </span>
                          </div>

                          <p>
                            <strong>{item.usuario_nombre || "Sistema"}</strong>{" "}
                            <em>({item.usuario_rol || "SIN ROL"})</em>{" "}
                            realizó:{" "}
                            <strong>{formatearAccion(item.accion)}</strong>
                          </p>

                          {item.detalle && (
                            <div className="timeline-detalle">
                              {item.detalle}
                            </div>
                          )}

                          {(item.estado_anterior || item.estado_nuevo) && (
                            <div className="timeline-estados">
                              {item.estado_anterior && (
                                <span>
                                  Antes:{" "}
                                  {item.estado_anterior.replace(/_/g, " ")}
                                </span>
                              )}

                              {item.estado_nuevo && (
                                <span>
                                  Ahora:{" "}
                                  {item.estado_nuevo.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {modalAbierto && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{modoEditar ? "Editar Personal" : "Añadir Nuevo Cargo"}</h2>

              <form onSubmit={guardarPersonal}>
                <input
                  className="input-doc coordinador-input"
                  type="text"
                  name="nombre"
                  placeholder="Nombre completo"
                  value={formulario.nombre}
                  onChange={manejarCambio}
                />

                <input
                  className="input-doc coordinador-input"
                  type="email"
                  name="correo"
                  placeholder="Correo institucional"
                  value={formulario.correo}
                  onChange={manejarCambio}
                />

                <input
                  className="input-doc coordinador-input"
                  type="text"
                  name="clave"
                  placeholder={
                    modoEditar ? "Nueva contraseña opcional" : "Contraseña"
                  }
                  value={formulario.clave}
                  onChange={manejarCambio}
                />

                <select
                  className="input-doc coordinador-input"
                  name="rol"
                  value={formulario.rol}
                  onChange={manejarCambio}
                >
                  <option value="DOCENTE">Docente Evaluador</option>
                  <option value="DIRECTOR_TITULACION">
                    Director de Titulación
                  </option>
                  <option value="SECRETARIA">Secretaría</option>
                </select>

                <label className="coordinador-check">
                  <input
                    type="checkbox"
                    name="es_comision"
                    checked={formulario.es_comision}
                    onChange={manejarCambio}
                  />
                  Pertenece a Comisión de Titulación
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cancelar
                  </button>

                  <button type="submit" className="btn-enviar-eval">
                    Guardar
                  </button>
                </div>
              </form>
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
              title="Visor PDF Coordinador"
            ></iframe>
          </div>
        )}
      </main>
    </section>
  );
}

export default CoordinadorDashboard;