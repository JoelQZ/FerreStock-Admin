import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { MENU } from '../utils/menu'
import Icono from './Icono'

export default function BarraLateral() {
  const { cerrarSesion } = useAuth()

  return (
    <aside className="lateral">
      <div className="lateral__marca">
        <span className="lateral__logo">
          <Icono nombre="tuerca" tamano={22} />
        </span>
        <div>
          <strong>
            Ferre<span>Stock</span>
          </strong>
          <small>Administración</small>
        </div>
      </div>

      <nav className="lateral__menu" aria-label="Menú principal">
        {MENU.map((item) => (
          <NavLink key={item.ruta} to={item.ruta} className="lateral__item">
            <Icono nombre={item.icono} />
            <span>{item.texto}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="lateral__item lateral__salir" onClick={cerrarSesion}>
        <Icono nombre="salir" />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  )
}
