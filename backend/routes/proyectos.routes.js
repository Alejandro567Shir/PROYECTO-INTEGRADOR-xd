const express = require("express");
const router = express.Router();
const multer = require("multer");

// ¡Aquí está la magia! Agregamos actualizarEstado y obtenerProyectosF2 a la lista
const { 
  obtenerProyectosPorDocente, 
  crearProyecto, 
  obtenerProyectoEstudiante, 
  subirCorreccion,
  actualizarEstado, 
  obtenerProyectosF2 
} = require("../controllers/proyectos.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname) 
  }
});
const upload = multer({ storage: storage });

// --- TUS RUTAS ---
router.get("/docente/:docenteId", obtenerProyectosPorDocente);
router.post("/", upload.single('archivoPdf'), crearProyecto);
router.get("/estudiante/:id", obtenerProyectoEstudiante);
router.put("/correccion/:id", subirCorreccion); // La corrección ya no lleva archivo

// --- LAS DOS RUTAS NUEVAS ---
router.put("/estado/:id", actualizarEstado);
router.get("/fase2/todos", obtenerProyectosF2);

module.exports = router;