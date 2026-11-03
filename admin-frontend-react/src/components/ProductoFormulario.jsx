import { Link } from 'react-router-dom'
import Campo from './Campo'

export default function ProductoFormulario({
  form,
  errores = {},
  categorias = [],
  marcas = [],
  unidades = [],
  esEdicion = false,
  guardando = false,
  onCambiar,
  onGuardar,
  onLimpiar,
}) {
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
        <h2>Datos generales</h2>
      </div>
      <div className="formulario__seccion">
        <Campo etiqueta="Nombre del producto" obligatorio ancho error={errores.nombre}>
          <input
            className="entrada"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            maxLength={120}
            placeholder="Ej.: Martillo de uña 16 oz"
          />
        </Campo>
        <Campo etiqueta="Código / SKU" obligatorio error={errores.codigo}>
          <input
            className="entrada codigo"
            name="codigo"
            value={form.codigo}
            onChange={cambiar}
            maxLength={50}
            placeholder="Ej.: MART-016"
          />
        </Campo>
        <Campo etiqueta="Marca" obligatorio error={errores.marca}>
          <select className="entrada" name="marca" value={form.marca} onChange={cambiar}>
            <option value="">Selecciona…</option>
            {marcas.map((item) => (
              <option key={item.id_marca} value={item.id_marca}>
                {item.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Categoría" obligatorio error={errores.categoria}>
          <select className="entrada" name="categoria" value={form.categoria} onChange={cambiar}>
            <option value="">Selecciona…</option>
            {categorias.map((item) => (
              <option key={item.id_categoria} value={item.id_categoria}>
                {item.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Unidad de medida" obligatorio error={errores.unidad}>
          <select className="entrada" name="unidad" value={form.unidad} onChange={cambiar}>
            <option value="">Selecciona…</option>
            {unidades.map((item) => (
              <option key={item.id_unidad} value={item.id_unidad}>
                {item.nombre} ({item.abreviatura})
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="tarjeta__cabecera tarjeta__cabecera--interna">
        <h2>Precios y stock</h2>
      </div>
      <div className="formulario__seccion">
        <Campo etiqueta="Precio de venta (incluye IGV)" obligatorio error={errores.precio_venta}>
          <div className="con-prefijo">
            <span>S/</span>
            <input
              className="entrada"
              type="number"
              name="precio_venta"
              value={form.precio_venta}
              onChange={cambiar}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </Campo>
        <Campo etiqueta="Precio de costo" obligatorio error={errores.precio_compra}>
          <div className="con-prefijo">
            <span>S/</span>
            <input
              className="entrada"
              type="number"
              name="precio_compra"
              value={form.precio_compra}
              onChange={cambiar}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </Campo>
        <Campo etiqueta="Stock actual" error={errores.stock}>
          <input
            className="entrada"
            type="number"
            name="stock"
            value={form.stock}
            onChange={cambiar}
            min="0"
            step="0.001"
            placeholder="0"
            disabled
          />
        </Campo>
        <Campo etiqueta="Stock mínimo" error={errores.stock_minimo}>
          <input
            className="entrada"
            type="number"
            name="stock_minimo"
            value={form.stock_minimo}
            onChange={cambiar}
            min="0"
            step="0.001"
            placeholder="0"
          />
        </Campo>
        <Campo etiqueta="Descripción" ancho error={errores.descripcion}>
          <textarea
            className="entrada"
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            maxLength={255}
            rows={3}
            placeholder="Medidas, material o uso"
          />
        </Campo>
      </div>

      <div className="formulario__acciones">
        {!esEdicion && (
          <button type="button" className="boton boton--secundario" onClick={onLimpiar} disabled={guardando}>
            Limpiar
          </button>
        )}
        <Link to="/productos" className="boton boton--secundario">
          Cancelar
        </Link>
        <button type="submit" className="boton boton--principal" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar producto'}
        </button>
      </div>
    </form>
  )
}
