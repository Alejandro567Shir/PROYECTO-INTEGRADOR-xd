const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
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
} = require("../controllers/proyectos.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ===============================
// RUTAS DOCENTE / ESTUDIANTE
// ===============================

// Docente ve sus proyectos
router.get("/docente/:docenteId", obtenerProyectosPorDocente);

// Estudiante sube proyecto inicial
router.post("/", upload.single("archivoPdf"), crearProyecto);

// Estudiante ve su proyecto
router.get("/estudiante/:id", obtenerProyectoEstudiante);

// Docente manda comentario/corrección al estudiante
// IMPORTANTE: aquí va upload.none() porque no se sube archivo, solo texto.
router.put("/correccion/:id", upload.none(), subirCorreccion);

// Estudiante sube PDF corregido para que vuelva al Docente F1
router.put(
  "/correccion-docente/:id",
  upload.single("archivoPdf"),
  subirCorreccionDocenteEstudiante
);

// ===============================
// RUTAS COORDINADOR
// ===============================

router.get("/coordinacion/pendientes", obtenerProyectosCoordinacion);

router.put(
  "/coordinacion/sellar/:id",
  upload.fields([
    { name: "documentoSellado", maxCount: 1 },
    { name: "documentosAdicionales", maxCount: 10 },
  ]),
  sellarProyectoCoordinacion
);

// ===============================
// RUTAS GENERALES DE ESTADO
// ===============================

router.put("/estado/:id", actualizarEstado);

// ===============================
// RUTAS DIRECTOR F2
// ===============================

router.get("/fase2/todos", obtenerProyectosF2);

router.put(
  "/rubrica/:id",
  upload.single("rubricaPdf"),
  subirRubricaF2
);

// ===============================
// RUTA CORRECCIÓN COMISIÓN / ESTUDIANTE
// ===============================

router.put(
  "/correccion-comision/:id",
  upload.single("archivoPdf"),
  subirCorreccionComision
);

module.exports = router;