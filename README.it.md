# Agenti Fairtable per la ristorazione

*Tradotto da Claude; revisione da parte di un madrelingua in attesa. Fa fede la [README](README.md) in inglese.*

Trentadue piccoli agenti MCP per il back office di ristoranti, bar, caffè e gruppi con più locali. Ognuno si occupa di **un solo compito**, come il food cost effettivo rispetto al teorico, il pool delle mance, i pagamenti delle app di consegna o la matrice degli allergeni, e non può agire oltre. Leggono i file che già esportate dalla cassa, dai turni, dalle fatture dei fornitori, dalle app di consegna e dal sistema di prenotazione, scrivono i report sul vostro computer e aspettano una persona nominata prima di muovere denaro, inviare un messaggio o modificare un sistema in uso.

Parte di Fair Agents di Mythos Machines. Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · nessuna dipendenza. Il software è gratuito; a pagamento è l’avviamento a prezzo fisso sui vostri file.

## Provare

```bash
npx -y fairtable-food-cost demo            # food cost effettivo rispetto al teorico, dati fittizi
npx -y fairtable-delivery-payouts demo   # pagamenti delle app di consegna rispetto agli ordini
```

Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di test e un server MCP (`npx -y <agente> mcp --root <cartella>`).

## Gli agenti

**Merci, acquisti e bar (9):** `fairtable-food-cost` (food cost effettivo e teorico), `fairtable-recipe-costs` (costo delle ricette agli ultimi prezzi), `fairtable-price-creep` (aumenti graduali dei prezzi), `fairtable-receiving-credits` (fatture rispetto a ricevimenti e note di credito), `fairtable-inventory-counts` (scostamenti d’inventario), `fairtable-waste-log` (registro degli scarti), `fairtable-pour-cost` (costo di mescita), `fairtable-menu-engineering` (analisi del menù), `fairtable-stockouts` (articoli esauriti).

**Sala e cassa (6):** `fairtable-voids-comps` (storni e omaggi), `fairtable-discounts-promos` (sconti e promozioni), `fairtable-cash-drawers` (differenze di cassa), `fairtable-gift-cards` (gift card), `fairtable-no-shows` (prenotazioni non presentate), `fairtable-catering-deposits` (acconti catering).

**Personale (5):** `fairtable-tip-pooling` (pool delle mance), `fairtable-overtime` (straordinari, turni spezzati), `fairtable-schedule-vs-actual` (pianificato rispetto all’effettivo), `fairtable-labor-dayparts` (personale per fascia oraria), `fairtable-meal-breaks` (pause e minori).

**Consegne, commissioni, imposte e bollette (6):** `fairtable-delivery-payouts` (pagamenti), `fairtable-delivery-marketing` (marketing), `fairtable-card-fees` (commissioni carte), `fairtable-sales-tax` (imposta sulle vendite), `fairtable-duplicate-invoices` (fatture duplicate, imputazione), `fairtable-utility-bills` (utenze).

**Conformità e più locali (6):** `fairtable-equipment-maintenance` (manutenzione attrezzature), `fairtable-health-inspections` (ispezioni e permessi), `fairtable-food-handler-cards` (attestati HACCP), `fairtable-allergen-matrix` (matrice degli allergeni), `fairtable-prime-cost` (costo primo), `fairtable-location-comparison` (confronto tra locali).

## Sicurezza

- **Un compito per agente.** Ogni altro nome di strumento è bloccato.
- **Niente di vincolante avviene da solo.** Nessun agente paga, rimborsa, modifica la cassa, pubblica turni, elabora buste paga, presenta dichiarazioni o invia messaggi. Le bozze sono salvate come DRAFT; l’approvazione richiede sempre il clic di una persona nominata, anche in modalità Auto.
- **Dati personali mascherati.** Nomi, telefoni ed email di personale e clienti arrivano al modello solo come codici come `A.R.#3f9a2c`; i file sul vostro computer conservano i valori reali.
- **Solo file locali**, nessuna rete, registro di audit concatenato da hash in `.fairtable/`.
- **Le vostre regole.** Obiettivi, soglie, salari, aliquote, regole sulle pause e liste di allergeni sono impostazioni nel vostro file.

## Test

817 test e 703 casi di valutazione passano su Windows con Node 24 (almeno 21 per agente); i passaggi con input ostili non trovano nulla. Dettagli in [REVIEW-ver1.md](REVIEW-ver1.md).

## Limiti

Le colonne degli export nominati sono state scritte dalla conoscenza di quei sistemi, senza un account reale. Le regole su salari, imposte, pause e igiene cambiano per paese e regione; un professionista le conferma. Non è consulenza legale, fiscale, del lavoro o sanitaria.

MIT © 2026 Kurt Francisco
