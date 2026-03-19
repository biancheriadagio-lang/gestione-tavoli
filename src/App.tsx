import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import DashboardApp from './DashboardApp'
import UserManagement from './UserManagement'

type Ruolo = 'super_admin' | 'admin' | 'staff' | 'viewer'

interface Profilo {
  id: string
  email: string
  nome: string
  ruolo: Ruolo
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'dashboard' | 'utenti'>('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        await caricaProfilo(data.session.user.id)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        await caricaProfilo(session.user.id)
      } else {
        setProfilo(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const caricaProfilo = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error(error)
      return
    }

    setProfilo(data as Profilo)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setProfilo(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Caricamento...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (!profilo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Caricamento profilo...
      </div>
    )
  }

  if (profilo.ruolo === 'viewer') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Accesso in attesa</h1>
          <p className="text-gray-600 mb-4">
            Il tuo account è registrato ma non ha ancora i permessi operativi.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Chiedi al super admin di abilitarti.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Esci
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Pannello amministrazione</h1>
            <div className="text-sm text-gray-600">
              {profilo.email} · ruolo: <span className="font-semibold">{profilo.ruolo}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVista('dashboard')}
              className={`px-4 py-2 rounded-lg ${
                vista === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Gestionale
            </button>

            {profilo.ruolo === 'super_admin' && (
              <button
                onClick={() => setVista('utenti')}
                className={`px-4 py-2 rounded-lg ${
                  vista === 'utenti'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Utenti e permessi
              </button>
            )}

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {vista === 'dashboard' && <DashboardApp />}
        {vista === 'utenti' && profilo.ruolo === 'super_admin' && <UserManagement />}
      </div>
    </div>
  )
}