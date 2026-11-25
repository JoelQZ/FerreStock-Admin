import PaginaAviso from '../components/PaginaAviso'

export default function NoEncontrado() {
  return (
    <PaginaAviso
      kicker="Error"
      codigo="404"
      titulo="Página no encontrada"
      mensaje="La dirección que escribiste no existe en el panel."
    />
  )
}
