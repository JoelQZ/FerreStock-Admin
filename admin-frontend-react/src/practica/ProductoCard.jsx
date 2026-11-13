export default function ProductoCard({ producto, onAgregar }) {
  return (
    <li className="practica__item">
      <strong className="practica__nombre">{producto.nombre}</strong>
      <span className="practica__precio">S/ {Number(producto.precio).toFixed(2)}</span>
      {producto.stock === 0 ? (
        <span className="etiqueta etiqueta--agotado">Agotado</span>
      ) : (
        <span className="stock">Stock: {producto.stock}</span>
      )}
      <button
        type="button"
        className="boton boton--secundario boton--chico"
        onClick={() => onAgregar(producto)}
        disabled={producto.stock === 0}
      >
        Agregar
      </button>
    </li>
  )
}