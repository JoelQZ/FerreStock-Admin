import { useEffect, useMemo, useState } from 'react'
import { listarKardex } from '../api/inventario'
import { erroresDeApi } from '../utils/errores'
import Aviso from './Aviso'
import Buscador from './Buscador'
import KardexTabla from './KardexTabla'
import Tarjeta from './Tarjeta'

const TIPOS = ['ENTRADA', 'SALIDA', 'AJUSTE']

export default function InventarioKardex() {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    const controlador = new AbortController()
    listarKardex(controlador.signal)
      .then(setMovimientos)
      .catch((falla) => {
        if (controlador.signal.aborted) return
        setError(erroresDeApi(falla).general || 'No se pudo cargar el kárdex.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  const visibles = useMemo(() => {
    const busqueda = texto.trim().toLowerCase()
    return movimientos.filter(
      (movimiento) =>
        (!tipo || movimiento.tipo === tipo) &&
        (!busqueda ||
          movimiento.producto_codigo.toLowerCase().includes(busqueda) ||
          movimiento.producto_nombre.toLowerCase().includes(busqueda)),
    )
  }, [movimientos, texto, tipo])

  return (
    <Tarjeta>
      <div className="herramientas">
        <Buscador
          valor={texto}
          onCambiar={setTexto}
          placeholder="Buscar producto por código o nombre…"
          etiqueta="Buscar en el kárdex"
        />
        <select
          className="entrada herramientas__filtro"
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value)}
          aria-label="Tipo de movimiento"
        >
          <option value="">Todos los movimientos</option>
          {TIPOS.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion.charAt(0) + opcion.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="vacio">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      ) : cargando ? (
        <p className="vacio">Cargando kárdex…</p>
      ) : visibles.length === 0 ? (
        <div className="vacio">
          <h2>{movimientos.length ? 'Sin resultados' : 'Aún no hay movimientos'}</h2>
          <p>
            {movimientos.length
              ? 'Ningún movimiento coincide con el filtro.'
              : 'Cada venta e ingreso de mercadería quedará registrado aquí.'}
          </p>
        </div>
      ) : (
        <>
          <KardexTabla movimientos={visibles} />
          <p className="tabla__pie">
            {visibles.length} {visibles.length === 1 ? 'movimiento' : 'movimientos'}
          </p>
        </>
      )}
    </Tarjeta>
  )
}
