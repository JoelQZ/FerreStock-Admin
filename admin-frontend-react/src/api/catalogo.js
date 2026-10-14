import { api } from './cliente'

const datos = (respuesta) => respuesta.data
const incluirDesactivados = { params: { todos: 1 } }

export const listarProductos = (params) => api.get('/catalogo/productos/', { params }).then(datos)
export const obtenerProducto = (id) => api.get(`/catalogo/productos/${id}/`, incluirDesactivados).then(datos)
export const crearProducto = (producto) => api.post('/catalogo/productos/', producto).then(datos)
export const actualizarProducto = (id, cambios) =>
  api.patch(`/catalogo/productos/${id}/`, cambios, incluirDesactivados).then(datos)
export const desactivarProducto = (id) => api.delete(`/catalogo/productos/${id}/`)

export const listarCategorias = () => api.get('/catalogo/categorias/').then(datos)
export const listarMarcas = () => api.get('/catalogo/marcas/').then(datos)
export const listarUnidades = () => api.get('/catalogo/unidades/').then(datos)
