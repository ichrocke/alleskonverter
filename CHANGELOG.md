# Changelog

Alle nennenswerten Änderungen am Alleskonverter, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/).

## 2026-07-26 (FAQ-Seite und KI-Stempel)

### Hinzugefügt
- **Eigene FAQ-Seite** (`faq.html`) mit 43 Fragen in acht Bereichen: Grundsätzliches, Datenschutz, Beruflich & DSGVO, Künstliche Intelligenz, Technik & Offline, Dateien & Formate, Wenn etwas klemmt, Über das Projekt. Bisher standen die Antworten verstreut in 44 Erklärtexten und in der Datenschutzerklärung — Letztere ist juristisch formuliert und beantwortet damit genau die Fragen nicht, die Leute wirklich haben. Neu und vorher nirgends beantwortet sind unter anderem: „Wie kann ich das selbst überprüfen?“ (Flugmodus-Test, Netzwerk-Reiter, Quellcode), „Brauche ich einen Auftragsverarbeitungsvertrag?“ (nein — es gibt keinen Auftragsverarbeiter), „Kann ich damit Patientendaten bearbeiten?“ und „Wo ist der Haken?“.
- Filterfeld mit Sofortsuche wie auf der Startseite, Sprungmarken zu jedem Bereich, und jede Frage ist über `#frage-N` direkt verlinkbar. Der Bereichsname zählt beim Suchen mit — wer „dsgvo“ tippt, findet auch die Fragen darunter, in denen das Wort selbst nicht vorkommt.
- Das FAQ-Markup (JSON-LD) wird beim Bauen aus den tatsächlich auf der Seite stehenden Fragen erzeugt, damit Markup und sichtbarer Text nicht auseinanderlaufen können.
- **Stempel „KI nur lokal“ auf den drei betroffenen Karten der Startseite.** Ein roter Gummistempel-Abdruck über der unteren Kante zeigt auf einen Blick, wo ein neuronales Netz arbeitet — und beantwortet die entscheidende Frage gleich mit. Wo kein Stempel ist, ist auch keine KI: 41 von 44 Werkzeugen. Der Stempel ist im FAQ eigens erklärt.
- Die FAQ-Seite ist aus der Fußzeile aller 44 Werkzeugseiten, der Startseite, dem Impressum und der Datenschutzerklärung erreichbar und in Sitemap und Service-Worker eingetragen.

### Geändert
- Die Stempelvorlage aus `assets/` wurde für den Einsatz aufbereitet: „AI-Generated“-Etikett entfernt, leerer Rand weggeschnitten, auf 300 px skaliert und zusätzlich als WebP abgelegt (32 statt 573 KB).

## 2026-07-26 (KI-Aussage klargestellt)

### Hinzugefügt
- **Neues Argument auf der Startseite: „Deine Dateien trainieren keine KI.“** Anlass war die Nachfrage, ob die Seite ganz ohne KI auskommt. Das tut sie nicht — Hintergrund entfernen (U²-Net), Texterkennung und PDF durchsuchbar machen (Tesseract) arbeiten mit neuronalen Netzen. Ein Werbeversprechen „keine KI“ wäre also falsch gewesen, und ausgerechnet auf einer Seite, die mit Nachprüfbarkeit wirbt, wäre das der teuerste denkbare Fehler. Die zutreffende und für Besucher wichtigere Aussage ist: Es wird kein KI-Dienst angefragt, die Modelle liegen als Datei auf dieser Website und rechnen im Browser, und nichts fließt in ein Training ein.
- **Datenschutzerklärung, neuer Abschnitt 6** („Künstliche Intelligenz: kein Dienst, kein Training“) — nennt die drei betroffenen Werkzeuge samt Modell beim Namen und hält fest, dass alle übrigen ganz ohne KI rechnen. Die folgenden Abschnitte wurden weitergezählt.
- Die drei KI-Werkzeuge beantworten die Frage jetzt auch auf der eigenen Seite. Bisher stand dort nur „wird nicht hochgeladen“ — bei KI ist „wird nicht zum Training benutzt“ aber die Frage, die zuerst kommt. Bei Freistellen und Texterkennung wandert sie zusätzlich ins FAQ-Markup.
- **Deutlich sichtbarer Hinweis auf den drei KI-Werkzeugen** (`.ki-hinweis` in `css/tools.css`), direkt unter der Überschrift statt versteckt im Erklärtext: „Hier arbeitet KI — und zwar auf deinem Gerät.“ Genannt werden das jeweilige Modell, dass kein KI-Dienst angefragt wird und dass nichts in ein Training fließt; ein Link springt zum passenden Abschnitt der Datenschutzerklärung. Umrandet in der Hausfarbe statt in Alarmrot — die Aussage ist eine Entwarnung, keine Warnung.

## 2026-07-26 (Acht Werkzeuge, LICENSE, neue Gliederung)

