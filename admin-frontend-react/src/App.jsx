import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import LayoutAdmin from './layouts/LayoutAdmin'
import Catalogos from './pages/Catalogos'
import EnConstruccion from './pages/EnConstruccion'
import Login from './pages/Login'
import ProductoForm from './pages/ProductoForm'
import Productos from './pages/Productos'
import Reportes from './pages/Reportes'
import RutaPrivada from './routes/RutaPrivada'
import { SECCIONES_PENDIENTES } from './utils/menu'

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
              <Route path="productos/:id/editar" element={<ProductoForm key="editar" />} />
              <Route path="catalogos" element={<Catalogos />} />
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
