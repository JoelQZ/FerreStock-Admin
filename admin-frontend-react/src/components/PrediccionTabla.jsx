import { formatearCantidad, formatearFechaHora } from '../utils/formato'

const DIAS_URGENTE = 7

export default function PrediccionTabla({ predicciones, cargando = false }) {
  return (
    <div className={`tabla-contenedor${cargando ? ' tabla-contenedor--cargando' : ''}`}>
      <table className="tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="num">Stock actual</th>
            <th className="num col-opcional">Demanda diaria</th>
            <th>Se agota en</th>
            <th className="num">Comprar</th>
            <th className="col-opcional">Calculado</th>
          </tr>
        </thead>
        <tbody>
          {predicciones.map((prediccion) => {
            const dias = prediccion.dias_para_agotarse
            const bajo = Number(prediccion.stock_actual) <= Number(prediccion.stock_minimo)

            return (
              <tr key={prediccion.id_prediccion}>
                <td>
                  <strong className="tabla__nombre">{prediccion.producto_nombre}</strong>
                  <small className="tabla__detalle">{prediccion.producto_codigo}</small>
                </td>
                <td className={`num${bajo ? ' texto-rojo' : ''}`}>
                  {formatearCantidad(prediccion.stock_actual)}
                  <small className="tabla__detalle">mín. {formatearCantidad(prediccion.stock_minimo)}</small>
                </td>
                <td className="num col-opcional">{formatearCantidad(prediccion.demanda_estimada)}</td>
                <td>
                  <span
                    className={`etiqueta ${dias <= DIAS_URGENTE ? 'etiqueta--agotado' : dias <= DIAS_URGENTE * 2 ? 'etiqueta--bajo' : 'etiqueta--activo'}`}
                  >
                    {dias === 1 ? '1 día' : `${dias} días`}
                  </span>
                </td>
                <td className="num">
                  <strong>{formatearCantidad(prediccion.cantidad_sugerida)}</strong>
                </td>
                <td className="col-opcional sin-corte">{formatearFechaHora(prediccion.fecha_calculo)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
