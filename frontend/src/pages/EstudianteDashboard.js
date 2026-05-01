import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

function EstudianteDashboard({ usuario, onCerrarSesion }) {
  const API_URL = "http://localhost:3001";

  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const [miProyecto, setMiProyecto] = useState(null);
  const [revisionesComision, setRevisionesComision] = useState([]);

  const cargarRevisionesComision = useCallback(async (proyectoId) => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/comision/revisiones/${proyectoId}`
      );

      const data = await respuesta.json();

      if (data.success) {
        setRevisionesComision(data.data);
      }
    } catch (error) {
      console.error("Error al cargar revisiones de comisión:", error);
    }
  }, []);

  const cargarMiProyecto = useCallback(async () => {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/estudiante/${usuario.id}`
      );

      const data = await respuesta.json();

      if (data.success && data.proyecto) {
        setMiProyecto(data.proyecto);
        cargarRevisionesComision(data.proyecto.id);
      } else {
        setMiProyecto(null);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
      toast.error("Error al cargar tu proceso");
    }
  }, [usuario.id, cargarRevisionesComision]);

  useEffect(() => {
    cargarMiProyecto();
  }, [cargarMiProyecto]);

  const manejarArchivo = (e) => {
    setArchivo(e.target.files[0]);
  };

  const enviarProyectoFase1 = async () => {
    if (!titulo || !archivo) {
      toast.error("Por favor, llena el título y selecciona un PDF.");
      return;
    }

    const formData = new FormData();

    formData.append("estudianteId", usuario.id);
    formData.append("docenteId", 5);
    formData.append("titulo", titulo);
    formData.append("descripcion", "Anteproyecto subido.");
    formData.append("archivoPdf", archivo);

    formData.append("usuario_id", usuario.id);
    formData.append("usuario_nombre", usuario.nombre);
    formData.append("usuario_rol", usuario.rol);
    formData.append(
      "detalle",
      `El estudiante ${usuario.nombre} subió su proyecto inicial y lo envió a revisión de Docente F1.`
    );

    try {
      const respuesta = await fetch(`${API_URL}/api/proyectos`, {
        method: "POST",
        body: formData,
      });

      const data = await respuesta.json();

      if (data.success) {
        toast.success("Proyecto enviado a Fase 1");
        setMensajeExito("¡Tu proyecto fue enviado a Fase 1 exitosamente!");
        setTitulo("");
        setArchivo(null);
        cargarMiProyecto();
      } else {
        toast.error(data.mensaje || "Error del servidor");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor.");
    }
  };

  const enviarCorreccionDocente = async () => {
    if (!archivo) {
      toast.error("Selecciona el PDF corregido.");
      return;
    }

    if (!miProyecto?.id) {
      toast.error("No se encontró el proyecto.");
      return;
    }

    const formData = new FormData();

    formData.append("titulo", titulo || miProyecto.titulo);
    formData.append("archivoPdf", archivo);

    formData.append("usuario_id", usuario.id);
    formData.append("usuario_nombre", usuario.nombre);
    formData.append("usuario_rol", usuario.rol);
    formData.append(
      "detalle",
      `${usuario.nombre} subió el PDF corregido y lo envió nuevamente al Docente F1.`
    );

    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/correccion-docente/${miProyecto.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success(data.mensaje || "Corrección enviada al Docente F1");
        setTitulo("");
        setArchivo(null);
        cargarMiProyecto();
      } else {
        toast.error(data.mensaje || "No se pudo enviar la corrección");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar corrección al docente");
    }
  };

  const enviarCorreccionComision = async () => {
    if (!archivo) {
      toast.error("Selecciona el PDF corregido.");
      return;
    }

    if (!miProyecto?.id) {
      toast.error("No se encontró el proyecto.");
      return;
    }

    const formData = new FormData();

    formData.append("titulo", titulo || miProyecto.titulo);
    formData.append("archivoPdf", archivo);

    formData.append("usuario_id", usuario.id);
    formData.append("usuario_nombre", usuario.nombre);
    formData.append("usuario_rol", usuario.rol);
    formData.append(
      "detalle",
      `El estudiante ${usuario.nombre} subió el PDF corregido y lo envió nuevamente a Comisión de Titulación.`
    );

    try {
      const respuesta = await fetch(
        `${API_URL}/api/proyectos/correccion-comision/${miProyecto.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await respuesta.json();

      if (data.success) {
        toast.success("Corrección enviada nuevamente a Comisión");
        setTitulo("");
        setArchivo(null);
        cargarMiProyecto();
      } else {
        toast.error(data.mensaje || "No se pudo enviar la corrección");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar corrección a Comisión");
    }
  };

  const estaEnCorreccionDocente =
    miProyecto?.estado === "ESPERANDO_CORRECCION";

  const estaEnCorreccionComision =
    miProyecto?.estado === "CORRECCION_COMISION";

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="ESTUDIANTE"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      />

      <main className="content">
        <h1>Mi Proceso de Titulación</h1>

        {mensajeExito && <div className="alerta-exito">✅ {mensajeExito}</div>}

        <div className="estudiante-layout">
          <div className="columna-principal">
            <div className="card">
              <div className="dashboard-header-row">
                <div>
                  <h2>
                    {miProyecto
                      ? miProyecto.titulo
                      : "Sube tu Proyecto / Tesis"}
                  </h2>
                  <p style={{ color: "#64748b" }}>ID Alumno: {usuario.id}</p>
                </div>

                <span className={`estado-badge ${miProyecto ? "azul" : ""}`}>
                  {miProyecto
                    ? miProyecto.estado.replace(/_/g, " ")
                    : "Borrador"}
                </span>
              </div>

              <hr className="separador" />

              {!miProyecto ? (
                <div className="acciones-box">
                  <h3>Acciones Requeridas</h3>

                  <div className="acciones-row">
                    <input
                      type="text"
                      placeholder="Título del proyecto"
                      className="input-doc"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                    />

                    <input
                      type="file"
                      className="input-file"
                      accept=".pdf"
                      onChange={manejarArchivo}
                    />

                    <button className="fase-btn" onClick={enviarProyectoFase1}>
                      Enviar a Fase 1
                    </button>
                  </div>
                </div>
              ) : estaEnCorreccionDocente ? (
                <div className="caja-revision">
                  <h3>📝 Correcciones del Docente F1</h3>

                  <p>
                    Tu docente revisó el documento y solicitó correcciones.
                    Realiza los cambios en tu PDF y vuelve a subirlo para que
                    sea revisado nuevamente.
                  </p>

                  <div className="revision-item" style={{ marginTop: "15px" }}>
                    <strong>Observación del docente:</strong>{" "}
                    <span className="texto-correccion">
                      ⚠️{" "}
                      {miProyecto.comentarios_docente ||
                        "No hay comentario registrado."}
                    </span>
                  </div>

                  <div className="acciones-box" style={{ marginTop: "20px" }}>
                    <h3>Subir PDF corregido</h3>

                    <div className="acciones-row">
                      <input
                        type="text"
                        placeholder="Tema corregido"
                        className="input-doc"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                      />

                      <input
                        type="file"
                        className="input-file"
                        accept=".pdf"
                        onChange={manejarArchivo}
                      />

                      <button
                        className="fase-btn"
                        onClick={enviarCorreccionDocente}
                      >
                        Enviar corrección a Docente F1
                      </button>
                    </div>
                  </div>
                </div>
              ) : estaEnCorreccionComision ? (
                <div className="caja-revision">
                  <h3>📌 Correcciones de Comisión</h3>

                  <p>
                    Tu proyecto ya fue validado por Docente F1, pero la Comisión
                    solicitó correcciones. Revisa las observaciones y sube el PDF
                    corregido.
                  </p>

                  <div className="revision-lista" style={{ marginTop: "15px" }}>
                    {revisionesComision.length === 0 ? (
                      <p>No hay observaciones registradas.</p>
                    ) : (
                      revisionesComision.map((rev) => (
                        <div key={rev.id} className="revision-item">
                          <strong>{rev.rol_revision.replace(/_/g, " ")}:</strong>{" "}
                          {rev.decision === "APROBADO" ? (
                            <span className="texto-ok">✅ Visto bueno</span>
                          ) : (
                            <span className="texto-correccion">
                              ⚠️ {rev.comentario}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="acciones-box" style={{ marginTop: "20px" }}>
                    <h3>Subir PDF corregido</h3>

                    <div className="acciones-row">
                      <input
                        type="text"
                        placeholder="Tema corregido"
                        className="input-doc"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                      />

                      <input
                        type="file"
                        className="input-file"
                        accept=".pdf"
                        onChange={manejarArchivo}
                      />

                      <button
                        className="fase-btn"
                        onClick={enviarCorreccionComision}
                      >
                        Enviar corrección a Comisión
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="caja-revision">
                  <h3>📌 Proyecto en Revisión</h3>
                  <p>
                    Tu documento fue enviado y está siendo evaluado. Estado
                    actual:{" "}
                    <strong>{miProyecto.estado.replace(/_/g, " ")}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="columna-lateral">
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                🕒 Historial del Proceso
              </h3>

              <div style={{ marginTop: "15px" }}>
                {!miProyecto ? (
                  <p className="historial-vacio">
                    No hay movimientos registrados aún.
                  </p>
                ) : (
                  <div className="historial-item">
                    <h4>Proceso iniciado</h4>
                    <p>
                      Fecha:{" "}
                      {miProyecto.fecha_creacion
                        ? new Date(miProyecto.fecha_creacion).toLocaleString()
                        : "Fecha no disponible"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

export default EstudianteDashboard;