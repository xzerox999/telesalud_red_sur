/**
 * App Controller - Orquestador Principal de la Aplicación de Telesalud
 */
class App {
    constructor() {
        this.rawData = [];
        this.currentTab = "consulta"; // 'consulta' o 'admin'
        this.isAdminAuthenticated = false;
    }

    /**
     * Inicialización general al cargar el DOM
     */
    async init() {
        this.checkAuthSession();
        this.bindEvents();
        await this.loadInitialData();
    }

    /**
     * Comprueba si el usuario administrador ya tiene sesión activa
     */
    checkAuthSession() {
        const auth = sessionStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_AUTH);
        if (auth === "true") {
            this.isAdminAuthenticated = true;
            this.updateAdminLockUI();
        }
    }

    /**
     * Carga de datos inicial desde Google Sheets / Caché / Fallback local
     */
    async loadInitialData(forceRefresh = false) {
        this.showLoading(true);
        try {
            const result = await window.dataService.loadData(forceRefresh);
            this.rawData = result.data || [];
            
            // Actualizar indicador de fuente de datos
            this.updateDataSourceBadge(result.source, result.timestamp);

            // Inicializar vistas con los datos
            window.adminView.initFilters(this.rawData);
            this.applyAdminFilters();

            // Si hay un DNI ya buscado en el input, reconsultar
            const searchedDoc = document.getElementById("public-doc-input")?.value;
            if (searchedDoc) {
                window.publicView.searchPersonnel(this.rawData, searchedDoc);
            }

            this.showToast(`Datos cargados exitosamente (${this.rawData.length.toLocaleString()} registros)`, "success");
        } catch (err) {
            console.error("Error al cargar datos:", err);
            this.showToast("Error al cargar la base de datos: " + err.message, "danger");
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Actualiza el badge informativo sobre el origen de los datos
     */
    updateDataSourceBadge(source, timestamp) {
        const badge = document.getElementById("data-source-badge");
        const timeEl = document.getElementById("data-last-sync-time");
        if (!badge) return;

        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Reciente";

        if (source === "google_sheets") {
            badge.className = "badge badge-online";
            badge.innerHTML = `<i data-lucide="cloud-check" class="icon-xs"></i> Google Sheets en Vivo`;
        } else if (source === "cache") {
            badge.className = "badge badge-cache";
            badge.innerHTML = `<i data-lucide="database" class="icon-xs"></i> Caché Local (${timeStr})`;
        } else {
            badge.className = "badge badge-neutral";
            badge.innerHTML = `<i data-lucide="file-spreadsheet" class="icon-xs"></i> Base Local Integrada`;
        }

        if (timeEl) timeEl.textContent = `Última sincronización: ${timeStr}`;
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Aplica los filtros del panel administrativo y refresca la vista
     */
    applyAdminFilters() {
        const filters = window.adminView.getActiveFilters();
        const filtered = window.dataEngine.applyFilters(this.rawData, filters);
        window.adminView.render(filtered);
    }

    /**
     * Maneja el cambio de pestaña principal
     */
    switchTab(tabName) {
        if (tabName === "admin" && !this.isAdminAuthenticated) {
            // Mostrar modal de login de administrador
            this.openAdminLoginModal();
            return;
        }

        this.currentTab = tabName;
        const btnConsulta = document.getElementById("tab-btn-consulta");
        const btnAdmin = document.getElementById("tab-btn-admin");
        const viewConsulta = document.getElementById("view-consulta");
        const viewAdmin = document.getElementById("view-admin");

        if (tabName === "consulta") {
            btnConsulta?.classList.add("active");
            btnAdmin?.classList.remove("active");
            if (viewConsulta) viewConsulta.style.display = "block";
            if (viewAdmin) viewAdmin.style.display = "none";
        } else {
            btnAdmin?.classList.add("active");
            btnConsulta?.classList.remove("active");
            if (viewAdmin) viewAdmin.style.display = "block";
            if (viewConsulta) viewConsulta.style.display = "none";
            this.applyAdminFilters();
        }
    }

    /**
     * Abre el modal de inicio de sesión para el administrador
     */
    openAdminLoginModal() {
        const modal = document.getElementById("modal-admin-login");
        const input = document.getElementById("admin-password-input");
        const errorMsg = document.getElementById("admin-login-error");
        if (modal) {
            modal.classList.add("show");
            if (input) {
                input.value = "";
                input.focus();
            }
            if (errorMsg) errorMsg.style.display = "none";
        }
    }

    /**
     * Cierra el modal de inicio de sesión
     */
    closeAdminLoginModal() {
        const modal = document.getElementById("modal-admin-login");
        if (modal) modal.classList.remove("show");
    }

    /**
     * Valida la contraseña del administrador
     */
    submitAdminLogin() {
        const input = document.getElementById("admin-password-input");
        const errorMsg = document.getElementById("admin-login-error");
        const enteredPass = input ? input.value : "";
        const validPass = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_PASSWORD) || CONFIG.ADMIN_PASSWORD_DEFAULT;

        if (enteredPass === validPass) {
            this.isAdminAuthenticated = true;
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_AUTH, "true");
            this.closeAdminLoginModal();
            this.updateAdminLockUI();
            this.switchTab("admin");
            this.showToast("Acceso de Administrador Autorizado", "success");
        } else {
            if (errorMsg) {
                errorMsg.style.display = "block";
                errorMsg.textContent = "Contraseña incorrecta. Intente nuevamente.";
            }
            if (input) {
                input.classList.add("is-invalid");
                input.focus();
            }
        }
    }

    /**
     * Cierra la sesión de administrador
     */
    logoutAdmin() {
        this.isAdminAuthenticated = false;
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_AUTH);
        this.updateAdminLockUI();
        this.switchTab("consulta");
        this.showToast("Sesión de Administrador cerrada", "info");
    }

    /**
     * Actualiza los iconos y estados visuales del botón Admin
     */
    updateAdminLockUI() {
        const lockIcon = document.getElementById("admin-tab-lock-icon");
        const logoutBtn = document.getElementById("admin-logout-btn");
        if (lockIcon) {
            lockIcon.setAttribute("data-lucide", this.isAdminAuthenticated ? "unlock" : "lock");
        }
        if (logoutBtn) {
            logoutBtn.style.display = this.isAdminAuthenticated ? "inline-flex" : "none";
        }
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Vinculación de eventos y listeners en la interfaz
     */
    bindEvents() {
        // Pestañas
        document.getElementById("tab-btn-consulta")?.addEventListener("click", () => this.switchTab("consulta"));
        document.getElementById("tab-btn-admin")?.addEventListener("click", () => this.switchTab("admin"));
        document.getElementById("admin-logout-btn")?.addEventListener("click", () => this.logoutAdmin());

        // Login Modal
        document.getElementById("btn-login-submit")?.addEventListener("click", () => this.submitAdminLogin());
        document.getElementById("admin-password-input")?.addEventListener("keyup", (e) => {
            if (e.key === "Enter") this.submitAdminLogin();
        });
        document.getElementById("btn-close-login-modal")?.addEventListener("click", () => this.closeAdminLoginModal());
        document.getElementById("btn-cancel-login")?.addEventListener("click", () => this.closeAdminLoginModal());

        // Búsqueda Pública de Personal (Soporta DNI, Carnet Extranjería > 8 dígitos)
        const docInput = document.getElementById("public-doc-input");
        const searchBtn = document.getElementById("public-search-btn");

        const executeSearch = () => {
            const doc = docInput?.value.trim();
            window.publicView.searchPersonnel(this.rawData, doc);
        };

        searchBtn?.addEventListener("click", executeSearch);
        docInput?.addEventListener("keyup", (e) => {
            if (e.key === "Enter") executeSearch();
        });

        // Filtros de Administrador
        const filterIds = [
            "admin-filter-anio", "admin-filter-mes", "admin-filter-microred",
            "admin-filter-estab", "admin-filter-prof", "admin-filter-sistema"
        ];
        filterIds.forEach(id => {
            document.getElementById(id)?.addEventListener("change", () => this.applyAdminFilters());
        });

        // Búsqueda debounce en el admin
        let debounceTimer;
        document.getElementById("admin-filter-search")?.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.applyAdminFilters(), 250);
        });

        // Botón Limpiar Filtros
        document.getElementById("admin-btn-reset-filters")?.addEventListener("click", () => {
            filterIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });
            const searchEl = document.getElementById("admin-filter-search");
            if (searchEl) searchEl.value = "";
            this.applyAdminFilters();
            this.showToast("Filtros restablecidos", "info");
        });

        // Botón Sincronizar Datos
        document.getElementById("btn-sync-data")?.addEventListener("click", () => {
            this.loadInitialData(true);
        });

        // Modal de Configuración de Google Sheets
        document.getElementById("btn-open-settings")?.addEventListener("click", () => {
            const currentUrl = window.dataService.getSheetUrl();
            const input = document.getElementById("settings-sheet-url-input");
            if (input) input.value = currentUrl;
            document.getElementById("modal-settings")?.classList.add("show");
        });

        document.getElementById("btn-close-settings")?.addEventListener("click", () => {
            document.getElementById("modal-settings")?.classList.remove("show");
        });

        document.getElementById("btn-save-settings")?.addEventListener("click", () => {
            const input = document.getElementById("settings-sheet-url-input");
            const newUrl = input ? input.value.trim() : "";
            window.dataService.setSheetUrl(newUrl);
            document.getElementById("modal-settings")?.classList.remove("show");
            this.showToast("Configuración guardada. Sincronizando...", "success");
            this.loadInitialData(true);
        });

        // Exportaciones
        document.getElementById("btn-export-excel-nominal")?.addEventListener("click", () => {
            const filters = window.adminView.getActiveFilters();
            const filteredRecords = window.dataEngine.applyFilters(this.rawData, filters);
            const summary = `${filters.microred || 'Todas MR'} - ${filters.mes ? 'Mes ' + filters.mes : 'Todos los Meses'}`;
            window.exportService.exportNominalRawToExcel(filteredRecords, summary);
            this.showToast(`Padrón Nominal exportado (${filteredRecords.length.toLocaleString()} registros)`, "success");
        });

        document.getElementById("btn-export-excel-pivot")?.addEventListener("click", () => {
            if (window.adminView.currentPivotData) {
                const filters = window.adminView.getActiveFilters();
                const summary = `${filters.microred || 'Todas MR'} - ${filters.mes ? 'Mes ' + filters.mes : 'Todos los Meses'}`;
                window.exportService.exportPivotToExcel(window.adminView.currentPivotData, summary);
                this.showToast("Reporte Excel descargado", "success");
            }
        });

        document.getElementById("btn-export-excel-consolidado")?.addEventListener("click", () => {
            if (window.adminView.currentConsolidadoData) {
                window.exportService.exportConsolidadoToExcel(window.adminView.currentConsolidadoData);
                this.showToast("Consolidado Excel descargado", "success");
            }
        });

        // Impresión de constancia
        document.getElementById("btn-print-certificate")?.addEventListener("click", () => {
            window.exportService.printPersonalCertificate();
        });
    }

    /**
     * Muestra / oculta el indicador de carga
     */
    showLoading(isLoading) {
        const loader = document.getElementById("global-loader");
        if (loader) loader.style.display = isLoading ? "flex" : "none";
    }

    /**
     * Muestra notificación Toast interactiva
     */
    showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `custom-toast toast-${type} animate-slide-in`;
        
        let iconName = "info";
        if (type === "success") iconName = "check-circle";
        if (type === "danger") iconName = "alert-circle";
        if (type === "warning") iconName = "alert-triangle";

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="icon-sm"></i>
            <span class="toast-text">${message}</span>
        `;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.classList.add("toast-fade-out");
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }
}

window.app = new App();

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    window.app.init();
});
