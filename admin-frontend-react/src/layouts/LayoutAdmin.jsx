import { Outlet } from 'react-router-dom'
import BarraLateral from '../components/BarraLateral'

export default function LayoutAdmin() {
  return (
    <div className="admin">
      <BarraLateral />
      <div className="admin__principal">
        <div className="cinta" aria-hidden="true" />
        <Outlet />
      </div>
    </div>
  )
}
