const STORAGE_KEY = "incomewallet_finance_data_v1";
const SETTINGS_KEY = "incomewallet_finance_settings_v1";
const USERS_KEY = "incomewallet_auth_users_v1";
const SESSION_KEY = "incomewallet_auth_session_v1";
const CLEANUP_KEY = "incomewallet_cleanup_v1";
const MARGIN_YEARS = ["2026", "2027", "2028", "2029", "3030"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DEFAULT_ADMIN = {
  name: "Jssantana077",
  username: "Jssantana077",
  password: "160623",
  role: "admin",
  assistant: {
    seeded: false,
    pending: false,
  },
};

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
  auth: {
    users: [],
    currentUserId: "",
  },
};

const els = {
  authShell: document.querySelector("#auth-shell"),
  authCard: document.querySelector(".auth-card"),
  authShowcase: document.querySelector(".auth-showcase"),
  appShell: document.querySelector("#app-shell"),
  loginForm: document.querySelector("#login-form"),
  loginUsername: document.querySelector("#login-username"),
  loginPassword: document.querySelector("#login-password"),
  loginFeedback: document.querySelector("#login-feedback"),
  assistantFab: document.querySelector("#wallet-assistant-fab"),
  assistantPanel: document.querySelector("#wallet-assistant-panel"),
  assistantMessages: document.querySelector("#wallet-assistant-messages"),
  assistantSuggestions: document.querySelector("#wallet-assistant-suggestions"),
  assistantInput: document.querySelector("#wallet-assistant-input"),
  assistantSend: document.querySelector("#wallet-assistant-send"),
  assistantClose: document.querySelector("#wallet-assistant-close"),
  assistantMinimize: document.querySelector("#wallet-assistant-minimize"),
  assistantRuntimeStatus: document.querySelector("#wallet-assistant-runtime-status"),
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
  sessionUserName: document.querySelector("#session-user-name"),
  sessionUserRole: document.querySelector("#session-user-role"),
  logoutButton: document.querySelector("#logout-button"),
  adminNavButton: document.querySelector("#admin-nav-button"),
  adminUserForm: document.querySelector("#admin-user-form"),
  adminName: document.querySelector("#admin-name"),
  adminUsername: document.querySelector("#admin-username"),
  adminPassword: document.querySelector("#admin-password"),
  adminRole: document.querySelector("#admin-role"),
  adminFeedback: document.querySelector("#admin-feedback"),
  usersList: document.querySelector("#users-list"),
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

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
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

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPreferredBusinessName() {
  const customName = String(state.settings.businessName || "").trim();
  return customName || "Income Wallet";
}

function clearFeedback(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = "";
  element.classList.remove("success");
}

function showFeedback(element, message, type = "error") {
  if (!element) return;
  element.hidden = false;
  element.textContent = message;
  element.classList.toggle("success", type === "success");
}

async function hashPassword(value) {
  const normalized = String(value || "");
  if (!window.crypto?.subtle) return `plain:${normalized}`;

  const bytes = new TextEncoder().encode(normalized);
  const buffer = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buffer))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

function getCurrentUser() {
  return state.auth.users.find((user) => user.id === state.auth.currentUserId && user.isActive) || null;
}

function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movements));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function saveAuthState() {
  localStorage.setItem(USERS_KEY, JSON.stringify(state.auth.users));
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(state.auth.currentUserId ? { userId: state.auth.currentUserId } : null),
  );
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

function purgeLegacyData() {
  const cleanupDone = localStorage.getItem(CLEANUP_KEY);
  const legacyNameDetected = String(state.settings.businessName || "").trim().toLowerCase().includes("sweet surprise");

  if (!cleanupDone || legacyNameDetected) {
    state.movements = [];
    state.settings = {
      ...state.settings,
      businessName: "Income Wallet",
      tagline: "Control financiero moderno",
    };

    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(CLEANUP_KEY, new Date().toISOString());
  }
}

