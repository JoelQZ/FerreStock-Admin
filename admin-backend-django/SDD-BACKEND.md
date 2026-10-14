# Documento de Diseño del Sistema (SDD) — Backend Django REST

## 1. Arquitectura del Backend
* **Lenguaje & Framework:** Python + Django 5.x
* **API Framework:** Django REST Framework (DRF)
* **Autenticación:** JSON Web Tokens (SimpleJWT)
* **Base de Datos:** MySQL 8.0 (20 tablas relacionables)
* **Manejo de CORS:** `django-cors-headers`

---

## 2. Estructura de Módulos (Apps)

El backend se organiza en la carpeta `apps/` con 7 aplicaciones modulares:

```text
admin-backend-django/apps/
├── usuarios/       # Roles, Usuarios, Autenticación JWT
├── catalogo/       # Categorías, Marcas, Unidades, Productos
├── inventario/     # Proveedores, Ingresos, Detalle Ingreso, Kárdex (Movimiento Inventario)
├── ventas/         # Clientes, Comprobantes, Métodos Pago, Ventas, Detalles, Pagos
├── caja/           # Turnos, Movimientos de Caja
├── configuracion/  # Datos del Negocio
└── ia/             # Predicción de Reposición
```

---

## 3. Modelo de Datos Backend (20 Tablas)

### 3.1. Distribución de Entidades por App

| App Django | Tabla | Descripción Técnica |
| :--- | :--- | :--- |
| **`usuarios`** | `rol` | Roles del sistema (`ADMINISTRADOR`, `CAJERO`, `DUENO`). |
| | `usuario` | Usuario personalizado (`AbstractBaseUser`), clave hasheada. |
| **`catalogo`** | `categoria` | Clasificación de productos. |
| | `marca` | Marcas registradas de insumos/herramientas. |
| | `unidad_medida` | Unidades de venta (metro, kilogramo, unidad, caja). |
| | `producto` | Registro maestro, precios, stock y límites. |
| **`inventario`** | `proveedor` | Proveedores con RUC y datos de contacto. |
| | `ingreso` | Cabecera de compra/ingreso de mercadería. |
| | `detalle_ingreso` | Ítems, cantidades y costo unitario de compra. |
| | `movimiento_inventario` | Kárdex del sistema (entradas, salidas, ajustes). |
| **`ventas`** | `cliente` | Clientes con DNI/RUC para emisión de comprobantes. |
| | `tipo_comprobante` | Tipos de documentos (Boleta, Factura) y series. |
| | `metodo_pago` | Formas de pago aceptadas (Efectivo, Yape, Plin). |
| | `venta` | Cabecera de la transacción de venta. |
| | `detalle_venta` | Productos vendidos con precio histórico del momento. |
| | `pago` | Registro de pagos asociados a la venta (soporta pagos mixtos). |
| **`caja`** | `turno` | Control de apertura y cierre de caja por cajero. |
| | `movimiento_caja` | Inyecciones y retiros manuales de dinero en efectivo. |
| **`configuracion`** | `negocio` | Datos fiscales, RUC, dirección y tasa de IGV. |
| **`ia`** | `prediccion_reposicion` | Cálculos de demanda estimada y alertas de stock. |

---

### 3.2. Relaciones ORM y Claves Foráneas

* **`rol`** (1:N) **`usuario`** (`on_delete=PROTECT`)
* **`categoria` / `marca` / `unidad_medida`** (1:N) **`producto`** (`on_delete=PROTECT`)
* **`proveedor`** (1:N) **`ingreso`** (1:N) **`detalle_ingreso`**
* **`producto`** (1:N) **`detalle_ingreso`**, **`detalle_venta`**, **`movimiento_inventario`**, **`prediccion_reposicion`**
* **`usuario`** (1:N) **`ingreso`**, **`turno`**, **`venta`**, **`movimiento_inventario`**, **`movimiento_caja`**
* **`turno`** (1:N) **`venta`**, **`movimiento_caja`**
* **`cliente`**, **`tipo_comprobante`** (1:N) **`venta`**
* **`venta`** (1:N) **`detalle_venta`**, **`pago`**, **`movimiento_inventario`**
* **`metodo_pago`** (1:N) **`pago`**

