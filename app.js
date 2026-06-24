/* ===========================================================
   ¿Qué personalidad tienes?  —  Lógica del juego
   - 25 fases (preguntas): texto e imagen (emoji)
   - Cada opción vale 0 (abusado), 1 (equilibrio) o 2 (abusador)
   - Resultado normalizado del 1 al 10
   - Sonidos de calma con Web Audio (sin archivos, funciona offline)
   - Guarda el último resultado en el dispositivo (localStorage)
   =========================================================== */

"use strict";

/* -----------------------------------------------------------
   1) BANCO DE PREGUNTAS
   En cada partida se eligen SESSION_SIZE preguntas al azar de este
   banco, y tanto las preguntas como sus opciones se barajan. Así
   rara vez una sesión es igual a otra.

   type: "text"  -> opciones con { text, value }
   type: "image" -> opciones con { img, label, value }
   value: 0 = tendencia a ser abusado | 1 = equilibrio | 2 = tendencia a abusar
----------------------------------------------------------- */
const QUESTION_POOL = [
  { type: "text", q: "Cuando alguien te critica frente a otras personas...", options: [
    { text: "Me callo y pienso que seguramente tienen razón.", value: 0 },
    { text: "Lo hablo con calma para entender su punto.", value: 1 },
    { text: "Le respondo fuerte para que no se repita.", value: 2 },
  ]},
  { type: "text", q: "Si ves a alguien más débil cometer un error...", options: [
    { text: "Me identifico con esa persona y la apoyo.", value: 0 },
    { text: "Le ayudo a corregirlo.", value: 1 },
    { text: "Me burlo o lo señalo.", value: 2 },
  ]},
  { type: "image", q: "¿Con qué cara te identificas al entrar a un grupo nuevo?", options: [
    { img: "😟", label: "Inseguro", value: 0 },
    { img: "🙂", label: "Tranquilo", value: 1 },
    { img: "😎", label: "Dominante", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien te hace una broma pesada...", options: [
    { text: "Me río aunque por dentro me duela.", value: 0 },
    { text: "Le digo con claridad que no me gustó.", value: 1 },
    { text: "Le devuelvo una broma todavía peor.", value: 2 },
  ]},
  { type: "text", q: "Ante un conflicto, normalmente...", options: [
    { text: "Cedo para evitar problemas.", value: 0 },
    { text: "Busco un acuerdo justo para ambos.", value: 1 },
    { text: "Impongo lo que yo quiero.", value: 2 },
  ]},
  { type: "image", q: "Elige el animal con el que más te identificas:", options: [
    { img: "🐑", label: "Oveja", value: 0 },
    { img: "🦊", label: "Zorro", value: 1 },
    { img: "🦁", label: "León", value: 2 },
  ]},
  { type: "text", q: "Cuando cometo un error frente a otros...", options: [
    { text: "Siento mucha vergüenza y me culpo.", value: 0 },
    { text: "Lo acepto y trato de aprender.", value: 1 },
    { text: "Busco a quién echarle la culpa.", value: 2 },
  ]},
  { type: "text", q: "Decir \"no\" a los demás...", options: [
    { text: "Me cuesta muchísimo, casi nunca puedo.", value: 0 },
    { text: "Lo hago con respeto cuando hace falta.", value: 1 },
    { text: "Lo hago sin que me importe el resto.", value: 2 },
  ]},
  { type: "image", q: "¿Qué postura describe mejor tu lenguaje corporal habitual?", options: [
    { img: "🙇", label: "Encogido", value: 0 },
    { img: "🧍", label: "Firme y neutro", value: 1 },
    { img: "🤺", label: "A la ofensiva", value: 2 },
  ]},
  { type: "text", q: "Si alguien tiene algo que tú quieres...", options: [
    { text: "Pienso que yo no lo merezco.", value: 0 },
    { text: "Trabajo para conseguir el mío.", value: 1 },
    { text: "Hago lo necesario para quitárselo.", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien cercano está triste o llora...", options: [
    { text: "Me hundo igual o más que esa persona.", value: 0 },
    { text: "Trato de escuchar y consolar.", value: 1 },
    { text: "Pienso que es una debilidad suya.", value: 2 },
  ]},
  { type: "image", q: "Elige el clima que refleja tu carácter:", options: [
    { img: "🌧️", label: "Lluvia", value: 0 },
    { img: "⛅", label: "Templado", value: 1 },
    { img: "⛈️", label: "Tormenta", value: 2 },
  ]},
  { type: "text", q: "En un trabajo en equipo sueles...", options: [
    { text: "Hacer lo que digan los demás.", value: 0 },
    { text: "Aportar y escuchar por igual.", value: 1 },
    { text: "Querer dirigir y mandar a todos.", value: 2 },
  ]},
  { type: "text", q: "Si alguien te empuja \"sin querer\" en la calle...", options: [
    { text: "Pido disculpas yo, aunque no fue mi culpa.", value: 0 },
    { text: "Sigo mi camino tranquilo.", value: 1 },
    { text: "Le reclamo de mala forma.", value: 2 },
  ]},
  { type: "image", q: "¿Qué emoji usarías más en una discusión?", options: [
    { img: "😢", label: "Tristeza", value: 0 },
    { img: "😐", label: "Calma", value: 1 },
    { img: "😠", label: "Enojo", value: 2 },
  ]},
  { type: "text", q: "Cuando recibes una orden que te parece injusta...", options: [
    { text: "La cumplo aunque me moleste por dentro.", value: 0 },
    { text: "Pregunto el porqué con respeto.", value: 1 },
    { text: "Me niego e impongo mi voluntad.", value: 2 },
  ]},
  { type: "text", q: "Frente a las críticas en redes sociales...", options: [
    { text: "Las aguanto en silencio y me afectan mucho.", value: 0 },
    { text: "Las ignoro o respondo con calma.", value: 1 },
    { text: "Respondo atacando a quien sea.", value: 2 },
  ]},
  { type: "image", q: "Elige el color que más te representa hoy:", options: [
    { img: "🔵", label: "Azul / retraído", value: 0 },
    { img: "🟢", label: "Verde / equilibrio", value: 1 },
    { img: "🔴", label: "Rojo / dominio", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien tiene una opinión distinta a la tuya...", options: [
    { text: "Cambio la mía para no discutir.", value: 0 },
    { text: "La respeto aunque no coincida.", value: 1 },
    { text: "Insisto hasta que acepte la mía.", value: 2 },
  ]},
  { type: "text", q: "Si un grupo se burla de alguien, tú...", options: [
    { text: "Te callas por miedo a ser el siguiente.", value: 0 },
    { text: "Defiendes a la persona.", value: 1 },
    { text: "Te unes a las burlas.", value: 2 },
  ]},
  { type: "image", q: "¿Qué gesto de manos eliges?", options: [
    { img: "🤲", label: "Manos que reciben", value: 0 },
    { img: "🤝", label: "Acuerdo", value: 1 },
    { img: "✊", label: "Puño / fuerza", value: 2 },
  ]},
  { type: "text", q: "Cuando logras algo importante...", options: [
    { text: "Creo que fue suerte, no lo merezco.", value: 0 },
    { text: "Me alegro y lo celebro de forma sana.", value: 1 },
    { text: "Lo presumo para sentirme por encima.", value: 2 },
  ]},
  { type: "text", q: "Si alguien te falta el respeto...", options: [
    { text: "Lo dejo pasar para no causar problemas.", value: 0 },
    { text: "Pongo un límite con firmeza y calma.", value: 1 },
    { text: "Respondo con algo todavía peor.", value: 2 },
  ]},
  { type: "image", q: "Elige la escena en la que te sientes mejor:", options: [
    { img: "🫥", label: "Pasar desapercibido", value: 0 },
    { img: "👥", label: "Entre iguales", value: 1 },
    { img: "👑", label: "Estar al mando", value: 2 },
  ]},
  { type: "text", q: "En el fondo, lo que más temes es...", options: [
    { text: "Molestar a los demás o que me rechacen.", value: 0 },
    { text: "Ser injusto con alguien.", value: 1 },
    { text: "Perder el control o que no me obedezcan.", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien no cumple lo que te prometió...", options: [
    { text: "Lo justifico y no digo nada.", value: 0 },
    { text: "Le pregunto con calma qué pasó.", value: 1 },
    { text: "Lo expongo y lo hago sentir mal.", value: 2 },
  ]},
  { type: "text", q: "Si alguien se cuela delante de ti en una fila...", options: [
    { text: "No digo nada para evitar problemas.", value: 0 },
    { text: "Le aviso con calma que había fila.", value: 1 },
    { text: "Le reclamo de forma agresiva.", value: 2 },
  ]},
  { type: "text", q: "Cuando das tu opinión en un grupo...", options: [
    { text: "Me da miedo que me juzguen y casi no hablo.", value: 0 },
    { text: "La comparto con naturalidad.", value: 1 },
    { text: "La impongo aunque interrumpa a otros.", value: 2 },
  ]},
  { type: "text", q: "Si un amigo te pide un favor que no puedes hacer...", options: [
    { text: "Digo que sí aunque me perjudique.", value: 0 },
    { text: "Le explico con honestidad por qué no puedo.", value: 1 },
    { text: "Lo trato mal por haberme molestado.", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien cercano tiene éxito...", options: [
    { text: "Siento que yo nunca lo lograré.", value: 0 },
    { text: "Me alegro sinceramente por esa persona.", value: 1 },
    { text: "Busco restarle importancia a su logro.", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien te levanta la voz...", options: [
    { text: "Me paralizo y termino obedeciendo.", value: 0 },
    { text: "Mantengo la calma y respondo.", value: 1 },
    { text: "Levanto la voz todavía más que el otro.", value: 2 },
  ]},
  { type: "text", q: "Al tomar una decisión que afecta a otros...", options: [
    { text: "Hago lo que ellos prefieran, aunque no me guste.", value: 0 },
    { text: "Busco que sea buena para todos.", value: 1 },
    { text: "Decido yo, sin consultar a nadie.", value: 2 },
  ]},
  { type: "image", q: "Elige la planta con la que te identificas:", options: [
    { img: "🥀", label: "Marchita", value: 0 },
    { img: "🌿", label: "Hierba sana", value: 1 },
    { img: "🌵", label: "Cactus con espinas", value: 2 },
  ]},
  { type: "image", q: "Elige una expresión:", options: [
    { img: "😞", label: "Apagado", value: 0 },
    { img: "🙂", label: "Sereno", value: 1 },
    { img: "😤", label: "Desafiante", value: 2 },
  ]},
  { type: "image", q: "¿Qué objeto eliges?", options: [
    { img: "🛡️", label: "Escudo / defensa", value: 0 },
    { img: "⚖️", label: "Balanza / equilibrio", value: 1 },
    { img: "⚔️", label: "Espadas / ataque", value: 2 },
  ]},
  { type: "image", q: "Elige el paisaje que va contigo:", options: [
    { img: "🌫️", label: "Niebla", value: 0 },
    { img: "🌅", label: "Amanecer", value: 1 },
    { img: "🌋", label: "Volcán", value: 2 },
  ]},
  { type: "text", q: "Cuando algo te molesta de otra persona...", options: [
    { text: "Me lo guardo y lo aguanto.", value: 0 },
    { text: "Se lo digo con respeto.", value: 1 },
    { text: "Se lo echo en cara con dureza.", value: 2 },
  ]},
  { type: "text", q: "Si te toca liderar un grupo...", options: [
    { text: "Prefiero que mande otra persona.", value: 0 },
    { text: "Coordino escuchando a todos.", value: 1 },
    { text: "Doy órdenes y espero que obedezcan.", value: 2 },
  ]},
  { type: "text", q: "Cuando alguien comete un error que te afecta...", options: [
    { text: "Asumo yo la culpa para no incomodar.", value: 0 },
    { text: "Lo resuelvo y hablo del tema con calma.", value: 1 },
    { text: "Lo regaño delante de los demás.", value: 2 },
  ]},
  { type: "text", q: "Frente a alguien que se muestra inseguro...", options: [
    { text: "Me identifico y me retraigo yo también.", value: 0 },
    { text: "Intento darle confianza.", value: 1 },
    { text: "Aprovecho para tomar el control.", value: 2 },
  ]},
  { type: "text", q: "Cuando pierdes en un juego o competencia...", options: [
    { text: "Siento que no valgo lo suficiente.", value: 0 },
    { text: "Lo acepto y felicito al otro.", value: 1 },
    { text: "Me enojo y busco culpables.", value: 2 },
  ]},
  { type: "image", q: "¿Qué símbolo te representa?", options: [
    { img: "🕊️", label: "Paloma / paz", value: 0 },
    { img: "🌳", label: "Árbol / firmeza", value: 1 },
    { img: "🔥", label: "Fuego / dominio", value: 2 },
  ]},
  { type: "image", q: "Elige una máscara:", options: [
    { img: "😔", label: "Cabizbajo", value: 0 },
    { img: "😌", label: "En paz", value: 1 },
    { img: "😏", label: "Astuto", value: 2 },
  ]},
  { type: "image", q: "En una foto de grupo eliges...", options: [
    { img: "🙈", label: "Esconderme", value: 0 },
    { img: "😊", label: "Salir natural", value: 1 },
    { img: "🤳", label: "Ser el protagonista", value: 2 },
  ]},
  { type: "image", q: "Elige un sonido:", options: [
    { img: "🔇", label: "Silencio", value: 0 },
    { img: "🎵", label: "Melodía", value: 1 },
    { img: "📢", label: "Megáfono", value: 2 },
  ]},
];

/* -----------------------------------------------------------
   2) RESULTADOS por tramos (escala 1 a 10)
----------------------------------------------------------- */
const RESULTS = [
  { min: 1, max: 2,
    title: "Muy 'bulleable'",
    desc: "Tiendes a callar lo que sientes, a ceder casi siempre y a poner las necesidades de los demás muy por encima de las tuyas. Esto puede hacerte vulnerable a que se aprovechen de ti.",
    advice: "Consejo: practica poner pequeños límites y recuerda que tu opinión también es valiosa. Decir \"no\" no te hace mala persona." },
  { min: 3, max: 4,
    title: "Tiendes a ceder",
    desc: "Sueles evitar el conflicto y a veces te quedas callado aunque algo no te parezca. Tienes empatía, pero te falta defender tu propio espacio.",
    advice: "Consejo: trabaja tu asertividad. Puedes ser amable y, a la vez, firme con lo que necesitas." },
  { min: 5, max: 6,
    title: "Equilibrado y asertivo",
    desc: "Sabes escuchar y también defenderte. Buscas acuerdos justos y respetas tanto a los demás como a ti mismo. Es el punto más sano del espectro.",
    advice: "Consejo: mantén ese equilibrio. Sigue cuidando tanto tus límites como la empatía hacia el resto." },
  { min: 7, max: 8,
    title: "Tendencia a dominar",
    desc: "Te gusta tener el control y a veces impones tu voluntad por encima de la de los demás. La firmeza es buena, pero cuidado con cruzar hacia la imposición.",
    advice: "Consejo: practica escuchar antes de responder. El liderazgo sano convence, no avasalla." },
  { min: 9, max: 10,
    title: "Muy 'bully'",
    desc: "Sueles buscar imponerte, ganar a costa de otros y restar importancia a sus sentimientos. Estas conductas pueden dañar tus relaciones y a las personas a tu alrededor.",
    advice: "Consejo: trabajar la empatía cambia vidas, incluida la tuya. Pregúntate cómo se siente el otro antes de actuar." },
];

/* -----------------------------------------------------------
   3) ESTADO DEL JUEGO
----------------------------------------------------------- */
const SESSION_SIZE = 25;    // preguntas por partida (elegidas al azar del banco)
let questions = [];         // preguntas activas de esta partida
let current = 0;            // índice de pregunta actual
let answers = [];           // respuestas elegidas
const STORAGE_KEY = "qpt_last_score";

// URL pública del juego (se usa al compartir para promocionarlo)
const SHARE_URL = "https://mariscosjasu.github.io/qpt/";

// Guardamos el último resultado para poder compartirlo
let lastResult = { score: 5, title: "" };

// Mezcla (Fisher-Yates) devolviendo una copia, sin alterar el original
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// Construye una partida nueva: preguntas al azar y opciones barajadas
function buildSession() {
  const size = Math.min(SESSION_SIZE, QUESTION_POOL.length);
  questions = shuffle(QUESTION_POOL)
    .slice(0, size)
    .map((q) => ({ type: q.type, q: q.q, options: shuffle(q.options) }));
  answers = new Array(questions.length).fill(null);
  current = 0;
}

/* -----------------------------------------------------------
   4) REFERENCIAS AL DOM
----------------------------------------------------------- */
const screens = {
  start: document.getElementById("screen-start"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
};
const els = {
  btnStart: document.getElementById("btn-start"),
  btnBack: document.getElementById("btn-back"),
  btnRetry: document.getElementById("btn-retry"),
  btnHome: document.getElementById("btn-home"),
  questionText: document.getElementById("question-text"),
  answers: document.getElementById("answers"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  resultScore: document.getElementById("result-score"),
  resultTitle: document.getElementById("result-title"),
  resultDesc: document.getElementById("result-desc"),
  resultAdvice: document.getElementById("result-advice"),
  scaleMarker: document.getElementById("scale-marker"),
  bestScore: document.getElementById("best-score"),
  bestScoreValue: document.getElementById("best-score-value"),
  soundToggle: document.getElementById("sound-toggle"),
  soundIcon: document.getElementById("sound-icon"),
  btnShare: document.getElementById("btn-share"),
  shareMenu: document.getElementById("share-menu"),
  shareWa: document.getElementById("share-wa"),
  shareFb: document.getElementById("share-fb"),
  shareTw: document.getElementById("share-tw"),
  shareTg: document.getElementById("share-tg"),
  btnCopy: document.getElementById("btn-copy"),
  copyOk: document.getElementById("copy-ok"),
};

/* -----------------------------------------------------------
   5) NAVEGACIÓN ENTRE PANTALLAS
----------------------------------------------------------- */
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo(0, 0);
}

/* -----------------------------------------------------------
   6) RENDER DE PREGUNTAS
----------------------------------------------------------- */
function renderQuestion() {
  const item = questions[current];
  els.questionText.textContent = item.q;
  els.answers.innerHTML = "";

  item.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    if (item.type === "image") {
      btn.classList.add("answer-image");
      btn.innerHTML =
        '<span class="answer-emoji">' + opt.img + "</span>" +
        '<span class="answer-emoji-label">' + opt.label + "</span>";
    } else {
      btn.textContent = opt.text;
    }
    if (answers[current] === i) btn.classList.add("selected");
    btn.addEventListener("click", () => selectAnswer(i));
    els.answers.appendChild(btn);
  });

  // Progreso
  const pct = ((current) / questions.length) * 100;
  els.progressFill.style.width = pct + "%";
  els.progressText.textContent = (current + 1) + " / " + questions.length;

  // Botón atrás
  els.btnBack.style.visibility = current === 0 ? "hidden" : "visible";
}

function selectAnswer(optionIndex) {
  answers[current] = optionIndex;
  playSelect();

  // Marca visual breve y avanza
  renderQuestion();
  setTimeout(() => {
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 220);
}

/* -----------------------------------------------------------
   7) CÁLCULO DEL RESULTADO (1 a 10)
----------------------------------------------------------- */
function computeScore() {
  let sum = 0;
  answers.forEach((optIndex, qIndex) => {
    if (optIndex !== null) sum += questions[qIndex].options[optIndex].value;
  });
  const maxSum = questions.length * 2; // cada pregunta máximo 2
  let score = Math.round(1 + (sum / maxSum) * 9);
  if (score < 1) score = 1;
  if (score > 10) score = 10;
  return score;
}

function finishQuiz() {
  const score = computeScore();
  saveScore(score);
  showResult(score);
}

function showResult(score) {
  els.resultScore.textContent = score;
  const tier = RESULTS.find((r) => score >= r.min && score <= r.max) || RESULTS[2];
  els.resultTitle.textContent = tier.title;
  els.resultDesc.textContent = tier.desc;
  els.resultAdvice.textContent = tier.advice;

  // Guardamos el resultado para compartir y preparamos los enlaces
  lastResult = { score: score, title: tier.title };
  els.shareMenu.classList.add("hidden");
  els.copyOk.classList.add("hidden");

  // Marcador en la escala (1 -> 0%, 10 -> 100%)
  const pct = ((score - 1) / 9) * 100;
  els.scaleMarker.style.left = pct + "%";

  showScreen("result");
  playResult();
}

/* -----------------------------------------------------------
   7b) COMPARTIR RESULTADO (promociona el juego)
----------------------------------------------------------- */
function buildShareText() {
  return (
    "Mi resultado en \"¿Qué personalidad tienes?\" fue " +
    lastResult.score + "/10: " + lastResult.title + ". " +
    "¿Y tú qué personalidad tienes? Descúbrelo aquí 👉"
  );
}

async function shareResult() {
  const text = buildShareText();
  // 1) Intentar el compartir nativo del dispositivo (móvil: WhatsApp, Instagram, etc.)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "¿Qué personalidad tienes?",
        text: text,
        url: SHARE_URL,
      });
      return;
    } catch (e) {
      // El usuario canceló o no se pudo: mostramos el menú de opciones
    }
  }
  // 2) Si no hay compartir nativo, mostramos los botones de cada red
  buildShareLinks(text);
  els.shareMenu.classList.toggle("hidden");
}

function buildShareLinks(text) {
  const fullText = text + " " + SHARE_URL;
  const eText = encodeURIComponent(fullText);
  const eUrl = encodeURIComponent(SHARE_URL);
  const eShort = encodeURIComponent(text);
  els.shareWa.href = "https://wa.me/?text=" + eText;
  els.shareFb.href = "https://www.facebook.com/sharer/sharer.php?u=" + eUrl + "&quote=" + eShort;
  els.shareTw.href = "https://twitter.com/intent/tweet?text=" + eShort + "&url=" + eUrl;
  els.shareTg.href = "https://t.me/share/url?url=" + eUrl + "&text=" + eShort;
}

async function copyShareText() {
  const fullText = buildShareText() + " " + SHARE_URL;
  try {
    await navigator.clipboard.writeText(fullText);
  } catch (e) {
    // Fallback: seleccionar con un campo temporal
    const ta = document.createElement("textarea");
    ta.value = fullText;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) {}
    document.body.removeChild(ta);
  }
  els.copyOk.classList.remove("hidden");
}

/* -----------------------------------------------------------
   8) GUARDADO EN EL DISPOSITIVO
----------------------------------------------------------- */
function saveScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (e) { /* almacenamiento no disponible */ }
}

