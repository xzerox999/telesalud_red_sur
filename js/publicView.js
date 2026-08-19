/**
 * Public View - Buscador y Consulta Individual de Personal de Salud
 */
class PublicView {
    constructor() {
        this.currentReport = null;
    }

    /**
     * Realiza la búsqueda de atenciones de un personal por su documento
     */
    searchPersonnel(rawRecords, docNumber) {
        const resultContainer = document.getElementById("public-result-container");
        const emptyContainer = document.getElementById("public-empty-state");
        const initialContainer = document.getElementById("public-initial-state");

        if (!docNumber || docNumber.trim() === "") {
            if (initialContainer) initialContainer.style.display = "block";
            if (resultContainer) resultContainer.style.display = "none";
            if (emptyContainer) emptyContainer.style.display = "none";
            return;
        }

        const report = window.dataEngine.getPersonalReport(rawRecords, docNumber);
        this.currentReport = report;

        if (!report) {
            if (initialContainer) initialContainer.style.display = "none";
            if (resultContainer) resultContainer.style.display = "none";
            if (emptyContainer) {
                emptyContainer.style.display = "block";
                document.getElementById("searched-doc-number").textContent = docNumber;
            }
            return;
        }

        if (initialContainer) initialContainer.style.display = "none";
        if (emptyContainer) emptyContainer.style.display = "none";
        if (resultContainer) resultContainer.style.display = "block";

        this.renderPersonalProfile(report.info);
        this.renderPersonalSummaryCards(report.info);
        this.renderProductionMatrix(report);
        this.populatePrintCertificate(report);

        // Disparar confetti si está disponible
        if (typeof confetti === "function") {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
    }

    setTxt(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    /**
     * Renderiza la ficha de identidad del profesional
     */
    renderPersonalProfile(info) {
        this.setTxt("personal-name", info.nombre);
        this.setTxt("personal-dni", info.numeroDocumento);
        this.setTxt("personal-profesion", info.profesion);
        this.setTxt("personal-microred", info.microred);
        this.setTxt("personal-estab", info.establecimiento);
        this.setTxt("personal-colegio", info.colegio || "No Registrado");
        this.setTxt("personal-condicion", info.condicion || "No Registrado");
    }

    /**
     * Renderiza las tarjetas de resumen de producción individual
     */
    renderPersonalSummaryCards(info) {
        this.setTxt("personal-kpi-total", info.totalAtenciones.toLocaleString());
        this.setTxt("personal-kpi-tlh", info.totalTLH.toLocaleString());
        this.setTxt("personal-kpi-tlh-pct", `${info.porcentajeTLH}%`);
        this.setTxt("personal-kpi-otros", info.totalOtros.toLocaleString());
        this.setTxt("personal-kpi-otros-pct", `${info.porcentajeOtros}%`);
    }

    /**
     * Renderiza la matriz detallada de atenciones por modalidad y sistema
     */
    renderProductionMatrix(report) {
        const tbody = document.getElementById("personal-matrix-tbody");
        const tfoot = document.getElementById("personal-matrix-tfoot");
        if (!tbody || !tfoot) return;

        tbody.innerHTML = "";
        const modalidades = report.modalidades;

        // Acumuladores generales
        const grandTotalsTLH = {};
        const grandTotalsOtros = {};
        modalidades.forEach(m => {
            grandTotalsTLH[m.key] = 0;
            grandTotalsOtros[m.key] = 0;
        });

        report.periods.forEach(period => {
            // Fila TELEATIENDO (TLH)
            const trTLH = document.createElement("tr");
            trTLH.className = "period-row-tlh";
            trTLH.innerHTML = `
                <td class="fw-bold text-dark align-middle" rowspan="2">
                    <div class="d-flex flex-column">
                        <span class="period-title">${period.mesNombre} ${period.anio}</span>
                        <small class="text-muted">Periodo: ${period.periodKey}</small>
                    </div>
                </td>
                <td class="align-middle">
                    <span class="badge-system badge-tlh">
                        <i data-lucide="check-circle-2" class="icon-xs"></i>
                        TELEATIENDO (TLH)
                    </span>
                </td>
                ${modalidades.map(m => {
                    const count = period.tlh[m.key] || 0;
                    grandTotalsTLH[m.key] += count;
                    return `<td class="text-center ${count > 0 ? 'fw-bold text-primary cell-active' : 'text-muted-light'}">${count > 0 ? count : '-'}</td>`;
                }).join('')}
                <td class="text-center fw-bold bg-subtle-primary text-primary align-middle">${period.tlh.total}</td>
            `;
            tbody.appendChild(trTLH);

            // Fila OTROS SISTEMAS
            const trOtros = document.createElement("tr");
            trOtros.className = "period-row-otros";
            trOtros.innerHTML = `
                <td class="align-middle">
                    <span class="badge-system badge-otros">
                        <i data-lucide="shuffle" class="icon-xs"></i>
                        OTROS SISTEMAS
                    </span>
                </td>
                ${modalidades.map(m => {
                    const count = period.otros[m.key] || 0;
                    grandTotalsOtros[m.key] += count;
                    return `<td class="text-center ${count > 0 ? 'fw-bold text-warning-dark cell-active' : 'text-muted-light'}">${count > 0 ? count : '-'}</td>`;
                }).join('')}
                <td class="text-center fw-bold bg-subtle-warning text-warning-dark align-middle">${period.otros.total}</td>
            `;
            tbody.appendChild(trOtros);

            // Fila Subtotal del Periodo
            const trSub = document.createElement("tr");
            trSub.className = "period-subtotal-row";
            trSub.innerHTML = `
                <td colspan="2" class="text-end fw-bold text-muted">
                    SUBTOTAL ${period.mesNombre.toUpperCase()} ${period.anio}:
                </td>
                ${modalidades.map(m => {
                    const sub = (period.tlh[m.key] || 0) + (period.otros[m.key] || 0);
                    return `<td class="text-center fw-bold text-dark">${sub > 0 ? sub : '-'}</td>`;
                }).join('')}
                <td class="text-center fw-bold bg-highlight text-dark">${period.totalPeriodo}</td>
            `;
            tbody.appendChild(trSub);
        });

        // Fila Total Acumulado en el TFOOT
        tfoot.innerHTML = `
            <tr class="general-total-tlh-row">
                <td colspan="2" class="fw-bold text-primary">TOTAL ACUMULADO TELEATIENDO (TLH)</td>
                ${modalidades.map(m => `<td class="text-center fw-bold text-primary">${grandTotalsTLH[m.key] || '-'}</td>`).join('')}
                <td class="text-center fw-bold bg-primary text-white">${report.info.totalTLH}</td>
            </tr>
            <tr class="general-total-otros-row">
                <td colspan="2" class="fw-bold text-warning-dark">TOTAL ACUMULADO OTROS SISTEMAS</td>
                ${modalidades.map(m => `<td class="text-center fw-bold text-warning-dark">${grandTotalsOtros[m.key] || '-'}</td>`).join('')}
                <td class="text-center fw-bold bg-warning text-dark">${report.info.totalOtros}</td>
            </tr>
            <tr class="general-grand-total-row">
                <td colspan="2" class="fw-bold text-dark fs-6">TOTAL GENERAL DE ATENCIONES</td>
                ${modalidades.map(m => {
                    const grand = (grandTotalsTLH[m.key] || 0) + (grandTotalsOtros[m.key] || 0);
                    return `<td class="text-center fw-bold text-dark fs-6">${grand || '-'}</td>`;
                }).join('')}
                <td class="text-center fw-bold bg-dark text-white fs-6">${report.info.totalAtenciones}</td>
            </tr>
        `;

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Rellena la plantilla de impresión oficial de constancia de atenciones
     */
    populatePrintCertificate(report) {
        const certEl = document.getElementById("print-certificate-content");
        if (!certEl) return;

        const info = report.info;
        const printDate = new Date().toLocaleDateString("es-PE", { year: 'numeric', month: 'long', day: 'numeric' });

        let matrixRowsHtml = "";
        report.periods.forEach(p => {
            matrixRowsHtml += `
                <tr>
                    <td rowspan="2" class="text-center font-bold" style="vertical-align: middle;">${p.mesNombre} ${p.anio}</td>
                    <td class="font-semibold text-blue">TELEATIENDO (TLH)</td>
                    ${report.modalidades.map(m => `<td class="text-center">${p.tlh[m.key] || '-'}</td>`).join('')}
                    <td class="text-center font-bold text-blue">${p.tlh.total}</td>
                </tr>
                <tr>
                    <td class="font-semibold text-orange">OTROS SISTEMAS</td>
                    ${report.modalidades.map(m => `<td class="text-center">${p.otros[m.key] || '-'}</td>`).join('')}
                    <td class="text-center font-bold text-orange">${p.otros.total}</td>
                </tr>
            `;
        });

        certEl.innerHTML = `
            <div class="cert-header">
                <div class="cert-logo-box">
                    <h2>RED DE SALUD - UNIDAD DE TELESALUD</h2>
                    <p>SISTEMA INTEGRAL DE REGISTRO Y CONSOLIDACIÓN DE ATENCIONES</p>
                </div>
                <div class="cert-code">
                    <span>CONSTANCIA DE PRODUCCIÓN</span>
                    <small>N° ${info.numeroDocumento}-${new Date().getFullYear()}</small>
                </div>
            </div>

            <div class="cert-body">
                <p class="cert-intro">
                    La Unidad de Telesalud hace constar que el/la profesional de la salud cuyos datos se detallan a continuación, 
                    registra la siguiente producción y actividades asistenciales en las plataformas de Teleatiendo y sistemas asociados:
                </p>

                <table class="cert-info-table">
                    <tr>
                        <td class="label">APELLIDOS Y NOMBRES:</td>
                        <td class="val font-bold">${info.nombre}</td>
                        <td class="label">N° DOCUMENTO:</td>
                        <td class="val font-bold">${info.numeroDocumento}</td>
                    </tr>
                    <tr>
                        <td class="label">PROFESIÓN:</td>
                        <td class="val">${info.profesion}</td>
                        <td class="label">COLEGIO PROFESIONAL:</td>
                        <td class="val">${info.colegio}</td>
                    </tr>
                    <tr>
                        <td class="label">MICRORED:</td>
                        <td class="val">${info.microred}</td>
                        <td class="label">ESTABLECIMIENTO:</td>
                        <td class="val font-bold">${info.establecimiento}</td>
                    </tr>
                </table>

                <h4 class="cert-section-title">DETALLE CONSOLIDADO POR MODALIDAD DE TELESALUD</h4>

                <table class="cert-matrix-table">
                    <thead>
                        <tr>
                            <th>Periodo</th>
                            <th>Plataforma</th>
                            ${report.modalidades.map(m => `<th>${m.label}</th>`).join('')}
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matrixRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr class="cert-grand-total">
                            <td colspan="2" class="font-bold">TOTAL GENERAL ACUMULADO</td>
                            ${report.modalidades.map(m => {
                                let sum = 0;
                                report.periods.forEach(p => sum += (p.tlh[m.key] || 0) + (p.otros[m.key] || 0));
                                return `<td class="text-center font-bold">${sum}</td>`;
                            }).join('')}
                            <td class="text-center font-bold text-large">${info.totalAtenciones}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="cert-summary-box">
                    <div class="summary-item">
                        <span>Total Teleatiendo (TLH):</span>
                        <strong>${info.totalTLH} (${info.porcentajeTLH}%)</strong>
                    </div>
                    <div class="summary-item">
                        <span>Total Otros Sistemas:</span>
                        <strong>${info.totalOtros} (${info.porcentajeOtros}%)</strong>
                    </div>
                    <div class="summary-item total">
                        <span>Total Atenciones Certificadas:</span>
                        <strong>${info.totalAtenciones}</strong>
                    </div>
                </div>

                <div class="cert-footer-signature">
                    <div class="cert-date">Expedido el ${printDate}</div>
                    <div class="cert-signature-line">
                        <div class="line"></div>
                        <p>RESPONSABLE DE TELESALUD</p>
                        <small>Coordinación de Telesalud y Telemedicina</small>
                    </div>
                </div>
            </div>
        `;
    }
}

window.publicView = new PublicView();
