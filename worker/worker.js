/**
 * Worker de Cloudflare para "¿Qué personalidad tienes?"
 * - POST /api/chat   → chat con IA (Cloudflare Workers AI)
 * - POST /api/stat   → registra el perfil obtenido (estadísticas globales)
 * - GET  /api/stats  → devuelve los conteos globales
 *
 * Bindings necesarios (ver wrangler.toml):
 *   - AI    : Workers AI (para el chat)
 *   - STATS : KV namespace (para las estadísticas). Opcional: si no existe,
 *             los endpoints de estadísticas responden vacío sin romper el chat.
 */

// Solo permitimos llamadas desde el sitio del juego
const ALLOWED_ORIGIN = "https://appsmx.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, extra) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json", ...(extra || {}) },
  });
}

// Instrucciones del asistente (cálido, humano, multilingüe, diseño responsable)
const SYSTEM_PROMPT =
  'Eres un acompañante cálido y muy humano dentro del juego "¿Qué personalidad tienes?". ' +
  "Hablas como una persona empática y cercana, NO como un robot: tono natural, casual y amable, " +
  "con frases cortas y reales. Responde SIEMPRE en el mismo idioma en que te escriba la persona " +
  "(español, inglés, chino, etc.). Si sabes su nombre, úsalo de vez en cuando. Muestra interés " +
  "genuino: valida lo que siente y, cuando venga al caso, haz UNA pregunta breve para que siga " +
  "reflexionando. Evita sonar a lista o manual; nada de viñetas ni respuestas acartonadas. " +
  "NO eres terapeuta ni das diagnósticos; si hace falta, recuérdalo con suavidad. Sé breve " +
  "(2 a 4 frases). Si la persona menciona violencia, abuso, autolesión o una crisis, respóndele " +
  "con calidez, anímala a buscar ayuda de un profesional o alguien de confianza y recuérdale que " +
  "puede llamar a emergencias (911) o a una línea de apoyo (Línea de la Vida 800 911 2000 en México, " +
  "o 988 en EE. UU.). Nunca des consejos peligrosos. Fomenta la asertividad, la empatía y el respeto.";

// Modelos de Workers AI a intentar (en orden). Usa el primero que funcione.
const MODELS = [
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3-8b-instruct",
  "@cf/meta/llama-3.2-3b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.1",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // ---- Chat con IA ----
    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!env.AI) return json({ error: "Binding AI no disponible" }, 500);
      let messages;
      try {
        const body = await request.json();
        const incoming = Array.isArray(body.messages) ? body.messages : [];
        const recent = incoming
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-8);
        // Forzamos el idioma de respuesta. La forma mas fiable en modelos pequenos es
        // (1) un mensaje de sistema y (2) inyectar la orden, ESCRITA EN EL IDIOMA DESTINO,
        // al final del ultimo mensaje del usuario.
        const LANG_NAMES = { es: "espanol", en: "ingles (English)", zh: "chino (中文)" };
        const LANG_INLINE = {
          es: " (Responde en español.)",
          en: " (Reply ONLY in English.)",
          zh: " (请务必用中文回答。)",
        };
        const langCode = typeof body.lang === "string" ? body.lang.slice(0, 5) : "es";
        const langName = LANG_NAMES[langCode] || "espanol";
        const langDirective =
          "IMPORTANTE: responde EXCLUSIVAMENTE en " + langName + ". " +
          "Toda tu respuesta debe estar en ese idioma, sin importar en que idioma este escrito el historial.";
        // Inyecta la orden en el ultimo mensaje del usuario (lo que mejor obedecen).
        for (let i = recent.length - 1; i >= 0; i--) {
          if (recent[i].role === "user") {
            recent[i] = { role: "user", content: recent[i].content + (LANG_INLINE[langCode] || LANG_INLINE.es) };
            break;
          }
        }
        messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: langDirective },
          ...recent,
        ];
      } catch (e) {
        return json({ error: "Petición inválida" }, 400);
      }

      let lastErr = "";
      for (const model of MODELS) {
        try {
          const result = await env.AI.run(model, { messages, max_tokens: 400 });
          const reply = (result && (result.response || result.text)) || "";
          if (reply) return json({ reply: reply, model: model });
          lastErr = "respuesta vacía de " + model;
        } catch (e) {
          lastErr = model + ": " + String((e && e.message) || e);
        }
      }
      return json({ error: "IA no disponible", detail: lastErr }, 500);
    }

    // ---- Registrar un resultado (estadísticas) ----
    if (url.pathname === "/api/stat" && request.method === "POST") {
      if (!env.STATS) return json({ ok: false, reason: "sin almacenamiento" });
      try {
        const body = await request.json();
        const profile = typeof body.profile === "string" ? body.profile.slice(0, 60) : null;
        if (profile) {
          const cur = JSON.parse((await env.STATS.get("stats")) || "{}");
          cur.perfiles = cur.perfiles || {};
          cur.perfiles[profile] = (cur.perfiles[profile] || 0) + 1;
          cur.total = (cur.total || 0) + 1;
          await env.STATS.put("stats", JSON.stringify(cur));
        }
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false }, 500);
      }
    }

    // ---- Leer estadísticas globales ----
    if (url.pathname === "/api/stats" && request.method === "GET") {
      if (!env.STATS) return json({ total: 0, perfiles: {} });
      const cur = JSON.parse((await env.STATS.get("stats")) || '{"total":0,"perfiles":{}}');
      return json(cur);
    }

    return json({ error: "Ruta no encontrada" }, 404);
  },
};
