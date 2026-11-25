# Fairtable-Agenten für die Gastronomie

*Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.*

Zweiunddreißig kleine MCP-Agenten für das Backoffice von Restaurants, Bars, Cafés und Gruppen mit mehreren Standorten. Jeder ist für **eine Aufgabe** zuständig, etwa Ist- gegenüber Soll-Wareneinsatz, Trinkgeldpool, Auszahlungen der Liefer-Apps oder die Allergenmatrix, und kann nicht darüber hinaus handeln. Sie lesen die Dateien, die Sie bereits aus Kassensystem, Dienstplan, Rechnungsverarbeitung, Lieferanten, Liefer-Apps und Reservierungssystem exportieren, schreiben Berichte auf Ihrem Rechner und warten auf eine namentlich genannte Person, bevor Geld bewegt, eine Nachricht gesendet oder ein laufendes System geändert wird.

Teil von Fair Agents von Mythos Machines. MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · keine Abhängigkeiten. Die Software ist kostenlos; bezahlt wird eine Einrichtung zum Festpreis auf Ihren eigenen Dateien.

## Ausprobieren

```bash
npx -y fairtable-food-cost demo            # Ist- gegenüber Soll-Wareneinsatz, fiktive Daten
npx -y fairtable-delivery-payouts demo   # Auszahlungen der Liefer-Apps gegenüber Bestellungen
```

Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`npx -y <agent> mcp --root <ordner>`).

## Die Agenten

**Waren, Einkauf und Bar (9):** `fairtable-food-cost` (Ist- gegenüber Soll-Wareneinsatz), `fairtable-recipe-costs` (Rezeptkosten zu aktuellen Preisen), `fairtable-price-creep` (schleichende Preiserhöhungen), `fairtable-receiving-credits` (Rechnungen gegen Wareneingang und Gutschriften), `fairtable-inventory-counts` (Inventurabweichungen), `fairtable-waste-log` (Abfallprotokoll), `fairtable-pour-cost` (Ausschankkosten), `fairtable-menu-engineering` (Menü-Engineering), `fairtable-stockouts` (ausverkaufte Artikel).

**Service und Kasse (6):** `fairtable-voids-comps` (Stornos und Einladungen), `fairtable-discounts-promos` (Rabatte und Aktionen), `fairtable-cash-drawers` (Kassendifferenzen), `fairtable-stored-value` (Geschenkkarten), `fairtable-no-shows` (nicht erschienene Reservierungen), `fairtable-catering-deposits` (Catering-Anzahlungen).

**Personal (5):** `fairtable-tip-pooling` (Trinkgeldpool und Anrechnung), `fairtable-overtime` (Überstunden, geteilte Schichten), `fairtable-schedule-vs-actual` (Plan gegenüber Ist), `fairtable-labor-dayparts` (Personalkosten nach Tageszeit), `fairtable-meal-breaks` (Pausen und Jugendliche).

**Liefer-Apps, Gebühren, Steuern, Rechnungen (6):** `fairtable-delivery-payouts` (Auszahlungen), `fairtable-delivery-marketing` (Marketinggebühren), `fairtable-card-fees` (Kartengebühren), `fairtable-sales-tax` (Umsatzsteuer), `fairtable-duplicate-invoices` (doppelte Rechnungen, Kontierung), `fairtable-utility-bills` (Versorgerrechnungen).

**Vorschriften und mehrere Standorte (6):** `fairtable-equipment-maintenance` (Wartungsplan), `fairtable-health-inspections` (Kontrollen und Genehmigungen), `fairtable-food-handler-cards` (Hygieneschulungen), `fairtable-allergen-matrix` (Allergenmatrix), `fairtable-prime-cost` (Prime Cost), `fairtable-location-comparison` (Standortvergleich).

## Sicherheit

- **Eine Aufgabe je Agent.** Jeder andere Werkzeugname wird blockiert.
- **Nichts Verbindliches geschieht von selbst.** Kein Agent zahlt, erstattet, ändert die Kasse, veröffentlicht Dienstpläne, führt Lohnabrechnungen aus, reicht Steuern ein oder versendet Nachrichten. Entwürfe werden als DRAFT gespeichert; die Freigabe braucht immer den Klick einer namentlich genannten Person, auch im Auto-Modus.
- **Personenbezogene Daten werden maskiert.** Namen, Telefonnummern und E-Mail-Adressen von Mitarbeitenden und Gästen erscheinen im Ergebnis für das KI-Modell nur als Kürzel wie `A.R.#3f9a2c`; die Dateien auf Ihrem Rechner enthalten die echten Werte.
- **Nur lokale Dateien**, kein Netzwerk, ein hashverketteter Prüfpfad unter `.fairtable/`.
- **Ihre Regeln.** Ziele, Schwellen, Löhne, Steuersätze, Pausenregeln und Allergenlisten sind Einstellungen in Ihrer eigenen Datei.

## Prüfung

817 Tests und 703 Eval-Fälle bestehen unter Windows mit Node 24 (mindestens 21 je Agent); die Durchläufe mit feindlichen Eingaben finden nichts. Einzelheiten in [REVIEW-ver1.md](REVIEW-ver1.md).

## Grenzen

Die Spaltenlayouts benannter Exporte stammen aus Kenntnis der Systeme, nicht aus einem Live-Konto. Lohn-, Steuer-, Pausen- und Hygieneregeln unterscheiden sich je Land und Region; eine Fachperson bestätigt sie. Keine Rechts-, Steuer-, Lohn- oder Lebensmittelrechtsberatung.

MIT © 2026 Kurt Francisco
