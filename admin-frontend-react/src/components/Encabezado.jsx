import { useAuth } from '../context/useAuth'
import { iniciales } from '../utils/formato'
import { NOMBRE_ROL } from '../utils/roles'

export default function Encabezado({ kicker, titulo, subtitulo, children }) {
  const { usuario } = useAuth()
  const nombre = usuario?.nombre || usuario?.usuario

  return (
    <header className="topbar">
      <div className="topbar__textos">
        <p className="topbar__kicker">{kicker}</p>
        <h1 className="topbar__titulo">{titulo}</h1>
        {subtitulo && <p className="topbar__subtitulo">{subtitulo}</p>}
      </div>
      <div className="topbar__derecha">
        {children}
        <div className="topbar__usuario">
          <div className="topbar__datos">
            <strong>{nombre}</strong>
            <span>{NOMBRE_ROL[usuario?.rol] ?? usuario?.rol}</span>
          </div>
          <span className="avatar">{iniciales(nombre)}</span>
        </div>
      </div>
    </header>
  )
}