---

## 4. ESPECIFICACIÓN DE ENDPOINTS DE LA API REST

### 4.1. App: `usuarios` (`/api/auth/`)
* **`POST /api/auth/login/`**
  * **Payload:** `{"usuario": "...", "password": "..."}`
  * **Respuesta:** Tokens JWT (`access`, `refresh`).
* **`POST /api/auth/refresh/`**
  * **Payload:** `{"refresh": "..."}`
* **`GET /api/auth/yo/`**
  * **Respuesta:** Datos del usuario autenticado (id, nombre, usuario, rol).

### 4.2. App: `catalogo` (`/api/catalogo/`)
* **`GET / POST /api/catalogo/categorias/`**
* **`GET / PUT / PATCH / DELETE /api/catalogo/categorias/{id}/`**
* **`GET / POST /api/catalogo/marcas/`**
* **`GET / PUT / PATCH / DELETE /api/catalogo/marcas/{id}/`**
* **`GET /api/catalogo/unidades/`** *(ReadOnlyViewSet)*
* **`GET / POST /api/catalogo/productos/`**
  * **Query Params:**
    * `?categoria=<id>` : Filtra por categoría.
    * `?buscar=<texto>` : Búsqueda parcial por código o nombre.
    * `?todos=1` : Incluye registros deshabilitados.
* **`GET / PUT / PATCH / DELETE /api/catalogo/productos/{id}/`**

### 4.3. App: `inventario` (`/api/inventario/`)
* **`GET / POST /api/inventario/proveedores/`**
* **`GET / POST /api/inventario/ingresos/`**
  * **Acción:** Registra la compra, aumenta el stock de `producto` y genera la entrada en `movimiento_inventario`.
* **`GET /api/inventario/kardex/`**
  * **Respuesta:** Lista de movimientos de inventario (`movimiento_inventario`).

### 4.4. App: `ventas` (`/api/ventas/`)
* **`GET / POST /api/ventas/clientes/`**
* **`GET / POST /api/ventas/ventas/`**
  * **Acción:** Procesa la venta, verifica turno abierto en `caja`, descuenta el stock en `producto` y registra la salida en `movimiento_inventario`.
* **`POST /api/ventas/ventas/{id}/anular/`**
  * **Acción:** Cambia estado de la venta y revierte el stock devuelto en el inventario.

### 4.5. App: `caja` (`/api/caja/`)
* **`POST /api/caja/turnos/abrir/`**
  * **Payload:** `{"monto_inicial": 100.00}`
* **`POST /api/caja/turnos/cerrar/`**
  * **Payload:** `{"monto_real": 500.00}` (Calcula descuadre o diferencia automáticamente).
* **`GET / POST /api/caja/movimientos/`**
  * **Acción:** Registra ingresos/egresos manuales de caja chica durante el turno.

### 4.6. Apps: `configuracion` & `ia`
* **`GET / PUT /api/configuracion/negocio/`**
  * **Acción:** Obtención y actualización de datos generales de la empresa y porcentaje de IGV.
* **`GET /api/ia/predicciones/`**
  * **Respuesta:** Listado de predicciones de agotamiento de stock y sugerencias de compra.

---

## 5. Reglas de Negocio Backend

1. **Precisión Decimal en Unidades de Medida:** Los campos `stock`, `stock_minimo` y `cantidad` se gestionan como `DECIMAL(10, 3)` para admitir fraccionamiento (ventas por metro, kilo o galón).
2. **Estrategia de Borrado Lógico (Soft Delete):** Las eliminaciones (`DELETE`) en catálogos y productos no remueven físicamente las filas de la base de datos, sino que cambian su campo de control a `estado = False` (`0`).
3. **Restricción de Autenticación:** Únicamente los usuarios con `estado = True` pueden autenticarse y generar un token JWT.