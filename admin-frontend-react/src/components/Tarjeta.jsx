export default function Tarjeta({ titulo, className = '', children }) {
  return (
    <section className={`tarjeta ${className}`.trim()}>
      {titulo && (
        <div className="tarjeta__cabecera">
          <h2>{titulo}</h2>
        </div>
      )}
      {children}
    </section>
  )
}
