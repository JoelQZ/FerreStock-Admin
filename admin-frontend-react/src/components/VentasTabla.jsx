import VentaFila from './VentaFila'

export default function VentasTabla({ ventas, limite = 15 }) {
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Comprobante</th>
            <th>Fecha</th>
            <th>Cajero</th>
            <th>Tipo de pago</th>
            <th>Estado</th>
            <th className="num">Total</th>
            <th className="acciones">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {ventas.slice(0, limite).map((venta) => (
            <VentaFila key={venta.id_venta} venta={venta} />
          ))}
        </tbody>
      </table>
      {ventas.length > limite && (
        <p className="tabla__pie">
          Mostrando {limite} de {ventas.length} ventas.
        </p>
      )}
    </div>
  )
}
