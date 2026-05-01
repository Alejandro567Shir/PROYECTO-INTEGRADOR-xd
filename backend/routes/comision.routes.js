const express = require("express");
const router = express.Router();

const {
  obtenerProyectosComision,
  obtenerRevisionesProyecto,
  guardarRevisionComision,
  enviarCorreccionesEstudiante,
  aprobarComision,
} = require("../controllers/comision.controller");

router.get("/proyectos", obtenerProyectosComision);
router.get("/revisiones/:proyectoId", obtenerRevisionesProyecto);
router.post("/revision/:proyectoId", guardarRevisionComision);
router.put("/enviar-correcciones/:proyectoId", enviarCorreccionesEstudiante);
router.put("/aprobar/:proyectoId", aprobarComision);

module.exports = router;