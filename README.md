# ¿Qué personalidad tienes?

Un **test de autorreflexión** tipo quiz que estima, en una escala del **1 al 10**, tu
tendencia en situaciones sociales: desde *permitir el abuso* (1) hasta *ejercer el
abuso* (10), pasando por un punto sano de **equilibrio/asertividad** en el centro.

> ⚠️ **Aviso:** Este test es solo para reflexión personal y entretenimiento. **No es un
> diagnóstico psicológico.** Si tú o alguien que conoces sufre violencia o acoso, busca
> ayuda de un profesional o de una persona de confianza.

## Características

- 🎯 **25 fases por partida**, elegidas al azar de un **banco de 33 preguntas**
  (de texto y de imágenes). También se baraja el orden de las preguntas y de sus
  opciones, así rara vez una sesión es igual a otra.
- 🧠 **5 opciones por pregunta** basadas en los estilos reales de respuesta ante el
  conflicto (someterse, evitar/quedarse en blanco, ser asertivo, dominar, atacar),
  para que ninguna respuesta se sienta ambigua.
- 🧮 **Puntuación del 1 al 10** con 5 perfiles de resultado.
- 🎨 Estilo **retro minimalista** (paleta calmada tipo terapia, tipografía monoespaciada).
- 🔊 **Sonidos de calma** generados en el dispositivo (ambiente relajante + tonos suaves).
- 👤 **Nombre personalizado** (opcional): al inicio se puede escribir el nombre; el
  resultado y el texto para compartir quedan personalizados (se recuerda en el dispositivo).
- 💾 **Guarda tu último resultado** en el dispositivo (`localStorage`).
- 📣 **Compartir resultado** en redes (WhatsApp, Facebook, X, Telegram, Instagram vía
  compartir nativo del móvil) con un texto que promociona el juego e incluye el enlace.
- 📸 **Compartir como imagen para Instagram Stories**: genera una tarjeta vertical
  (1080x1920) con tu nombre, tu puntuación y el enlace, lista para subir a tu historia.
- 📴 **Funciona sin internet** (offline) gracias a un *service worker*.
- 📱 **Instalable** como app (PWA) en móvil y PC; puede empaquetarse como **APK**.

## Tecnología

HTML + CSS + JavaScript puro (sin frameworks ni dependencias). Es una **PWA**
(Progressive Web App).

## Estructura

```
index.html      Estructura (pantallas: inicio, quiz, resultado)
styles.css      Estilos retro minimalistas
app.js          Lógica del juego, preguntas, puntuación, sonidos y guardado
manifest.json   Configuración para instalar como app
sw.js           Service worker (funcionamiento offline)
icons/          Iconos de la app (192, 512, maskable)
make_icons.py   Script opcional que genera los iconos
```

## Cómo probarlo en tu computadora

Necesita ejecutarse desde un servidor (no abriendo el archivo directamente),
porque el *service worker* lo requiere.

```bash
# Con Python (ya viene en casi todos los sistemas)
python3 -m http.server 8080
# Luego abre http://localhost:8080 en el navegador
```

## Cómo instalarlo en el celular (sin APK)

1. Sube los archivos a cualquier hosting estático con HTTPS
   (por ejemplo **GitHub Pages**, Netlify o Vercel).
2. Abre la URL en el navegador del celular.
3. Menú del navegador → **"Agregar a la pantalla de inicio" / "Instalar app"**.

### Publicar gratis con GitHub Pages

En GitHub: **Settings → Pages → Branch: `main` / carpeta `/root`**. En unos minutos
tendrás una URL pública `https://mariscosjasu.github.io/qpt/`.

## Cómo generar el APK

Al ser una PWA, puedes empaquetarla en un APK sin reescribir nada:

- **PWABuilder** (lo más fácil): entra en <https://www.pwabuilder.com>, pega la URL
  pública de tu PWA y descarga el paquete de Android (`.apk` / `.aab`).
- **Bubblewrap** (línea de comandos, de Google):
  ```bash
  npm i -g @bubblewrap/cli
  bubblewrap init --manifest https://TU-URL/manifest.json
  bubblewrap build
  ```

## Personalizar las preguntas

Todas las preguntas están en el arreglo `QUESTION_POOL` dentro de `app.js`. En cada
partida se eligen al azar `SESSION_SIZE` preguntas (25 por defecto) y se barajan sus
opciones. Para que salgan más o menos preguntas por partida, cambia `SESSION_SIZE`.
Para dar más variedad a futuras partidas, simplemente agrega más preguntas al banco.

Cada opción tiene un `value` (estilo de respuesta ante el conflicto):

- `0` → **someterse / complacer** (tendencia a ser abusado)
- `1` → **evitar / quedarse en blanco / ignorar** (pasivo)
- `2` → **asertivo / equilibrado** (punto sano)
- `3` → **dominar / imponer**
- `4` → **atacar / humillar** (tendencia a abusar)

Los textos de los resultados están en el arreglo `RESULTS`.
