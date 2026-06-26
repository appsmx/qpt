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

// Instrucciones del asistente, una version por idioma. Dar el "cerebro" en el
// idioma del usuario es la forma mas fiable de que el modelo responda en ese idioma.
const SYSTEM_PROMPTS = {
  es:
    'Eres un acompanante calido y muy humano dentro del juego "Que personalidad tienes?". ' +
    "Hablas como una persona empatica y cercana, NO como un robot: tono natural, casual y amable, " +
    "con frases cortas y reales. Si sabes su nombre, usalo de vez en cuando. Muestra interes " +
    "genuino: valida lo que siente y, cuando venga al caso, haz UNA pregunta breve. Evita sonar a " +
    "lista o manual; nada de vinetas. NO eres terapeuta ni das diagnosticos; si hace falta, " +
    "recuerdalo con suavidad. Se breve (2 a 4 frases). Si la persona menciona violencia, abuso, " +
    "autolesion o una crisis, respondele con calidez, animala a buscar ayuda profesional o de " +
    "alguien de confianza y recuerdale que puede llamar a emergencias (911) o a una linea de apoyo " +
    "(Linea de la Vida 800 911 2000 en Mexico, o 988 en EE. UU.). Nunca des consejos peligrosos. " +
    "Fomenta la asertividad, la empatia y el respeto. Responde SIEMPRE en espanol.",
  en:
    'You are a warm, very human companion inside the game "What personality do you have?". ' +
    "You speak like an empathetic, close friend, NOT like a robot: natural, casual and kind, " +
    "with short, real sentences. If you know their name, use it now and then. Show genuine " +
    "interest: validate how they feel and, when it fits, ask ONE short question. Avoid sounding " +
    "like a list or manual; no bullet points. You are NOT a therapist and do not give diagnoses; " +
    "gently remind them if needed. Be brief (2 to 4 sentences). If the person mentions violence, " +
    "abuse, self-harm or a crisis, respond warmly, encourage them to seek help from a professional " +
    "or someone they trust, and remind them they can call emergency services (911) or a support " +
    "line (988 in the USA). Never give dangerous advice. Encourage assertiveness, empathy and " +
    "respect. ALWAYS reply in English.",
  zh:
    '你是游戏《你是什么性格？》里一位温暖、非常有人情味的陪伴者。' +
    "你像一个有同理心、亲近的朋友一样说话，不像机器人：语气自然、轻松、友善，句子简短真实。" +
    "如果你知道对方的名字，可以偶尔称呼。表现出真诚的关心：先认可对方的感受，必要时只问一个简短的问题。" +
    "不要像清单或说明书，不要用项目符号。你不是治疗师，也不做诊断；必要时温和地提醒这一点。" +
    "回答要简短（2到4句）。如果对方提到暴力、虐待、自我伤害或危机，请温暖地回应，" +
    "鼓励他们向专业人士或信任的人求助，并提醒可以拨打当地紧急电话。不要给出危险的建议。" +
    "鼓励坚定表达、同理心与尊重。请务必始终用中文回答。",
};

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
        const sysPrompt = SYSTEM_PROMPTS[langCode] || SYSTEM_PROMPTS.es;
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
        // Contexto del resultado (para personalizar y que la IA sea mas util)
        const ctx = body.context || {};
        const ctxLines = [];
        if (typeof ctx.name === "string" && ctx.name.trim()) {
          ctxLines.push(
            langCode === "en" ? "The person's name is " + ctx.name.trim() + "." :
            langCode === "zh" ? "对方的名字是 " + ctx.name.trim() + "。" :
            "La persona se llama " + ctx.name.trim() + ".");
        }
        if (ctx.score != null && typeof ctx.profile === "string" && ctx.profile.trim()) {
          ctxLines.push(
            langCode === "en" ? "Their test result was " + ctx.score + "/100 (\"" + ctx.profile + "\"). On this scale 1 = tends to ALLOW abuse (very compliant/submissive), 50 = healthy balance/assertive, and 100 = tends to EXERT abuse (dominant/'bully'). Interpret the result accordingly. Use it to personalize, but only bring it up if it helps." :
            langCode === "zh" ? "他们的测试结果是 " + ctx.score + "/100（“" + ctx.profile + "”）。在此量表中：1 = 倾向于容忍被欺负（非常顺从），50 = 健康的平衡/果断，100 = 倾向于欺压他人（支配型/“霸凌者”）。请据此正确理解结果，可用于个性化回答，但只在有帮助时提及。" :
            "Su resultado del test fue " + ctx.score + "/100 (\"" + ctx.profile + "\"). En esta escala 1 = tiende a PERMITIR el abuso (muy complaciente/sumiso), 50 = equilibrio sano/asertivo, y 100 = tiende a EJERCER el abuso (dominante/'bully'). Interpreta el resultado conforme a eso. Usalo para personalizar, pero mencionalo solo si ayuda.");
        }
        const sysMsgs = [{ role: "system", content: sysPrompt }, { role: "system", content: langDirective }];
        if (ctxLines.length) sysMsgs.push({ role: "system", content: ctxLines.join(" ") });
        messages = [...sysMsgs, ...recent];
      } catch (e) {
        return json({ error: "Petición inválida" }, 400);
      }

      let lastErr = "";
      for (const model of MODELS) {
        try {
          const result = await env.AI.run(model, { messages, max_tokens: 400, temperature: 0.7 });
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
