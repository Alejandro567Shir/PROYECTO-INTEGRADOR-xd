const pool = require("../config/db");
const { registrarActividad } = require("./historial.controller");

// 1. OBTENER PROYECTOS POR DOCENTE
const obtenerProyectosPorDocente = async (req, res) => {
  try {
    const { docenteId } = req.params;

    const result = await pool.query(
      `SELECT 
          p.id, 
          p.titulo as tema, 
          p.estado, 
          p.ruta_archivo, 
          p.comentarios_docente,
          u.nombre as estudiante_nombre, 
          u.id as estudiante_codigo
       FROM proyectos p 
       JOIN usuarios u ON p.estudiante_id = u.id 
       WHERE p.docente_id = $1
       ORDER BY p.fecha_creacion DESC`,
      [docenteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener proyectos del docente:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor al buscar proyectos",
    });
  }
};

// 2. CREAR PROYECTO
const crearProyecto = async (req, res) => {
  try {
    const { estudianteId, titulo, descripcion, docenteId } = req.body;

    const verificacion = await pool.query(
      "SELECT * FROM proyectos WHERE estudiante_id = $1",
      [estudianteId]
    );

    if (verificacion.rows.length > 0) {
      const estadoActual = verificacion.rows[0].estado.replace(/_/g, " ");
      return res.status(400).json({
        success: false,
        mensaje: `Ya tienes un proyecto en estado: ${estadoActual}. No puedes crear uno nuevo, debes esperar revisión o subir una corrección.`,
      });
    }

    const estudiante = await pool.query(
      "SELECT nombre, rol FROM usuarios WHERE id = $1",
      [estudianteId]
    );

    const nombreEstudiante = estudiante.rows[0]?.nombre || "Estudiante";
    const rutaArchivo = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO proyectos 
       (estudiante_id, docente_id, titulo, descripcion, estado, fecha_creacion, ruta_archivo)
       VALUES ($1, $2, $3, $4, 'EN_REVISION_F1', CURRENT_TIMESTAMP, $5)
       RETURNING *`,
      [estudianteId, docenteId, titulo, descripcion, rutaArchivo]
    );

    const proyectoCreado = result.rows[0];

    await registrarActividad({
      proyecto_id: proyectoCreado.id,
      usuario_id: estudianteId,
      usuario_nombre: nombreEstudiante,
      usuario_rol: "ALUMNO",
      accion: "PROYECTO_ENVIADO_A_DOCENTE_F1",
      detalle: `${nombreEstudiante} subió el proyecto "${titulo}" y lo envió a revisión del Docente F1.`,
      estado_anterior: "BORRADOR",
      estado_nuevo: "EN_REVISION_F1",
    });

    res.status(201).json({
      success: true,
      mensaje: "Proyecto subido correctamente",
      proyecto: proyectoCreado,
    });
  } catch (error) {
    console.error("Error al crear el proyecto:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al guardar en la base de datos",
    });
  }
};

// 3. OBTENER PROYECTO DEL ESTUDIANTE
const obtenerProyectoEstudiante = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
          p.*, 
          u.nombre as docente_nombre 
       FROM proyectos p 
       LEFT JOIN usuarios u ON p.docente_id = u.id 
       WHERE p.estudiante_id = $1 
       ORDER BY p.fecha_creacion DESC 
       LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      proyecto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener proyecto del estudiante:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor",
    });
  }
};

// 4. DOCENTE MANDA CORRECCIONES
const subirCorreccion = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios, usuario_id, usuario_nombre, usuario_rol, detalle } =
      req.body;

    if (!comentarios || comentarios.trim() === "") {
      return res.status(400).json({
        success: false,
        mensaje: "Debes escribir las correcciones.",
      });
    }

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado, 
          p.titulo, 
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoAnterior.rows[0];

    await pool.query(
      `UPDATE proyectos 
       SET comentarios_docente = $1, 
           estado = 'ESPERANDO_CORRECCION'
       WHERE id = $2`,
      [comentarios, id]
    );

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Docente",
      usuario_rol: usuario_rol || "DOCENTE",
      accion: "DOCENTE_SOLICITO_CORRECCION",
      detalle:
        detalle ||
        `El docente solicitó correcciones al proyecto de ${proyecto.estudiante_nombre}: ${comentarios}`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "ESPERANDO_CORRECCION",
    });

    res.json({
      success: true,
      mensaje: "Comentarios enviados al estudiante exitosamente.",
    });
  } catch (error) {
    console.error("Error al enviar comentarios:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor.",
    });
  }
};

// 5. ESTUDIANTE SUBE CORRECCIÓN PARA DOCENTE F1
const subirCorreccionDocenteEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, usuario_id, usuario_nombre, usuario_rol, detalle } =
      req.body;

    const rutaArchivo = req.file ? req.file.path : null;

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        mensaje: "Debes subir el PDF corregido.",
      });
    }

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado,
          p.titulo,
          p.estudiante_id,
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado.",
      });
    }

    const proyecto = proyectoAnterior.rows[0];
    const nuevoTitulo =
      titulo && titulo.trim() !== "" ? titulo : proyecto.titulo;

    const result = await pool.query(
      `UPDATE proyectos
       SET titulo = $1,
           ruta_archivo = $2,
           comentarios_docente = NULL,
           estado = 'EN_REVISION_F1',
           fecha_creacion = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [nuevoTitulo, rutaArchivo, id]
    );

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || proyecto.estudiante_id,
      usuario_nombre: usuario_nombre || proyecto.estudiante_nombre,
      usuario_rol: usuario_rol || "ALUMNO",
      accion: "ESTUDIANTE_ENVIO_CORRECCION_DOCENTE",
      detalle:
        detalle ||
        `${proyecto.estudiante_nombre} subió el PDF corregido y lo envió nuevamente al Docente F1.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "EN_REVISION_F1",
    });

    res.json({
      success: true,
      mensaje: "Corrección enviada nuevamente al Docente F1.",
      proyecto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al subir corrección del estudiante:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al enviar la corrección al docente.",
    });
  }
};

// 6. CAMBIAR ESTADO
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, usuario_id, usuario_nombre, usuario_rol, detalle } =
      req.body;

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado, 
          p.titulo, 
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoAnterior.rows[0];
    const estadoAnterior = proyecto.estado;

    await pool.query("UPDATE proyectos SET estado = $1 WHERE id = $2", [
      estado,
      id,
    ]);

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Sistema",
      usuario_rol: usuario_rol || "SISTEMA",
      accion: `CAMBIO_ESTADO_A_${estado}`,
      detalle:
        detalle ||
        `El estado del proyecto "${proyecto.titulo}" de ${proyecto.estudiante_nombre} cambió de ${estadoAnterior} a ${estado}.`,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado,
    });

    res.json({
      success: true,
      mensaje: `Proyecto actualizado a ${estado}`,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor.",
    });
  }
};

// 7. PROYECTOS F2
const obtenerProyectosF2 = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.*, 
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.estado IN (
        'APROBADO_COMISION',
        'EN_REVISION_F2',
        'RUBRICA_SUBIDA',
        'APROBADO_F2',
        'VALIDACION_LOCAL'
       )
       ORDER BY p.fecha_creacion DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener proyectos F2:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor al obtener proyectos F2",
    });
  }
};

// 8. ESTUDIANTE SUBE CORRECCIÓN DE COMISIÓN
const subirCorreccionComision = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, usuario_id, usuario_nombre, usuario_rol, detalle } =
      req.body;

    const rutaArchivo = req.file ? req.file.path : null;

    if (!rutaArchivo) {
      return res.status(400).json({
        success: false,
        mensaje: "Debe subir un PDF corregido",
      });
    }

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado, 
          p.titulo, 
          u.nombre AS estudiante_nombre, 
          u.id AS estudiante_id
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoAnterior.rows[0];
    const nuevoTitulo =
      titulo && titulo.trim() !== "" ? titulo : proyecto.titulo;

    await pool.query(
      `UPDATE proyectos
       SET titulo = $1,
           ruta_archivo = $2,
           estado = 'EN_COMISION',
           fecha_creacion = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nuevoTitulo, rutaArchivo, id]
    );

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || proyecto.estudiante_id,
      usuario_nombre: usuario_nombre || proyecto.estudiante_nombre,
      usuario_rol: usuario_rol || "ALUMNO",
      accion: "ESTUDIANTE_ENVIO_CORRECCION_COMISION",
      detalle:
        detalle ||
        `${proyecto.estudiante_nombre} subió el PDF corregido y lo envió nuevamente a Comisión.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "EN_COMISION",
    });

    res.json({
      success: true,
      mensaje: "Corrección enviada nuevamente a Comisión",
    });
  } catch (error) {
    console.error("Error al subir corrección comisión:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al enviar corrección",
    });
  }
};

// 9. DIRECTOR SUBE RÚBRICA F2
const subirRubricaF2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, usuario_nombre, usuario_rol, detalle } = req.body;

    const rutaRubrica = req.file ? req.file.path : null;

    if (!rutaRubrica) {
      return res.status(400).json({
        success: false,
        mensaje: "Debe subir la rúbrica evaluada en PDF.",
      });
    }

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado, 
          p.titulo, 
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado.",
      });
    }

    const proyecto = proyectoAnterior.rows[0];

    const result = await pool.query(
      `UPDATE proyectos
       SET ruta_rubrica = $1,
           estado = 'RUBRICA_SUBIDA'
       WHERE id = $2
       RETURNING *`,
      [rutaRubrica, id]
    );

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Director F2",
      usuario_rol: usuario_rol || "DIRECTOR_TITULACION",
      accion: "DIRECTOR_SUBIO_RUBRICA_F2",
      detalle:
        detalle ||
        `El Director F2 subió la rúbrica evaluada del proyecto de ${proyecto.estudiante_nombre}.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "RUBRICA_SUBIDA",
    });

    res.json({
      success: true,
      mensaje: "Rúbrica evaluada subida correctamente.",
      proyecto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al subir rúbrica F2:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al subir la rúbrica.",
    });
  }
};

