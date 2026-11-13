# FerreStock · Panel de administración (React)

Panel web del **administrador y del dueño** de la ferretería: catálogo de productos, reportes de ventas y, en las próximas semanas, inventario, usuarios, configuración y predicción de reposición.
Consume la API REST de Django (`admin-backend-django`) con Axios y JWT.

Curso: Desarrollo de Aplicaciones Empresariales · Tecsup 2026-2.

## Cómo ejecutarlo

Requisitos: Node.js 24 LTS y el backend Django encendido en `http://127.0.0.1:8000`.

```bash
npm install
npm run dev
```

Abrir **http://localhost:5173**. La URL de la API se configura en `.env` (ver `.env.example`):

```
VITE_API_URL=http://127.0.0.1:8000/api
```

> Si el puerto 5173 está ocupado por otro proyecto, Vite usa 5174 o 5175. Django solo acepta los orígenes de `CORS_ALLOWED_ORIGINS`, así que el login fallará con "No hay conexión con el servidor". Libera el 5173 o agrega el nuevo puerto en el `.env` de Django.

Otros comandos: `npm run lint` (revisión de código) y `npm run build` (versión de producción en `dist/`).

## Estructura

```
src/
├── main.jsx              ← punto de entrada
├── App.jsx               ← rutas (React Router)
├── api/                  ← llamadas a Django con Axios (cliente con JWT y refresh)
├── context/              ← sesión del usuario (AuthContext + useAuth)
├── routes/RutaPrivada    ← protege las páginas si no hay sesión
├── layouts/LayoutAdmin   ← barra lateral + contenido
├── pages/                ← una página por ruta
├── components/           ← componentes reutilizables
├── utils/                ← formato, errores de la API, menú, reportes
└── styles/global.css     ← estilo "acero y madera"
```

## Componentes

| Componente | Qué hace | Semana |
|---|---|---|
| `Tarjeta` | Contenedor con título opcional y `children` (equivale a `{% block %}` de Django) | 10 |
| `Kpi` | Indicador con etiqueta, valor y `alerta = false` por defecto | 10 |
| `ProductoFila` | Un producto: código, nombre, precio, stock, estado y los botones Editar (`onEditar`) y Desactivar/Reactivar (`onCambiarEstado`) | 10 · 11 |
| `ProductoTabla` | Lista de productos con `map()` y `key`; reenvía `onEditar` y `onCambiarEstado` | 10 · 11 |
| `ResumenProductos` | Hermano del listado: productos en la lista y con stock bajo, calculados sin `useState` | 11 |
| `VentaFila` | Una venta con botón **Ver productos** (`useState`) y sus detalles anidados | 10 |
| `DetalleVentaItem` | Un producto vendido dentro de la venta (relación 1:N) | 10 |
| `VentasTabla` | Lista de ventas con `map()`, `key` y `limite = 15` | 10 |
| `Buscador` | Campo controlado; el texto vive en el padre y avisa con `onCambiar` | 10 · 11 |
| `ProductoFormulario` | Formulario controlado; avisa al padre con `onCambiar`, `onGuardar` y `onLimpiar` | 10 · 11 |
| `VistaPreviaProducto` | Hermano del formulario: muestra precio, IGV y ganancia como estado derivado | 11 |
| `Encabezado` | Título de la página, usuario del Context y `useEffect` para el título de la pestaña | 10 · 11 |
| `Aviso` | Mensaje de éxito o error con callback `alCerrar` | 10 · 11 |
| `Campo` | Etiqueta, error y ayuda alrededor de un input (`children`) | 10 |
| `EtiquetaStock` | Muestra "Agotado", "Bajo" o la cantidad | 10 |
| `Icono` | Íconos SVG con `tamano = 18` por defecto | 10 |
| `BarraLateral` | Menú con `NavLink` y cierre de sesión | 9 · 13 |

## Pantalla de Productos

La página `pages/Productos.jsx` es el componente padre del panel: guarda en su estado la lista de productos que llega de la API, el texto de búsqueda, la categoría elegida y el aviso.

```
Productos (padre)
├── ResumenProductos   ⬇ productos
├── Buscador           ⬇ valor        ⬆ onCambiar(texto)
└── ProductoTabla      ⬇ productos    ⬆ onEditar, onCambiarEstado
    └── ProductoFila   ⬇ producto     ⬆ onEditar(producto), onCambiarEstado(producto)

ProductoForm (padre del alta y la edición)
├── ProductoFormulario    ⬇ form, errores   ⬆ onCambiar, onGuardar, onLimpiar
└── VistaPreviaProducto   ⬇ form
```

- **Bajan por props:** la lista de productos, el texto del buscador, el formulario y sus errores.
- **Suben por funciones:** editar, desactivar o reactivar un producto, escribir en el buscador y guardar el formulario.
- Al desactivar o reactivar, el padre actualiza la lista con `filter()` o `map()`, sin `push` ni `splice`.
- El formulario valida lo mismo que la API (código obligatorio y precio de venta mayor que cero) antes de enviar.
- `useEffect` con limpieza: el aviso de éxito se oculta a los 4 segundos y la búsqueda espera 300 ms después de escribir.

## Laboratorio 11 · Práctica

Los ejercicios de la Parte 1 (mini catálogo con carrito de una cafetería) están en `src/practica` y se abren en **http://localhost:5173/practica**, sin login y fuera del menú del panel.

## Avance por semana

| Semana | Tema | Dónde se aplica | Estado |
|---|---|---|---|
| 8 | API REST con Django REST Framework | `admin-backend-django` | ✅ |
| 9 | Introducción a React | Proyecto Vite, JSX, listas y condicionales | ✅ |
| 10 | Componentes y eventos | `components/`: props, `children`, valores por defecto, `map` + `key`, relación 1:N (`VentaFila` → `DetalleVentaItem`), botón con `useState`, buscador controlado en Reportes, formulario con `onSubmit` y validación | ✅ |
| 11 | Comunicación entre componentes | Callbacks (`onCambiarEstado`, `onCambiar`, `onGuardar`), estado elevado (`Productos` → `Buscador` + `ProductoTabla`; `ProductoForm` → `ProductoFormulario` + `VistaPreviaProducto`), estado derivado, Context de sesión, `useEffect` con limpieza (aviso que se oculta, búsqueda con espera) | ✅ |
| 12 | Servicios web con Axios | Productos y Reportes conectados. Pendiente: Inventario, Usuarios, Configuración y Predicción IA | 🟡 |
| 13 | Estructura de la app de comercio electrónico | Rutas, layout y rutas privadas listos. Pendiente: estructura del ingreso de mercadería | 🟡 |
| 14 | Componentes de la app de comercio electrónico | Ingreso de mercadería tipo carrito | ⏳ |
| 15 | Seguridad | JWT, refresh y bloqueo del cajero listos. Pendiente: menú por rol y error 403 | 🟡 |
| 16 | Pagos en línea | Los pagos (Efectivo, Yape, Plin) se registran en el POS, no en el Admin | — |

Las secciones pendientes ya tienen su ruta en el menú y muestran "Próximamente" (`pages/EnConstruccion.jsx`).

## Qué falta para guardar en Django

Las props y el estado solo viven en el navegador: si se recarga la página, se pierden. Para que un dato quede guardado hay que enviarlo a la API con Axios (`api/`), y Django lo valida otra vez y lo escribe en MySQL. Productos ya lo hace con `crearProducto` y `actualizarProducto`. Las demás secciones lo harán en la Semana 12.
