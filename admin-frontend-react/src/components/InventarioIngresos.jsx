import { useEffect, useState } from 'react'
import { listarIngresos, registrarIngreso } from '../api/inventario'
import { erroresDeApi } from '../utils/errores'
import { formatearSoles } from '../utils/formato'
import Aviso from './Aviso'
import Icono from './Icono'
import IngresoFormulario from './IngresoFormulario'
import IngresoTabla from './IngresoTabla'
import Kpi from './Kpi'
import Tarjeta from './Tarjeta'

export default function InventarioIngresos({ proveedores, productos, onIngresoRegistrado, onMensaje }) {
  const [ingresos, setIngresos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [registrando, setRegistrando] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()
    listarIngresos(controlador.signal)
      .then(setIngresos)
      .catch((falla) => {
        if (controlador.signal.aborted) return
        setError(erroresDeApi(falla).general || 'No se pudo cargar la lista de ingresos.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  const activos = proveedores.filter((proveedor) => proveedor.estado)
  const totalComprado = ingresos.reduce((suma, ingreso) => suma + Number(ingreso.total), 0)

  function nombreProveedor(id) {
    return proveedores.find((proveedor) => proveedor.id_proveedor === id)?.razon_social ?? `Proveedor ${id}`
  }

  async function registrar(datos) {
    const nuevo = await registrarIngreso(datos)
    setIngresos((previos) => [nuevo, ...previos])
    setRegistrando(false)
    onMensaje(`Ingreso ${nuevo.nro_documento} registrado por ${formatearSoles(nuevo.total)}. El stock ya se actualizó.`)
    onIngresoRegistrado()
  }

  return (
    <>
      <section className="kpis">
        <Kpi etiqueta="Ingresos registrados" valor={cargando ? '—' : ingresos.length} />
        <Kpi etiqueta="Total comprado" valor={cargando ? '—' : formatearSoles(totalComprado)} />
        <Kpi etiqueta="Proveedores activos" valor={activos.length} />
      </section>

      {registrando && (
        <IngresoFormulario
          proveedores={activos}
          productos={productos}
          onRegistrar={registrar}
          onCancelar={() => setRegistrando(false)}
        />
      )}

      <Tarjeta>
        <div className="herramientas">
          <h2 className="herramientas__titulo">Historial de ingresos</h2>
          {!registrando && (
            <button
              type="button"
              className="boton boton--principal herramientas__nuevo"
              onClick={() => setRegistrando(true)}
              disabled={activos.length === 0}
              title={activos.length === 0 ? 'Primero registra un proveedor' : undefined}
            >
              <Icono nombre="mas" tamano={16} />
              Nuevo ingreso
            </button>
          )}
        </div>

        {error ? (
          <div className="vacio">
            <Aviso tipo="error">{error}</Aviso>
          </div>
        ) : cargando ? (
          <p className="vacio">Cargando ingresos…</p>
        ) : ingresos.length === 0 ? (
          <div className="vacio">
            <h2>Aún no hay ingresos</h2>
            <p>Registra la mercadería que llega de tus proveedores con “Nuevo ingreso”.</p>
          </div>
        ) : (
          <IngresoTabla ingresos={ingresos} nombreProveedor={nombreProveedor} />
        )}
      </Tarjeta>
    </>
  )
}
