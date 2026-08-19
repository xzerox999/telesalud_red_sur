/**
 * Admin View - Renderizador del Panel de Administración y Estadísticas
 */
class AdminView {
    constructor() {
        this.charts = {};
        this.currentPivotData = null;
        this.currentConsolidadoData = null;
    }

    /**
     * Inicializa los controles y filtros del portal administrativo
     */
    initFilters(rawRecords) {
        const options = window.dataEngine.getFilterOptions(rawRecords);

        // Año
        const selAnio = document.getElementById("admin-filter-anio");
        if (selAnio) {
            selAnio.innerHTML = '<option value="">Todos los Años</option>';
            options.anios.forEach(a => selAnio.innerHTML += `<option value="${a}">${a}</option>`);
        }

        // Mes
        const selMes = document.getElementById("admin-filter-mes");
        if (selMes) {
            selMes.innerHTML = '<option value="">Todos los Meses</option>';
            options.meses.forEach(m => {
                const nombre = CONFIG.MESES_NOMBRES[m] || `Mes ${m}`;
                selMes.innerHTML += `<option value="${m}">${nombre}</option>`;
            });
        }

        // MicroRed
        const selMicro = document.getElementById("admin-filter-microred");
        if (selMicro) {
            selMicro.innerHTML = '<option value="">Todas las MicroRedes</option>';
            options.microredes.forEach(mr => {
                if (mr) selMicro.innerHTML += `<option value="${mr}">${mr}</option>`;
            });
        }

        // Establecimiento
        const selEstab = document.getElementById("admin-filter-estab");
        if (selEstab) {
            selEstab.innerHTML = '<option value="">Todos los Establecimientos</option>';
            options.establecimientos.forEach(est => {
                if (est) selEstab.innerHTML += `<option value="${est}">${est}</option>`;
            });
        }

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
     * Obtiene los valores actuales de los filtros
     */
    getActiveFilters() {
        return {
            anio: document.getElementById("admin-filter-anio")?.value || "",
            mes: document.getElementById("admin-filter-mes")?.value || "",
            microred: document.getElementById("admin-filter-microred")?.value || "",
            establecimiento: document.getElementById("admin-filter-estab")?.value || "",
            profesion: document.getElementById("admin-filter-prof")?.value || "",
            sistema: document.getElementById("admin-filter-sistema")?.value || "",
            search: document.getElementById("admin-filter-search")?.value || ""
        };
    }

    /**
     * Renderiza todo el panel de administración con los datos filtrados
     */
    render(filteredRecords) {
        this.renderKPICards(filteredRecords);
        this.renderConsolidadoTable(filteredRecords);
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

        this.setTxt("kpi-total-atenciones", total.toLocaleString());
        this.setTxt("kpi-tlh-total", tlh.toLocaleString());
        this.setTxt("kpi-tlh-pct", `${pctTLH}%`);
        this.setTxt("kpi-otros-total", otros.toLocaleString());
        this.setTxt("kpi-otros-pct", `${pctOtros}%`);
        this.setTxt("kpi-personal-activo", staff.size.toLocaleString());
        this.setTxt("kpi-top-estab", topEstab);
        this.setTxt("kpi-top-estab-count", `${topCount.toLocaleString()} atenciones`);
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
     * Colapsa o expande filas de una MicroRed en la tabla dinámica
     */
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
    }

    /**
     * Utilidad para crear o actualizar instancias de ApexCharts
     */
    updateOrCreateChart(chartId, element, options) {
        if (this.charts[chartId]) {
            this.charts[chartId].updateOptions(options);
        } else {
            this.charts[chartId] = new ApexCharts(element, options);
            this.charts[chartId].render();
        }
    }
}

window.adminView = new AdminView();
