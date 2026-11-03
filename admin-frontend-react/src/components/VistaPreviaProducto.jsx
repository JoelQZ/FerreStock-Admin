import { IGV, formatearSoles } from '../utils/formato'
import EtiquetaStock from './EtiquetaStock'
import Icono from './Icono'

export default function VistaPreviaProducto({ form, categorias = [], marcas = [], unidades = [] }) {
  const precio = Number(form.precio_venta) || 0
  const costo = Number(form.precio_compra) || 0
  const opGravada = precio / (1 + IGV)
  const nombreCategoria = categorias.find((item) => String(item.id_categoria) === String(form.categoria))?.nombre
  const nombreMarca = marcas.find((item) => String(item.id_marca) === String(form.marca))?.nombre
  const unidad = unidades.find((item) => String(item.id_unidad) === String(form.unidad))?.abreviatura
  const stockBajo = form.stock !== '' && Number(form.stock) <= (Number(form.stock_minimo) || 0)

  return (
    <aside className="tarjeta vista-previa" aria-label="Vista previa del producto">
      <div className="vista-previa__imagen">
        <Icono nombre="tuerca" tamano={44} />
      </div>
      <div className="vista-previa__cuerpo">
        <p className="topbar__kicker">VISTA PREVIA</p>
        <h3>{form.nombre.trim() || 'Nombre del producto'}</h3>
        <p className="vista-previa__sub">
          <span className="codigo">{form.codigo.trim() || 'SKU'}</span>
          {' · '}
          {nombreMarca ?? 'Marca'}
        </p>
        <p className="vista-previa__precio">{formatearSoles(precio)}</p>

        <dl className="vista-previa__filas">
          <div>
            <dt>Categoría</dt>
            <dd>{nombreCategoria ?? '—'}</dd>
          </div>
          <div>
            <dt>Op. gravada</dt>
            <dd>{formatearSoles(opGravada)}</dd>
          </div>
          <div>
            <dt>IGV (18 %)</dt>
            <dd>{formatearSoles(precio - opGravada)}</dd>
          </div>
          {costo > 0 && (
            <div>
              <dt>Ganancia por unidad</dt>
              <dd className={precio - costo < 0 ? 'texto-rojo' : ''}>{formatearSoles(precio - costo)}</dd>
            </div>
          )}
          <div>
            <dt>Stock</dt>
            <dd>
              <EtiquetaStock stock={form.stock || 0} stockBajo={stockBajo} unidad={unidad} />
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  )
}
