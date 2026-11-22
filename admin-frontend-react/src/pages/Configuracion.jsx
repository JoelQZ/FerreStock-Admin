import { useEffect, useState } from 'react'
import { guardarNegocio, obtenerNegocio } from '../api/configuracion'
import Aviso from '../components/Aviso'
import Encabezado from '../components/Encabezado'
import NegocioFormulario from '../components/NegocioFormulario'
import VistaComprobante from '../components/VistaComprobante'
import { erroresDeApi } from '../utils/errores'

const VACIO = { nombre: '', ruc: '', direccion: '', telefono: '', impresora: '', igv_porcentaje: '18.00' }
const DURACION_AVISO = 4000

function adaptarNegocio(negocio) {
  return Object.fromEntries(Object.keys(VACIO).map((campo) => [campo, String(negocio[campo] ?? '')]))
}

export default function Configuracion() {
  const [valores, setValores] = useState(VACIO)
  const [existe, setExiste] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [errores, setErrores] = useState({})
  const [general, setGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const controlador = new AbortController()
    obtenerNegocio(controlador.signal)
      .then((negocio) => {
        setValores(adaptarNegocio(negocio))
        setExiste(true)
      })
      .catch((falla) => {
        if (controlador.signal.aborted) return
        if (falla.response?.status !== 404) {
          setErrorCarga(erroresDeApi(falla).general || 'No se pudieron cargar los datos del negocio.')
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  useEffect(() => {
    if (!mensaje) return undefined
    const temporizador = setTimeout(() => setMensaje(''), DURACION_AVISO)
    return () => clearTimeout(temporizador)
  }, [mensaje])

  function cambiar(campo, valor) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  async function guardar() {
    const limpios = Object.fromEntries(Object.entries(valores).map(([campo, valor]) => [campo, valor.trim()]))
    const faltantes = {}
    if (!limpios.nombre) faltantes.nombre = 'Este campo es obligatorio.'
    if (limpios.ruc && !/^\d{11}$/.test(limpios.ruc)) faltantes.ruc = 'El RUC debe contener exactamente 11 dígitos.'
    if (limpios.igv_porcentaje === '') faltantes.igv_porcentaje = 'Este campo es obligatorio.'
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }

    setGuardando(true)
    setGeneral('')
    try {
      const negocio = await guardarNegocio(limpios, existe)
      setValores(adaptarNegocio(negocio))
      setExiste(true)
      setMensaje('Datos del negocio guardados.')
    } catch (falla) {
      const { general: texto, campos } = erroresDeApi(falla)
      setErrores(campos)
      setGeneral(texto || (Object.keys(campos).length ? '' : 'No se pudo guardar.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Encabezado kicker="Configuración" titulo="Configuración" subtitulo="Datos de la ferretería, IGV y comprobantes." />

      <main className="contenido">
        {mensaje && <Aviso alCerrar={() => setMensaje('')}>{mensaje}</Aviso>}

        {cargando ? (
          <p className="tarjeta vacio">Cargando datos del negocio…</p>
        ) : errorCarga ? (
          <div className="tarjeta vacio">
            <Aviso tipo="error">{errorCarga}</Aviso>
          </div>
        ) : (
          <>
            {!existe && <Aviso tipo="error">Aún no hay datos del negocio. Complétalos y guarda.</Aviso>}
            <div className="registro">
              <NegocioFormulario
                valores={valores}
                errores={errores}
                general={general}
                guardando={guardando}
                onCambiar={cambiar}
                onGuardar={guardar}
              />
              <VistaComprobante valores={valores} />
            </div>
          </>
        )}
      </main>
    </>
  )
}
