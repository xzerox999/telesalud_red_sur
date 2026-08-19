/**
 * Export Service - Generación y descarga de archivos Excel y PDF
 */
class ExportService {
    /**
     * Exporta la Tabla Dinámica de MicroRedes y Establecimientos a Excel (.xlsx)
     */
    exportPivotToExcel(pivotData, filterSummary = "Todos") {
        if (typeof XLSX === "undefined") {
            alert("La librería de Excel (SheetJS) aún no se ha cargado.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const headers = ["MicroRed", "Nombre de Establecimiento", ...pivotData.columns, "Total General"];
        const rows = [];

        // Encabezado del reporte
        rows.push([CONFIG.INSTITUTION]);
        rows.push(["REPORTE DINÁMICO DE ATENCIONES DE TELESALUD"]);
        rows.push([`Filtros aplicados: ${filterSummary}`]);
        rows.push([`Fecha de generación: ${new Date().toLocaleString()}`]);
        rows.push([]); // Espacio

        // Encabezados de columnas
        rows.push(headers);

        // Filas agrupadas
        Object.keys(pivotData.tree).sort().forEach(micro => {
            const estabs = pivotData.tree[micro];
            Object.keys(estabs).sort().forEach(estab => {
                const rowObj = estabs[estab];
                const row = [micro, estab];
                pivotData.columns.forEach(col => {
                    row.push(rowObj[col] || 0);
                });
                row.push(rowObj.total || 0);
                rows.push(row);
            });

            // Subtotal de la MicroRed
            const subtotalRow = [`SUBTOTAL ${micro}`, ""];
            pivotData.columns.forEach(col => {
                subtotalRow.push(pivotData.microredTotals[micro][col] || 0);
            });
            subtotalRow.push(pivotData.microredTotals[micro].total || 0);
            rows.push(subtotalRow);
        });

        // Fila Total General
        const totalRow = ["TOTAL GENERAL", ""];
        pivotData.columns.forEach(col => {
            totalRow.push(pivotData.generalTotals[col] || 0);
        });
        totalRow.push(pivotData.generalTotals.total || 0);
        rows.push(totalRow);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Anchos de columna automáticos
        ws["!cols"] = [
            { wch: 25 },
            { wch: 32 },
            { wch: 18 },
            { wch: 25 },
            { wch: 25 },
            { wch: 25 },
            { wch: 22 },
            { wch: 25 },
            { wch: 28 },
            { wch: 16 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Reporte_Telesalud");
        const filename = `Reporte_Telesalud_Microred_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    /**
     * Exporta el Resumen Consolidado a Excel (.xlsx)
     */
    exportConsolidadoToExcel(summaryData) {
        if (typeof XLSX === "undefined") {
            alert("La librería de Excel (SheetJS) aún no se ha cargado.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const rows = [
            [CONFIG.INSTITUTION],
            ["RESUMEN CONSOLIDADO DE ACTIVIDADES DE TELESALUD"],
            [`Fecha de reporte: ${new Date().toLocaleDateString()}`],
            [],
            ["ACTIVIDAD", "TELEATIENDO (TLH)", "OTROS SISTEMAS", "TOTAL GENERAL", "% DEL TOTAL", "% TELEATIENDO"]
        ];

        summaryData.rows.forEach(r => {
            rows.push([
                r.label,
                r.teleatiendo,
                r.otros,
                r.total,
                `${r.porcentaje}%`,
                `${r.porcentajeTLH}%`
            ]);
        });

        rows.push([
            "TOTAL GENERAL",
            summaryData.totals.teleatiendo,
            summaryData.totals.otros,
            summaryData.totals.total,
            "100%",
            `${summaryData.totals.porcentajeTLH}%`
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws, "Consolidado");
        XLSX.writeFile(wb, `Consolidado_Telesalud_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    /**
     * Imprime la constancia/ficha individual del personal
     */
    printPersonalCertificate() {
        window.print();
    }
}

window.exportService = new ExportService();
