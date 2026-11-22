import { formatearSoles } from '../utils/formato'

const TOTAL_EJEMPLO = 118

export default function VistaComprobante({ valores }) {
  const igv = Number(valores.igv_porcentaje) || 0
  const subtotal = TOTAL_EJEMPLO / (1 + igv / 100)

  return (
    <aside className="tarjeta vista-previa">
      <div className="tarjeta__cabecera">
        <h2>Vista del comprobante</h2>
      </div>
      <div className="comprobante">
        <strong className="comprobante__nombre">{valores.nombre.trim() || 'Nombre de la ferretería'}</strong>
        <span>RUC {valores.ruc.trim() || '—'}</span>
        <span>{valores.direccion.trim() || 'Dirección'}</span>
        {valores.telefono.trim() && <span>Tel. {valores.telefono.trim()}</span>}
        <span className="comprobante__tipo">Boleta de venta electrónica</span>
        <div className="comprobante__fila">
          <span>Op. gravada</span>
          <span>{formatearSoles(subtotal)}</span>
        </div>
        <div className="comprobante__fila">
          <span>IGV {igv} %</span>
          <span>{formatearSoles(TOTAL_EJEMPLO - subtotal)}</span>
        </div>
        <div className="comprobante__fila comprobante__total">
          <span>Total</span>
          <span>{formatearSoles(TOTAL_EJEMPLO)}</span>
        </div>
      </div>
      <p className="comprobante__nota">Ejemplo con una venta de {formatearSoles(TOTAL_EJEMPLO)}.</p>
    </aside>
  )
}
