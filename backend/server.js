const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

app.use("/api/auth", authRoutes);

app.listen(3001, () => {
  console.log("Backend corriendo en http://localhost:3001");
});