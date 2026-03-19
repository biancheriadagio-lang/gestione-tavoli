import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Ruolo = 'super_admin' | 'admin' | 'staff' | 'viewer'

interface Profilo {
  id: string
  email: string
  nome: string
  ruolo: Ruolo
}

export default function UserManagement() {
  const [utenti, setUtenti] = useState<Profilo[]>([])
  const [loading, setLoading] = useState(true)

  const caricaUtenti = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('creato_il', { ascending: true })

    if (error) {
      alert(`Errore caricamento utenti: ${error.message}`)
      setLoading(false)
      return
    }

    setUtenti((data || []) as Profilo[])
    setLoading(false)
  }

  useEffect(() => {
    caricaUtenti()
  }, [])

  const cambiaRuolo = async (id: string, ruolo: Ruolo) => {
    const { error } = await supabase
      .from('profiles')
      .update({ ruolo })
      .eq('id', id)

    if (error) {
      alert(`Errore aggiornamento ruolo: ${error.message}`)
      return
    }

    setUtenti((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ruolo } : u))
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-2xl font-bold mb-4">Gestione utenti</h2>

      {loading ? (
        <div>Caricamento utenti...</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Email</th>
                <th className="py-2">Nome</th>
                <th className="py-2">Ruolo</th>
              </tr>
            </thead>
            <tbody>
              {utenti.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2">{u.email || '-'}</td>
                  <td className="py-2">{u.nome || '-'}</td>
                  <td className="py-2">
                    <select
                      value={u.ruolo}
                      onChange={(e) =>
                        cambiaRuolo(u.id, e.target.value as Ruolo)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="super_admin">super_admin</option>
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}