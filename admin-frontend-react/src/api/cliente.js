import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const CLAVE_SESION = 'ferrestock_admin_sesion'

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION))
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    else localStorage.removeItem(CLAVE_SESION)
    return true
  } catch {
    return false
  }
}

let alExpirarSesion = () => {}

export function registrarExpiracion(funcion) {
  alExpirarSesion = funcion
}

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const sesion = leerSesion()
  if (sesion?.access) config.headers.Authorization = `Bearer ${sesion.access}`
  return config
})

let renovacion = null

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config
    const esLogin = original?.url?.includes('auth/login')
    if (error.response?.status !== 401 || esLogin) return Promise.reject(error)

    const sesion = leerSesion()
    if (original._reintento || !sesion?.refresh) {
      alExpirarSesion()
      return Promise.reject(error)
    }

    original._reintento = true
    try {
      renovacion ??= axios
        .post(`${API_URL}/auth/refresh/`, { refresh: sesion.refresh })
        .finally(() => {
          renovacion = null
        })
      const { data } = await renovacion
      guardarSesion({ ...sesion, access: data.access })
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch {
      alExpirarSesion()
      return Promise.reject(error)
    }
  },
)
