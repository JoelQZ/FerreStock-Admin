export const TIPOS_CATALOGO = [
  {
    clave: 'categorias',
    titulo: 'Categorías',
    singular: 'categoría',
    id: 'id_categoria',
    tieneEstado: true,
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true, maximo: 100, ejemplo: 'Ej.: Herramientas manuales' },
      { nombre: 'descripcion', etiqueta: 'Descripción', maximo: 255, ejemplo: 'Qué productos agrupa', multilinea: true },
    ],
  },
  {
    clave: 'marcas',
    titulo: 'Marcas',
    singular: 'marca',
    id: 'id_marca',
    tieneEstado: true,
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true, maximo: 100, ejemplo: 'Ej.: Stanley' }],
  },
  {
    clave: 'unidades',
    titulo: 'Unidades',
    singular: 'unidad',
    id: 'id_unidad',
    tieneEstado: false,
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', obligatorio: true, maximo: 50, ejemplo: 'Ej.: Metro' },
      { nombre: 'abreviatura', etiqueta: 'Abreviatura', obligatorio: true, maximo: 10, ejemplo: 'Ej.: m', codigo: true },
    ],
  },
]

export function tipoCatalogo(clave) {
  return TIPOS_CATALOGO.find((tipo) => tipo.clave === clave) ?? TIPOS_CATALOGO[0]
}

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function normalizar(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function filtrarCatalogo(tipo, items, texto) {
  const buscado = normalizar(texto.trim())
  if (!buscado) return items
  return items.filter((item) => tipo.campos.some((campo) => normalizar(item[campo.nombre]).includes(buscado)))
}
