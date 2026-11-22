import { api } from './cliente'

const datos = (respuesta) => respuesta.data

export const obtenerNegocio = (signal) => api.get('/configuracion/negocio/', { signal }).then(datos)
export const guardarNegocio = (negocio, existe) =>
  (existe ? api.patch('/configuracion/negocio/', negocio) : api.put('/configuracion/negocio/', negocio)).then(datos)
