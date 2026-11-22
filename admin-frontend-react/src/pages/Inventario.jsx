import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listarProductos } from '../api/catalogo'
import { listarProveedores } from '../api/inventario'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import InventarioIngresos from '../components/InventarioIngresos'
import InventarioKardex from '../components/InventarioKardex'
import InventarioProveedores from '../components/InventarioProveedores'
import { erroresDeApi } from '../utils/errores'

const VISTAS = [
  { clave: 'ingresos', titulo: 'Ingresos de mercadería' },
  { clave: 'proveedores', titulo: 'Proveedores' },
  { clave: 'kardex', titulo: 'Kárdex' },
]
const DURACION_AVISO = 4000

export default function Inventario() {
  const [parametros, setParametros] = useSearchParams()
  const vista = VISTAS.find((opcion) => opcion.clave === parametros.get('vista')) ?? VISTAS[0]

  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [versionProductos, setVersionProductos] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    const controlador = new AbortController()
    listarProveedores(controlador.signal)
      .then(setProveedores)
      .catch((falla) => {
        if (controlador.signal.aborted) return
        setError(erroresDeApi(falla).general || 'No se pudo cargar la lista de proveedores.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    listarProductos({}, controlador.signal).then(setProductos, () => {})
    return () => controlador.abort()
  }, [versionProductos])

  useEffect(() => {
    if (mensaje?.tipo !== 'ok') return undefined
    const temporizador = setTimeout(() => setMensaje(null), DURACION_AVISO)
    return () => clearTimeout(temporizador)
  }, [mensaje])

  const avisar = (texto) => setMensaje({ tipo: 'ok', texto })
  const avisarError = (texto) => setMensaje({ tipo: 'error', texto })

  return (
    <>
      <Encabezado
        kicker="Inventario"
        titulo="Inventario"
        subtitulo="Ingresos de mercadería, proveedores y movimientos de stock."
      />

      <main className="contenido">
        {mensaje && (
          <Aviso tipo={mensaje.tipo} alCerrar={() => setMensaje(null)}>
            {mensaje.texto}
          </Aviso>
        )}

        <nav className="pestanas" aria-label="Secciones de inventario">
          {VISTAS.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              className={`pestanas__boton${opcion.clave === vista.clave ? ' pestanas__boton--activa' : ''}`}
              aria-pressed={opcion.clave === vista.clave}
              onClick={() => setParametros({ vista: opcion.clave })}
            >
              {opcion.titulo}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="tarjeta vacio">
            <Aviso tipo="error">{error}</Aviso>
          </div>
        ) : cargando ? (
          <p className="tarjeta vacio">Cargando inventario…</p>
        ) : vista.clave === 'ingresos' ? (
          <InventarioIngresos
            proveedores={proveedores}
            productos={productos}
            onIngresoRegistrado={() => setVersionProductos((previa) => previa + 1)}
            onMensaje={avisar}
          />
        ) : vista.clave === 'proveedores' ? (
          <InventarioProveedores
            proveedores={proveedores}
            onCambiarLista={setProveedores}
            onMensaje={avisar}
            onError={avisarError}
          />
        ) : (
          <InventarioKardex />
        )}
      </main>
    </>
  )
}