### Hinzugefügt
- **LICENSE** (MIT). Ohne Lizenzdatei galt beim öffentlichen Repo formal „alle Rechte vorbehalten“, was schlecht zum Vertrauensargument der Seite passt. MIT statt Apache-2.0, weil es kürzer ist und für eine Sammlung von HTML-Seiten die Patentklausel keinen Nutzen bringt. Die mitgelieferten Bibliotheken unter `vendor/` behalten ihre eigenen Lizenzen; das steht in der Datei und in `vendor/VERSIONEN.md`.
- Werkzeug **Word-Datei erstellen** (`tools/word-erstellen/`) — der lange als „schwer, eher lassen“ eingestufte Punkt, jetzt doch gebaut: Aus Markdown, reinem Text oder HTML entsteht eine echte DOCX-Datei mit Überschriften-Formatvorlagen, Listen, Tabellen, Zitaten, Codeblöcken, wahlweise Titelseite, Inhaltsverzeichnis, Kopfzeile und Seitenzahlen. Schriftart, Größe, Zeilenabstand, Ränder und Seitenformat sind einstellbar, daneben steht eine Seitenvorschau. Geprüft wurde nicht nur, dass eine Datei entsteht, sondern dass der macOS-Word-Parser sie liest und die nummerierten Listen tatsächlich als `decimal` und nicht als Aufzählung ankommen.
- Werkzeug **EPUB lesen & umwandeln** (`tools/epub/`): E-Books werden im Browser entpackt und mit Inhaltsverzeichnis, Kapitelnavigation und Titelbild angezeigt; Export als HTML (Bilder eingebettet), reiner Text, Markdown oder ZIP mit einer Datei je Kapitel. EPUB 2 und 3, Inhaltsverzeichnis aus `nav.xhtml` oder `toc.ncx`. Ohne zusätzliche Bibliothek — das vorhandene JSZip genügt, epub.js wäre 400 KB für Funktionen gewesen, die diese Seite nicht braucht. Dateien mit Kopierschutz werden erkannt und klar abgelehnt.
- Werkzeug **Texte & Tabellen vergleichen** (`tools/vergleichen/`): Diff nach Myers — dasselbe Verfahren wie in Git — mit wortgenauer Hervorhebung innerhalb geänderter Zeilen, wahlweise neben- oder untereinander. Im Tabellenmodus wird zellengenau verglichen, Zeilen können über eine Schlüsselspalte statt über die Position zugeordnet werden. Ergebnis als Unified-Diff oder als CSV der Änderungen.
- Werkzeug **CSV bereinigen** (`tools/csv-bereinigen/`): Spalten abwählen und per Ziehen sortieren, Duplikate über die ganze Zeile oder eine Schlüsselspalte entfernen, Zeilen über beliebig viele Filter (elf Bedingungen, UND/ODER) einschränken, Leerraum trimmen. Mit Bilanz, was jeder Schritt weggenommen hat. Ausgabe als CSV, TSV, Excel oder JSON.
- Werkzeug **Bildergalerie als HTML** (`tools/bildergalerie/`): mehrere Bilder hineinziehen, sortieren, beschriften — heraus kommt ein fertiger Schnipsel mit Raster, Mauerwerk oder Scrollreihe, Bildunterschriften, alt-Texten und optionaler Großansicht. Die Bilder werden dabei auf eine wählbare Breite verkleinert; wahlweise eingebettet als eine einzige Datei oder als ZIP mit Ordner `bilder/`.
- Werkzeug **Testdaten & Blindtext** (`tools/testdaten/`): Lorem Ipsum, deutscher Blindtext und Behördenton nach Absätzen, Sätzen, Wörtern oder Zeichen; dazu Datensätze mit deutschen Namen, Adressen, E-Mails, Telefonnummern, Geburtsdaten und **IBANs mit korrekt gerechneter Prüfziffer** nach ISO 13616 (Bankleitzahlen aus einem Bereich ohne echtes Institut). PLZ passt zum Ort, die E-Mail zum Namen. Mit Startwert für reproduzierbare Läufe, Ausgabe als CSV, JSON oder SQL.
- Werkzeug **Termin als ICS** (`tools/termin/`): Kalender-Einladungen nach RFC 5545 mit Zeitzone samt Sommerzeitregel, Wiederholung, Erinnerung, Organisator und Teilnehmern — mit Organisator und Teilnehmern wird daraus eine echte Einladung (`METHOD:REQUEST`). Zeilenfaltung nach 75 Oktetten wird in UTF-8-Bytes gerechnet, damit sie keine Umlaute zerreißt.
- Werkzeug **Regex ausprobieren** (`tools/regex/`): Treffer werden live im Text hervorgehoben, jede Gruppe einzeln aufgelistet, der Ausdruck in verständlichem Deutsch erklärt. Mit zehn fertigen Beispielen, Bausteinen zum Einsetzen und Ersetzen-Funktion. Die Auswertung bricht nach 1,5 Sekunden ab, damit verschachtelte Wiederholungen wie `(a+)+b` den Tab nicht einfrieren.
- Testfälle für alle acht neuen Werkzeuge; die Suite umfasst jetzt 52 Prüfungen. Neu darunter: Die erzeugten IBANs werden im Test gegen die Modulo-97-Regel nachgerechnet, und die ICS-Zeilen auf die 75-Oktette-Grenze geprüft.

### Geändert
- **Startseite neu gegliedert**: aus fünf Kategorien wurden sieben. „Extras“ war mit neun Werkzeugen zur Resterampe geworden — von der Passwort-Erzeugung bis zum Untertitel-Konverter stand dort alles, was sonst nirgends passte. Jetzt: PDF (12), Bilder (6), Dokumente & Text (7), Tabellen & Daten (3), Audio & Video (5), Web & Entwicklung (6), Alltag (5). Damit heißt jede Überschrift wieder etwas, und mit 44 Werkzeugen reichen Suche und Ausklappen weiterhin — Unterkategorien wären eine Ebene zu viel.
- Verkettung und Dateierkennung um die neuen Werkzeuge erweitert: eine hineingezogene CSV schlägt jetzt auch „CSV bereinigen“ und „Vergleichen“ vor, eine EPUB das neue Lesewerkzeug, eine Markdown-Datei zusätzlich „Word-Datei erstellen“.
- Links in den Erklärtexten waren bisher browserblau statt in der Hausfarbe (`css/tools.css`), und mehrzeilige Eingabefelder in der Seitenspalte nutzten die Breite nicht aus.
- `ideen.txt` aufgeräumt und neu gefüllt

## 2026-07-26 (Verkettung, Tastatur, Wartung)

### Hinzugefügt
- **Werkzeuge verketten** (`js/weiter.js`): Nach jedem fertigen Ergebnis erscheint ein „Weiter zu …“ mit passenden nächsten Schritten — nach dem Freistellen etwa Zuschneiden, nach der Texterkennung die Text-Werkzeuge. Ein Klick nimmt das eben erzeugte Ergebnis direkt mit, ohne Umweg über die Festplatte. Angedockt an `AK.offerDownload`, deshalb ohne Änderung an den einzelnen Werkzeugen.
- **Tastaturbedienung in den Miniaturen-Ansichten**: In „PDF bearbeiten“ lassen sich Seiten jetzt auch ohne Maus umsortieren (Pfeiltasten oder neue ←/→-Schaltflächen), drehen (R, mit Umschalt rückwärts) und löschen (Entfernen). Im Zuschnitt-Werkzeug bewegen die Pfeiltasten den Rahmen, mit Umschalt ändert sich die Größe, mit Alt in Ein-Pixel-Schritten. Der Rahmen ist anspringbar und hat einen sichtbaren Fokusrahmen.
- **Randfall-Tests**: beschädigte PDFs, kaputtes JSON, defekte ZIPs, leere DOCX, unlesbare Bilder und falsche Dateitypen — geprüft wird, dass eine verständliche Meldung erscheint statt eines stillen Absturzes. Die Suite umfasst jetzt 44 Prüfungen.
- **Lighthouse in der GitHub Action** (`.github/workflows/lighthouse.yml`): misst Startseite und drei Werkzeugseiten bei jedem Push und schlägt an, wenn eine Wertung unter die festgelegte Schwelle fällt.

### Behoben
- **Der Bildkonverter verschluckte unpassende Dateien kommentarlos.** Zieht man etwa eine Tabelle hinein, passierte schlicht nichts. Jetzt prüft die Ablagefläche zentral gegen das, was das Werkzeug laut Auswahlfeld annimmt, und sagt in verständlichen Worten, was erwartet wird — für alle Werkzeuge auf einmal. Gefunden hat das die neue Randfall-Prüfung.

