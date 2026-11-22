import Aviso from './Aviso'
import Campo from './Campo'

export default function NegocioFormulario({ valores, errores, general, guardando, onCambiar, onGuardar }) {
  function cambiar(evento) {
    onCambiar(evento.target.name, evento.target.value)
  }

  function enviar(evento) {
    evento.preventDefault()
    onGuardar()
  }

  return (
    <form className="tarjeta" onSubmit={enviar} noValidate>
      <div className="tarjeta__cabecera">
        <h2>Datos de la ferretería</h2>
      </div>

      {general && (
        <div className="catalogo__aviso">
          <Aviso tipo="error">{general}</Aviso>
        </div>
      )}

      <div className="formulario__seccion">
        <Campo etiqueta="Nombre comercial" obligatorio error={errores.nombre} ancho>
          <input className="entrada" name="nombre" value={valores.nombre} onChange={cambiar} maxLength={150} />
        </Campo>
        <Campo etiqueta="RUC" error={errores.ruc} ayuda="11 dígitos">
          <input
            className="entrada codigo"
            name="ruc"
            value={valores.ruc}
            onChange={cambiar}
            maxLength={11}
            inputMode="numeric"
          />
        </Campo>
        <Campo etiqueta="Teléfono" error={errores.telefono}>
          <input className="entrada" name="telefono" value={valores.telefono} onChange={cambiar} maxLength={20} />
        </Campo>
        <Campo etiqueta="Dirección" error={errores.direccion} ancho>
          <input className="entrada" name="direccion" value={valores.direccion} onChange={cambiar} maxLength={255} />
        </Campo>
      </div>

      <div className="tarjeta__cabecera tarjeta__cabecera--interna">
        <h2>Ventas y comprobantes</h2>
      </div>
      <div className="formulario__seccion">
        <Campo etiqueta="IGV (%)" obligatorio error={errores.igv_porcentaje} ayuda="Se aplica a cada venta del POS">
          <input
            className="entrada"
            type="number"
            name="igv_porcentaje"
            value={valores.igv_porcentaje}
            onChange={cambiar}
            min="0"
            max="100"
            step="0.01"
          />
        </Campo>
        <Campo etiqueta="Impresora de tickets" error={errores.impresora}>
          <input
            className="entrada"
            name="impresora"
            value={valores.impresora}
            onChange={cambiar}
            maxLength={100}
            placeholder="Ej. EPSON TM-T20"
          />
        </Campo>
      </div>

      <div className="formulario__acciones">
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
