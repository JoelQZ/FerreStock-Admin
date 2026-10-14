import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { actualizarProducto, desactivarProducto, listarProductos } from '../api/catalogo'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import EtiquetaStock from '../components/EtiquetaStock'
import Icono from '../components/Icono'
import { erroresDeApi } from '../utils/errores'
import { formatearSoles, tieneStockBajo } from '../utils/formato'
import { useCatalogos } from '../utils/useCatalogos'

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
      <Encabezado
        kicker="HU-01 · CATÁLOGO E INVENTARIO"
        titulo="Productos"
        subtitulo="Registra y consulta el catálogo de la ferretería."
      />

      <main className="contenido">
        {mensaje && (
          <Aviso tipo={mensaje.tipo} alCerrar={() => setMensaje(null)}>
            {mensaje.texto}
          </Aviso>
        )}

        <section className="kpis">
          <div className="tarjeta kpi">
            <span>Productos en la lista</span>
            <strong>{cargando ? '—' : productos.length}</strong>
          </div>
          <div className="tarjeta kpi kpi--alerta">
            <span>Con stock bajo</span>
            <strong>{cargando ? '—' : conStockBajo}</strong>
          </div>
          <div className="tarjeta kpi">
            <span>Categorías activas</span>
            <strong>{categorias.length}</strong>
          </div>
        </section>

        <section className="tarjeta">
          <div className="herramientas">
            <div className="buscador">
              <Icono nombre="buscar" />
              <input
                className="entrada"
                type="search"
                placeholder="Buscar por código o nombre…"
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                aria-label="Buscar productos"
              />
            </div>

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

            <Link to="/productos/nuevo" className="boton boton--principal herramientas__nuevo">
              <Icono nombre="mas" />
              Nuevo producto
            </Link>
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
            <div className={`tabla-contenedor${cargando ? ' tabla-contenedor--cargando' : ''}`}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">P. venta</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th className="acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id_producto} className={producto.estado ? '' : 'inactiva'}>
                      <td>
                        <span className="codigo">{producto.codigo}</span>
                      </td>
                      <td>
                        <strong className="tabla__nombre">{producto.nombre}</strong>
                        <small className="tabla__detalle">
                          {producto.marca_nombre} · {producto.unidad_nombre}
                        </small>
                      </td>
                      <td>{producto.categoria_nombre}</td>
                      <td className="num">{formatearSoles(producto.precio_venta)}</td>
                      <td>
                        <EtiquetaStock
                          stock={producto.stock}
                          stockBajo={tieneStockBajo(producto)}
                          unidad={producto.unidad_nombre}
                        />
                      </td>
                      <td>
                        <span className={`etiqueta ${producto.estado ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                          {producto.estado ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td className="acciones">
                        <div className="tabla__acciones">
                          <Link
                            to={`/productos/${producto.id_producto}/editar`}
                            className="boton boton--secundario boton--chico"
                          >
                            <Icono nombre="editar" tamano={15} />
                            Editar
                          </Link>
                          <button
                            type="button"
                            className={`boton boton--secundario boton--chico${producto.estado ? ' boton--peligro' : ''}`}
                            onClick={() => cambiarEstado(producto)}
                          >
                            <Icono nombre="apagar" tamano={15} />
                            {producto.estado ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
