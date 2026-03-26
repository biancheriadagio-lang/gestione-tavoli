import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function parseItalianDate(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}`
}

function extractBookingData(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const getField = (label: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(label.toLowerCase() + ':'))
    if (!line) return null
    return line.split(':').slice(1).join(':').trim()
  }

  const nome = getField('Nome')
  const data = getField('Data')
  const ora = getField('Ora')
  const persone = getField('Persone')
  const celiaci = getField('Celiaci')
  const nota = getField('Nota')

  const dataISO = data ? parseItalianDate(data) : null
  const personeNum = persone ? Number(persone) : null
  const celiaciNum = celiaci ? Number(celiaci) : 0

  const isValid =
    !!nome &&
    !!dataISO &&
    !!ora &&
    !!personeNum &&
    !Number.isNaN(personeNum)

  return {
    isValid,
    nome,
    data: dataISO,
    ora,
    persone: personeNum,
    celiaci: Number.isNaN(celiaciNum) ? 0 : celiaciNum,
    nota: nota || null,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }

    return res.status(403).send('Forbidden')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages || []
    const contacts = value?.contacts || []

    if (!messages.length) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const message = messages[0]
    const contact = contacts[0]

    const waMessageId = message?.id || null
    const waFrom = message?.from || null
    const profileName = contact?.profile?.name || null
    const messageType = message?.type || null
    const textBody = messageType === 'text' ? message?.text?.body || '' : ''

    await supabase.from('whatsapp_messages').insert({
      wa_message_id: waMessageId,
      wa_from: waFrom,
      profile_name: profileName,
      message_type: messageType,
      text_body: textBody,
      payload_json: body,
      processed: false,
    })

    if (messageType !== 'text' || !textBody) {
      return res.status(200).json({ ok: true, stored: true, parsed: false })
    }

    const booking = extractBookingData(textBody)

    if (!booking.isValid) {
      return res.status(200).json({
        ok: true,
        stored: true,
        parsed: false,
        reason: 'invalid booking format',
      })
    }

    const { error: bookingError } = await supabase.from('prenotazioni').insert({
      nome_cliente: booking.nome,
      data_prenotazione: booking.data,
      ora_prenotazione: booking.ora,
      numero_persone: booking.persone,
      persone_celiache: booking.celiaci,
      note: booking.nota,
      origine: 'whatsapp',
      stato_prenotazione: 'richiesta',
      codice_esterno: waMessageId,
    })

    if (bookingError) {
      console.error('Errore inserimento prenotazione:', bookingError)
      return res.status(500).json({ error: 'Errore inserimento prenotazione' })
    }

    await supabase
      .from('whatsapp_messages')
      .update({ processed: true })
      .eq('wa_message_id', waMessageId)

    return res.status(200).json({
      ok: true,
      stored: true,
      parsed: true,
      bookingCreated: true,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Webhook error' })
  }
}