function loadBestScore() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) {
      els.bestScoreValue.textContent = v;
      els.bestScore.classList.remove("hidden");
    }
  } catch (e) { /* ignore */ }
}

/* -----------------------------------------------------------
   9) SONIDOS DE CALMA (Web Audio API)
----------------------------------------------------------- */
let audioCtx = null;
let masterGain = null;
let ambientStarted = false;
let soundOn = true;

function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = soundOn ? 0.6 : 0.0;
  masterGain.connect(audioCtx.destination);
}

// Pad ambiental suave y continuo (respiración lenta)
function startAmbient() {
  if (!audioCtx || ambientStarted) return;
  ambientStarted = true;

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.04;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  padGain.connect(filter);
  filter.connect(masterGain);

  // Acorde suave (notas graves)
  [110, 164.81, 220].forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = idx * 4;
    osc.connect(padGain);
    osc.start();
  });

  // LFO que hace "respirar" el volumen
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08;       // muy lento
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(padGain.gain);
  lfo.start();
}

// Tono suave al elegir una respuesta
function playSelect() {
  if (!audioCtx || !soundOn) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, t); // Do agudo
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.65);
}

// Pequeño acorde sereno al ver el resultado
function playResult() {
  if (!audioCtx || !soundOn) return;
  const base = audioCtx.currentTime;
  [392.0, 523.25, 659.25].forEach((freq, i) => {
    const t = base + i * 0.12;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 1.3);
  });
}

