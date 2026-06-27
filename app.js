const STORAGE_KEY = "incomewallet_finance_data_v1";
const SETTINGS_KEY = "incomewallet_finance_settings_v1";
const ADMIN_SESSION_KEY = "incomewallet_master_session_v1";
const MONITORED_SOURCES_KEY = "incomewallet_monitored_sources_v1";
const MARGIN_YEARS = ["2026", "2027", "2028", "2029", "3030"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SWEET_MIGRATION_KEY = "incomewallet_sweet_surprise_migration_v1";
const SWEET_API_KEY = "AIzaSyCxSBFUC5V4RsU3FBjZtw_-4lsfy0hlmwg";
const SWEET_SOURCE_NAME = "Sweet Surprise";
const SWEET_MIGRATION_URL = `https://firestore.googleapis.com/v1/projects/sweet-surprise-2026-app/databases/(default)/documents/sweet_surprise/shared_state?key=${SWEET_API_KEY}`;
const MASTER_USERNAME = "Jssantana077";
const MASTER_PASSWORD = "160623";
const DEFAULT_MONITORED_SOURCES = [
  {
    id: "source-sweet-surprise",
    label: "Sweet Surprise",
    projectId: "sweet-surprise-2026-app",
    collection: "sweet_surprise",
    document: "shared_state",
    apiKey: SWEET_API_KEY,
  },
  {
    id: "source-proyecto-wally",
    label: "Proyecto Wally",
    projectId: "proyecto-wally-80e18",
    collection: "proyecto_wally",
    document: "shared_state",
    apiKey: "AIzaSyBBlzyoPm5_pDGwmurSImRJyD92EBAoIdo",
  },
];

const state = {
  movements: [],
  settings: {
    businessName: "Income Wallet",
    tagline: "Control financiero moderno",
  },
  marginView: {
    year: MARGIN_YEARS[0],
    monthIndex: 0,
  },
  admin: {
    isAuthenticated: false,
    monitoredSources: [],
    sourceSnapshots: [],
  },
};

const els = {
  navLinks: [...document.querySelectorAll(".nav-link")],
  views: [...document.querySelectorAll(".view")],
  quickActions: [...document.querySelectorAll(".quick-action")],
  statJumpCards: [...document.querySelectorAll("[data-view-jump]")],
  form: document.querySelector("#movement-form"),
  formTitle: document.querySelector("#form-title"),
  resetFormButton: document.querySelector("#btn-reset-form"),
  historyList: document.querySelector("#history-list"),
  receivablesList: document.querySelector("#receivables-list"),
  searchInput: document.querySelector("#search-input"),
  filterType: document.querySelector("#filter-type"),
  insights: document.querySelector("#insights"),
  chart: document.querySelector("#cashflow-chart"),
  sidebarBalance: document.querySelector("#sidebar-balance"),
  sidebarBalanceCaption: document.querySelector("#sidebar-balance-caption"),
  sidebarCuentas: document.querySelector("#sidebar-cuentas"),
  sidebarCuentasCaption: document.querySelector("#sidebar-cuentas-caption"),
  settingsForm: document.querySelector("#settings-form"),
  businessName: document.querySelector("#business-name"),
  businessTagline: document.querySelector("#business-tagline"),
  marginYearStrip: document.querySelector("#margin-year-strip"),
  monthFolders: document.querySelector("#month-folders"),
  marginPeriodLabel: document.querySelector("#margin-period-label"),
  marginSalesValue: document.querySelector("#margin-sales-value"),
  marginCountValue: document.querySelector("#margin-count-value"),
  marginTableBody: document.querySelector("#margin-table-body"),
  marginEmptyState: document.querySelector("#margin-empty-state"),
  generateMarginsButton: document.querySelector("#btn-generar-margenes"),
  marginModal: document.querySelector("#margin-analysis-modal"),
  closeMarginModalButton: document.querySelector("#btn-close-margin-modal"),
  bestMonthLabel: document.querySelector("#best-month-label"),
  bestMonthDetail: document.querySelector("#best-month-detail"),
  worstMonthLabel: document.querySelector("#worst-month-label"),
  worstMonthDetail: document.querySelector("#worst-month-detail"),
  marginCandlesChart: document.querySelector("#margin-candles-chart"),
  adminOnly: [...document.querySelectorAll(".admin-only")],
  adminAccessButton: document.querySelector("#btn-admin-access"),
  adminLogoutButton: document.querySelector("#btn-admin-logout"),
  adminAccessModal: document.querySelector("#admin-access-modal"),
  closeAdminModalButton: document.querySelector("#btn-close-admin-modal"),
  adminLoginForm: document.querySelector("#admin-login-form"),
  adminLoginStatus: document.querySelector("#admin-login-status"),
  adminSourcesList: document.querySelector("#admin-sources-list"),
  adminRefreshButton: document.querySelector("#btn-refresh-admin"),
  adminSourceForm: document.querySelector("#admin-source-form"),
  adminSourceLabel: document.querySelector("#admin-source-label"),
  adminSourceProject: document.querySelector("#admin-source-project"),
  adminSourceCollection: document.querySelector("#admin-source-collection"),
  adminSourceDocument: document.querySelector("#admin-source-document"),
  adminSourceKey: document.querySelector("#admin-source-key"),
  adminKpiSources: document.querySelector("#admin-kpi-sources"),
  adminKpiSourcesMeta: document.querySelector("#admin-kpi-sources-meta"),
  adminKpiIncome: document.querySelector("#admin-kpi-income"),
  adminKpiIncomeMeta: document.querySelector("#admin-kpi-income-meta"),
  adminKpiExpense: document.querySelector("#admin-kpi-expense"),
  adminKpiExpenseMeta: document.querySelector("#admin-kpi-expense-meta"),
  adminKpiReceivable: document.querySelector("#admin-kpi-receivable"),
  adminKpiReceivableMeta: document.querySelector("#admin-kpi-receivable-meta"),
};

const kpiIds = {
  ingresos: document.querySelector("#kpi-ingresos"),
  ingresosMeta: document.querySelector("#kpi-ingresos-meta"),
  gastos: document.querySelector("#kpi-gastos"),
  gastosMeta: document.querySelector("#kpi-gastos-meta"),
  porCobrar: document.querySelector("#kpi-por-cobrar"),
  porCobrarMeta: document.querySelector("#kpi-por-cobrar-meta"),
  balance: document.querySelector("#kpi-balance"),
  balanceMeta: document.querySelector("#kpi-balance-meta"),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ("mapValue" in value) {
    const fields = value.mapValue.fields || {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, fieldValue]) => [key, decodeFirestoreValue(fieldValue)]),
    );
  }
  return null;
}

function normalizeExternalAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  let normalized = raw.replace(/[^\d,.\-]/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function buildSweetMovementKey(prefix, item) {
  return [
    prefix,
    item.id || item.ingresoId || "",
    item.fecha || "",
    item.tipoVenta || item.tipoGasto || "",
    item.descripcion || "",
    normalizeExternalAmount(item.monto).toFixed(2),
  ].join("|");
}

function buildSweetReceivableMaps(remoteState) {
  const byIngresoId = new Map();
  const byComposite = new Map();
  const receivables = Array.isArray(remoteState.cxc) ? remoteState.cxc : [];

  receivables.forEach((item) => {
    const dueDate = item.fechaCobro || "";
    if (item.ingresoId) byIngresoId.set(item.ingresoId, dueDate);
    byComposite.set(
      [item.fecha || "", item.tipoVenta || "", item.descripcion || "", normalizeExternalAmount(item.monto).toFixed(2)].join("|"),
      dueDate,
    );
  });

  return { byIngresoId, byComposite };
}

function mapSweetStateToMovements(remoteState) {
  const { byIngresoId, byComposite } = buildSweetReceivableMaps(remoteState);
  const ingresos = Array.isArray(remoteState.ingresos) ? remoteState.ingresos : [];
  const gastos = Array.isArray(remoteState.gastos) ? remoteState.gastos : [];
  const receivables = Array.isArray(remoteState.cxc) ? remoteState.cxc : [];
  const importedIngresoIds = new Set();
  const importedCompositeKeys = new Set();

  const mappedIngresos = ingresos.map((item) => {
    const amount = normalizeExternalAmount(item.monto);
    const isPaid = String(item.cobrado || "").trim().toLowerCase() === "si";
    const compositeKey = [item.fecha || "", item.tipoVenta || "", item.descripcion || "", amount.toFixed(2)].join("|");
    const sourceKey = buildSweetMovementKey("ingreso", item);
    if (item.id) importedIngresoIds.add(item.id);
    importedCompositeKeys.add(compositeKey);

    return {
      id: uid(),
      type: "ingreso",
      date: item.fecha || "",
      category: (item.tipoVenta || "Ingreso").trim(),
      paymentMethod: (item.metodo || "Efectivo").trim(),
      amount,
      client: (item.nombreCliente || "").trim(),
      phone: (item.numeroCliente || "").trim(),
      dueDate: isPaid ? "" : byIngresoId.get(item.id) || byComposite.get(compositeKey) || "",
      description: (item.descripcion || item.tipoVenta || "Ingreso migrado").trim(),
      isPaid,
      sourceApp: SWEET_SOURCE_NAME,
      sourceBusinessName: SWEET_SOURCE_NAME,
      sourceKey,
    };
  });

  const mappedGastos = gastos.map((item) => ({
    id: uid(),
    type: "gasto",
    date: item.fecha || "",
    category: (item.tipoGasto || "Gasto").trim(),
    paymentMethod: (item.metodo || "Efectivo").trim(),
    amount: normalizeExternalAmount(item.monto),
    client: "",
    phone: "",
    dueDate: "",
    description: (item.descripcion || item.tipoGasto || "Gasto migrado").trim(),
    isPaid: true,
    sourceApp: SWEET_SOURCE_NAME,
    sourceBusinessName: SWEET_SOURCE_NAME,
    sourceKey: buildSweetMovementKey("gasto", item),
  }));

  const mappedReceivablesOnly = receivables
    .map((item) => {
      const compositeKey = [item.fecha || "", item.tipoVenta || "", item.descripcion || "", normalizeExternalAmount(item.monto).toFixed(2)].join("|");
      if ((item.ingresoId && importedIngresoIds.has(item.ingresoId)) || importedCompositeKeys.has(compositeKey)) return null;

      const sourceKey = buildSweetMovementKey("cxc", item);

      return {
        id: uid(),
        type: "ingreso",
        date: item.fecha || "",
        category: (item.tipoVenta || "Ingreso").trim(),
        paymentMethod: "Credito",
        amount: normalizeExternalAmount(item.monto),
        client: "",
        phone: "",
        dueDate: item.fechaCobro || "",
        description: (item.descripcion || item.tipoVenta || "Cuenta por cobrar migrada").trim(),
        isPaid: String(item.estado || "").trim().toLowerCase() === "si",
        sourceApp: SWEET_SOURCE_NAME,
        sourceBusinessName: SWEET_SOURCE_NAME,
        sourceKey,
      };
    })
    .filter(Boolean);

  return [...mappedIngresos, ...mappedGastos, ...mappedReceivablesOnly].filter(
    (item) => item.date && item.amount > 0,
  );
}

async function fetchSweetRemoteState() {
  const response = await fetch(SWEET_MIGRATION_URL, { method: "GET" });
  if (!response.ok) {
    throw new Error(`No se pudo leer ${SWEET_SOURCE_NAME} (${response.status})`);
  }

  const payload = await response.json();
  const decoded = decodeFirestoreValue({ mapValue: { fields: payload.fields || {} } });
  return decoded && decoded.state ? decoded.state : null;
}

function getPreferredBusinessName() {
  const customName = String(state.settings.businessName || "").trim();
  if (customName && customName !== "Income Wallet") return customName;

  const sourceName = state.movements.find((item) => String(item.sourceBusinessName || "").trim())?.sourceBusinessName;
  if (sourceName) return sourceName;

  return customName || "Income Wallet";
}

async function migrateFromSweetSurprise({ automatic = false } = {}) {
  const remoteState = await fetchSweetRemoteState();
  if (!remoteState) {
    throw new Error(`${SWEET_SOURCE_NAME} no devolvio datos para migrar.`);
  }

  const importedMovements = mapSweetStateToMovements(remoteState);
  const localMovements = state.movements.filter((item) => item.sourceApp !== SWEET_SOURCE_NAME);
  state.movements = [...localMovements, ...importedMovements];
  state.settings.businessName = SWEET_SOURCE_NAME;
  state.settings.tagline = "Ingresos, gastos y seguimiento de cobros";

  localStorage.setItem(
    SWEET_MIGRATION_KEY,
    JSON.stringify({
      migratedAt: new Date().toISOString(),
      count: importedMovements.length,
      automatic,
    }),
  );

  saveState();
  render();
}

async function attemptInitialSweetMigration() {
  try {
    await migrateFromSweetSurprise({ automatic: true });
  } catch (error) {
    console.error(`No se pudo completar la migracion inicial desde ${SWEET_SOURCE_NAME}:`, error);
  }
}

function removeLegacyWallyData() {
  state.movements = state.movements.filter((item) => item.sourceApp !== "Proyecto Wally");
  localStorage.removeItem("incomewallet_wally_migration_v1");
}

function loadAdminSession() {
  state.admin.isAuthenticated = localStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

function persistAdminSession(isAuthenticated) {
  state.admin.isAuthenticated = isAuthenticated;
  if (isAuthenticated) localStorage.setItem(ADMIN_SESSION_KEY, "active");
  else localStorage.removeItem(ADMIN_SESSION_KEY);
}

function loadMonitoredSources() {
  try {
    const raw = localStorage.getItem(MONITORED_SOURCES_KEY);
    if (!raw) {
      state.admin.monitoredSources = DEFAULT_MONITORED_SOURCES.slice();
      return;
    }

    const parsed = JSON.parse(raw);
    state.admin.monitoredSources = Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_MONITORED_SOURCES.slice();
  } catch {
    state.admin.monitoredSources = DEFAULT_MONITORED_SOURCES.slice();
  }
}

function saveMonitoredSources() {
  localStorage.setItem(MONITORED_SOURCES_KEY, JSON.stringify(state.admin.monitoredSources));
}

function setAdminMode(isAuthenticated) {
  persistAdminSession(isAuthenticated);
  els.adminOnly.forEach((element) => {
    element.hidden = !isAuthenticated;
  });

  if (!isAuthenticated && document.querySelector("#admin").classList.contains("is-active")) {
    setActiveView("dashboard");
  }
}

function openAdminModal() {
  els.adminLoginStatus.hidden = true;
  els.adminLoginStatus.textContent = "";
  if (typeof els.adminAccessModal.showModal === "function") {
    els.adminAccessModal.showModal();
  }
}

function closeAdminModal() {
  if (els.adminAccessModal.open) els.adminAccessModal.close();
}

function buildFirestoreDocumentUrl(source) {
  return `https://firestore.googleapis.com/v1/projects/${source.projectId}/databases/(default)/documents/${source.collection}/${source.document}?key=${source.apiKey}`;
}

function summarizeRemoteState(remoteState) {
  const ingresos = Array.isArray(remoteState.ingresos) ? remoteState.ingresos : [];
  const gastos = Array.isArray(remoteState.gastos) ? remoteState.gastos : [];
  const cxc = Array.isArray(remoteState.cxc) ? remoteState.cxc : [];

  const ingresosCobrados = ingresos
    .filter((item) => String(item.cobrado || "").trim().toLowerCase() === "si")
    .reduce((sum, item) => sum + normalizeExternalAmount(item.monto), 0);
  const gastosTotal = gastos.reduce((sum, item) => sum + normalizeExternalAmount(item.monto), 0);
  const porCobrar = cxc.reduce((sum, item) => sum + normalizeExternalAmount(item.monto), 0);

  return {
    ingresosCount: ingresos.length,
    gastosCount: gastos.length,
    pendientesCount: cxc.length,
    ingresosCobrados,
    gastosTotal,
    porCobrar,
    balance: ingresosCobrados - gastosTotal,
  };
}

async function fetchRemoteSourceSnapshot(source) {
  const response = await fetch(buildFirestoreDocumentUrl(source), { method: "GET" });
  if (!response.ok) {
    throw new Error(`No se pudo leer ${source.label} (${response.status})`);
  }

  const payload = await response.json();
  const decoded = decodeFirestoreValue({ mapValue: { fields: payload.fields || {} } });
  const remoteState = decoded && decoded.state ? decoded.state : {};
  return {
    source,
    summary: summarizeRemoteState(remoteState),
    updatedAt: decoded?.updatedAt || "",
    status: "ok",
  };
}

async function refreshAdminMonitor() {
  if (!state.admin.isAuthenticated) return;

  const snapshots = await Promise.all(
    state.admin.monitoredSources.map(async (source) => {
      try {
        return await fetchRemoteSourceSnapshot(source);
      } catch (error) {
        return {
          source,
          summary: {
            ingresosCount: 0,
            gastosCount: 0,
            pendientesCount: 0,
            ingresosCobrados: 0,
            gastosTotal: 0,
            porCobrar: 0,
            balance: 0,
          },
          updatedAt: "",
          status: "error",
          error: error.message,
        };
      }
    }),
  );

  state.admin.sourceSnapshots = snapshots;
  renderAdminPanel();
}

function renderAdminPanel() {
  const snapshots = state.admin.sourceSnapshots;
  const totals = snapshots.reduce(
    (acc, item) => {
      acc.income += item.summary.ingresosCobrados;
      acc.expense += item.summary.gastosTotal;
      acc.receivable += item.summary.porCobrar;
      acc.incomeCount += item.summary.ingresosCount;
      acc.expenseCount += item.summary.gastosCount;
      acc.pendingCount += item.summary.pendientesCount;
      return acc;
    },
    { income: 0, expense: 0, receivable: 0, incomeCount: 0, expenseCount: 0, pendingCount: 0 },
  );

  els.adminKpiSources.textContent = String(state.admin.monitoredSources.length);
  els.adminKpiSourcesMeta.textContent = `${snapshots.filter((item) => item.status === "ok").length} fuente(s) accesibles`;
  els.adminKpiIncome.textContent = formatCurrency(totals.income);
  els.adminKpiIncomeMeta.textContent = `${totals.incomeCount} ingresos remotos`;
  els.adminKpiExpense.textContent = formatCurrency(totals.expense);
  els.adminKpiExpenseMeta.textContent = `${totals.expenseCount} gastos remotos`;
  els.adminKpiReceivable.textContent = formatCurrency(totals.receivable);
  els.adminKpiReceivableMeta.textContent = `${totals.pendingCount} pendientes remotos`;

  if (!snapshots.length) {
    els.adminSourcesList.innerHTML = `
      <div class="admin-source-empty">
        <strong>${state.admin.monitoredSources.length ? "Monitoreo pendiente" : "Sin cuentas registradas"}</strong>
        <p class="config-note">${state.admin.monitoredSources.length ? "Inicia una actualizacion para consultar las fuentes registradas." : "Agrega una fuente nueva para monitorear otras cuentas desde Income Wallet."}</p>
      </div>
    `;
    return;
  }

  els.adminSourcesList.innerHTML = snapshots
    .map(
      (item) => `
        <article class="admin-source-card">
          <div class="admin-source-head">
            <div>
              <p class="eyebrow">${item.source.projectId}</p>
              <strong>${item.source.label}</strong>
            </div>
            <span class="admin-badge ${item.status === "ok" ? "ok" : "error"}">${item.status === "ok" ? "Activa" : "Error"}</span>
          </div>
          <div class="admin-source-meta">
            <span class="config-note">Coleccion: ${item.source.collection} / Documento: ${item.source.document}</span>
            <span class="config-note">${item.updatedAt ? `Actualizado: ${item.updatedAt}` : item.error || "Sin sello de actualizacion"}</span>
          </div>
          <div class="admin-source-metrics">
            <div class="admin-mini-kpi">
              <p>Ingresos</p>
              <strong>${formatCurrency(item.summary.ingresosCobrados)}</strong>
            </div>
            <div class="admin-mini-kpi">
              <p>Gastos</p>
              <strong>${formatCurrency(item.summary.gastosTotal)}</strong>
            </div>
            <div class="admin-mini-kpi">
              <p>Por cobrar</p>
              <strong>${formatCurrency(item.summary.porCobrar)}</strong>
            </div>
          </div>
          <div class="admin-source-actions">
            <span class="config-note">${item.summary.ingresosCount} ingresos, ${item.summary.gastosCount} gastos, ${item.summary.pendientesCount} pendientes</span>
            <button class="mini-button danger" data-remove-source="${item.source.id}">Eliminar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movements));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadState() {
  const savedMovements = localStorage.getItem(STORAGE_KEY);
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (savedMovements) {
    try {
      state.movements = JSON.parse(savedMovements);
    } catch {
      state.movements = [];
    }
  }

  if (savedSettings) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    } catch {
      state.settings = { ...state.settings };
    }
  }
}

function setActiveView(viewId) {
  if (viewId === "admin" && !state.admin.isAuthenticated) {
    openAdminModal();
    return;
  }

  els.navLinks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewId);
  });

  els.views.forEach((section) => {
    section.classList.toggle("is-active", section.id === viewId);
  });
}

function getSummary() {
  const ingresosPagados = state.movements.filter(
    (item) => item.type === "ingreso" && item.isPaid,
  );
  const gastos = state.movements.filter((item) => item.type === "gasto");
  const pendientes = state.movements.filter(
    (item) => item.type === "ingreso" && !item.isPaid,
  );

  const totalIngresos = ingresosPagados.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalGastos = gastos.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalPendiente = pendientes.reduce((acc, item) => acc + Number(item.amount), 0);

  return {
    totalIngresos,
    totalGastos,
    totalPendiente,
    balance: totalIngresos - totalGastos,
    ingresosPagados,
    gastos,
    pendientes,
  };
}

function renderSummary() {
  const summary = getSummary();

  kpiIds.ingresos.textContent = formatCurrency(summary.totalIngresos);
  kpiIds.ingresosMeta.textContent = `${summary.ingresosPagados.length} movimientos`;
  kpiIds.gastos.textContent = formatCurrency(summary.totalGastos);
  kpiIds.gastosMeta.textContent = `${summary.gastos.length} movimientos`;
  kpiIds.porCobrar.textContent = formatCurrency(summary.totalPendiente);
  kpiIds.porCobrarMeta.textContent = `${summary.pendientes.length} pendientes`;
  kpiIds.balance.textContent = formatCurrency(summary.balance);

  const balanceCaption =
    summary.balance >= 0
      ? "Tu operacion esta positiva"
      : "Tus gastos superan los ingresos cobrados";
  kpiIds.balanceMeta.textContent = balanceCaption;

  els.sidebarBalance.textContent = formatCurrency(summary.balance);
  els.sidebarBalanceCaption.textContent = balanceCaption;
  els.sidebarCuentas.textContent = formatCurrency(summary.totalPendiente);
  els.sidebarCuentasCaption.textContent = `${summary.pendientes.length} clientes pendientes`;
}

function renderInsights() {
  const summary = getSummary();
  const recentPending = [...summary.pendientes]
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 3);

  const cards = [
    {
      title: "Negocio",
      text: state.settings.businessName || "Income Wallet",
    },
    {
      title: "Movimiento dominante",
      text:
        summary.totalIngresos >= summary.totalGastos
          ? "Los ingresos lideran el flujo actual."
          : "Los gastos dominan el flujo actual.",
    },
    {
      title: "Cobro mas proximo",
      text: recentPending[0]
        ? `${recentPending[0].client || recentPending[0].description || "Pendiente"} - ${formatDate(recentPending[0].dueDate)}`
        : "No hay cuentas por cobrar pendientes.",
    },
  ];

  els.insights.innerHTML = cards
    .map(
      (card) => `
        <article class="insight-card">
          <p class="eyebrow">${card.title}</p>
          <strong>${card.text}</strong>
        </article>
      `,
    )
    .join("");
}

function buildEmptyState() {
  return document.querySelector("#empty-state-template").content.cloneNode(true);
}

function renderHistory() {
  const search = els.searchInput.value.trim().toLowerCase();
  const filter = els.filterType.value;

  const items = [...state.movements]
    .sort((a, b) => `${b.date}`.localeCompare(`${a.date}`))
    .filter((item) => {
      const matchesSearch = [item.description, item.category, item.client, item.paymentMethod]
        .join(" ")
        .toLowerCase()
        .includes(search);

      const matchesFilter =
        filter === "todos" ||
        item.type === filter ||
        (filter === "pendiente" && item.type === "ingreso" && !item.isPaid);

      return matchesSearch && matchesFilter;
    });

  els.historyList.innerHTML = "";

  if (!items.length) {
    els.historyList.append(buildEmptyState());
    return;
  }

  els.historyList.innerHTML = items
    .map(
      (item) => `
        <article class="history-item">
          <div class="history-item-head">
            <div>
              <span class="pill ${item.type === "gasto" ? "gasto" : !item.isPaid ? "pendiente" : "ingreso"}">
                ${item.type === "gasto" ? "Gasto" : item.isPaid ? "Ingreso" : "Pendiente"}
              </span>
              <h4>${item.description || "Sin descripcion"}</h4>
            </div>
            <strong class="history-amount">${formatCurrency(item.amount)}</strong>
          </div>
          <div class="meta-row">
            <span>${formatDate(item.date)}</span>
            <span>${item.category}</span>
            <span>${item.paymentMethod}</span>
            ${item.client ? `<span>${item.client}</span>` : ""}
          </div>
          <div class="meta-row">
            ${item.dueDate ? `<span>Cobro: ${formatDate(item.dueDate)}</span>` : ""}
            ${item.phone ? `<span>${item.phone}</span>` : ""}
          </div>
          <div class="card-actions">
            <button class="mini-button" data-action="edit" data-id="${item.id}">Editar</button>
            ${
              item.type === "ingreso" && !item.isPaid
                ? `<button class="mini-button success" data-action="mark-paid" data-id="${item.id}">Marcar cobrado</button>`
                : ""
            }
            <button class="mini-button danger" data-action="delete" data-id="${item.id}">Eliminar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderReceivables() {
  const items = [...state.movements]
    .filter((item) => item.type === "ingreso" && !item.isPaid)
    .sort((a, b) => `${a.dueDate || a.date}`.localeCompare(`${b.dueDate || b.date}`));

  els.receivablesList.innerHTML = "";

  if (!items.length) {
    els.receivablesList.append(buildEmptyState());
    return;
  }

  els.receivablesList.innerHTML = items
    .map(
      (item) => `
        <article class="receivable-card">
          <div class="receivable-card-head">
            <div>
              <p class="eyebrow">${item.client || "Cliente sin nombre"}</p>
              <h4>${item.description || item.category}</h4>
            </div>
            <strong class="receivable-amount">${formatCurrency(item.amount)}</strong>
          </div>
          <div class="meta-row">
            <span>Venta: ${formatDate(item.date)}</span>
            <span>Cobro: ${formatDate(item.dueDate)}</span>
            ${item.phone ? `<span>${item.phone}</span>` : ""}
          </div>
          <div class="card-actions">
            <button class="mini-button success" data-action="mark-paid" data-id="${item.id}">Marcar cobrado</button>
            <button class="mini-button" data-action="edit" data-id="${item.id}">Editar</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSettings() {
  const businessName = getPreferredBusinessName();
  document.title = `${businessName} | Ingresos y Gastos`;
  document.querySelector(".brand h1").textContent = businessName;
  document.querySelector(".topbar h2").textContent = state.settings.tagline;
  els.businessName.value = businessName;
  els.businessTagline.value = state.settings.tagline;
}

function getChartData() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    days.push({
      key: iso,
      label: new Intl.DateTimeFormat("es-DO", { weekday: "short" }).format(date),
      ingresos: 0,
      gastos: 0,
    });
  }

  const index = Object.fromEntries(days.map((day) => [day.key, day]));

  state.movements.forEach((item) => {
    if (!index[item.date]) return;
    if (item.type === "ingreso" && item.isPaid) index[item.date].ingresos += Number(item.amount);
    if (item.type === "gasto") index[item.date].gastos += Number(item.amount);
  });

  return days;
}

function drawChart() {
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const data = getChartData();
  const max = Math.max(
    100,
    ...data.map((day) => Math.max(day.ingresos, day.gastos)),
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = { top: 28, right: 24, bottom: 44, left: 32 };
  const width = canvas.width - padding.left - padding.right;
  const height = canvas.height - padding.top - padding.bottom;
  const stepX = width / Math.max(data.length - 1, 1);

  ctx.strokeStyle = "rgba(20, 33, 61, 0.1)";
  ctx.lineWidth = 1;

  for (let line = 0; line <= 4; line += 1) {
    const y = padding.top + (height / 4) * line;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.stroke();
  }

  function yScale(value) {
    return padding.top + height - (value / max) * height;
  }

  function drawSeries(key, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    data.forEach((item, indexDay) => {
      const x = padding.left + stepX * indexDay;
      const y = yScale(item[key]);
      if (indexDay === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((item, indexDay) => {
      const x = padding.left + stepX * indexDay;
      const y = yScale(item[key]);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawSeries("ingresos", "#157f5b");
  drawSeries("gastos", "#bf4d28");

  ctx.fillStyle = "#5f6b7a";
  ctx.font = "600 12px Manrope";
  data.forEach((item, indexDay) => {
    const x = padding.left + stepX * indexDay;
    ctx.fillText(item.label, x - 12, canvas.height - 14);
  });
}

function getMarginYearData(year) {
  return MONTH_NAMES.map((label, monthIndex) => {
    const records = state.movements
      .filter((item) => {
        const date = parseDate(item.date);
        return (
          item.type === "ingreso" &&
          date &&
          String(date.getFullYear()) === String(year) &&
          date.getMonth() === monthIndex
        );
      })
      .sort((a, b) => `${a.date}`.localeCompare(`${b.date}`));

    return {
      year: String(year),
      monthIndex,
      label,
      records,
      count: records.length,
      total: records.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  });
}

function getMarginHighlights(yearData) {
  const ranked = yearData
    .filter((item) => item.count > 0)
    .slice()
    .sort((a, b) => b.total - a.total);

  if (!ranked.length) {
    return { bestMonthIndex: -1, worstMonthIndex: -1 };
  }

  return {
    bestMonthIndex: ranked[0].monthIndex,
    worstMonthIndex: ranked.length > 1 ? ranked[ranked.length - 1].monthIndex : -1,
  };
}

function renderMargins() {
  if (!els.marginYearStrip || !els.monthFolders) return;

  if (!MARGIN_YEARS.includes(state.marginView.year)) {
    state.marginView.year = MARGIN_YEARS[0];
  }

  els.marginYearStrip.innerHTML = MARGIN_YEARS.map((year) => `
    <button type="button" class="year-chip ${state.marginView.year === year ? "is-active" : ""}" data-margin-year="${year}">${year}</button>
  `).join("");

  const yearData = getMarginYearData(state.marginView.year);
  const highlights = getMarginHighlights(yearData);

  els.monthFolders.innerHTML = yearData.map((monthData) => `
    <button
      type="button"
      class="month-folder ${state.marginView.monthIndex === monthData.monthIndex ? "is-active" : ""} ${highlights.bestMonthIndex === monthData.monthIndex ? "top-month" : ""} ${highlights.worstMonthIndex === monthData.monthIndex ? "bottom-month" : ""}"
      data-margin-month="${monthData.monthIndex}">
      <strong>${monthData.label}</strong>
      <span>${monthData.count} venta(s)</span>
      <span>${formatCurrency(monthData.total)}</span>
    </button>
  `).join("");

  const activeMonth = yearData[state.marginView.monthIndex] || yearData[0];
  els.marginPeriodLabel.textContent = `${state.marginView.year} / ${activeMonth.label}`;
  els.marginSalesValue.textContent = formatCurrency(activeMonth.total);
  els.marginCountValue.textContent = String(activeMonth.count);

  if (!activeMonth.records.length) {
    els.marginTableBody.innerHTML = "";
    els.marginEmptyState.hidden = false;
    return;
  }

  els.marginEmptyState.hidden = true;
  els.marginTableBody.innerHTML = activeMonth.records.map((item) => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${item.category}</td>
      <td>${item.description || "Sin descripcion"}</td>
      <td>${item.paymentMethod}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${item.isPaid ? "Cobrado" : "Pendiente"}</td>
      <td>${item.client || "Sin cliente"}</td>
    </tr>
  `).join("");
}

function drawMarginCandles(yearData) {
  const canvas = els.marginCandlesChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#10251b";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = 28 + ((height - 72) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(56, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }

  const candles = yearData.map((monthData) => {
    const amounts = monthData.records.map((item) => Number(item.amount || 0)).filter((value) => value > 0);
    if (!amounts.length) {
      return { label: monthData.label.slice(0, 3), open: 0, close: 0, high: 0, low: 0, empty: true };
    }
    return {
      label: monthData.label.slice(0, 3),
      open: amounts[0],
      close: amounts[amounts.length - 1],
      high: Math.max(...amounts),
      low: Math.min(...amounts),
      empty: false,
    };
  });

  const maxValue = Math.max(...candles.map((item) => item.high), 1);
  const top = 28;
  const bottom = height - 42;
  const chartHeight = bottom - top;
  const left = 74;
  const step = (width - left - 26) / 12;
  const yFor = (value) => bottom - (value / maxValue) * chartHeight;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "600 12px Manrope";
  ctx.fillText(`Ventas por mes - ${state.marginView.year}`, left, 18);

  candles.forEach((candle, index) => {
    const x = left + step * index + step / 2;
    ctx.fillText(candle.label, x - 10, height - 16);

    if (candle.empty) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(x, yFor(0));
      ctx.lineTo(x, bottom);
      ctx.stroke();
      return;
    }

    const openY = yFor(candle.open);
    const closeY = yFor(candle.close);
    const highY = yFor(candle.high);
    const lowY = yFor(candle.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 8);
    const rising = candle.close >= candle.open;

    ctx.strokeStyle = rising ? "#57d09a" : "#ff8f70";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    ctx.fillStyle = rising ? "#23b26d" : "#d8572a";
    ctx.fillRect(x - 12, bodyTop, 24, bodyHeight);
  });
}

function openMarginAnalysis() {
  const yearData = getMarginYearData(state.marginView.year);
  const ranked = yearData
    .filter((item) => item.count > 0)
    .slice()
    .sort((a, b) => b.total - a.total);

  if (!ranked.length) {
    els.bestMonthLabel.textContent = "Sin ventas";
    els.bestMonthDetail.textContent = `No hay ingresos registrados en ${state.marginView.year}.`;
    els.worstMonthLabel.textContent = "Sin ventas";
    els.worstMonthDetail.textContent = "Agrega ingresos para generar el comparativo.";
  } else {
    const best = ranked[0];
    const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null;

    els.bestMonthLabel.textContent = `${best.label} ${state.marginView.year}`;
    els.bestMonthDetail.textContent = `${formatCurrency(best.total)} en ${best.count} venta(s).`;
    els.worstMonthLabel.textContent = worst ? `${worst.label} ${state.marginView.year}` : "Sin comparacion";
    els.worstMonthDetail.textContent = worst
      ? `${formatCurrency(worst.total)} en ${worst.count} venta(s).`
      : "Solo existe un mes con ventas registradas.";
  }

  drawMarginCandles(yearData);
  if (typeof els.marginModal.showModal === "function") {
    els.marginModal.showModal();
  }
}

function resetForm(prefillType = "ingreso") {
  els.form.reset();
  document.querySelector("#movement-id").value = "";
  document.querySelector("#date").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#type").value = prefillType;
  document.querySelector("#isPaid").checked = true;
  document.querySelector("#dueDate").value = "";
  togglePaidState();
  els.formTitle.textContent = "Registrar movimiento";
}

function togglePaidState() {
  const type = document.querySelector("#type").value;
  const paid = document.querySelector("#isPaid");
  const dueDate = document.querySelector("#dueDate");

  if (type === "gasto") {
    paid.checked = true;
    paid.disabled = true;
    dueDate.disabled = true;
    dueDate.required = false;
  } else {
    paid.disabled = false;
    dueDate.disabled = paid.checked;
    dueDate.required = !paid.checked;
  }
}

function editMovement(id) {
  const item = state.movements.find((movement) => movement.id === id);
  if (!item) return;

  setActiveView("registro");
  document.querySelector("#movement-id").value = item.id;
  document.querySelector("#type").value = item.type;
  document.querySelector("#date").value = item.date;
  document.querySelector("#category").value = item.category;
  document.querySelector("#paymentMethod").value = item.paymentMethod;
  document.querySelector("#amount").value = item.amount;
  document.querySelector("#client").value = item.client || "";
  document.querySelector("#phone").value = item.phone || "";
  document.querySelector("#dueDate").value = item.dueDate || "";
  document.querySelector("#description").value = item.description || "";
  document.querySelector("#isPaid").checked = item.isPaid;
  togglePaidState();
  els.formTitle.textContent = "Editar movimiento";
}

function deleteMovement(id) {
  if (!window.confirm("Este movimiento se eliminara definitivamente.")) return;
  state.movements = state.movements.filter((item) => item.id !== id);
  saveState();
  render();
}

function markPaid(id) {
  state.movements = state.movements.map((item) =>
    item.id === id ? { ...item, isPaid: true, dueDate: "" } : item,
  );
  saveState();
  render();
}

function exportData() {
  const blob = new Blob(
    [JSON.stringify({ settings: state.settings, movements: state.movements }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "income-wallet-respaldo.json";
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  renderSettings();
  renderSummary();
  renderInsights();
  renderReceivables();
  renderHistory();
  drawChart();
  renderMargins();
  renderAdminPanel();
}

function bindEvents() {
  els.navLinks.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
  });

  els.quickActions.forEach((button) => {
    button.addEventListener("click", () => {
      const { prefillType, viewJump } = button.dataset;
      if (prefillType) {
        setActiveView("registro");
        resetForm(prefillType);
      }
      if (viewJump) setActiveView(viewJump);
    });
  });

  els.statJumpCards.forEach((card) => {
    const jumpToView = () => {
      const { viewJump } = card.dataset;
      if (viewJump) setActiveView(viewJump);
    };

    card.addEventListener("click", jumpToView);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jumpToView();
      }
    });
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const item = {
      id: document.querySelector("#movement-id").value || uid(),
      type: document.querySelector("#type").value,
      date: document.querySelector("#date").value,
      category: document.querySelector("#category").value.trim(),
      paymentMethod: document.querySelector("#paymentMethod").value,
      amount: Number(document.querySelector("#amount").value),
      client: document.querySelector("#client").value.trim(),
      phone: document.querySelector("#phone").value.trim(),
      dueDate: document.querySelector("#isPaid").checked ? "" : document.querySelector("#dueDate").value,
      description: document.querySelector("#description").value.trim(),
      isPaid: document.querySelector("#type").value === "gasto" ? true : document.querySelector("#isPaid").checked,
    };

    const existingIndex = state.movements.findIndex((movement) => movement.id === item.id);
    if (existingIndex >= 0) state.movements.splice(existingIndex, 1, item);
    else state.movements.push(item);

    saveState();
    render();
    resetForm(item.type);
    setActiveView("dashboard");
  });

  els.resetFormButton.addEventListener("click", () => resetForm());
  document.querySelector("#type").addEventListener("change", togglePaidState);
  document.querySelector("#isPaid").addEventListener("change", togglePaidState);

  [els.historyList, els.receivablesList].forEach((container) => {
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const { action, id } = button.dataset;

      if (action === "edit") editMovement(id);
      if (action === "delete") deleteMovement(id);
      if (action === "mark-paid") markPaid(id);
    });
  });

  els.searchInput.addEventListener("input", renderHistory);
  els.filterType.addEventListener("change", renderHistory);

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.businessName = els.businessName.value.trim() || "Income Wallet";
    state.settings.tagline = els.businessTagline.value.trim() || "Control financiero moderno";
    saveState();
    renderSettings();
  });

  els.adminAccessButton.addEventListener("click", () => {
    if (state.admin.isAuthenticated) {
      setActiveView("admin");
      void refreshAdminMonitor();
      return;
    }
    openAdminModal();
  });

  els.adminLogoutButton.addEventListener("click", () => {
    setAdminMode(false);
    setActiveView("dashboard");
  });

  els.closeAdminModalButton.addEventListener("click", closeAdminModal);
  els.adminAccessModal.addEventListener("click", (event) => {
    if (event.target === els.adminAccessModal) closeAdminModal();
  });

  els.adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#admin-username").value.trim();
    const password = document.querySelector("#admin-password").value.trim();

    if (username !== MASTER_USERNAME || password !== MASTER_PASSWORD) {
      els.adminLoginStatus.hidden = false;
      els.adminLoginStatus.textContent = "Credenciales master invalidas.";
      return;
    }

    setAdminMode(true);
    closeAdminModal();
    els.adminLoginForm.reset();
    setActiveView("admin");
    await refreshAdminMonitor();
  });

  els.adminRefreshButton.addEventListener("click", () => {
    void refreshAdminMonitor();
  });

  els.adminSourceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextSource = {
      id: uid(),
      label: els.adminSourceLabel.value.trim(),
      projectId: els.adminSourceProject.value.trim(),
      collection: els.adminSourceCollection.value.trim(),
      document: els.adminSourceDocument.value.trim(),
      apiKey: els.adminSourceKey.value.trim(),
    };

    state.admin.monitoredSources.push(nextSource);
    saveMonitoredSources();
    els.adminSourceForm.reset();
    void refreshAdminMonitor();
  });

  els.adminSourcesList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-source]");
    if (!button) return;

    state.admin.monitoredSources = state.admin.monitoredSources.filter((item) => item.id !== button.dataset.removeSource);
    saveMonitoredSources();
    void refreshAdminMonitor();
  });

  els.generateMarginsButton.addEventListener("click", openMarginAnalysis);
  els.closeMarginModalButton.addEventListener("click", () => els.marginModal.close());
  els.marginModal.addEventListener("click", (event) => {
    if (event.target === els.marginModal) els.marginModal.close();
  });

  els.marginYearStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-margin-year]");
    if (!button) return;
    state.marginView.year = button.dataset.marginYear;
    state.marginView.monthIndex = 0;
    renderMargins();
  });

  els.monthFolders.addEventListener("click", (event) => {
    const button = event.target.closest("[data-margin-month]");
    if (!button) return;
    state.marginView.monthIndex = Number(button.dataset.marginMonth);
    renderMargins();
  });
}

async function initializeApp() {
  loadState();
  loadAdminSession();
  loadMonitoredSources();
  removeLegacyWallyData();
  setAdminMode(state.admin.isAuthenticated);
  bindEvents();
  resetForm();
  saveState();
  render();
  await attemptInitialSweetMigration();
  if (state.admin.isAuthenticated) await refreshAdminMonitor();
}

void initializeApp();
