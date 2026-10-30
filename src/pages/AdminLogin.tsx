import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { login } from '../lib/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch {
      setError('登录失败，请检查邮箱和密码。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-5">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-line bg-paper p-8 shadow-[0_20px_80px_rgba(0,0,0,0.04)]">
        <Link to="/" className="inline-block text-ink">
          <Logo />
        </Link>
        <h1 className="mt-8 font-serif text-3xl text-ink">管理登录</h1>
        <p className="mt-2 text-sm text-mute">上传新图、查看已保存的相机参数。</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mute">
              邮箱
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none transition focus:border-ink"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mute">
              密码
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none transition focus:border-ink"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-3 text-sm text-white disabled:opacity-60"
          >
            {loading ? '登录中…' : '进入管理页'}
          </button>
        </form>
      </div>
    </div>
  )
}
