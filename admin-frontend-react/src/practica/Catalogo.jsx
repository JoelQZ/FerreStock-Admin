import ProductoCard from './ProductoCard'

export default function Catalogo({ productos, onAgregar }) {
  return (
    <section className="tarjeta practica__seccion">
      <div className="tarjeta__cabecera">
        <h2>Productos</h2>
      </div>
      {productos.length === 0 && <p className="practica__vacio">No hay productos que coincidan</p>}
      <ul className="practica__lista">
        {productos.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} onAgregar={onAgregar} />
        ))}
      </ul>
    </section>
  )
}
