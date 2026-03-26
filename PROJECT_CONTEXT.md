# PROJECT CONTEXT — Gestionale Tavoli Ristorante

## Stack
- Frontend: React + Vite + TypeScript
- Database/Auth: Supabase
- Deploy: Vercel

## Stato attuale
Il progetto è già online e collegato a Supabase.

### Funzioni già presenti
- Login con Supabase Auth
- Ruoli utente:
  - super_admin
  - admin
  - staff
  - viewer
- Dashboard protetta da login
- Gestione tavoli con mappa
- Tavoli drag & drop
- Supporto mobile migliorato
- Creazione tavoli
- Modifica tavoli
- Eliminazione tavoli
- Forme tavoli:
  - quadrato
  - rettangolare
- Sale:
  - SALA NORD
  - SALA SUD
  - SALA ESTERNA
- Prenotazioni manuali
- Prenotazioni automatiche con assegnazione tavoli
- Unione tavoli vicini in base alla posizione
- Campo persone celiache
- Calendario prenotazioni per data
- Origine prenotazione pronta:
  - manuale
  - whatsapp
  - thefork
  - sito
- Stato prenotazione pronto:
  - richiesta
  - confermata
  - arrivati
  - chiusa
  - annullata

## File principali
- `src/App.tsx` → wrapper auth + ruoli
- `src/DashboardApp.tsx` → gestionale principale
- `src/components/Tavoli.tsx` → mappa tavoli + prenotazioni + calendario
- `src/Login.tsx` → login/registrazione
- `src/UserManagement.tsx` → gestione utenti e ruoli
- `src/supabase.ts` → client Supabase

## Database Supabase
### Tabelle principali
- `tavoli`
- `prenotazioni`
- `profiles`

### Campi importanti prenotazioni
- `origine`
- `stato_prenotazione`
- `codice_esterno`
- `created_at`

## Permessi
- `viewer` non usa il gestionale operativo
- `staff`, `admin`, `super_admin` possono operare
- `super_admin` gestisce utenti e ruoli

## Stato tecnico
- Deploy Vercel funzionante
- Supabase funzionante
- Drag tavoli funzionante anche mobile
- Coordinate tavoli arrotondate per evitare errori integer su mobile

## Prossimo obiettivo
Integrare:
1. WhatsApp
2. TheFork

## Strategia prossima
### WhatsApp
- ricezione prenotazioni da messaggi
- salvataggio in Supabase con `origine = whatsapp`
- uso di webhook/server function

### TheFork
- verificare disponibilità API o alternativa
- importare prenotazioni in Supabase con `origine = thefork`

## Nota importante
Quando si continua il progetto in una nuova chat, leggere sempre prima questo file e poi proseguire dallo stato attuale senza rifare i passaggi già completati.