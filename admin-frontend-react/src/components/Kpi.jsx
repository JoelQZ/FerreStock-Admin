export default function Kpi({ etiqueta, valor, detalle, alerta = false }) {
  return (
    <div className={`tarjeta kpi${alerta ? ' kpi--alerta' : ''}`}>
      <span>{etiqueta}</span>
      <strong>{valor}</strong>
      {detalle && <small className="kpi__detalle">{detalle}</small>}
    </div>
  )
}
