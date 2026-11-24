import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adaptarProducto, obtenerProducto } from '../api/catalogo'
import { listarKardex } from '../api/inventario'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import EtiquetaStock from '../components/EtiquetaStock'
import Icono from '../components/Icono'
import KardexTabla from '../components/KardexTabla'
import Kpi from '../components/Kpi'
import Tarjeta from '../components/Tarjeta'
import { erroresDeApi } from '../utils/errores'
import { IGV, formatearCantidad, formatearSoles, tieneStockBajo } from '../utils/formato'

export default function ProductoDetalle() {
  const { id } = useParams()
  const [resultado, setResultado] = useState({ id: null, producto: null, movimientos: [], error: '' })

  useEffect(() => {
    const controlador = new AbortController()
    Promise.all([obtenerProducto(id), listarKardex(controlador.signal, { producto: id })])
      .then(([producto, movimientos]) =>
        setResultado({ id, producto: adaptarProducto(producto), movimientos, error: '' }),
      )
      .catch((falla) => {
        if (controlador.signal.aborted) return
        const error =
          falla.response?.status === 404
            ? 'El producto no existe.'
            : erroresDeApi(falla).general || 'No se pudo cargar el producto.'
        setResultado({ id, producto: null, movimientos: [], error })
      })
    return () => controlador.abort()
  }, [id])

  const cargando = resultado.id !== id
  const { producto, movimientos, error } = resultado
  const opGravada = producto ? producto.precio_venta / (1 + IGV) : 0

  return (
    <>
      <Encabezado
        kicker="Catálogo"
        titulo={producto?.nombre ?? 'Detalle del producto'}
        subtitulo={producto ? `${producto.codigo} · ${producto.marca_nombre} · ${producto.categoria_nombre}` : ''}
      >
        <Link to="/productos" className="boton boton--secundario">
          <Icono nombre="atras" tamano={16} />
          Volver
        </Link>
        {producto && (
          <Link to={`/productos/${producto.id_producto}/editar`} className="boton boton--principal">
            <Icono nombre="editar" tamano={16} />
            Editar
          </Link>
        )}
      </Encabezado>

      <main className="contenido">
        {cargando ? (
          <p className="tarjeta vacio">Cargando producto…</p>
        ) : error ? (
          <div className="tarjeta vacio">
            <Aviso tipo="error">{error}</Aviso>
          </div>
        ) : (
          <>
            <section className="kpis">
              <Kpi etiqueta="Precio de venta" valor={formatearSoles(producto.precio_venta)} detalle="Incluye IGV" />
              <Kpi
                etiqueta="Stock actual"
                valor={`${formatearCantidad(producto.stock)} ${producto.unidad_nombre}`}
                detalle={`Mínimo ${formatearCantidad(producto.stock_minimo)}`}
                alerta={tieneStockBajo(producto)}
              />
              <Kpi
                etiqueta="Ganancia por unidad"
                valor={formatearSoles(producto.precio_venta - producto.precio_compra)}
                detalle={`Costo ${formatearSoles(producto.precio_compra)}`}
              />
            </section>

            <div className="registro">
              <Tarjeta titulo="Movimientos de stock (kárdex)">
                {movimientos.length === 0 ? (
                  <div className="vacio">
                    <h2>Sin movimientos</h2>
                    <p>Este producto todavía no tiene ventas ni ingresos de mercadería.</p>
                  </div>
                ) : (
                  <KardexTabla movimientos={movimientos} />
                )}
              </Tarjeta>

              <Tarjeta titulo="Datos del producto">
                <dl className="vista-previa__filas detalle__filas">
                  <div>
                    <dt>Código</dt>
                    <dd className="codigo">{producto.codigo}</dd>
                  </div>
                  <div>
                    <dt>Categoría</dt>
                    <dd>{producto.categoria_nombre}</dd>
                  </div>
                  <div>
                    <dt>Marca</dt>
                    <dd>{producto.marca_nombre}</dd>
                  </div>
                  <div>
                    <dt>Unidad</dt>
                    <dd>{producto.unidad_nombre}</dd>
                  </div>
                  <div>
                    <dt>Op. gravada</dt>
                    <dd>{formatearSoles(opGravada)}</dd>
                  </div>
                  <div>
                    <dt>IGV (18 %)</dt>
                    <dd>{formatearSoles(producto.precio_venta - opGravada)}</dd>
                  </div>
                  <div>
                    <dt>Stock</dt>
                    <dd>
                      <EtiquetaStock
                        stock={producto.stock}
                        stockBajo={tieneStockBajo(producto)}
                        unidad={producto.unidad_nombre}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>
                      <span className={`etiqueta ${producto.estado ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                        {producto.estado ? 'Activo' : 'Desactivado'}
                      </span>
                    </dd>
                  </div>
                </dl>
                {producto.descripcion && <p className="detalle__descripcion">{producto.descripcion}</p>}
              </Tarjeta>
            </div>
          </>
        )}
      </main>
    </>
  )
}
