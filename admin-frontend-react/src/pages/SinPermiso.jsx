import PaginaAviso from '../components/PaginaAviso'

export default function SinPermiso() {
  return (
    <PaginaAviso
      kicker="Acceso restringido"
      codigo="403"
      titulo="Sin permiso"
      mensaje="Tu rol no tiene acceso a esta sección del panel."
    />
  )
}
