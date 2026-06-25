# Worker de Cloudflare — chat IA + estadísticas globales

Este Worker da el "backend" del juego:
- `POST /api/chat`  → responde el chat con **Workers AI**.
- `POST /api/stat`  → suma 1 al perfil obtenido (estadísticas globales).
- `GET  /api/stats` → devuelve los conteos globales.

## Requisitos
- Una cuenta de Cloudflare (la misma que ya usas).
- Node.js instalado en tu PC (para usar `wrangler`, la herramienta de Cloudflare).

## Pasos para desplegarlo

1. **Abre una terminal** en esta carpeta `worker/`.

2. **Inicia sesión en Cloudflare:**
   ```bash
   npx wrangler login
   ```

3. **Crea el almacenamiento (KV) para las estadísticas:**
   ```bash
   npx wrangler kv namespace create STATS
   ```
   Copia el `id` que te muestre y **pégalo en `wrangler.toml`** (donde dice
   `PEGA_AQUI_EL_ID_DE_TU_KV`).

4. **Despliega:**
   ```bash
   npx wrangler deploy
   ```

5. Al terminar, Wrangler te dará una **URL** parecida a:
   ```
   https://qpt-api.TU-SUBDOMINIO.workers.dev
   ```
   **Esa URL es la que necesito.** Pásamela y conecto el chat y las estadísticas
   en el juego.

## Notas
- **Workers AI** tiene 10,000 "Neurons" gratis al día (suficiente para uso ligero).
- El chat solo acepta llamadas desde `https://appsmx.github.io` (configurado en `worker.js`).
- Si no creas el KV, el chat funciona igual; solo las estadísticas quedarían vacías.

## Alternativa sin terminal (panel web)
También puedes crear el Worker desde el panel de Cloudflare:
**Workers & Pages → Create → Worker**, pegar el contenido de `worker.js`, y en
**Settings → Bindings** agregar el binding de **AI** (nombre `AI`) y un **KV** (nombre `STATS`).
