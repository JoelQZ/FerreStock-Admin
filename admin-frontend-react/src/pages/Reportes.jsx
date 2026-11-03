import { useEffect, useState } from 'react'
import { listarTurnos, listarVentas, obtenerReporteVentas } from '../api/reportes'
import Aviso from '../components/Aviso'
import Buscador from '../components/Buscador'
import Encabezado from '../components/Encabezado'
import Icono from '../components/Icono'
import Kpi from '../components/Kpi'
import Tarjeta from '../components/Tarjeta'
import VentasTabla from '../components/VentasTabla'
import { erroresDeApi } from '../utils/errores'
import { formatearSoles } from '../utils/formato'
import {
  colorMetodo,
  comprobante,
  descargarArchivo,
  fechaLocal,
  filtrarVentas,
  generarCsv,
  metodosDeVenta,
} from '../utils/reporte'

function coincide(venta, texto) {
  const buscado = texto.trim().toLowerCase()
  if (!buscado) return true
  return [comprobante(venta), venta.usuario_nombre, venta.cliente_nombre, metodosDeVenta(venta)]
    .filter(Boolean)
    .some((valor) => valor.toLowerCase().includes(buscado))
}

export default function Reportes() {
  const hoy = fechaLocal()
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)
  const [turno, setTurno] = useState('')
  const [texto, setTexto] = useState('')
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, reporte: null, ventas: [], turnos: [], error: '' })

  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const clave = `${desde}|${hasta}|${turno}|${version}`

  useEffect(() => {
    if (rangoInvalido) return undefined
    let activo = true
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (turno) params.turno = turno

    Promise.all([obtenerReporteVentas(params), listarVentas(), listarTurnos()]).then(
      ([reporte, ventas, turnos]) => {
        if (activo) setResultado({ clave, reporte, ventas, turnos, error: '' })
      },
      (falla) => {
        if (activo) {
          setResultado((previo) => ({
            ...previo,
            clave,
            reporte: null,
            error: erroresDeApi(falla).general || 'No se pudo cargar el reporte.',
          }))
        }
      },
    )
    return () => {
      activo = false
    }
  }, [desde, hasta, turno, clave, rangoInvalido])

  const cargando = !rangoInvalido && resultado.clave !== clave
  const { reporte, turnos, error } = resultado
  const ventas = filtrarVentas(resultado.ventas, { desde, hasta, turno })
  const ventasVisibles = ventas.filter((venta) => coincide(venta, texto))
  const resumen = reporte?.resumen
  const cantidad = resumen?.cantidad_ventas ?? 0
  const total = Number(resumen?.total ?? 0)
  const ticketPromedio = cantidad ? total / cantidad : 0
  const metodos = reporte?.por_metodo_pago ?? []
  const totalMetodos = metodos.reduce((suma, fila) => suma + Number(fila.total), 0)

  function verHoy() {
    setDesde(hoy)
    setHasta(hoy)
    setTurno('')
  }

  function exportarExcel() {
    if (!reporte) return
    descargarArchivo(
      generarCsv(reporte, ventas),
      `reporte-ventas-${desde || 'inicio'}-a-${hasta || 'hoy'}.csv`,
      'text/csv;charset=utf-8',
    )
  }

  return (
    <>
      <Encabezado kicker="Reportes" titulo="Reporte diario de ventas" subtitulo="Ventas e ingresos por tipo de pago.">
        <div className="reporte__exportar">
          <button type="button" className="boton boton--secundario" onClick={exportarExcel} disabled={!reporte}>
            <Icono nombre="descargar" />
            Excel
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => window.print()} disabled={!reporte}>
            <Icono nombre="imprimir" />
            PDF
          </button>
        </div>
      </Encabezado>

      <main className="contenido">
        <section className="tarjeta herramientas reporte__filtros">
          <label className="campo campo--linea">
            <span className="campo__etiqueta">Desde</span>
            <input
              className="entrada"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(evento) => setDesde(evento.target.value)}
            />
          </label>
          <label className="campo campo--linea">
            <span className="campo__etiqueta">Hasta</span>
            <input
              className="entrada"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(evento) => setHasta(evento.target.value)}
            />
          </label>
          <label className="campo campo--linea">
            <span className="campo__etiqueta">Turno</span>
            <select className="entrada" value={turno} onChange={(evento) => setTurno(evento.target.value)}>
              <option value="">Todos los turnos</option>
              {turnos.map((item) => (
                <option key={item.id_turno} value={item.id_turno}>
                  #{item.id_turno} · {item.usuario_nombre || 'Cajero'} · {item.apertura.slice(0, 10)}{' '}
                  {item.apertura.slice(11, 16)} · {item.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'}
                </option>
              ))}
            </select>
          </label>
          <div className="reporte__acciones-filtro">
            <button type="button" className="boton boton--secundario" onClick={verHoy}>
              Hoy
            </button>
            <button type="button" className="boton boton--principal" onClick={() => setVersion((previa) => previa + 1)}>
              Actualizar
            </button>
          </div>
        </section>

        {rangoInvalido && <Aviso tipo="error">La fecha inicial no puede ser posterior a la fecha final.</Aviso>}
        {error && <Aviso tipo="error">{error}</Aviso>}

        <section className={`kpis kpis--cuatro${cargando ? ' tabla-contenedor--cargando' : ''}`}>
          <Kpi etiqueta="Total vendido" valor={formatearSoles(total)} alerta />
          <Kpi etiqueta="N.º de ventas" valor={cantidad} />
          <Kpi etiqueta="Ticket promedio" valor={formatearSoles(ticketPromedio)} />
          <Kpi
            etiqueta="IGV (18 %)"
            valor={formatearSoles(resumen?.igv)}
            detalle={`Op. gravada ${formatearSoles(resumen?.subtotal)}`}
          />
        </section>

        <Tarjeta titulo="Desglose por tipo de pago">
          {metodos.length === 0 ? (
            <p className="vacio">No hay ventas en el periodo seleccionado.</p>
          ) : (
            <div className="desglose">
              <div className="desglose__barra" role="img" aria-label="Proporción de ventas por tipo de pago">
                {metodos.map((fila) => (
                  <span
                    key={fila.metodo}
                    style={{
                      width: `${totalMetodos ? (Number(fila.total) / totalMetodos) * 100 : 0}%`,
                      background: colorMetodo(fila.metodo),
                    }}
                    title={`${fila.metodo}: ${formatearSoles(fila.total)}`}
                  />
                ))}
              </div>
              <ul className="desglose__lista">
                {metodos.map((fila) => (
                  <li key={fila.metodo}>
                    <span className="desglose__color" style={{ background: colorMetodo(fila.metodo) }} />
                    <span className="desglose__metodo">{fila.metodo}</span>
                    <span className="desglose__porcentaje">
                      {totalMetodos ? ((Number(fila.total) / totalMetodos) * 100).toFixed(1) : '0.0'} %
                    </span>
                    <span className="desglose__ventas">
                      {fila.cantidad_ventas} {fila.cantidad_ventas === 1 ? 'venta' : 'ventas'}
                    </span>
                    <strong className="desglose__monto">{formatearSoles(fila.total)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Últimas ventas">
          {ventas.length === 0 ? (
            <p className="vacio">Aún no hay ventas registradas en este periodo.</p>
          ) : (
            <>
              <div className="herramientas">
                <Buscador
                  valor={texto}
                  onCambiar={setTexto}
                  placeholder="Buscar por comprobante, cajero, cliente o pago…"
                  etiqueta="Buscar ventas"
                />
              </div>
              {ventasVisibles.length === 0 ? (
                <p className="vacio">Ninguna venta coincide con “{texto.trim()}”.</p>
              ) : (
                <VentasTabla ventas={ventasVisibles} />
              )}
            </>
          )}
        </Tarjeta>
      </main>
    </>
  )
}
