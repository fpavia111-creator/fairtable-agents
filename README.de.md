# Fairtable-Agenten für die Gastronomie

*Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.*

Zweiunddreißig kleine MCP-Agenten für das Backoffice von Restaurants, Bars, Cafés und Gruppen mit mehreren Standorten. Jeder ist für **eine Aufgabe** zuständig, etwa Ist- gegenüber Soll-Wareneinsatz, Trinkgeldpool, Auszahlungen der Liefer-Apps oder die Allergenmatrix, und kann nicht darüber hinaus handeln. Sie lesen die Dateien, die Sie bereits aus Kassensystem, Dienstplan, Rechnungsverarbeitung, Lieferanten, Liefer-Apps und Reservierungssystem exportieren, schreiben Berichte auf Ihrem Rechner und warten auf eine namentlich genannte Person, bevor Geld bewegt, eine Nachricht gesendet oder ein laufendes System geändert wird.

Teil von Fair Agents von Mythos Machines. MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · keine Abhängigkeiten. Die Software ist kostenlos; bezahlt wird eine Einrichtung zum Festpreis auf Ihren eigenen Dateien.

## Ausprobieren

```bash
npx -y apricot-of-food-cost demo            # Ist- gegenüber Soll-Wareneinsatz, fiktive Daten
npx -y jackfruit-of-delivery-payouts demo   # Auszahlungen der Liefer-Apps gegenüber Bestellungen
```

Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`npx -y <agent> mcp --root <ordner>`).

## Die Agenten

**Waren, Einkauf und Bar (9):** `apricot-of-food-cost` (Ist- gegenüber Soll-Wareneinsatz), `banana-of-recipe-costs` (Rezeptkosten zu aktuellen Preisen), `blackberry-of-price-creep` (schleichende Preiserhöhungen), `blueberry-of-deliveries` (Rechnungen gegen Wareneingang und Gutschriften), `cherry-of-counts` (Inventurabweichungen), `clementine-of-waste` (Abfallprotokoll), `coconut-of-pours` (Ausschankkosten), `lime-of-menu-mix` (Menü-Engineering), `lychee-of-stockouts` (ausverkaufte Artikel).

**Service und Kasse (6):** `cranberry-of-voids` (Stornos und Einladungen), `date-of-discounts` (Rabatte und Aktionen), `elderberry-of-drawers` (Kassendifferenzen), `kumquat-of-gift-cards` (Geschenkkarten), `mango-of-no-shows` (nicht erschienene Reservierungen), `melon-of-catering` (Catering-Anzahlungen).

**Personal (5):** `fig-of-tip-pools` (Trinkgeldpool und Anrechnung), `grape-of-overtime` (Überstunden, geteilte Schichten), `guava-of-schedules` (Plan gegenüber Ist), `huckleberry-of-dayparts` (Personalkosten nach Tageszeit), `raspberry-of-breaks` (Pausen und Jugendliche).

**Liefer-Apps, Gebühren, Steuern, Rechnungen (6):** `jackfruit-of-delivery-payouts` (Auszahlungen), `kiwi-of-marketing-fees` (Marketinggebühren), `plum-of-card-fees` (Kartengebühren), `lemon-of-sales-tax` (Umsatzsteuer), `quince-of-invoices` (doppelte Rechnungen, Kontierung), `nectarine-of-utilities` (Versorgerrechnungen).

**Vorschriften und mehrere Standorte (6):** `olive-of-equipment` (Wartungsplan), `orange-of-inspections` (Kontrollen und Genehmigungen), `papaya-of-food-handlers` (Hygieneschulungen), `peach-of-allergens` (Allergenmatrix), `mulberry-of-prime-cost` (Prime Cost), `pear-of-locations` (Standortvergleich).

## Sicherheit

- **Eine Aufgabe je Agent.** Jeder andere Werkzeugname wird blockiert.
- **Nichts Verbindliches geschieht von selbst.** Kein Agent zahlt, erstattet, ändert die Kasse, veröffentlicht Dienstpläne, führt Lohnabrechnungen aus, reicht Steuern ein oder versendet Nachrichten. Entwürfe werden als DRAFT gespeichert; die Freigabe braucht immer den Klick einer namentlich genannten Person, auch im Auto-Modus.
- **Personenbezogene Daten werden maskiert.** Namen, Telefonnummern und E-Mail-Adressen von Mitarbeitenden und Gästen erscheinen im Ergebnis für das KI-Modell nur als Kürzel wie `A.R.#3f9a2c`; die Dateien auf Ihrem Rechner enthalten die echten Werte.
- **Nur lokale Dateien**, kein Netzwerk, ein hashverketteter Prüfpfad unter `.fairtable/`.
- **Ihre Regeln.** Ziele, Schwellen, Löhne, Steuersätze, Pausenregeln und Allergenlisten sind Einstellungen in Ihrer eigenen Datei.

## Prüfung

806 Tests und 703 Eval-Fälle bestehen unter Windows mit Node 24 (mindestens 21 je Agent); die Durchläufe mit feindlichen Eingaben finden nichts. Einzelheiten in [REVIEW-ver1.md](REVIEW-ver1.md).

## Grenzen

Die Spaltenlayouts benannter Exporte stammen aus Kenntnis der Systeme, nicht aus einem Live-Konto. Lohn-, Steuer-, Pausen- und Hygieneregeln unterscheiden sich je Land und Region; eine Fachperson bestätigt sie. Keine Rechts-, Steuer-, Lohn- oder Lebensmittelrechtsberatung.

MIT © 2026 Kurt Francisco
