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

// Instrucciones del asistente (diseño responsable, tema sensible)
const SYSTEM_PROMPT =
  'Eres un asistente de apoyo y reflexión del juego "¿Qué personalidad tienes?", ' +
  "que ayuda a las personas a pensar sobre cómo actúan en situaciones sociales " +
  "(desde permitir el abuso hasta ejercerlo). REGLAS: responde SIEMPRE en español, " +
  "con tono cálido, empático y sin juzgar. NO eres terapeuta ni das diagnósticos; " +
  "si hace falta, aclara que no sustituyes ayuda profesional. Responde breve " +
  "(2 a 4 frases). Si la persona menciona violencia, abuso, autolesión o una crisis, " +
  "anímala con calidez a buscar ayuda profesional o de una persona de confianza, y " +
  "recuérdale que en México puede llamar al 911 o a la Línea de la Vida 800 911 2000 " +
  "(o a emergencias de su país). Nunca des consejos peligrosos. Fomenta la asertividad " +
  "y la empatía.";

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
        messages = [{ role: "system", content: SYSTEM_PROMPT }, ...recent];
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
