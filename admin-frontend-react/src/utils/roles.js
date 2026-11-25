export const ROLES_PANEL = ['ADMINISTRADOR']

export const NOMBRE_ROL = {
  ADMINISTRADOR: 'Admin',
  CAJERO: 'Cajero',
}

export function tieneRol(usuario, roles) {
  return Boolean(usuario?.rol) && roles.includes(usuario.rol)
}

export function esAdministrador(usuario) {
  return tieneRol(usuario, ['ADMINISTRADOR'])
}
