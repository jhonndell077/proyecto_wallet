const { onRequest } = require("firebase-functions/v2/https");

const GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_SECRET = "GROQ_API_KEY";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 12000;

function withCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function buildSystemPrompt(runtimeContext = {}) {
  const context = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : {};
  const totals = context.totals || {};
  const counts = context.counts || {};
  return [
    "Eres Asistente Wallet, el copiloto financiero oficial de Income Wallet.",
    "Responde siempre en espanol, de forma directa, clara y operativa.",
    "No inventes datos. Usa el contexto entregado por el frontend como fuente principal.",
    "Ayuda a interpretar balance, ingresos, gastos, cuentas por cobrar, historial y margenes.",
    "Si el usuario pide una accion fuera del alcance del backend, orienta brevemente y sugiere la vista adecuada del sistema.",
    `Negocio actual: ${normalizeText(context.businessName || "Income Wallet")}.`,
    `Vista activa: ${normalizeText(context.currentView || "dashboard")}.`,
    `Usuario actual: ${normalizeText(context.currentUser || "Sin sesion")} (${normalizeText(context.currentRole || "guest")}).`,
    `Balance actual: ${Number(totals.balance || 0)}.`,
    `Ingresos cobrados: ${Number(totals.ingresos || 0)} en ${Number(counts.ingresos || 0)} movimientos.`,
    `Gastos: ${Number(totals.gastos || 0)} en ${Number(counts.gastos || 0)} movimientos.`,
    `Pendiente por cobrar: ${Number(totals.pendiente || 0)} en ${Number(counts.pendientes || 0)} cuentas.`,
    `Movimientos totales: ${Number(counts.movimientos || 0)}.`,
  ].join("\n");
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
}

exports.assistantCapabilities = onRequest({ cors: true, secrets: [GROQ_SECRET] }, async (req, res) => {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Metodo no permitido" });
    return;
  }
  res.status(200).json({
    ok: true,
    agent: "Asistente Wallet",
    providers: {
      groq: {
        configured: Boolean(process.env[GROQ_SECRET]),
        model: DEFAULT_MODEL,
      },
    },
  });
});

exports.assistantChat = onRequest({ cors: true, secrets: [GROQ_SECRET] }, async (req, res) => {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Metodo no permitido" });
    return;
  }

  const apiKey = normalizeText(process.env[GROQ_SECRET]);
  if (!apiKey) {
    res.status(503).json({ ok: false, error: "GROQ_API_KEY no configurada en el backend" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const userMessage = normalizeText(body.userMessage);

  if (!userMessage) {
    res.status(400).json({ ok: false, error: "Falta userMessage" });
    return;
  }

  try {
    const response = await fetchWithTimeout(GROQ_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.55,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(body.runtimeContext),
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      res.status(response.status).json({
        ok: false,
        error: payload?.error?.message || payload?.raw || `HTTP ${response.status}`,
      });
      return;
    }

    const reply = normalizeText(payload?.choices?.[0]?.message?.content);
    res.status(200).json({
      ok: true,
      provider: "groq",
      reply: reply || "No pude generar una respuesta valida.",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: String(error?.message || error || "Error interno del asistente"),
    });
  }
});