### Geändert (Wartung)
- Bibliotheken gegen die Registry geprüft: mammoth und turndown aktualisiert. **pdf.js bleibt bewusst auf der letzten 3er-Fassung** — ab 4.0 gibt es nur noch ES-Module, was den Betrieb über `file://` beenden würde; Begründung in `vendor/VERSIONEN.md`, jährlich neu zu bewerten. **ffmpeg wurde zurückgerollt**, weil die neuere Fassung sich im Browser nicht mehr laden ließ.
- **Texterkennung um 9,5 MB verschlankt**: Die beiden Kernfassungen ohne LSTM wurden entfernt — die verwendeten schnellen Sprachmodelle sind LSTM-only, die Dateien wurden also nie angefordert. Erkennung danach unverändert.
- `ideen.txt` aufgeräumt und neu gefüllt

## 2026-07-26 (Werkzeug 36)

### Hinzugefügt
- Werkzeug **PDF durchsuchbar machen** (`tools/pdf-durchsuchbar/`) — die große Ergänzung zur Texterkennung: Aus einem gescannten PDF (oder mehreren Fotos) entsteht ein PDF, das aussieht wie vorher, in dem sich aber suchen, markieren und kopieren lässt. Dafür wird jedes erkannte Wort mit passender Größe an seiner tatsächlichen Position vollständig durchsichtig über den Scan gelegt. Geprüft wurde nicht nur, dass eine Datei entsteht, sondern dass sich der Text aus dem Ergebnis auch wirklich wieder auslesen lässt.

### Behoben
- Bei der Entwicklung: Tesseract liefert Wortpositionen in dieser Fassung nur, wenn man die Blockstruktur ausdrücklich anfordert — anfangs kamen deshalb null Wörter. Der Auslesecode kommt jetzt mit beiden Rückgabeformen zurecht.

## 2026-07-26 (Werkzeuge 34 und 35)

### Hinzugefügt
- Werkzeug **PDF-Formular ausfüllen** (`tools/pdf-formular/`): liest die Formularfelder eines PDFs aus und zeigt sie als normale Eingabefelder — Text, Ankreuzfelder, Auswahllisten und Optionsfelder. Die Angaben werden ins PDF zurückgeschrieben, auf Wunsch festgeschrieben, sodass sie sich nicht mehr ändern lassen. Enthält ein PDF gar keine Felder, sagt das Werkzeug das klar statt still nichts zu tun.
- Werkzeug **Ton verbessern** (`tools/ton-verbessern/`): gleicht die Lautheit nach dem Rundfunkstandard EBU R128 an (drei Zielwerte für Podcast, Streaming und Rundfunk), schneidet Stille am Anfang und Ende ab, dämpft gleichmäßiges Rauschen und legt auf Wunsch auf Mono zusammen. Mit direktem Hörvergleich vorher/nachher.

### Behoben
- PDF-Formular: Die Feldart wurde zunächst über `constructor.name` bestimmt — in der minimierten pdf-lib sind die Klassennamen jedoch verkürzt, sodass kein einziges Feld gefüllt wurde. Jetzt über `instanceof` gegen die exportierten Klassen.

## 2026-07-26 (Werkzeuge 32 und 33)

### Hinzugefügt
- Werkzeug **Dateien umbenennen** (`tools/bilder-umbenennen/`): benennt einen ganzen Stapel nach einem Muster um — Bausteine für fortlaufende Nummer, Originalname, Datum und Uhrzeit, dazu Suchen-und-Ersetzen, Schreibweise und das Ersetzen von Umlauten. Live-Vorschau jedes alten und neuen Namens, Namensdubletten werden automatisch durchnummeriert, Ergebnis als ZIP (die Originale bleiben unangetastet).
- Werkzeug **GIF erstellen** (`tools/gif-erstellen/`): animiertes GIF aus mehreren Bildern, Reihenfolge sortierbar, Tempo und Breite einstellbar, wahlweise vor und zurück abspielend. Erzeugt mit ffmpeg in zwei Durchgängen samt eigener Farbtabelle — das sieht deutlich besser aus als die Standardumwandlung — und zeigt das Ergebnis direkt animiert an.

## 2026-07-26 (Werkzeuge 30 und 31)

### Hinzugefügt
- Werkzeug **Bild als Daten-URI** (`tools/bild-base64/`): wandelt ein Bild in Base64 und liefert es fertig als reinen URI, CSS-Regel, HTML- oder Markdown-Schnipsel. Mit ehrlicher Größeneinschätzung — bis 10 KB grün, darüber gelb, ab 100 KB die klare Ansage, dass eine normale Bilddatei besser wäre — und einer Verkleinerung direkt im Werkzeug.
- Werkzeug **PDF-Übersichtsblatt** (`tools/pdf-kontaktabzug/`): legt alle Seiten als Miniaturen auf wenige A4-Blätter (fünf Raster von 4 bis 30 Stück je Blatt, hoch oder quer, wahlweise mit Seitenzahlen und Rahmen). Mit Vorschau des ersten Blatts, bevor gerechnet wird.

## 2026-07-26 (Werkzeuge 28 und 29)

### Hinzugefügt
- Werkzeug **Einheiten & Zeitzonen** (`tools/einheiten/`): neun Größenarten (Länge, Fläche, Volumen, Gewicht, Temperatur, Geschwindigkeit, Datenmenge, Zeitspanne, Druck) mit allen Einheiten auf einen Blick, dazu eine Uhrzeit gleichzeitig in 20 Zeitzonen — Sommer-/Winterzeit wird für das eingegebene Datum korrekt eingerechnet. Bewusst **ohne Währungen**, weil Wechselkurse einen Serverabruf erfordern würden.
- Werkzeug **JSON & YAML** (`tools/json-yaml/`): JSON aufhübschen, minimieren, Schlüssel sortieren und in beide Richtungen mit YAML wandeln. Fehler werden mit Zeile und Spalte gemeldet; sieht die Eingabe nach YAML aus, kommt statt einer kryptischen Meldung ein passender Hinweis.

## 2026-07-26 (Werkzeuge 26 und 27)

### Hinzugefügt
- Werkzeug **Farbwerte umrechnen** (`tools/farben/`): HEX, RGB, HSL und CMYK ineinander (jedes Feld ist bearbeitbar und zieht die anderen nach), neun Helligkeitsabstufungen zum Anklicken, Pipette zum Aufnehmen einer Farbe aus einem Bild und eine Kontrastprüfung nach der WCAG-Formel mit Urteil für Fließtext, große Schrift und die strenge Stufe.
- Werkzeug **Passwort-Generator** (`tools/passwort/`): Zeichenfolgen, Passphrasen aus rund 1300 deutschen Wörtern und Zahlen-PINs — erzeugt mit `crypto.getRandomValues` und gleichverteilt ohne Rest-Verzerrung, aus jeder gewählten Zeichengruppe mindestens ein Zeichen. Mit Stärkeanzeige in Bit und einer Schätzung, wie lange Durchprobieren dauern würde. Nichts wird gespeichert oder übertragen.

