import { useState } from 'react'
import { supabase } from './supabase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrore('')
    setMessaggio('')
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
            },
          },
        })

        if (error) throw error

        setMessaggio('Registrazione completata. Ora puoi accedere.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      }
    } catch (err: any) {
      setErrore(err.message || 'Errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignup ? 'Registrazione' : 'Login amministrazione'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          {errore && (
            <div className="text-red-600 text-sm">{errore}</div>
          )}

          {messaggio && (
            <div className="text-green-600 text-sm">{messaggio}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Attendere...' : isSignup ? 'Registrati' : 'Entra'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup(!isSignup)
            setErrore('')
            setMessaggio('')
          }}
          className="w-full mt-4 text-sm text-blue-600"
        >
          {isSignup
            ? 'Hai già un account? Accedi'
            : 'Non hai un account? Registrati'}
        </button>
      </div>
    </div>
  )
}