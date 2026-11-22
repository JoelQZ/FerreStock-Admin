import Icono from './Icono'

export default function ProveedorTabla({ proveedores, editandoId, onEditar, onCambiarEstado }) {
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>RUC</th>
            <th>Razón social</th>
            <th className="col-opcional">Teléfono</th>
            <th>Estado</th>
            <th className="acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => {
            const clases = [!proveedor.estado && 'inactiva', proveedor.id_proveedor === editandoId && 'seleccionada']
              .filter(Boolean)
              .join(' ')

            return (
              <tr key={proveedor.id_proveedor} className={clases}>
                <td>
                  <span className="codigo">{proveedor.ruc}</span>
                </td>
                <td>
                  <strong className="tabla__nombre">{proveedor.razon_social}</strong>
                  {proveedor.direccion && <small className="tabla__detalle">{proveedor.direccion}</small>}
                </td>
                <td className="col-opcional">
                  {proveedor.telefono || <span className="tabla__detalle">Sin teléfono</span>}
                </td>
                <td>
                  <span className={`etiqueta ${proveedor.estado ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                    {proveedor.estado ? 'Activo' : 'Desactivado'}
                  </span>
                </td>
                <td className="acciones">
                  <div className="tabla__acciones">
                    <button
                      type="button"
                      className="boton boton--secundario boton--chico"
                      onClick={() => onEditar(proveedor)}
                    >
                      <Icono nombre="editar" tamano={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`boton boton--secundario boton--chico${proveedor.estado ? ' boton--peligro' : ''}`}
                      onClick={() => onCambiarEstado(proveedor)}
                    >
                      <Icono nombre="apagar" tamano={15} />
                      {proveedor.estado ? 'Desactivar' : 'Reactivar'}
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
