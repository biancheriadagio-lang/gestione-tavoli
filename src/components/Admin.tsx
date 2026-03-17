
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface Tavolo {
  id: number
  nome: string
  posti: number
  stato: string
}

interface Prenotazione {
  id: number
  tavolo_id: number
  nome_cliente: string
  telefono: string
  numero_persone: number
  data: string
  ora: string
  note: string
}

interface AdminProps {
  tavoli: Tavolo[]
  prenotazioni: Prenotazione[]
  onUpdateTavolo: (id: number, stato: string) => void
}

function Admin({ tavoli, prenotazioni, onUpdateTavolo }: AdminProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pannello Amministratore</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Statistiche Tavoli
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Totali</p>
                <p className="text-2xl font-semibold">{tavoli.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Liberi</p>
                <p className="text-2xl font-semibold text-libero-600">
                  {tavoli.filter((t) => t.stato === 'libero').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupati</p>
                <p className="text-2xl font-semibold text-occupato-600">
                  {tavoli.filter((t) => t.stato === 'occupato').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Prenotazioni Oggi
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <p className="text-2xl font-semibold text-center">
              {prenotazioni.filter(
                (p) => p.data === format(new Date(), 'yyyy-MM-dd')
              ).length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Tutte le Prenotazioni
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tavolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Ora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prenotazioni.map((prenotazione) => {
                const tavolo = tavoli.find((t) => t.id === prenotazione.tavolo_id)
                return (
                  <tr key={prenotazione.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {prenotazione.nome_cliente}
                          </div>
                          <div className="text-sm text-gray-500">
                            {prenotazione.telefono}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tavolo?.nome} ({tavolo?.posti} posti)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(parseISO(prenotazione.data), 'PPP', { locale: it })}
                        <br />
                        {prenotazione.ora}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {prenotazione.numero_persone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          tavolo?.stato === 'libero'
                            ? 'bg-libero-100 text-libero-800'
                            : tavolo?.stato === 'prenotato'
                            ? 'bg-prenotato-100 text-prenotato-800'
                            : 'bg-occupato-100 text-occupato-800'
                        }`}
                      >
                        {tavolo?.stato}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Admin
  