function loadAuthState() {
  const savedUsers = localStorage.getItem(USERS_KEY);
  const savedSession = localStorage.getItem(SESSION_KEY);

  if (savedUsers) {
    try {
      const parsedUsers = JSON.parse(savedUsers);
      state.auth.users = Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch {
      state.auth.users = [];
    }
  }

  if (savedSession) {
    try {
      const parsedSession = JSON.parse(savedSession);
      state.auth.currentUserId = parsedSession?.userId || "";
    } catch {
      state.auth.currentUserId = "";
    }
  }
}

async function ensureDefaultAdmin() {
  const legacyDefaultUser = state.auth.users.find(
    (user) => user.username === "admin" && user.role === "admin" && user.name === "Administrador Principal",
  );

  if (legacyDefaultUser && state.auth.users.length === 1) {
    legacyDefaultUser.name = DEFAULT_ADMIN.name;
    legacyDefaultUser.username = normalizeUsername(DEFAULT_ADMIN.username);
    legacyDefaultUser.passwordHash = await hashPassword(DEFAULT_ADMIN.password);
    legacyDefaultUser.isActive = true;
    saveAuthState();
    return;
  }

  if (state.auth.users.length) return;

  state.auth.users = [
    {
      id: uid(),
      name: DEFAULT_ADMIN.name,
      username: normalizeUsername(DEFAULT_ADMIN.username),
      passwordHash: await hashPassword(DEFAULT_ADMIN.password),
      role: DEFAULT_ADMIN.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  saveAuthState();
}

async function sanitizeUsers() {
  const defaultUsername = normalizeUsername(DEFAULT_ADMIN.username);
  const defaultPasswordHash = await hashPassword(DEFAULT_ADMIN.password);
  const legacyAdmin = state.auth.users.find((user) => user.username === "admin");
  const namedAdmin = state.auth.users.find((user) => user.username === defaultUsername);

  if (legacyAdmin && !namedAdmin) {
    legacyAdmin.name = DEFAULT_ADMIN.name;
    legacyAdmin.username = defaultUsername;
    legacyAdmin.passwordHash = defaultPasswordHash;
    legacyAdmin.role = "admin";
    legacyAdmin.isActive = true;
    saveAuthState();
    return;
  }

  if (namedAdmin) {
    namedAdmin.name = DEFAULT_ADMIN.name;
    namedAdmin.passwordHash = defaultPasswordHash;
    namedAdmin.role = "admin";
    namedAdmin.isActive = true;
    saveAuthState();
  }
}

function syncCurrentSession() {
  if (!getCurrentUser()) {
    state.auth.currentUserId = "";
    saveAuthState();
  }
}

function setAccessState(isAuthenticated) {
  els.authShell.hidden = isAuthenticated;
  els.appShell.hidden = !isAuthenticated;
}

function initializeAuthMotion() {

  if (!els.authShell || !els.authCard || !els.authShowcase) return;



  const resetMotion = () => {

    els.authCard.style.setProperty("--auth-rotate-x", "0deg");

    els.authCard.style.setProperty("--auth-rotate-y", "0deg");

    els.authShowcase.style.setProperty("--auth-showcase-offset", "0px");

  };



  els.authShell.addEventListener("pointermove", (event) => {

    const rect = els.authShell.getBoundingClientRect();

    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;

    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;



    els.authCard.style.setProperty("--auth-rotate-x", `${(-offsetY * 4).toFixed(2)}deg`);

    els.authCard.style.setProperty("--auth-rotate-y", `${(offsetX * 5).toFixed(2)}deg`);

    els.authShowcase.style.setProperty("--auth-showcase-offset", `${(-offsetY * 8).toFixed(2)}px`);

  });



  els.authShell.addEventListener("pointerleave", resetMotion);

  resetMotion();

}



function setActiveView(viewId) {
  if (!getCurrentUser()) return;

  const nextView = viewId === "admin" && !isAdmin() ? "dashboard" : viewId;

  els.navLinks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === nextView);
  });

  els.views.forEach((section) => {
    section.classList.toggle("is-active", section.id === nextView);
  });
}

function applyHistoryFilter(filter = "todos") {
  if (!els.filterType) return;
  els.filterType.value = filter;
  renderHistory();
}

