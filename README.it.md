# Agenti Fairtable per la ristorazione

*Tradotto da Claude; revisione da parte di un madrelingua in attesa. Fa fede la [README](README.md) in inglese.*

Trentadue piccoli agenti MCP per il back office di ristoranti, bar, caffè e gruppi con più locali. Ognuno si occupa di **un solo compito**, come il food cost effettivo rispetto al teorico, il pool delle mance, i pagamenti delle app di consegna o la matrice degli allergeni, e non può agire oltre. Leggono i file che già esportate dalla cassa, dai turni, dalle fatture dei fornitori, dalle app di consegna e dal sistema di prenotazione, scrivono i report sul vostro computer e aspettano una persona nominata prima di muovere denaro, inviare un messaggio o modificare un sistema in uso.

Parte di Fair Agents di Mythos Machines. Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · nessuna dipendenza. Il software è gratuito; a pagamento è l’avviamento a prezzo fisso sui vostri file.

## Provare

```bash
npx -y apricot-of-food-cost demo            # food cost effettivo rispetto al teorico, dati fittizi
npx -y jackfruit-of-delivery-payouts demo   # pagamenti delle app di consegna rispetto agli ordini
```

Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di test e un server MCP (`npx -y <agente> mcp --root <cartella>`).

## Gli agenti

**Merci, acquisti e bar (9):** `apricot-of-food-cost` (food cost effettivo e teorico), `banana-of-recipe-costs` (costo delle ricette agli ultimi prezzi), `blackberry-of-price-creep` (aumenti graduali dei prezzi), `blueberry-of-deliveries` (fatture rispetto a ricevimenti e note di credito), `cherry-of-counts` (scostamenti d’inventario), `clementine-of-waste` (registro degli scarti), `coconut-of-pours` (costo di mescita), `lime-of-menu-mix` (analisi del menù), `lychee-of-stockouts` (articoli esauriti).

**Sala e cassa (6):** `cranberry-of-voids` (storni e omaggi), `date-of-discounts` (sconti e promozioni), `elderberry-of-drawers` (differenze di cassa), `kumquat-of-gift-cards` (gift card), `mango-of-no-shows` (prenotazioni non presentate), `melon-of-catering` (acconti catering).

**Personale (5):** `fig-of-tip-pools` (pool delle mance), `grape-of-overtime` (straordinari, turni spezzati), `guava-of-schedules` (pianificato rispetto all’effettivo), `huckleberry-of-dayparts` (personale per fascia oraria), `raspberry-of-breaks` (pause e minori).

**Consegne, commissioni, imposte e bollette (6):** `jackfruit-of-delivery-payouts` (pagamenti), `kiwi-of-marketing-fees` (marketing), `plum-of-card-fees` (commissioni carte), `lemon-of-sales-tax` (imposta sulle vendite), `quince-of-invoices` (fatture duplicate, imputazione), `nectarine-of-utilities` (utenze).

**Conformità e più locali (6):** `olive-of-equipment` (manutenzione attrezzature), `orange-of-inspections` (ispezioni e permessi), `papaya-of-food-handlers` (attestati HACCP), `peach-of-allergens` (matrice degli allergeni), `mulberry-of-prime-cost` (costo primo), `pear-of-locations` (confronto tra locali).

## Sicurezza

- **Un compito per agente.** Ogni altro nome di strumento è bloccato.
- **Niente di vincolante avviene da solo.** Nessun agente paga, rimborsa, modifica la cassa, pubblica turni, elabora buste paga, presenta dichiarazioni o invia messaggi. Le bozze sono salvate come DRAFT; l’approvazione richiede sempre il clic di una persona nominata, anche in modalità Auto.
- **Dati personali mascherati.** Nomi, telefoni ed email di personale e clienti arrivano al modello solo come codici come `A.R.#3f9a2c`; i file sul vostro computer conservano i valori reali.
- **Solo file locali**, nessuna rete, registro di audit concatenato da hash in `.fairtable/`.
- **Le vostre regole.** Obiettivi, soglie, salari, aliquote, regole sulle pause e liste di allergeni sono impostazioni nel vostro file.

## Test

806 test e 703 casi di valutazione passano su Windows con Node 24 (almeno 21 per agente); i passaggi con input ostili non trovano nulla. Dettagli in [REVIEW-ver1.md](REVIEW-ver1.md).

## Limiti

Le colonne degli export nominati sono state scritte dalla conoscenza di quei sistemi, senza un account reale. Le regole su salari, imposte, pause e igiene cambiano per paese e regione; un professionista le conferma. Non è consulenza legale, fiscale, del lavoro o sanitaria.

MIT © 2026 Kurt Francisco
