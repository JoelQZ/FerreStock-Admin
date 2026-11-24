import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import LayoutAdmin from './layouts/LayoutAdmin'
import Catalogos from './pages/Catalogos'
import Configuracion from './pages/Configuracion'
import Inventario from './pages/Inventario'
import Login from './pages/Login'
import Prediccion from './pages/Prediccion'
import ProductoDetalle from './pages/ProductoDetalle'
import ProductoForm from './pages/ProductoForm'
import Productos from './pages/Productos'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import RutaPrivada from './routes/RutaPrivada'

import ListaPractica from './practica/ListaPractica'
import Practica from './practica/Practica'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/practica" element={<ListaPractica />} />
          <Route path="/practica/lab11" element={<Practica />} />

          <Route element={<RutaPrivada />}>
            <Route element={<LayoutAdmin />}>
              <Route index element={<Navigate to="/productos" replace />} />
              <Route path="productos" element={<Productos />} />
              <Route path="productos/nuevo" element={<ProductoForm key="nuevo" />} />
              <Route path="productos/:id" element={<ProductoDetalle />} />
              <Route path="productos/:id/editar" element={<ProductoForm key="editar" />} />
              <Route path="catalogos" element={<Catalogos />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="prediccion" element={<Prediccion />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
