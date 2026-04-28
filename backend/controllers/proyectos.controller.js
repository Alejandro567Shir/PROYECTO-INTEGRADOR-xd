const pool = require("../config/db");

// 1. OBTENER PROYECTOS POR DOCENTE (Para el DocenteDashboard)
const obtenerProyectosPorDocente = async (req, res) => {
    try {
        const { docenteId } = req.params;
        const result = await pool.query(
            `SELECT p.id, p.titulo as tema, p.estado, p.ruta_archivo, 
              u.nombre as estudiante_nombre, u.id as estudiante_codigo
       FROM proyectos p 
       JOIN usuarios u ON p.estudiante_id = u.id 
       WHERE p.docente_id = $1`,
            [docenteId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener proyectos del docente:", error);
        res.status(500).json({ mensaje: "Error en el servidor al buscar proyectos" });
    }
};

// 2. CREAR PROYECTO (Con candado inteligente)
const crearProyecto = async (req, res) => {
    try {
        const { estudianteId, titulo, descripcion, docenteId } = req.body;

        // 1. Buscamos si el estudiante ya tiene una fila en la tabla
        const verificacion = await pool.query(
            "SELECT * FROM proyectos WHERE estudiante_id = $1",
            [estudianteId]
        );

        // 2. Si ya existe, le explicamos por qué lo detenemos
        if (verificacion.rows.length > 0) {
            const estadoActual = verificacion.rows[0].estado.replace(/_/g, " ");
            return res.status(400).json({
                success: false,
                mensaje: `Ya tienes un proyecto en estado: ${estadoActual}. No puedes crear uno nuevo, debes esperar revisión o subir una corrección.`
            });
        }

        // 3. Si no tiene nada, lo guardamos normalmente
        const rutaArchivo = req.file ? req.file.path : null;

        const result = await pool.query(
            `INSERT INTO proyectos (estudiante_id, docente_id, titulo, descripcion, estado, fecha_creacion, ruta_archivo)
       VALUES ($1, $2, $3, $4, 'EN_REVISION_F1', CURRENT_TIMESTAMP, $5)
       RETURNING *`,
            [estudianteId, docenteId, titulo, descripcion, rutaArchivo]
        );

        res.status(201).json({
            success: true,
            mensaje: "Proyecto subido correctamente",
            proyecto: result.rows[0]
        });

    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        res.status(500).json({ success: false, mensaje: "Error al guardar en la base de datos" });
    }
};

// 3. OBTENER PROYECTO DEL ESTUDIANTE (Para el historial del EstudianteDashboard)
const obtenerProyectoEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT p.*, u.nombre as docente_nombre 
       FROM proyectos p 
       LEFT JOIN usuarios u ON p.docente_id = u.id 
       WHERE p.estudiante_id = $1 
       ORDER BY p.fecha_creacion DESC LIMIT 1`,
            [id]
        );
        res.json({ success: true, proyecto: result.rows[0] });
    } catch (error) {
        console.error("Error al obtener proyecto del estudiante:", error);
        res.status(500).json({ success: false, mensaje: "Error del servidor" });
    }
};

// 4. FUNCIÓN PARA QUE EL DOCENTE MANDE COMENTARIOS
const subirCorreccion = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body; // Ya no pedimos archivo, solo el texto

    // Actualizamos el proyecto: le ponemos el comentario y cambiamos el estado
    await pool.query(
      `UPDATE proyectos 
       SET comentarios_docente = $1, estado = 'ESPERANDO_CORRECCION' 
       WHERE id = $2`,
      [comentarios, id]
    );

    res.json({ success: true, mensaje: "Comentarios enviados al estudiante exitosamente." });
  } catch (error) {
    console.error("Error al enviar comentarios:", error);
    res.status(500).json({ success: false, mensaje: "Error del servidor." });
  }
};

// 5. FUNCIÓN PARA CAMBIAR EL ESTADO (Aprobar, Rechazar, Mandar a Comisión)
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await pool.query(`UPDATE proyectos SET estado = $1 WHERE id = $2`, [estado, id]);
    res.json({ success: true, mensaje: `Proyecto actualizado a ${estado}` });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ success: false, mensaje: "Error del servidor." });
  }
};

// 6. FUNCIÓN PARA EL DIRECTOR F2 (Ing. Roberto) - Solo trae los aprobados por F1
const obtenerProyectosF2 = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.nombre as estudiante_nombre 
       FROM proyectos p 
       JOIN usuarios u ON p.estudiante_id = u.id 
       WHERE p.estado IN ('APROBADO_F1', 'RUBRICA_SUBIDA', 'EN_COMISION')`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener proyectos F2:", error);
    res.status(500).json({ success: false, mensaje: "Error del servidor." });
  }
};


// EXPORTAMOS TODAS LAS FUNCIONES (¡No te olvides de ninguna!)
module.exports = {
  obtenerProyectosPorDocente,
  crearProyecto,
  obtenerProyectoEstudiante,
  subirCorreccion,
  actualizarEstado,
  obtenerProyectosF2
};