## 2026-07-26 (Werkzeug 25)

### Hinzugefügt
- Werkzeug **Bild-Metadaten anzeigen** (`tools/bild-metadaten/`): liest die EXIF-Angaben eines Fotos aus und übersetzt sie in verständliche Begriffe — Kamera und Objektiv, Aufnahmezeitpunkt, Blende, Belichtungszeit, ISO. Ist ein GPS-Standort enthalten, steht er als deutlich abgesetzte Warnung ganz oben, mit Kartenlink und direktem Verweis aufs Entfernen. Rohwerte auf Wunsch einblendbar, Ergebnis als Textdatei speicherbar.

## 2026-07-26 (Messung statt Umbau, Doku)

### Behoben
- Acht Textfelder in vier Werkzeugen hatten keine Beschriftung für Vorleseprogramme — mit `aria-label` nachgezogen. Alle Seiten stehen damit wieder bei 100 Punkten für Barrierefreiheit.

### Geprüft
- **Web Worker waren nicht nötig.** Vor dem geplanten Umbau wurde gemessen, ob die Oberfläche überhaupt blockiert — sie tut es nicht: 120 Seiten komprimieren ergab als längste Blockade 103 ms, sechs 12-Megapixel-Fotos umwandeln 97 ms (spürbar wird es ab etwa 600 ms). Grund: pdf.js, ffmpeg, Texterkennung und Freistellen bringen jeweils eigene Stränge mit, `canvas.toBlob` kodiert nebenher, und die `await`-Punkte zwischen den Schritten geben die Oberfläche frei. Statt eines Umbaus ohne Nutzen sichert jetzt ein Testfall diesen Zustand dauerhaft ab.

### Hinzugefügt
- `vendor/VERSIONEN.md`: vollständige Übersicht aller mitgelieferten Bibliotheken mit Version, Lizenz und Verwendungszweck, dazu Hinweise zur jährlichen Aktualisierung und zur LGPL-Auslieferung von ffmpeg
- `ideen.txt` aufgeräumt und neu gefüllt (u. a. Werkzeuge verketten, durchsuchbares PDF aus Texterkennung, EXIF anzeigen, Web Share Target, Deploy per GitHub Action)

## 2026-07-26 (Tests, Einstellungen, wichtiger Fehler behoben)

### Behoben
- **Word → HTML und Markdown ↔ HTML waren seit dem PWA-Einbau kaputt.** Das Skript, das die Service-Worker-Registrierung auf allen Seiten ergänzt hat, setzte sie beim *ersten* `</body>` ein — und das steht in diesen beiden Werkzeugen mitten in einem Textbaustein. Dadurch riss der Browser das Seitenskript an dieser Stelle ab, und keine der Funktionen wurde geladen. Aufgefallen ist es erst durch die neue Testsuite. Beide Seiten sind repariert, die Registrierung sitzt jetzt an der richtigen Stelle.

### Hinzugefügt
- **Automatische Tests** (`tests/`, `npm test`) und eine GitHub Action, die bei jedem Push läuft: Ein kleiner Webserver liefert die Website aus, ein echter Browser öffnet jedes der 24 Werkzeuge, schiebt eine passende Testdatei hinein und prüft, ob ein Download entsteht — dazu werden Konsolenfehler und Fehlermeldungen im Protokoll überwacht. Die Testdateien (PDF, PNG, DOCX, CSV, SRT) erzeugt das Skript selbst, ganz ohne zusätzliche Abhängigkeiten. Werkzeuge mit großen Modellen (ffmpeg, Texterkennung, Freistellen) werden auf Ladefähigkeit geprüft, statt jedes Mal 30 MB zu ziehen.
- **Werkzeuge merken sich ihre Einstellungen** (`js/einstellungen.js`): Zielformat, Qualität, Auflösung und Häkchen stehen beim nächsten Besuch wieder so, wie man sie zuletzt hatte — gespeichert nur lokal im Browser. Ausdrücklich ausgenommen sind Passwortfelder, Dateinamen, Texteingaben und Seitenbereiche; das ist über eine Sperrliste geregelt und im Test abgesichert. Datenschutzerklärung entsprechend präzisiert.

## 2026-07-26 (Werkzeug 24)

### Hinzugefügt
- Werkzeug **Hintergrund entfernen** (`tools/hintergrund-entfernen/`): stellt das Motiv automatisch frei — als PNG mit Transparenz oder direkt vor einer neuen Hintergrundfarbe, mit Vorher-Nachher-Vorschau und regelbarer Kantenschärfe (weich für Haare, hart für Gegenstände). Rechnet mit dem Modell U²-Net über die ONNX-Laufzeitumgebung vollständig im Browser; Modell und Laufzeit (~15 MB) liegen auf diesem Server und werden erst auf Klick geladen.
- **Zur Lizenzwahl:** Die bekannte Bibliothek `@imgly/background-removal` steht unter AGPL-3.0 und hätte diese Lizenz auf die gesamte Website übertragen. Stattdessen kommt der klar permissive Stapel zum Einsatz: U²-Net (Apache-2.0) mit onnxruntime-web (MIT).

## 2026-07-26 (Werkzeug 23 & offener Quellcode)

### Geändert
- **Das Repository ist jetzt öffentlich**: <https://github.com/ichrocke/alleskonverter>. Bei Werkzeugen, die mit vertraulichen Dateien umgehen, sollte niemand einem Versprechen glauben müssen — jetzt lässt sich Zeile für Zeile nachlesen, dass nichts hochgeladen wird. Hinweis darauf in der Datenschutzerklärung (eigener Abschnitt), in der USP-Leiste der Startseite, in der Fußzeile und im README. Vorher wurde die gesamte Git-Historie auf Zugangsdaten geprüft: `.env` war von Beginn an ausgeschlossen, in keinem Commit stehen Passwörter oder Serverdaten.

### Hinzugefügt
- Werkzeug **Texterkennung (OCR)** (`tools/texterkennung/`): liest Text aus Fotos, Screenshots und gescannten PDFs — auf Deutsch, Englisch oder gemischt. Läuft mit Tesseract (Apache-2.0) vollständig im Browser; Programm und Sprachdaten (~19 MB) liegen auf diesem Server und werden erst auf Klick geladen. Mehrseitige PDFs werden Seite für Seite gerendert und einzeln erkannt, kleine Vorlagen automatisch hochskaliert, und eine optionale Aufbereitung (Graustufen, mehr Kontrast) verbessert Fotos. Ergebnis kopieren oder als .txt speichern.

