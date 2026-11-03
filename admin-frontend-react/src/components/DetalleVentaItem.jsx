import { formatearCantidad, formatearSoles } from '../utils/formato'

export default function DetalleVentaItem({ codigo, nombre, cantidad, precioUnitario = 0 }) {
  const importe = Number(cantidad) * Number(precioUnitario)

  return (
    <li className="detalle-venta__item">
      <span className="codigo">{codigo}</span>
      <span className="detalle-venta__nombre">{nombre}</span>
      <span className="detalle-venta__calculo">
        {formatearCantidad(cantidad)} × {formatearSoles(precioUnitario)}
      </span>
      <strong className="detalle-venta__importe">{formatearSoles(importe)}</strong>
    </li>
  )
}