function handleViewJump(element) {
  const { viewJump, historyFilter } = element.dataset;
  if (!viewJump) return;

  setActiveView(viewJump);

  if (viewJump === "historial") {
    applyHistoryFilter(historyFilter || "todos");
  }
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

function countActiveAdmins(excludeUserId = "") {
  return state.auth.users.filter(
    (user) => user.role === "admin" && user.isActive && user.id !== excludeUserId,
  ).length;
}

function renderSessionUi() {
  const user = getCurrentUser();
  const authenticated = Boolean(user);
  setAccessState(authenticated);

  if (!authenticated) {
    document.title = "Income Wallet | Acceso";
    els.sessionUserName.textContent = "Sin sesion";
    els.sessionUserRole.textContent = "Invitado";
    els.adminNavButton.hidden = true;
    return;
  }

  els.sessionUserName.textContent = user.name;
  els.sessionUserRole.textContent = user.role === "admin" ? "Administrador" : "Usuario";
  els.adminNavButton.hidden = !isAdmin();

  if (!isAdmin() && document.querySelector("#admin.view.is-active")) {
    setActiveView("dashboard");
  }
}

function renderUsers() {
  if (!isAdmin()) {
    els.usersList.innerHTML = "";
    return;
  }

  const sortedUsers = [...state.auth.users].sort((a, b) => `${a.name}`.localeCompare(`${b.name}`));
  const currentUser = getCurrentUser();
  els.usersList.innerHTML = "";

  if (!sortedUsers.length) {
    els.usersList.append(buildEmptyState());
    return;
  }

  els.usersList.innerHTML = sortedUsers
    .map((user) => `
      <article class="user-card">
        <div class="user-card-head">
          <div>
            <p class="eyebrow">Usuario</p>
            <h4>${user.name}</h4>
          </div>
          <div class="user-badges">
            <span class="tag ${user.role}">${user.role === "admin" ? "Administrador" : "Usuario"}</span>
            <span class="tag ${user.isActive ? "active" : "inactive"}">${user.isActive ? "Activo" : "Inactivo"}</span>
          </div>
        </div>
        <div class="user-meta">
          <span>@${user.username}</span>
          <span>Creado: ${formatDateTime(user.createdAt)}</span>
          ${currentUser?.id === user.id ? "<span>Sesion actual</span>" : ""}
        </div>
        <div class="card-actions">
          <button
            class="mini-button ${user.isActive ? "danger" : "success"}"
            data-user-action="toggle-status"
            data-user-id="${user.id}">
            ${user.isActive ? "Desactivar" : "Activar"}
          </button>
          <button
            class="mini-button danger"
            data-user-action="delete-user"
            data-user-id="${user.id}">
            Eliminar
          </button>
        </div>
      </article>
    `)
    .join("");
}

function renderAdminPanel() {
  renderUsers();
}

async function login(username, password) {
  const normalizedUsername = normalizeUsername(username);
  const user = state.auth.users.find((item) => item.username === normalizedUsername);

  if (!user || !user.isActive) {
    throw new Error("Usuario no encontrado o inactivo.");
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Contrasena incorrecta.");
  }

  state.auth.currentUserId = user.id;
  saveAuthState();
}

function logout() {
  state.auth.currentUserId = "";
  saveAuthState();
  clearFeedback(els.loginFeedback);
  els.loginForm.reset();
  renderSessionUi();
}

async function createUser({ name, username, password, role }) {
  if (!isAdmin()) {
    throw new Error("Solo un administrador puede crear usuarios.");
  }

  const cleanName = String(name || "").trim();
  const cleanUsername = normalizeUsername(username);
  const cleanRole = role === "admin" ? "admin" : "user";

  if (!cleanName) throw new Error("El nombre es obligatorio.");
  if (!cleanUsername) throw new Error("El usuario es obligatorio.");
  if (String(password || "").length < 8) throw new Error("La contrasena debe tener al menos 8 caracteres.");
  if (state.auth.users.some((user) => user.username === cleanUsername)) {
    throw new Error("Ese nombre de usuario ya existe.");
  }

  state.auth.users.push({
    id: uid(),
    name: cleanName,
    username: cleanUsername,
    passwordHash: await hashPassword(password),
    role: cleanRole,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  saveAuthState();
}

function toggleUserStatus(userId) {
  const user = state.auth.users.find((item) => item.id === userId);
  if (!user) return;

  if (state.auth.currentUserId === user.id) {
    throw new Error("No puedes desactivar tu propia sesion activa.");
  }

  if (user.role === "admin" && user.isActive && countActiveAdmins(user.id) === 0) {
    throw new Error("Debe permanecer al menos un administrador activo.");
  }

  user.isActive = !user.isActive;
  saveAuthState();
}

function deleteUser(userId) {
  const user = state.auth.users.find((item) => item.id === userId);
  if (!user) return;

  if (state.auth.currentUserId === user.id) {
    throw new Error("No puedes eliminar tu propia sesion activa.");
  }

  if (user.role === "admin" && user.isActive && countActiveAdmins(user.id) === 0) {
    throw new Error("No puedes eliminar el ultimo administrador activo.");
  }

  state.auth.users = state.auth.users.filter((item) => item.id !== userId);
  saveAuthState();
}

function render() {
  syncCurrentSession();
  renderSessionUi();

  if (!getCurrentUser()) return;

  renderSettings();
  renderSummary();
  renderInsights();
  renderReceivables();
  renderHistory();
  drawChart();
  renderMargins();
  renderAdminPanel();
}

function getActiveViewId() {

  return els.views.find((section) => section.classList.contains("is-active"))?.id || "dashboard";

}



function setAssistantStatus(message = "") {

  if (!els.assistantRuntimeStatus) return;

  els.assistantRuntimeStatus.textContent = message;

}



function registerAssistantMessage(role, content) {

  if (!els.assistantMessages) return;

  const wrap = document.createElement("article");

  wrap.className = `wallet-assistant-msg ${role === "user" ? "is-user" : "is-assistant"}`;

  const meta = document.createElement("span");

  meta.className = "wallet-assistant-msg-meta";

  meta.textContent = role === "user" ? "Tu mensaje" : "Asistente Wallet";

  const bubble = document.createElement("div");

  bubble.className = "wallet-assistant-bubble";

  bubble.textContent = content;

  wrap.append(meta, bubble);

  els.assistantMessages.appendChild(wrap);

  els.assistantMessages.scrollTop = els.assistantMessages.scrollHeight;

}



function seedAssistant() {

  if (state.assistant.seeded || !els.assistantMessages) return;

  state.assistant.seeded = true;

  registerAssistantMessage("assistant", "Estoy listo para ayudarte con el balance, cobros, historial, margenes y analisis del negocio.");

}



function renderAssistantSuggestions() {

  if (!els.assistantSuggestions) return;

  const suggestions = [
    { label: "Ver balance", prompt: "Muestrame el balance actual" },
    { label: "Cobros pendientes", prompt: "Cuanto hay pendiente por cobrar" },
    { label: "Abrir historial", prompt: "Abre el historial" },
    { label: "Analiza el negocio", prompt: "Analiza el estado actual del negocio" },
  ];

  els.assistantSuggestions.innerHTML = "";

  suggestions.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wallet-assistant-chip";
    button.textContent = item.label;
    button.addEventListener("click", () => {
      els.assistantInput.value = item.prompt;
      void submitAssistantMessage(item.prompt);
    });
    els.assistantSuggestions.appendChild(button);
  });

}



function toggleAssistant(forceOpen) {

  if (!els.assistantPanel || !els.assistantFab) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : !els.assistantPanel.classList.contains("is-open");

  els.assistantPanel.classList.toggle("is-open", shouldOpen);
  els.assistantPanel.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  els.assistantFab.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

  if (shouldOpen) {
    seedAssistant();
    renderAssistantSuggestions();
    els.assistantInput?.focus();
  }

}



function toggleAssistantMinimize() {

  if (!els.assistantPanel) return;

  els.assistantPanel.classList.toggle("is-minimized");

}



function buildAssistantRuntimeContext() {

  const summary = getSummary();

  return {
    businessName: getPreferredBusinessName(),
    currentView: getActiveViewId(),
    currentUser: getCurrentUser()?.name || "Sin sesion",
    currentRole: getCurrentUser()?.role || "guest",
    totals: {
      ingresos: summary.totalIngresos,
      gastos: summary.totalGastos,
      pendiente: summary.totalPendiente,
      balance: summary.balance,
    },
    counts: {
      ingresos: summary.ingresosPagados.length,
      gastos: summary.gastos.length,
      pendientes: summary.pendientes.length,
      movimientos: state.movements.length,
    },
  };

}



function buildAssistantSummaryText() {

  const context = buildAssistantRuntimeContext();

  return [
    `Negocio: ${context.businessName}`,
    `Vista activa: ${context.currentView}`,
    `Balance: ${formatCurrency(context.totals.balance)}`,
    `Ingresos cobrados: ${formatCurrency(context.totals.ingresos)} en ${context.counts.ingresos} movimientos`,
    `Gastos: ${formatCurrency(context.totals.gastos)} en ${context.counts.gastos} movimientos`,
    `Pendiente por cobrar: ${formatCurrency(context.totals.pendiente)} en ${context.counts.pendientes} cuentas`,
  ].join(". ");

}



function handleLocalAssistantIntent(message) {

  const text = String(message || "").trim().toLowerCase();
  const summary = getSummary();

  if (/abre|abrir|ve a|ir a|mostrar/.test(text) && /historial/.test(text)) {
    setActiveView("historial");
    return "Abri el historial completo para que revises todos los movimientos.";
  }

  if (/abre|abrir|ve a|ir a|mostrar/.test(text) && /cobro|cuenta|pendiente/.test(text)) {
    setActiveView("cuentas");
    return "Abri la vista de cuentas por cobrar para revisar los pendientes.";
  }

  if (/abre|abrir|ve a|ir a|mostrar/.test(text) && /registro|nuevo movimiento/.test(text)) {
    setActiveView("registro");
    return "Abri el formulario de registro para crear un nuevo movimiento.";
  }

  if (/balance/.test(text)) {
    return `El balance actual es ${formatCurrency(summary.balance)}. Ingresos cobrados: ${formatCurrency(summary.totalIngresos)}. Gastos: ${formatCurrency(summary.totalGastos)}.`;
  }

  if (/pendiente|por cobrar|cobro/.test(text)) {
    return `Tienes ${summary.pendientes.length} cuenta(s) pendiente(s) por ${formatCurrency(summary.totalPendiente)}.`;
  }

  if (/resumen|estado actual|como va|como vamos/.test(text)) {
    return buildAssistantSummaryText();
  }

  return "";

}



async function askAssistantApi(message) {

  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage: message,
      runtimeContext: buildAssistantRuntimeContext(),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "El backend del asistente no esta disponible.");
  }

  return payload.reply || "No pude generar una respuesta en este momento.";

}



