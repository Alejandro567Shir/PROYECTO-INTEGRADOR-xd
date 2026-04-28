const API_URL = "http://localhost:3001";

export async function loginUsuario(datos) {

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  return response.json();
}
// Agrega esto al final de tu archivo api.js
export const obtenerProyectosDocente = async (docenteId) => {
  try {
    const respuesta = await fetch(`http://localhost:3001/api/proyectos/docente/${docenteId}`);
    const data = await respuesta.json();
    return { success: true, data: data };
  } catch (error) {
    console.error("Error al obtener los proyectos:", error);
    return { success: false, mensaje: "Error de conexión con el servidor" };
  }
};