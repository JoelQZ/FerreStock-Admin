import { useCallback, useEffect, useMemo, useState } from 'react'
import { iniciarSesion } from '../api/auth'
import { guardarSesion, leerSesion, registrarExpiracion } from '../api/cliente'
import { ROLES_PANEL } from '../utils/roles'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion())

  const cerrarSesion = useCallback(() => {
    guardarSesion(null)
    setSesion(null)
  }, [])

  useEffect(() => {
    registrarExpiracion(cerrarSesion)
  }, [cerrarSesion])

const entrar = useCallback(async (usuario, password) => {
    const datos = await iniciarSesion(usuario, password)
    
    // Obtener el nombre del rol (manejando si viene como string u objeto)
    const rolRaw = typeof datos.usuario.rol === 'object' ? datos.usuario.rol?.nombre : datos.usuario.rol
    const rolFormateado = rolRaw?.toUpperCase() // Convierte 'Administrador' -> 'ADMINISTRADOR'

    if (!ROLES_PANEL.includes(rolFormateado)) {
      const error = new Error('El cajero trabaja desde el POS. Este panel es solo para el administrador y el dueño.')
      error.codigo = 'ROL'
      throw error
    }

    const nueva = { access: datos.access, refresh: datos.refresh, usuario: datos.usuario }
    guardarSesion(nueva)
    setSesion(nueva)
  }, [])  

  const valor = useMemo(
    () => ({ usuario: sesion?.usuario ?? null, entrar, cerrarSesion }),
    [sesion, entrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
