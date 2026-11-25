/**
 * Admin View - Renderizador del Panel de Administración y Estadísticas
 */
class AdminView {
    constructor() {
        this.charts = {};
        this.currentPivotData = null;
        this.currentConsolidadoData = null;
        this.currentRankingData = null;
        this.rawRecordsRef = [];
        this.multiSelects = {};
    }

    /**
     * Inicializa los controles y filtros del portal administrativo
     */
    initFilters(rawRecords) {
        this.rawRecordsRef = rawRecords || [];
        const options = window.dataEngine.getFilterOptions(this.rawRecordsRef);
        const onFilterChange = () => {
            if (window.app) window.app.applyAdminFilters();
        };

        // Año(s)
        if (!this.multiSelects.anio) {
            this.multiSelects.anio = new MultiSelect("admin-filter-anio-ms", {
                allLabel: "Todos los Años",
                onChange: onFilterChange
            });
        }
        this.multiSelects.anio.setOptions(options.anios.map(a => ({ value: a, label: a })));

        // Mes(es)
        if (!this.multiSelects.mes) {
            this.multiSelects.mes = new MultiSelect("admin-filter-mes-ms", {
                allLabel: "Todos los Meses",
                onChange: onFilterChange
            });
        }
        this.multiSelects.mes.setOptions(options.meses.map(m => ({
            value: m,
            label: CONFIG.MESES_NOMBRES[m] || `Mes ${m}`
        })));

        // MicroRed(es) -> Al cambiar, actualiza los EESS disponibles
        if (!this.multiSelects.microred) {
            this.multiSelects.microred = new MultiSelect("admin-filter-microred-ms", {
                allLabel: "Todas las MicroRedes",
                onChange: () => {
                    this.updateEstabOptionsByMicrored();
                    onFilterChange();
                }
            });
        }
        this.multiSelects.microred.setOptions(options.microredes.filter(Boolean).map(mr => ({ value: mr, label: mr })));

        // Establecimiento(s)
        if (!this.multiSelects.estab) {
            this.multiSelects.estab = new MultiSelect("admin-filter-estab-ms", {
                allLabel: "Todos los EESS",
                onChange: onFilterChange
            });
        }
        this.updateEstabOptionsByMicrored();

        // Profesión
        const selProf = document.getElementById("admin-filter-prof");
        if (selProf) {
            selProf.innerHTML = '<option value="">Todas las Profesiones</option>';
            options.profesiones.forEach(p => {
                if (p) selProf.innerHTML += `<option value="${p}">${p}</option>`;
            });
        }
    }

    /**
     * Filtra dinámicamente los EESS según las MicroRedes seleccionadas
     */
    updateEstabOptionsByMicrored() {
        if (!this.multiSelects.estab) return;
        const selectedMicros = this.multiSelects.microred ? this.multiSelects.microred.getValues() : [];
        let filteredRecords = this.rawRecordsRef;
        if (selectedMicros.length > 0) {
            const upperSet = new Set(selectedMicros.map(m => m.toUpperCase()));
            filteredRecords = this.rawRecordsRef.filter(r =>
                upperSet.has(String(r.MicroRed || "").trim().toUpperCase())
            );
        }
        const opts = window.dataEngine.getFilterOptions(filteredRecords);
        this.multiSelects.estab.setOptions(
            opts.establecimientos.filter(Boolean).map(e => ({ value: e, label: e })),
            true
        );
    }

