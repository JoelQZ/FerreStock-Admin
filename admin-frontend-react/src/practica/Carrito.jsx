import { useEffect } from 'react'

export default function Carrito({ lineas, onQuitar, onVaciar }) {
  const total = lineas.reduce((suma, linea) => suma + Number(linea.precio) * linea.cantidad, 0)
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)

  useEffect(() => {
    console.log('Efecto del título, unidades:', unidades)
    document.title = `Carrito (${unidades}) — Cafetería`
  }, [unidades])

  return (
    <section className="tarjeta practica__seccion">
      <div className="tarjeta__cabecera practica__cabecera-carrito">
        <h2>Carrito</h2>
        {lineas.length > 0 && (
          <button type="button" className="boton boton--secundario boton--chico" onClick={onVaciar}>
            Vaciar carrito
          </button>
        )}
      </div>
      {lineas.length === 0 && <p className="practica__vacio">El carrito está vacío</p>}
      <ul className="practica__lista">
        {lineas.map((linea) => (
          <li key={linea.id} className="practica__linea">
            <span className="practica__nombre">{linea.nombre}</span>
            <span>x {linea.cantidad}</span>
            <span className="practica__precio">
              S/ {(Number(linea.precio) * linea.cantidad).toFixed(2)}
            </span>
            <button
              type="button"
              className="boton boton--secundario boton--chico"
              onClick={() => onQuitar(linea.id)}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <div className="practica__totales">
        <span>{unidades} unidades</span>
        <strong>Total: S/ {total.toFixed(2)}</strong>
      </div>
    </section>
  )
}
