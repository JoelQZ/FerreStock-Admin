import ProductoFila from './ProductoFila'

export default function ProductoTabla({ productos, cargando = false, onCambiarEstado }) {
  return (
    <div className={`tabla-contenedor${cargando ? ' tabla-contenedor--cargando' : ''}`}>
      <table className="tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th className="col-opcional">Categoría</th>
            <th className="num">P. venta</th>
            <th>Stock</th>
            <th className="col-opcional">Estado</th>
            <th className="acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <ProductoFila key={producto.id_producto} producto={producto} onCambiarEstado={onCambiarEstado} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
