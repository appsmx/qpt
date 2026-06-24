/* ===========================================================
   ¿Qué personalidad tienes?  —  Lógica del juego
   - Banco de preguntas con 5 opciones por fase (sin ambigüedad)
   - Modelo psicológico de respuesta al conflicto:
       0 = Someterse / complacer      (me culpo, cedo, aguanto)
       1 = Evitar / quedarse en blanco (lo ignoro, no hago nada, me alejo)
       2 = Asertivo / equilibrado      (lo hablo con calma, pongo límites)
       3 = Dominar / imponer           (tomo el control, me impongo)
       4 = Atacar / humillar           (respondo peor, lo hago sentir mal)
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

   Cada pregunta tiene 5 opciones, una por cada estilo de respuesta.
   type: "text"  -> opciones con { text, value }
   type: "image" -> opciones con { img, label, value }
   value: 0 someterse | 1 evitar | 2 asertivo | 3 dominar | 4 atacar
----------------------------------------------------------- */
const QUESTION_POOL = [
  { type: "text", q: "Cuando alguien te critica frente a otras personas...", options: [
    { text: "Me callo y pienso que seguramente tienen razón.", value: 0 },
    { text: "Me quedo en blanco y no reacciono.", value: 1 },
    { text: "Lo hablo con calma para entender su punto.", value: 2 },
    { text: "Dejo claro que conmigo no se habla así.", value: 3 },
    { text: "Le respondo con algo que lo deje mal frente a todos.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien te hace una broma pesada...", options: [
    { text: "Me río aunque por dentro me duela.", value: 0 },
    { text: "Hago como si no la hubiera escuchado.", value: 1 },
    { text: "Le digo con claridad que no me gustó.", value: 2 },
    { text: "Le advierto que no se pase conmigo.", value: 3 },
    { text: "Le devuelvo una broma todavía más humillante.", value: 4 },
  ]},
  { type: "text", q: "Ante un conflicto, normalmente...", options: [
    { text: "Cedo para evitar problemas.", value: 0 },
    { text: "Me alejo y dejo que se resuelva solo.", value: 1 },
    { text: "Busco un acuerdo justo para ambos.", value: 2 },
    { text: "Impongo lo que yo quiero.", value: 3 },
    { text: "Voy con todo hasta ganar, cueste lo que cueste.", value: 4 },
  ]},
  { type: "text", q: "Cuando cometo un error frente a otros...", options: [
    { text: "Siento mucha vergüenza y me culpo.", value: 0 },
    { text: "Me quedo callado esperando que nadie lo note.", value: 1 },
    { text: "Lo acepto y trato de aprender.", value: 2 },
    { text: "Le quito importancia y sigo como si nada.", value: 3 },
    { text: "Busco a quién echarle la culpa.", value: 4 },
  ]},
  { type: "text", q: "Decir \"no\" a los demás...", options: [
    { text: "Me cuesta muchísimo, casi nunca puedo.", value: 0 },
    { text: "Lo evito: doy largas o desaparezco.", value: 1 },
    { text: "Lo hago con respeto cuando hace falta.", value: 2 },
    { text: "Lo hago sin que me importe el resto.", value: 3 },
    { text: "Lo hago de forma cortante para que no insistan.", value: 4 },
  ]},
  { type: "text", q: "Si alguien tiene algo que tú quieres...", options: [
    { text: "Pienso que yo no lo merezco.", value: 0 },
    { text: "Lo dejo pasar, ni lo intento.", value: 1 },
    { text: "Trabajo para conseguir el mío.", value: 2 },
    { text: "Hago lo necesario para conseguirlo yo.", value: 3 },
    { text: "Busco la forma de quitárselo.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien cercano está triste o llora...", options: [
    { text: "Me hundo igual o más que esa persona.", value: 0 },
    { text: "No sé qué hacer y me quedo paralizado.", value: 1 },
    { text: "Trato de escuchar y consolar.", value: 2 },
    { text: "Le digo qué tiene que hacer para superarlo.", value: 3 },
    { text: "Pienso que es una debilidad suya.", value: 4 },
  ]},
  { type: "text", q: "En un trabajo en equipo sueles...", options: [
    { text: "Hacer lo que digan los demás.", value: 0 },
    { text: "Pasar desapercibido y aportar poco.", value: 1 },
    { text: "Aportar y escuchar por igual.", value: 2 },
    { text: "Querer dirigir y mandar a todos.", value: 3 },
    { text: "Llevarte el crédito del trabajo de otros.", value: 4 },
  ]},
  { type: "text", q: "Si alguien te empuja \"sin querer\" en la calle...", options: [
    { text: "Pido disculpas yo, aunque no fue mi culpa.", value: 0 },
    { text: "Sigo mi camino como si nada.", value: 1 },
    { text: "Le digo con calma que tenga cuidado.", value: 2 },
    { text: "Le reclamo para que me respete.", value: 3 },
    { text: "Lo empujo de vuelta o lo insulto.", value: 4 },
  ]},
  { type: "text", q: "Cuando recibes una orden que te parece injusta...", options: [
    { text: "La cumplo aunque me moleste por dentro.", value: 0 },
    { text: "La ignoro y hago como que no la escuché.", value: 1 },
    { text: "Pregunto el porqué con respeto.", value: 2 },
    { text: "Me niego e impongo mi voluntad.", value: 3 },
    { text: "Me rebelo y se lo reclamo de mala forma.", value: 4 },
  ]},
  { type: "text", q: "Frente a las críticas en redes sociales...", options: [
    { text: "Las aguanto en silencio y me afectan mucho.", value: 0 },
    { text: "Las ignoro por completo y sigo deslizando.", value: 1 },
    { text: "Las leo con calma y respondo si vale la pena.", value: 2 },
    { text: "Respondo dejando claro que tengo la razón.", value: 3 },
    { text: "Respondo atacando a quien sea.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien tiene una opinión distinta a la tuya...", options: [
    { text: "Cambio la mía para no discutir.", value: 0 },
    { text: "Me callo y cambio de tema.", value: 1 },
    { text: "La respeto aunque no coincida.", value: 2 },
    { text: "Insisto hasta que acepte la mía.", value: 3 },
    { text: "La ridiculizo para que se quede callado.", value: 4 },
  ]},
  { type: "text", q: "Si un grupo se burla de alguien, tú...", options: [
    { text: "Te callas por miedo a ser el siguiente.", value: 0 },
    { text: "Te haces el desentendido y te alejas.", value: 1 },
    { text: "Defiendes a la persona.", value: 2 },
    { text: "Aprovechas para quedar bien con el grupo.", value: 3 },
    { text: "Te unes a las burlas.", value: 4 },
  ]},
  { type: "text", q: "Cuando logras algo importante...", options: [
    { text: "Creo que fue suerte, no lo merezco.", value: 0 },
    { text: "No lo comento, prefiero no llamar la atención.", value: 1 },
    { text: "Me alegro y lo celebro de forma sana.", value: 2 },
    { text: "Me aseguro de que todos sepan que fui yo.", value: 3 },
    { text: "Lo presumo para sentirme por encima de otros.", value: 4 },
  ]},
  { type: "text", q: "Si alguien te falta el respeto...", options: [
    { text: "Lo dejo pasar para no causar problemas.", value: 0 },
    { text: "Me alejo y evito a esa persona.", value: 1 },
    { text: "Pongo un límite con firmeza y calma.", value: 2 },
    { text: "Le dejo claro que conmigo no se juega.", value: 3 },
    { text: "Respondo con algo todavía peor.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien no cumple lo que te prometió...", options: [
    { text: "Lo justifico y no digo nada.", value: 0 },
    { text: "No digo nada pero me alejo de a poco.", value: 1 },
    { text: "Le pregunto con calma qué pasó.", value: 2 },
    { text: "Le exijo que cumpla de inmediato.", value: 3 },
    { text: "Lo expongo y lo hago sentir mal.", value: 4 },
  ]},
  { type: "text", q: "Si alguien se cuela delante de ti en una fila...", options: [
    { text: "No digo nada para evitar problemas.", value: 0 },
    { text: "Me molesto por dentro pero me quedo callado.", value: 1 },
    { text: "Le aviso con calma que había fila.", value: 2 },
    { text: "Le exijo que se vaya al final.", value: 3 },
    { text: "Le reclamo a gritos.", value: 4 },
  ]},
  { type: "text", q: "Cuando das tu opinión en un grupo...", options: [
    { text: "Me da miedo que me juzguen y casi no hablo.", value: 0 },
    { text: "Prefiero quedarme callado y solo observar.", value: 1 },
    { text: "La comparto con naturalidad.", value: 2 },
    { text: "La impongo aunque interrumpa a otros.", value: 3 },
    { text: "Descalifico las opiniones que no me gustan.", value: 4 },
  ]},
  { type: "text", q: "Si un amigo te pide un favor que no puedes hacer...", options: [
    { text: "Digo que sí aunque me perjudique.", value: 0 },
    { text: "Le doy largas hasta que se le olvide.", value: 1 },
    { text: "Le explico con honestidad por qué no puedo.", value: 2 },
    { text: "Le digo que no y punto.", value: 3 },
    { text: "Lo trato mal por haberme molestado.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien te levanta la voz...", options: [
    { text: "Me paralizo y termino obedeciendo.", value: 0 },
    { text: "Me quedo en blanco sin saber qué decir.", value: 1 },
    { text: "Mantengo la calma y respondo.", value: 2 },
    { text: "Levanto la voz todavía más que el otro.", value: 3 },
    { text: "Lo amenazo para que se calle.", value: 4 },
  ]},
  { type: "text", q: "Cuando algo te molesta de otra persona...", options: [
    { text: "Me lo guardo y lo aguanto.", value: 0 },
    { text: "No digo nada y tomo distancia.", value: 1 },
    { text: "Se lo digo con respeto.", value: 2 },
    { text: "Se lo dejo claro sin rodeos.", value: 3 },
    { text: "Se lo echo en cara con dureza.", value: 4 },
  ]},
  { type: "text", q: "Cuando pierdes en un juego o competencia...", options: [
    { text: "Siento que no valgo lo suficiente.", value: 0 },
    { text: "Hago como si no me importara.", value: 1 },
    { text: "Lo acepto y felicito al otro.", value: 2 },
    { text: "Exijo la revancha hasta ganar.", value: 3 },
    { text: "Me enojo y busco culpables.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien te ignora a propósito...", options: [
    { text: "Pienso que hice algo mal y me disculpo.", value: 0 },
    { text: "Lo dejo pasar y me alejo en silencio.", value: 1 },
    { text: "Le pregunto directamente si pasa algo.", value: 2 },
    { text: "Le hago notar que a mí no me ignoran.", value: 3 },
    { text: "Lo ignoro el doble para que le duela.", value: 4 },
  ]},
  { type: "text", q: "Si tienes que pedir ayuda...", options: [
    { text: "Me da pena y prefiero arreglármelas sufriendo solo.", value: 0 },
    { text: "Lo evito y trato de salir como sea sin pedirla.", value: 1 },
    { text: "La pido con naturalidad cuando la necesito.", value: 2 },
    { text: "Espero que los demás me la den sin pedirla.", value: 3 },
    { text: "Exijo que me ayuden como si me lo debieran.", value: 4 },
  ]},
  { type: "text", q: "Cuando alguien comete un error que te afecta...", options: [
    { text: "Asumo yo la culpa para no incomodar.", value: 0 },
    { text: "No digo nada aunque me afecte.", value: 1 },
    { text: "Lo resuelvo y hablo del tema con calma.", value: 2 },
    { text: "Le exijo que lo arregle de inmediato.", value: 3 },
    { text: "Lo regaño delante de los demás.", value: 4 },
  ]},

  { type: "image", q: "¿Con qué cara te identificas al entrar a un grupo nuevo?", options: [
    { img: "😟", label: "Inseguro", value: 0 },
    { img: "😶", label: "Me quedo en blanco", value: 1 },
    { img: "🙂", label: "Tranquilo", value: 2 },
    { img: "😎", label: "Dominante", value: 3 },
    { img: "😈", label: "Provocador", value: 4 },
  ]},
  { type: "image", q: "Elige el animal con el que más te identificas:", options: [
    { img: "🐑", label: "Oveja", value: 0 },
    { img: "🐢", label: "Tortuga", value: 1 },
    { img: "🐬", label: "Delfín", value: 2 },
    { img: "🦁", label: "León", value: 3 },
    { img: "🦂", label: "Escorpión", value: 4 },
  ]},
  { type: "image", q: "¿Qué postura describe tu lenguaje corporal habitual?", options: [
    { img: "🙇", label: "Encogido", value: 0 },
    { img: "🚶", label: "Me alejo", value: 1 },
    { img: "🧍", label: "Firme y sereno", value: 2 },
    { img: "💪", label: "Imponente", value: 3 },
    { img: "🤺", label: "A la ofensiva", value: 4 },
  ]},
  { type: "image", q: "¿Qué emoji usarías más en una discusión?", options: [
    { img: "😢", label: "Tristeza", value: 0 },
    { img: "😶", label: "Sin palabras", value: 1 },
    { img: "😐", label: "Calma", value: 2 },
    { img: "😤", label: "Firmeza", value: 3 },
    { img: "😠", label: "Enojo", value: 4 },
  ]},
  { type: "image", q: "Elige el clima que refleja tu carácter:", options: [
    { img: "🌧️", label: "Lluvia", value: 0 },
    { img: "🌫️", label: "Niebla", value: 1 },
    { img: "⛅", label: "Templado", value: 2 },
    { img: "💨", label: "Viento fuerte", value: 3 },
    { img: "⛈️", label: "Tormenta", value: 4 },
  ]},
  { type: "image", q: "Elige el color que más te representa hoy:", options: [
    { img: "🔵", label: "Azul / retraído", value: 0 },
    { img: "⚪", label: "Blanco / neutro", value: 1 },
    { img: "🟢", label: "Verde / equilibrio", value: 2 },
    { img: "🟠", label: "Naranja / empuje", value: 3 },
    { img: "🔴", label: "Rojo / intensidad", value: 4 },
  ]},
  { type: "image", q: "Elige la escena en la que te sientes mejor:", options: [
    { img: "🫥", label: "Pasar desapercibido", value: 0 },
    { img: "🚪", label: "Poder salir de ahí", value: 1 },
    { img: "👥", label: "Entre iguales", value: 2 },
    { img: "👑", label: "Estar al mando", value: 3 },
    { img: "📢", label: "Ser el centro", value: 4 },
  ]},
  { type: "image", q: "Cuando hay tensión, tu reacción es...", options: [
    { img: "😰", label: "Me angustio", value: 0 },
    { img: "🧊", label: "Me congelo", value: 1 },
    { img: "🧘", label: "Respiro y me calmo", value: 2 },
    { img: "🗣️", label: "Tomo el control", value: 3 },
    { img: "🔥", label: "Estallo", value: 4 },
  ]},
];

/* -----------------------------------------------------------
   2) RESULTADOS por tramos (escala 1 a 10)
----------------------------------------------------------- */
const RESULTS = [
  { min: 1, max: 2,
    title: "Muy complaciente",
    desc: "Sueles ponerte en último lugar: te disculpas aunque no sea tu culpa, cedes casi siempre y te cuesta mucho defender lo que sientes. Eso puede dejarte expuesto a que se aprovechen de ti.",
    advice: "Consejo: empieza por límites pequeños. Tu opinión y tus necesidades también importan; decir \"no\" no te hace mala persona." },
  { min: 3, max: 4,
    title: "Evitativo / pasivo",
    desc: "Tu forma de protegerte es evitar: te quedas en blanco, lo ignoras o te alejas cuando algo te incomoda. No buscas dañar a nadie, pero al no expresar lo que sientes, los problemas suelen quedar sin resolver.",
    advice: "Consejo: practica decir lo que piensas en el momento, aunque sea con una frase corta y tranquila. Evitar el conflicto no es lo mismo que resolverlo." },
  { min: 5, max: 6,
    title: "Equilibrado y asertivo",
    desc: "Sabes escuchar y también defenderte. Hablas con calma, pones límites con respeto y buscas acuerdos justos. Es el punto más sano del espectro: ni te dejas pisar ni pisas a otros.",
    advice: "Consejo: mantén ese equilibrio. Sigue cuidando tanto tus límites como la empatía hacia los demás." },
  { min: 7, max: 8,
    title: "Tiendes a dominar",
    desc: "Te gusta tener el control y a veces impones tu voluntad por encima de la de los demás. La firmeza es una virtud, pero cuidado con cruzar la línea hacia la imposición.",
    advice: "Consejo: escucha antes de responder. El liderazgo sano convence y suma, no avasalla." },
  { min: 9, max: 10,
    title: "Muy 'bully'",
    desc: "Tiendes a imponerte, ganar a costa de otros y restar importancia a sus sentimientos. Estas conductas pueden dañar tus relaciones y a las personas a tu alrededor.",
    advice: "Consejo: trabajar la empatía puede cambiar vidas, incluida la tuya. Antes de actuar, pregúntate cómo se sentiría el otro." },
];

/* -----------------------------------------------------------
   3) ESTADO DEL JUEGO
----------------------------------------------------------- */
const SESSION_SIZE = 25;    // preguntas por partida (elegidas al azar del banco)
let questions = [];         // preguntas activas de esta partida
let current = 0;            // índice de pregunta actual
let answers = [];           // respuestas elegidas
const STORAGE_KEY = "qpt_last_score";
const STORAGE_NAME = "qpt_name";

// Nombre del jugador (para personalizar resultado y compartir)
let playerName = "";

// URL pública del juego (se usa al compartir para promocionarlo)
const SHARE_URL = "https://mariscosjasu.github.io/qpt/";
const SHARE_URL_CORTA = "mariscosjasu.github.io/qpt";

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
  playerName: document.getElementById("player-name"),
  resultLabel: document.getElementById("result-label"),
  soundToggle: document.getElementById("sound-toggle"),
  soundIcon: document.getElementById("sound-icon"),
  btnShare: document.getElementById("btn-share"),
  btnStory: document.getElementById("btn-story"),
  storyHint: document.getElementById("story-hint"),
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
  const maxSum = questions.length * 4; // cada pregunta máximo 4
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

  // Encabezado personalizado con el nombre, si lo hay
  els.resultLabel.textContent = playerName
    ? playerName + ", tu resultado es"
    : "Tu resultado";

  // Guardamos el resultado para compartir y preparamos los enlaces
  lastResult = { score: score, title: tier.title };
  els.shareMenu.classList.add("hidden");
  els.copyOk.classList.add("hidden");
  els.storyHint.classList.add("hidden");

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
  if (playerName) {
    return (
      playerName + " obtuvo " + lastResult.score + "/10 en " +
      "\"¿Qué personalidad tienes?\": " + lastResult.title + ". " +
      "¿Y tú qué personalidad tienes? Descúbrelo aquí 👉"
    );
  }
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

async function copyToClipboard(textToCopy) {
  try {
    await navigator.clipboard.writeText(textToCopy);
  } catch (e) {
    // Fallback: seleccionar con un campo temporal
    const ta = document.createElement("textarea");
    ta.value = textToCopy;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) {}
    document.body.removeChild(ta);
  }
}

async function copyShareText() {
  await copyToClipboard(buildShareText() + " " + SHARE_URL);
  els.copyOk.classList.remove("hidden");
}

/* -----------------------------------------------------------
   7c) IMAGEN PARA INSTAGRAM STORIES (1080 x 1920)
   Dibuja una tarjeta vertical con el resultado y la comparte
   como archivo (o la descarga si el dispositivo no permite
   compartir imágenes). Además copia el enlace al portapapeles
   para que el usuario lo pegue en el sticker "Enlace" de la
   historia y sus amigos puedan entrar con un toque.
----------------------------------------------------------- */
function makeStoryBlob() {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const x = canvas.getContext("2d");

    // Fondo crema con leve degradado
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#ddd8c9");
    bg.addColorStop(1, "#e9e6dc");
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);

    // Marco retro
    x.strokeStyle = "#2e3a36";
    x.lineWidth = 10;
    x.strokeRect(60, 60, W - 120, H - 120);

    x.textAlign = "center";

    // Etiqueta superior
    x.fillStyle = "#5c6b64";
    x.font = "bold 38px 'Courier New', monospace";
    x.fillText("T E S T   D E   P E R S O N A L I D A D", W / 2, 230);

    // Título
    x.fillStyle = "#2e4a45";
    x.font = "bold 78px 'Courier New', monospace";
    x.fillText("¿Qué personalidad", W / 2, 360);
    x.fillText("tienes?", W / 2, 450);

    // Saludo con nombre (si lo hay)
    if (playerName) {
      x.fillStyle = "#2e3a36";
      x.font = "bold 56px 'Courier New', monospace";
      x.fillText(playerName, W / 2, 600);
    }

    // Círculo de puntuación
    const cx = W / 2, cy = 880, r = 250;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fillStyle = "#f4f2ea";
    x.fill();
    x.lineWidth = 12;
    x.strokeStyle = "#2e3a36";
    x.stroke();
    x.fillStyle = "#2e4a45";
    x.font = "bold 230px 'Courier New', monospace";
    x.textBaseline = "middle";
    x.fillText(String(lastResult.score), cx, cy - 10);
    x.font = "bold 60px 'Courier New', monospace";
    x.fillStyle = "#5c6b64";
    x.fillText("/ 10", cx, cy + 150);
    x.textBaseline = "alphabetic";

    // Perfil (título del resultado)
    x.fillStyle = "#2e4a45";
    x.font = "bold 62px 'Courier New', monospace";
    x.fillText(lastResult.title, W / 2, 1300);

    // Barra de escala con degradado
    const bx = 160, bw = W - 320, by = 1420, bh = 26;
    const grad = x.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, "#7aa0c4");
    grad.addColorStop(0.5, "#6f9b8f");
    grad.addColorStop(1, "#c98b6b");
    x.fillStyle = grad;
    x.fillRect(bx, by, bw, bh);
    x.strokeStyle = "#2e3a36";
    x.lineWidth = 4;
    x.strokeRect(bx, by, bw, bh);
    // Marcador
    const mx = bx + ((lastResult.score - 1) / 9) * bw;
    x.fillStyle = "#2e3a36";
    x.fillRect(mx - 5, by - 18, 10, bh + 36);
    // Etiquetas de la escala
    x.fillStyle = "#5c6b64";
    x.font = "32px 'Courier New', monospace";
    x.textAlign = "left";   x.fillText("Abusado", bx, by + 90);
    x.textAlign = "center"; x.fillText("Equilibrio", W / 2, by + 90);
    x.textAlign = "right";  x.fillText("Abusador", bx + bw, by + 90);

    // Llamado a la acción
    x.textAlign = "center";
    x.fillStyle = "#2e4a45";
    x.font = "bold 46px 'Courier New', monospace";
    x.fillText("¿Y tú qué personalidad tienes?", W / 2, 1640);

    // Enlace
    x.fillStyle = "#4a6f8a";
    x.font = "bold 40px 'Courier New', monospace";
    x.fillText("👉 " + SHARE_URL_CORTA, W / 2, 1730);

    canvas.toBlob((b) => resolve(b), "image/png");
  });
}

async function shareStory() {
  els.storyHint.classList.add("hidden");
  const blob = await makeStoryBlob();
  if (!blob) return;
  const file = new File([blob], "mi-personalidad.png", { type: "image/png" });

  // Copiamos el enlace para que lo peguen en el sticker "Enlace" de la historia
  await copyToClipboard(SHARE_URL);

  // 1) Intentar compartir la imagen (en móvil aparece "Instagram Stories")
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "¿Qué personalidad tienes?",
        text: buildShareText() + " " + SHARE_URL,
      });
      els.storyHint.innerHTML =
        'Para que entren con un toque: en tu historia agrega el sticker ' +
        '<strong>"Enlace"</strong> y pega la dirección (ya la copiamos por ti) 👉 ' +
        SHARE_URL_CORTA;
      els.storyHint.classList.remove("hidden");
      return;
    } catch (e) {
      // cancelado o no permitido -> descargamos
    }
  }

  // 2) Fallback: descargar la imagen para subirla manualmente a la historia
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mi-personalidad.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  els.storyHint.innerHTML =
    'Imagen descargada 📥. Súbela a tu historia y agrega el sticker ' +
    '<strong>"Enlace"</strong> con esta dirección (ya la copiamos por ti): ' +
    SHARE_URL_CORTA;
  els.storyHint.classList.remove("hidden");
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
  playerName = (els.playerName.value || "").trim();
  try { localStorage.setItem(STORAGE_NAME, playerName); } catch (e) {}
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
els.btnStory.addEventListener("click", () => { shareStory(); });

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
    const savedName = localStorage.getItem(STORAGE_NAME);
    if (savedName) { playerName = savedName; els.playerName.value = savedName; }
  } catch (e) {}
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
