# Google Search Console einrichten

Kurzanleitung — dauert etwa fünf Minuten. Den Verifizierungs-Code kann ich einbauen,
sobald du ihn hast; alles andere ist auf der Website bereits vorbereitet.

## 1. Property anlegen

1. [search.google.com/search-console](https://search.google.com/search-console) öffnen, mit Google-Konto anmelden.
2. „Property hinzufügen“ → **Domain** wählen (nicht „URL-Präfix“) und `alleskonverter.de` eintragen.
   Die Domain-Variante deckt http, https, www und alle Unterseiten auf einmal ab.

## 2. Bestätigen (DNS bei Strato)

Google zeigt einen TXT-Eintrag der Form `google-site-verification=abc123…`.

1. Im Strato-Kundenbereich: **Domainverwaltung → alleskonverter.de → DNS-Einstellungen**
2. Neuen **TXT-Eintrag** anlegen, Feld „Präfix/Name“ leer lassen (bzw. `@`), als Wert die komplette Zeile von Google eintragen.
3. Speichern, dann in der Search Console auf „Bestätigen“ klicken.
   Kann bis zu einer Stunde dauern, geht meist in Minuten.

**Alternative, falls DNS zickt:** In der Search Console statt „Domain“ die Variante
**URL-Präfix** mit `https://alleskonverter.de/` wählen und die HTML-Datei-Methode nehmen —
die Datei schicke ich dir dann ins Projekt und deploye sie (Meta-Tag geht auch, dann bitte den
Tag durchgeben, ich setze ihn in die Startseite).

## 3. Sitemap einreichen

In der Search Console links **Sitemaps** → `sitemap.xml` eintragen → Senden.
Die Datei liegt bereits unter <https://alleskonverter.de/sitemap.xml> und enthält alle Werkzeugseiten.

## 4. In den ersten Tagen prüfen

- **Seiten** → sind alle Werkzeugseiten „indexiert“? (Impressum/Datenschutz erscheinen bewusst als
  „durch noindex ausgeschlossen“ — das ist gewollt.)
- **Darstellung in der Suche** → prüft die strukturierten Daten; FAQ und WebApplication sollten
  ohne Fehler erkannt werden.
- **Core Web Vitals** → sollte grün sein (Lighthouse: 100/100/100/100).
- **Leistung** → nach zwei bis drei Wochen sichtbar, welche Suchbegriffe ziehen.
  Danach lohnt es sich, die Texte der stärksten Werkzeugseiten nachzuschärfen.

## Optional: Bing

[bing.com/webmasters](https://www.bing.com/webmasters) kann die Property direkt aus der
Google Search Console importieren — zwei Klicks, bringt zusätzlich Bing und DuckDuckGo.
