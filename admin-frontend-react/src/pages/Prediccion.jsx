import { useEffect, useMemo, useState } from 'react'
import { listarPredicciones } from '../api/ia'
import Aviso from '../components/Aviso'
import Buscador from '../components/Buscador'
import Encabezado from '../components/Encabezado'
import Kpi from '../components/Kpi'
import PrediccionTabla from '../components/PrediccionTabla'
import Tarjeta from '../components/Tarjeta'
import { erroresDeApi } from '../utils/errores'
import { formatearCantidad } from '../utils/formato'

const PLAZOS = [
  { valor: '', texto: 'Cualquier plazo' },
  { valor: '7', texto: 'Se agotan en 7 días' },
  { valor: '15', texto: 'Se agotan en 15 días' },
  { valor: '30', texto: 'Se agotan en 30 días' },
]

function ultimaPorProducto(lista) {
  const vistos = new Set()
  return lista.filter((prediccion) => {
    if (vistos.has(prediccion.producto)) return false
    vistos.add(prediccion.producto)
    return true
  })
}

export default function Prediccion() {
  const [plazo, setPlazo] = useState('')
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState({ plazo: null, items: [], error: '' })

  useEffect(() => {
    const controlador = new AbortController()
    const params = plazo ? { dias_maximos: plazo } : {}
    listarPredicciones(params, controlador.signal).then(
      (items) => setResultado({ plazo, items: ultimaPorProducto(items), error: '' }),
      (falla) => {
        if (controlador.signal.aborted) return
        setResultado({
          plazo,
          items: [],
          error: erroresDeApi(falla).general || 'No se pudieron cargar las predicciones.',
        })
      },
    )
    return () => controlador.abort()
  }, [plazo])

  const cargando = resultado.plazo !== plazo
  const { items, error } = resultado

  const visibles = useMemo(() => {
    const busqueda = texto.trim().toLowerCase()
    const filtradas = busqueda
      ? items.filter(
          (item) =>
            item.producto_codigo.toLowerCase().includes(busqueda) ||
            item.producto_nombre.toLowerCase().includes(busqueda),
        )
      : items
    return [...filtradas].sort((a, b) => a.dias_para_agotarse - b.dias_para_agotarse)
  }, [items, texto])

  const urgentes = items.filter((item) => item.dias_para_agotarse <= 7).length
  const unidades = items.reduce((suma, item) => suma + Number(item.cantidad_sugerida), 0)

  return (
    <>
      <Encabezado
        kicker="Predicción IA"
        titulo="Predicción de reposición"
        subtitulo="Sugerencias de compra según el historial de ventas."
      />

      <main className="contenido">
        <section className="kpis">
          <Kpi etiqueta="Productos por reponer" valor={cargando ? '—' : items.length} />
          <Kpi etiqueta="Se agotan en 7 días" valor={cargando ? '—' : urgentes} alerta />
          <Kpi etiqueta="Unidades sugeridas" valor={cargando ? '—' : formatearCantidad(unidades)} />
        </section>

        <Tarjeta>
          <div className="herramientas">
            <Buscador
              valor={texto}
              onCambiar={setTexto}
              placeholder="Buscar producto por código o nombre…"
              etiqueta="Buscar predicciones"
            />
            <select
              className="entrada herramientas__filtro"
              value={plazo}
              onChange={(evento) => setPlazo(evento.target.value)}
              aria-label="Plazo"
            >
              {PLAZOS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="vacio">
              <Aviso tipo="error">{error}</Aviso>
            </div>
          ) : cargando && items.length === 0 ? (
            <p className="vacio">Cargando predicciones…</p>
          ) : visibles.length === 0 ? (
            <div className="vacio">
              <h2>{texto.trim() || plazo ? 'Sin resultados' : 'Aún no hay predicciones'}</h2>
              <p>
                {texto.trim() || plazo
                  ? 'Ningún producto coincide con el filtro.'
                  : 'Las sugerencias aparecen cuando el sistema calcula la demanda con el historial de ventas.'}
              </p>
            </div>
          ) : (
            <PrediccionTabla predicciones={visibles} cargando={cargando} />
          )}
        </Tarjeta>
      </main>
    </>
  )
}
