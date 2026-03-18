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
      alert(`Errore caricamento tavoli: ${tavoliError.message}`)
    }

    if (prenError) {
      console.error('Errore caricamento prenotazioni:', prenError)
      alert(`Errore caricamento prenotazioni: ${prenError.message}`)
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
          tavoloIds: p.tavolo_ids || [],
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

    const { error } = await supabase.from('tavoli').upsert(rows)

    if (error) {
      console.error('Errore salvataggio tavoli iniziali:', error)
      alert(`Errore salvataggio tavoli iniziali: ${error.message}`)
    }
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

    setTavoli((prev) => [...prev, nuovoTavolo])

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
      console.error('Errore inserimento tavolo:', error)
      alert(`Errore inserimento tavolo: ${error.message}`)
      setTavoli((prev) => prev.filter((t) => t.id !== nuovoId))
    }
  }

  const handleUpdateTavolo = async (id: number, updates: Partial<Tavolo>) => {
  const snapshot = [...tavoli]

  const updatesPuliti: Partial<Tavolo> = {
    ...updates,
    ...(updates.x !== undefined ? { x: Math.round(updates.x) } : {}),
    ...(updates.y !== undefined ? { y: Math.round(updates.y) } : {}),
    ...(updates.width !== undefined ? { width: Math.round(updates.width) } : {}),
    ...(updates.height !== undefined ? { height: Math.round(updates.height) } : {}),
  }

  setTavoli((prev) =>
    prev.map((t) => (t.id === id ? { ...t, ...updatesPuliti } : t))
  )

  const { error } = await supabase
    .from('tavoli')
    .update({
      ...(updatesPuliti.nome !== undefined ? { nome: updatesPuliti.nome } : {}),
      ...(updatesPuliti.posti !== undefined ? { posti: updatesPuliti.posti } : {}),
      ...(updatesPuliti.sala !== undefined ? { sala: updatesPuliti.sala } : {}),
      ...(updatesPuliti.stato !== undefined ? { stato: updatesPuliti.stato } : {}),
      ...(updatesPuliti.forma !== undefined ? { forma: updatesPuliti.forma } : {}),
      ...(updatesPuliti.x !== undefined ? { x: updatesPuliti.x } : {}),
      ...(updatesPuliti.y !== undefined ? { y: updatesPuliti.y } : {}),
      ...(updatesPuliti.width !== undefined ? { width: updatesPuliti.width } : {}),
      ...(updatesPuliti.height !== undefined ? { height: updatesPuliti.height } : {}),
    })
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento tavolo:', error)
    alert(`Errore aggiornamento tavolo: ${error.message}`)
    setTavoli(snapshot)
  }
}  


  const handleDeleteTavolo = async (id: number) => {
    const snapshotTavoli = [...tavoli]
    const snapshotPrenotazioni = [...prenotazioni]

    setTavoli((prev) => prev.filter((t) => t.id !== id))
    setPrenotazioni((prev) => prev.filter((p) => !p.tavoloIds.includes(id)))

    const { error } = await supabase.from('tavoli').delete().eq('id', id)

    if (error) {
      console.error('Errore cancellazione tavolo:', error)
      alert(`Errore cancellazione tavolo: ${error.message}`)
      setTavoli(snapshotTavoli)
      setPrenotazioni(snapshotPrenotazioni)
    }
  }

  const handleAddPrenotazione = async (prenotazione: Omit<Prenotazione, 'id'>) => {
    const nuova: Prenotazione = {
      id: Date.now(),
      ...prenotazione,
    }

    setPrenotazioni((prev) => [...prev, nuova])

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
      console.error('Errore inserimento prenotazione:', error)
      alert(`Errore inserimento prenotazione: ${error.message}`)
      setPrenotazioni((prev) => prev.filter((p) => p.id !== nuova.id))
      return
    }

    for (const tavoloId of prenotazione.tavoloIds) {
      await handleUpdateTavolo(tavoloId, { stato: 'prenotato' })
    }
  }

  const handleResetDati = async () => {
    const conferma = window.confirm(
      'Vuoi cancellare tutti i tavoli e tutte le prenotazioni dal database?'
    )

    if (!conferma) return

    const { error: errorPren } = await supabase
      .from('prenotazioni')
      .delete()
      .neq('id', 0)

    const { error: errorTav } = await supabase
      .from('tavoli')
      .delete()
      .neq('id', 0)

    if (errorPren) {
      console.error('Errore reset prenotazioni:', errorPren)
      alert(`Errore reset prenotazioni: ${errorPren.message}`)
      return
    }

    if (errorTav) {
      console.error('Errore reset tavoli:', errorTav)
      alert(`Errore reset tavoli: ${errorTav.message}`)
      return
    }

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