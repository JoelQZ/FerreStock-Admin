const TODOS = ['ADMINISTRADOR', 'CAJERO']
const ADMIN = ['ADMINISTRADOR']

export const MENU = [
  { ruta: '/productos', texto: 'Productos', icono: 'caja', roles: TODOS },
  { ruta: '/catalogos', texto: 'Catálogos', icono: 'etiqueta', roles: TODOS },
  { ruta: '/inventario', texto: 'Inventario', icono: 'capas', roles: TODOS },
  { ruta: '/reportes', texto: 'Reportes', icono: 'grafico', roles: ADMIN },
  { ruta: '/prediccion', texto: 'Predicción IA', icono: 'chispa', roles: TODOS },
  { ruta: '/usuarios', texto: 'Usuarios', icono: 'usuarios', roles: ADMIN },
  { ruta: '/configuracion', texto: 'Configuración', icono: 'ajustes', roles: ADMIN },
]
