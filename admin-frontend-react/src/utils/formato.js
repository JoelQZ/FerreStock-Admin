export const IGV = 0.18

const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const cantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })

export function formatearSoles(valor) {
  return soles.format(Number(valor) || 0)
}

export function formatearCantidad(valor) {
  return cantidad.format(Number(valor) || 0)
}

export function tieneStockBajo(producto) {
  return Number(producto.stock) <= Number(producto.stock_minimo)
}

export function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  return partes.slice(0, 2).map((parte) => parte[0].toUpperCase()).join('') || '?'
}
