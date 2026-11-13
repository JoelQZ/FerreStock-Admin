import { useState } from 'react'
import Aviso from './Aviso'
import Buscador from './Buscador'
import Carrito from './Carrito'
import Catalogo from './Catalogo'
import { productosIniciales } from './datos'

export default function Practica() {
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState(null)

  const productosFiltrados = productosIniciales.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  )

  function agregarAlCarrito(producto) {
    const existe = carrito.find((linea) => linea.id === producto.id)
    if (existe) {
      setCarrito(
        carrito.map((linea) =>
          linea.id === producto.id ? { ...linea, cantidad: linea.cantidad + 1 } : linea,
        ),
      )
    } else {
      setCarrito([
        ...carrito,
        { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 },
      ])
    }
    setAviso({ clave: Date.now(), mensaje: `Agregado: ${producto.nombre}` })
  }

  function quitarDelCarrito(id) {
    setCarrito(carrito.filter((linea) => linea.id !== id))
  }

  function vaciarCarrito() {
    setCarrito([])
  }
  
  return (
    <main className="practica">
      <header className="practica__cabecera">
        <p className="topbar__kicker">Laboratorio 11 · Práctica</p>
        <h1>Cafetería Central</h1>
      </header>
      <Buscador valor={busqueda} onCambiar={setBusqueda} />
      {aviso && <Aviso key={aviso.clave} mensaje={aviso.mensaje} onCerrar={setAviso} />}
      <div className="practica__contenido">
        <Catalogo productos={productosFiltrados} onAgregar={agregarAlCarrito} />
        <Carrito lineas={carrito} onQuitar={quitarDelCarrito} onVaciar={vaciarCarrito} />
      </div>
    </main>
  )
}
