import { useEffect, useMemo, useState } from 'react'
import { actualizarUsuario, crearUsuario, desactivarUsuario, listarRoles, listarUsuarios } from '../api/usuarios'
import Aviso from '../components/Aviso'
import Buscador from '../components/Buscador'
import Encabezado from '../components/Encabezado'
import Kpi from '../components/Kpi'
import Tarjeta from '../components/Tarjeta'
import UsuarioFormulario from '../components/UsuarioFormulario'
import UsuarioTabla from '../components/UsuarioTabla'
import { useAuth } from '../context/useAuth'
import { erroresDeApi } from '../utils/errores'

const DURACION_AVISO = 4000

export default function Usuarios() {
  const { usuario: sesion } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    listarRoles().then(setRoles, () => setRoles([]))
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    listarUsuarios(controlador.signal)
      .then((lista) => {
        setUsuarios(lista)
        setError('')
      })
      .catch((falla) => {
        if (controlador.signal.aborted) return
        setError(erroresDeApi(falla).general || 'No se pudo cargar la lista de usuarios.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [version])

  useEffect(() => {
    if (mensaje?.tipo !== 'ok') return undefined
    const temporizador = setTimeout(() => setMensaje(null), DURACION_AVISO)
    return () => clearTimeout(temporizador)
  }, [mensaje])

  const visibles = useMemo(() => {
    const busqueda = texto.trim().toLowerCase()
    return usuarios.filter(
      (usuario) =>
        (verTodos || usuario.estado) &&
        (!busqueda ||
          usuario.usuario.toLowerCase().includes(busqueda) ||
          usuario.nombre.toLowerCase().includes(busqueda)),
    )
  }, [usuarios, texto, verTodos])

  const activos = usuarios.filter((usuario) => usuario.estado)
  const administradores = activos.filter((usuario) => usuario.rol_nombre === 'ADMINISTRADOR').length
  const cajeros = activos.filter((usuario) => usuario.rol_nombre === 'CAJERO').length

  async function guardar(valores) {
    if (editando) {
      const actualizado = await actualizarUsuario(editando.id, valores)
      setUsuarios((previos) => previos.map((usuario) => (usuario.id === actualizado.id ? actualizado : usuario)))
    } else {
      const nuevo = await crearUsuario(valores)
      setUsuarios((previos) => [...previos, nuevo])
    }
    setMensaje({ tipo: 'ok', texto: `Usuario "${valores.usuario}" ${editando ? 'actualizado' : 'registrado'}.` })
    setEditando(null)
  }

  async function cambiarEstado(usuario) {
    const desactivar = usuario.estado
    if (desactivar && !window.confirm(`¿Desactivar al usuario "${usuario.usuario}"? Ya no podrá iniciar sesión.`)) {
      return
    }
    try {
      if (desactivar) await desactivarUsuario(usuario.id)
      else await actualizarUsuario(usuario.id, { estado: true })
      setUsuarios((previos) =>
        previos.map((item) => (item.id === usuario.id ? { ...item, estado: !desactivar } : item)),
      )
      setMensaje({ tipo: 'ok', texto: `Usuario "${usuario.usuario}" ${desactivar ? 'desactivado' : 'reactivado'}.` })
      if (editando?.id === usuario.id) setEditando(null)
    } catch (falla) {
      if (falla.response?.status === 404) setVersion((previa) => previa + 1)
      setMensaje({ tipo: 'error', texto: erroresDeApi(falla).general || 'No se pudo cambiar el estado.' })
    }
  }

  return (
    <>
      <Encabezado kicker="Usuarios" titulo="Usuarios" subtitulo="Cuentas del personal y sus roles." />

      <main className="contenido">
        {mensaje && (
          <Aviso tipo={mensaje.tipo} alCerrar={() => setMensaje(null)}>
            {mensaje.texto}
          </Aviso>
        )}

        <section className="kpis">
          <Kpi etiqueta="Usuarios activos" valor={cargando ? '—' : activos.length} />
          <Kpi etiqueta="Administradores" valor={cargando ? '—' : administradores} />
          <Kpi etiqueta="Cajeros" valor={cargando ? '—' : cajeros} />
        </section>

        <div className="registro">
          <Tarjeta>
            <div className="herramientas">
              <Buscador
                valor={texto}
                onCambiar={setTexto}
                placeholder="Buscar por usuario o nombre…"
                etiqueta="Buscar usuarios"
              />
              <label className="casilla">
                <input type="checkbox" checked={verTodos} onChange={(evento) => setVerTodos(evento.target.checked)} />
                Ver desactivados
              </label>
            </div>

            {error ? (
              <div className="vacio">
                <Aviso tipo="error">{error}</Aviso>
              </div>
            ) : cargando ? (
              <p className="vacio">Cargando usuarios…</p>
            ) : visibles.length === 0 ? (
              <div className="vacio">
                <h2>{texto.trim() ? 'Sin resultados' : 'Aún no hay usuarios'}</h2>
                <p>{texto.trim() ? 'Ningún usuario coincide con la búsqueda.' : 'Registra el primero con el formulario.'}</p>
              </div>
            ) : (
              <UsuarioTabla
                usuarios={visibles}
                editandoId={editando?.id}
                idPropio={sesion?.id}
                onEditar={setEditando}
                onCambiarEstado={cambiarEstado}
              />
            )}
          </Tarjeta>

          <UsuarioFormulario
            key={editando?.id ?? 'nuevo'}
            usuario={editando}
            roles={roles}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        </div>
      </main>
    </>
  )
}
