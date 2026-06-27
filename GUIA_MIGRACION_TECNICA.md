# Guía Técnica de Migración: Proyecto Wally → Income Wallet

## 📋 Resumen Ejecutivo

Este documento detalla el proceso técnico de migración desde **Proyecto Wally** (versión actual) hacia **Income Wallet** (nueva versión 0.5), incluyendo diferencias arquitectónicas, proceso de migración de datos y consideraciones técnicas.

---

## 🏗️ Diferencias Arquitectónicas

### Proyecto Wally (Versión Actual)

**Características técnicas:**
- **Frontend:** HTML/CSS/JavaScript monolítico (~2,431 líneas en index.html)
- **Backend:** Firebase Firestore (sincronización en tiempo real)
- **Almacenamiento:** Nube (Firebase) + LocalStorage (caché)
- **API Key:** Expuesta en cliente (no recomendado para producción)
- **Arquitectura:** Aplicación de página única (SPA) básica
- **Autenticación:** Integrada con Firebase Auth

**Estructura de datos:**
```javascript
{
  ingresos: [
    {
      id: string,
      fecha: string,
      tipoVenta: string,
      descripcion: string,
      monto: number,
      metodo: string,
      nombreCliente: string,
      numeroCliente: string,
      cobrado: "si" | "no"
    }
  ],
  gastos: [
    {
      id: string,
      fecha: string,
      tipoGasto: string,
      descripcion: string,
      monto: number,
      metodo: string
    }
  ],
  cxc: [
    {
      id: string,
      ingresoId: string,
      fecha: string,
      tipoVenta: string,
      descripcion: string,
      monto: number,
      fechaCobro: string
    }
  ]
}
```

### Income Wallet (Nueva Versión 0.5)

**Características técnicas:**
- **Frontend:** HTML5 + CSS3 + JavaScript ES6+ modular
- **Backend:** LocalStorage primario (sin dependencia de nube)
- **Almacenamiento:** LocalStorage (persistencia local del navegador)
- **Arquitectura:** SPA con navegación por vistas y componentes
- **API de migración:** Conexión directa a Firestore de Wally para importación
- **Exportación/Importación:** JSON para portabilidad de datos

**Estructura de datos:**
```javascript
{
  movements: [
    {
      id: string,
      type: "ingreso" | "gasto",
      date: string,
      category: string,
      paymentMethod: string,
      amount: number,
      client: string,
      phone: string,
      dueDate: string,
      description: string,
      isPaid: boolean,
      sourceApp: "Income Wallet" | "Proyecto Wally",
      sourceKey: string
    }
  ],
  settings: {
    businessName: string,
    tagline: string
  }
}
```

---

## 🔄 Proceso de Migración de Datos

### 1. Preparación del Entorno

**Requisitos previos:**
- Navegador moderno con soporte LocalStorage
- Conexión a internet (para migración desde Firebase)
- Acceso a los datos de Proyecto Wally en Firebase

**Verificación de compatibilidad:**
```javascript
// Verificar soporte LocalStorage
if (typeof localStorage !== 'undefined') {
  console.log('LocalStorage soportado ✓');
} else {
  console.error('LocalStorage no soportado ✗');
}
```

### 2. Estrategia de Migración

Income Wallet implementa **dos métodos de migración**:

#### Método A: Migración Automática desde Firebase

**Flujo del proceso:**
1. Usuario hace clic en "Migrar desde Proyecto Wally"
2. Income Wallet se conecta a Firebase de Wally usando API key
3. Recupera estado compartido desde: `proyecto_wally/shared_state`
4. Transforma datos al formato Income Wallet
5. Guarda en LocalStorage
6. Marca migración como completada

**Código clave de migración:**
```javascript
// Claves de migración
const WALLY_MIGRATION_KEY = "incomewallet_wally_migration_v1";
const WALLY_API_KEY = "AIzaSyBBlzyoPm5_pDGwmurSImRJyD92EBAoIdo";
const WALLY_MIGRATION_URL = `https://firestore.googleapis.com/v1/projects/proyecto-wally-80e18/databases/(default)/documents/proyecto_wally/shared_state?key=${WALLY_API_KEY}`;

