import { useState } from 'react'
import { erroresDeApi } from '../utils/errores'
import Aviso from './Aviso'
import Campo from './Campo'

function valoresIniciales(tipo, item) {
  return Object.fromEntries(tipo.campos.map((campo) => [campo.nombre, item?.[campo.nombre] ?? '']))
}

export default function CatalogoFormulario({ tipo, item, onGuardar, onCancelar }) {
  const [form, setForm] = useState(() => valoresIniciales(tipo, item))
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
    const faltantes = Object.fromEntries(
      tipo.campos
        .filter((campo) => campo.obligatorio && !valores[campo.nombre])
        .map((campo) => [campo.nombre, 'Este campo es obligatorio.']),
    )
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }

    setGuardando(true)
    setGeneral('')
    try {
      await onGuardar(valores)
      if (!item) setForm(valoresIniciales(tipo, null))
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
        <h2>{item ? `Editar ${tipo.singular}` : `Nueva ${tipo.singular}`}</h2>
      </div>

      {general && (
        <div className="catalogo__aviso">
          <Aviso tipo="error">{general}</Aviso>
        </div>
      )}

      <div className="formulario__seccion formulario__seccion--una">
        {tipo.campos.map((campo) => (
          <Campo
            key={campo.nombre}
            etiqueta={campo.etiqueta}
            obligatorio={campo.obligatorio}
            error={errores[campo.nombre]}
          >
            {campo.multilinea ? (
              <textarea
                className="entrada"
                name={campo.nombre}
                value={form[campo.nombre]}
                onChange={cambiar}
                maxLength={campo.maximo}
                rows={3}
                placeholder={campo.ejemplo}
              />
            ) : (
              <input
                className={`entrada${campo.codigo ? ' codigo' : ''}`}
                name={campo.nombre}
                value={form[campo.nombre]}
                onChange={cambiar}
                maxLength={campo.maximo}
                placeholder={campo.ejemplo}
              />
            )}
          </Campo>
        ))}
      </div>

      <div className="formulario__acciones">
        {item && (
          <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Guardando…' : item ? 'Guardar cambios' : `Registrar ${tipo.singular}`}
        </button>
      </div>
    </form>
  )
}
