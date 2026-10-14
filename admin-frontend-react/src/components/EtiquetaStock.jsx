import { formatearCantidad } from '../utils/formato'

export default function EtiquetaStock({ stock, stockBajo, unidad }) {
  const cantidad = `${formatearCantidad(stock)} ${unidad ?? ''}`.trim()

  if (Number(stock) <= 0) return <span className="etiqueta etiqueta--agotado">Agotado</span>
  if (stockBajo) return <span className="etiqueta etiqueta--bajo">Bajo: {cantidad}</span>
  return <span className="stock">{cantidad}</span>
}
