const pool = require("../config/db");
const { registrarActividad } = require("./historial.controller");

// Obtener proyectos que están en Comisión
const obtenerProyectosComision = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.nombre AS estudiante_nombre,
        u.id AS estudiante_codigo
      FROM proyectos p
      JOIN usuarios u ON p.estudiante_id = u.id
      WHERE p.estado IN ('EN_COMISION', 'CORRECCION_COMISION')
      ORDER BY p.fecha_creacion DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener proyectos comisión:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener proyectos de comisión",
    });
  }
};

// Obtener revisiones/comentarios de un proyecto
const obtenerRevisionesProyecto = async (req, res) => {
  try {
    const { proyectoId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        rc.*,
        u.nombre AS nombre_usuario,
        u.rol AS rol_usuario
      FROM revisiones_comision rc
      JOIN usuarios u ON rc.usuario_id = u.id
      WHERE rc.proyecto_id = $1
      ORDER BY rc.fecha ASC
      `,
      [proyectoId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener revisiones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener revisiones",
    });
  }
};

// Guardar o actualizar revisión de un integrante
const guardarRevisionComision = async (req, res) => {
  try {
    const { proyectoId } = req.params;

    const {
      usuario_id,
      usuario_nombre,
      usuario_rol,
      rol_revision,
      decision,
      comentario,
      detalle,
    } = req.body;

    const proyectoInfo = await pool.query(
      `
      SELECT 
        p.estado,
        p.titulo,
        u.nombre AS estudiante_nombre
      FROM proyectos p
      JOIN usuarios u ON p.estudiante_id = u.id
      WHERE p.id = $1
      `,
      [proyectoId]
    );

    if (proyectoInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoInfo.rows[0];

    const existe = await pool.query(
      `
      SELECT id 
      FROM revisiones_comision 
      WHERE proyecto_id = $1 AND usuario_id = $2
      `,
      [proyectoId, usuario_id]
    );

    let result;

    if (existe.rows.length > 0) {
      result = await pool.query(
        `
        UPDATE revisiones_comision
        SET rol_revision = $1,
            decision = $2,
            comentario = $3,
            fecha = CURRENT_TIMESTAMP
        WHERE proyecto_id = $4 AND usuario_id = $5
        RETURNING *
        `,
        [rol_revision, decision, comentario, proyectoId, usuario_id]
      );
    } else {
      result = await pool.query(
        `
        INSERT INTO revisiones_comision 
        (proyecto_id, usuario_id, rol_revision, decision, comentario)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [proyectoId, usuario_id, rol_revision, decision, comentario]
      );
    }

    const accion =
      decision === "APROBADO"
        ? "COMISION_VISTO_BUENO"
        : "COMISION_SOLICITO_CORRECCION";

    const detalleFinal =
      detalle ||
      (decision === "APROBADO"
        ? `${usuario_nombre || "Miembro de comisión"} dio visto bueno al proyecto de ${proyecto.estudiante_nombre}.`
        : `${usuario_nombre || "Miembro de comisión"} solicitó correcciones al proyecto de ${proyecto.estudiante_nombre}: ${comentario}`);

    await registrarActividad({
      proyecto_id: proyectoId,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Miembro de comisión",
      usuario_rol: usuario_rol || rol_revision || "COMISION",
      accion,
      detalle: detalleFinal,
      estado_anterior: proyecto.estado,
      estado_nuevo: proyecto.estado,
    });

    res.json({
      success: true,
      mensaje: "Revisión guardada correctamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error al guardar revisión:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al guardar revisión",
    });
  }
};

