const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const path = require('path');
const proyectosRoutes = require("./routes/proyectos.routes"); // <-- Agrega esta línea
const usuariosRoutes = require("./routes/usuarios.routes");
const comisionRoutes = require("./routes/comision.routes");
const historialRoutes = require("./routes/historial.routes");


const app = express();

app.use(cors());
app.use(express.json());
// Asegúrate de requerir 'path' arriba si no lo tienes: const path = require('path');
// Esta línea permite acceder a los archivos de la carpeta uploads desde el navegador
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

app.use("/api/auth", authRoutes); // Ya lo tenías
app.use("/api/proyectos", proyectosRoutes); // <-- Agrega esta línea
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/comision", comisionRoutes);
app.use("/api/historial", historialRoutes);

app.listen(3001, () => {
  console.log("Backend corriendo en http://localhost:3001");
});