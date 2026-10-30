import { Route, Routes } from 'react-router-dom'
import PhotoModal from './components/PhotoModal'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminPhotos from './pages/admin/AdminPhotos'
import AdminUpload from './pages/admin/AdminUpload'
import AdminLogin from './pages/AdminLogin'
import Gallery from './pages/Gallery'

export default function App() {
  return (
    <Routes>
      <Route element={<Gallery />}>
        <Route index element={null} />
        <Route path="photos/:id" element={<PhotoModal />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="photos" element={<AdminPhotos />} />
      </Route>
    </Routes>
  )
}
