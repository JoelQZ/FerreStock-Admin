import { api } from './cliente'

export async function iniciarSesion(usuario, password) {
  const { data } = await api.post('/auth/login/', { usuario, password })
  return data
}
