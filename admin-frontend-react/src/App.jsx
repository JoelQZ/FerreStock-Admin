import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import LayoutAdmin from './layouts/LayoutAdmin'
import EnConstruccion from './pages/EnConstruccion'
import Login from './pages/Login'
import ProductoForm from './pages/ProductoForm'
import Productos from './pages/Productos'
import Reportes from './pages/Reportes'
import RutaPrivada from './routes/RutaPrivada'
import { SECCIONES_PENDIENTES } from './utils/menu'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaPrivada />}>
            <Route element={<LayoutAdmin />}>
              <Route index element={<Navigate to="/productos" replace />} />
              <Route path="productos" element={<Productos />} />
              <Route path="productos/nuevo" element={<ProductoForm key="nuevo" />} />
              <Route path="productos/:id/editar" element={<ProductoForm key="editar" />} />
              <Route path="reportes" element={<Reportes />} />
              {SECCIONES_PENDIENTES.map((seccion) => (
                <Route key={seccion.ruta} path={seccion.ruta} element={<EnConstruccion {...seccion} />} />
              ))}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
