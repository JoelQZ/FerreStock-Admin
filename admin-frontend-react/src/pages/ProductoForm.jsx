import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarProducto, crearProducto, obtenerProducto, obtenerSiguienteCodigo } from '../api/catalogo'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import Icono from '../components/Icono'
import ProductoFormulario from '../components/ProductoFormulario'
import VistaPreviaProducto from '../components/VistaPreviaProducto'
import { erroresDeApi } from '../utils/errores'
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

const FORMATO_NUMERICO = {
  precio_venta: /^\d{0,6}(\.\d{0,2})?$/,
  precio_compra: /^\d{0,6}(\.\d{0,2})?$/,
  stock_minimo: /^\d{0,7}(\.\d{0,3})?$/,
}

function validar(form) {
  const errores = {}
  if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!form.codigo.trim()) errores.codigo = 'El código se genera al elegir la categoría.'
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
  const { categorias, marcas, unidades, error: errorCatalogos } = useCatalogos()

  const [form, setForm] = useState(VACIO)
  const [listo, setListo] = useState(!esEdicion)
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  useEffect(() => {
    if (esEdicion || !form.categoria) return undefined
    const controlador = new AbortController()
    obtenerSiguienteCodigo(form.categoria, controlador.signal).then(
      (codigo) => {
        setForm((previo) => ({ ...previo, codigo }))
        setErrores((previos) => ({ ...previos, codigo: undefined }))
      },
      () => {},
    )
    return () => controlador.abort()
  }, [form.categoria, esEdicion])

  useEffect(() => {
    if (!esEdicion) return undefined
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

  function cambiarCampo(nombre, valor) {
    if (FORMATO_NUMERICO[nombre] && !FORMATO_NUMERICO[nombre].test(valor)) return
    setForm((previo) => ({ ...previo, [nombre]: valor }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  function limpiar() {
    setForm(VACIO)
    setErrores({})
    setGeneral('')
  }

  async function guardar() {
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

  return (
    <>
      <Encabezado kicker="Catálogo" titulo={esEdicion ? 'Editar producto' : 'Registrar producto'}>
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
            <ProductoFormulario
              form={form}
              errores={errores}
              categorias={categorias}
              marcas={marcas}
              unidades={unidades}
              esEdicion={esEdicion}
              guardando={guardando}
              onCambiar={cambiarCampo}
              onGuardar={guardar}
              onLimpiar={limpiar}
            />
            <VistaPreviaProducto form={form} categorias={categorias} marcas={marcas} unidades={unidades} />
          </div>
        )}
      </main>
    </>
  )
}
