import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

function EstudianteDashboard({ usuario, onCerrarSesion }) {
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const [miProyecto, setMiProyecto] = useState(null);

  // Cargar historial al iniciar
  useEffect(() => {
    const cargarMiProyecto = async () => {
      try {
        const respuesta = await fetch(`http://localhost:3001/api/proyectos/estudiante/${usuario.id}`);
        const data = await respuesta.json();
        console.log("Datos recibidos del backend al cargar:", data); // Para depurar
        if (data.success && data.proyecto) {
          setMiProyecto(data.proyecto);
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      }
    };
    cargarMiProyecto();
  }, [usuario.id]);

  const manejarArchivo = (e) => setArchivo(e.target.files[0]);

  const enviarProyectoFase1 = async () => {
    if (!titulo || !archivo) {
      alert("Por favor, llena el título y selecciona un PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("estudianteId", usuario.id);
    formData.append("docenteId", 5); // OJO: Verifica que 5 sea el ID correcto de Ramiro
    formData.append("titulo", titulo);
    formData.append("descripcion", "Anteproyecto subido.");
    formData.append("archivoPdf", archivo);

    try {
      const respuesta = await fetch("http://localhost:3001/api/proyectos", {
        method: "POST",
        body: formData,
      });

      const data = await respuesta.json();
      console.log("Respuesta al subir proyecto:", data); // Para depurar

      if (data.success) {
        setMensajeExito("¡Tu proyecto fue enviado a Fase 1 exitosamente!");
        // Aquí estaba el error antes, si data.proyecto no viene bien, no se actualiza
        if (data.proyecto) {
            setMiProyecto(data.proyecto);
        } else {
            // Si el backend no devuelve el proyecto, recargamos la página como solución temporal
             window.location.reload();
        }
      } else {
        alert("Error del servidor: " + data.mensaje);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="ESTUDIANTE"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <h1>Mi Proceso de Titulación</h1>

        {mensajeExito && <div className="alerta-exito">✅ {mensajeExito}</div>}

        <div className="estudiante-layout">
          {/* COLUMNA PRINCIPAL */}
          <div className="columna-principal">
            <div className="card">
              <div className="dashboard-header-row">
                <div>
                  <h2>{miProyecto ? miProyecto.titulo : "Sube tu Proyecto / Tesis"}</h2>
                  <p style={{ color: "#64748b" }}>ID Alumno: {usuario.id}</p>
                </div>
                <span className={`estado-badge ${miProyecto ? 'azul' : ''}`}>
                  {miProyecto ? miProyecto.estado.replace(/_/g, " ") : "Borrador"}
                </span>
              </div>

              <hr className="separador" />

              {!miProyecto ? (
                <div className="acciones-box">
                  <h3 style={{ marginBottom: "15px" }}>Acciones Requeridas</h3>
                  <div className="acciones-row">
                    <input type="text" placeholder="Título del proyecto" className="input-doc" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                    <input type="file" className="input-file" accept=".pdf" onChange={manejarArchivo} />
                    <button className="fase-btn" onClick={enviarProyectoFase1}>Enviar a Fase 1</button>
                  </div>
                </div>
              ) : (
                <div className="caja-revision">
                  <h3>📌 Proyecto en Revisión</h3>
                  <p>Tu documento fue enviado y está siendo evaluado por el <strong>{miProyecto.docente_nombre || 'Docente Asignado'}</strong>. Te notificaremos cuando haya correcciones.</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA LATERAL (HISTORIAL) */}
          <div className="columna-lateral">
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>🕒 Historial del Proceso</h3>
              <div style={{ marginTop: "15px" }}>
                {!miProyecto ? (
                  <p className="historial-vacio">No hay movimientos registrados aún.</p>
                ) : (
                  <div className="historial-item">
                    <h4>Enviado a Docente F1</h4>
                    <p>
                      Fecha: {miProyecto.fecha_creacion ? new Date(miProyecto.fecha_creacion).toLocaleString() : "Fecha no disponible"}
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