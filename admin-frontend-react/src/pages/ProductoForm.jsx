import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarProducto, crearProducto, obtenerProducto } from '../api/catalogo'
import Aviso from '../components/Aviso'
import Campo from '../components/Campo'
import Encabezado from '../components/Encabezado'
import EtiquetaStock from '../components/EtiquetaStock'
import Icono from '../components/Icono'
import { erroresDeApi } from '../utils/errores'
import { IGV, formatearSoles } from '../utils/formato'
import { useCatalogos } from '../utils/useCatalogos'

const VACIO = {
  nombre: '',
  codigo: '',
  marca: '',
  categoria: '',
  unidad: '',
  precio_venta: '',
  stock: '',
  stock_minimo: '',
  precio_compra: '',
  descripcion: '',
}

const DECIMALES_NO_NEGATIVOS = {
  precio_compra: 'El precio de compra no puede ser negativo.',
  stock: 'El stock no puede ser negativo.',
  stock_minimo: 'El stock mínimo no puede ser negativo.',
}

function validar(form) {
  const errores = {}
  if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!form.codigo.trim()) errores.codigo = 'El código es obligatorio.'
  if (!form.categoria) errores.categoria = 'Selecciona una categoría.'
  if (!form.marca) errores.marca = 'Selecciona una marca.'
  if (!form.unidad) errores.unidad = 'Selecciona una unidad de medida.'
  if (form.precio_venta === '' || !(Number(form.precio_venta) > 0)) {
    errores.precio_venta = 'El precio de venta debe ser mayor a cero.'
  }
  if (form.precio_compra === '') errores.precio_compra = 'El precio de costo es obligatorio.'
  for (const [campo, mensaje] of Object.entries(DECIMALES_NO_NEGATIVOS)) {
    if (form[campo] !== '' && !(Number(form[campo]) >= 0)) errores[campo] = mensaje
  }
  return errores
}

function armarDatos(form) {
  const datos = {
    nombre: form.nombre.trim(),
    codigo: form.codigo.trim(),
    categoria: Number(form.categoria),
    unidad: Number(form.unidad),
    marca: Number(form.marca),
    precio_venta: form.precio_venta,
    precio_compra: form.precio_compra,
    descripcion: form.descripcion.trim(),
  }
  if (form.stock_minimo !== '') datos.stock_minimo = form.stock_minimo
  return datos
}

function desdeProducto(producto) {
  return {
    nombre: producto.nombre,
    codigo: producto.codigo,
    marca: String(producto.marca),
    categoria: String(producto.categoria),
    unidad: String(producto.unidad),
    precio_venta: producto.precio_venta,
    stock: producto.stock,
    stock_minimo: producto.stock_minimo,
    precio_compra: producto.precio_compra,
    descripcion: producto.descripcion ?? '',
  }
}

