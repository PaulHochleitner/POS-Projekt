# Football Tactics Simulator — Backend-Dokumentation

> **Projekt:** Football Tactics Simulator  
> **Technologie:** Spring Boot 3.4.4, Java 21, H2/PostgreSQL, JWT-Authentifizierung  
> **Autor:** Paul Hochleitner  
> **Stand:** April 2026

---

## Inhaltsverzeichnis

1. [Projektüberblick](#1-projektüberblick)
2. [Unique Selling Points (USPs)](#2-unique-selling-points-usps)
3. [Architektur & Design-Entscheidungen](#3-architektur--design-entscheidungen)
4. [Klassenübersicht](#4-klassenübersicht)
5. [API-Endpunkte](#5-api-endpunkte)
6. [Testing](#6-testing)
7. [Abhängigkeiten (Dependencies)](#7-abhängigkeiten-dependencies)
8. [Deployment & Build](#8-deployment--build)
9. [Präsentationstranskript (15 Minuten)](#9-präsentationstranskript-15-minuten)

---

## 1. Projektüberblick

Der **Football Tactics Simulator** ist eine Fullstack-Webanwendung, mit der Fußballtrainer und -enthusiasten interaktiv Taktiken auf einem virtuellen Spielfeld erstellen, animieren und als GIF exportieren können. Das Backend stellt eine REST-API bereit, die sämtliche Geschäftslogik, Datenpersistenz, Authentifizierung und den serverseitigen GIF-Export übernimmt.

### Was macht die Applikation?

- **Taktiken erstellen & animieren:** Spieler auf einem Spielfeld positionieren und Frame-für-Frame Bewegungsabläufe definieren
- **Mannschaften verwalten:** Eigene Teams mit Spielern anlegen (FIFA-inspiriertes Attributsystem)
- **Versionierung:** Jede Änderung an einer Taktik wird als Version gespeichert, Versionen können verglichen werden
- **GIF-Export:** Animierte Taktiken werden serverseitig als GIF gerendert — mit interpolierten Zwischenframes für flüssige Animationen
- **Tag-System:** Taktiken kategorisieren und nach Tags filtern (AND-Logik)

---

## 2. Unique Selling Points (USPs)

### 🎬 USP #1: Serverseitiger GIF-Export mit Java2D-Rendering

**Warum besonders?** Die meisten Webanwendungen würden einen GIF-Export clientseitig im Browser lösen. Ich habe mich bewusst für serverseitiges Rendering entschieden, weil:

- **Konsistenz:** Jedes GIF sieht identisch aus, unabhängig vom Browser oder Gerät des Nutzers
- **Performance:** Der Server kann im Hintergrund rendern, während der User weiterarbeitet
- **Komplexität:** Java2D bietet volle Kontrolle über Antialiasing, Fonts und Farbmanagement

**Technische Umsetzung:**
- Bibliothek: `animated-gif-lib` (com.madgag) für die GIF-Encodierung
- **Lineare Interpolation (Lerp):** Zwischen zwei Keyframes werden 20 Zwischenframes berechnet: `lerp(a, b, t) = a + (b - a) * t` mit `t ∈ [0.0, 1.0]`
- **Dual-Roster-Rendering:** Heim- und Gastmannschaft werden in unterschiedlichen Farben gerendert (Blau vs. Rot)
- **Positionsbasiertes Farbschema:** Torhüter = Gelb, Verteidiger = Blau, Mittelfeld = Grün, Angriff = Rot
- **Koordinaten-Mapping:** Das Frontend arbeitet mit 0–100%-Koordinaten, das Backend mappt diese auf 800×520 Pixel: `px = 30 + (x/100) × (800 − 60)`
- **Animationsdetails:** 50ms Delay pro Frame, letzter Keyframe wird 10× wiederholt als Pause, Endlos-Loop

```java
// Kernlogik der Interpolation
private double lerp(double a, double b, double t) {
    return a + (b - a) * t;
}
```

### 📋 USP #2: Taktik-Versionierung mit Diff-Vergleich

**Warum besonders?** Versionierung kennt man von Git — bei einer Taktik-App ist das ungewöhnlich und extrem nützlich:

- Jeder Speichervorgang erzeugt automatisch eine neue Version mit aufsteigender Nummer
- **Versionsvergleich:** Zwei Versionen können verglichen werden — das Backend berechnet automatisch, welche Spieler bewegt wurden
- **Euklidische Distanz:** Ein Spieler gilt als „bewegt", wenn seine Position sich um mehr als 5 Einheiten verändert hat: `√((x₂−x₁)² + (y₂−y₁)²) > 5.0`

```java
double dist = Math.sqrt(Math.pow(p2.x() - p1.x(), 2) + Math.pow(p2.y() - p1.y(), 2));
if (dist > 5.0) {
    playerChanges.add("Player '%s' moved %.1f units".formatted(p1.playerName(), dist));
}
```

### 🔐 USP #3: Ownership-Isolation mit Anti-Enumeration-Schutz

**Warum besonders?** Viele Schulprojekte prüfen nur „ist der User eingeloggt?". Mein Backend geht weiter:

- **404 statt 403:** Wenn ein User versucht, auf die Taktik eines anderen Users zuzugreifen, bekommt er `404 Not Found` — NICHT `403 Forbidden`. Warum? Bei 403 wüsste der Angreifer: „Die Ressource existiert, ich darf nur nicht ran." Bei 404 bekommt er keine Information, ob die Ressource überhaupt existiert. Das verhindert sogenannte **Enumeration-Angriffe**.

```java
private Tactic getOwnedTacticOrThrow(Long id) {
    Tactic tactic = getTacticOrThrow(id);
    User currentUser = getCurrentUser();
    if (currentUser == null || tactic.getUser() == null
            || !tactic.getUser().getId().equals(currentUser.getId())) {
        throw new ResourceNotFoundException("Tactic", id);  // 404, nicht 403!
    }
    return tactic;
}
```

### 🏷️ USP #4: User-spezifisches Tag-System mit AND-Filterung

Tags sind **vollständig user-isoliert**: Ein neuer Account sieht keine Tags, bis er selbst welche erstellt. Tags werden nach dem **Find-or-Create**-Prinzip behandelt: Existiert ein Tag bereits, wird er wiederverwendet — aber der `TagService` zeigt nur jene Tags an, die in den Taktiken des aktuellen Users vorkommen.

**Technische Umsetzung:**
- `TagRepository.findTagsByUserId()` — JPQL-Query mit JOIN über die ManyToMany-Beziehung, gefiltert nach User-ID
- `TacticRepository.findByUserIdAndAllTags()` — User-scoped AND-Filterung mit `GROUP BY` + `HAVING COUNT`
- Usage-Count wird pro User dynamisch berechnet — nicht global

```java
// JPQL: Nur Tags anzeigen, die in Taktiken des aktuellen Users verwendet werden
@Query("SELECT DISTINCT tag FROM TacticTag tag JOIN Tactic t ON tag MEMBER OF t.tags " +
       "WHERE t.user.id = :userId ORDER BY tag.name")
List<TacticTag> findTagsByUserId(@Param("userId") Long userId);
```

**Warum AND-Logik statt OR?** Wenn ein Trainer nach „4-4-2" UND „Defensiv" filtert, will er nur Taktiken, die beides sind — nicht alle, die irgendeines davon sind. Die JPQL-Query nutzt `HAVING COUNT(DISTINCT tag.name) = :tagCount`, um sicherzustellen, dass **alle** angefragten Tags vorhanden sein müssen.

### ⚽ USP #5: FIFA-inspiriertes Spieler-Attributsystem

Jeder Spieler hat 6 Attribute (1–99): Pace, Passing, Shooting, Defending, Physical, Dribbling — mit Bean Validation (`@Min(1) @Max(99)`) sichergestellt. Diese Attribute werden bei der Erstellung und Aktualisierung serverseitig validiert; ungültige Werte führen zu einem `400 Bad Request` mit detaillierter Fehlerliste.

### 🏗️ USP #6: Fullstack-Build als Single JAR

Mit dem Maven-Profil `fullstack` wird das komplette React-Frontend in das Spring-Boot-JAR eingebettet. Das `frontend-maven-plugin` installiert Node.js 20.18.0, führt `npm install` und `npm run build` aus, und kopiert das Build-Ergebnis nach `static/`. Damit lässt sich die gesamte Applikation mit **einem einzigen Befehl** deployen:

```bash
./mvnw clean package -Pfullstack
java -jar target/simulator-0.0.1-SNAPSHOT.jar
# → API + SPA auf Port 8080, kein separater Webserver nötig
```

---

## 3. Architektur & Design-Entscheidungen

### 3.1 Schichtenarchitektur

```
┌─────────────────────────────────────────┐
│            Controller-Schicht           │  ← REST-Endpunkte, Validierung
├─────────────────────────────────────────┤
│             Service-Schicht             │  ← Geschäftslogik, Ownership
├─────────────────────────────────────────┤
│           Repository-Schicht            │  ← Datenzugriff (Spring Data JPA)
├─────────────────────────────────────────┤
│          Datenbank (H2 / PostgreSQL)    │  ← Persistenz
└─────────────────────────────────────────┘
```

**Warum diese klassische Architektur?**
- Klare Trennung der Verantwortlichkeiten (Separation of Concerns)
- Jede Schicht ist unabhängig testbar (Controller mit MockMvc, Services mit Mockito)
- In der Industrie der bewährteste Ansatz für mittlere Projektgrößen

### 3.2 Authentifizierung: JWT (Stateless)

**Entscheidung:** JWT statt Session-basierte Authentifizierung.

**Warum?**
- **Stateless:** Der Server speichert keinen Session-State → horizontal skalierbar
- **Frontend-freundlich:** Token wird im `Authorization: Bearer`-Header mitgeschickt — ideal für Single-Page-Applications
- **CSRF nicht nötig:** Da kein Cookie-basiertes Session-Management existiert, ist CSRF kein Angriffsvektor → CSRF wird deaktiviert
- **Token-Lebensdauer:** 24 Stunden — Kompromiss zwischen Sicherheit und Benutzerfreundlichkeit

**Ablauf:**
1. User registriert sich oder loggt ein → Server generiert JWT mit HMAC-SHA-Signatur
2. Frontend speichert Token und sendet es bei jedem Request im Header
3. `JwtAuthenticationFilter` prüft bei jedem Request den Token und setzt den SecurityContext
4. Bei ungültigem Token: Filter leitet still weiter → Spring Security verweigert den Zugriff

### 3.3 Datenbank-Strategie: Dual-Profile

| Profil | Datenbank | Zweck |
|--------|-----------|-------|
| `default` (dev) | H2 (File-basiert) | Entwicklung ohne externe DB |
| `prod` | PostgreSQL | Produktionsbetrieb |

**Warum H2 als File und nicht In-Memory?** Damit die Daten zwischen Server-Neustarts erhalten bleiben. Der Pfad `~/.tactics-simulator/tactics_db` liegt im Home-Verzeichnis des Users.

### 3.4 DTOs als Java Records

**Entscheidung:** Alle DTOs sind als Java Records implementiert, nicht als Klassen.

**Warum?**
- **Immutability:** Records sind unveränderlich — keine versehentlichen Seiteneffekte
- **Kompaktheit:** Kein Boilerplate (Getter, equals, hashCode, toString werden generiert)
- **Verschachtelte Records:** Request/Response-Objekte werden als innere Records im DTO gruppiert → alles zu einem Feature an einem Ort

```java
public class TacticDto {
    public record TacticResponse(Long id, String uuid, String name, ...) {}
    public record CreateTacticRequest(@NotBlank String name, ...) {}
    public record UpdateTacticRequest(String name, ...) {}
}
```

### 3.5 Error Handling: RFC 9457 (ProblemDetail)

Statt selbst ein Error-Format zu erfinden, nutze ich den **RFC 9457 Standard** (ProblemDetail). Spring Boot 3 bietet dafür native Unterstützung.

```json
{
  "type": "https://api.tactics-simulator.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Tactic with id 42 not found"
}
```

**Warum?** Standardisiert, maschinenlesbar, erweiterbar. Der `GlobalExceptionHandler` fängt alle Exceptions zentral ab und wandelt sie in ProblemDetail um.

### 3.6 Frames als JSON-String in TEXT-Spalte

**Entscheidung:** Die Frame-Daten einer Taktik-Version werden als JSON-String in einer TEXT-Spalte gespeichert — nicht als eigene Tabellen.

**Warum?**
- Frames werden immer als Ganzes geladen und gespeichert (kein partieller Zugriff nötig)
- Die Struktur ist flexibel und kann sich ändern (neue Felder wie `opponents`) ohne DB-Migration
- Weniger Joins bei Abfragen → bessere Performance
- Trade-Off: Keine DB-seitige Abfrage auf Frame-Inhalte möglich (wird nicht benötigt)

### 3.7 Lombok für Entities, Records für DTOs

| Typ | Ansatz | Grund |
|-----|--------|-------|
| Entities | Lombok (`@Builder`, `@Data`, `@RequiredArgsConstructor`) | Entities brauchen Mutability (JPA-Anforderung), Lombok reduziert Boilerplate |
| DTOs | Java Records | DTOs sollen immutable sein, Records sind perfekt dafür |

---

## 4. Klassenübersicht

### 4.1 Konfiguration (`config/`)

#### `SecurityConfig.java`
Die zentrale Sicherheitskonfiguration des Backends. Definiert die komplette HTTP-Security-Pipeline:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .csrf(csrf -> csrf.disable())  // Kein CSRF nötig bei JWT
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()     // Login/Register öffentlich
            .requestMatchers(HttpMethod.GET, "/api/tactics/**").authenticated()  // Lesen erfordert Auth
            .requestMatchers(HttpMethod.GET, "/api/teams/**").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/tags/**").authenticated()     // Tags user-scoped
            .requestMatchers(HttpMethod.POST, "/api/**").authenticated()         // Schreiben immer Auth
            // ...
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
}
```

**Design-Entscheidung:** Der `JwtAuthenticationFilter` wird **vor** dem Standard-`UsernamePasswordAuthenticationFilter` eingehängt. Dadurch wird bei jedem Request zuerst geprüft, ob ein gültiges JWT vorhanden ist, bevor Spring Securitys eigener Mechanismus greift. CSRF ist deaktiviert, weil bei JWT-basierter Auth kein Cookie vorhanden ist, über den ein CSRF-Angriff laufen könnte.

#### `CorsConfig.java`
Definiert Cross-Origin Resource Sharing Regeln. Erlaubt Requests von localhost (alle Ports), LAN-Adressen (192.168.x.x, 10.x.x.x) und Tunnel-Diensten. Wichtig: `Authorization`-Header wird exponiert, damit das Frontend das JWT auslesen kann. Preflight-Cache von 3600 Sekunden (1h) reduziert OPTIONS-Requests.

#### `JwtAuthenticationFilter.java`
Ein `OncePerRequestFilter`, der bei jedem HTTP-Request durchlaufen wird:

1. Extrahiert den `Authorization: Bearer <token>` Header
2. Parst das JWT und extrahiert den Username
3. Lädt die `UserDetails` über den `UserDetailsService`
4. Validiert das Token (Signatur + Expiration + Username-Match)
5. Setzt bei Erfolg ein `UsernamePasswordAuthenticationToken` in den `SecurityContextHolder`

**Wichtig:** Bei ungültigem oder fehlendem Token wird **kein Fehler** geworfen — der Filter leitet still weiter. Die SecurityConfig entscheidet dann, ob der Endpunkt auch ohne Auth zugänglich ist. Der `@Lazy`-Modifier auf `UserDetailsService` verhindert zirkuläre Dependency Injection zwischen Security-Beans.

### 4.2 Controller (`controller/`)

#### `AuthController.java` — `/api/auth`
Verantwortlich für Registrierung und Login. Beide Endpunkte sind öffentlich (kein JWT nötig).

- `POST /register` — Nimmt `RegisterRequest(username, email, password)` entgegen, validiert mit `@Valid`, ruft `userService.register()` auf, generiert JWT mit `jwtService.generateToken()`, gibt `AuthResponse(token, username, email)` zurück. HTTP 200.
- `POST /login` — Nimmt `LoginRequest(username, password)` entgegen, authentifiziert via `authenticationManager.authenticate()`. Bei Erfolg: JWT generieren und zurückgeben. Bei Misserfolg: `BadCredentialsException` → wird vom GlobalExceptionHandler zu HTTP 401 mit deutscher Meldung.

#### `TacticController.java` — `/api/tactics`
Der umfangreichste Controller. Alle Endpunkte erfordern Authentifizierung.

- `GET /` — Akzeptiert optionale Query-Parameter `tags` (Liste) und `search` (String). Der Service filtert automatisch nach dem aktuellen User.
- `POST /` — Erstellt Taktik mit `CreateTacticRequest`. Wenn `frames` mitgegeben wird, wird automatisch eine erste Version (v1) angelegt. Tags werden find-or-create behandelt.
- `PUT /{id}` — Partial Update: Nur die mitgesendeten Felder werden aktualisiert (null-Felder bleiben unverändert).
- `DELETE /{id}` — Cascading Delete: Löscht Taktik inkl. aller Versionen und Tag-Zuordnungen.

#### `TacticVersionController.java` — `/api/tactics/{id}/versions`
- `GET /` — Listet Versionen **ohne** Frame-Daten (Performance-Optimierung für die Übersicht).
- `GET /{vid}` — Einzelne Version **mit** Frame-Daten (kann groß sein).
- `POST /` — Erstellt neue Version mit `@Valid`-Annotation auf dem Request-Body. Versionsnummer wird serverseitig auto-inkrementiert.
- `GET /compare?v1=X&v2=Y` — Versionsvergleich mit Diff-Berechnung.

#### `ExportController.java`
- `POST /api/tactics/{tacticId}/versions/{versionId}/export/gif` — Prüft zuerst Ownership via `tacticService.findById()` (wirft 404 wenn nicht berechtigt), dann delegiert an `GifExportService`. Liefert `byte[]` mit Content-Type `image/gif` und `Content-Disposition: attachment`.

#### `TeamController.java` — `/api/teams`
Standard-REST-Controller. Alle Operationen sind user-scoped: `GET /` liefert nur die eigenen Teams, `PUT`/`DELETE` prüft Ownership.

#### `PlayerController.java`
Gemischte Pfade: `GET/POST` unter `/api/teams/{teamId}/players` (team-gebunden), `PUT/DELETE` unter `/api/players/{id}` (direkt). Kein eigenes Ownership — wird indirekt über das Team geprüft.

#### `TagController.java` — `/api/tags`
- `GET /` — Alle Tags des aktuellen Users mit Usage-Count (wie viele eigene Taktiken den Tag nutzen).
- `GET /{name}/tactics` — Taktiken des aktuellen Users mit diesem Tag.
- **Seit Iteration 5 authentifiziert** — ein neuer Account sieht keine Tags anderer User.

### 4.3 Services (`service/`) — Detailliert

#### `JwtService.java`
Kapselt die gesamte JWT-Logik. Konfiguration via `application.yml`:

```yaml
jwt:
  secret: <base64-encoded-256-bit-key>
  expiration: 86400000  # 24 Stunden in Millisekunden
```

**Methoden:**
- `generateToken(String username)` — Erstellt JWT mit Subject = Username, IssuedAt = jetzt, Expiration = jetzt + 24h, signiert mit HMAC-SHA via `Keys.hmacShaKeyFor()`
- `extractUsername(String token)` — Extrahiert Subject-Claim aus dem Token
- `isTokenValid(String token, String username)` — Prüft: Username im Token == übergebener Username UND Token nicht abgelaufen
- `extractClaim(String token, Function<Claims, T> resolver)` — **Generische Methode:** Akzeptiert eine Lambda-Funktion, die aus den Claims einen beliebigen Wert extrahiert. Macht die Klasse erweiterbar für zukünftige Claims.

**Design-Entscheidung:** Der Secret Key wird als Base64-String konfiguriert und mit `Decoders.BASE64.decode()` in Bytes umgewandelt. Das ist sicherer als ein Plaintext-Secret, weil Base64-Encoding erzwingt, dass der Key die richtige Länge hat.

#### `UserService.java`
Implementiert Spring Securitys `UserDetailsService`-Interface UND die Registrierungslogik:

- `loadUserByUsername(String username)` — Lädt User aus DB, gibt `UserDetails` mit leerer Authority-Liste zurück (kein Rollen-System). Wirft `UsernameNotFoundException` wenn nicht gefunden.
- `register(RegisterRequest request)` — Prüft auf doppelten Username (`existsByUsername`) UND doppelte Email (`existsByEmail`). Fehlermeldungen auf Deutsch: „Benutzername ist bereits vergeben" / „E-Mail-Adresse ist bereits registriert". Passwort wird mit `PasswordEncoder` (BCrypt) gehasht.
- `findByUsername(String username)` — Helper für interne Nutzung.

**Warum kein Rollen-System?** Für dieses Projekt gibt es keinen Use-Case für verschiedene Rollen (Admin, Trainer, etc.). Alle authentifizierten User haben dieselben Rechte. Ownership-Isolation reicht als Berechtigungskonzept aus.

#### `TacticService.java` — Der Kern des Backends
Die komplexeste Service-Klasse mit 5 Dependencies und 10+ Methoden:

**Ownership-Pattern (verwendet in `findById`, `update`, `delete`):**
```java
private Tactic getOwnedTacticOrThrow(Long id) {
    Tactic tactic = getTacticOrThrow(id);         // 1. Taktik laden (404 wenn nicht vorhanden)
    User currentUser = getCurrentUser();           // 2. Aktuellen User aus SecurityContext holen
    if (currentUser == null                        // 3. Ownership prüfen
            || tactic.getUser() == null
            || !tactic.getUser().getId().equals(currentUser.getId())) {
        throw new ResourceNotFoundException(...);  // 4. Gleicher 404-Fehler (Anti-Enumeration)
    }
    return tactic;
}
```

**Tag-Resolution (`resolveTags`):**
```java
private Set<TacticTag> resolveTags(Set<String> tagNames) {
    return tagNames.stream()
        .map(name -> tagRepository.findByName(name)              // Tag existiert? → wiederverwenden
            .orElseGet(() -> tagRepository.save(                  // Tag neu? → anlegen
                TacticTag.builder().name(name).build())))
        .collect(Collectors.toSet());
}
```

**`getCurrentUser()`** — Extrahiert den Username aus dem SecurityContext, lädt den User aus der DB. Gibt `null` zurück für anonyme Requests (kein Exception-Wurf, da `findAll()` in dem Fall einfach eine leere Liste zurückgibt).

**`toDto()`** — Konvertiert Entity in DTO inkl. `latestVersion` (neueste Version via Repository-Query) und `versionCount` (Größe der Versions-Liste). Team-Namen werden aufgelöst, Tags als String-Set extrahiert.

#### `TacticVersionService.java`
Verwaltet Versionen und berechnet Diffs:

- **Auto-Increment:** `findMaxVersionNumberByTacticId` gibt die höchste Versionsnummer zurück (COALESCE auf 0 für die erste Version). Neue Version = max + 1.
- **Compare-Algorithmus:** Parst beide Versionen als `FrameData` via Jackson `ObjectMapper`, dann:
  1. Frame-Anzahl vergleichen → `framesAddedOrRemoved`
  2. Minimum der Frame-Anzahlen nehmen, pro Frame die Spieler matchen (nach `playerId`)
  3. Euklidische Distanz berechnen, bei > 5.0 als „moved" markieren
  4. Ball-Position vergleichen (ebenfalls euklidisch)

#### `GifExportService.java` — Die Rendering-Pipeline im Detail

**Konstanten:**
```java
private static final int WIDTH = 800, HEIGHT = 520;        // Bildgröße
private static final int INTERPOLATION_STEPS = 20;          // Zwischenframes pro Keyframe-Paar
private static final int PLAYER_RADIUS = 15;                // Spieler-Kreisgröße
private static final Color PITCH_GREEN = new Color(0x2D8A4E);
private static final Color HOME_BODY = new Color(0x1E3A5F);  // Dunkelblau
private static final Color AWAY_BODY = new Color(0xDC2626);  // Rot
```

**Rendering-Pipeline:**

1. **`exportGif(tacticId, versionId)`** — Lädt Version, prüft Tactic-Zugehörigkeit, parst JSON → `FrameData`, ruft `renderGif()` auf
2. **`renderGif(FrameData)`** — Erstellt `AnimatedGifEncoder`, iteriert über Frame-Paare (i, i+1), erzeugt pro Paar 20 interpolierte Frames. Letzter Frame wird 10× wiederholt (Endpause). Settings: repeat=0 (Endlos), delay=50ms, quality=10
3. **`renderInterpolatedFrame(from, to, t)`** — Zeichnet ein einzelnes Bild:
   - `drawPitch(g)` — Grüner Hintergrund, weiße Linien, Mittelkreis (r=50px), Strafräume (120×240px), Torräume (40×120px)
   - `drawRoster(g, from, to, t, HOME_BODY)` — Heimmannschaft
   - `drawRoster(g, from, to, t, AWAY_BODY)` — Gastmannschaft (opponents)
   - `drawBall(g, from, to, t)` — Ball
4. **`drawRoster(g, fromRoster, toRoster, t, bodyColor)`** — Pro Spieler:
   - Position interpolieren: `x = lerp(fromX, toX, t)`, `y = lerp(fromY, toY, t)`
   - 0–100% → Pixel: `px = MARGIN + (x/100) × (WIDTH - 2×MARGIN)`
   - Äußerer Ring: Positionsfarbe (GK=Gelb, DEF=Blau, MID=Grün, ATK=Rot), r=PLAYER_RADIUS+2
   - Innerer Kreis: Team-Farbe (HOME_BODY oder AWAY_BODY), r=PLAYER_RADIUS
   - Trikotnummer: Weiß, fett, zentriert (via `FontMetrics`)
   - Name: Unterhalb des Kreises, max 14 Zeichen (abgeschnitten mit „...")

#### `TeamService.java`
Analoges Ownership-Pattern wie TacticService. `findAll()` gibt nur Teams des aktuellen Users zurück, sortiert nach `createdAt DESC`. `toDto()` inkludiert alle Spieler als verschachtelte `PlayerDto`-Liste.

#### `PlayerService.java`
Einfacher CRUD-Service. Keine eigene Ownership-Prüfung — Spieler gehören zu Teams, und Team-Zugriff wird über den TeamService kontrolliert. Bei Create/Update werden alle 6 Attribute (pace, passing, shooting, defending, physical, dribbling) + position, name, number, imageUrl, notes übernommen.

#### `TagService.java`
**User-scoped seit Iteration 5:** Zeigt nur Tags an, die in den Taktiken des aktuellen Users vorkommen. Ein neuer Account sieht eine leere Tag-Liste, bis er selbst Taktiken mit Tags erstellt. Usage-Count wird pro User berechnet.

### 4.4 Entities (`model/`)

#### ER-Diagramm (vereinfacht)

```
┌──────────┐      ┌───────────┐      ┌─────────────────┐
│   User   │1───n │  Tactic   │1───n │  TacticVersion  │
│──────────│      │───────────│      │─────────────────│
│ id       │      │ id        │      │ id              │
│ username │      │ uuid      │      │ versionNumber   │
│ email    │      │ name      │      │ label           │
│ password │      │ description│      │ frames (JSON)   │
│ createdAt│      │ createdAt │      │ createdAt       │
└──────────┘      │ updatedAt │      └─────────────────┘
      │1          └─────┬─────┘
      │                 │m───n
      │n          ┌─────┴─────┐
┌──────────┐      │ TacticTag │
│   Team   │      │───────────│
│──────────│      │ id        │
│ id       │      │ name      │
│ name     │      └───────────┘
│ colors   │
│ createdAt│
└────┬─────┘
     │1───n
┌──────────┐
│  Player  │
│──────────│
│ id       │
│ name     │
│ number   │
│ position │
│ 6 Attrs  │
└──────────┘
```

#### `User.java`
- **Felder:** `id` (auto-increment), `username` (unique, 3–50 Zeichen, `@NotBlank`), `email` (unique, `@Email`), `password` (BCrypt-gehasht), `createdAt` (`@PrePersist`)
- **Tabelle:** `users`
- **Keine Beziehungen direkt** — wird von Tactic und Team referenziert
- **Design:** Kein `updatedAt`, weil User-Daten nach der Registrierung nicht geändert werden

#### `Tactic.java`
- **Felder:** `id`, `uuid` (auto-generiert via `@PrePersist`, unique — für externe Referenzierung), `name` (`@NotBlank`), `description`, `isPublic` (default false), `createdAt` (`@CreationTimestamp`), `updatedAt` (`@UpdateTimestamp`)
- **Beziehungen:**
  - `ManyToOne` → `User` (Besitzer, LAZY)
  - `ManyToOne` → `Team` als Heimmannschaft (optional, LAZY)
  - `ManyToOne` → `Team` als Gastmannschaft (`opponentTeam`, optional, LAZY)
  - `ManyToMany` → `TacticTag` über Join-Tabelle `tactic_tag_mapping`
  - `OneToMany` → `TacticVersion` mit `CascadeType.ALL` + `orphanRemoval` (Taktik löschen = alle Versionen löschen)
- **Design:** UUID dient als stabile externe ID (z.B. für Sharing-Links). Die DB-ID (`Long`) ist für interne Referenzen.

#### `TacticVersion.java`
- **Felder:** `id`, `versionNumber` (auto-increment pro Taktik), `label` (z.B. „Initial version"), `frames` (`@Column(columnDefinition = "TEXT")` — JSON-String), `createdAt`
- **Beziehung:** `ManyToOne` → `Tactic`
- **Design:** Frames als TEXT-Spalte ermöglicht flexible Schema-Änderungen ohne DB-Migration. Der JSON-String wird erst beim GIF-Export oder Versionsvergleich geparst (Lazy Deserialisierung).

#### `Team.java`
- **Felder:** `id`, `name`, `primaryColor`, `secondaryColor` (Hex-Farbcodes für Trikots), `logoUrl`, `createdAt`
- **Beziehungen:** `ManyToOne` → `User`, `OneToMany` → `Player` (cascade ALL, orphanRemoval)
- **Design:** `orphanRemoval = true` bedeutet: Wenn ein Spieler aus der Liste entfernt wird, wird er auch aus der DB gelöscht. Cascade ALL sorgt dafür, dass beim Team-Delete alle Spieler automatisch mitgelöscht werden.

#### `Player.java`
- **Felder:** `id`, `name`, `number` (1–99), `position` (Enum), 6 Attribute (`pace`, `passing`, `shooting`, `defending`, `physical`, `dribbling`, je 1–99), `imageUrl`, `notes` (max 2000 Zeichen)
- **Beziehung:** `ManyToOne` → `Team`
- **Validierung:** `@Min(1) @Max(99)` auf allen Attributen und der Trikotnummer

#### `TacticTag.java`
- **Felder:** `id`, `name` (unique, `@NotBlank`)
- **Tabelle:** `tactic_tags`
- **Design:** Einfaches Label-Entity. Die Einzigartigkeit des Namens verhindert doppelte Tags in der DB. Die ManyToMany-Beziehung wird auf der Tactic-Seite definiert.

#### `Position.java` (Enum)
12 Positionen: `GK` (Torhüter), `CB`, `LB`, `RB` (Verteidigung), `CDM`, `CM`, `CAM`, `LM`, `RM` (Mittelfeld), `LW`, `RW`, `ST` (Angriff). Wird im GifExportService für positionsbasierte Farben verwendet.

### 4.5 DTOs (`dto/`)

| Klasse | Enthält | Pattern |
|--------|---------|---------|
| `TacticDto` | TacticResponse, CreateTacticRequest, UpdateTacticRequest | Verschachtelte Records in Container-Klasse |
| `TacticVersionDto` | VersionResponse, CreateVersionRequest | Auto-Versionsnummer wird serverseitig gesetzt |
| `VersionCompareDto` | CompareResponse, DiffSummary | Diff-Ergebnis mit Player- und Ball-Changes |
| `TeamDto` | TeamResponse, CreateTeamRequest, UpdateTeamRequest | Players als verschachtelte Liste |
| `PlayerDto` | PlayerResponse, CreatePlayerRequest, UpdatePlayerRequest | Bean Validation (@Min/@Max) für Attribute |
| `AuthDto` | RegisterRequest, LoginRequest, AuthResponse | Token + User-Info in AuthResponse |
| `TagDto` | TagResponse | Dynamischer usageCount |
| `FrameData` | FrameData, Frame, PlayerPosition, BallPosition | Jackson-Deserialisierung mit @JsonIgnoreProperties |

### 4.6 Exceptions (`exception/`)

#### `GlobalExceptionHandler.java` — Zentraler `@RestControllerAdvice`
Fängt alle Exceptions ab und wandelt sie in RFC 9457 ProblemDetail um. Handler:

| Exception | HTTP-Status | Besonderheit |
|-----------|-------------|--------------|
| `ResourceNotFoundException` | 404 | Auch für Ownership-Verletzungen (Anti-Enumeration) |
| `InvalidLineupException` | 400 | Enthält `errors`-Liste mit mehreren Fehlern gleichzeitig |
| `IllegalArgumentException` | 400 | Allgemeine Business-Logic-Fehler |
| `BadCredentialsException` | 401 | Deutsche Meldung: „Ungültige Anmeldedaten" |
| `UsernameNotFoundException` | 401 | Deutsche Meldung: „Ungültige Anmeldedaten" (gleich wie oben — kein Hinweis ob User existiert) |
| `AuthenticationException` | 401 | Catch-all für Auth-Fehler |
| `MethodArgumentNotValidException` | 400 | Bean-Validation-Fehler mit feldweiser Fehlerliste |

**Beispiel-Antwort bei Validierungsfehler:**
```json
{
  "type": "https://api.tactics-simulator.com/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request validation failed",
  "errors": {
    "name": "must not be blank",
    "number": "must be between 1 and 99"
  }
}
```

**Design-Entscheidung:** `BadCredentialsException` und `UsernameNotFoundException` liefern **dieselbe Fehlermeldung**. Warum? Wenn man bei falschem Passwort „Passwort falsch" und bei falschem Username „User nicht gefunden" sagen würde, könnte ein Angreifer gültige Usernames erraten. So bekommt er immer nur „Ungültige Anmeldedaten".

#### `ResourceNotFoundException.java`
Einfache `RuntimeException` mit formatierter Message: `"<Type> with id <id> not found"`. Wird AUCH geworfen wenn eine Ressource existiert, aber einem anderen User gehört → **Anti-Enumeration**.

#### `InvalidLineupException.java`
`RuntimeException` mit `List<String> errors`. Ermöglicht das Sammeln mehrerer Validierungsfehler in einem Request (z.B. „Nicht genau 11 Spieler", „Kein Torhüter", „Doppelte Trikotnummer").

### 4.7 Repositories (`repository/`)

Alle Repositories erweitern `JpaRepository` und nutzen Spring Data JPAs Query-Derivation oder `@Query`-Annotationen für komplexere Abfragen.

#### `UserRepository`
- `findByUsername(String)` — Für Login und SecurityContext-Auflösung
- `existsByUsername(String)` / `existsByEmail(String)` — Duplikat-Prüfung bei Registrierung

#### `TacticRepository` (auch `JpaSpecificationExecutor`)
- `findByUserIdOrderByUpdatedAtDesc(Long userId)` — Alle Taktiken eines Users, neueste zuerst
- `findByAllTags(List<String>, long tagCount)` — JPQL AND-Tag-Filterung (global)
- `findByUserIdAndAllTags(Long userId, List<String>, long tagCount)` — User-scoped AND-Tag-Filterung
- `searchByUser(Long userId, String search)` — Freitextsuche in Name und Description, user-scoped
- `findByUuid(UUID)` — Suche nach externer UUID

**JPQL-Highlight (AND-Tag-Filterung):**
```sql
SELECT t FROM Tactic t JOIN t.tags tag
WHERE t.user.id = :userId AND tag.name IN :tagNames
GROUP BY t HAVING COUNT(DISTINCT tag.name) = :tagCount
```
Dieses Query findet nur Taktiken, die **alle** angefragten Tags besitzen. Der Trick: `HAVING COUNT = tagCount` stellt sicher, dass die Anzahl der matchenden Tags gleich der Anzahl der angefragten Tags ist.

#### `TacticVersionRepository`
- `findByTacticIdOrderByVersionNumberDesc(Long)` — Alle Versionen einer Taktik
- `findFirstByTacticIdOrderByVersionNumberDesc(Long)` — Nur die neueste Version (für `latestVersion` im TacticDto)
- `findMaxVersionNumberByTacticId(Long)` — `@Query("SELECT COALESCE(MAX(v.versionNumber), 0) ...")` für Auto-Increment

#### `TeamRepository`
- `findByUserIdOrderByCreatedAtDesc(Long)` — Alle Teams eines Users

#### `PlayerRepository`
- `findByTeamId(Long)` — Alle Spieler eines Teams

#### `TagRepository`
- `findByName(String)` — Tag nach Name suchen (für find-or-create)
- `findTagsByUserId(Long userId)` — JPQL: Nur Tags, die in Taktiken des Users verwendet werden

---

### 4.8 Datenfluss: Vom HTTP-Request zum GIF

Als konkretes Beispiel der vollständige Datenfluss eines GIF-Exports:

```
1. Frontend: POST /api/tactics/5/versions/3/export/gif
   → Authorization: Bearer eyJhbGciOiJIUz...
   
2. JwtAuthenticationFilter:
   → Token extrahieren → "paul" → UserDetails laden → SecurityContext setzen
   
3. SecurityConfig:
   → POST /api/** → authenticated() → ✅ User ist authentifiziert
   
4. ExportController.exportGif(tacticId=5, versionId=3):
   → tacticService.findById(5)  ← Ownership-Check (wirft 404 wenn nicht Paul's)
   → gifExportService.exportGif(5, 3)
   
5. GifExportService.exportGif(5, 3):
   → Version aus DB laden → tactic.id == 5 prüfen
   → JSON-Frames parsen via ObjectMapper → FrameData
   → renderGif(frameData)
   
6. GifExportService.renderGif(frameData):
   → AnimatedGifEncoder starten
   → Für jedes Frame-Paar (i, i+1):
     → Für t = 0.0, 0.05, 0.10, ..., 0.95 (20 Schritte):
       → renderInterpolatedFrame(frame[i], frame[i+1], t)
         → drawPitch() → drawRoster(home) → drawRoster(away) → drawBall()
       → encoder.addFrame(bufferedImage)
   → Letzten Frame 10× wiederholen (Endpause)
   → encoder.finish() → byte[]
   
7. ExportController:
   → ResponseEntity<byte[]> mit Content-Type: image/gif
   → Content-Disposition: attachment; filename="tactic_5_v3.gif"
   
8. Frontend: Download startet
```

---

## 5. API-Endpunkte

### Authentifizierung
| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| POST | `/api/auth/register` | ❌ | Neuen User registrieren |
| POST | `/api/auth/login` | ❌ | Einloggen, JWT erhalten |

### Taktiken
| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| GET | `/api/tactics` | ✅ | Alle eigenen Taktiken (optional: `?tags=x,y&search=text`) |
| GET | `/api/tactics/{id}` | ✅ | Einzelne Taktik |
| POST | `/api/tactics` | ✅ | Neue Taktik erstellen |
| PUT | `/api/tactics/{id}` | ✅ | Taktik aktualisieren |
| DELETE | `/api/tactics/{id}` | ✅ | Taktik löschen |

### Versionen
| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| GET | `/api/tactics/{id}/versions` | ✅ | Alle Versionen (Metadaten) |
| GET | `/api/tactics/{id}/versions/{vid}` | ✅ | Version mit Frame-Daten |
| POST | `/api/tactics/{id}/versions` | ✅ | Neue Version erstellen |
| GET | `/api/tactics/{id}/versions/compare?v1=X&v2=Y` | ✅ | Versionsvergleich |

### Teams & Spieler
| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| GET | `/api/teams` | ✅ | Alle eigenen Teams |
| POST | `/api/teams` | ✅ | Neues Team erstellen |
| GET/PUT/DELETE | `/api/teams/{id}` | ✅ | Team CRUD |
| GET | `/api/teams/{id}/players` | ✅ | Spieler eines Teams |
| POST | `/api/teams/{id}/players` | ✅ | Spieler erstellen |
| PUT/DELETE | `/api/players/{id}` | ✅ | Spieler bearbeiten/löschen |

### Export & Tags
| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| POST | `/api/tactics/{id}/versions/{vid}/export/gif` | ✅ | GIF exportieren |
| GET | `/api/tags` | ✅ | Eigene Tags mit Usage-Count (user-scoped) |
| GET | `/api/tags/{name}/tactics` | ✅ | Eigene Taktiken nach Tag (user-scoped) |

---

## 6. Testing

### Teststrategie

- **Controller-Tests:** `@WebMvcTest` + `@Import(SecurityConfig.class)` — testet HTTP-Layer inkl. Security-Regeln mit MockMvc
- **Service-Tests:** `@ExtendWith(MockitoExtension.class)` — reine Unit-Tests mit gemockten Dependencies
- **SecurityContext-Setup:** In Service-Tests wird der SecurityContext manuell gesetzt, um den eingeloggten User zu simulieren

### Testabdeckung (79 Tests)

| Testklasse | Tests | Abdeckung |
|------------|-------|-----------|
| `TacticServiceTest` | 10 | findAll, Tag-Filter, Search, Ownership, CRUD, Tag-Resolution |
| `TeamServiceTest` | 9 | CRUD, Ownership, Empty-User, Fremd-Team-Zugriff |
| `UserServiceTest` | 5 | Login, Register, Duplikate |
| `JwtServiceTest` | 5 | Generate, Extract, Validate, Expired |
| `TacticVersionServiceTest` | 6 | CRUD, Tactic-Mismatch, Compare |
| `GifExportServiceTest` | 4 | Export (Magic-Byte-Prüfung), Version-Not-Found, Tactic-Mismatch, Invalid-JSON |
| `AuthControllerTest` | 5 | Register, Invalid-Register, Duplicate, Login, Bad-Credentials |
| `TacticControllerTest` | 8 | CRUD + Security (403 bei Unauth) |
| `TeamControllerTest` | 7 | CRUD + Security |
| `PlayerControllerTest` | 5 | CRUD + Security |
| `ExportControllerTest` | 5 | Export + Security |
| `TacticVersionControllerTest` | 5 | CRUD + Security |
| `TagControllerTest` | 5 | Tag-Abfragen |

### Good-Case vs. Bad-Case Beispiele

```java
// ═══════════════════════════════════════════════════════════════
// Good Case: Erfolgreicher GIF-Export — prüft Magic Bytes
// ═══════════════════════════════════════════════════════════════
@Test
void shouldExportGif() {
    when(repository.findById(1L)).thenReturn(Optional.of(version));
    byte[] gif = service.exportGif(1L, 1L);
    // GIF89a ist der Standard-Header jedes gültigen GIF-Files
    assertThat(gif[0]).isEqualTo((byte) 'G');
    assertThat(gif[1]).isEqualTo((byte) 'I');
    assertThat(gif[2]).isEqualTo((byte) 'F');
}

// ═══════════════════════════════════════════════════════════════
// Bad Case: Zugriff auf fremde Taktik → 404 (Anti-Enumeration)
// ═══════════════════════════════════════════════════════════════
@Test
void shouldThrowWhenAccessingOtherUsersTactic() {
    tactic.setUser(otherUser);  // Taktik gehört anderem User
    when(tacticRepository.findById(1L)).thenReturn(Optional.of(tactic));
    // Muss 404 werfen, NICHT 403 — Angreifer darf nicht wissen, dass die Taktik existiert
    assertThrows(ResourceNotFoundException.class, () -> service.findById(1L));
}

// ═══════════════════════════════════════════════════════════════
// Bad Case: Ungültiges JSON in Frame-Daten → Exception
// ═══════════════════════════════════════════════════════════════
@Test
void shouldThrowWhenFrameDataIsInvalidJson() {
    version.setFrames("not-valid-json");
    when(repository.findById(1L)).thenReturn(Optional.of(version));
    assertThrows(RuntimeException.class, () -> service.exportGif(1L, 1L));
}

// ═══════════════════════════════════════════════════════════════
// Bad Case: Kein User eingeloggt → leere Liste (kein Crash)
// ═══════════════════════════════════════════════════════════════
@Test
void shouldReturnEmptyListWhenNoUser() {
    SecurityContextHolder.clearContext();  // Kein User
    List<TeamDto> result = teamService.findAll();
    assertThat(result).isEmpty();  // Graceful degradation, kein 500er
}

// ═══════════════════════════════════════════════════════════════
// Bad Case: Doppelter Username bei Registrierung
// ═══════════════════════════════════════════════════════════════
@Test
void shouldThrowWhenDuplicateUsername() {
    when(userRepository.existsByUsername("paul")).thenReturn(true);
    assertThrows(IllegalArgumentException.class, 
        () -> userService.register(new RegisterRequest("paul", "p@mail.com", "pass")));
}

// ═══════════════════════════════════════════════════════════════
// Good Case: JWT generieren und validieren
// ═══════════════════════════════════════════════════════════════
@Test
void shouldGenerateAndValidateToken() {
    String token = jwtService.generateToken("paul");
    assertThat(jwtService.extractUsername(token)).isEqualTo("paul");
    assertThat(jwtService.isTokenValid(token, "paul")).isTrue();
    assertThat(jwtService.isTokenValid(token, "other")).isFalse();  // Falscher User
}
```

### Testarchitektur-Patterns

**Controller-Tests:**
```java
@WebMvcTest(TacticController.class)           // Nur Web-Layer starten
@Import(SecurityConfig.class)                  // Security-Regeln mittesten
class TacticControllerTest {
    @Autowired MockMvc mockMvc;                // HTTP-Simulation
    @MockitoBean TacticService tacticService;  // Service mocken
    @MockitoBean JwtService jwtService;        // JWT mocken
    @MockitoBean UserService userService;      // UserDetailsService mocken
}
```

**Service-Tests:**
```java
@ExtendWith(MockitoExtension.class)            // Kein Spring-Context, reine Unit-Tests
class TacticServiceTest {
    @Mock TacticRepository tacticRepository;    // Dependencies mocken
    @InjectMocks TacticService tacticService;   // SUT (System Under Test)
    
    @BeforeEach
    void setUp() {
        // SecurityContext manuell setzen — simuliert eingeloggten User
        var auth = new UsernamePasswordAuthenticationToken("testuser", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
```

---

## 7. Abhängigkeiten (Dependencies)

| Dependency | Version | Zweck |
|-----------|---------|-------|
| `spring-boot-starter-web` | 3.4.4 | REST-API, Embedded Tomcat, JSON-Serialisierung (Jackson) |
| `spring-boot-starter-data-jpa` | 3.4.4 | JPA/Hibernate ORM, Spring Data Repositories |
| `spring-boot-starter-security` | 3.4.4 | Authentifizierung, Autorisierung, Filter-Chain |
| `spring-boot-starter-validation` | 3.4.4 | Jakarta Bean Validation (`@NotBlank`, `@Min`, `@Max`, etc.) |
| `jjwt-api` + `jjwt-impl` + `jjwt-jackson` | 0.12.6 | JWT-Token erstellen, signieren, parsen (HMAC-SHA) |
| `animated-gif-lib` | 1.4 | GIF89a-Encodierung für den serverseitigen Export |
| `h2` | (runtime) | Eingebettete Datenbank für Entwicklung |
| `postgresql` | (runtime) | PostgreSQL-Treiber für Produktion |
| `lombok` | (provided) | Boilerplate-Reduktion: `@Builder`, `@Getter`, `@RequiredArgsConstructor` |
| `spring-boot-starter-test` | 3.4.4 | JUnit 5, MockMvc, Mockito, AssertJ |
| `spring-security-test` | 3.4.4 | `@WithMockUser`, Security-Test-Utilities |

**Warum `jjwt` statt Spring Securitys eigenes OAuth2?** Weil dieses Projekt keinen OAuth2-Provider braucht (kein Google/GitHub-Login). jjwt ist leichtgewichtig und gibt mir volle Kontrolle über die Token-Erstellung, ohne den Overhead eines kompletten OAuth2-Stacks.

**Warum `animated-gif-lib` statt javax.imageio?** Javas eingebauter `ImageIO.write()` kann nur statische GIFs erzeugen. Für animierte GIFs mit konfigurierbarem Delay und Loop braucht man eine Bibliothek, die den GIF89a-Standard vollständig implementiert.

---

## 8. Deployment & Build

### Entwicklung (zwei Terminals)

```bash
# Terminal 1: Backend
cd backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Fullstack-Build (Single JAR)

```bash
cd backend
./mvnw clean package -Pfullstack
java -jar target/simulator-0.0.1-SNAPSHOT.jar
```

Das `fullstack`-Maven-Profil:
1. Installiert Node.js 20.18.0 via `frontend-maven-plugin`
2. Führt `npm install` und `npm run build` im Frontend aus
3. Kopiert `frontend/dist/` nach `static/` im JAR
4. Spring Boot serviert API + SPA auf Port 8080

### Produktion

```bash
java -jar simulator-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Erfordert eine laufende PostgreSQL-Instanz auf `localhost:5432`.

---

## 9. Präsentationstranskript (15 Minuten)

> **Hinweis:** Dieses Transkript ist für eine 15-minütige Präsentation gedacht, die ausschließlich das Backend behandelt. Es beginnt mit den Features, auf die ich besonders stolz bin.

---

### Folie 1: Titel (0:00–0:30)

*„Guten Tag, mein Name ist Paul Hochleitner und ich präsentiere heute das Backend meines Diplomarbeitsprojekts: den Football Tactics Simulator. Das ist eine Webanwendung, mit der man Fußball-Taktiken interaktiv erstellen, animieren und exportieren kann. Ich werde in den nächsten 15 Minuten ausschließlich das Backend erklären — die Technologien, die Architektur und vor allem die Features, auf die ich besonders stolz bin."*

---

### Folie 2: Tech-Stack (0:30–1:30)

*„Zunächst zum Tech-Stack: Das Backend basiert auf Spring Boot 3.4.4 mit Java 21. Als Datenbank verwende ich H2 im Entwicklungsmodus — das ist eine eingebettete Java-Datenbank, die als File gespeichert wird, sodass ich keine externe Datenbank installieren muss. Für die Produktion ist PostgreSQL konfiguriert — das lässt sich über Spring Profiles umschalten.*

*Für die Authentifizierung nutze ich JWT — JSON Web Tokens — mit der jjwt-Bibliothek. Die Datenzugriffsschicht basiert auf Spring Data JPA, und für Validierung verwende ich Jakarta Bean Validation. Außerdem setze ich Lombok ein, um Boilerplate-Code bei den Entity-Klassen zu reduzieren, und Java Records für meine DTOs, die dadurch automatisch immutable sind."*

---

### Folie 3: USP — GIF-Export (1:30–4:30)

*„Jetzt zu dem Feature, auf das ich am meisten stolz bin: der serverseitige GIF-Export. Wenn ein User eine Taktik mit mehreren Frames erstellt — also Spieler von Position A nach Position B bewegt — kann er diese Animation als animiertes GIF exportieren.*

*Das Besondere daran: Das GIF wird komplett auf dem Server gerendert, mit Java2D. Die meisten Webapps würden das im Browser machen, aber ich habe mich bewusst für den Server entschieden. Warum? Erstens Konsistenz — jedes GIF sieht auf jedem Gerät gleich aus. Zweitens hatte ich damit die volle Kontrolle über das Rendering.*

*Wie funktioniert das technisch? Der User hat im Frontend Keyframes definiert — sagen wir, Frame 1 und Frame 2 mit verschiedenen Spielerpositionen. Zwischen diesen Keyframes berechne ich 20 Zwischenframes durch lineare Interpolation — also Lerp. Die Formel ist einfach: `a + (b - a) * t`, wobei t von 0 bis 1 geht. Damit bewegen sich die Spieler flüssig über das Feld.*

*Für das Rendering zeichne ich zuerst das Spielfeld: Außenlinien, Mittellinie, Mittelkreis, Strafräume, Torräume — alles mathematisch berechnet auf einem 800 mal 520 Pixel großen Bild. Dann kommen die Spieler: Jeder Spieler wird als Kreis gerendert mit einem positionsabhängigen Farbring — Torhüter gelb, Verteidiger blau, Mittelfeld grün, Angriff rot. Die Trikotnummer wird zentriert darauf geschrieben, der Name darunter.*

*Das System unterstützt auch Dual-Roster-Rendering: Heimmannschaft in Dunkelblau, Gastmannschaft in Rot. Der Ball ist ein schwarzer Kreis mit weißem Kern.*

*Der letzte Keyframe wird 10 Mal wiederholt, damit man am Ende der Animation eine Pause hat, bevor sie von vorne beginnt. Das Ganze wird mit der animated-gif-lib-Bibliothek in ein echtes GIF89a encodiert, das der User dann herunterladen kann."*

---

### Folie 4: USP — Versionierung (4:30–6:30)

*„Das zweite Feature, das ich hervorheben möchte, ist die Taktik-Versionierung. Jedes Mal, wenn eine Taktik gespeichert wird, wird automatisch eine neue Version erstellt mit einer aufsteigenden Versionsnummer. Die Versionsnummer wird serverseitig berechnet — ich verwende dafür eine JPQL-Query mit COALESCE, die die höchste bestehende Nummer findet und eins addiert.*

*Was das Ganze besonders macht, ist der Versionsvergleich. Man kann zwei beliebige Versionen vergleichen, und das Backend berechnet automatisch einen Diff. Dafür parse ich die JSON-Frame-Daten beider Versionen, iteriere über die Spieler und berechne die euklidische Distanz zwischen den Positionen. Wenn ein Spieler sich um mehr als 5 Einheiten bewegt hat, wird das als relevante Änderung gemeldet.*

*Das System berichtet auch, ob sich die Anzahl der Frames geändert hat und ob sich die Ball-Position verändert hat. Das ist ähnlich wie ein Git-Diff, aber für Taktik-Animationen. Das Ergebnis wird als strukturiertes JSON zurückgegeben mit Listen von Änderungen.*

*Warum habe ich das gemacht? Weil ein Trainer sehen können soll, was sich zwischen zwei Versionen seiner Taktik geändert hat, ohne beide manuell vergleichen zu müssen."*

---

### Folie 5: USP — Sicherheit & Ownership (6:30–8:30)

*„Zum Thema Sicherheit: Ich verwende JWT-basierte Authentifizierung. Das heißt, der Server ist komplett stateless — es gibt keine Sessions. Das JWT wird mit HMAC-SHA signiert und hat eine Lebensdauer von 24 Stunden.*

*Was ich besonders durchdacht habe, ist das Ownership-Konzept. Jede Taktik und jedes Team gehört genau einem User. Wenn man versucht, auf eine fremde Ressource zuzugreifen, bekommt man bewusst einen 404-Fehler, nicht einen 403. Das ist eine Sicherheitsentscheidung: Bei einem 403 würde ein Angreifer wissen, dass die Ressource existiert. Bei einem 404 bekommt er keine Information darüber, ob diese ID überhaupt vergeben ist. Das nennt man Anti-Enumeration-Schutz.*

*Dafür habe ich in jedem Service eine Methode — zum Beispiel `getOwnedTacticOrThrow` — die zuerst die Ressource lädt, dann prüft ob der aktuelle User der Besitzer ist, und falls nicht, eine ResourceNotFoundException wirft — also denselben Fehler wie wenn die Ressource nicht existieren würde.*

*Außerdem habe ich bei der Security-Konfiguration darauf geachtet, dass ALLE Endpunkte — sowohl lesend als auch schreibend — eine Authentifizierung erfordern. Die einzige Ausnahme sind Login und Registrierung — das ist logisch, weil man sich ja erst einloggen muss, bevor man ein Token hat. Sogar die Tags sind user-scoped: Ein neuer Account sieht eine leere Tag-Liste, bis er selbst Taktiken mit Tags erstellt. Nichts wird zwischen Usern geteilt."*

---

### Folie 6: Architektur (8:30–10:00)

*„Die Architektur des Backends folgt der klassischen Drei-Schichten-Architektur: Controller, Service, Repository. Jeder Controller nimmt HTTP-Requests entgegen und delegiert an den Service. Der Service enthält die Geschäftslogik und ruft das Repository auf. Das Repository kommuniziert mit der Datenbank über Spring Data JPA.*

*Warum diese Architektur? Sie ist erprobt, übersichtlich und vor allem testbar. Controller kann ich mit MockMvc testen, Services mit Mockito — völlig unabhängig voneinander.*

*Für meine DTOs verwende ich Java Records. Das sind seit Java 16 verfügbare unveränderliche Datenklassen. Ich gruppiere zusammengehörige Request- und Response-Objekte als verschachtelte Records in einer Container-Klasse — zum Beispiel enthält `TacticDto` sowohl den `CreateTacticRequest` als auch die `TacticResponse`. So ist alles, was zu einem Feature gehört, an einem Ort.*

*Für das Error-Handling nutze ich den RFC 9457 Standard — ProblemDetail. Das ist ein standardisiertes JSON-Format für Fehlermeldungen. Alle Exceptions werden von einem zentralen `GlobalExceptionHandler` abgefangen und in dieses Format umgewandelt."*

---

### Folie 7: Datenmodell (10:00–11:30)

*„Zum Datenmodell: Im Zentrum stehen fünf Entities. Der User hat einen einzigartigen Username und eine E-Mail. Eine Tactic gehört zu einem User und kann optional ein Heim- und ein Gastteam referenzieren. Über eine ManyToMany-Beziehung können Tags zugeordnet werden.*

*Jede Tactic hat mehrere TacticVersions. Eine Version enthält die Frame-Daten als JSON-String in einer TEXT-Spalte. Warum JSON und nicht eigene Tabellen? Weil die Frame-Daten immer als Ganzes geladen und gespeichert werden. Es gibt keinen Use-Case, bei dem ich einen einzelnen Frame aus der Datenbank abfragen müsste. Außerdem erlaubt mir das JSON-Format, die Struktur flexibel zu erweitern — zum Beispiel habe ich das `opponents`-Feld nachträglich hinzugefügt, ohne eine Datenbankmigration zu benötigen.*

*Ein Team hat mehrere Player — mit CascadeType.ALL und orphanRemoval, das heißt wenn ein Team gelöscht wird, werden automatisch alle Spieler mitgelöscht. Jeder Player hat neben Name und Nummer sechs FIFA-inspirierte Attribute von 1 bis 99."*

---

### Folie 8: Tag-System (11:30–12:30)

*„Das Tag-System erlaubt es, Taktiken zu kategorisieren. Tags werden nach dem Find-or-Create-Prinzip behandelt: Wenn ich beim Erstellen einer Taktik den Tag ‚Konterangriff' angebe und dieser Tag schon existiert, wird der bestehende wiederverwendet. Wenn nicht, wird er automatisch angelegt.*

*Wichtig dabei: Auch die Tags sind vollständig user-isoliert. Ein neuer Account sieht überhaupt keine Tags — erst wenn er selbst Taktiken mit Tags erstellt, tauchen diese auf. Das habe ich über eine JPQL-Query gelöst, die nur Tags zurückgibt, die in Taktiken des aktuellen Users verwendet werden.*

*Die Filterung nach Tags nutzt AND-Logik. Das heißt, wenn ich nach den Tags ‚4-4-2' und ‚Defensiv' filtere, bekomme ich nur Taktiken, die BEIDE Tags haben. Das ist ebenfalls über JPQL gelöst — mit einem JOIN, GROUP BY und HAVING COUNT, der sicherstellt, dass die Anzahl der matchenden Tags gleich der Anzahl der angefragten Tags ist.*

*Zusätzlich gibt es einen Endpunkt, der alle eigenen Tags mit ihrem Usage-Count zurückgibt — also wie viele der eigenen Taktiken jeden Tag nutzen. Das ist nützlich, damit man im Frontend sieht, welche Tags am häufigsten verwendet werden."*

---

### Folie 9: Testing (12:30–14:00)

*„Zum Testing: Mein Backend hat 79 automatisierte Tests. Die sind aufgeteilt in Controller-Tests und Service-Tests.*

*Controller-Tests nutzen `@WebMvcTest` mit MockMvc. Das startet nur den Web-Layer, nicht die gesamte Applikation. Ich importiere dabei die SecurityConfig, damit die Security-Regeln mitgetestet werden. So kann ich verifizieren, dass unauthentifizierte Requests tatsächlich abgelehnt werden.*

*Service-Tests nutzen Mockito — die Dependencies werden gemockt, damit ich reine Unit-Tests habe. Dabei teste ich sowohl Good-Cases als auch Bad-Cases. Zum Beispiel teste ich beim GifExportService nicht nur, ob ein gültiges GIF zurückkommt — ich prüfe sogar die Magic Bytes ‚GIF89a' — sondern auch, was passiert wenn die Version nicht existiert, wenn die Tactic-ID nicht zur Version passt, oder wenn ungültiges JSON in den Frames steht.*

*Beim TacticService teste ich das Ownership-Pattern: Was passiert, wenn ein User auf eine fremde Taktik zugreift? Der Service muss eine ResourceNotFoundException werfen. Und bei der Registrierung teste ich, dass doppelte Usernames und E-Mails korrekt abgefangen werden."*

---

### Folie 10: Zusammenfassung & Fazit (14:00–15:00)

*„Zusammenfassend: Das Backend des Football Tactics Simulators ist ein vollständiger REST-Service mit Spring Boot und Java 21. Die Highlights sind der serverseitige GIF-Export mit Java2D-Rendering und Frame-Interpolation, die Taktik-Versionierung mit automatischem Diff-Vergleich, und das durchdachte Sicherheitskonzept mit Ownership-Isolation und Anti-Enumeration-Schutz.*

*Was ich aus diesem Projekt gelernt habe: Wie man eine saubere Schichtenarchitektur aufbaut, wie JWT-Authentifizierung funktioniert, wie man mit Java2D programmatisch Grafiken rendert, und wie man Tests schreibt, die sowohl den Happy Path als auch Fehlerfälle abdecken.*

*Besonders stolz bin ich darauf, dass der GIF-Export von Grund auf selbst implementiert ist — kein Drittanbieter-Service, kein Screenshot-Tool, sondern echtes serverseitiges Rendering mit Interpolation. Das war die größte technische Herausforderung und das Feature, das dieses Projekt von einem einfachen CRUD-Projekt unterscheidet.*

*Vielen Dank für Ihre Aufmerksamkeit. Gibt es Fragen?"*

---

> **Ende des Transkripts — Gesamtdauer: ca. 15 Minuten**
