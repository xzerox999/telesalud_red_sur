/**
 * Export Service - Generación de Archivos Excel con Formato Profesional y Estilos
 * Rol: Senior Software Engineer & Excel Architecture Specialist
 */
class ExportService {
    constructor() {
        // Paleta de Estilos Oficial de Telesalud MINSA / Red de Salud
        this.STYLES = {
            bannerMain: {
                fill: { fgColor: { rgb: "0F2942" } },
                font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            bannerSub: {
                fill: { fgColor: { rgb: "1E3A8A" } },
                font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "BAE6FD" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            bannerMeta: {
                fill: { fgColor: { rgb: "F1F5F9" } },
                font: { name: "Calibri", sz: 9, italic: true, color: { rgb: "475569" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    bottom: { style: "medium", color: { rgb: "0284C7" } }
                }
            },
            tableHeader: {
                fill: { fgColor: { rgb: "0369A1" } },
                font: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "medium", color: { rgb: "024E76" } },
                    bottom: { style: "medium", color: { rgb: "024E76" } },
                    left: { style: "thin", color: { rgb: "0284C7" } },
                    right: { style: "thin", color: { rgb: "0284C7" } }
                }
            },
            tableHeaderAlt: {
                fill: { fgColor: { rgb: "0284C7" } },
                font: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "medium", color: { rgb: "024E76" } },
                    bottom: { style: "medium", color: { rgb: "024E76" } },
                    left: { style: "thin", color: { rgb: "024E76" } },
                    right: { style: "thin", color: { rgb: "024E76" } }
                }
            },
            cellTextLeft: {
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            cellTextLeftZebra: {
                fill: { fgColor: { rgb: "F8FAFC" } },
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            cellTextCenter: {
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            cellTextCenterZebra: {
                fill: { fgColor: { rgb: "F8FAFC" } },
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            cellNumber: {
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "right", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            cellNumberZebra: {
                fill: { fgColor: { rgb: "F8FAFC" } },
                font: { name: "Calibri", sz: 10, color: { rgb: "1E293B" } },
                alignment: { horizontal: "right", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            },
            subtotalLabel: {
                fill: { fgColor: { rgb: "E0F2FE" } },
                font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0369A1" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "0284C7" } },
                    bottom: { style: "medium", color: { rgb: "0284C7" } },
                    left: { style: "thin", color: { rgb: "BAE6FD" } },
                    right: { style: "thin", color: { rgb: "BAE6FD" } }
                }
            },
            subtotalNumber: {
                fill: { fgColor: { rgb: "E0F2FE" } },
                font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0369A1" } },
                alignment: { horizontal: "right", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "0284C7" } },
                    bottom: { style: "medium", color: { rgb: "0284C7" } },
                    left: { style: "thin", color: { rgb: "BAE6FD" } },
                    right: { style: "thin", color: { rgb: "BAE6FD" } }
                }
            },
            grandTotalLabel: {
                fill: { fgColor: { rgb: "0F172A" } },
                font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "medium", color: { rgb: "38BDF8" } },
                    bottom: { style: "double", color: { rgb: "38BDF8" } },
                    left: { style: "thin", color: { rgb: "1E293B" } },
                    right: { style: "thin", color: { rgb: "1E293B" } }
                }
            },
            grandTotalNumber: {
                fill: { fgColor: { rgb: "0F172A" } },
                font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "right", vertical: "center" },
                border: {
                    top: { style: "medium", color: { rgb: "38BDF8" } },
                    bottom: { style: "double", color: { rgb: "38BDF8" } },
                    left: { style: "thin", color: { rgb: "1E293B" } },
                    right: { style: "thin", color: { rgb: "1E293B" } }
                }
            }
        };
    }

    /**
     * Aplica estilo de forma segura a una celda
     */
    styleCell(ws, cellRef, style) {
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        ws[cellRef].s = style;
    }

    /**
     * 1. EXCEL TABLA DINÁMICA POR MICRORED Y ESTABLECIMIENTO
     */
    exportPivotToExcel(pivotData, filterSummary = "Todos") {
        if (typeof XLSX === "undefined") {
            alert("La librería de Excel aún no se ha cargado.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const headers = ["MicroRed", "Establecimiento de Salud", ...pivotData.columns, "Total General"];
        const totalCols = headers.length;

        const rows = [
            [CONFIG.INSTITUTION],
            ["REPORTE DINÁMICO DE PRODUCCIÓN DE TELESALUD POR MICRORED Y ESTABLECIMIENTO"],
            [`Filtros aplicados: ${filterSummary}  |  Fecha de Generación: ${new Date().toLocaleString("es-PE")}`],
            [], // Espacio visual
            headers
        ];

        const rowTypes = ["banner1", "banner2", "banner3", "space", "header"];

        // Rellenar datos agrupados por MicroRed
        Object.keys(pivotData.tree).sort().forEach(micro => {
            const estabs = pivotData.tree[micro];
            let isZebra = false;

            Object.keys(estabs).sort().forEach(estab => {
                const rowObj = estabs[estab];
                const row = [micro, estab];
                pivotData.columns.forEach(col => {
                    row.push(rowObj[col] || 0);
                });
                row.push(rowObj.total || 0);
                rows.push(row);
                rowTypes.push(isZebra ? "dataZebra" : "data");
                isZebra = !isZebra;
            });

            // Fila Subtotal MicroRed
            const subtotalRow = [`SUBTOTAL MICRORED: ${micro}`, ""];
            pivotData.columns.forEach(col => {
                subtotalRow.push(pivotData.microredTotals[micro][col] || 0);
            });
            subtotalRow.push(pivotData.microredTotals[micro].total || 0);
            rows.push(subtotalRow);
            rowTypes.push("subtotal");
        });

        // Fila Total General
        const totalRow = ["TOTAL GENERAL RED DE SALUD", ""];
        pivotData.columns.forEach(col => {
            totalRow.push(pivotData.generalTotals[col] || 0);
        });
        totalRow.push(pivotData.generalTotals.total || 0);
        rows.push(totalRow);
        rowTypes.push("grandTotal");

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Configurar Merges (Combinación de Celdas en Banners y Subtotales)
        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }
        ];

        // Aplicar estilos celda por celda
        for (let r = 0; r < rows.length; r++) {
            const type = rowTypes[r];
            const numCols = rows[r].length;

            if (type === "banner1") {
                for (let c = 0; c < totalCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, this.STYLES.bannerMain);
                }
            } else if (type === "banner2") {
                for (let c = 0; c < totalCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, this.STYLES.bannerSub);
                }
            } else if (type === "banner3") {
                for (let c = 0; c < totalCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, this.STYLES.bannerMeta);
                }
            } else if (type === "header") {
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, c === numCols - 1 ? this.STYLES.tableHeaderAlt : this.STYLES.tableHeader);
                }
            } else if (type === "data" || type === "dataZebra") {
                const isZ = type === "dataZebra";
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    if (c < 2) {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellTextLeftZebra : this.STYLES.cellTextLeft);
                    } else {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellNumberZebra : this.STYLES.cellNumber);
                    }
                }
            } else if (type === "subtotal") {
                merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, c < 2 ? this.STYLES.subtotalLabel : this.STYLES.subtotalNumber);
                }
            } else if (type === "grandTotal") {
                merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, c < 2 ? this.STYLES.grandTotalLabel : this.STYLES.grandTotalNumber);
                }
            }
        }

        ws["!merges"] = merges;

        // Anchos de columna automáticos y generosos
        ws["!cols"] = [
            { wch: 24 }, // Microred
            { wch: 32 }, // Establecimiento
            { wch: 18 }, // Telemonitoreo
            { wch: 25 }, // Teleorientacion sincrona
            { wch: 25 }, // Teleinterconsulta sincrona
            { wch: 25 }, // Teleinterconsulta asincrona
            { wch: 22 }, // Teleconsulta en linea
            { wch: 25 }, // Teleorientacion asincrona
            { wch: 28 }, // Telemamografia
            { wch: 18 }  // Total General
        ];

        // Altura de filas
        ws["!rows"] = [
            { hpt: 26 }, // Banner 1
            { hpt: 22 }, // Banner 2
            { hpt: 18 }, // Banner 3
            { hpt: 10 }, // Espacio
            { hpt: 30 }  // Encabezado
        ];

        // Activar cuadrículas visibles en Excel
        ws["!views"] = [{ showGridLines: true }];

        XLSX.utils.book_append_sheet(wb, ws, "Tabla_MicroRed");
        const filename = `Reporte_Telesalud_Microred_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    /**
     * 2. EXCEL RESUMEN CONSOLIDADO DE ACTIVIDADES
     */
    exportConsolidadoToExcel(summaryData) {
        if (typeof XLSX === "undefined") {
            alert("La librería de Excel aún no se ha cargado.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const headers = ["ACTIVIDAD / MODALIDAD", "TELEATIENDO (TLH)", "OTROS SISTEMAS", "TOTAL GENERAL", "% PARTICIPACIÓN", "% TELEATIENDO"];
        const totalCols = headers.length;

        const rows = [
            [CONFIG.INSTITUTION],
            ["RESUMEN CONSOLIDADO EJECUTIVO DE ACTIVIDADES DE TELESALUD"],
            [`Fecha de Reporte: ${new Date().toLocaleString("es-PE")}  |  Consolidado Oficial`],
            [], // Espacio
            headers
        ];

        const rowTypes = ["banner1", "banner2", "banner3", "space", "header"];
        let isZebra = false;

        summaryData.rows.forEach(r => {
            rows.push([
                r.label,
                r.teleatiendo,
                r.otros,
                r.total,
                `${r.porcentaje}%`,
                `${r.porcentajeTLH}%`
            ]);
            rowTypes.push(isZebra ? "dataZebra" : "data");
            isZebra = !isZebra;
        });

        // Fila Total General
        rows.push([
            "TOTAL GENERAL ACUMULADO",
            summaryData.totals.teleatiendo,
            summaryData.totals.otros,
            summaryData.totals.total,
            "100.0%",
            `${summaryData.totals.porcentajeTLH}%`
        ]);
        rowTypes.push("grandTotal");

        const ws = XLSX.utils.aoa_to_sheet(rows);

        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }
        ];

        for (let r = 0; r < rows.length; r++) {
            const type = rowTypes[r];
            const numCols = rows[r].length;

            if (type === "banner1") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerMain);
            } else if (type === "banner2") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerSub);
            } else if (type === "banner3") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerMeta);
            } else if (type === "header") {
                for (let c = 0; c < numCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.tableHeader);
            } else if (type === "data" || type === "dataZebra") {
                const isZ = type === "dataZebra";
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    if (c === 0) {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellTextLeftZebra : this.STYLES.cellTextLeft);
                    } else if (c >= 1 && c <= 3) {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellNumberZebra : this.STYLES.cellNumber);
                    } else {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellTextCenterZebra : this.STYLES.cellTextCenter);
                    }
                }
            } else if (type === "grandTotal") {
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    this.styleCell(ws, ref, c === 0 ? this.STYLES.grandTotalLabel : this.STYLES.grandTotalNumber);
                }
            }
        }

        ws["!merges"] = merges;
        ws["!cols"] = [
            { wch: 32 }, // Actividad
            { wch: 22 }, // Teleatiendo
            { wch: 20 }, // Otros
            { wch: 20 }, // Total
            { wch: 20 }, // % Total
            { wch: 20 }  // % TLH
        ];

        ws["!rows"] = [
            { hpt: 26 },
            { hpt: 22 },
            { hpt: 18 },
            { hpt: 10 },
            { hpt: 28 }
        ];

        ws["!views"] = [{ showGridLines: true }];

        XLSX.utils.book_append_sheet(wb, ws, "Consolidado");
        const filename = `Consolidado_Telesalud_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    /**
     * 3. EXCEL PADRÓN NOMINAL COMPLETO (DATOS EN CRUDO DETALLADOS)
     */
    exportNominalRawToExcel(records, filterSummary = "Todos") {
        if (typeof XLSX === "undefined") {
            alert("La librería de Excel aún no se ha cargado.");
            return;
        }

        if (!records || records.length === 0) {
            alert("No hay registros para exportar con los filtros seleccionados.");
            return;
        }

        const wb = XLSX.utils.book_new();

        const headers = [
            "N°",
            "AÑO",
            "MES",
            "DÍA",
            "FECHA ATENCIÓN",
            "RED DE SALUD",
            "MICRORED",
            "ESTABLECIMIENTO (EESS)",
            "CÓDIGO ÚNICO",
            "PERSONAL DE SALUD",
            "DNI / DOC PERSONAL",
            "PROFESIÓN",
            "COLEGIO PROFESIONAL",
            "CONDICIÓN LABORAL",
            "LOTE / SISTEMA",
            "PLATAFORMA",
            "MODALIDAD TELESALUD",
            "CÓDIGO CPT",
            "UPS / ESPECIALIDAD",
            "TURNO",
            "DNI PACIENTE",
            "GÉNERO",
            "EDAD",
            "DIAGNÓSTICOS Y ACTIVIDADES REGISTRADAS",
            "REGISTRADOR"
        ];

        const totalCols = headers.length;

        const rows = [
            [CONFIG.INSTITUTION],
            ["PADRÓN NOMINAL COMPLETO DE ATENCIONES DE TELESALUD - REGISTRO EN CRUDO"],
            [`Filtros: ${filterSummary}  |  Total Registros: ${records.length.toLocaleString()}  |  Generado: ${new Date().toLocaleString("es-PE")}`],
            [], // Espacio
            headers
        ];

        const rowTypes = ["banner1", "banner2", "banner3", "space", "header"];
        let isZebra = false;

        records.forEach((r, idx) => {
            const isTLH = String(r.Lote || "").toUpperCase().includes("TLH");
            const plataforma = isTLH ? "TELEATIENDO (TLH)" : "OTROS SISTEMAS";
            const mesNombre = CONFIG.MESES_NOMBRES[String(r.Mes)] || `Mes ${r.Mes}`;

            rows.push([
                idx + 1,
                r.Anio || "",
                mesNombre,
                r.Dia || "",
                r.Fecha_atencion || "",
                r.Red || "CUSCO SUR",
                r.MicroRed || "",
                r.Nombre_Establecimiento || "",
                r.Codigo_Unico || "",
                r.Personal || "",
                r.Numero_Documento_Personal || "",
                r.Descripcion_Profesion || "",
                r.Descripcion_Colegio || "",
                r.Descripcion_Condicion || "",
                r.Lote || "",
                plataforma,
                r.Descripcion_Item || "",
                r.Codigo_Item || "",
                r.Descripcion_Ups || "",
                r.Id_Turno || "",
                r.Numero_Documento_Paciente || "",
                r.Id_Genero || "",
                r.Edad_Reg ? `${r.Edad_Reg} ${r.Tipo_Edad || 'A'}` : "",
                r.Codigos_Asociados || "",
                r.Registrador || ""
            ]);

            rowTypes.push(isZebra ? "dataZebra" : "data");
            isZebra = !isZebra;
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }
        ];

        // Estilizar banner y encabezados
        for (let r = 0; r < rows.length; r++) {
            const type = rowTypes[r];
            const numCols = rows[r].length;

            if (type === "banner1") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerMain);
            } else if (type === "banner2") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerSub);
            } else if (type === "banner3") {
                for (let c = 0; c < totalCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.bannerMeta);
            } else if (type === "header") {
                for (let c = 0; c < numCols; c++) this.styleCell(ws, XLSX.utils.encode_cell({ r, c }), this.STYLES.tableHeader);
            } else if (type === "data" || type === "dataZebra") {
                const isZ = type === "dataZebra";
                for (let c = 0; c < numCols; c++) {
                    const ref = XLSX.utils.encode_cell({ r, c });
                    // Columnas centradas (Índice, Año, Día, Fecha, DNI, Códigos, Turno, etc.)
                    if ([0, 1, 2, 3, 4, 8, 10, 14, 15, 17, 19, 20, 21, 22].includes(c)) {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellTextCenterZebra : this.STYLES.cellTextCenter);
                    } else {
                        this.styleCell(ws, ref, isZ ? this.STYLES.cellTextLeftZebra : this.STYLES.cellTextLeft);
                    }
                }
            }
        }

        ws["!merges"] = merges;

        // Anchos de columna optimizados para visualización nominal
        ws["!cols"] = [
            { wch: 8 },  // N°
            { wch: 8 },  // Año
            { wch: 14 }, // Mes
            { wch: 6 },  // Día
            { wch: 15 }, // Fecha Atención
            { wch: 16 }, // Red
            { wch: 18 }, // MicroRed
            { wch: 28 }, // Establecimiento
            { wch: 14 }, // Código Único
            { wch: 32 }, // Personal
            { wch: 16 }, // DNI Personal
            { wch: 24 }, // Profesión
            { wch: 32 }, // Colegio
            { wch: 18 }, // Condición
            { wch: 14 }, // Lote
            { wch: 22 }, // Plataforma
            { wch: 30 }, // Modalidad
            { wch: 14 }, // Código Item
            { wch: 22 }, // UPS
            { wch: 8 },  // Turno
            { wch: 16 }, // DNI Paciente
            { wch: 8 },  // Género
            { wch: 10 }, // Edad
            { wch: 65 }, // Diagnósticos y Actividades
            { wch: 30 }  // Registrador
        ];

        ws["!rows"] = [
            { hpt: 26 },
            { hpt: 22 },
            { hpt: 18 },
            { hpt: 10 },
            { hpt: 28 }
        ];

        ws["!views"] = [{ showGridLines: true }];

        XLSX.utils.book_append_sheet(wb, ws, "Padron_Nominal");
        const filename = `Padron_Nominal_Telesalud_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    /**
     * Imprime la constancia/ficha individual del personal
     */
    printPersonalCertificate() {
        window.print();
    }
}

window.exportService = new ExportService();
