/**
 * Data Engine - Motor de Procesamiento, Agregaciones y Consultas de Telesalud
 */
class DataEngine {
    /**
     * Normaliza un texto para comparaciones seguras
     */
    cleanText(val) {
        if (val === null || val === undefined) return "";
        return String(val).trim();
    }

    /**
     * Remueve acentos y tildes para comparaciones normalizadas
     */
    stripAccents(str) {
        if (!str) return "";
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    }

    /**
     * Determina si un registro corresponde a la plataforma TELEATIENDO (TLH)
     */
    isTeleatiendo(lote) {
        if (!lote) return false;
        const cleanLote = String(lote).trim().toUpperCase();
        return cleanLote.includes("TLH");
    }

    /**
     * Normaliza y agrupa la descripción de la actividad
     */
    normalizeCategory(item) {
        if (!item) return "OTROS";
        const clean = String(item).trim().toUpperCase();
        
        if (clean.includes("CONSULTA") && !clean.includes("INTERCONSULTA")) return "TELECONSULTA";
        if (clean.includes("MONITOREO")) return "TELEMONITOREO";
        if (clean.includes("ORIENTACI")) return "TELEORIENTACION";
        if (clean.includes("INTERCONSULTA") || clean.includes("INTECONSULTA")) return "TELEINTERCONSULTA";
        if (clean.includes("MAMOGRAF")) return "TELEMAMOGRAFIA";
        return "OTROS";
    }