// Moposita envía correcciones al estudiante
const enviarCorreccionesEstudiante = async (req, res) => {
  try {
    const { proyectoId } = req.params;

    const {
      usuario_id,
      usuario_nombre,
      usuario_rol,
      detalle,
    } = req.body;

    const proyectoInfo = await pool.query(
      `
      SELECT 
        p.estado,
        p.titulo,
        u.nombre AS estudiante_nombre
      FROM proyectos p
      JOIN usuarios u ON p.estudiante_id = u.id
      WHERE p.id = $1
      `,
      [proyectoId]
    );

    if (proyectoInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoInfo.rows[0];

    await pool.query(
      `
      UPDATE proyectos
      SET estado = 'CORRECCION_COMISION'
      WHERE id = $1
      `,
      [proyectoId]
    );

    await registrarActividad({
      proyecto_id: proyectoId,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Secretaría",
      usuario_rol: usuario_rol || "SECRETARIA",
      accion: "SECRETARIA_NOTIFICO_CORRECCIONES_COMISION",
      detalle:
        detalle ||
        `Secretaría notificó al estudiante ${proyecto.estudiante_nombre} las correcciones solicitadas por la Comisión.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "CORRECCION_COMISION",
    });

    res.json({
      success: true,
      mensaje: "Correcciones enviadas al estudiante",
    });
  } catch (error) {
    console.error("Error al enviar correcciones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al enviar correcciones",
    });
  }
};

// Aprobar comisión si los 3 dieron visto bueno
const aprobarComision = async (req, res) => {
  try {
    const { proyectoId } = req.params;

    const {
      usuario_id,
      usuario_nombre,
      usuario_rol,
      detalle,
    } = req.body;

    const proyectoInfo = await pool.query(
      `
      SELECT 
        p.estado,
        p.titulo,
        u.nombre AS estudiante_nombre
      FROM proyectos p
      JOIN usuarios u ON p.estudiante_id = u.id
      WHERE p.id = $1
      `,
      [proyectoId]
    );

    if (proyectoInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoInfo.rows[0];

    const result = await pool.query(
      `
      SELECT rol_revision, decision
      FROM revisiones_comision
      WHERE proyecto_id = $1
      `,
      [proyectoId]
    );

    const revisiones = result.rows;

    const docenteOk = revisiones.some(
      (r) => r.rol_revision === "DOCENTE" && r.decision === "APROBADO"
    );

    const directorOk = revisiones.some(
      (r) =>
        r.rol_revision === "DIRECTOR_TITULACION" &&
        r.decision === "APROBADO"
    );

    const coordinadorOk = revisiones.some(
      (r) =>
        r.rol_revision === "COORDINADOR_CARRERA" &&
        r.decision === "APROBADO"
    );

    const hayCorreccion = revisiones.some(
      (r) => r.decision === "CORRECCION"
    );

    if (!docenteOk || !directorOk || !coordinadorOk) {
      return res.status(400).json({
        success: false,
        mensaje: "Faltan vistos buenos de Docente, Director o Coordinador",
      });
    }

    if (hayCorreccion) {
      return res.status(400).json({
        success: false,
        mensaje: "No se puede enviar a Director F2 porque existen correcciones pendientes",
      });
    }

    await pool.query(
      `
      UPDATE proyectos
      SET estado = 'APROBADO_COMISION'
      WHERE id = $1
      `,
      [proyectoId]
    );

    await registrarActividad({
      proyecto_id: proyectoId,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Secretaría",
      usuario_rol: usuario_rol || "SECRETARIA",
      accion: "SECRETARIA_ENVIO_A_DIRECTOR_F2",
      detalle:
        detalle ||
        `Secretaría envió el proyecto de ${proyecto.estudiante_nombre} al Director F2 después de recibir los tres vistos buenos de Comisión.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "APROBADO_COMISION",
    });

    res.json({
      success: true,
      mensaje: "Proyecto aprobado por Comisión y enviado a Director F2",
    });
  } catch (error) {
    console.error("Error al aprobar comisión:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al aprobar comisión",
    });
  }
};

module.exports = {
  obtenerProyectosComision,
  obtenerRevisionesProyecto,
  guardarRevisionComision,
  enviarCorreccionesEstudiante,
  aprobarComision,
};