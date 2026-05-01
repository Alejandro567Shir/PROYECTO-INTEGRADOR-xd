const pool = require("../config/db");

const obtenerPersonal = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, correo, rol, es_comision
      FROM usuarios
      WHERE rol IN ('DOCENTE', 'DIRECTOR_TITULACION', 'SECRETARIA', 'COORDINADOR_CARRERA')
      ORDER BY id ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener personal:", error);
    res.status(500).json({ success: false, mensaje: "Error al obtener personal" });
  }
};

const crearPersonal = async (req, res) => {
  try {
    const { nombre, correo, clave, rol, es_comision } = req.body;

    const result = await pool.query(
      `
      INSERT INTO usuarios (nombre, correo, clave, rol, es_comision)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, correo, rol, es_comision
      `,
      [nombre, correo, clave, rol, es_comision || false]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error al crear personal:", error);
    res.status(500).json({ success: false, mensaje: "Error al crear personal" });
  }
};

const editarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, clave, rol, es_comision } = req.body;

    const result = await pool.query(
      `
      UPDATE usuarios
      SET nombre = $1,
          correo = $2,
          clave = $3,
          rol = $4,
          es_comision = $5
      WHERE id = $6
      RETURNING id, nombre, correo, rol, es_comision
      `,
      [nombre, correo, clave, rol, es_comision || false, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error al editar personal:", error);
    res.status(500).json({ success: false, mensaje: "Error al editar personal" });
  }
};

const eliminarPersonal = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

    res.json({ success: true, mensaje: "Personal eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar personal:", error);
    res.status(500).json({ success: false, mensaje: "Error al eliminar personal" });
  }
};

module.exports = {
  obtenerPersonal,
  crearPersonal,
  editarPersonal,
  eliminarPersonal,
};