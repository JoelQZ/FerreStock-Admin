import { useEffect } from 'react'

export default function Aviso({ mensaje, onCerrar }) {
  useEffect(() => {
    const temporizador = setTimeout(() => onCerrar(null), 3000)
    return () => clearTimeout(temporizador)
  }, [mensaje, onCerrar])

  return <p className="practica__aviso">{mensaje}</p>
}
