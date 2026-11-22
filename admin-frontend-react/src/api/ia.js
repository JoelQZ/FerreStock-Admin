import { api } from './cliente'

const datos = (respuesta) => respuesta.data

export const listarPredicciones = (params, signal) => api.get('/ia/predicciones/', { params, signal }).then(datos)
