import { formatearCantidad, formatearFechaHora } from '../utils/formato'

const CLASE_TIPO = {
  ENTRADA: 'etiqueta--activo',
  SALIDA: 'etiqueta--agotado',
  AJUSTE: 'etiqueta--bajo',
}

function origen(movimiento) {
  return movimiento.documento || 'Ajuste'
}

export default function KardexTabla({ movimientos }) {
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th className="num">Cantidad</th>
            <th className="num">Stock</th>
            <th className="col-opcional">Origen</th>
            <th className="col-opcional">Usuario</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id_movimiento}>
              <td className="sin-corte">{formatearFechaHora(movimiento.fecha)}</td>
              <td>
                <strong className="tabla__nombre">{movimiento.producto_nombre}</strong>
                <small className="tabla__detalle">{movimiento.producto_codigo}</small>
              </td>
              <td>
                <span className={`etiqueta ${CLASE_TIPO[movimiento.tipo] ?? ''}`}>{movimiento.tipo}</span>
              </td>
              <td className="num">
                {movimiento.tipo === 'SALIDA' ? '−' : '+'}
                {formatearCantidad(movimiento.cantidad)}
              </td>
              <td className="num sin-corte">
                {formatearCantidad(movimiento.stock_anterior)} → <strong>{formatearCantidad(movimiento.stock_nuevo)}</strong>
              </td>
              <td className="col-opcional">{origen(movimiento)}</td>
              <td className="col-opcional">{movimiento.usuario_nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
