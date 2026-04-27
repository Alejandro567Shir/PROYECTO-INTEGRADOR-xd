const pool = require("../config/db");

const login = async (req, res) => {
  try {
    const { correo, clave, rol } = req.body;

    // 1. Buscamos al usuario y traemos su pase VIP (es_comision)
    const result = await pool.query(
      "SELECT id, nombre, correo, rol, es_comision FROM usuarios WHERE correo = $1 AND clave = $2",
      [correo, clave]
    );

    // Si la clave o el correo están mal
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        mensaje: "Datos incorrectos",
      });
    }

    const usuario = result.rows[0];

    // 2. Si entra a su panel normal (Ej. Roberto entrando a Director)
    if (usuario.rol === rol) {
      return res.json({
        success: true,
        usuario: usuario,
      });
    }

    // 3. LA MAGIA: Si quiere entrar a Comisión y tiene Pase VIP
    if (rol === "COMISION DE TITULACION" && usuario.es_comision === true) {
      usuario.rol = "COMISION DE TITULACION"; // Engañamos a React temporalmente
      return res.json({
        success: true,
        usuario: usuario,
      });
    }

    // 4. Si falla todo lo anterior
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