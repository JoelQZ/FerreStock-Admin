import { useState } from 'react'
import { erroresDeApi } from '../utils/errores'
import { formatearCantidad, formatearSoles } from '../utils/formato'
import Aviso from './Aviso'
import Campo from './Campo'
import Icono from './Icono'

const SELECCION_VACIA = { producto: '', cantidad: '1', costo: '' }

function textoDeDetalles(detalles) {
  if (!Array.isArray(detalles)) return detalles ? String(detalles) : ''
  return detalles
    .map((detalle) => (typeof detalle === 'object' ? Object.values(detalle).flat().join(' ') : String(detalle)))
    .filter(Boolean)
    .join(' ')
}

export default function IngresoFormulario({ proveedores, productos, onRegistrar, onCancelar }) {
  const [proveedor, setProveedor] = useState('')
  const [documento, setDocumento] = useState('')
  const [seleccion, setSeleccion] = useState(SELECCION_VACIA)
  const [lineas, setLineas] = useState([])
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const total = lineas.reduce((suma, linea) => suma + Number(linea.cantidad) * Number(linea.costo), 0)
  const unidades = lineas.reduce((suma, linea) => suma + Number(linea.cantidad), 0)

  function elegirProducto(evento) {
    const id = evento.target.value
    const producto = productos.find((item) => String(item.id_producto) === id)
    setSeleccion((previa) => ({ ...previa, producto: id, costo: producto ? String(producto.precio_compra) : '' }))
    setErrores((previos) => ({ ...previos, seleccion: undefined }))
  }

  function agregar() {
    const producto = productos.find((item) => String(item.id_producto) === seleccion.producto)
    const cantidad = Number(seleccion.cantidad)
    const costo = Number(seleccion.costo)
    if (!producto) return setErrores((previos) => ({ ...previos, seleccion: 'Elige un producto.' }))
    if (!(cantidad > 0)) return setErrores((previos) => ({ ...previos, seleccion: 'La cantidad debe ser mayor que 0.' }))
    if (seleccion.costo === '' || costo < 0) {
      return setErrores((previos) => ({ ...previos, seleccion: 'El costo no puede ser negativo.' }))
    }

    const existe = lineas.some((linea) => linea.producto === producto.id_producto)
    if (existe) {
      setLineas((previas) =>
        previas.map((linea) =>
          linea.producto === producto.id_producto ? { ...linea, cantidad: linea.cantidad + cantidad, costo } : linea,
        ),
      )
    } else {
      setLineas((previas) => [
        ...previas,
        {
          producto: producto.id_producto,
          codigo: producto.codigo,
          nombre: producto.nombre,
          unidad: producto.unidad_nombre,
          cantidad,
          costo,
        },
      ])
    }
    setSeleccion(SELECCION_VACIA)
    setErrores((previos) => ({ ...previos, seleccion: undefined, detalles: undefined }))
  }

  function quitar(id) {
    setLineas((previas) => previas.filter((linea) => linea.producto !== id))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const faltantes = {}
    if (!proveedor) faltantes.proveedor = 'Elige un proveedor.'
    if (!documento.trim()) faltantes.nro_documento = 'Este campo es obligatorio.'
    if (lineas.length === 0) faltantes.detalles = 'Agrega al menos un producto.'
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }

    setGuardando(true)
    setGeneral('')
    try {
      await onRegistrar({
        proveedor: Number(proveedor),
        nro_documento: documento.trim(),
        detalles: lineas.map((linea) => ({
          producto: linea.producto,
          cantidad: linea.cantidad.toFixed(3),
          costo_unitario: linea.costo.toFixed(2),
        })),
      })
    } catch (falla) {
      const { general: mensaje, campos } = erroresDeApi(falla)
      const detalles = textoDeDetalles(falla.response?.data?.detalles)
      setErrores({ ...campos, detalles: detalles || undefined })
      setGeneral(mensaje || (Object.keys(campos).length ? '' : 'No se pudo registrar el ingreso.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="tarjeta" onSubmit={enviar} noValidate>
      <div className="tarjeta__cabecera">
        <h2>Nuevo ingreso de mercadería</h2>
      </div>

      {general && (
        <div className="catalogo__aviso">
          <Aviso tipo="error">{general}</Aviso>
        </div>
      )}

      <div className="formulario__seccion">
        <Campo etiqueta="Proveedor" obligatorio error={errores.proveedor}>
          <select
            className="entrada"
            value={proveedor}
            onChange={(evento) => {
              setProveedor(evento.target.value)
              setErrores((previos) => ({ ...previos, proveedor: undefined }))
            }}
          >
            <option value="">Selecciona…</option>
            {proveedores.map((item) => (
              <option key={item.id_proveedor} value={item.id_proveedor}>
                {item.razon_social}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="N.º de guía o factura" obligatorio error={errores.nro_documento}>
          <input
            className="entrada codigo"
            value={documento}
            onChange={(evento) => {
              setDocumento(evento.target.value)
              setErrores((previos) => ({ ...previos, nro_documento: undefined }))
            }}
            maxLength={50}
            placeholder="F001-000123"
          />
        </Campo>
      </div>

      <div className="tarjeta__cabecera tarjeta__cabecera--interna">
        <h2>Productos</h2>
      </div>
      <div className="ingreso__agregar">
        <Campo etiqueta="Producto" error={errores.seleccion}>
          <select className="entrada" value={seleccion.producto} onChange={elegirProducto}>
            <option value="">Selecciona…</option>
            {productos.map((item) => (
              <option key={item.id_producto} value={item.id_producto}>
                {item.codigo} — {item.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Cantidad">
          <input
            className="entrada"
            type="number"
            min="0"
            step="0.001"
            value={seleccion.cantidad}
            onChange={(evento) => setSeleccion((previa) => ({ ...previa, cantidad: evento.target.value }))}
          />
        </Campo>
        <Campo etiqueta="Costo unitario">
          <div className="con-prefijo">
            <span>S/</span>
            <input
              className="entrada"
              type="number"
              min="0"
              step="0.01"
              value={seleccion.costo}
              onChange={(evento) => setSeleccion((previa) => ({ ...previa, costo: evento.target.value }))}
            />
          </div>
        </Campo>
        <button type="button" className="boton boton--secundario" onClick={agregar}>
          <Icono nombre="mas" tamano={16} />
          Agregar
        </button>
      </div>

      {lineas.length === 0 ? (
        <p className={`ingreso__vacio${errores.detalles ? ' texto-rojo' : ''}`}>
          {errores.detalles || 'Todavía no agregaste productos.'}
        </p>
      ) : (
        <>
          {errores.detalles && <p className="ingreso__vacio texto-rojo">{errores.detalles}</p>}
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Cantidad</th>
                  <th className="num">Costo</th>
                  <th className="num">Subtotal</th>
                  <th className="acciones">Quitar</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea) => (
                  <tr key={linea.producto}>
                    <td>
                      <strong className="tabla__nombre">{linea.nombre}</strong>
                      <small className="tabla__detalle">{linea.codigo}</small>
                    </td>
                    <td className="num">
                      {formatearCantidad(linea.cantidad)} {linea.unidad}
                    </td>
                    <td className="num">{formatearSoles(linea.costo)}</td>
                    <td className="num">{formatearSoles(linea.cantidad * linea.costo)}</td>
                    <td className="acciones">
                      <button
                        type="button"
                        className="boton boton--secundario boton--chico boton--peligro"
                        onClick={() => quitar(linea.producto)}
                        aria-label={`Quitar ${linea.nombre}`}
                      >
                        <Icono nombre="cerrar" tamano={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ingreso__total">
            <span>
              {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} · {formatearCantidad(unidades)} unidades
            </span>
            <strong>Total {formatearSoles(total)}</strong>
          </div>
        </>
      )}

      <div className="formulario__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Registrando…' : 'Registrar ingreso'}
        </button>
      </div>
    </form>
  )
}
