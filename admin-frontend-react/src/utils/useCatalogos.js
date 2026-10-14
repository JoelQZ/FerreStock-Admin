import { useEffect, useState } from 'react'
import { listarCategorias, listarMarcas, listarUnidades } from '../api/catalogo'

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState({
    categorias: [],
    marcas: [],
    unidades: [],
    cargado: false,
    error: '',
  })

  useEffect(() => {
    let activo = true
    Promise.all([listarCategorias(), listarMarcas(), listarUnidades()]).then(
      ([categorias, marcas, unidades]) => {
        if (activo) setCatalogos({ categorias, marcas, unidades, cargado: true, error: '' })
      },
      () => {
        if (activo) {
          setCatalogos((previo) => ({
            ...previo,
            cargado: true,
            error: 'No se pudieron cargar las categorías, marcas y unidades.',
          }))
        }
      },
    )
    return () => {
      activo = false
    }
  }, [])

  return catalogos
}
