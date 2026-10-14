export function erroresDeApi(error) {
  if (!error?.response) {
    return {
      general: 'No hay conexión con el servidor. Verifica que Django esté encendido.',
      campos: {},
    }
  }

  const datos = error.response.data
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return { general: 'Ocurrió un error inesperado en el servidor.', campos: {} }
  }

  const campos = {}
  let general = ''
  for (const [campo, mensajes] of Object.entries(datos)) {
    const texto = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)
    if (campo === 'detail' || campo === 'non_field_errors') general = texto
    else campos[campo] = texto
  }
  return { general, campos }
}
