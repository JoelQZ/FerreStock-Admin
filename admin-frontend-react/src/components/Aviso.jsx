import Icono from './Icono'

export default function Aviso({ tipo = 'ok', children, alCerrar }) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono nombre={tipo === 'error' ? 'alerta' : 'check'} />
      <span className="aviso__texto">{children}</span>
      {alCerrar && (
        <button type="button" className="aviso__cerrar" onClick={alCerrar} aria-label="Cerrar aviso">
          <Icono nombre="cerrar" tamano={16} />
        </button>
      )}
    </div>
  )
}
