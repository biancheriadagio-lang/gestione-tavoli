import { useMemo, useState } from 'react'
import { Rnd } from 'react-rnd'
import type {
  Sala,
  Tavolo,
  FormaTavolo,
  StatoTavolo,
  Prenotazione,
  PrenotazioneInput,
} from '../DashboardApp'

interface TavoliProps {
  tavoli: Tavolo[]
  prenotazioni: Prenotazione[]
  salaAttiva: Sala
  onChangeSala: (sala: Sala) => void
  onAddTavolo: (sala: Sala) => void
  onUpdateTavolo: (id: number, updates: Partial<Tavolo>) => void
  onDeleteTavolo: (id: number) => void
  onAddPrenotazione: (prenotazione: PrenotazioneInput) => void
}

const sale: Sala[] = ['SALA NORD', 'SALA SUD', 'SALA ESTERNA']
const SOGLIA_VICINANZA = 170

function Tavoli({
  tavoli,
  prenotazioni,
  salaAttiva,
  onChangeSala,
  onAddTavolo,
  onUpdateTavolo,
  onDeleteTavolo,
  onAddPrenotazione,
}: TavoliProps) {
  const tavoliSala = useMemo(
    () => tavoli.filter((t) => t.sala === salaAttiva),
    [tavoli, salaAttiva]
  )

  const prenotazioniSala = useMemo(
    () => prenotazioni.filter((p) => p.sala === salaAttiva),
    [prenotazioni, salaAttiva]
  )

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showPrenotaManuale, setShowPrenotaManuale] = useState(false)
  const [showPrenotaAutomatica, setShowPrenotaAutomatica] = useState(false)
  const [showCalendario, setShowCalendario] = useState(false)

  const [dataCalendario, setDataCalendario] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [form, setForm] = useState({
    nomeCliente: '',
    telefono: '',
    persone: 2,
    celiache: 0,
    data: '',
    ora: '20:00',
    note: '',
  })

  const [tavoliAssegnatiPreview, setTavoliAssegnatiPreview] = useState<
    number[]
  >([])

  const tavoloSelezionato = tavoli.find((t) => t.id === selectedId) || null

  const prenotazioniGiorno = useMemo(
    () =>
      prenotazioni
        .filter((p) => p.data === dataCalendario)
        .sort((a, b) => {
          if (a.ora < b.ora) return -1
          if (a.ora > b.ora) return 1
          return 0
        }),
    [prenotazioni, dataCalendario]
  )

  const getPrenotazioneAttivaDelTavolo = (tavoloId: number) => {
    const trovata = prenotazioni
      .filter((p) => p.sala === salaAttiva && p.tavoloIds.includes(tavoloId))
      .sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora))[0]

    return trovata || null
  }

  const getBg = (stato: StatoTavolo) => {
    if (stato === 'libero') return 'bg-green-100 border-green-500'
    if (stato === 'prenotato') return 'bg-yellow-100 border-yellow-500'
    return 'bg-red-100 border-red-500'
  }

  const aggiornaForma = (id: number, forma: FormaTavolo) => {
    if (forma === 'quadrato') {
      onUpdateTavolo(id, { forma, width: 90, height: 90 })
    } else {
      onUpdateTavolo(id, { forma, width: 140, height: 90 })
    }
  }

  const resetForm = () => {
    setForm({
      nomeCliente: '',
      telefono: '',
      persone: 2,
      celiache: 0,
      data: '',
      ora: '20:00',
      note: '',
    })
    setTavoliAssegnatiPreview([])
  }

  const getCentro = (t: Tavolo) => ({
    x: t.x + t.width / 2,
    y: t.y + t.height / 2,
  })

  const distanza = (a: Tavolo, b: Tavolo) => {
    const ca = getCentro(a)
    const cb = getCentro(b)
    return Math.sqrt((ca.x - cb.x) ** 2 + (ca.y - cb.y) ** 2)
  }

  const tavoloDisponibile = (t: Tavolo, data: string, ora: string) => {
    if (t.stato === 'occupato') return false

    const giaPrenotato = prenotazioni.some(
      (p) =>
        p.sala === t.sala &&
        p.data === data &&
        p.ora === ora &&
        p.tavoloIds.includes(t.id)
    )

    return !giaPrenotato
  }

  const comboVicino = (combo: Tavolo[]) => {
    if (combo.length <= 1) return true

    for (let i = 0; i < combo.length; i++) {
      let vicinoAdAlmenoUno = false

      for (let j = 0; j < combo.length; j++) {
        if (i === j) continue
        if (distanza(combo[i], combo[j]) <= SOGLIA_VICINANZA) {
          vicinoAdAlmenoUno = true
          break
        }
      }

      if (!vicinoAdAlmenoUno) return false
    }

    return true
  }

  const scoreCombo = (combo: Tavolo[], persone: number) => {
    const postiTotali = combo.reduce((sum, t) => sum + t.posti, 0)
    const surplus = postiTotali - persone

    let distanze = 0
    let coppie = 0

    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        distanze += distanza(combo[i], combo[j])
        coppie++
      }
    }

    const mediaDistanza = coppie > 0 ? distanze / coppie : 0

    return surplus * 100 + (combo.length - 1) * 40 + mediaDistanza
  }

  const trovaCombinazioneAutomatica = (
    sala: Sala,
    persone: number,
    data: string,
    ora: string
  ): Tavolo[] => {
    const disponibili = tavoli
      .filter((t) => t.sala === sala)
      .filter((t) => tavoloDisponibile(t, data, ora))

    const candidati: Tavolo[][] = []

    for (const t1 of disponibili) {
      if (t1.posti >= persone) candidati.push([t1])
    }

    for (let i = 0; i < disponibili.length; i++) {
      for (let j = i + 1; j < disponibili.length; j++) {
        const combo = [disponibili[i], disponibili[j]]
        const posti = combo.reduce((sum, t) => sum + t.posti, 0)
        if (posti >= persone && comboVicino(combo)) candidati.push(combo)
      }
    }

    for (let i = 0; i < disponibili.length; i++) {
      for (let j = i + 1; j < disponibili.length; j++) {
        for (let k = j + 1; k < disponibili.length; k++) {
          const combo = [disponibili[i], disponibili[j], disponibili[k]]
          const posti = combo.reduce((sum, t) => sum + t.posti, 0)
          if (posti >= persone && comboVicino(combo)) candidati.push(combo)
        }
      }
    }

    if (candidati.length === 0) return []

    candidati.sort((a, b) => scoreCombo(a, persone) - scoreCombo(b, persone))
    return candidati[0]
  }

  const apriPrenotazioneManuale = () => {
    if (!tavoloSelezionato) return
    setForm((prev) => ({
      ...prev,
      persone: tavoloSelezionato.posti,
      celiache: 0,
    }))
    setTavoliAssegnatiPreview([tavoloSelezionato.id])
    setShowPrenotaManuale(true)
  }

  const apriPrenotazioneAutomatica = () => {
    resetForm()
    setForm((prev) => ({ ...prev, data: dataCalendario }))
    setShowPrenotaAutomatica(true)
  }

  const validaForm = () => {
    if (!form.nomeCliente.trim()) {
      alert('Inserisci il nome cliente')
      return false
    }

    if (!form.data) {
      alert('Inserisci la data')
      return false
    }

    if (form.celiache > form.persone) {
      alert('Le persone celiache non possono essere più del totale')
      return false
    }

    return true
  }

  const salvaPrenotazioneManuale = () => {
    if (!tavoloSelezionato) return
    if (!validaForm()) return

    if (!tavoloDisponibile(tavoloSelezionato, form.data, form.ora)) {
      alert('Questo tavolo è già impegnato per data e ora selezionate')
      return
    }

    onAddPrenotazione({
      tavoloIds: [tavoloSelezionato.id],
      nomeCliente: form.nomeCliente,
      telefono: form.telefono,
      persone: form.persone,
      celiache: form.celiache,
      data: form.data,
      ora: form.ora,
      note: form.note,
      sala: tavoloSelezionato.sala,
    })

    setShowPrenotaManuale(false)
    resetForm()
  }

  const cercaAssegnazioneAutomatica = () => {
    if (!form.data) {
      alert('Inserisci la data')
      return
    }

    const combo = trovaCombinazioneAutomatica(
      salaAttiva,
      form.persone,
      form.data,
      form.ora
    )

    if (combo.length === 0) {
      alert('Nessuna combinazione trovata in questa sala')
      setTavoliAssegnatiPreview([])
      return
    }

    setTavoliAssegnatiPreview(combo.map((t) => t.id))
  }

  const salvaPrenotazioneAutomatica = () => {
    if (!validaForm()) return

    let ids = tavoliAssegnatiPreview

    if (ids.length === 0) {
      const combo = trovaCombinazioneAutomatica(
        salaAttiva,
        form.persone,
        form.data,
        form.ora
      )

      if (combo.length === 0) {
        alert('Nessuna combinazione automatica disponibile')
        return
      }

      ids = combo.map((t) => t.id)
      setTavoliAssegnatiPreview(ids)
    }

    onAddPrenotazione({
      tavoloIds: ids,
      nomeCliente: form.nomeCliente,
      telefono: form.telefono,
      persone: form.persone,
      celiache: form.celiache,
      data: form.data,
      ora: form.ora,
      note: form.note,
      sala: salaAttiva,
    })

    setShowPrenotaAutomatica(false)
    resetForm()
  }

  const nomiTavoliPreview = tavoli
    .filter((t) => tavoliAssegnatiPreview.includes(t.id))
    .map((t) => t.nome)
    .join(' + ')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {sale.map((sala) => (
                <button
                  key={sala}
                  onClick={() => onChangeSala(sala)}
                  className={`px-4 py-2 rounded-lg border ${
                    salaAttiva === sala
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {sala}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={apriPrenotazioneAutomatica}
                className="px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                + Prenotazione automatica
              </button>

              <button
                onClick={() => onAddTavolo(salaAttiva)}
                className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Aggiungi tavolo
              </button>

              <button
                onClick={() => setShowCalendario(true)}
                className="px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Calendario prenotazioni
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-3">
            Sala attiva: <span className="font-semibold">{salaAttiva}</span>
          </div>

          <div className="relative w-full h-[650px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
            {tavoliSala.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
                Nessun tavolo in questa sala
              </div>
            )}

            {tavoliSala.map((tavolo) => {
              const prenotazioneAttiva = getPrenotazioneAttivaDelTavolo(tavolo.id)

              return (
                <Rnd
                  key={tavolo.id}
                  size={{ width: tavolo.width, height: tavolo.height }}
                  position={{ x: tavolo.x, y: tavolo.y }}
                  bounds="parent"
                  enableResizing={false}
                  onDragStop={(_, d) => {
                    onUpdateTavolo(tavolo.id, { x: d.x, y: d.y })
                  }}
                  onClick={() => setSelectedId(tavolo.id)}
                  onTouchStart={() => setSelectedId(tavolo.id)}
                  className={`border-2 rounded-xl shadow-sm ${getBg(
                    tavolo.stato
                  )} ${selectedId === tavolo.id ? 'ring-4 ring-blue-300' : ''}`}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-center px-2 select-none relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(tavolo.id)
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation()
                        setSelectedId(tavolo.id)
                      }}
                      className="absolute top-1 right-1 text-[10px] px-2 py-1 rounded-md bg-white border border-gray-300 shadow md:hidden z-20"
                    >
                      Modifica
                    </button>

                    <div className="font-bold text-gray-900">{tavolo.nome}</div>
                    <div className="text-sm text-gray-700">{tavolo.posti} posti</div>
                    <div className="text-xs text-gray-600 mt-1">{tavolo.forma}</div>
                    <div className="text-[11px] mt-1 font-medium">{tavolo.stato}</div>

                    {tavolo.stato === 'prenotato' && prenotazioneAttiva && (
                      <div className="text-[10px] mt-1 font-semibold text-gray-800 leading-tight">
                        {prenotazioneAttiva.nomeCliente}
                      </div>
                    )}
                  </div>
                </Rnd>
              )
            })}
          </div>
        </div>

        <div className="hidden xl:block bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Modifica tavolo
          </h2>

          {!tavoloSelezionato ? (
            <p className="text-gray-500">
              Clicca su un tavolo per modificarlo.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome tavolo
                </label>
                <input
                  type="text"
                  value={tavoloSelezionato.nome}
                  onChange={(e) =>
                    onUpdateTavolo(tavoloSelezionato.id, { nome: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posti
                </label>
                <input
                  type="number"
                  min="1"
                  value={tavoloSelezionato.posti}
                  onChange={(e) =>
                    onUpdateTavolo(tavoloSelezionato.id, {
                      posti: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sala
                </label>
                <select
                  value={tavoloSelezionato.sala}
                  onChange={(e) =>
                    onUpdateTavolo(tavoloSelezionato.id, {
                      sala: e.target.value as Sala,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {sale.map((sala) => (
                    <option key={sala} value={sala}>
                      {sala}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma
                </label>
                <select
                  value={tavoloSelezionato.forma}
                  onChange={(e) =>
                    aggiornaForma(
                      tavoloSelezionato.id,
                      e.target.value as FormaTavolo
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="quadrato">Quadrato</option>
                  <option value="rettangolare">Rettangolare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={tavoloSelezionato.stato}
                  onChange={(e) =>
                    onUpdateTavolo(tavoloSelezionato.id, {
                      stato: e.target.value as StatoTavolo,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="libero">Libero</option>
                  <option value="prenotato">Prenotato</option>
                  <option value="occupato">Occupato</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={apriPrenotazioneManuale}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Prenota tavolo manualmente
                </button>

                <button
                  onClick={() =>
                    onUpdateTavolo(tavoloSelezionato.id, {
                      x: 40,
                      y: 40,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Reset posizione
                </button>

                <button
                  onClick={() => {
                    onDeleteTavolo(tavoloSelezionato.id)
                    setSelectedId(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Elimina
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {tavoloSelezionato && (
        <div className="xl:hidden bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Modifica tavolo
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome tavolo
              </label>
              <input
                type="text"
                value={tavoloSelezionato.nome}
                onChange={(e) =>
                  onUpdateTavolo(tavoloSelezionato.id, { nome: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posti
              </label>
              <input
                type="number"
                min="1"
                value={tavoloSelezionato.posti}
                onChange={(e) =>
                  onUpdateTavolo(tavoloSelezionato.id, {
                    posti: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sala
              </label>
              <select
                value={tavoloSelezionato.sala}
                onChange={(e) =>
                  onUpdateTavolo(tavoloSelezionato.id, {
                    sala: e.target.value as Sala,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              >
                {sale.map((sala) => (
                  <option key={sala} value={sala}>
                    {sala}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma
              </label>
              <select
                value={tavoloSelezionato.forma}
                onChange={(e) =>
                  aggiornaForma(
                    tavoloSelezionato.id,
                    e.target.value as FormaTavolo
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              >
                <option value="quadrato">Quadrato</option>
                <option value="rettangolare">Rettangolare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={tavoloSelezionato.stato}
                onChange={(e) =>
                  onUpdateTavolo(tavoloSelezionato.id, {
                    stato: e.target.value as StatoTavolo,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              >
                <option value="libero">Libero</option>
                <option value="prenotato">Prenotato</option>
                <option value="occupato">Occupato</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={apriPrenotazioneManuale}
                className="px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Prenota tavolo manualmente
              </button>

              <button
                onClick={() =>
                  onUpdateTavolo(tavoloSelezionato.id, {
                    x: 40,
                    y: 40,
                  })
                }
                className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Reset posizione
              </button>

              <button
                onClick={() => {
                  onDeleteTavolo(tavoloSelezionato.id)
                  setSelectedId(null)
                }}
                className="px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Lista prenotazioni - {salaAttiva}
        </h3>

        {prenotazioniSala.length === 0 ? (
          <p className="text-gray-500">Nessuna prenotazione in questa sala.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Tavoli</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Telefono</th>
                  <th className="py-2">Persone</th>
                  <th className="py-2">Celiache</th>
                  <th className="py-2">Data</th>
                  <th className="py-2">Ora</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {prenotazioniSala.map((p) => {
                  const nomiTavoli = tavoli
                    .filter((t) => p.tavoloIds.includes(t.id))
                    .map((t) => t.nome)
                    .join(' + ')

                  return (
                    <tr key={p.id} className="border-b">
                      <td className="py-2">{nomiTavoli}</td>
                      <td className="py-2">{p.nomeCliente}</td>
                      <td className="py-2">{p.telefono || '-'}</td>
                      <td className="py-2">{p.persone}</td>
                      <td className="py-2">{p.celiache}</td>
                      <td className="py-2">{p.data}</td>
                      <td className="py-2">{p.ora}</td>
                      <td className="py-2">{p.note || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCalendario && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-5 max-h-[90vh] overflow-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <h3 className="text-2xl font-bold">Calendario prenotazioni</h3>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={dataCalendario}
                  onChange={(e) => setDataCalendario(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />

                <button
                  onClick={() => {
                    setShowCalendario(false)
                    apriPrenotazioneAutomatica()
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Aggiungi manualmente
                </button>

                <button
                  onClick={() => setShowCalendario(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              Data selezionata:{' '}
              <span className="font-semibold">{dataCalendario}</span>
            </div>

            {prenotazioniGiorno.length === 0 ? (
              <div className="p-6 border rounded-lg bg-gray-50 text-gray-500">
                Nessuna prenotazione per questa data.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Ora</th>
                      <th className="py-2">Sala</th>
                      <th className="py-2">Tavoli</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Telefono</th>
                      <th className="py-2">Persone</th>
                      <th className="py-2">Celiache</th>
                      <th className="py-2">Origine</th>
                      <th className="py-2">Stato</th>
                      <th className="py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prenotazioniGiorno.map((p) => {
                      const nomiTavoli = tavoli
                        .filter((t) => p.tavoloIds.includes(t.id))
                        .map((t) => t.nome)
                        .join(' + ')

                      return (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.ora}</td>
                          <td className="py-2">{p.sala}</td>
                          <td className="py-2">{nomiTavoli}</td>
                          <td className="py-2">{p.nomeCliente}</td>
                          <td className="py-2">{p.telefono || '-'}</td>
                          <td className="py-2">{p.persone}</td>
                          <td className="py-2">{p.celiache}</td>
                          <td className="py-2 capitalize">{p.origine}</td>
                          <td className="py-2 capitalize">
                            {p.statoPrenotazione}
                          </td>
                          <td className="py-2">{p.note || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 text-sm text-gray-500">
              Qui arriveranno anche le prenotazioni future da piattaforme
              esterne come WhatsApp e TheFork.
            </div>
          </div>
        </div>
      )}

      {showPrenotaManuale && tavoloSelezionato && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5">
            <h3 className="text-xl font-bold mb-4">
              Prenotazione manuale - {tavoloSelezionato.nome}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Nome cliente</label>
                <input
                  type="text"
                  value={form.nomeCliente}
                  onChange={(e) =>
                    setForm({ ...form, nomeCliente: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">
                  Telefono (facoltativo)
                </label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Persone</label>
                <input
                  type="number"
                  min="1"
                  value={form.persone}
                  onChange={(e) =>
                    setForm({ ...form, persone: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Persone celiache</label>
                <input
                  type="number"
                  min="0"
                  max={form.persone}
                  value={form.celiache}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      celiache: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Ora</label>
                <input
                  type="time"
                  value={form.ora}
                  onChange={(e) => setForm({ ...form, ora: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Tavolo assegnato:{' '}
              <span className="font-semibold">{tavoloSelezionato.nome}</span>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowPrenotaManuale(false)
                  resetForm()
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={salvaPrenotazioneManuale}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Salva prenotazione
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrenotaAutomatica && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-5">
            <h3 className="text-xl font-bold mb-4">
              Prenotazione automatica - {salaAttiva}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Nome cliente</label>
                <input
                  type="text"
                  value={form.nomeCliente}
                  onChange={(e) =>
                    setForm({ ...form, nomeCliente: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">
                  Telefono (facoltativo)
                </label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Persone</label>
                <input
                  type="number"
                  min="1"
                  value={form.persone}
                  onChange={(e) =>
                    setForm({ ...form, persone: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Persone celiache</label>
                <input
                  type="number"
                  min="0"
                  max={form.persone}
                  value={form.celiache}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      celiache: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Ora</label>
                <input
                  type="time"
                  value={form.ora}
                  onChange={(e) => setForm({ ...form, ora: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-5 p-4 rounded-lg bg-gray-50 border">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Assegnazione trovata</div>
                  <div className="font-semibold text-gray-900">
                    {nomiTavoliPreview || 'Nessuna ancora'}
                  </div>
                </div>

                <button
                  onClick={cercaAssegnazioneAutomatica}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                >
                  Cerca tavolo automatico
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowPrenotaAutomatica(false)
                  resetForm()
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={salvaPrenotazioneAutomatica}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Salva prenotazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tavoli