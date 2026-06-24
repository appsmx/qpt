# Cómo tener el APK funcionando

Tienes **dos caminos**. Ahora mismo estás usando el **Camino A (PWABuilder / TWA)**,
que es el más rápido. El **Camino B (Capacitor)** es una alternativa 100% offline.

---

## 🅰️ Camino A — PWABuilder (TWA)  ← el que estás usando

PWABuilder genera un APK que **abre tu PWA publicada** a pantalla completa. Para que
NO aparezca la barra del navegador, Android verifica que la web y la app son tuyas
usando el archivo **`assetlinks.json`** (el que me pasaste).

### Paso 1 · Publica la PWA en internet (GitHub Pages)

1. En GitHub abre el repo `qpt` → **Settings → Pages**.
2. En **Build and deployment → Source**: elige **Deploy from a branch**.
3. Branch: **`main`**, carpeta: **`/ (root)`** → **Save**.
4. Espera 1-2 minutos. Tu PWA quedará en:
   `https://appsmx.github.io/qpt/`

### Paso 2 · Publica el `assetlinks.json` en la RAÍZ del dominio ⚠️ (clave)

Este es el detalle que más falla. Android **siempre** busca el archivo en la raíz del
dominio, nunca en una subcarpeta:

```
https://appsmx.github.io/.well-known/assetlinks.json   ✅ (aquí lo busca Android)
https://appsmx.github.io/qpt/.well-known/assetlinks.json   ❌ (NO lo encuentra)
```

Como tu juego vive en `/qpt/` (una subcarpeta), necesitas publicar el archivo en el
**sitio raíz** de tu usuario. Para eso:

1. Crea un repositorio nuevo llamado **exactamente** `appsmx.github.io`.
2. Dentro, crea la carpeta y archivo: `.well-known/assetlinks.json`
   con **este contenido** (es una copia del que está en este repo):

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "io.github.mariscosjasu.twa",
         "sha256_cert_fingerprints": [
           "17:21:64:67:45:42:83:7D:69:BB:2E:77:00:7D:54:50:55:48:BF:B8:D0:29:8D:D2:CF:6C:38:0B:87:F8:02:3B"
         ]
       }
     }
   ]
   ```
3. Activa **Pages** en ese repo (`main` / root).
4. Verifica abriendo en el navegador:
   `https://appsmx.github.io/.well-known/assetlinks.json`
   Debe mostrar el JSON.

> Nota: en este repo (`qpt`) también dejé una copia en `.well-known/assetlinks.json`.
> Esa copia es útil si en el futuro usas un **dominio propio** apuntando directo al
> juego. Para `github.io` con subcarpeta, manda la del **sitio raíz** (paso 2).

### Paso 3 · Instala el APK

1. Pasa el `.apk` que descargaste de PWABuilder a tu celular.
2. Ábrelo y permite "instalar de orígenes desconocidos" si lo pide.
3. Si `assetlinks.json` está bien publicado, la app abre **a pantalla completa**.
   Si no, igual funciona pero se ve una barrita arriba con la URL.

> La verificación puede tardar unos minutos la primera vez. Si abre con barra,
> desinstala, espera y reinstala tras confirmar el paso 2.

### ⚠️ Error "No se instaló la app debido a un conflicto con un paquete"

Este error aparece cuando el celular **ya tiene instalada** una versión de la app,
pero el APK nuevo está **firmado con una llave diferente**. Android, por seguridad,
no deja reemplazar una app si la firma no coincide.

**Solución inmediata (para quien ya la tenía instalada):**
1. Mantén presionado el ícono de **"Personalidad"** → **Desinstalar**.
2. Vuelve a instalar el APK nuevo. Listo.

**Cómo evitar que les pase a otras personas (importante):**
- **Usa siempre la MISMA llave de firma.** Cuando PWABuilder te genera el paquete,
  descarga también un archivo de firma (`signing.keystore`) y su contraseña.
  **Guárdalos** y, al regenerar el APK, elige la opción *"I have a signing key" /
  "Use mine"* y sube esa misma llave. Si generas una llave nueva cada vez, todos los
  que ya instalaron tendrán el conflicto.
- **Reparte un solo archivo APK** (el mismo para todos), de preferencia subiéndolo a
  un **GitHub Release** del repo `qpt`. Así todos descargan exactamente el mismo
  archivo firmado con la misma llave y nunca chocan entre versiones.
- Quienes **nunca** instalaron la app no verán este error: es solo un choque entre
  dos APK firmados distinto.

**La opción que NUNCA da conflicto:** comparte el **enlace de la web**
(`https://appsmx.github.io/qpt/`) y diles que usen **"Agregar a la pantalla de
inicio" / "Instalar app"** desde el navegador. Eso instala la PWA sin firmas de APK,
así que jamás aparece el conflicto. Es la forma más sencilla para que el público
general la tenga en su celular.

---

## 🅱️ Camino B — Capacitor (APK 100% offline, sin depender de hosting)

Este repo ya está configurado para generar un APK que **incluye el juego dentro**
(no necesita internet ni publicar nada). GitHub lo compila por ti:

1. En el repo `qpt` → pestaña **Actions**.
2. Elige el workflow **"Compilar APK (Capacitor)"** → **Run workflow**.
3. Al terminar (unos minutos), entra a la ejecución y descarga el artefacto
   **`qpt-debug-apk`** (dentro está `app-debug.apk`).
4. Instálalo en tu celular.

### Compilarlo en tu propia PC (opcional)

Necesitas Node.js, JDK 21 y el SDK de Android.

```bash
npm install
npm run build:apk
# Resultado: android/app/build/outputs/apk/debug/app-debug.apk
```

> Diferencia clave: el APK de Capacitor **no usa `assetlinks.json`** porque no carga
> una web externa; trae todos los archivos adentro. Por eso funciona sin internet.
