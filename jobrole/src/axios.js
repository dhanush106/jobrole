import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000",
});

api.interceptors.request.use((config) => {
  const isAdminRoute = config.url.startsWith("/api/admin");
  const token = isAdminRoute
    ? (localStorage.getItem("adminToken") || localStorage.getItem("token"))
    : (localStorage.getItem("token") || localStorage.getItem("adminToken"));

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
