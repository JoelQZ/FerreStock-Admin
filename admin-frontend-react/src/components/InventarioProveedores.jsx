import { useMemo, useState } from 'react'
import { actualizarProveedor, crearProveedor, desactivarProveedor } from '../api/inventario'
import { erroresDeApi } from '../utils/errores'
import Buscador from './Buscador'
import ProveedorFormulario from './ProveedorFormulario'
import ProveedorTabla from './ProveedorTabla'
import Tarjeta from './Tarjeta'

export default function InventarioProveedores({ proveedores, onCambiarLista, onMensaje, onError }) {
  const [texto, setTexto] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [editando, setEditando] = useState(null)

  const visibles = useMemo(() => {
    const busqueda = texto.trim().toLowerCase()
    return proveedores.filter(
      (proveedor) =>
        (verTodos || proveedor.estado) &&
        (!busqueda || proveedor.ruc.includes(busqueda) || proveedor.razon_social.toLowerCase().includes(busqueda)),
    )
  }, [proveedores, texto, verTodos])

  async function guardar(valores) {
    if (editando) {
      const actualizado = await actualizarProveedor(editando.id_proveedor, valores)
      onCambiarLista((previos) =>
        previos.map((proveedor) => (proveedor.id_proveedor === actualizado.id_proveedor ? actualizado : proveedor)),
      )
    } else {
      const nuevo = await crearProveedor(valores)
      onCambiarLista((previos) => [...previos, nuevo])
    }
    onMensaje(`Proveedor "${valores.razon_social}" ${editando ? 'actualizado' : 'registrado'}.`)
    setEditando(null)
  }

  async function cambiarEstado(proveedor) {
    const desactivar = proveedor.estado
    if (
      desactivar &&
      !window.confirm(`¿Desactivar al proveedor "${proveedor.razon_social}"? Ya no aparecerá al registrar ingresos.`)
    ) {
      return
    }
    try {
      if (desactivar) await desactivarProveedor(proveedor.id_proveedor)
      else await actualizarProveedor(proveedor.id_proveedor, { estado: true })
      onCambiarLista((previos) =>
        previos.map((item) =>
          item.id_proveedor === proveedor.id_proveedor ? { ...item, estado: !desactivar } : item,
        ),
      )
      onMensaje(`Proveedor "${proveedor.razon_social}" ${desactivar ? 'desactivado' : 'reactivado'}.`)
      if (editando?.id_proveedor === proveedor.id_proveedor) setEditando(null)
    } catch (falla) {
      onError(erroresDeApi(falla).general || 'No se pudo cambiar el estado.')
    }
  }

  return (
    <div className="registro">
      <Tarjeta>
        <div className="herramientas">
          <Buscador
            valor={texto}
            onCambiar={setTexto}
            placeholder="Buscar por RUC o razón social…"
            etiqueta="Buscar proveedores"
          />
          <label className="casilla">
            <input type="checkbox" checked={verTodos} onChange={(evento) => setVerTodos(evento.target.checked)} />
            Ver desactivados
          </label>
        </div>

        {visibles.length === 0 ? (
          <div className="vacio">
            <h2>{texto.trim() ? 'Sin resultados' : 'Aún no hay proveedores'}</h2>
            <p>{texto.trim() ? 'Ningún proveedor coincide con la búsqueda.' : 'Registra el primero con el formulario.'}</p>
          </div>
        ) : (
          <ProveedorTabla
            proveedores={visibles}
            editandoId={editando?.id_proveedor}
            onEditar={setEditando}
            onCambiarEstado={cambiarEstado}
          />
        )}
      </Tarjeta>

      <ProveedorFormulario
        key={editando?.id_proveedor ?? 'nuevo'}
        proveedor={editando}
        onGuardar={guardar}
        onCancelar={() => setEditando(null)}
      />
    </div>
  )
}
