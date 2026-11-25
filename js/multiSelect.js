/**
 * MultiSelect - Componente tipo Select2 con búsqueda, chips y selección múltiple
 */
class MultiSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.placeholder = options.placeholder || "Seleccionar...";
        this.allLabel = options.allLabel || "Todos";
        this.onChange = options.onChange || (() => {});
        this.items = []; // { value, label }
        this.selected = new Set();
        this.isOpen = false;

        if (this.container) {
            this.renderShell();
            this.bindEvents();
        }
    }

    renderShell() {
        this.container.classList.add("ms-wrapper");
        this.container.innerHTML = `
            <button type="button" class="ms-trigger" aria-expanded="false">
                <div class="ms-chips">
                    <span class="ms-placeholder">${this.allLabel}</span>
                </div>
                <span class="ms-arrow">▾</span>
            </button>
            <div class="ms-dropdown">
                <div class="ms-search-box">
                    <input type="text" class="ms-search-input" placeholder="Buscar...">
                </div>
                <div class="ms-actions">
                    <button type="button" class="ms-action-btn ms-select-all">Seleccionar todos</button>
                    <button type="button" class="ms-action-btn ms-clear-all">Limpiar</button>
                </div>
                <div class="ms-options-list"></div>
            </div>
        `;

        this.triggerEl = this.container.querySelector(".ms-trigger");
        this.chipsEl = this.container.querySelector(".ms-chips");
        this.dropdownEl = this.container.querySelector(".ms-dropdown");
        this.searchEl = this.container.querySelector(".ms-search-input");
        this.listEl = this.container.querySelector(".ms-options-list");
        this.btnSelectAll = this.container.querySelector(".ms-select-all");
        this.btnClearAll = this.container.querySelector(".ms-clear-all");
    }

    bindEvents() {
        this.triggerEl.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.dropdownEl.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        this.searchEl.addEventListener("input", () => {
            this.renderOptions(this.searchEl.value);
        });

        this.btnSelectAll.addEventListener("click", () => {
            const q = (this.searchEl.value || "").toLowerCase().trim();
            this.items.forEach(item => {
                if (!q || item.label.toLowerCase().includes(q)) {
                    this.selected.add(item.value);
                }
            });
            this.renderOptions(this.searchEl.value);
            this.renderChips();
            this.onChange(this.getValues());
        });

        this.btnClearAll.addEventListener("click", () => {
            this.selected.clear();
            this.renderOptions(this.searchEl.value);
            this.renderChips();
            this.onChange(this.getValues());
        });

        document.addEventListener("click", () => {
            if (this.isOpen) this.close();
        });
    }

    setOptions(items, preserveSelection = true) {
        const normalized = (items || []).map(item =>
            typeof item === "object" ? item : { value: String(item), label: String(item) }
        );
        this.items = normalized;

        if (preserveSelection) {
            const validValues = new Set(normalized.map(i => i.value));
            this.selected = new Set([...this.selected].filter(v => validValues.has(v)));
        } else {
            this.selected.clear();
        }

        this.renderOptions(this.searchEl ? this.searchEl.value : "");
        this.renderChips();
    }

    getValues() {
        return Array.from(this.selected);
    }

    clear(silent = false) {
        this.selected.clear();
        if (this.searchEl) this.searchEl.value = "";
        this.renderOptions("");
        this.renderChips();
        if (!silent) this.onChange([]);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        document.querySelectorAll(".ms-wrapper.open").forEach(el => {
            if (el !== this.container) el.classList.remove("open");
        });
        this.isOpen = true;
        this.container.classList.add("open");
        this.triggerEl.setAttribute("aria-expanded", "true");
        if (this.searchEl) {
            this.searchEl.value = "";
            this.renderOptions("");
            setTimeout(() => this.searchEl.focus(), 50);
        }
    }

    close() {
        this.isOpen = false;
        this.container.classList.remove("open");
        this.triggerEl.setAttribute("aria-expanded", "false");
    }

    renderOptions(filterText = "") {
        if (!this.listEl) return;
        const q = (filterText || "").toLowerCase().trim();
        const filtered = this.items.filter(i => !q || i.label.toLowerCase().includes(q));

        if (filtered.length === 0) {
            this.listEl.innerHTML = `<div class="ms-empty">Sin coincidencias</div>`;
            return;
        }

        this.listEl.innerHTML = filtered.map(item => {
            const checked = this.selected.has(item.value) ? "checked" : "";
            return `
                <label class="ms-option ${checked ? 'selected' : ''}">
                    <input type="checkbox" value="${this.escapeHtml(item.value)}" ${checked}>
                    <span class="ms-option-label">${this.escapeHtml(item.label)}</span>
                </label>
            `;
        }).join("");

        this.listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener("change", () => {
                if (cb.checked) this.selected.add(cb.value);
                else this.selected.delete(cb.value);
                cb.closest(".ms-option")?.classList.toggle("selected", cb.checked);
                this.renderChips();
                this.onChange(this.getValues());
            });
        });
    }

    renderChips() {
        if (!this.chipsEl) return;
        const vals = this.getValues();
        if (vals.length === 0) {
            this.chipsEl.innerHTML = `<span class="ms-placeholder">${this.escapeHtml(this.allLabel)}</span>`;
            return;
        }

        if (vals.length <= 2) {
            this.chipsEl.innerHTML = vals.map(v => {
                const found = this.items.find(i => i.value === v);
                const lbl = found ? found.label : v;
                return `<span class="ms-chip">${this.escapeHtml(lbl)}</span>`;
            }).join("");
        } else {
            this.chipsEl.innerHTML = `
                <span class="ms-chip ms-chip-count">${vals.length} seleccionados</span>
            `;
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
}

window.MultiSelect = MultiSelect;
