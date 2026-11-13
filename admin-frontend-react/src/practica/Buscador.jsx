export default function Buscador({ valor, onCambiar }) {
  return (
    <div className="practica__buscador">
      <input
        className="entrada"
        type="search"
        placeholder="Buscar producto…"
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        aria-label="Buscar producto"
      />
    </div>
  )
}
