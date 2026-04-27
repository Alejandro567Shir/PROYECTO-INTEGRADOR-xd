import { useState } from "react";
import Sidebar from "../components/Sidebar";

function EstudianteDashboard({ usuario, onCerrarSesion }) {
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [archivosSubidos, setArchivosSubidos] = useState([]);
  const [historial, setHistorial] = useState([]);

  const seleccionarArchivo = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      e.target.value = "";
      return;
    }

    setArchivo(file);
  };

  const eliminarArchivo = () => {
    setArchivo(null);

    const inputFile = document.getElementById("archivo-pdf");
    if (inputFile) inputFile.value = "";
  };

  const subirPDF = () => {
    if (titulo.trim() === "") {
      alert("Ingrese el título del proyecto");
      return;
    }

    if (!archivo) {
      alert("Seleccione un archivo PDF");
      return;
    }

    const fechaActual = new Date().toLocaleString("es-EC", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    setArchivosSubidos([
      ...archivosSubidos,
      {
        nombre: archivo.name,
        titulo: titulo,
        fecha: fechaActual,
      },
    ]);

    setHistorial([
      ...historial,
      {
        fecha: fechaActual,
        accion: `Proyecto "${titulo}" registrado con el PDF: ${archivo.name}`,
      },
    ]);

    alert("PDF subido correctamente");

    setArchivo(null);
    setTitulo("");

    const inputFile = document.getElementById("archivo-pdf");
    if (inputFile) inputFile.value = "";
  };

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

        <div className="estudiante-layout">
          <div>
            <div className="card">
              <div className="dashboard-header-row">
                <div>
                  <h2>{titulo || "Sistema Web IA para la Amazonía"}</h2>
                  <p>ID: p1</p>
                </div>
                <span className="estado-badge">Borrador</span>
              </div>

              <hr className="separador" />

              <h3>Archivos Subidos</h3>

              {archivosSubidos.length === 0 ? (
                <p>No hay archivos subidos aún.</p>
              ) : (
                <ul>
                  {archivosSubidos.map((item, index) => (
                    <li key={index}>
                      <strong>{item.titulo}</strong> - {item.nombre}
                      <br />
                      <small>{item.fecha}</small>
                    </li>
                  ))}
                </ul>
              )}

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
                    id="archivo-pdf"
                    type="file"
                    accept="application/pdf"
                    className="input-file"
                    onChange={seleccionarArchivo}
                  />

                  <button className="subir-btn" onClick={subirPDF}>
                    Subir PDF
                  </button>

                  <button className="eliminar-btn" onClick={eliminarArchivo}>
                    Eliminar
                  </button>

                  <button className="fase-btn">Enviar a Fase 1</button>
                </div>

                {archivo && (
                  <p className="archivo-seleccionado">
                    Archivo seleccionado: <strong>{archivo.name}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <h3>Observaciones de Docentes</h3>
              <p>No hay observaciones registradas.</p>
            </div>
          </div>

          <div className="historial-card">
            <h3>🕒 Historial del Proceso</h3>

            {historial.length === 0 ? (
              <p>No hay movimientos registrados aún.</p>
            ) : (
              historial.map((item, index) => (
                <div className="historial-item" key={index}>
                  <span className="fecha">{item.fecha}</span>
                  <p>{item.accion}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </section>
  );
}

export default EstudianteDashboard;