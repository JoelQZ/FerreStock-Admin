import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { actualizarEnCatalogo, crearEnCatalogo, desactivarEnCatalogo, listarCatalogo } from '../api/catalogo'
import Aviso from '../components/Aviso'
import Buscador from '../components/Buscador'
import CatalogoFormulario from '../components/CatalogoFormulario'
import CatalogoTabla from '../components/CatalogoTabla'
import Encabezado from '../components/Encabezado'
import Tarjeta from '../components/Tarjeta'
import { TIPOS_CATALOGO, capitalizar, filtrarCatalogo, tipoCatalogo } from '../utils/catalogos'
import { erroresDeApi } from '../utils/errores'

const DURACION_AVISO = 4000

export default function Catalogos() {
  const [parametros, setParametros] = useSearchParams()
  const tipo = tipoCatalogo(parametros.get('tipo'))

  const [texto, setTexto] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, items: [], error: '' })

  const clave = `${tipo.clave}|${verTodos}|${version}`

  useEffect(() => {
    if (mensaje?.tipo !== 'ok') return undefined
    const temporizador = setTimeout(() => setMensaje(null), DURACION_AVISO)
    return () => clearTimeout(temporizador)
  }, [mensaje])

  useEffect(() => {
    const controlador = new AbortController()
    const params = tipo.tieneEstado && verTodos ? { todos: 1 } : {}

    listarCatalogo(tipo.clave, params, controlador.signal).then(
      (items) => setResultado({ clave, items, error: '' }),
      (falla) => {
        if (controlador.signal.aborted) return
        setResultado({
          clave,
          items: [],
          error: erroresDeApi(falla).general || `No se pudo cargar la lista de ${tipo.titulo.toLowerCase()}.`,
        })
      },
    )
    return () => controlador.abort()
  }, [tipo, verTodos, clave])

  const cargando = resultado.clave !== clave
  const { items, error } = resultado
  const visibles = useMemo(() => filtrarCatalogo(tipo, items, texto), [tipo, items, texto])

  function cambiarTipo(nuevo) {
    if (nuevo.clave === tipo.clave) return
    setParametros({ tipo: nuevo.clave })
    setTexto('')
    setVerTodos(false)
    setEditando(null)
  }

  async function guardar(valores) {
    if (editando) await actualizarEnCatalogo(tipo.clave, editando[tipo.id], valores)
    else await crearEnCatalogo(tipo.clave, valores)

    setMensaje({
      tipo: 'ok',
      texto: `${capitalizar(tipo.singular)} "${valores.nombre}" ${editando ? 'actualizada' : 'registrada'}.`,
    })
    setEditando(null)
    setVersion((previa) => previa + 1)
  }

  async function cambiarEstado(item) {
    const desactivar = item.estado
    if (
      desactivar &&
      !window.confirm(
        `¿Desactivar la ${tipo.singular} "${item.nombre}"? Ya no aparecerá al registrar productos, pero los productos que la usan no cambian.`,
      )
    ) {
      return
    }
    try {
      if (desactivar) await desactivarEnCatalogo(tipo.clave, item[tipo.id])
      else await actualizarEnCatalogo(tipo.clave, item[tipo.id], { estado: true })
      setMensaje({
        tipo: 'ok',
        texto: `${capitalizar(tipo.singular)} "${item.nombre}" ${desactivar ? 'desactivada' : 'reactivada'}.`,
      })
      if (editando?.[tipo.id] === item[tipo.id]) setEditando(null)
      setVersion((previa) => previa + 1)
    } catch (falla) {
      setMensaje({ tipo: 'error', texto: erroresDeApi(falla).general || 'No se pudo cambiar el estado.' })
    }
  }

  return (
    <>
      <Encabezado
        kicker="Catálogo"
        titulo="Catálogos"
        subtitulo="Categorías, marcas y unidades que se eligen al registrar un producto."
      />

      <main className="contenido">
        {mensaje && (
          <Aviso tipo={mensaje.tipo} alCerrar={() => setMensaje(null)}>
            {mensaje.texto}
          </Aviso>
        )}

        <nav className="pestanas" aria-label="Tipo de catálogo">
          {TIPOS_CATALOGO.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              className={`pestanas__boton${opcion.clave === tipo.clave ? ' pestanas__boton--activa' : ''}`}
              aria-pressed={opcion.clave === tipo.clave}
              onClick={() => cambiarTipo(opcion)}
            >
              {opcion.titulo}
            </button>
          ))}
        </nav>

        <div className="registro">
          <Tarjeta>
            <div className="herramientas">
              <Buscador
                valor={texto}
                onCambiar={setTexto}
                placeholder={`Buscar ${tipo.titulo.toLowerCase()}…`}
                etiqueta={`Buscar ${tipo.titulo.toLowerCase()}`}
              />
              {tipo.tieneEstado && (
                <label className="casilla">
                  <input
                    type="checkbox"
                    checked={verTodos}
                    onChange={(evento) => setVerTodos(evento.target.checked)}
                  />
                  Ver desactivadas
                </label>
              )}
            </div>

            {error ? (
              <div className="vacio">
                <Aviso tipo="error">{error}</Aviso>
              </div>
            ) : cargando && items.length === 0 ? (
              <p className="vacio">Cargando {tipo.titulo.toLowerCase()}…</p>
            ) : visibles.length === 0 ? (
              <div className="vacio">
                <h2>{texto.trim() ? 'Sin resultados' : `Aún no hay ${tipo.titulo.toLowerCase()}`}</h2>
                <p>
                  {texto.trim()
                    ? `Ninguna ${tipo.singular} coincide con la búsqueda.`
                    : `Registra la primera ${tipo.singular} con el formulario.`}
                </p>
              </div>
            ) : (
              <CatalogoTabla
                tipo={tipo}
                items={visibles}
                cargando={cargando}
                editandoId={editando?.[tipo.id]}
                onEditar={setEditando}
                onCambiarEstado={cambiarEstado}
              />
            )}
          </Tarjeta>

          <CatalogoFormulario
            key={`${tipo.clave}-${editando?.[tipo.id] ?? 'nueva'}`}
            tipo={tipo}
            item={editando}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        </div>
      </main>
    </>
  )
}