## 2026-07-26 (Werkzeug 22)

### Hinzugefügt
- Werkzeug **Medien schneiden** (`tools/medien-schneiden/`): Anfang und Ende am Abspieler festlegen (Schieberegler, Zeitfelder oder „aktuelle Stelle übernehmen“), Ausschnitt vorab anhören und speichern. Standardmäßig ohne Neuberechnung — das dauert nur Sekunden und kostet keine Qualität, setzt den Schnitt dafür am nächsten Schlüsselbild an; alternativ bildgenau mit Neuberechnung. Bei Videos lässt sich wahlweise nur die Tonspur speichern.

## 2026-07-26 (Datei wird mitgenommen)

### Hinzugefügt
- **Dateiübergabe von der Startseite ans Werkzeug** (`js/uebergabe.js`): Wer eine Datei auf die Startseite zieht, bekommt nicht nur Vorschläge — die Datei wird beim Klick gleich mitgenommen und ist im Werkzeug sofort geladen. Dafür liegt sie kurz in der lokalen Datenbank des Browsers (IndexedDB) und wird beim Übernehmen sofort wieder gelöscht; die Adresszeile wird anschließend aufgeräumt, damit ein Neuladen nichts Altes zeigt. Übertragen wird selbstverständlich nichts. Datenschutzerklärung entsprechend ergänzt.

## 2026-07-26 (Werkzeug 21)

### Hinzugefügt
- Werkzeug **PDF-Passwort** (`tools/pdf-passwort/`): PDFs mit AES-128 verschlüsseln (Öffnungspasswort und/oder Rechte-Passwort, mit Schaltern für Drucken, Kopieren, Ändern und Kommentare) oder einen bekannten Schutz wieder entfernen. Beim Laden wird automatisch erkannt, ob eine Datei geschützt ist, und der passende Modus vorgewählt; das Öffnungspasswort bekommt eine Stärke-Einschätzung. Passwörter werden bewusst **nicht** durchprobiert — das Werkzeug entsperrt eigene Dokumente, es knackt keine fremden. Dafür ist `vendor/pdf-lib-crypt.min.js` (@cantoo/pdf-lib, MIT) dazugekommen.

## 2026-07-26 (Werkzeug 20)

### Hinzugefügt
- Werkzeug **Bilder zusammenfügen** (`tools/bilder-zusammenfuegen/`): mehrere Bilder nebeneinander, untereinander oder als Raster zu einem einzigen verbinden — mit sortierbarer Reihenfolge, einstellbarem Abstand, wählbarem Hintergrund und Live-Vorschau samt Maßangabe. Unterschiedlich große Bilder werden auf eine gemeinsame Kante gebracht, im Raster vollständig in gleich große Zellen eingepasst; HEIC wird beim Laden umgewandelt.

## 2026-07-26 (Werkzeug 19)

### Hinzugefügt
- Werkzeug **Favicon-Generator** (`tools/favicon/`): erzeugt aus einem Bild alle gängigen Symbolgrößen, eine echte `favicon.ico` mit 16/32/48 px (im Browser zusammengesetzt), Apple-Touch-Icon, App-Icons, eine `site.webmanifest` und den passenden HTML-Schnipsel — alles als ZIP. Mit Live-Vorschau inklusive Browser-Tab-Simulation, wählbarem Hintergrund und Rand für runde App-Symbole.

## 2026-07-26 (Startseite neu geordnet)

### Geändert
- **Startseite für viele Werkzeuge umgebaut**: Suchfeld ganz oben (filtert live über Name, Beschreibung und hinterlegte Suchwörter wie „heic“ oder „verkleinern“, Umlaute egal; mit `/` direkt anspringbar, `Esc` leert), Kategorien sind jetzt aufklappbar mit Anzahl-Anzeige und lassen sich gesammelt auf- und zuklappen. Auf schmalen Bildschirmen ist zunächst nur die erste Kategorie offen.
- **Datei auf die Startseite ziehen** schlägt passende Werkzeuge vor: Die ganze Seite ist Ablagefläche, erkannt werden PDF, Bilder, iPhone-Fotos, Tabellen, Word, Markdown, HTML, Untertitel, ZIP, Audio und Video — bei unbekannten Endungen kommt ein verständlicher Hinweis. Die Dateien werden dabei nur dem Namen nach betrachtet und selbstverständlich nirgends hingeschickt.
- Nummerierung auf den Karten entfernt — sie sagte nach dem Umbau nichts mehr aus

## 2026-07-26 (Werkzeug 18)

### Hinzugefügt
- Werkzeug **Untertitel SRT ↔ VTT** (`tools/untertitel/`): wandelt in beide Richtungen um, zieht auf Wunsch nur den reinen Text ohne Zeitmarken heraus und verschiebt alle Zeitmarken um einen festen Betrag (Zehntelsekunden möglich) — praktisch bei Untertiteln, die dem Bild hinterherlaufen. Liest auch VTT mit Kopfzeilen und Positionsangaben.

## 2026-07-26 (Werkzeug 17)

### Hinzugefügt
- Werkzeug **Text-Werkzeuge** (`tools/text-werkzeuge/`): Base64 und URL-Kodierung in beide Richtungen, Prüfsummen (SHA-256/SHA-1/SHA-512 über die Krypto-Schnittstelle des Browsers), Groß-/Kleinschreibung, Zeilen umkehren, doppelte Zeilen entfernen, Leerraum aufräumen — dazu eine Live-Zählung von Zeichen, Wörtern, Zeilen und UTF-8-Bytes. Ergebnis kopieren, zurück in die Eingabe übernehmen oder als .txt speichern.

## 2026-07-26 (Rückbau Dunkelmodus, verlässliche Updates)

### Entfernt
- **Dunkelmodus** wieder ausgebaut: keine `prefers-color-scheme`-Palette mehr, einheitliche theme-color-Angabe, QR-Werkzeug wieder fest auf die helle Papier-Darstellung gesetzt. Die dabei entstandenen Farbvariablen (`--stamp-text`, `--field`, `--grain`) bleiben — sie ersetzen fest verdrahtete Farbwerte und machen das CSS einheitlicher.

### Geprüft
- Fünf aufeinanderfolgende Deploy-Zyklen gegen die Live-Seite mit einem Browser, der Cache und aktiven Service Worker behält: jede CSS-Änderung und jede Rücknahme kam ohne harten Reload an. Die Rückfrage beim Server kostet dabei 0 Byte (Antwort „304 unverändert“).

