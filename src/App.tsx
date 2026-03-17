import { useEffect, useState } from 'react'
import Tavoli from './components/Tavoli'
import { supabase } from './supabase'

export type Sala = 'SALA SUD' | 'SALA NORD' | 'SALA ESTERNA'
export type StatoTavolo = 'libero' | 'prenotato' | 'occupato'
export type FormaTavolo = 'quadrato' | 'rettangolare'

export interface Tavolo {
  id: number
  nome: string
  posti: number
  sala: Sala
  stato: StatoTavolo
  forma: FormaTavolo
  x: number
  y: number
  width: number
  height: number
}

export interface Prenotazione {
  id: number
  tavoloIds: number[]
  nomeCliente: string
  telefono: string
  persone: number
  celiache: number
  data: string
  ora: string
  note: string
  sala: Sala
}

const tavoliIniziali: Tavolo[] = [
  {
    id: 1,
    nome: 'T1',
    posti: 4,
    sala: 'SALA NORD',
    stato: 'libero',
    forma: 'quadrato',
    x: 40,
    y: 40,
    width: 90,
    height: 90,
  },
  {
    id: 2,
    nome: 'T2',
    posti: 2,
    sala: 'SALA NORD',
    stato: 'libero',
    forma: 'quadrato',
    x: 150,
    y: 40,
    width: 90,
    height: 90,
  },
  {
    id: 3,
    nome: 'T3',
    posti: 6,
    sala: 'SALA SUD',
    stato: 'libero',
    forma: 'rettangolare',
    x: 60,
    y: 120,
    width: 140,
    height: 90,
  },
  {
    id: 4,
    nome: 'T4',
    posti: 4,
    sala: 'SALA ESTERNA',
    stato: 'libero',
    forma: 'rettangolare',
    x: 80,
    y: 80,
    width: 140,
    height: 90,
  },
]