export default function ProductoForm() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navegar = useNavigate()
  const { categorias, marcas, unidades, cargado: catalogosCargados, error: errorCatalogos } = useCatalogos()

  const [form, setForm] = useState(VACIO)
  const [listo, setListo] = useState(!esEdicion)
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!esEdicion) return
    let activo = true
    obtenerProducto(id).then(
      (producto) => {
        if (!activo) return
        setForm(desdeProducto(producto))
        setListo(true)
      },
      (falla) => {
        if (!activo) return
        setGeneral(falla.response?.status === 404 ? 'El producto no existe.' : erroresDeApi(falla).general)
        setListo(true)
      },
    )
    return () => {
      activo = false
    }
  }, [id, esEdicion])

  function cambiar(evento) {
    const { name, value } = evento.target
    setForm((previo) => ({ ...previo, [name]: value }))
    setErrores((previos) => ({ ...previos, [name]: undefined }))
  }

  function limpiar() {
    setForm(VACIO)
    setErrores({})
    setGeneral('')
  }

  async function guardar(evento) {
    evento.preventDefault()
    const locales = validar(form)
    setErrores(locales)
    setGeneral('')
    if (Object.keys(locales).length) return

    setGuardando(true)
    try {
      const datos = armarDatos(form)
      const producto = esEdicion ? await actualizarProducto(id, datos) : await crearProducto(datos)
      navegar('/productos', {
        state: { aviso: `Producto "${producto.nombre}" ${esEdicion ? 'actualizado' : 'registrado'} correctamente.` },
      })
    } catch (falla) {
      const { general: mensaje, campos } = erroresDeApi(falla)
      setErrores(campos)
      setGeneral(mensaje || (Object.keys(campos).length ? 'Revisa los campos marcados en rojo.' : ''))
      setGuardando(false)
    }
  }

  const precio = Number(form.precio_venta) || 0
  const costo = Number(form.precio_compra) || 0
  const opGravada = precio / (1 + IGV)
  const nombreCategoria = categorias.find((item) => String(item.id_categoria) === form.categoria)?.nombre
  const nombreMarca = marcas.find((item) => String(item.id_marca) === String(form.marca))?.nombre
  const unidad = unidades.find((item) => String(item.id_unidad) === form.unidad)?.abreviatura
  const stockBajo = form.stock !== '' && Number(form.stock) <= (Number(form.stock_minimo) || 0)

  return (
    <>
      <Encabezado
        kicker="HU-01 · CATÁLOGO E INVENTARIO"
        titulo={esEdicion ? 'Editar producto' : 'Registrar producto'}
        subtitulo={
          esEdicion
            ? 'Actualiza los datos del producto. El stock se ajusta desde Inventario.'
            : 'Completa los datos para agregar un producto al catálogo.'
        }
      >
        <Link to="/productos" className="boton boton--secundario">
          <Icono nombre="atras" />
          Volver
        </Link>
      </Encabezado>

      <main className="contenido">
        {errorCatalogos && <Aviso tipo="error">{errorCatalogos}</Aviso>}
        {general && <Aviso tipo="error">{general}</Aviso>}

        {!listo ? (
          <p className="tarjeta vacio">Cargando producto…</p>
        ) : (
          <div className="registro">
            <form className="tarjeta" onSubmit={guardar} noValidate>
              <div className="tarjeta__cabecera">
                <h2>Datos generales</h2>
              </div>
              <div className="formulario__seccion">
                <Campo etiqueta="Nombre del producto" obligatorio ancho error={errores.nombre}>
                  <input
                    className="entrada"
                    name="nombre"
                    value={form.nombre}
                    onChange={cambiar}
                    maxLength={120}
                    placeholder="Ej.: Martillo de uña 16 oz"
                  />
                </Campo>
                <Campo etiqueta="Código / SKU" obligatorio error={errores.codigo} ayuda="Debe ser único.">
                  <input
                    className="entrada codigo"
                    name="codigo"
                    value={form.codigo}
                    onChange={cambiar}
                    maxLength={50}
                    placeholder="Ej.: MART-016"
                  />
                </Campo>
                <Campo etiqueta="Marca" obligatorio error={errores.marca}>
                  <select className="entrada" name="marca" value={form.marca} onChange={cambiar}>
                    <option value="">Selecciona…</option>
                    {marcas.map((item) => (
                      <option key={item.id_marca} value={item.id_marca}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo
                  etiqueta="Categoría"
                  obligatorio
                  error={errores.categoria}
                  ayuda={catalogosCargados && !categorias.length ? 'No hay categorías. Créalas en el panel /admin de Django.' : ''}
                >
                  <select className="entrada" name="categoria" value={form.categoria} onChange={cambiar}>
                    <option value="">Selecciona…</option>
                    {categorias.map((item) => (
                      <option key={item.id_categoria} value={item.id_categoria}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Unidad de medida" obligatorio error={errores.unidad}>
                  <select className="entrada" name="unidad" value={form.unidad} onChange={cambiar}>
                    <option value="">Selecciona…</option>
                    {unidades.map((item) => (
                      <option key={item.id_unidad} value={item.id_unidad}>
                        {item.nombre} ({item.abreviatura})
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div className="tarjeta__cabecera tarjeta__cabecera--interna">
                <h2>Precios y stock</h2>
              </div>
              <div className="formulario__seccion">
                <Campo etiqueta="Precio de venta (incluye IGV)" obligatorio error={errores.precio_venta}>
                  <div className="con-prefijo">
                    <span>S/</span>
                    <input
                      className="entrada"
                      type="number"
                      name="precio_venta"
                      value={form.precio_venta}
                      onChange={cambiar}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </Campo>
                <Campo etiqueta="Precio de costo" obligatorio error={errores.precio_compra}>
                  <div className="con-prefijo">
                    <span>S/</span>
                    <input
                      className="entrada"
                      type="number"
                      name="precio_compra"
                      value={form.precio_compra}
                      onChange={cambiar}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </Campo>
                <Campo
                  etiqueta="Stock actual"
                  error={errores.stock}
                  ayuda="Se carga con los ingresos de mercadería (kárdex)."
                >
                  <input
                    className="entrada"
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={cambiar}
                    min="0"
                    step="0.001"
                    placeholder="0"
                    disabled
                  />
                </Campo>
                <Campo etiqueta="Stock mínimo" error={errores.stock_minimo} ayuda="Debajo de este valor se alerta stock bajo.">
                  <input
                    className="entrada"
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={cambiar}
                    min="0"
                    step="0.001"
                    placeholder="0"
                  />
                </Campo>
                <Campo etiqueta="Descripción" ancho error={errores.descripcion}>
                  <textarea
                    className="entrada"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={cambiar}
                    maxLength={255}
                    rows={3}
                    placeholder="Detalles útiles para el cajero (medidas, material, uso)."
                  />
                </Campo>
              </div>

              <div className="formulario__acciones">
                {!esEdicion && (
                  <button type="button" className="boton boton--secundario" onClick={limpiar} disabled={guardando}>
                    Limpiar
                  </button>
                )}
                <Link to="/productos" className="boton boton--secundario">
                  Cancelar
                </Link>
                <button type="submit" className="boton boton--principal" disabled={guardando}>
                  {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar producto'}
                </button>
              </div>
            </form>

            <aside className="tarjeta vista-previa" aria-label="Vista previa del producto">
              <div className="vista-previa__imagen">
                <Icono nombre="tuerca" tamano={44} />
              </div>
              <div className="vista-previa__cuerpo">
                <p className="topbar__kicker">VISTA PREVIA</p>
                <h3>{form.nombre.trim() || 'Nombre del producto'}</h3>
                <p className="vista-previa__sub">
                  <span className="codigo">{form.codigo.trim() || 'SKU'}</span>
                  {' · '}
                  {nombreMarca ?? 'Marca'}
                </p>
                <p className="vista-previa__precio">{formatearSoles(precio)}</p>

                <dl className="vista-previa__filas">
                  <div>
                    <dt>Categoría</dt>
                    <dd>{nombreCategoria ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Op. gravada</dt>
                    <dd>{formatearSoles(opGravada)}</dd>
                  </div>
                  <div>
                    <dt>IGV (18 %)</dt>
                    <dd>{formatearSoles(precio - opGravada)}</dd>
                  </div>
                  {costo > 0 && (
                    <div>
                      <dt>Ganancia por unidad</dt>
                      <dd className={precio - costo < 0 ? 'texto-rojo' : ''}>{formatearSoles(precio - costo)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Stock</dt>
                    <dd>
                      <EtiquetaStock stock={form.stock || 0} stockBajo={stockBajo} unidad={unidad} />
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  )
}
