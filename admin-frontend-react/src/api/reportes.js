import { api } from './cliente'

const datos = (respuesta) => respuesta.data

export const obtenerReporteVentas = (params) => api.get('/reportes/ventas/', { params }).then(datos)
export const listarVentas = () => api.get('/ventas/ventas/').then(datos)
export const listarTurnos = () => api.get('/caja/turnos/').then(datos)
