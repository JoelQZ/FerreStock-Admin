import { formatearFechaHora } from '../utils/formato'
import { NOMBRE_ROL } from '../utils/roles'
import Icono from './Icono'

export default function UsuarioTabla({ usuarios, cargando = false, editandoId, idPropio, onEditar, onCambiarEstado }) {
  return (
    <div className={`tabla-contenedor${cargando ? ' tabla-contenedor--cargando' : ''}`}>
      <table className="tabla">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th className="col-opcional">Último acceso</th>
            <th>Estado</th>
            <th className="acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => {
            const clases = [!usuario.estado && 'inactiva', usuario.id === editandoId && 'seleccionada']
              .filter(Boolean)
              .join(' ')
            const esPropio = usuario.id === idPropio

            return (
              <tr key={usuario.id} className={clases}>
                <td>
                  <strong className="tabla__nombre">{usuario.nombre || usuario.usuario}</strong>
                  <small className="tabla__detalle">@{usuario.usuario}</small>
                </td>
                <td>{NOMBRE_ROL[usuario.rol_nombre] ?? usuario.rol_nombre}</td>
                <td className="col-opcional">
                  {usuario.last_login ? formatearFechaHora(usuario.last_login) : (
                    <span className="tabla__detalle">Nunca</span>
                  )}
                </td>
                <td>
                  <span className={`etiqueta ${usuario.estado ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                    {usuario.estado ? 'Activo' : 'Desactivado'}
                  </span>
                </td>
                <td className="acciones">
                  <div className="tabla__acciones">
                    <button
                      type="button"
                      className="boton boton--secundario boton--chico"
                      onClick={() => onEditar(usuario)}
                    >
                      <Icono nombre="editar" tamano={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`boton boton--secundario boton--chico${usuario.estado ? ' boton--peligro' : ''}`}
                      onClick={() => onCambiarEstado(usuario)}
                      disabled={esPropio}
                      title={esPropio ? 'No puedes desactivar tu propia cuenta' : undefined}
                    >
                      <Icono nombre="apagar" tamano={15} />
                      {usuario.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
