const express = require("express");
const router = express.Router();

const {
  obtenerHistorialActividad,
} = require("../controllers/historial.controller");

router.get("/actividad", obtenerHistorialActividad);

module.exports = router;