### Behoben
- **Nach einem Deploy konnten Besucher altes CSS und JavaScript behalten**: `.htaccess` gab für alle Dateitypen ein Jahr Cache-Zeit vor, also auch für eigenen Code. Eigener Code (`/css/`, `/js/`, die Werkzeug-eigenen Dateien, `sw.js`, Manifest) wird jetzt bei jedem Aufruf beim Server rückgefragt — dank ETag antwortet der in aller Regel mit einem winzigen „304 unverändert“. Fremdbibliotheken und Schriften behalten die lange Cache-Zeit, da sie sich nie an Ort und Stelle ändern; eigene Bilder werden täglich geprüft.
- Einmalige Versionskennung (`?v=20260726`) an allen eigenen CSS- und JS-Verweisen — nötig, damit auch Besucher mit der bereits ein Jahr lang gespeicherten alten Fassung die neue Datei bekommen.
- `mod_expires` hängte an jede Antwort zusätzlich ein `Expires`-Datum ein Jahr in der Zukunft — zusammen mit dem neuen `no-cache` ein Widerspruch, an dem eine geänderte CSS-Datei in einem Test tatsächlich hängenblieb. Für eigenen Code wird `Expires` jetzt neutralisiert.
- Service Worker: Anfragen für eigenen Code laufen jetzt mit `cache: 'no-cache'`, damit ein veralteter Browser-Cache die „Netz zuerst“-Strategie nicht unterläuft; beim Nachschlagen im Cache wird die Versionskennung ignoriert.

## 2026-07-26 (PWA)

### Hinzugefügt
- **Installierbare App mit echtem Offline-Betrieb**: `manifest.webmanifest` (Name, App-Icons in 192/512 px inkl. maskierbarer Variante, Schnellzugriffe auf vier Werkzeuge) und `sw.js`. Beim ersten Besuch werden Grundgerüst, alle Bibliotheken und sämtliche Werkzeugseiten abgelegt — die Seitenliste kommt aus der `sitemap.xml` und pflegt sich damit selbst. Seiten und eigener Code werden „Netz zuerst“ geladen (Änderungen kommen sofort an), Bibliotheken und Schriften „Cache zuerst“; ffmpeg (~32 MB) wird erst nach tatsächlicher Nutzung behalten.
- `.htaccess`: `sw.js` vom Zwischenspeichern ausgenommen, damit Nutzer nie auf veralteter Logik festhängen

### Geändert
- `ideen.txt` und README auf den aktuellen Stand gebracht (Erledigtes gestrichen, Anleitung zum Hinzufügen neuer Werkzeuge ergänzt)

### Geprüft
- Offline-Test gegen die Live-Seite: Service Worker aktiv (54 Dateien im Cache), bei abgeschaltetem Netz laden Startseite und Werkzeugseiten samt Gestaltung und Bibliotheken — zwei PDFs wurden ohne Internetverbindung erfolgreich zusammengefügt
- Lighthouse nach allen Änderungen: Startseite und alle Werkzeugseiten weiterhin 100/100/100/100

## 2026-07-26 (Dunkelmodus)

### Hinzugefügt
- **Dunkelmodus** für die gesamte Website: folgt automatisch der Systemeinstellung (`prefers-color-scheme`), kein Schalter und kein gespeicherter Zustand nötig. Die Papier-Palette bekommt eine dunkle Entsprechung; Dokument- und Bildvorschauen (PDF-Seiten, Miniaturen, HTML- und Tabellenvorschau) bleiben bewusst hell, weil sie Papier darstellen. Das QR-Werkzeug folgt wieder dem System, statt fest hell zu sein.
- Passende `theme-color`-Angaben je Modus auf allen Seiten (Browserleiste auf dem Handy)

### Behoben
- **Tabellen-Konverter: Umlaute in CSV-Dateien waren kaputt** („MÃ¼ller“ statt „Müller“) — CSV/TSV wird jetzt selbst als UTF-8 dekodiert, mit automatischem Rückfall auf Windows-1252 für alte Exporte
- Dunkelmodus-Kontraste geprüft und nachgeschärft: Feldränder aufgehellt (jetzt 3,7:1), Schrift auf grünen Flächen von Weiß auf Dunkel umgestellt (2,7:1 → 7,0:1). Alle Text-Kontraste liegen über den WCAG-AA-Anforderungen.
- Startseiten-Logo wirkte im Dunkelmodus wie ein greller Kasten — bekommt jetzt Polsterung und liest sich als bewusst gesetztes Papier-Etikett

## 2026-07-26 (Werkzeug 16)

### Hinzugefügt
- Werkzeug **PDF stempeln** (`tools/pdf-stempeln/`): Wasserzeichen (freier Text, diagonal oder waagerecht, Größe/Deckkraft/Farbe wählbar) und Seitenzahlen (fünf Formate, sechs Positionen, Startnummer einstellbar) — mit seitenweiser Live-Vorschau, die dem Ergebnis entspricht. Die Seiten werden nicht gerastert, vorhandener Text bleibt durchsuchbar. Zu lange Wasserzeichen verkleinern sich automatisch, damit sie nicht über den Seitenrand laufen; Zeichen, die Helvetica nicht kennt, werden entfernt statt einen Fehler auszulösen. Karte auf der Startseite, Sitemap- und README-Eintrag.

## 2026-07-26 (Werkzeug 15)

### Hinzugefügt
- Werkzeug **Bild zuschneiden** (`tools/bild-zuschneiden/`): Ausschnitt direkt im Bild aufziehen, verschieben und an den Ecken skalieren (Maus und Touch), neun feste Seitenverhältnisse zum Einrasten (1:1, 4:3, 16:9, 9:16 …), 90°-Drehung in beide Richtungen, waagerechtes und senkrechtes Spiegeln. Zuschnitt in voller Originalauflösung, Ausgabe als JPEG/PNG/WebP mit Qualitätsregler; HEIC wird beim Laden umgewandelt. Karte auf der Startseite, Sitemap- und README-Eintrag.

## 2026-07-26 (Werkzeug 14)

### Hinzugefügt
- Werkzeug **ZIP entpacken & packen** (`tools/zip/`): Archiv hineinziehen zeigt den Inhalt mit Größen und Ordnerpfaden — einzelne Dateien oder alle auf einmal herausholen; umgekehrt beliebige Dateien zu einem ZIP schnüren (Kompression wählbar, Namensdubletten werden automatisch durchnummeriert). macOS-Beiwerk (`__MACOSX`, `.DS_Store`) wird beim Öffnen ausgeblendet. Karte auf der Startseite, Sitemap- und README-Eintrag.

### Geändert
- `AK.fmtBytes` zeigt Größen unter 1 KB jetzt in Byte statt „0 KB“ (wirkt in allen Werkzeugen)