    /**
     * Restablece todos los filtros (incluidos multi-selects)
     */
    resetFilters() {
        Object.values(this.multiSelects).forEach(ms => ms.clear(true));
        this.updateEstabOptionsByMicrored();
        ["admin-filter-prof", "admin-filter-sistema", "admin-filter-search"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    }

    /**
     * Obtiene los valores actuales de los filtros
     */
    getActiveFilters() {
        return {
            anio: this.multiSelects.anio ? this.multiSelects.anio.getValues() : [],
            mes: this.multiSelects.mes ? this.multiSelects.mes.getValues() : [],
            microred: this.multiSelects.microred ? this.multiSelects.microred.getValues() : [],
            establecimiento: this.multiSelects.estab ? this.multiSelects.estab.getValues() : [],
            profesion: document.getElementById("admin-filter-prof")?.value || "",
            sistema: document.getElementById("admin-filter-sistema")?.value || "",
            search: document.getElementById("admin-filter-search")?.value || ""
        };
    }

    /**
     * Genera un texto legible de los filtros activos para encabezados de Excel
     */
    getFilterSummaryText() {
        const f = this.getActiveFilters();
        const parts = [];
        if (f.anio.length) parts.push(`Año: ${f.anio.join(", ")}`);
        if (f.mes.length) parts.push(`Mes: ${f.mes.map(m => CONFIG.MESES_NOMBRES[m] || m).join(", ")}`);
        if (f.microred.length) parts.push(`MicroRed: ${f.microred.join(", ")}`);
        if (f.establecimiento.length) parts.push(`EESS: ${f.establecimiento.length <= 2 ? f.establecimiento.join(", ") : f.establecimiento.length + " seleccionados"}`);
        if (f.profesion) parts.push(`Profesión: ${f.profesion}`);
        if (f.sistema) parts.push(`Sistema: ${f.sistema}`);
        return parts.length > 0 ? parts.join(" | ") : "Todos los registros";
    }

    /**
     * Renderiza todo el panel de administración con los datos filtrados
     */
    render(filteredRecords) {
        this.renderKPICards(filteredRecords);
        this.renderConsolidadoTable(filteredRecords);
        this.renderStaffRanking(filteredRecords);
        this.renderPivotTable(filteredRecords);
        this.renderCharts(filteredRecords);
    }

    setTxt(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    /**
     * Renderiza las tarjetas de indicadores clave (KPIs)
     */
    renderKPICards(records) {
        const total = records.length;
        let tlh = 0;
        let otros = 0;
        const estabs = {};
        const staff = new Set();

        records.forEach(r => {
            if (window.dataEngine.isTeleatiendo(r.Lote)) tlh++; else otros++;
            const e = r.Nombre_Establecimiento || "Sin EESS";
            estabs[e] = (estabs[e] || 0) + 1;
            if (r.Numero_Documento_Personal) staff.add(r.Numero_Documento_Personal);
        });

        // Top establecimiento
        let topEstab = "N/A";
        let topCount = 0;
        Object.entries(estabs).forEach(([name, count]) => {
            if (count > topCount) {
                topCount = count;
                topEstab = name;
            }
        });

        const pctTLH = total > 0 ? ((tlh / total) * 100).toFixed(1) : 0;
        const pctOtros = total > 0 ? ((otros / total) * 100).toFixed(1) : 0;

        this.animateNumber("kpi-total-atenciones", total);
        this.animateNumber("kpi-tlh-total", tlh);
        this.setTxt("kpi-tlh-pct", `${pctTLH}%`);
        this.animateNumber("kpi-otros-total", otros);
        this.setTxt("kpi-otros-pct", `${pctOtros}%`);
        this.animateNumber("kpi-personal-activo", staff.size);
        this.setTxt("kpi-top-estab", topEstab);
        this.setTxt("kpi-top-estab-count", `${topCount.toLocaleString()} atenciones`);
    }

    /**
     * Efecto de conteo numérico animado para KPIs
     */
    animateNumber(id, targetValue) {
        const el = document.getElementById(id);
        if (!el) return;
        const end = Number(targetValue) || 0;
        const duration = 450;
        const startTime = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(end * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /**
     * Renderiza la tabla de consolidado (Lógica idéntica al Excel)
     */
    renderConsolidadoTable(records) {
        const summary = window.dataEngine.getConsolidadoSummary(records);
        this.currentConsolidadoData = summary;

        const tbody = document.getElementById("admin-consolidado-tbody");
        const tfoot = document.getElementById("admin-consolidado-tfoot");
        if (!tbody || !tfoot) return;

        tbody.innerHTML = "";
        summary.rows.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="fw-semibold text-dark">
                    <span class="activity-pill">${r.label}</span>
                </td>
                <td class="text-end fw-bold text-primary">${r.teleatiendo.toLocaleString()}</td>
                <td class="text-end fw-bold text-warning-dark">${r.otros.toLocaleString()}</td>
                <td class="text-end fw-bold text-dark">${r.total.toLocaleString()}</td>
                <td class="text-end">
                    <div class="d-flex align-items-center justify-content-end gap-2">
                        <span>${r.porcentaje}%</span>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${r.porcentaje}%"></div>
                        </div>
                    </div>
                </td>
                <td class="text-end">
                    <span class="badge ${r.porcentajeTLH >= 50 ? 'badge-success' : 'badge-neutral'}">
                        ${r.porcentajeTLH}% TLH
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tfoot.innerHTML = `
            <tr class="table-total-row">
                <td class="fw-bold">TOTAL GENERAL</td>
                <td class="text-end fw-bold text-primary">${summary.totals.teleatiendo.toLocaleString()}</td>
                <td class="text-end fw-bold text-warning-dark">${summary.totals.otros.toLocaleString()}</td>
                <td class="text-end fw-bold text-dark">${summary.totals.total.toLocaleString()}</td>
                <td class="text-end fw-bold">100.0%</td>
                <td class="text-end fw-bold text-primary">${summary.totals.porcentajeTLH}% TLH</td>
            </tr>
        `;
    }

    /**
     * Renderiza el Ranking de Personal de Salud y Desglose de Actividades
     */
    renderStaffRanking(records) {
        const rankingData = window.dataEngine.getStaffRanking(records);
        this.currentRankingData = rankingData;

        const tbody = document.getElementById("admin-ranking-tbody");
        const subtitleEl = document.getElementById("admin-ranking-subtitle");
        const searchInput = document.getElementById("admin-ranking-search");
        if (!tbody) return;

        if (searchInput) searchInput.value = "";

        const filters = this.getActiveFilters();
        let subtitleText = "Todos los Establecimientos";
        if (filters.establecimiento && filters.establecimiento.length > 0) {
            subtitleText = `EESS: <strong>${filters.establecimiento.length <= 2 ? filters.establecimiento.join(", ") : filters.establecimiento.length + " seleccionados"}</strong>`;
        } else if (filters.microred && filters.microred.length > 0) {
            subtitleText = `MicroRed: <strong>${filters.microred.join(", ")}</strong>`;
        }

        if (subtitleEl) {
            subtitleEl.innerHTML = `
                <span>${subtitleText}</span> • 
                <span class="badge badge-online">Top 10 de ${rankingData.totalPersonal} Profesionales</span> • 
                <span class="badge badge-neutral">${rankingData.totalAtenciones.toLocaleString()} Atenciones</span>
            `;
        }

        // En pantalla solo mostrar Top 10; en Excel se exportan todos
        this.renderRankingRows(rankingData.ranking.slice(0, 10));
    }

    /**
     * Genera una medalla SVG con el número perfectamente centrado adentro
     */
    getMedalSvg(rank) {
        const palettes = {
            1: { ribbon: "#ef4444", outer: "#ca8a04", inner: "#fde047", stroke: "#fef08a", text: "#713f12", title: "1° Lugar" },
            2: { ribbon: "#3b82f6", outer: "#64748b", inner: "#e2e8f0", stroke: "#f8fafc", text: "#1e293b", title: "2° Lugar" },
            3: { ribbon: "#0d9488", outer: "#c2410c", inner: "#fdba74", stroke: "#ffedd5", text: "#7c2d12", title: "3° Lugar" }
        };
        const p = palettes[rank];
        if (!p) {
            return `<span class="rank-badge rank-default">#${rank}</span>`;
        }
        return `
            <span class="rank-medal-svg" title="${p.title} en Producción">
                <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2H20L17 13H10L12 2Z" fill="${p.ribbon}" opacity="0.9"/>
                    <path d="M28 2H20L23 13H30L28 2Z" fill="${p.ribbon}"/>
                    <circle cx="20" cy="25" r="15" fill="${p.outer}"/>
                    <circle cx="20" cy="25" r="12.5" fill="${p.inner}" stroke="${p.stroke}" stroke-width="1.5"/>
                    <text x="20" y="30" text-anchor="middle" fill="${p.text}" font-family="Inter, sans-serif" font-weight="800" font-size="14">${rank}</text>
                </svg>
            </span>
        `;
    }

    /**
     * Renderiza las filas del ranking en la tabla
     */
    renderRankingRows(rankingList) {
        const tbody = document.getElementById("admin-ranking-tbody");
        if (!tbody) return;

        if (!rankingList || rankingList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center p-4 text-muted">
                        <i data-lucide="inbox" class="icon-md text-muted mb-2 d-block mx-auto"></i>
                        No se encontró personal registrado para los filtros actuales.
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const top1Total = rankingList[0] ? rankingList[0].total : 1;

        tbody.innerHTML = rankingList.map(s => {
            const rankBadgeHtml = this.getMedalSvg(s.rank);

            const progressPct = top1Total > 0 ? ((s.total / top1Total) * 100).toFixed(0) : 0;

            const modPills = s.activeModalities && s.activeModalities.length > 0 
                ? s.activeModalities.map(m => `
                    <span class="mod-pill" title="${m.label}: ${m.count}">
                        <i data-lucide="${m.icon || 'activity'}" class="icon-xs"></i>
                        <strong>${m.count}</strong>
                        <span>${m.label}</span>
                    </span>
                `).join('')
                : '<span class="text-muted fs-xs">Sin actividades</span>';

            return `
                <tr class="ranking-row">
                    <td class="text-center align-middle">${rankBadgeHtml}</td>
                    <td class="align-middle">
                        <div class="staff-info-cell">
                            <span class="staff-name">${s.nombre}</span>
                            <div class="staff-meta-row">
                                <span class="tag-doc"><i data-lucide="id-card" class="icon-xs"></i> DNI: <strong>${s.documento}</strong></span>
                                <span class="tag-prof"><i data-lucide="briefcase" class="icon-xs"></i> ${s.profesion}</span>
                                <span class="tag-cond"><i data-lucide="badge-check" class="icon-xs"></i> ${s.condicion}</span>
                            </div>
                        </div>
                    </td>
                    <td class="align-middle">
                        <div class="d-flex flex-column">
                            <span class="fw-semibold text-dark fs-sm">🏥 ${s.establecimientosTexto}</span>
                            <small class="text-muted fs-xs">MR: ${s.microredesTexto}</small>
                        </div>
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge-system badge-tlh">${s.tlh} (${s.porcentajeTLH}%)</span>
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge-system badge-otros">${s.otros}</span>
                    </td>
                    <td class="align-middle text-end" style="min-width: 140px;">
                        <div class="ranking-total-box">
                            <span class="fs-6 fw-bold text-primary">${s.total.toLocaleString()}</span>
                            <div class="ranking-progress-bar">
                                <div class="ranking-progress-fill" style="width: ${progressPct}%"></div>
                            </div>
                            <small class="text-muted fs-xs">${s.porcentajeShare}% del total</small>
                        </div>
                    </td>
                    <td class="align-middle" style="min-width: 240px;">
                        <div class="modality-pills-wrap">
                            ${modPills}
                        </div>
                    </td>
                    <td class="text-center align-middle">
                        <button type="button" class="btn btn-outline btn-xs btn-view-staff" data-dni="${s.documento}" title="Consultar historial individual">
                            <i data-lucide="user-search" class="icon-xs"></i>
                            <span>Ver Ficha</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        // Conectar eventos para los botones de ver ficha individual
        tbody.querySelectorAll(".btn-view-staff").forEach(btn => {
            btn.addEventListener("click", () => {
                const dni = btn.getAttribute("data-dni");
                if (dni && window.app) {
                    window.app.switchTab("consulta");
                    const input = document.getElementById("public-doc-input");
                    if (input) input.value = dni;
                    window.publicView.searchPersonnel(window.app.rawData, dni);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Filtra la tabla de ranking en tiempo real según el término ingresado
     */
    filterRankingTable(term) {
        if (!this.currentRankingData || !this.currentRankingData.ranking) return;
        const q = (term || "").toLowerCase().trim();
        if (!q) {
            this.renderRankingRows(this.currentRankingData.ranking.slice(0, 10));
            return;
        }

        const filtered = this.currentRankingData.ranking.filter(s => {
            return s.nombre.toLowerCase().includes(q) ||
                   s.documento.toLowerCase().includes(q) ||
                   s.profesion.toLowerCase().includes(q) ||
                   (s.establecimientosTexto && s.establecimientosTexto.toLowerCase().includes(q)) ||
                   (s.microredesTexto && s.microredesTexto.toLowerCase().includes(q));
        });

        this.renderRankingRows(filtered.slice(0, 10));
    }

    /**
     * Renderiza la tabla dinámica por MicroRed y Establecimiento con acordeones
     */
    renderPivotTable(records) {
        const pivot = window.dataEngine.getPivotTable(records);
        this.currentPivotData = pivot;

        const tableContainer = document.getElementById("admin-pivot-container");
        if (!tableContainer) return;

        const microredes = Object.keys(pivot.tree).sort();
        if (microredes.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox"></i>
                    <p>No se encontraron registros con los filtros seleccionados.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let html = `
            <div class="table-responsive pivot-table-wrapper">
                <table class="table pivot-table table-hover">
                    <thead>
                        <tr>
                            <th style="min-width: 260px;">MicroRed / Establecimiento</th>
                            ${pivot.columns.map(col => `<th class="text-center" style="min-width: 130px;">${col}</th>`).join('')}
                            <th class="text-center bg-highlight" style="min-width: 110px;">Total General</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        microredes.forEach(micro => {
            const estabs = pivot.tree[micro];
            const estabNames = Object.keys(estabs).sort();
            const microTotal = pivot.microredTotals[micro];

            // Fila de MicroRed (Cabecera colapsable)
            html += `
                <tr class="microred-header-row" onclick="window.adminView.toggleMicroredRow(this)">
                    <td class="fw-bold text-primary">
                        <span class="tree-toggle-icon">▼</span>
                        <i data-lucide="layers" class="icon-sm"></i>
                        MICRORED: ${micro} (${estabNames.length} EESS)
                    </td>
                    ${pivot.columns.map(col => `
                        <td class="text-center fw-bold text-primary">${microTotal[col] ? microTotal[col].toLocaleString() : '-'}</td>
                    `).join('')}
                    <td class="text-center fw-bold bg-highlight text-primary">${microTotal.total.toLocaleString()}</td>
                </tr>
            `;

            // Filas de cada Establecimiento dentro de la MicroRed
            estabNames.forEach(estab => {
                const estabData = estabs[estab];
                html += `
                    <tr class="estab-row micro-${micro.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <td class="estab-name-cell">
                            <span class="tree-branch">└─</span>
                            <i data-lucide="home" class="icon-xs text-muted"></i>
                            ${estab}
                        </td>
                        ${pivot.columns.map(col => `
                            <td class="text-center ${estabData[col] ? 'text-dark fw-semibold' : 'text-muted-light'}">
                                ${estabData[col] ? estabData[col].toLocaleString() : '-'}
                            </td>
                        `).join('')}
                        <td class="text-center fw-bold bg-highlight-light">${estabData.total.toLocaleString()}</td>
                    </tr>
                `;
            });
        });

        // Fila Total General
        html += `
                    </tbody>
                    <tfoot>
                        <tr class="general-total-row">
                            <td class="fw-bold">TOTAL GENERAL DE LA RED</td>
                            ${pivot.columns.map(col => `
                                <td class="text-center fw-bold">${pivot.generalTotals[col] ? pivot.generalTotals[col].toLocaleString() : '-'}</td>
                            `).join('')}
                            <td class="text-center fw-bold bg-highlight text-white">${pivot.generalTotals.total.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        tableContainer.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Expande o colapsa todas las MicroRedes de la tabla dinámica
     */
    expandAllMicroreds(expand = true) {
        const container = document.getElementById("admin-pivot-container");
        if (!container) return;
        container.querySelectorAll(".microred-header-row .tree-toggle-icon").forEach(icon => {
            icon.textContent = expand ? "▼" : "▶";
        });
        container.querySelectorAll(".estab-row").forEach(row => {
            row.style.display = expand ? "" : "none";
        });
    }
    toggleMicroredRow(trElement) {
        const icon = trElement.querySelector(".tree-toggle-icon");
        let next = trElement.nextElementSibling;
        const isCollapsed = icon.textContent === "▶";

        icon.textContent = isCollapsed ? "▼" : "▶";

        while (next && next.classList.contains("estab-row")) {
            next.style.display = isCollapsed ? "" : "none";
            next = next.nextElementSibling;
        }
    }

    /**
     * Renderiza o actualiza los gráficos estadísticos usando ApexCharts
     */
    renderCharts(records) {
        if (typeof ApexCharts === "undefined") return;

        const analytics = window.dataEngine.getAnalyticsData(records);

        // 1. Gráfico Dona: Teleatiendo vs Otros
        const donutEl = document.getElementById("chart-teleatiendo-vs-otros");
        if (donutEl) {
            const options = {
                chart: { type: 'donut', height: 280, fontFamily: 'Inter, sans-serif' },
                series: analytics.teleatiendoVsOtros.series,
                labels: analytics.teleatiendoVsOtros.labels,
                colors: ['#0ea5e9', '#f59e0b'],
                legend: { position: 'bottom' },
                dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '65%',
                            labels: {
                                show: true,
                                total: {
                                    show: true,
                                    label: 'Total Atenciones',
                                    formatter: () => records.length.toLocaleString()
                                }
                            }
                        }
                    }
                }
            };
            this.updateOrCreateChart("donut", donutEl, options);
        }

        // 2. Gráfico Barras: Top Establecimientos
        const topEl = document.getElementById("chart-top-establecimientos");
        if (topEl) {
            const options = {
                chart: { type: 'bar', height: 280, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                series: [{
                    name: 'Atenciones',
                    data: analytics.topEstablecimientos.map(e => e.count)
                }],
                xaxis: {
                    categories: analytics.topEstablecimientos.map(e => e.name),
                    labels: { style: { fontSize: '11px' }, rotate: -35 }
                },
                colors: ['#3b82f6'],
                plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '55%' } },
                dataLabels: { enabled: false },
                grid: { borderColor: '#f1f5f9' }
            };
            this.updateOrCreateChart("topEstabs", topEl, options);
        }

        // 3. Gráfico Modalidades
        const modEl = document.getElementById("chart-distribucion-modalidad");
        if (modEl) {
            const options = {
                chart: { type: 'bar', height: 280, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                series: [{
                    name: 'Atenciones',
                    data: analytics.distribucionModalidad.series
                }],
                xaxis: {
                    categories: analytics.distribucionModalidad.labels,
                    labels: { style: { fontSize: '11px' }, rotate: -25 }
                },
                colors: ['#10b981'],
                plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                dataLabels: { enabled: true, style: { fontSize: '11px' } },
                grid: { borderColor: '#f1f5f9' }
            };
            this.updateOrCreateChart("modalidades", modEl, options);
        }

        // 4. Gráfico Profesiones
        const profEl = document.getElementById("chart-top-profesiones");
        if (profEl) {
            const options = {
                chart: { type: 'donut', height: 280, fontFamily: 'Inter, sans-serif' },
                series: analytics.topProfesiones.map(p => p.count),
                labels: analytics.topProfesiones.map(p => p.name),
                colors: ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b', '#eab308'],
                legend: { position: 'bottom', fontSize: '11px' },
                dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` }
            };
            this.updateOrCreateChart("profesiones", profEl, options);
        }

        // 5. Gráfico Evolución Mensual (Tendencia)
        const evolEl = document.getElementById("chart-evolucion-mensual");
        if (evolEl) {
            const options = {
                chart: { type: 'area', height: 280, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                series: [
                    { name: 'Total Atenciones', data: analytics.evolucionTemporal.total },
                    { name: 'Teleatiendo (TLH)', data: analytics.evolucionTemporal.tlh }
                ],
                xaxis: {
                    categories: analytics.evolucionTemporal.categories,
                    labels: { style: { fontSize: '11px' } }
                },
                colors: ['#0284c7', '#10b981'],
                stroke: { curve: 'smooth', width: 2.5 },
                fill: {
                    type: 'gradient',
                    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 }
                },
                dataLabels: { enabled: false },
                legend: { position: 'top' },
                grid: { borderColor: 'rgba(148, 163, 184, 0.2)' }
            };
            this.updateOrCreateChart("evolucionMensual", evolEl, options);
        }
    }

    /**
     * Utilidad para crear o actualizar instancias de ApexCharts
     */
    updateOrCreateChart(chartId, element, options) {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const themedOptions = {
            ...options,
            theme: { mode: isDark ? "dark" : "light" },
            chart: {
                ...(options.chart || {}),
                background: "transparent"
            }
        };
        if (this.charts[chartId]) {
            this.charts[chartId].updateOptions(themedOptions);
        } else {
            this.charts[chartId] = new ApexCharts(element, themedOptions);
            this.charts[chartId].render();
        }
    }

    /**
     * Re-renderiza los gráficos al cambiar de tema (Claro / Oscuro)
     */
    refreshChartsTheme() {
        if (window.app && window.app.rawData) {
            const filtered = window.dataEngine.applyFilters(window.app.rawData, this.getActiveFilters());
            this.renderCharts(filtered);
        }
    }
}

window.adminView = new AdminView();
