import { api } from './cliente'

const datos = (respuesta) => respuesta.data

export const listarUsuarios = (signal) => api.get('/usuarios/', { signal }).then(datos)
export const crearUsuario = (usuario) => api.post('/usuarios/', usuario).then(datos)
export const actualizarUsuario = (id, cambios) => api.patch(`/usuarios/${id}/`, cambios).then(datos)
export const desactivarUsuario = (id) => api.delete(`/usuarios/${id}/`)

export const listarRoles = () => api.get('/roles/').then(datos)
