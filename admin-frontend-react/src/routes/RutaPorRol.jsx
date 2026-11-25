import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import SinPermiso from '../pages/SinPermiso'
import { tieneRol } from '../utils/roles'

export default function RutaPorRol({ roles }) {
  const { usuario } = useAuth()

  if (!tieneRol(usuario, roles)) return <SinPermiso />
  return <Outlet />
}