async function submitAssistantMessage(prefillMessage = "") {

  if (!els.assistantInput || state.assistant.pending) return;

  const message = String(prefillMessage || els.assistantInput.value || "").trim();

  if (!message) return;

  toggleAssistant(true);
  state.assistant.pending = true;
  registerAssistantMessage("user", message);
  els.assistantInput.value = "";
  setAssistantStatus("Procesando solicitud...");

  try {
    const localReply = handleLocalAssistantIntent(message);

    if (localReply) {
      registerAssistantMessage("assistant", localReply);
      setAssistantStatus("Respuesta local del sistema.");
      return;
    }

    const remoteReply = await askAssistantApi(message);
    registerAssistantMessage("assistant", remoteReply);
    setAssistantStatus("Respuesta IA lista.");
  } catch (error) {
    registerAssistantMessage("assistant", `No pude completar esa solicitud ahora mismo. ${error.message}`);
    setAssistantStatus("Backend no disponible o sin configurar.");
  } finally {
    state.assistant.pending = false;
  }

}



function bindEvents() {
  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback(els.loginFeedback);

    try {
      await login(els.loginUsername.value, els.loginPassword.value);
      els.loginForm.reset();
      setActiveView("dashboard");
      render();
    } catch (error) {
      showFeedback(els.loginFeedback, error.message);
    }
  });

  els.logoutButton.addEventListener("click", () => {
    logout();
  });

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
      if (viewJump) handleViewJump(button);
    });
  });

  els.statJumpCards.forEach((card) => {
    const jumpToView = () => handleViewJump(card);

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
    render();
  });

  els.adminUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback(els.adminFeedback);

    try {
      await createUser({
        name: els.adminName.value,
        username: els.adminUsername.value,
        password: els.adminPassword.value,
        role: els.adminRole.value,
      });
      els.adminUserForm.reset();
      els.adminRole.value = "user";
      showFeedback(els.adminFeedback, "Usuario creado correctamente.", "success");
      renderAdminPanel();
    } catch (error) {
      showFeedback(els.adminFeedback, error.message);
    }
  });

  els.usersList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;

    clearFeedback(els.adminFeedback);

    try {
      if (button.dataset.userAction === "toggle-status") {
        toggleUserStatus(button.dataset.userId);
      }
      if (button.dataset.userAction === "delete-user") {
        deleteUser(button.dataset.userId);
      }
      renderAdminPanel();
    } catch (error) {
      showFeedback(els.adminFeedback, error.message);
    }
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

  els.assistantFab?.addEventListener("click", () => toggleAssistant());

  els.assistantClose?.addEventListener("click", () => toggleAssistant(false));

  els.assistantMinimize?.addEventListener("click", () => toggleAssistantMinimize());

  els.assistantSend?.addEventListener("click", () => {

    void submitAssistantMessage();

  });

  els.assistantInput?.addEventListener("keydown", (event) => {

    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();

    void submitAssistantMessage();

  });

async function initializeApp() {
  loadState();
  purgeLegacyData();
  loadAuthState();
  await ensureDefaultAdmin();
  await sanitizeUsers();
  syncCurrentSession();
  bindEvents();
  initializeAuthMotion();
  resetForm();
  saveState();
  render();
}

void initializeApp();
