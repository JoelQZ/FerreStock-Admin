import { api } from './cliente'

const datos = (respuesta) => respuesta.data

export const listarProveedores = (signal) => api.get('/inventario/proveedores/', { signal }).then(datos)
export const crearProveedor = (proveedor) => api.post('/inventario/proveedores/', proveedor).then(datos)
export const actualizarProveedor = (id, cambios) => api.patch(`/inventario/proveedores/${id}/`, cambios).then(datos)
export const desactivarProveedor = (id) => api.delete(`/inventario/proveedores/${id}/`)

export const listarIngresos = (signal) => api.get('/inventario/ingresos/', { signal }).then(datos)
export const registrarIngreso = (ingreso) => api.post('/inventario/ingresos/', ingreso).then(datos)

export const listarKardex = (signal, params) => api.get('/inventario/kardex/', { params, signal }).then(datos)
