import Icono from './Icono'

export default function CatalogoTabla({ tipo, items, cargando = false, editandoId, onEditar, onCambiarEstado }) {
  const [principal, ...secundarios] = tipo.campos

  return (
    <div className={`tabla-contenedor${cargando ? ' tabla-contenedor--cargando' : ''}`}>
      <table className="tabla">
        <thead>
          <tr>
            <th>{principal.etiqueta}</th>
            {secundarios.map((campo) => (
              <th key={campo.nombre} className={campo.multilinea ? 'col-opcional' : ''}>
                {campo.etiqueta}
              </th>
            ))}
            {tipo.tieneEstado && <th className="col-opcional">Estado</th>}
            <th className="acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const activo = !tipo.tieneEstado || item.estado
            const clases = [!activo && 'inactiva', item[tipo.id] === editandoId && 'seleccionada']
              .filter(Boolean)
              .join(' ')

            return (
              <tr key={item[tipo.id]} className={clases}>
                <td>
                  <strong className="tabla__nombre">{item[principal.nombre]}</strong>
                </td>
                {secundarios.map((campo) => (
                  <td key={campo.nombre} className={campo.multilinea ? 'col-opcional' : ''}>
                    {campo.codigo ? (
                      <span className="codigo">{item[campo.nombre]}</span>
                    ) : (
                      item[campo.nombre] || <span className="tabla__detalle">Sin {campo.etiqueta.toLowerCase()}</span>
                    )}
                  </td>
                ))}
                {tipo.tieneEstado && (
                  <td className="col-opcional">
                    <span className={`etiqueta ${activo ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                      {activo ? 'Activa' : 'Desactivada'}
                    </span>
                  </td>
                )}
                <td className="acciones">
                  <div className="tabla__acciones">
                    <button
                      type="button"
                      className="boton boton--secundario boton--chico"
                      onClick={() => onEditar(item)}
                    >
                      <Icono nombre="editar" tamano={15} />
                      Editar
                    </button>
                    {tipo.tieneEstado && (
                      <button
                        type="button"
                        className={`boton boton--secundario boton--chico${activo ? ' boton--peligro' : ''}`}
                        onClick={() => onCambiarEstado(item)}
                      >
                        <Icono nombre="apagar" tamano={15} />
                        {activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    )}
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
