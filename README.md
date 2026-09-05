# MusicPlayerApp 🎵

Reproductor de música personal, instalable como app en el celular (PWA), que
busca canciones en YouTube, las reproduce, arma una cola con temas similares
del mismo artista, y te deja guardar tus favoritas en una biblioteca local.

Nació como la idea detrás del placeholder de "reproductor" del portfolio, y
acá está hecha realidad como proyecto propio.

## Qué hace

- **Buscador** de canciones que consulta la YouTube Data API v3 (búsqueda por
  texto, filtrada a la categoría "Música").
- **Reproducción** vía un elemento `<audio>` nativo: play, pausa, siguiente,
  anterior, barra de progreso y volumen. El audio lo sirve un backend propio
  (carpeta `server/`) que resuelve el stream de cada video con `yt-dlp` — a
  diferencia del iframe de YouTube (usado antes), esto permite que la música
  siga sonando en iOS al minimizar la app o bloquear la pantalla. El audio
  suena normal desde el navegador/celular, así que **Bluetooth a parlantes,
  auto o TV funciona solo**, emparejando el dispositivo como con cualquier
  otro audio del teléfono — la app no necesita programar nada especial para
  eso.
- **Biblioteca personal**: guardá canciones (título, artista/canal,
  miniatura y videoId) en `localStorage` y accedé a ellas después.
- **Cola de reproducción** con función "similares": agrega más canciones del
  mismo canal/artista a la cola, simulando el "reproducir relacionados" de
  YouTube o Spotify.
- **Mini reproductor persistente** ("now playing bar") visible en todo
  momento mientras navegás entre Buscar / Biblioteca / Cola.
- **Instalable como app** (PWA) en Android e iOS.
- **Modo demo**: si todavía no configuraste tu API key, la app anda igual
  con canciones de ejemplo, para que puedas ver y probar toda la interfaz.

## Stack

React + TypeScript + Vite, `vite-plugin-pwa` para el manifest/service worker,
CSS plano (sin frameworks) con un tema oscuro pensado mobile-first. La
búsqueda sigue siendo 100% cliente contra la API pública de YouTube; hay un
backend mínimo (Node/Express + `yt-dlp`, carpeta `server/`) que solo se
encarga de resolver y servir el audio para la reproducción.

## Cómo correrlo

```bash
npm install
npm run dev
```

