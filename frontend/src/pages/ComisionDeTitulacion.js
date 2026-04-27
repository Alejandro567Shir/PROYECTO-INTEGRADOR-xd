import { useState } from "react";
import Sidebar from "../components/Sidebar";

function ComisionDeTitulacion({ usuario, onCerrarSesion }) {

  const [proyectos] = useState([
    {
      id: 1,
      estudiante: "Juan Pérez",
      tema: "Sistema Web IA para la Amazonía",
      estado: "Borrador",
      colorEstado: "estado-badge", // gris
      comentarios: 0,
    },
    {
      id: 2,
      estudiante: "María Gómez",
      tema: "Redes IoT para Agricultura",
      estado: "En Revisión F1",
      colorEstado: "estado-badge azul",
      comentarios: 3,
    },
    {
      id: 3,
      estudiante: "Carlos López",
      tema: "App Móvil de Turismo",
      estado: "Correcciones",
      colorEstado: "estado-badge morado-suave",
      comentarios: 5,
    }
  ]);

  const simularVerPDF = (nombre) => alert(`Abriendo visor de PDF para la tesis de ${nombre}...`);
  const simularDescargar = (nombre) => alert(`Descargando el archivo PDF de ${nombre}...`);
  const simularComentar = (nombre) => alert(`Abriendo panel para dejarle correcciones a ${nombre}...`);
  const simularSubir = (nombre) => alert(`Abriendo ventana para subir la versión corregida de ${nombre}...`);

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
          <h1>Tablero de Procesos - Comisión de Titulación</h1>
          <button className="notificar-btn">Notificar Atrasos Manualmente</button>
        </div>

        <div className="cards-grid">
          <div className="mini-card">
            <p>Total Activos</p>
            <h2 className="azul-num">{proyectos.length}</h2>
          </div>
          <div className="mini-card">
            <p>En Fase 1</p>
            <h2 className="naranja-num">1</h2>
          </div>
          <div className="mini-card">
            <p>Esperando Central</p>
            <h2 className="morado-num">0</h2>
          </div>
          <div className="mini-card">
            <p>Finalizados</p>
            <h2 className="verde-num">0</h2>
          </div>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Tema / Proyecto</th>
                <th>Estado Actual</th>
                <th>Gestión de Tesis (PDF)</th>
              </tr>
            </thead>
            <tbody>
              
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td>{proyecto.estudiante}</td>
                  <td>{proyecto.tema}</td>
                  <td>
                    <span className={proyecto.colorEstado}>{proyecto.estado}</span>
                  </td>
                  <td>
                    {/* Botones de acción del Mockup */}
                    <div className="acciones-mockup">
                      <button onClick={() => simularVerPDF(proyecto.estudiante)} className="btn-mockup btn-ver" title="Ver documento">
                         Ver
                      </button>
                      <button onClick={() => simularDescargar(proyecto.estudiante)} className="btn-mockup btn-descargar" title="Descargar PDF">
                        ⬇️
                      </button>
                      <button onClick={() => simularComentar(proyecto.estudiante)} className="btn-mockup btn-comentar" title="Hacer correcciones">
                         Comentar ({proyecto.comentarios})
                      </button>
                      <button onClick={() => simularSubir(proyecto.estudiante)} className="btn-mockup btn-subir" title="Subir corrección">
                        Subir
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

export default ComisionDeTitulacion;