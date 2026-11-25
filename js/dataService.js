/**
 * Data Service - Conector con Google Sheets y Gestión de Caché Local
 */
class DataService {
    constructor() {
        this.cacheKey = CONFIG.STORAGE_KEYS.CACHED_DATA;
        this.timeKey = CONFIG.STORAGE_KEYS.CACHE_TIME;
        this.urlKey = CONFIG.STORAGE_KEYS.SHEET_URL;
    }

    /**
     * Obtiene la URL configurada de Google Sheets
     */
    getSheetUrl() {
        return localStorage.getItem(this.urlKey) || CONFIG.DEFAULT_SHEET_URL || "";
    }

    /**
     * Guarda una nueva URL de Google Sheets
     */
    setSheetUrl(url) {
        if (url) {
            localStorage.setItem(this.urlKey, url.trim());
        } else {
            localStorage.removeItem(this.urlKey);
        }
    }

    /**
     * Carga los datos: Primero intenta desde Google Sheets, luego caché local, y finalmente dataset integrado
     */
    async loadData(forceRefresh = false) {
        const sheetUrl = this.getSheetUrl();

        // Si tenemos URL de Google Sheets y no estamos forzando o no hay caché reciente
        if (sheetUrl && sheetUrl.startsWith("http")) {
            try {
                const liveData = await this.fetchFromGoogleSheets(sheetUrl);
                if (liveData && liveData.length > 0) {
                    this.saveToCache(liveData);
                    return { data: liveData, source: "google_sheets", timestamp: new Date() };
                }
            } catch (err) {
                console.warn("No se pudo cargar desde Google Sheets en vivo:", err);
            }
        }

        // Si no hay Google Sheets o falló, buscar en caché local
        if (!forceRefresh) {
            const cached = this.loadFromCache();
            if (cached && cached.data && cached.data.length > 0) {
                return { data: cached.data, source: "cache", timestamp: new Date(cached.timestamp) };
            }
        }

        // Fallback al dataset local incrustado
        if (window.DEFAULT_DATASET && window.DEFAULT_DATASET.length > 0) {
            return { data: window.DEFAULT_DATASET, source: "local_default", timestamp: new Date() };
        }

        throw new Error("No se encontraron datos disponibles. Configure la URL de Google Sheets.");
    }

    /**
     * Descarga y procesa el CSV publicado de Google Sheets
     */
    async fetchFromGoogleSheets(url) {
        // Asegurar que la URL pida formato CSV si es enlace de Google Sheets
        let fetchUrl = url;
        if (fetchUrl.includes("docs.google.com/spreadsheets") && !fetchUrl.includes("output=csv") && !fetchUrl.includes("format=csv")) {
            if (fetchUrl.includes("pubhtml")) {
                fetchUrl = fetchUrl.replace("pubhtml", "pub?output=csv");
            } else if (fetchUrl.includes("/edit")) {
                fetchUrl = fetchUrl.split("/edit")[0] + "/export?format=csv";
            }
        }

        const response = await fetch(fetchUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} al obtener datos de Google Sheets`);
        }

        const csvText = await response.text();
        return this.parseCSV(csvText);
    }

    /**
     * Parsea texto CSV usando PapaParse
     */
    parseCSV(csvText) {
        return new Promise((resolve, reject) => {
            if (typeof Papa === "undefined") {
                reject(new Error("La librería PapaParse no está cargada."));
                return;
            }

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        // Limpiar y normalizar encabezados y textos corruptos (? -> Ñ)
                        const cleanedData = results.data.map(row => {
                            const cleanedRow = {};
                            Object.keys(row).forEach(key => {
                                const cleanKey = key.trim();
                                const val = row[key];
                                cleanedRow[cleanKey] = (typeof val === "string" && window.dataEngine)
                                    ? window.dataEngine.fixSpanishEncoding(val.trim())
                                    : val;
                            });
                            return cleanedRow;
                        });
                        resolve(cleanedData);
                    } else {
                        reject(new Error("El archivo CSV no contiene registros válidos."));
                    }
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }

    /**
     * Guarda los datos en el localStorage del navegador
     */
    saveToCache(data) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
            localStorage.setItem(this.timeKey, new Date().toISOString());
        } catch (e) {
            console.warn("No se pudo guardar en localStorage (tamaño excedido o modo privado)", e);
        }
    }

    /**
     * Carga los datos almacenados en caché
     */
    loadFromCache() {
        try {
            const raw = localStorage.getItem(this.cacheKey);
            const time = localStorage.getItem(this.timeKey);
            if (raw) {
                return {
                    data: JSON.parse(raw),
                    timestamp: time || new Date().toISOString()
                };
            }
        } catch (e) {
            console.warn("Error leyendo caché local:", e);
        }
        return null;
    }
}

window.dataService = new DataService();
