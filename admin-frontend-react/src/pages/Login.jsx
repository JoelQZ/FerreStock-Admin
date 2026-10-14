import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Aviso from '../components/Aviso'
import Icono from '../components/Icono'
import { useAuth } from '../context/useAuth'
import { erroresDeApi } from '../utils/errores'

export default function Login() {
  const { usuario, entrar } = useAuth()
  const ubicacion = useLocation()
  const [datos, setDatos] = useState({ usuario: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={ubicacion.state?.desde ?? '/productos'} replace />

  function cambiar(evento) {
    const { name, value } = evento.target
    setDatos((previo) => ({ ...previo, [name]: value }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!datos.usuario.trim() || !datos.password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await entrar(datos.usuario.trim(), datos.password)
    } catch (falla) {
      if (falla.codigo === 'ROL') setError(falla.message)
      else if (falla.response?.status === 401) setError('Usuario o contraseña incorrectos.')
      else setError(erroresDeApi(falla).general || 'No se pudo iniciar sesión.')
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <section className="login__panel">
        <div className="cinta" aria-hidden="true" />
        <div className="login__marca">
          <span className="lateral__logo">
            <Icono nombre="tuerca" tamano={24} />
          </span>
          <div>
            <strong>FerreStock</strong>
            <small>Administración</small>
          </div>
        </div>

        <div className="login__mensaje">
          <h1>Control total del inventario de tu ferretería</h1>
          <p>Registra productos, vigila el stock y revisa las ventas del día desde un solo lugar.</p>
          <ul>
            <li>Catálogo con precios, unidades y stock mínimo</li>
            <li>Alertas de stock bajo y productos agotados</li>
            <li>Reportes diarios por tipo de pago</li>
          </ul>
        </div>

        <p className="login__pie">Tecsup · Proyecto Integrador 2026-2 · Grupo 3C</p>
      </section>

      <section className="login__lado">
        <form className="tarjeta login__formulario" onSubmit={enviar} noValidate>
          <p className="topbar__kicker">ACCESO AL PANEL</p>
          <h2>Iniciar sesión</h2>
          <p className="login__ayuda">Solo para el administrador y el dueño.</p>

          {error && <Aviso tipo="error">{error}</Aviso>}

          <label className="campo">
            <span className="campo__etiqueta">Usuario</span>
            <input
              className="entrada"
              name="usuario"
              value={datos.usuario}
              onChange={cambiar}
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Contraseña</span>
            <input
              className="entrada"
              type="password"
              name="password"
              value={datos.password}
              onChange={cambiar}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="boton boton--principal boton--bloque" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </div>
  )
}
