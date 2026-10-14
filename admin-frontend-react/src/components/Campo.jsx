export default function Campo({ etiqueta, error, ayuda, obligatorio, ancho, children }) {
  const clases = ['campo', ancho && 'campo--ancho', error && 'campo--error'].filter(Boolean).join(' ')

  return (
    <label className={clases}>
      <span className="campo__etiqueta">
        {etiqueta}
        {obligatorio && <em>*</em>}
      </span>
      {children}
      {error ? <span className="campo__error">{error}</span> : ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </label>
  )
}
