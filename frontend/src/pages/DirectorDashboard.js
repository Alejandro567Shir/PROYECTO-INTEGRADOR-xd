import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";

function DirectorF2Dashboard({ usuario, onCerrarSesion }) {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  const cargarProyectosF2 = useCallback(async () => {
    try {
      const respuesta = await fetch(`http://localhost:3001/api/proyectos/fase2/todos`);
      const data = await respuesta.json();
      if (data.success) {
        setProyectos(data.data);
      }
    } catch (error) {
      console.error("Error al cargar proyectos F2:", error);
    }
  }, []);

  useEffect(() => {
    cargarProyectosF2();
  }, [cargarProyectosF2]);

  // Filtramos los proyectos para las dos listas laterales
  const pendientes = proyectos.filter(p => p.estado === 'APROBADO_F1');
  const completados = proyectos.filter(p => p.estado === 'RUBRICA_SUBIDA' || p.estado === 'EN_COMISION');

  const verPDF = (ruta) => window.open(`http://localhost:3001/${ruta.replace(/\\/g, '/')}`, '_blank');
  
  const mandarAComision = async (id) => {
    if(!window.confirm("¿Estás seguro de enviar este expediente a la Comisión de Titulación para el sello final?")) return;
    try {
      await fetch(`http://localhost:3001/api/proyectos/estado/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: 'EN_COMISION' })
      });
      alert("¡Éxito! El proyecto fue enviado a la Comisión de Titulación.");
      cargarProyectosF2();
      setProyectoSeleccionado(null); // Limpiamos la pantalla derecha
    } catch (error) {
      alert("Error al enviar a comisión");
    }
  };

  return (
    <section className="panel">
      <Sidebar nombre={usuario.nombre} rolTexto="DIRECTOR F2" onCerrarSesion={onCerrarSesion} onIrPanelPrincipal={() => {}} />

      <main className="content" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* COLUMNA IZQUIERDA: Listas */}
        <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2>Panel Director Titulación - Fase 2</h2>
          
          <div className="card">
            <h4 style={{ color: '#64748b', marginBottom: '10px' }}>PENDIENTES DE RÚBRICA</h4>
            {pendientes.length === 0 && <p style={{fontSize: '14px', color: '#94a3b8'}}>No hay pendientes.</p>}
            {pendientes.map(p => (
              <div 
                key={p.id} 
                onClick={() => setProyectoSeleccionado(p)}
                style={{
                  padding: '15px', border: proyectoSeleccionado?.id === p.id ? '2px solid #be123c' : '1px solid #e2e8f0',
                  borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', background: '#fff'
                }}
              >
                <h4 style={{ margin: '0 0 5px 0' }}>{p.estudiante_nombre}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{p.titulo}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>RÚBRICAS YA SUBIDAS</h4>
            {completados.length === 0 && <p style={{fontSize: '14px', color: '#94a3b8'}}>No hay expedientes completados.</p>}
            {completados.map(p => (
              <div 
                key={p.id} 
                onClick={() => setProyectoSeleccionado(p)}
                style={{
                  padding: '15px', border: proyectoSeleccionado?.id === p.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', background: '#f8fafc'
                }}
              >
                <h4 style={{ margin: '0 0 5px 0' }}>{p.estudiante_nombre}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>{p.titulo}</p>
                {p.estado === 'EN_COMISION' ? (
                  <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>✓ Enviado a Comisión</span>
                ) : (
                  <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>✓ Rúbrica Lista</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: Detalles del Expediente */}
        <div style={{ width: '70%', marginTop: '55px' }}>
          {!proyectoSeleccionado ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
              <h3>Selecciona un expediente de la lista izquierda</h3>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ margin: '0 0 5px 0' }}>Expediente: {proyectoSeleccionado.estudiante_nombre}</h2>
              <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>{proyectoSeleccionado.titulo}</p>

              <div style={{ background: '#f1f5f9', borderLeft: '4px solid #3b82f6', padding: '15px', borderRadius: '4px', marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>Historial de Aprobación:</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Aprobado por F1 y listo para rúbrica F2.</p>
              </div>

              {proyectoSeleccionado.estado === 'EN_COMISION' ? (
                <div style={{ padding: '30px', border: '2px dashed #10b981', borderRadius: '8px', textAlign: 'center', background: '#f0fdf4' }}>
                  <h3 style={{ color: '#065f46', margin: '0 0 10px 0' }}>Trámite Completado</h3>
                  <p style={{ color: '#166534', margin: 0 }}>Este documento ya fue evaluado y se encuentra actualmente en el panel de la <strong>Comisión de Titulación</strong>.</p>
                </div>
              ) : (
                <>
                  <h4 style={{ marginBottom: '10px' }}>1. Leer Documento Final:</h4>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <button onClick={() => verPDF(proyectoSeleccionado.ruta_archivo)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Ver PDF Completo</button>
                  </div>

                  <h4 style={{ marginBottom: '10px' }}>2. Evaluación y Envío:</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => alert("Próximamente: Subir Rúbrica")} style={{ background: 'transparent', color: '#1e293b', border: '2px solid #3b82f6', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Subir Rúbrica Evaluada</button>
                    <button onClick={() => mandarAComision(proyectoSeleccionado.id)} style={{ background: '#be123c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Mandar a la Comisión (Sello)</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </main>
    </section>
  );
}

export default DirectorF2Dashboard;