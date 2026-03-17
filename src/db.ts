
import { createClient } from '@libsql/client'

const db = createClient({
  url: 'file:ristorante.db'
})

async function initializeDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tavoli (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      posti INTEGER NOT NULL,
      stato TEXT NOT NULL CHECK(stato IN ('libero', 'prenotato', 'occupato'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS prenotazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tavolo_id INTEGER NOT NULL,
      nome_cliente TEXT NOT NULL,
      telefono TEXT NOT NULL,
      numero_persone INTEGER NOT NULL,
      data TEXT NOT NULL,
      ora TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(tavolo_id) REFERENCES tavoli(id)
    )
  `)

  // Dati di esempio
  const tavoliCount = await db.execute('SELECT COUNT(*) as count FROM tavoli')
  if (tavoliCount.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO tavoli (nome, posti, stato)
      VALUES 
        ('T1', 4, 'libero'),
        ('T2', 2, 'libero'),
        ('T3', 6, 'libero'),
        ('T4', 4, 'libero'),
        ('T5', 8, 'libero'),
        ('T6', 4, 'libero'),
        ('T7', 2, 'libero'),
        ('T8', 6, 'libero')
    `)
  }
}

initializeDB()

export { db }
  