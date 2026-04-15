# Taktik extern teilen (Ein-Tunnel-Workflow)

Ziel: Ein Freund klickt einen Link und sieht deine Taktik — **ohne** dass er das
Projekt lokal laufen lässt. Nur **du** hostest die App, Cloudflare macht sie von
außen erreichbar.

## Voraussetzungen

- Das Projekt läuft lokal (Backend compiliert, du kannst dich einloggen).
- `cloudflared` installiert:
  ```powershell
  winget install --id Cloudflare.cloudflared
  ```

## Schritt 1 — Frontend in den Backend-Bundle bauen

Einmalig nach jeder Frontend-Änderung:

```powershell
cd backend
./mvnw -Pfullstack package -DskipTests
```

Das Profil `fullstack` lädt Node.js, baut `frontend/dist/` und kopiert es nach
`backend/target/classes/static/`. Danach serviert Spring Boot sowohl die
React-App als auch die API auf **demselben** Port.

## Schritt 2 — Backend starten

```powershell
cd backend
./mvnw -Pfullstack spring-boot:run
```

Öffne `http://localhost:8080/` — die App lädt **ohne** Vite-Dev-Server. Das
Login-Formular muss erscheinen.

## Schritt 3 — Cloudflare-Tunnel aufmachen

Neues Terminal:

```powershell
cloudflared tunnel --url http://localhost:8080
```

Cloudflare druckt eine Zeile wie:

```
https://foo-bar-baz.trycloudflare.com
```

## Schritt 4 — App **über die Tunnel-URL** öffnen

**WICHTIG:** Öffne die Tunnel-URL im eigenen Browser, **NICHT** `localhost:8080`.
Grund: der Teilen-Button kopiert `window.location.origin`. Wenn du über
`localhost` öffnest, landet `http://localhost:8080/shared/…` in der Zwischenablage
und dein Freund kann das nicht erreichen.

Bei geöffneter Tunnel-URL:

1. Einloggen
2. Taktik anlegen oder öffnen
3. Sichtbarkeit auf **„Öffentlich"** stellen
4. Teilen-Button klicken → Clipboard enthält jetzt
   `https://foo-bar-baz.trycloudflare.com/shared/{uuid}`
5. Link an den Freund schicken

## Schritt 5 — Freund öffnet den Link

Der Freund klickt die URL → Cloudflare → dein localhost:8080 → Spring Boot
liefert `index.html` → React Router rendert die Read-Only-Ansicht → `/api/shared/{uuid}`
Aufruf läuft same-origin (kein CORS, kein Login).

## Troubleshooting

- **„This site can't be reached" beim Freund:** dein Backend läuft nicht mehr
  oder `cloudflared` wurde beendet. Beide müssen die gesamte Zeit offen bleiben.
- **Link enthält `localhost`:** du hast die App über `http://localhost:8080`
  geöffnet statt über die Tunnel-URL. Siehe Schritt 4.
- **404 beim Freund:** du hast `fullstack`-Profil vergessen, `target/classes/static/`
  ist leer. Schritt 1 nochmal ausführen.
- **Alte Version sichtbar:** nach Frontend-Änderungen Schritt 1 + Backend-Neustart.

## Hinweis: Dev-Modus funktioniert **nicht** für Share

Der normale `npm run dev` + separates `./mvnw spring-boot:run` Setup läuft auf
zwei Ports (5173 + 8080). Ein einzelner Tunnel reicht dafür nicht aus, und der
Share-Link würde trotzdem den Vite-Port enthalten. Für externes Teilen **immer**
den `fullstack`-Build nehmen.