Además, para que la reproducción funcione, necesitás el backend corriendo
(ver la sección [Backend](#backend-de-audio) más abajo):

```bash
cd server
npm install
npm run dev
```

Abrí la URL que te muestra la terminal (por defecto `http://localhost:5173`).
Sin ninguna configuración extra ya vas a poder ver la interfaz completa en
**modo demo** (ver más abajo).

Para compilar la versión de producción:

```bash
npm run build
npm run preview   # sirve el build de dist/ para probarlo
```

## Conseguir tu YouTube Data API key (gratis)

La búsqueda real (no la de ejemplo) necesita una API key de Google, gratuita
dentro de la cuota diaria que da Google Cloud. Pasos:

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Creá un proyecto nuevo (o usá uno existente).
3. Andá a **APIs y servicios → Biblioteca**, buscá **"YouTube Data API v3"**
   y hacé clic en **Habilitar**.
4. Andá a **APIs y servicios → Credenciales → Crear credenciales → Clave de
   API**.
5. Copiá la key que te genera. Opcionalmente, restringila para que solo
   pueda usarse con la YouTube Data API v3 (recomendado por seguridad).

La cuota gratuita diaria (10.000 unidades/día al momento de escribir esto)
alcanza cómodamente para uso personal — cada búsqueda consume 100 unidades.

## Configurar el `.env`

1. Copiá `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

2. Completá tu key y la URL del backend de audio:

   ```
   VITE_YOUTUBE_API_KEY=tu_api_key_acá
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. Reiniciá `npm run dev` si ya lo tenías corriendo (Vite solo lee las
   variables de entorno al arrancar).

El archivo `.env` está en `.gitignore`: nunca se sube al repo. Solo
`.env.example` (sin la key real) queda versionado como referencia.

## Probarlo en modo demo (sin API key)

Si no configurás nada, la app detecta que falta `VITE_YOUTUBE_API_KEY` y
automáticamente:

- Muestra un aviso violeta de "Modo demo" arriba del buscador.
- Devuelve un set fijo de canciones de ejemplo (con videoId reales, así que
  la reproducción, guardado y cola funcionan igual que en modo real).

Es la forma más rápida de mostrar el proyecto en un portfolio sin depender
de tener una API key a mano.

## Instalarlo como app en el celular (PWA)

**Android (Chrome):**

1. Abrí la URL de la app deployada en Chrome.
2. Tocá el menú de tres puntos (⋮) arriba a la derecha.
3. Elegí **"Instalar app"** (o "Agregar a pantalla de inicio").
4. Confirmá. Va a quedar como ícono en tu home, abriendo en modo standalone
   (sin barra de navegador).

**iOS (Safari):**

1. Abrí la URL de la app en Safari (tiene que ser Safari, no Chrome/otros).
2. Tocá el ícono de **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elegí **"Agregar a inicio"**.
4. Confirmá el nombre y tocá "Agregar".

Una vez instalada, abrila desde el ícono del home: se comporta como una app
nativa (pantalla completa, ícono propio). El audio sigue sonando por el
parlante del celular o por lo que tengas emparejado por Bluetooth (auto,
parlante, TV) exactamente igual que cualquier otra app de audio — eso lo
maneja el sistema operativo, no la app.

> Nota: para que "Instalar app" aparezca tal cual, la app tiene que servirse
> por HTTPS (o `localhost` en desarrollo). Cualquier hosting está bien
> (Vercel, Netlify, GitHub Pages, etc.) para el frontend; el backend de audio
> necesita un host con proceso Node persistente (ver sección de Backend).

## Backend de audio

El audio ya no se reproduce embebiendo un iframe de YouTube: un backend
propio en `server/` resuelve, con `yt-dlp`, la URL directa del stream de
audio de cada video y la sirve con soporte de `Range` (para poder buscar
dentro de la canción). El frontend reproduce eso con un `<audio>` HTML
nativo — que sí sigue sonando en segundo plano en iOS, a diferencia del
iframe de YouTube.

**Correrlo local:**

```bash
cd server
npm install
npm run dev   # http://localhost:3000
```

Variables de entorno (`server/.env`, copiar de `server/.env.example`):
`PORT`, `ALLOWED_ORIGIN` (origen del frontend permitido por CORS) y
`STREAM_CACHE_TTL_MS` (cuánto cachear la URL resuelta antes de volver a
invocar `yt-dlp`).

**Deploy:** necesita un host con proceso Node persistente y capacidad de
correr un `Dockerfile` (yt-dlp requiere Python + ffmpeg) — Railway o Render
funcionan bien y tienen plan gratuito. Netlify/Vercel/GitHub Pages **no**
sirven para esto (son hosting estático), pero siguen siendo una opción
válida para el frontend, seteando `VITE_API_BASE_URL` apuntando al backend
desplegado.

## Estructura del proyecto

```
src/
  api/
    youtube.ts          # búsqueda YouTube Data API v3 + modo demo/mock + "similares"
    stream.ts             # arma la URL del endpoint propio de audio (server/)
  components/
    SearchView.tsx       # buscador + resultados
    LibraryView.tsx       # biblioteca guardada
    QueueView.tsx         # cola de reproducción
    NowPlayingBar.tsx     # mini reproductor persistente
    TrackRow.tsx           # fila reutilizable de canción (buscador/biblioteca/cola)
    BottomNav.tsx           # navegación inferior mobile-first
    Icon.tsx                 # set de íconos SVG inline, sin dependencias
  context/
    PlayerContext.tsx    # estado global del reproductor (cola, <audio> nativo, controles)
  hooks/
    useLibrary.ts         # persistencia de biblioteca en localStorage
  types/
    track.ts               # tipos compartidos (Track, LibraryTrack, RepeatMode)
  utils/
    format.ts               # helpers (formatTime)
  App.tsx                    # shell de la app + navegación entre vistas
  index.css                   # tema oscuro, mobile-first, sin frameworks CSS
public/
  icons/                      # íconos PWA (generados: 192, 512, maskable, apple-touch)
server/
  src/index.ts                # servidor Express (rutas /api/health, /api/stream/:videoId)
  src/lib/resolver.ts          # resuelve la URL de audio con yt-dlp (con cache)
  src/lib/rangeProxy.ts        # proxy con soporte de Range hacia el CDN de YouTube
  Dockerfile                   # imagen para deploy (Node + Python + ffmpeg)
vite.config.ts                # config de Vite + vite-plugin-pwa (manifest, service worker)
```

## Decisiones de diseño y alcance

- **El backend resuelve el stream de audio con `yt-dlp` (fuera de los ToS de
  YouTube).** Es una decisión consciente: el iframe oficial de YouTube no
  sostiene la reproducción en segundo plano en iOS, y la única forma real de
  arreglar eso es servir el audio como un `<audio>` nativo. El backend no
  descarga ni persiste el archivo en disco, solo resuelve la URL y hace de
  proxy — pero técnicamente sigue violando los Términos de Servicio de
  YouTube (prohíben extraer streams fuera de su reproductor oficial). Es un
  trade-off aceptado para este proyecto personal, no algo para replicar sin
  pensar el riesgo en un producto con más usuarios.
- **"Similares" = búsqueda por canal**, no relacionados nativos. La YouTube
  Data API v3 discontinuó el parámetro `relatedToVideoId`, así que el MVP
  arma la sugerencia buscando más resultados del mismo canal/artista. Es una
  aproximación simple pero efectiva para el caso de uso ("seguir
  escuchando algo parecido").
- **Bluetooth es responsabilidad del sistema operativo.** No hay código de
  streaming Bluetooth en la app: una vez que el celular está emparejado con
  un parlante/auto/TV, cualquier audio que reproduzca el navegador (incluido
  el de YouTube embebido) sale por ese dispositivo automáticamente, igual
  que con Spotify o YouTube Music.
- **Persistencia simple con `localStorage`.** Para el volumen de datos de
  una biblioteca personal (decenas/cientos de canciones con metadata chica),
  `localStorage` alcanza y evita la complejidad de IndexedDB. Si a futuro la
  biblioteca crece mucho, se puede migrar sin cambiar la interfaz del hook
  `useLibrary`.
- **La carátula del "now playing bar" es una imagen, no el reproductor
  real.** El `<audio>` que reproduce el sonido no está en el DOM (se crea
  programáticamente), así que no hay nada que ocultar ni minimizar — la
  miniatura de 56×56px que se ve es simplemente la `thumbnail` del track.

## Qué quedó afuera del MVP (roadmap futuro)

- **Integración con Spotify.** Requeriría OAuth de Spotify + una cuenta
  Premium del usuario (el Web Playback SDK de Spotify no permite reproducir
  canciones completas sin Premium), y el contenido está protegido por DRM
  (no se puede acceder al audio crudo). Queda documentado como fase 2: se
  agregaría como una fuente de búsqueda alternativa a YouTube, con su propio
  botón de "conectar cuenta de Spotify".
- **Cast a TV tipo Chromecast/AirPlay con control remoto desde la app.** Hoy
  el audio llega a la TV solo si el celular está conectado por Bluetooth (el
  celular sigue siendo el que reproduce). Un Chromecast real permitiría que
  la TV reproduzca directamente y el celular actúe como control remoto —
  eso necesitaría integrar el SDK de Google Cast, fuera del alcance de este
  MVP.
- **Letras de canciones, ecualizador, o modo offline.** No estaban en el
  pedido original; podrían sumarse más adelante.
- **Recomendaciones más inteligentes.** Ahora mismo "similares" busca por
  nombre de canal. Un sistema más parecido al de Spotify (basado en
  géneros/audio features) necesitaría un backend propio o una API de
  recomendación de terceros.

## Notas técnicas

- La YouTube Data API v3 tiene cuota diaria gratuita limitada. Si la
  superás, la búsqueda va a devolver un error visible en la UI (banner
  rojo) hasta que se resetee la cuota (renueva a medianoche, hora del
  Pacífico) o generes otra key.
- El proyecto no tiene base de datos: todo el estado (biblioteca, cola) vive
  en el navegador de cada usuario. Sí hay un backend chico (`server/`, ver
  sección [Backend de audio](#backend-de-audio)) que solo resuelve/proxysea
  el stream de audio — no guarda nada persistente del lado del servidor más
  allá de una cache en memoria de corta duración.
- Si un video falla al resolverse (restringido, borrado, bloqueado por
  región, o yt-dlp tarda demasiado), la app muestra un banner de error en el
  mini reproductor y salta automáticamente a la siguiente canción de la
  cola.
