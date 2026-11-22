import { useState } from 'react'
import { erroresDeApi } from '../utils/errores'
import { NOMBRE_ROL } from '../utils/roles'
import Aviso from './Aviso'
import Campo from './Campo'

function valoresIniciales(usuario) {
  return {
    nombre: usuario?.nombre ?? '',
    usuario: usuario?.usuario ?? '',
    rol: usuario ? String(usuario.rol) : '',
    password: '',
  }
}

export default function UsuarioFormulario({ usuario, roles, onGuardar, onCancelar }) {
  const [form, setForm] = useState(() => valoresIniciales(usuario))
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
    const valores = {
      nombre: form.nombre.trim(),
      usuario: form.usuario.trim(),
      rol: form.rol,
      password: form.password,
    }
    const faltantes = {}
    if (!valores.nombre) faltantes.nombre = 'Este campo es obligatorio.'
    if (!valores.usuario) faltantes.usuario = 'Este campo es obligatorio.'
    if (!valores.rol) faltantes.rol = 'Elige un rol.'
    if (!usuario && !valores.password) faltantes.password = 'Este campo es obligatorio.'
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }
    if (!valores.password) delete valores.password

    setGuardando(true)
    setGeneral('')
    try {
      await onGuardar({ ...valores, rol: Number(valores.rol) })
      if (!usuario) setForm(valoresIniciales(null))
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
        <h2>{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h2>
      </div>

      {general && (
        <div className="catalogo__aviso">
          <Aviso tipo="error">{general}</Aviso>
        </div>
      )}

      <div className="formulario__seccion formulario__seccion--una">
        <Campo etiqueta="Nombre completo" obligatorio error={errores.nombre}>
          <input className="entrada" name="nombre" value={form.nombre} onChange={cambiar} maxLength={150} />
        </Campo>
        <Campo etiqueta="Usuario" obligatorio error={errores.usuario} ayuda="Con este nombre inicia sesión">
          <input
            className="entrada codigo"
            name="usuario"
            value={form.usuario}
            onChange={cambiar}
            maxLength={150}
            autoComplete="off"
          />
        </Campo>
        <Campo etiqueta="Rol" obligatorio error={errores.rol}>
          <select className="entrada" name="rol" value={form.rol} onChange={cambiar}>
            <option value="">Selecciona…</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {NOMBRE_ROL[rol.nombre] ?? rol.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          etiqueta="Contraseña"
          obligatorio={!usuario}
          error={errores.password}
          ayuda={usuario ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'}
        >
          <input
            className="entrada"
            type="password"
            name="password"
            value={form.password}
            onChange={cambiar}
            autoComplete="new-password"
          />
        </Campo>
      </div>

      <div className="formulario__acciones">
        {usuario && (
          <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Guardando…' : usuario ? 'Guardar cambios' : 'Registrar usuario'}
        </button>
      </div>
    </form>
  )
}