## 2026-07-26 (Livegang: Lighthouse-Optimierung)

### Hinzugefügt
- `SEARCH-CONSOLE.md`: Schritt-für-Schritt-Anleitung zum Einrichten der Google Search Console (Domain-Property, TXT-Eintrag bei Strato, Sitemap einreichen) — interne Datei, wird nicht mit deployt
- `.htaccess` für den Strato-Server: eigene 404-Seite, Weiterleitung von www auf die Hauptdomain, gzip-Kompression (inkl. WASM), Cache-Regeln (Schriften/WASM ein Jahr, HTML immer frisch), Sicherheitskopfzeilen, MIME-Typen für `.wasm`/`.webmanifest`/`.webp`
- `<main>`-Landmark auf Startseite und allen Werkzeugseiten (Barrierefreiheit)

### Geändert
- Kopf-Logo drastisch verkleinert: 880 px statt 1170 px, zusätzlich als WebP über `<picture>` — 230 KB → 20 KB (PNG-Rückfallebene 38 KB)
- Schriftdefinitionen von `vendor/fonts/fonts.css` nach `css/base.css` verschoben; damit entfällt eine blockierende Anfrage pro Seitenaufruf
- Bibliotheken auf den Werkzeugseiten stehen jetzt am Seitenende statt im Kopf — die Seite rendert sofort, statt auf bis zu 1,3 MB JavaScript zu warten
- Startseite: Reihenfolge der Kategorien korrigiert (Medien vor Extras)

### Behoben
- `robots.txt`: Impressum und Datenschutz waren per `Disallow` gesperrt und trugen gleichzeitig ein `noindex` — dadurch hätte Google das `noindex` nie lesen können. Sperre entfernt, das Meta-Tag erledigt es korrekt.
- Ablagefläche: irreführendes `aria-label` entfernt, das die sichtbare Beschriftung überschrieb (Sprachsteuerung fand die Schaltfläche nicht)
- QR-Werkzeug: `role="img"` für die Vorschau (unzulässiges `aria-label` auf einem `div`), reservierte Höhen gegen Layout-Sprünge beim Aufbau

### Geprüft
- Lighthouse über die Live-Seite: Startseite und alle Werkzeugseiten erreichen **100/100/100/100** (Performance, Barrierefreiheit, Best Practices, SEO) — vorher 97/97/100/100 bzw. 83 Performance auf Werkzeugseiten
- HTTPS und Weiterleitung von http aktiv

## 2026-07-25 (vierter Wurf: Livegang-Vorbereitung)

### Geändert
- ffmpeg wird jetzt selbst gehostet (`vendor/ffmpeg/`, ~32 MB) statt von jsDelivr geladen — die Website kontaktiert damit gar keine Drittserver mehr; Datenschutzerklärung (§ 5), README, Startseite und Medien-Werkzeug entsprechend angepasst. Das Medien-Werkzeug braucht dafür einen Webserver und zeigt bei `file://` einen Hinweis.

### Hinzugefügt (Deploy)
- `deploy.sh`: lädt die Website per SFTP (lftp mirror, mit Löschabgleich) auf den Strato-Webspace; Zugangsdaten liegen in der git-ignorierten `.env`. Interne Dateien (README, CHANGELOG, ideen.txt, deploy.sh, .git) werden nicht mit hochgeladen. Erster Deploy ist erfolgt — Arbeitsablauf ist ab jetzt: Änderung → Changelog → Commit → Push → `./deploy.sh`

### Geändert (QR-Werkzeug)
- QR-Seite neu aufgebaut: nur noch die Engine (js/, vendor/) aus QR Studio übernommen — die Seite selbst nutzt jetzt das Standard-Gerüst der Site (base.css-Kopf mit Zurück-Schaltfläche, Anton-Überschrift, Site-Footer, „Gut zu wissen“-FAQ wie bei allen Werkzeugen). Eigener App-Header, Theme-Umschalter und App-Footer entfernt, helles Papier-Theme fest eingestellt, Bedienelemente kantig statt rund. Das Ursprungsprojekt `sonstiges-qr` blieb unverändert (war nur kopiert worden).

### Geändert (Roadmap)
- `ideen.txt` aktualisiert: erledigte Punkte (Livegang-Dateien, SEO-Ausbau, ffmpeg-Selbsthosting, QR-Code-Werkzeug) gestrichen, Search-Console-Punkt ergänzt

### Hinzugefügt (Werkzeug 13)
- **QR-Code erstellen** (`tools/qr-code/`), portiert aus dem Projekt „QR Studio“: 12 QR-Typen (Link, WLAN, vCard, GiroCode …), Stile/Farben/Verläufe, Logos, Bild-im-Code (Halftone), Rahmen, PNG/SVG/JPEG/WebP-Export, Verlauf in localStorage. Design per `paper-theme.css` an den Papier-Look angepasst (hell und dunkel), Zurück-Schaltfläche und Rechtslinks ergänzt, SEO/OG-Metadaten gesetzt, Karte in neuer Hub-Kategorie „Extras“, Sitemap- und README-Eintrag; Datenschutzerklärung um localStorage-Hinweis ergänzt

### Geändert (Impressum)
- Kontakt-E-Mail auf marc@alleskonverter.de umgestellt

### Hinzugefügt
- SEO-Ausbau aller 12 Werkzeugseiten: suchwortbezogene Titel und Meta-Descriptions („PDF zusammenfügen kostenlos ohne Upload“, „HEIC in JPG umwandeln“ …), Canonical-Links, Open-Graph-/Twitter-Tags, Abschnitt „Gut zu wissen“ mit Einführungstext und FAQ je Werkzeug sowie strukturierte Daten (schema.org WebApplication + FAQPage als JSON-LD)
- `robots.txt` (Impressum/Datenschutz vom Indexieren ausgenommen) und `sitemap.xml` mit allen Werkzeugseiten
- `favicon.ico` (16/32/48 px) und `assets/apple-touch-icon.png` (180 px, Papier-Hintergrund); Theme-Color-Meta auf der Startseite
- `404.html` im Site-Design (Hoster muss sie als Fehlerseite eingerichtet haben)

## 2026-07-25 (dritter Wurf: Feinschliff)

### Hinzugefügt
- `ideen.txt`: Roadmap mit Ideen für Livegang, SEO, neue Werkzeuge, PWA/Offline, Reichweite und Wartung

### Behoben
- „← Alle Werkzeuge“ auf den Unterseiten ist jetzt eine echte Schaltfläche mit großer Trefferfläche (vorher winziger 11-px-Textlink)

