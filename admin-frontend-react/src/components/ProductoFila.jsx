import { Link } from 'react-router-dom'
import { formatearSoles, tieneStockBajo } from '../utils/formato'
import EtiquetaStock from './EtiquetaStock'
import Icono from './Icono'

export default function ProductoFila({ producto, onCambiarEstado }) {
  return (
    <tr className={producto.estado ? '' : 'inactiva'}>
      <td>
        <span className="codigo">{producto.codigo}</span>
      </td>
      <td>
        <strong className="tabla__nombre">{producto.nombre}</strong>
        <small className="tabla__detalle">
          {producto.marca_nombre} · {producto.unidad_nombre}
        </small>
      </td>
      <td className="col-opcional">{producto.categoria_nombre}</td>
      <td className="num">{formatearSoles(producto.precio_venta)}</td>
      <td>
        <EtiquetaStock stock={producto.stock} stockBajo={tieneStockBajo(producto)} unidad={producto.unidad_nombre} />
      </td>
      <td className="col-opcional">
        <span className={`etiqueta ${producto.estado ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
          {producto.estado ? 'Activo' : 'Desactivado'}
        </span>
      </td>
      <td className="acciones">
        <div className="tabla__acciones">
          <Link to={`/productos/${producto.id_producto}/editar`} className="boton boton--secundario boton--chico">
            <Icono nombre="editar" tamano={15} />
            Editar
          </Link>
          <button
            type="button"
            className={`boton boton--secundario boton--chico${producto.estado ? ' boton--peligro' : ''}`}
            onClick={() => onCambiarEstado(producto)}
          >
            <Icono nombre="apagar" tamano={15} />
            {producto.estado ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>
      </td>
    </tr>
  )
}