// Función de transformación
function mapWallyStateToMovements(remoteState) {
  const { byIngresoId, byComposite } = buildWallyReceivableMaps(remoteState);
  
  const ingresos = remoteState.ingresos.map((item) => {
    const isPaid = String(item.cobrado || "").toLowerCase() === "si";
    const compositeKey = [item.fecha, item.tipoVenta, item.descripcion, item.monto].join("|");
    const dueDate = isPaid ? "" : byIngresoId.get(item.id) || byComposite.get(compositeKey) || "";

    return {
      id: uid(),
      type: "ingreso",
      date: item.fecha || "",
      category: (item.tipoVenta || "Ingreso").trim(),
      paymentMethod: (item.metodo || item.metodoPago || "Efectivo").trim(),
      amount: normalizeWallyAmount(item.monto),
      client: (item.nombreCliente || "").trim(),
      phone: (item.numeroCliente || "").trim(),
      dueDate,
      description: (item.descripcion || item.origen || item.tipoVenta || "Ingreso migrado").trim(),
      isPaid,
      sourceApp: "Proyecto Wally",
      sourceKey: buildWallyMovementKey("ingreso", item),
    };
  });

  // Proceso similar para gastos...
  return [...ingresos, ...gastos].filter((item) => item.date && item.amount > 0);
}
```

#### Método B: Importación JSON Manual

**Flujo del proceso:**
1. Usuario exporta datos desde Wally (si disponible)
2. Usuario carga archivo JSON en Income Wallet
3. Sistema valida y transforma datos
4. Guarda en LocalStorage

**Formato JSON esperado:**
```json
{
  "movements": [
    {
      "id": "unique-id",
      "type": "ingreso",
      "date": "2026-06-26",
      "category": "Venta",
      "paymentMethod": "Efectivo",
      "amount": 1500.00,
      "client": "Juan Pérez",
      "phone": "809-555-0123",
      "dueDate": "",
      "description": "Venta de productos",
      "isPaid": true
    }
  ],
  "settings": {
    "businessName": "Mi Negocio",
    "tagline": "Control financiero"
  }
}
```

### 3. Validación de Datos

**Validaciones durante migración:**
- ✅ Fechas válidas (formato ISO)
- ✅ Montos numéricos positivos
- ✅ Campos requeridos presentes
- ✅ No duplicados (usando `sourceKey`)
- ✅ Tipos de datos correctos

**Manejo de errores:**
```javascript
try {
  const remoteState = await fetchWallyRemoteState();
  const movements = mapWallyStateToMovements(remoteState);
  
  if (movements.length === 0) {
    throw new Error("No se encontraron datos válidos para migrar");
  }
  
  saveMovements(movements);
  setMigrationStatus("Migración completada exitosamente", "success");
} catch (error) {
  setMigrationStatus(`Error: ${error.message}`, "error");
  console.error("Migration failed:", error);
}
```

---

## 📊 Comparación de Funcionalidades

| Funcionalidad | Proyecto Wally | Income Wallet | Mejora |
|--------------|----------------|------------|--------|
| **Registro de ingresos** | ✅ Básico | ✅ Mejorado | Formulario optimizado |
| **Registro de gastos** | ✅ Básico | ✅ Categorizado | Categorías personalizables |
| **Cuentas por cobrar** | ✅ Básico | ✅ Avanzado | Alertas de vencimiento |
| **Historial** | ✅ Tabular | ✅ Filtrable | Búsqueda y filtros |
| **Gráficos** | ❌ No | ✅ Sí | Flujo de caja visual |
| **Dashboard** | ❌ No | ✅ Sí | KPIs en tiempo real |
| **Análisis de márgenes** | ❌ No | ✅ Sí | Reportes por período |
| **Exportar datos** | ❌ No | ✅ JSON | Portabilidad total |
| **Importar datos** | ❌ No | ✅ JSON | Migración flexible |
| **Persistencia** | Firebase | LocalStorage | Sin dependencia de nube |
| **Offline** | Parcial | Completo | Funciona sin internet |
| **Responsive** | Básico | Avanzado | Optimizado móvil |

---

## 🚀 Implementación Técnica

### Estructura de Archivos Income Wallet

```
SISTEMA_DE_GASTOS0.5/
├── index.html          # Shell de la aplicación (377 líneas)
├── app.js             # Lógica de la aplicación (1,075 líneas)
├── styles.css         # Estilos modernos (859 líneas)
└── README.md          # Documentación
```

### Tecnologías Utilizadas

**Frontend:**
- HTML5 semántico
- CSS3 con variables custom properties
- JavaScript ES6+ (modules, async/await, arrow functions)
- Canvas API para gráficos
- LocalStorage API para persistencia

**Diseño:**
- CSS Grid y Flexbox
- Glassmorphism (backdrop-filter)
- Gradientes modernos
- Diseño responsive
- Fuentes: Manrope + Space Grotesk

### Patrón de Diseño

**Arquitectura SPA (Single Page Application):**
```javascript
// Navegación por vistas
const views = {
  dashboard: showDashboard,
  registro: showRegistro,
  cuentas: showCuentas,
  historial: showHistorial,
  margenes: showMargenes,
  configuracion: showConfiguracion
};

// Gestión de estado
const state = {
  movements: [],
  settings: {},
  marginView: { year: "2026", monthIndex: 0 }
};

