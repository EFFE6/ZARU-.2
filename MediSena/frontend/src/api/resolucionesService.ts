import api from "./api";

export const getResoluciones = () => api.get("/resoluciones");
export const createResolucion = (data: any) => api.post("/resoluciones", data);
export const updateResolucion = (id: number, data: any) =>
  api.put(`/resoluciones/${id}`, data);
export const deleteResolucion = (id: number) =>
  api.delete(`/resoluciones/${id}`);