    /**
     * Aplica filtros a la colección de datos
     */
    applyFilters(records, filters = {}) {
        if (!records || !Array.isArray(records)) return [];

        return records.filter(r => {
            if (filters.anio && String(r.Anio) !== String(filters.anio)) return false;
            if (filters.mes && String(r.Mes) !== String(filters.mes)) return false;
            if (filters.microred && String(r.MicroRed).toUpperCase() !== String(filters.microred).toUpperCase()) return false;
            if (filters.establecimiento && String(r.Nombre_Establecimiento).toUpperCase() !== String(filters.establecimiento).toUpperCase()) return false;
            if (filters.profesion && String(r.Descripcion_Profesion).toUpperCase() !== String(filters.profesion).toUpperCase()) return false;
            if (filters.sistema) {
                const isTLH = this.isTeleatiendo(r.Lote);
                if (filters.sistema === "TLH" && !isTLH) return false;
                if (filters.sistema === "OTROS" && isTLH) return false;
            }
            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                const personal = (r.Personal || "").toLowerCase();
                const dni = String(r.Numero_Documento_Personal || "").toLowerCase();
                const estab = (r.Nombre_Establecimiento || "").toLowerCase();
                const micro = (r.MicroRed || "").toLowerCase();
                if (!personal.includes(q) && !dni.includes(q) && !estab.includes(q) && !micro.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Genera el Resumen Consolidado (Lógica idéntica a la hoja 'consolidado' de Excel)
     */
    getConsolidadoSummary(records) {
        const categories = {
            "TELECONSULTA": { label: "TELECONSULTA", teleatiendo: 0, otros: 0, total: 0 },
            "TELEMONITOREO": { label: "TELEMONITOREO", teleatiendo: 0, otros: 0, total: 0 },
            "TELEORIENTACION": { label: "TELEORIENTACION", teleatiendo: 0, otros: 0, total: 0 },
            "TELEINTERCONSULTA": { label: "TELINTECONSULTA", teleatiendo: 0, otros: 0, total: 0 },
            "TELEMAMOGRAFIA": { label: "TELEMAMOGRAFIA", teleatiendo: 0, otros: 0, total: 0 }
        };

        let grandTeleatiendo = 0;
        let grandOtros = 0;
        let grandTotal = 0;

        records.forEach(r => {
            const cat = this.normalizeCategory(r.Descripcion_Item);
            const isTLH = this.isTeleatiendo(r.Lote);

            if (categories[cat]) {
                if (isTLH) {
                    categories[cat].teleatiendo++;
                    grandTeleatiendo++;
                } else {
                    categories[cat].otros++;
                    grandOtros++;
                }
                categories[cat].total++;
                grandTotal++;
            }
        });

        const rows = Object.values(categories).map(item => ({
            ...item,
            porcentaje: grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : 0,
            porcentajeTLH: item.total > 0 ? ((item.teleatiendo / item.total) * 100).toFixed(1) : 0
        }));

        return {
            rows,
            totals: {
                teleatiendo: grandTeleatiendo,
                otros: grandOtros,
                total: grandTotal,
                porcentajeTLH: grandTotal > 0 ? ((grandTeleatiendo / grandTotal) * 100).toFixed(1) : 0,
                porcentajeOtros: grandTotal > 0 ? ((grandOtros / grandTotal) * 100).toFixed(1) : 0
            }
        };
    }

    /**
     * Genera la Tabla Dinámica por MicroRed y Establecimiento (Hoja 'TABLA' de Excel)
     */
    getPivotTable(records) {
        // Modalidades específicas de la hoja TABLA
        const itemColumns = [
            "TELEMONITOREO",
            "TELEORIENTACIÓN SÍNCRONA",
            "TELEINTERCONSULTA SÍNCRONA",
            "TELEINTERCONSULTA ASÍNCRONA",
            "TELECONSULTA EN LÍNEA",
            "TELEORIENTACIÓN ASÍNCRONA",
            "TELEMAMOGRAFÍA FUERA DE LÍNEA"
        ];

        const tree = {};
        const microredTotals = {};
        const generalTotals = { total: 0 };
        itemColumns.forEach(col => generalTotals[col] = 0);

        records.forEach(r => {
            const micro = this.cleanText(r.MicroRed) || "SIN MICRORED";
            const estab = this.cleanText(r.Nombre_Establecimiento) || "NO ESPECIFICADO";
            const item = this.cleanText(r.Descripcion_Item);

            if (!tree[micro]) {
                tree[micro] = {};
                microredTotals[micro] = { total: 0 };
                itemColumns.forEach(col => microredTotals[micro][col] = 0);
            }

            if (!tree[micro][estab]) {
                tree[micro][estab] = { total: 0, teleatiendo: 0, otros: 0 };
                itemColumns.forEach(col => tree[micro][estab][col] = 0);
            }

            const isTLH = this.isTeleatiendo(r.Lote);
            if (isTLH) {
                tree[micro][estab].teleatiendo++;
            } else {
                tree[micro][estab].otros++;
            }

            // Mapear al nombre exacto de columna
            let matchedCol = null;
            const normItem = this.stripAccents(item);
            for (const col of itemColumns) {
                if (normItem.includes(this.stripAccents(col))) {
                    matchedCol = col;
                    break;
                }
            }

            if (matchedCol) {
                tree[micro][estab][matchedCol]++;
                microredTotals[micro][matchedCol]++;
                generalTotals[matchedCol]++;
            }

            tree[micro][estab].total++;
            microredTotals[micro].total++;
            generalTotals.total++;
        });

        return {
            tree,
            microredTotals,
            generalTotals,
            columns: itemColumns
        };
    }

    /**
     * Búsqueda y reporte individual para el Personal de Salud (DNI / Carnet Extranjería)
     */
    getPersonalReport(records, docNumber) {
        if (!docNumber || !records) return null;
        
        const cleanDoc = String(docNumber).trim().toUpperCase();
        
        // Filtrar registros que pertenezcan a este documento de personal
        const personalRecords = records.filter(r => {
            const doc = String(r.Numero_Documento_Personal || "").trim().toUpperCase();
            return doc === cleanDoc;
        });

        if (personalRecords.length === 0) return null;

        // Extraer metadatos más recientes del personal
        const sample = personalRecords[0];
        const info = {
            numeroDocumento: cleanDoc,
            nombre: sample.Personal || "No Registrado",
            profesion: sample.Descripcion_Profesion || "No Especificado",
            colegio: sample.Descripcion_Colegio || "No Especificado",
            condicion: sample.Descripcion_Condicion || "No Especificado",
            microred: sample.MicroRed || "No Especificado",
            establecimiento: sample.Nombre_Establecimiento || "No Especificado",
            red: sample.Red || "CUSCO SUR",
            totalAtenciones: personalRecords.length
        };

        // Modalidades oficiales
        const modalidadesKeys = CONFIG.MODALIDADES.map(m => m.key);

        // Agrupar por Periodo (Año - Mes) y Sistema (Teleatiendo vs Otros)
        const periodGroups = {};
        let totalTLH = 0;
        let totalOtros = 0;

        personalRecords.forEach(r => {
            const anio = r.Anio || "2026";
            const mesNum = String(r.Mes || "1");
            const mesNombre = CONFIG.MESES_NOMBRES[mesNum] || `Mes ${mesNum}`;
            const periodKey = `${anio}-${String(mesNum).padStart(2, "0")}`;
            const isTLH = this.isTeleatiendo(r.Lote);
            const itemDesc = this.cleanText(r.Descripcion_Item).toUpperCase();

            if (!periodGroups[periodKey]) {
                periodGroups[periodKey] = {
                    periodKey,
                    anio,
                    mesNum,
                    mesNombre,
                    tlh: { total: 0 },
                    otros: { total: 0 },
                    totalPeriodo: 0
                };
                modalidadesKeys.forEach(k => {
                    periodGroups[periodKey].tlh[k] = 0;
                    periodGroups[periodKey].otros[k] = 0;
                });
            }

            // Identificar columna correspondiente
            const normDesc = this.stripAccents(itemDesc);
            let matchedKey = modalidadesKeys.find(k => normDesc.includes(this.stripAccents(k))) || "TELEMONITOREO";

            if (isTLH) {
                periodGroups[periodKey].tlh[matchedKey]++;
                periodGroups[periodKey].tlh.total++;
                totalTLH++;
            } else {
                periodGroups[periodKey].otros[matchedKey]++;
                periodGroups[periodKey].otros.total++;
                totalOtros++;
            }

            periodGroups[periodKey].totalPeriodo++;
        });

        // Ordenar periodos de forma descendente
        const sortedPeriods = Object.values(periodGroups).sort((a, b) => b.periodKey.localeCompare(a.periodKey));

        return {
            info: {
                ...info,
                totalTLH,
                totalOtros,
                porcentajeTLH: info.totalAtenciones > 0 ? ((totalTLH / info.totalAtenciones) * 100).toFixed(1) : 0,
                porcentajeOtros: info.totalAtenciones > 0 ? ((totalOtros / info.totalAtenciones) * 100).toFixed(1) : 0
            },
            periods: sortedPeriods,
            modalidades: CONFIG.MODALIDADES,
            rawRecords: personalRecords
        };
    }

    /**
     * Datos para los gráficos del Dashboard de Administración
     */
    getAnalyticsData(records) {
        // 1. Teleatiendo vs Otros
        let tlhCount = 0;
        let otrosCount = 0;

        // 2. Top Establecimientos
        const estabCounts = {};

        // 3. Distribución por Profesión
        const profCounts = {};

        // 4. Modalidades distribución
        const modCounts = {};

        // 5. Evolución temporal
        const timeCounts = {};

        records.forEach(r => {
            const isTLH = this.isTeleatiendo(r.Lote);
            if (isTLH) tlhCount++; else otrosCount++;

            const estab = this.cleanText(r.Nombre_Establecimiento) || "OTROS";
            estabCounts[estab] = (estabCounts[estab] || 0) + 1;

            const prof = this.cleanText(r.Descripcion_Profesion) || "NO ESPECIFICADO";
            profCounts[prof] = (profCounts[prof] || 0) + 1;

            const cat = this.normalizeCategory(r.Descripcion_Item);
            modCounts[cat] = (modCounts[cat] || 0) + 1;

            const mes = r.Mes ? (CONFIG.MESES_NOMBRES[String(r.Mes)] || `Mes ${r.Mes}`) : "Julio";
            timeCounts[mes] = (timeCounts[mes] || 0) + 1;
        });

        // Top 10 Establecimientos
        const topEstablecimientos = Object.entries(estabCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Top Profesiones
        const topProfesiones = Object.entries(profCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([name, count]) => ({ name, count }));

        return {
            teleatiendoVsOtros: {
                labels: ["Teleatiendo (TLH)", "Otros Sistemas"],
                series: [tlhCount, otrosCount]
            },
            topEstablecimientos,
            topProfesiones,
            distribucionModalidad: {
                labels: Object.keys(modCounts),
                series: Object.values(modCounts)
            },
            evolucionTemporal: {
                categories: Object.keys(timeCounts),
                data: Object.values(timeCounts)
            }
        };
    }

    /**
     * Extrae listas únicas para llenar los controles desplegables (filtros)
     */
    getFilterOptions(records) {
        const anios = new Set();
        const meses = new Set();
        const microredes = new Set();
        const establecimientos = new Set();
        const profesiones = new Set();

        records.forEach(r => {
            if (r.Anio) anios.add(String(r.Anio));
            if (r.Mes) meses.add(String(r.Mes));
            if (r.MicroRed) microredes.add(this.cleanText(r.MicroRed));
            if (r.Nombre_Establecimiento) establecimientos.add(this.cleanText(r.Nombre_Establecimiento));
            if (r.Descripcion_Profesion) profesiones.add(this.cleanText(r.Descripcion_Profesion));
        });

        return {
            anios: Array.from(anios).sort().reverse(),
            meses: Array.from(meses).sort((a, b) => Number(a) - Number(b)),
            microredes: Array.from(microredes).sort(),
            establecimientos: Array.from(establecimientos).sort(),
            profesiones: Array.from(profesiones).sort()
        };
    }
}

window.dataEngine = new DataEngine();
