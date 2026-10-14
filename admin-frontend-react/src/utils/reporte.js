const COLORES_METODO = {
  efectivo: '#2e7d4f',
  yape: '#742284',
  plin: '#0e9fc2',
  tarjeta: '#3b434b',
  transferencia: '#c47f0a',
}

export function colorMetodo(nombre = '') {
  return COLORES_METODO[nombre.trim().toLowerCase()] ?? '#8a9199'
}

export function fechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function fechaDeVenta(venta) {
  return venta.fecha_hora.slice(0, 10)
}

export function fechaCorta(venta) {
  const [anio, mes, dia] = fechaDeVenta(venta).split('-')
  return `${dia}/${mes}/${anio}`
}

export function horaDeVenta(venta) {
  return venta.fecha_hora.slice(11, 16)
}

export function comprobante(venta) {
  return `${venta.serie}-${String(venta.numero).padStart(6, '0')}`
}

export function metodosDeVenta(venta) {
  return [...new Set(venta.pagos.map((pago) => pago.metodo_nombre))].join(' + ')
}

export function filtrarVentas(ventas, { desde, hasta, turno }) {
  return ventas
    .filter((venta) => {
      const fecha = fechaDeVenta(venta)
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false
      if (turno && String(venta.turno) !== String(turno)) return false
      return true
    })
    .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
}

function celdaCsv(valor) {
  const texto = String(valor ?? '')
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function generarCsv(reporte, ventas) {
  const filas = [
    ['Reporte diario de ventas FerreStock'],
    ['Desde', reporte.desde ?? 'Inicio'],
    ['Hasta', reporte.hasta ?? 'Hoy'],
    [],
    ['Total vendido', reporte.resumen.total],
    ['Numero de ventas', reporte.resumen.cantidad_ventas],
    ['Op. gravada', reporte.resumen.subtotal],
    ['IGV', reporte.resumen.igv],
    [],
    ['Metodo de pago', 'Ventas', 'Total'],
    ...reporte.por_metodo_pago.map((fila) => [fila.metodo, fila.cantidad_ventas, fila.total]),
    [],
    ['Comprobante', 'Fecha', 'Hora', 'Cajero', 'Metodo', 'Estado', 'Total'],
    ...ventas.map((venta) => [
      comprobante(venta),
      fechaDeVenta(venta),
      horaDeVenta(venta),
      venta.usuario_nombre,
      metodosDeVenta(venta),
      venta.estado,
      venta.total,
    ]),
  ]
  return '﻿' + filas.map((fila) => fila.map(celdaCsv).join(';')).join('\r\n')
}

export function descargarArchivo(contenido, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}
