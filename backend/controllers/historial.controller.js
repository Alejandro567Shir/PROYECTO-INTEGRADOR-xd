const pool = require("../config/db");

const obtenerHistorialActividad = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        h.id,
        h.proyecto_id,
        h.usuario_id,
        h.usuario_nombre,
        h.usuario_rol,
        h.accion,
        h.detalle,
        h.estado_anterior,
        h.estado_nuevo,
        h.fecha,
        p.titulo,
        u.nombre AS estudiante_nombre
      FROM historial_actividad h
      JOIN proyectos p ON h.proyecto_id = p.id
      JOIN usuarios u ON p.estudiante_id = u.id
      ORDER BY h.fecha DESC
      `
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener historial de actividad",
    });
  }
};

const registrarActividad = async ({
  proyecto_id,
  usuario_id,
  usuario_nombre,
  usuario_rol,
  accion,
  detalle,
  estado_anterior,
  estado_nuevo,
}) => {
  await pool.query(
    `
    INSERT INTO historial_actividad 
    (proyecto_id, usuario_id, usuario_nombre, usuario_rol, accion, detalle, estado_anterior, estado_nuevo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      proyecto_id,
      usuario_id,
      usuario_nombre,
      usuario_rol,
      accion,
      detalle,
      estado_anterior,
      estado_nuevo,
    ]
  );
};

module.exports = {
  obtenerHistorialActividad,
  registrarActividad,
};