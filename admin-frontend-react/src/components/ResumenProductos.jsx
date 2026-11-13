import { tieneStockBajo } from '../utils/formato'
import Kpi from './Kpi'

export default function ResumenProductos({ productos, cargando = false, totalCategorias }) {
  const conStockBajo = productos.filter((producto) => producto.estado && tieneStockBajo(producto)).length

  return (
    <section className="kpis">
      <Kpi etiqueta="Productos en la lista" valor={cargando ? '—' : productos.length} />
      <Kpi etiqueta="Con stock bajo" valor={cargando ? '—' : conStockBajo} alerta />
      <Kpi etiqueta="Categorías activas" valor={totalCategorias} />
    </section>
  )
}
