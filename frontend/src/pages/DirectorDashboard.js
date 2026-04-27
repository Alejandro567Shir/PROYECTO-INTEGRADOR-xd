import { useState } from "react";
import Sidebar from "../components/Sidebar";

function DirectorDashboard({ usuario, onCerrarSesion }) {

  const [proyectosPendientes] = useState([
    {
      id: 1,
      estudiante: "Carlos López",
      tema: "App Móvil de Turismo",
      historial: "Revisado por Ing. Ramiro Bonilla (F1) y corregido por estudiante.",
      estado: "Esperando Rúbrica",
    }
  ]);

  const [proyectosCompletados] = useState([
    {
      id: 2,
      estudiante: "Luis Sánchez",
      tema: "Sistema de Control de Inventarios",
      historial: "Rúbrica F2 subida con éxito.",
      estado: "Listo para Comisión",
    }
  ]);

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);


  const simularVerPDF = () => alert("Abriendo visor con el PDF final corregido por el estudiante...");
  const simularDescargar = () => alert("Descargando la tesis final...");
  const simularSubirRubrica = () => alert("Abriendo ventana para cargar el documento PDF de la Rúbrica de Evaluación...");
  const simularEnviarComision = (nombre) => alert(`¡Éxito! El proyecto de ${nombre} y su rúbrica fueron enviados a la Comisión de Titulación para el sello final.`);

  return (
    <section className="panel">
      <Sidebar
        nombre={usuario.nombre}
        rolTexto="DIRECTOR F2"
        onCerrarSesion={onCerrarSesion}
        onIrPanelPrincipal={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <main className="content">
        <h1>Panel Director Titulación - Fase 2</h1>

        <div className="director-grid">
       
          <div className="listas-container">
          
            <div className="card lista-card">
              <h3 className="titulo-lista">PENDIENTES DE RÚBRICA</h3>
              {proyectosPendientes.map((p) => (
                <div 
                  key={p.id} 
                  className={`mini-proyecto-card ${proyectoSeleccionado?.id === p.id ? 'activo' : ''}`}
                  onClick={() => setProyectoSeleccionado(p)}
                >
                  <h4>{p.estudiante}</h4>
                  <p>{p.tema}</p>
                </div>
              ))}
            </div>

           
            <div className="card lista-card" style={{ marginTop: "20px" }}>
              <h3 className="titulo-lista text-verde">RÚBRICAS YA SUBIDAS</h3>
              {proyectosCompletados.map((p) => (
                <div 
                  key={p.id} 
                  className={`mini-proyecto-card completado ${proyectoSeleccionado?.id === p.id ? 'activo' : ''}`}
                  onClick={() => setProyectoSeleccionado(p)}
                >
                  <h4>{p.estudiante}</h4>
                  <p>{p.tema}</p>
                  <span className="badge-verde">✓ Rúbrica Lista</span>
                </div>
              ))}
            </div>
          </div>

     
          <div className="card detalle-card">
            {!proyectoSeleccionado ? (
              <div className="centro-vacio">
                <p>Seleccione un proyecto de la lista de la izquierda para evaluarlo.</p>
              </div>
            ) : (
              <div className="detalle-contenido">
                <h2>Expediente: {proyectoSeleccionado.estudiante}</h2>
                <h4 className="tema-text">{proyectoSeleccionado.tema}</h4>

                <div className="historial-caja">
                  <strong> Historial de Aprobación:</strong>
                  <p> {proyectoSeleccionado.historial}</p>
                </div>

                {proyectoSeleccionado.estado === "Esperando Rúbrica" ? (
                  <>
                    <div className="grupo-botones-leer">
                      <p>1. Leer Documento Final:</p>
                      <button onClick={simularVerPDF} className="btn-mockup btn-ver"> Ver PDF Completo</button>
                      <button onClick={simularDescargar} className="btn-mockup btn-descargar">Descargar PDF</button>
                    </div>

                    <hr className="separador" />

                    <div className="grupo-botones-accion">
                      <p>2. Evaluación y Envío:</p>
                      <button onClick={simularSubirRubrica} className="btn-rubrica">
                        Subir Rúbrica Evaluada
                      </button>
                      <button onClick={() => simularEnviarComision(proyectoSeleccionado.estudiante)} className="btn-enviar-comision">
                         Mandar a la Comisión (Sello)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="caja-exito">
                    <h3> Trámite Completado</h3>
                    <p>Ya subiste la rúbrica y este documento está actualmente en el panel de la <strong>Comisión de Titulación</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </section>
  );
}

export default DirectorDashboard;