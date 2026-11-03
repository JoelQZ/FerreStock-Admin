import Icono from './Icono'

export default function Buscador({ valor, onCambiar, placeholder = 'Buscar…', etiqueta = 'Buscar' }) {
  return (
    <div className="buscador">
      <Icono nombre="buscar" />
      <input
        className="entrada"
        type="search"
        placeholder={placeholder}
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        aria-label={etiqueta}
      />
    </div>
  )
}
