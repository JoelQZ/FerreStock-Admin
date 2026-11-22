import { formatearFechaHora, formatearSoles } from '../utils/formato'

export default function IngresoTabla({ ingresos, nombreProveedor }) {
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Documento</th>
            <th className="col-opcional">Productos</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map((ingreso) => (
            <tr key={ingreso.id_ingreso}>
              <td className="sin-corte">{formatearFechaHora(ingreso.fecha)}</td>
              <td>
                <strong className="tabla__nombre">{nombreProveedor(ingreso.proveedor)}</strong>
              </td>
              <td>
                <span className="codigo">{ingreso.nro_documento}</span>
              </td>
              <td className="col-opcional">
                {ingreso.items.length} {ingreso.items.length === 1 ? 'producto' : 'productos'}
                <small className="tabla__detalle">
                  {ingreso.items.map((item) => item.producto_nombre).join(', ')}
                </small>
              </td>
              <td className="num">{formatearSoles(ingreso.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
