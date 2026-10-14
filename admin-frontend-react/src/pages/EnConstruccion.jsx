import Encabezado from '../components/Encabezado'
import Icono from '../components/Icono'

export default function EnConstruccion({ kicker, titulo, descripcion }) {
  return (
    <>
      <Encabezado kicker={kicker} titulo={titulo} subtitulo={descripcion} />
      <main className="contenido">
        <div className="tarjeta vacio">
          <Icono nombre="tuerca" tamano={40} />
          <h2>Próximamente</h2>
          <p>Esta sección estará disponible pronto.</p>
        </div>
      </main>
    </>
  )
}
