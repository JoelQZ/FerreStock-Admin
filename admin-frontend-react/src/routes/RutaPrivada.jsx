import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function RutaPrivada() {
  const { usuario } = useAuth()
  const ubicacion = useLocation()

  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  return <Outlet />
}
