import { api } from './cliente'

const datos = (respuesta) => respuesta.data
const incluirDesactivados = { params: { todos: 1 } }

export function adaptarProducto(producto) {
  return {
    ...producto,
    precio_compra: Number(producto.precio_compra),
    precio_venta: Number(producto.precio_venta),
    stock: Number(producto.stock),
    stock_minimo: Number(producto.stock_minimo),
  }
}

export const listarProductos = (params, signal) =>
  api.get('/catalogo/productos/', { params, signal }).then((respuesta) => respuesta.data.map(adaptarProducto))
export const obtenerProducto = (id) => api.get(`/catalogo/productos/${id}/`, incluirDesactivados).then(datos)
export const crearProducto = (producto) => api.post('/catalogo/productos/', producto).then(datos)
export const actualizarProducto = (id, cambios) =>
  api.patch(`/catalogo/productos/${id}/`, cambios, incluirDesactivados).then(datos)
export const desactivarProducto = (id) => api.delete(`/catalogo/productos/${id}/`)
export const obtenerSiguienteCodigo = (categoria, signal) =>
  api.get('/catalogo/productos/siguiente-codigo/', { params: { categoria }, signal }).then((respuesta) => respuesta.data.codigo)

export const listarCategorias = () => api.get('/catalogo/categorias/').then(datos)
export const listarMarcas = () => api.get('/catalogo/marcas/').then(datos)
export const listarUnidades = () => api.get('/catalogo/unidades/').then(datos)

export const listarCatalogo = (recurso, params, signal) =>
  api.get(`/catalogo/${recurso}/`, { params, signal }).then(datos)
export const crearEnCatalogo = (recurso, valores) => api.post(`/catalogo/${recurso}/`, valores).then(datos)
export const actualizarEnCatalogo = (recurso, id, cambios) =>
  api.patch(`/catalogo/${recurso}/${id}/`, cambios, incluirDesactivados).then(datos)
export const desactivarEnCatalogo = (recurso, id) => api.delete(`/catalogo/${recurso}/${id}/`)
