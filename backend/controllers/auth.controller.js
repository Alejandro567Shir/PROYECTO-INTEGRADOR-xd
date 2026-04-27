const pool = require("../config/db");

const login = async (req, res) => {
  try {
    const { correo, clave, rol } = req.body;
    const result = await pool.query(
      "SELECT id, nombre, correo, rol, es_comision FROM usuarios WHERE correo = $1 AND clave = $2",
      [correo, clave]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        mensaje: "Datos incorrectos",
      });
    }

    const usuario = result.rows[0];

    if (usuario.rol === rol) {
      return res.json({
        success: true,
        usuario: usuario,
      });
    }

  
    if (rol === "COMISION DE TITULACION" && usuario.es_comision === true) {
      usuario.rol = "COMISION DE TITULACION"; 
      return res.json({
        success: true,
        usuario: usuario,
      });
    }

    return res.json({
      success: false,
      mensaje: "No tienes permiso para ingresar a este panel",
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error en servidor",
    });
  }
};

module.exports = {
  login,
};