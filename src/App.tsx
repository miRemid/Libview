import { Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Gallery from './pages/Gallery'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
