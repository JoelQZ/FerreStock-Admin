import { useState } from 'react'
import { erroresDeApi } from '../utils/errores'
import Aviso from './Aviso'
import Campo from './Campo'

const CAMPOS = ['ruc', 'razon_social', 'telefono', 'direccion']

function valoresIniciales(proveedor) {
  return Object.fromEntries(CAMPOS.map((campo) => [campo, proveedor?.[campo] ?? '']))
}

export default function ProveedorFormulario({ proveedor, onGuardar, onCancelar }) {
  const [form, setForm] = useState(() => valoresIniciales(proveedor))
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  function cambiar(evento) {
    const { name, value } = evento.target
    setForm((previo) => ({ ...previo, [name]: value }))
    setErrores((previo) => ({ ...previo, [name]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const valores = Object.fromEntries(Object.entries(form).map(([campo, valor]) => [campo, valor.trim()]))
    const faltantes = {}
    if (!/^\d{11}$/.test(valores.ruc)) faltantes.ruc = 'El RUC debe contener exactamente 11 dígitos.'
    if (!valores.razon_social) faltantes.razon_social = 'Este campo es obligatorio.'
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }

    setGuardando(true)
    setGeneral('')
    try {
      await onGuardar(valores)
      if (!proveedor) setForm(valoresIniciales(null))
    } catch (falla) {
      const { general: mensaje, campos } = erroresDeApi(falla)
      setErrores(campos)
      setGeneral(mensaje || (Object.keys(campos).length ? '' : 'No se pudo guardar.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="tarjeta" onSubmit={enviar} noValidate>
      <div className="tarjeta__cabecera">
        <h2>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
      </div>

      {general && (
        <div className="catalogo__aviso">
          <Aviso tipo="error">{general}</Aviso>
        </div>
      )}

      <div className="formulario__seccion formulario__seccion--una">
        <Campo etiqueta="RUC" obligatorio error={errores.ruc}>
          <input
            className="entrada codigo"
            name="ruc"
            value={form.ruc}
            onChange={cambiar}
            maxLength={11}
            inputMode="numeric"
            placeholder="20123456789"
          />
        </Campo>
        <Campo etiqueta="Razón social" obligatorio error={errores.razon_social}>
          <input className="entrada" name="razon_social" value={form.razon_social} onChange={cambiar} maxLength={150} />
        </Campo>
        <Campo etiqueta="Teléfono" error={errores.telefono}>
          <input className="entrada" name="telefono" value={form.telefono} onChange={cambiar} maxLength={20} />
        </Campo>
        <Campo etiqueta="Dirección" error={errores.direccion}>
          <input className="entrada" name="direccion" value={form.direccion} onChange={cambiar} maxLength={255} />
        </Campo>
      </div>

      <div className="formulario__acciones">
        {proveedor && (
          <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Registrar proveedor'}
        </button>
      </div>
    </form>
  )
}