export default function App() {
  const [tavoli, setTavoli] = useState<Tavolo[]>([])
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [salaAttiva, setSalaAttiva] = useState<Sala>('SALA NORD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    caricaDati()
  }, [])

  const caricaDati = async () => {
    setLoading(true)

    const { data: tavoliData, error: tavoliError } = await supabase
      .from('tavoli')
      .select('*')
      .order('id', { ascending: true })

    const { data: prenData, error: prenError } = await supabase
      .from('prenotazioni')
      .select('*')
      .order('id', { ascending: true })

    if (tavoliError) {
      console.error('Errore caricamento tavoli:', tavoliError)
    }

    if (prenError) {
      console.error('Errore caricamento prenotazioni:', prenError)
    }

    if (tavoliData && tavoliData.length > 0) {
      setTavoli(
        tavoliData.map((t: any) => ({
          id: Number(t.id),
          nome: t.nome,
          posti: t.posti,
          sala: t.sala,
          stato: t.stato,
          forma: t.forma,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
        }))
      )
    } else {
      setTavoli(tavoliIniziali)
      await salvaTavoliIniziali()
    }

    if (prenData) {
      setPrenotazioni(
        prenData.map((p: any) => ({
          id: Number(p.id),
          tavoloIds: p.tavolo_ids,
          nomeCliente: p.nome_cliente,
          telefono: p.telefono || '',
          persone: p.persone,
          celiache: p.celiache,
          data: p.data,
          ora: p.ora,
          note: p.note || '',
          sala: p.sala,
        }))
      )
    }

    setLoading(false)
  }

  const salvaTavoliIniziali = async () => {
    const rows = tavoliIniziali.map((t) => ({
      id: t.id,
      nome: t.nome,
      posti: t.posti,
      sala: t.sala,
      stato: t.stato,
      forma: t.forma,
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
    }))

    await supabase.from('tavoli').upsert(rows)
  }

  const handleAddTavolo = async (sala: Sala) => {
    const nuovoId = Date.now()
    const numero = tavoli.length + 1

    const nuovoTavolo: Tavolo = {
      id: nuovoId,
      nome: `T${numero}`,
      posti: 4,
      sala,
      stato: 'libero',
      forma: 'quadrato',
      x: 40,
      y: 40,
      width: 90,
      height: 90,
    }

    const { error } = await supabase.from('tavoli').insert({
      id: nuovoTavolo.id,
      nome: nuovoTavolo.nome,
      posti: nuovoTavolo.posti,
      sala: nuovoTavolo.sala,
      stato: nuovoTavolo.stato,
      forma: nuovoTavolo.forma,
      x: nuovoTavolo.x,
      y: nuovoTavolo.y,
      width: nuovoTavolo.width,
      height: nuovoTavolo.height,
    })

    if (error) {
      console.error(error)
      return
    }

    setTavoli((prev) => [...prev, nuovoTavolo])
  }

  const handleUpdateTavolo = async (id: number, updates: Partial<Tavolo>) => {
    const { error } = await supabase
      .from('tavoli')
      .update({
        ...(updates.nome !== undefined ? { nome: updates.nome } : {}),
        ...(updates.posti !== undefined ? { posti: updates.posti } : {}),
        ...(updates.sala !== undefined ? { sala: updates.sala } : {}),
        ...(updates.stato !== undefined ? { stato: updates.stato } : {}),
        ...(updates.forma !== undefined ? { forma: updates.forma } : {}),
        ...(updates.x !== undefined ? { x: updates.x } : {}),
        ...(updates.y !== undefined ? { y: updates.y } : {}),
        ...(updates.width !== undefined ? { width: updates.width } : {}),
        ...(updates.height !== undefined ? { height: updates.height } : {}),
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      return
    }

    setTavoli((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const handleDeleteTavolo = async (id: number) => {
    const { error } = await supabase.from('tavoli').delete().eq('id', id)

    if (error) {
      console.error(error)
      return
    }

    setTavoli((prev) => prev.filter((t) => t.id !== id))
    setPrenotazioni((prev) => prev.filter((p) => !p.tavoloIds.includes(id)))
  }

  const handleAddPrenotazione = async (prenotazione: Omit<Prenotazione, 'id'>) => {
    const nuova: Prenotazione = {
      id: Date.now(),
      ...prenotazione,
    }

    const { error } = await supabase.from('prenotazioni').insert({
      id: nuova.id,
      tavolo_ids: nuova.tavoloIds,
      nome_cliente: nuova.nomeCliente,
      telefono: nuova.telefono || '',
      persone: nuova.persone,
      celiache: nuova.celiache,
      data: nuova.data,
      ora: nuova.ora,
      note: nuova.note || '',
      sala: nuova.sala,
    })

    if (error) {
      console.error(error)
      return
    }

    setPrenotazioni((prev) => [...prev, nuova])

    for (const tavoloId of prenotazione.tavoloIds) {
      await handleUpdateTavolo(tavoloId, { stato: 'prenotato' })
    }
  }

  const handleResetDati = async () => {
    const conferma = window.confirm(
      'Vuoi cancellare tutti i tavoli e tutte le prenotazioni dal database?'
    )

    if (!conferma) return

    await supabase.from('prenotazioni').delete().neq('id', 0)
    await supabase.from('tavoli').delete().neq('id', 0)

    setTavoli([])
    setPrenotazioni([])

    await salvaTavoliIniziali()
    await caricaDati()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Caricamento dati...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-[1400px] mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestione Tavoli Ristorante
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Database sincronizzato tra PC e cellulare
            </p>
          </div>

          <button
            onClick={handleResetDati}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Reset database
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <Tavoli
          tavoli={tavoli}
          prenotazioni={prenotazioni}
          salaAttiva={salaAttiva}
          onChangeSala={setSalaAttiva}
          onAddTavolo={handleAddTavolo}
          onUpdateTavolo={handleUpdateTavolo}
          onDeleteTavolo={handleDeleteTavolo}
          onAddPrenotazione={handleAddPrenotazione}
        />
      </main>
    </div>
  )
}