### Geändert
- Startseite: großes Logo oben links ersetzt Domain-Zeile, „Läuft vollständig im Browser“-Zeile und den Textschriftzug „Alleskonverter“
- Impressum mit echten Angaben gefüllt (Marc Schüßler, Flurstr. 31, 33609 Bielefeld) — Punkt „Offen“ vom zweiten Wurf damit erledigt
- „AI-Generated“-Kennzeichnung oben rechts aus `assets/og.png` und `assets/logo.png` entfernt (Hintergrund retuschiert)

## 2026-07-25 (zweiter Wurf: Auftritt & Recht)

### Hinzugefügt
- Startseite: USP-Leiste („100 % lokal · kein Upload/datenschutzkonform · kein Konto · kostenlos & ohne Limits · keine Cookies/kein Tracking“) und PayPal-Spendenknopf (paypal.me/marc85444)
- Social-Media-/SEO-Metadaten auf der Startseite: Open-Graph- und Twitter-Card-Tags mit `assets/og.png`, Meta-Description, Canonical auf https://alleskonverter.de/
- Logo eingebunden: `assets/logo-header.png` (zugeschnittene Variante) im Kopf der Startseite, `assets/favicon.png` (aus dem Logo-Icon) als Favicon auf allen Seiten
- Seiten `impressum.html` und `datenschutz.html` im Site-Design; Fußzeilen-Links (Impressum · Datenschutz · Spenden) auf Startseite und allen 12 Werkzeugseiten

### Geändert
- Name ohne Bindestrich: Überschrift jetzt „Alleskonverter“ (Domain wird alleskonverter.de)
- Der bisherige Datenschutz-Absatz der Startseite ist inhaltlich in die Datenschutzerklärung umgezogen (dort ergänzt um Hoster-Logs, jsDelivr-Hinweis fürs Medien-Werkzeug, PayPal, Betroffenenrechte)

### Entfernt
- Offline-Hinweistext im Fuß der Startseite

### Offen
- Impressum: Name und Anschrift sind noch Platzhalter und müssen vor dem Livegang eingetragen werden

## 2026-07-25

### Behoben
- Hub-Karten: Nummer, Titel und Beschreibung stehen jetzt untereinander statt ineinander zu fließen

### Geprüft
- Alle 12 Werkzeuge automatisiert end-to-end getestet (headless Chrome über `file://`): Dateien laden, konvertieren, Download entsteht — inklusive ffmpeg-Ladevorgang und WAV → MP3
- Responsive Ansicht (390 px und 1440 px) ohne horizontales Überlaufen, Konsolen aller Seiten fehlerfrei

### Hinzugefügt (Doku)
- README mit Werkzeugübersicht, Nutzungs-, Datenschutz- und Technikabschnitt
- Audio & Video: ffmpeg-Core wird jetzt als ESM-Variante geladen — der Module-Worker importiert den Core per `import()`, mit dem UMD-Core schlug das Laden fehl

### Geändert
- PDF-Stapler (`tools/pdf-zusammenfuegen/`) auf gemeinsame Module umgestellt: geteilte CSS, `AK.filelist`/`AK.dropzone`/`AK.pdf`-Helfer, lokale Bibliotheken statt CDN, Rückweg-Navigation zum Hub — Funktionalität unverändert

### Hinzugefügt
- Werkzeug **Audio & Video** (`tools/medien/`): MP3/WAV/OGG/M4A/FLAC/MP4/WebM/GIF via ffmpeg.wasm; Bibliothek wird erst auf Klick (~31 MB, CDN) geladen, Dateien bleiben lokal; Bitrate und Videogröße wählbar, Tonspur-Extraktion aus Videos
- Werkzeug **Tabellen-Konverter** (`tools/tabellen/`): CSV/TSV/JSON/XLSX/XLS ineinander umwandeln (SheetJS), Tabellenvorschau, Arbeitsblatt-Auswahl, wählbares CSV-Trennzeichen, UTF-8-BOM für Excel
- Werkzeug **Markdown ↔ HTML** (`tools/markdown-html/`): beide Richtungen (marked/turndown), Live-Vorschau beim Tippen, wahlweise komplette HTML-Datei oder Fragment
- Werkzeug **Word → HTML** (`tools/word-zu-html/`): DOCX zu komplettem HTML, HTML-Fragment oder reinem Text (mammoth), mit Live-Vorschau und Wortzahl
- Werkzeug **Bilder konvertieren** (`tools/bild-konvertieren/`): Batch-Konvertierung nach JPEG/PNG/WebP/AVIF (mit Browser-Feature-Erkennung), HEIC-Eingabe, Größenbegrenzung, Qualitätsregler, EXIF-Entfernung, ZIP-Download
- Werkzeug **Text auslesen** (`tools/pdf-text/`): PDF-Textextraktion mit Seitenmarkierungen, Zwischenablage und .txt-Download
- Werkzeug **PDF komprimieren** (`tools/pdf-komprimieren/`): Neuaufbau mit wählbarer Auflösung/Qualität, Vorher/Nachher-Größe, Passwort-Unterstützung
- Werkzeug **Bilder → PDF** (`tools/bild-zu-pdf/`): JPG/PNG unverändert eingebettet, HEIC/WebP/GIF u. a. werden lokal umgewandelt; A4 (hoch/quer) oder randlos, sortierbarer Stapel
- Werkzeug **PDF → Bild** (`tools/pdf-zu-bild/`): Seiten als PNG/JPEG mit wählbarer Auflösung und Qualität, Einzeldownload oder ZIP, Passwort-Unterstützung
- Werkzeug **PDF bearbeiten** (`tools/pdf-bearbeiten/`): Seiten-Miniaturen, drehen, löschen/wiederherstellen, Reihenfolge per Ziehen, verlustfreies Speichern
- Werkzeug **PDF aufteilen** (`tools/pdf-aufteilen/`): Seitenbereich extrahieren, jede Seite einzeln oder in N-Seiten-Blöcken als ZIP
- Projektgerüst: Designsystem im Papier-Look (`css/base.css`, `css/tools.css`), gemeinsame Skripte (`js/ui.js`, `js/dropzone.js`, `js/filelist.js`, `js/pdf-common.js`)
- Hub-Seite (`index.html`) mit Karten-Übersicht aller zwölf Werkzeuge in vier Kategorien
- Bibliotheken lokal unter `/vendor` (pdf-lib, pdf.js inkl. Worker, JSZip, heic2any, mammoth, marked, turndown, SheetJS) — keine CDN-Abhängigkeit
- Schriften lokal unter `/vendor/fonts` (Anton, Archivo, IBM Plex Mono als woff2)
- Bestehender PDF-Stapler unverändert nach `tools/pdf-zusammenfuegen/` übernommen (Refactoring folgt)
- Privates GitHub-Repository `ichrocke/alleskonverter` angelegt
