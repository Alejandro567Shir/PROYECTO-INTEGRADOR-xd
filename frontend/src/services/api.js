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