// Persistencia
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movements));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadState() {
  const movements = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  return { movements, settings };
}
```

---

## 🔒 Consideraciones de Seguridad

### Proyecto Wally
- ⚠️ API key expuesta en cliente
- ⚠️ Dependencia de Firebase
- ✅ Autenticación Firebase
- ✅ Reglas de seguridad Firestore

### Income Wallet
- ✅ Sin API keys en cliente
- ✅ Independiente de servicios externos
- ✅ Datos locales (menor superficie de ataque)
- ⚠️ Sin autenticación (acceso local)
- ⚠️ LocalStorage puede ser limpiado por usuario

**Recomendación de seguridad:**
- Implementar cifrado de datos sensibles en LocalStorage
- Agregar PIN o autenticación local
- Ofrecer opción de backup encriptado en nube

---

## 📱 Experiencia de Usuario

### Proyecto Wally
- Interfaz tabular tradicional
- Navegación por pestañas
- Formularios modales
- Diseño funcional pero básico

### Income Wallet
- Dashboard visual con KPIs
- Navegación lateral
- Formularios en página dedicada
- Diseño moderno con animaciones
- Gráficos interactivos
- Insights automáticos

---

## 🧪 Testing y Validación

### Pruebas de Migración

**Casos de prueba:**
1. **Migración con datos vacíos**
   - Estado inicial: Sin datos en Wally
   - Resultado esperado: Mensaje de "No hay datos para migrar"

2. **Migración con datos completos**
   - Estado inicial: Ingresos, gastos y CxC en Wally
   - Resultado esperado: Todos los datos migrados correctamente

3. **Migración con datos corruptos**
   - Estado inicial: Datos con campos faltantes
   - Resultado esperado: Migración parcial con advertencias

4. **Migración duplicada**
   - Estado inicial: Datos ya migrados
   - Resultado esperado: Evitar duplicados usando sourceKey

### Validación de Integridad

```javascript
function validateMigratedData(movements) {
  const errors = [];
  
  movements.forEach((mov, index) => {
    if (!mov.date) errors.push(`Movimiento ${index}: sin fecha`);
    if (!mov.amount || mov.amount <= 0) errors.push(`Movimiento ${index}: monto inválido`);
    if (!['ingreso', 'gasto'].includes(mov.type)) errors.push(`Movimiento ${index}: tipo inválido`);
  });
  
  return errors;
}
```

---

## 📚 Documentación para Usuarios

### Guía Rápida para Clientes

**1. Acceso a Income Wallet:**
- Abrir el archivo `index.html` en navegador moderno
- No requiere instalación ni servidor

**2. Primera Configuración:**
- Configurar nombre del negocio
- Personalizar etiquetas

**3. Migración desde Wally:**
- Ir a Configuración → Migrar desde Proyecto Wally
- Esperar confirmación de migración exitosa

**4. Uso Diario:**
- Registrar movimientos en "Nuevo movimiento"
- Ver resumen en "Dashboard"
- Revisar cobros pendientes en "Por cobrar"

**5. Backup:**
- Exportar datos regularmente en JSON
- Guardar archivo en lugar seguro

---

## 🔄 Roadmap de Desarrollo

### Funcionalidades Futuras Planeadas

**Corto plazo (v0.6):**
- [ ] Autenticación local con PIN
- [ ] Cifrado de datos en LocalStorage
- [ ] Backup automático programado
- [ ] Exportar a PDF/Excel

**Medio plazo (v0.7):**
- [ ] Sincronización opcional con nube
- [ ] Múltiples usuarios/roles
- [ ] Presupuestos y metas
- [ ] Recurrencia de movimientos

**Largo plazo (v1.0):**
- [ ] Aplicación móvil nativa
- [ ] Integración con bancos
- [ ] API para integraciones
- [ ] Modo multi-sucursal

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

**Problema: Migración falla**
```
Solución: 
1. Verificar conexión a internet
2. Confirmar API key válida
3. Revisar consola para errores específicos
```

**Problema: Datos no aparecen**
```
Solución:
1. Verificar LocalStorage habilitado
2. Limpiar caché y recargar
3. Revisar migración completada
```

**Problema: Gráficos no renderizan**
```
Solución:
1. Verificar soporte Canvas en navegador
2. Actualizar navegador a versión reciente
3. Revisar datos válidos para gráficos
```

---

## 📞 Contacto y Soporte

Para preguntas técnicas o problemas de migración:
- **Documentación:** Revisar guía visual y documento técnico
- **Logs:** Revisar consola del navegador para errores específicos
- **Backup:** Mantener copia de seguridad antes de migrar

---

## 📝 Conclusión

La migración de Proyecto Wally a Income Wallet representa una evolución significativa en:

1. **Experiencia de usuario:** Interfaz moderna e intuitiva
2. **Funcionalidades:** Herramientas avanzadas de análisis
3. **Independencia:** Sin dependencia de servicios externos
4. **Portabilidad:** Control total de los datos

El proceso de migración está diseñado para ser **simple, seguro y transparente**, permitiendo a los usuarios transicionar sin perder datos históricos y aprovechar inmediatamente las nuevas funcionalidades.

---

**Documento versión:** 1.0  
**Fecha:** 26 de junio de 2026  
**Sistema:** Income Wallet v0.5