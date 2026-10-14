export const MENU = [
  { ruta: '/productos', texto: 'Productos', icono: 'caja' },
  { ruta: '/inventario', texto: 'Inventario', icono: 'capas' },
  { ruta: '/reportes', texto: 'Reportes', icono: 'grafico' },
  { ruta: '/prediccion', texto: 'Predicción IA', icono: 'chispa' },
  { ruta: '/usuarios', texto: 'Usuarios', icono: 'usuarios' },
  { ruta: '/configuracion', texto: 'Configuración', icono: 'ajustes' },
]

export const SECCIONES_PENDIENTES = [
  {
    ruta: 'inventario',
    kicker: 'INVENTARIO · KÁRDEX',
    titulo: 'Inventario',
    descripcion: 'Ingresos de mercadería, proveedores y movimientos de stock.',
  },
  {
    ruta: 'prediccion',
    kicker: 'INTELIGENCIA ARTIFICIAL',
    titulo: 'Predicción de reposición',
    descripcion: 'Sugerencias de compra según el historial de ventas.',
  },
  {
    ruta: 'usuarios',
    kicker: 'SEGURIDAD',
    titulo: 'Usuarios',
    descripcion: 'Cuentas del personal y sus roles.',
  },
  {
    ruta: 'configuracion',
    kicker: 'NEGOCIO',
    titulo: 'Configuración',
    descripcion: 'Datos de la ferretería, IGV y comprobantes.',
  },
]
