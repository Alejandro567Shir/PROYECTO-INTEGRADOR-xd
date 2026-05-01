const express = require("express");
const router = express.Router();

const {
  obtenerPersonal,
  crearPersonal,
  editarPersonal,
  eliminarPersonal,
} = require("../controllers/usuarios.controller");

router.get("/personal", obtenerPersonal);
router.post("/personal", crearPersonal);
router.put("/personal/:id", editarPersonal);
router.delete("/personal/:id", eliminarPersonal);

module.exports = router;