import { useEffect, useState } from 'react'
import { api } from '../api/cliente'

const FORMULARIO_VACIO = { nombre: '', descripcion: '' }

export default function ListaPractica() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [erroresFormulario, setErroresFormulario] = useState({})
  const [buscar, setBuscar] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const respuesta = await api.get('/catalogo/categorias/', { params: { search: buscar } })
        setCategorias(respuesta.data)
        setError('')
      } catch (err) {
        console.error('Error al cargar las categorías:', err.message)
        setError('No se pudo cargar la lista')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [buscar])

  function cambiarCampo(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value })
  }

  async function crearCategoria(evento) {
    evento.preventDefault()
    setErroresFormulario({})
    try {
      const respuesta = await api.post('/catalogo/categorias/', formulario)
      setCategorias([...categorias, respuesta.data])
      setFormulario(FORMULARIO_VACIO)
    } catch (err) {
      setErroresFormulario(err.response?.data ?? { detail: 'No se pudo crear la categoría.' })
    }
  }

  async function eliminarCategoria(id) {
    try {
      const respuesta = await api.delete(`/catalogo/categorias/${id}/`)
      if (respuesta.status === 204) {
        setCategorias(categorias.filter((categoria) => categoria.id_categoria !== id))
      }
    } catch (err) {
      console.error('Error al eliminar la categoría:', err.message)
    }
  }

  async function editarCategoria(categoria) {
    const nombre = window.prompt('Nuevo nombre de la categoría', categoria.nombre)
    if (!nombre || nombre === categoria.nombre) return
    try {
      const respuesta = await api.patch(`/catalogo/categorias/${categoria.id_categoria}/`, { nombre })
      setCategorias(
        categorias.map((item) => (item.id_categoria === categoria.id_categoria ? respuesta.data : item)),
      )
    } catch (err) {
      window.alert(err.response?.data?.nombre ?? 'No se pudo modificar la categoría.')
    }
  }

  return (
    <main className="practica">
      <header className="practica__cabecera">
        <p className="topbar__kicker">Laboratorio 12 · Práctica</p>
        <h1>Categorías</h1>
      </header>

      <form className="tarjeta practica__formulario" onSubmit={crearCategoria}>
        <label className="campo">
          <span className="campo__etiqueta">Nombre</span>
          <input className="entrada" name="nombre" value={formulario.nombre} onChange={cambiarCampo} />
          {erroresFormulario.nombre && <span className="campo__error">{erroresFormulario.nombre}</span>}
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Descripción</span>
          <input className="entrada" name="descripcion" value={formulario.descripcion} onChange={cambiarCampo} />
        </label>
        <button type="submit" className="boton boton--principal">
          Agregar
        </button>
        {erroresFormulario.detail && <span className="campo__error">{erroresFormulario.detail}</span>}
      </form>

      <input
        className="entrada practica__buscador"
        type="search"
        placeholder="Buscar categoría…"
        value={buscar}
        onChange={(evento) => setBuscar(evento.target.value)}
      />

      <section className="tarjeta">
        {cargando ? (
          <p className="practica__vacio">Cargando...</p>
        ) : error ? (
          <p className="practica__vacio">{error}</p>
        ) : categorias.length === 0 ? (
          <p className="practica__vacio">No hay categorías para mostrar.</p>
        ) : (
          <ul className="practica__lista">
            {categorias.map((categoria) => (
              <li key={categoria.id_categoria} className="practica__linea">
                <strong>{categoria.nombre}</strong>
                <span>{categoria.descripcion}</span>
                <button
                  type="button"
                  className="boton boton--secundario boton--chico"
                  onClick={() => editarCategoria(categoria)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="boton boton--peligro boton--chico"
                  onClick={() => eliminarCategoria(categoria.id_categoria)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
