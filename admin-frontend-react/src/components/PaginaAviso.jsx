import { Link } from 'react-router-dom'
import Encabezado from './Encabezado'
import Icono from './Icono'

export default function PaginaAviso({ kicker, codigo, titulo, mensaje }) {
  return (
    <>
      <Encabezado kicker={kicker} titulo={titulo} />
      <main className="contenido">
        <div className="tarjeta vacio">
          <Icono nombre="alerta" tamano={40} />
          <strong className="aviso-pagina__codigo">{codigo}</strong>
          <h2>{titulo}</h2>
          <p>{mensaje}</p>
          <Link to="/productos" className="boton boton--principal">
            Volver a Productos
          </Link>
        </div>
      </main>
    </>
  )
}
