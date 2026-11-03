import { useState } from 'react'
import { formatearSoles } from '../utils/formato'
import { comprobante, fechaCorta, horaDeVenta, metodosDeVenta } from '../utils/reporte'
import DetalleVentaItem from './DetalleVentaItem'

const COLUMNAS = 7

export default function VentaFila({ venta }) {
  const [abierta, setAbierta] = useState(false)

  const detalles = venta.detalles ?? []
  const completada = venta.estado === 'COMPLETADA'
  const totalProductos = detalles.reduce(
    (suma, detalle) => suma + Number(detalle.cantidad) * Number(detalle.precio_unitario),
    0,
  )

  return (
    <>
      <tr className={completada ? '' : 'inactiva'}>
        <td>
          <span className="codigo">{comprobante(venta)}</span>
        </td>
        <td className="sin-corte">
          {fechaCorta(venta)} <small className="tabla__detalle">{horaDeVenta(venta)}</small>
        </td>
        <td>{venta.usuario_nombre || '—'}</td>
        <td>{metodosDeVenta(venta)}</td>
        <td>
          <span className={`etiqueta ${completada ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
            {completada ? 'Completada' : 'Anulada'}
          </span>
        </td>
        <td className="num">{formatearSoles(venta.total)}</td>
        <td className="acciones">
          <button
            type="button"
            className="boton boton--secundario boton--chico"
            onClick={() => setAbierta((previo) => !previo)}
            disabled={detalles.length === 0}
            aria-expanded={abierta}
          >
            {abierta ? 'Ocultar' : `Ver productos (${detalles.length})`}
          </button>
        </td>
      </tr>

      {abierta && (
        <tr className="detalle-venta">
          <td colSpan={COLUMNAS}>
            <ul className="detalle-venta__lista">
              {detalles.map((detalle) => (
                <DetalleVentaItem
                  key={detalle.id_detalle}
                  codigo={detalle.producto_codigo}
                  nombre={detalle.producto_nombre}
                  cantidad={detalle.cantidad}
                  precioUnitario={detalle.precio_unitario}
                />
              ))}
            </ul>
            <p className="detalle-venta__total">
              Total de los productos <strong>{formatearSoles(totalProductos)}</strong>
            </p>
          </td>
        </tr>
      )}
    </>
  )
}
