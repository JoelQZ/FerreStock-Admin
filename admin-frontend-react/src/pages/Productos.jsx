import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { actualizarProducto, desactivarProducto, listarProductos } from '../api/catalogo'
import Aviso from '../components/Aviso'
import Buscador from '../components/Buscador'
import Encabezado from '../components/Encabezado'
import Icono from '../components/Icono'
import Kpi from '../components/Kpi'
import ProductoTabla from '../components/ProductoTabla'
import Tarjeta from '../components/Tarjeta'
import { erroresDeApi } from '../utils/errores'
import { tieneStockBajo } from '../utils/formato'
import { useCatalogos } from '../utils/useCatalogos'

const DURACION_AVISO = 4000

export default function Productos() {
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const { categorias } = useCatalogos()

  const [mensaje, setMensaje] = useState(() =>
    ubicacion.state?.aviso ? { tipo: 'ok', texto: ubicacion.state.aviso } : null,
  )
  const [texto, setTexto] = useState('')
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, productos: [], error: '' })

  useEffect(() => {
    if (ubicacion.state?.aviso) navegar('.', { replace: true, state: null })
  }, [ubicacion.state, navegar])

  useEffect(() => {
    if (mensaje?.tipo !== 'ok') return undefined
    const temporizador = setTimeout(() => setMensaje(null), DURACION_AVISO)
    return () => clearTimeout(temporizador)
  }, [mensaje])

  useEffect(() => {
    const espera = setTimeout(() => setBuscar(texto.trim()), 300)
    return () => clearTimeout(espera)
  }, [texto])

  const clave = `${buscar}|${categoria}|${verTodos}|${version}`

  useEffect(() => {
    let activo = true
    const params = {}
    if (buscar) params.buscar = buscar
    if (categoria) params.categoria = categoria
    if (verTodos) params.todos = 1

    listarProductos(params).then(
      (productos) => {
        if (activo) setResultado({ clave, productos, error: '' })
      },
      (falla) => {
        if (activo) {
          setResultado({
            clave,
            productos: [],
            error: erroresDeApi(falla).general || 'No se pudo cargar la lista de productos.',
          })
        }
      },
    )
    return () => {
      activo = false
    }
  }, [buscar, categoria, verTodos, clave])

  const cargando = resultado.clave !== clave
  const { productos, error } = resultado
  const conStockBajo = productos.filter((producto) => producto.estado && tieneStockBajo(producto)).length
  const hayFiltros = Boolean(buscar || categoria)

  async function cambiarEstado(producto) {
    const desactivar = producto.estado
    if (desactivar && !window.confirm(`¿Desactivar "${producto.nombre}"? Ya no aparecerá en el POS.`)) return
    try {
      if (desactivar) await desactivarProducto(producto.id_producto)
      else await actualizarProducto(producto.id_producto, { estado: true })
      setMensaje({
        tipo: 'ok',
        texto: `Producto "${producto.nombre}" ${desactivar ? 'desactivado' : 'reactivado'}.`,
      })
      setVersion((previa) => previa + 1)
    } catch (falla) {
      setMensaje({ tipo: 'error', texto: erroresDeApi(falla).general || 'No se pudo cambiar el estado.' })
    }
  }

  function limpiarFiltros() {
    setTexto('')
    setBuscar('')
    setCategoria('')
  }

  return (
    <>
      <Encabezado kicker="Catálogo" titulo="Productos" subtitulo="Gestiona los productos de la ferretería.">
        <Link to="/productos/nuevo" className="boton boton--principal">
          <Icono nombre="mas" />
          Nuevo producto
        </Link>
      </Encabezado>

      <main className="contenido">
        {mensaje && (
          <Aviso tipo={mensaje.tipo} alCerrar={() => setMensaje(null)}>
            {mensaje.texto}
          </Aviso>
        )}

        <section className="kpis">
          <Kpi etiqueta="Productos en la lista" valor={cargando ? '—' : productos.length} />
          <Kpi etiqueta="Con stock bajo" valor={cargando ? '—' : conStockBajo} alerta />
          <Kpi etiqueta="Categorías activas" valor={categorias.length} />
        </section>

        <Tarjeta>
          <div className="herramientas">
            <Buscador
              valor={texto}
              onCambiar={setTexto}
              placeholder="Buscar por código o nombre…"
              etiqueta="Buscar productos"
            />

            <select
              className="entrada herramientas__filtro"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((item) => (
                <option key={item.id_categoria} value={item.id_categoria}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <label className="casilla">
              <input type="checkbox" checked={verTodos} onChange={(evento) => setVerTodos(evento.target.checked)} />
              Ver desactivados
            </label>
          </div>

          {error ? (
            <div className="vacio">
              <Aviso tipo="error">{error}</Aviso>
            </div>
          ) : cargando && productos.length === 0 ? (
            <p className="vacio">Cargando productos…</p>
          ) : productos.length === 0 ? (
            <div className="vacio">
              <h2>{hayFiltros ? 'Sin resultados' : 'Aún no hay productos'}</h2>
              <p>
                {hayFiltros
                  ? 'Ningún producto coincide con la búsqueda o la categoría elegida.'
                  : 'Registra el primer producto del catálogo.'}
              </p>
              {hayFiltros ? (
                <button type="button" className="boton boton--secundario" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              ) : (
                <Link to="/productos/nuevo" className="boton boton--principal">
                  <Icono nombre="mas" />
                  Registrar producto
                </Link>
              )}
            </div>
          ) : (
            <ProductoTabla productos={productos} cargando={cargando} onCambiarEstado={cambiarEstado} />
          )}
        </Tarjeta>
      </main>
    </>
  )
}
