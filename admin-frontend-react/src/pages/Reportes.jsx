import { useEffect, useState } from 'react'
import { listarTurnos, listarVentas, obtenerReporteVentas } from '../api/reportes'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import Icono from '../components/Icono'
import { erroresDeApi } from '../utils/errores'
import { formatearSoles } from '../utils/formato'
import {
  colorMetodo,
  comprobante,
  descargarArchivo,
  fechaCorta,
  fechaLocal,
  filtrarVentas,
  generarCsv,
  horaDeVenta,
  metodosDeVenta,
} from '../utils/reporte'

const LIMITE_TABLA = 15

export default function Reportes() {
  const hoy = fechaLocal()
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)
  const [turno, setTurno] = useState('')
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
    descargarArchivo(generarCsv(reporte, ventas), `reporte-ventas-${desde || 'inicio'}-a-${hasta || 'hoy'}.csv`, 'text/csv;charset=utf-8')
  }

  return (
    <>
      <Encabezado
        kicker="Reportes"
        titulo="Reporte diario de ventas"
        subtitulo="Ventas e ingresos por tipo de pago."
      >
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
          <div className="tarjeta kpi kpi--alerta">
            <span>Total vendido</span>
            <strong>{formatearSoles(total)}</strong>
          </div>
          <div className="tarjeta kpi">
            <span>N.º de ventas</span>
            <strong>{cantidad}</strong>
          </div>
          <div className="tarjeta kpi">
            <span>Ticket promedio</span>
            <strong>{formatearSoles(ticketPromedio)}</strong>
          </div>
          <div className="tarjeta kpi">
            <span>IGV (18 %)</span>
            <strong>{formatearSoles(resumen?.igv)}</strong>
            <small className="kpi__detalle">Op. gravada {formatearSoles(resumen?.subtotal)}</small>
          </div>
        </section>

        <section className="tarjeta">
          <div className="tarjeta__cabecera">
            <h2>Desglose por tipo de pago</h2>
          </div>
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
        </section>

        <section className="tarjeta">
          <div className="tarjeta__cabecera">
            <h2>Últimas ventas</h2>
          </div>
          {ventas.length === 0 ? (
            <p className="vacio">Aún no hay ventas registradas en este periodo.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Comprobante</th>
                    <th>Fecha</th>
                    <th>Cajero</th>
                    <th>Tipo de pago</th>
                    <th>Estado</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.slice(0, LIMITE_TABLA).map((venta) => (
                    <tr key={venta.id_venta} className={venta.estado === 'COMPLETADA' ? '' : 'inactiva'}>
                      <td>
                        <span className="codigo">{comprobante(venta)}</span>
                      </td>
                      <td className="sin-corte">
                        {fechaCorta(venta)} <small className="tabla__detalle">{horaDeVenta(venta)}</small>
                      </td>
                      <td>{venta.usuario_nombre || '—'}</td>
                      <td>{metodosDeVenta(venta)}</td>
                      <td>
                        <span
                          className={`etiqueta ${venta.estado === 'COMPLETADA' ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}
                        >
                          {venta.estado === 'COMPLETADA' ? 'Completada' : 'Anulada'}
                        </span>
                      </td>
                      <td className="num">{formatearSoles(venta.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ventas.length > LIMITE_TABLA && (
                <p className="tabla__pie">
                  Mostrando {LIMITE_TABLA} de {ventas.length} ventas.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