// 10. PROYECTOS DE COORDINACIÓN
const obtenerProyectosCoordinacion = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.*,
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.estado IN ('APROBADO_F2', 'REVISION_SEDE_CENTRAL')
       ORDER BY p.fecha_creacion DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener proyectos de coordinación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener proyectos de coordinación",
    });
  }
};

// 11. COORDINADOR SELLA Y ENVÍA A MATRIZ
const sellarProyectoCoordinacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, usuario_nombre, usuario_rol, detalle } = req.body;

    const documentoSellado =
      req.files && req.files.documentoSellado
        ? req.files.documentoSellado[0].path
        : null;

    const documentosAdicionales =
      req.files && req.files.documentosAdicionales
        ? req.files.documentosAdicionales.map((file) => file.path)
        : [];

    if (!documentoSellado) {
      return res.status(400).json({
        success: false,
        mensaje: "Debes subir el PDF sellado y firmado.",
      });
    }

    const proyectoAnterior = await pool.query(
      `SELECT 
          p.estado, 
          p.titulo, 
          u.nombre AS estudiante_nombre
       FROM proyectos p
       JOIN usuarios u ON p.estudiante_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyectoAnterior.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Proyecto no encontrado",
      });
    }

    const proyecto = proyectoAnterior.rows[0];

    const result = await pool.query(
      `UPDATE proyectos
       SET ruta_documento_sellado = $1,
           rutas_documentos_adicionales = $2,
           estado = 'REVISION_SEDE_CENTRAL'
       WHERE id = $3
       RETURNING *`,
      [documentoSellado, JSON.stringify(documentosAdicionales), id]
    );

    await registrarActividad({
      proyecto_id: id,
      usuario_id: usuario_id || null,
      usuario_nombre: usuario_nombre || "Coordinador",
      usuario_rol: usuario_rol || "COORDINADOR_CARRERA",
      accion: "COORDINADOR_ENVIO_A_MATRIZ",
      detalle:
        detalle ||
        `El coordinador subió el documento sellado y firmado del proyecto de ${proyecto.estudiante_nombre}, y lo envió a Matriz.`,
      estado_anterior: proyecto.estado,
      estado_nuevo: "REVISION_SEDE_CENTRAL",
    });

    res.json({
      success: true,
      mensaje: "Documento sellado y enviado a Matriz correctamente.",
      proyecto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al sellar proyecto:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al sellar y enviar el proyecto.",
    });
  }
};

module.exports = {
  obtenerProyectosPorDocente,
  crearProyecto,
  obtenerProyectoEstudiante,
  subirCorreccion,
  subirCorreccionDocenteEstudiante,
  actualizarEstado,
  obtenerProyectosF2,
  subirCorreccionComision,
  subirRubricaF2,
  obtenerProyectosCoordinacion,
  sellarProyectoCoordinacion,
};