function toggleSound() {
  soundOn = !soundOn;
  if (masterGain) {
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(soundOn ? 0.6 : 0.0, t + 0.3);
  }
  els.soundToggle.classList.toggle("muted", !soundOn);
  els.soundIcon.textContent = soundOn ? "♪" : "✕";
  try { localStorage.setItem("qpt_sound", soundOn ? "1" : "0"); } catch (e) {}
}

/* -----------------------------------------------------------
   10) EVENTOS
----------------------------------------------------------- */
els.btnStart.addEventListener("click", () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  startAmbient();
  buildSession();
  renderQuestion();
  showScreen("quiz");
});

els.btnBack.addEventListener("click", () => {
  if (current > 0) { current--; renderQuestion(); }
});

els.btnRetry.addEventListener("click", () => {
  buildSession();
  renderQuestion();
  showScreen("quiz");
});

els.btnHome.addEventListener("click", () => {
  loadBestScore();
  showScreen("start");
});

els.btnShare.addEventListener("click", () => { shareResult(); });
els.btnCopy.addEventListener("click", () => { copyShareText(); });

els.soundToggle.addEventListener("click", () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  if (!ambientStarted) startAmbient();
  toggleSound();
});

/* -----------------------------------------------------------
   11) INICIALIZACIÓN
----------------------------------------------------------- */
(function init() {
  loadBestScore();
  try {
    const s = localStorage.getItem("qpt_sound");
    if (s === "0") { soundOn = false; els.soundToggle.classList.add("muted"); els.soundIcon.textContent = "✕"; }
  } catch (e) {}
})();

/* -----------------------------------------------------------
   12) SERVICE WORKER (offline / instalable)
----------------------------------------------------------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
