/**
 * Configuración Global del Sistema de Telesalud
 */
const CONFIG = {
    // Título institucional y metadatos
    APP_NAME: "Sistema de Gestión y Consulta de Telesalud",
    INSTITUTION: "RED DE SALUD - UNIDAD DE TELESALUD",
    VERSION: "2.0.0",

    // Contraseña de acceso al Portal Administrador (configurable)
    ADMIN_PASSWORD_DEFAULT: "AdminTelesalud2026*",
    
    // Almacenamiento local de clave
    STORAGE_KEYS: {
        ADMIN_AUTH: "telesalud_admin_auth",
        SHEET_URL: "telesalud_gsheet_csv_url",
        CACHED_DATA: "telesalud_cached_data",
        CACHE_TIME: "telesalud_cache_timestamp",
        THEME: "telesalud_theme",
        CUSTOM_PASSWORD: "telesalud_custom_password"
    },

    // URL por defecto de Google Sheets (Publicado como CSV)
    DEFAULT_SHEET_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTCDPmWCAMpNIAB_JNlfS548Whbh1MCQH_c6HSyfH-pdwGHfc7EcBwki_769iG1GXHXt43JImZYFl7W/pub?gid=0&single=true&output=csv",

    // Modalidades oficiales de Telesalud a monitorear y desplegar
    MODALIDADES: [
        { key: "TELEMONITOREO", label: "Telemonitoreo", icon: "activity", code: "99499.10" },
        { key: "TELEORIENTACIÓN SÍNCRONA", label: "Teleorientación Síncrona", icon: "phone-call", code: "99499.08" },
        { key: "TELEINTERCONSULTA SÍNCRONA", label: "Teleinterconsulta Síncrona", icon: "users", code: "99499.01" },
        { key: "TELEINTERCONSULTA ASÍNCRONA", label: "Teleinterconsulta Asíncrona", icon: "user-check", code: "99499.02" },
        { key: "TELECONSULTA EN LÍNEA", label: "Teleconsulta en Línea", icon: "video", code: "99499.03" },
        { key: "TELEORIENTACIÓN ASÍNCRONA", label: "Teleorientación Asíncrona", icon: "message-square", code: "99499.09" },
        { key: "TELEMAMOGRAFÍA FUERA DE LÍNEA", label: "Telemamografía Fuera de Línea", icon: "file-text", code: "99499.11" }
    ],

    // Categorías generales para el consolidado
    CATEGORIAS_CONSOLIDADO: [
        { key: "TELECONSULTA", label: "TELECONSULTA", match: ["TELECONSULTA", "TELECONSULTA EN LÍNEA"] },
        { key: "TELEMONITOREO", label: "TELEMONITOREO", match: ["TELEMONITOREO"] },
        { key: "TELEORIENTACION", label: "TELEORIENTACION", match: ["TELEORIENTACION", "TELEORIENTACIÓN", "TELEORIENTACIÓN SÍNCRONA", "TELEORIENTACIÓN ASÍNCRONA"] },
        { key: "TELEINTERCONSULTA", label: "TELEINTERCONSULTA", match: ["TELEINTERCONSULTA", "TELINTECONSULTA", "TELEINTERCONSULTA SÍNCRONA", "TELEINTERCONSULTA ASÍNCRONA"] },
        { key: "TELEMAMOGRAFIA", label: "TELEMAMOGRAFIA", match: ["TELEMAMOGRAFIA", "TELEMAMOGRAFÍA", "TELEMAMOGRAFÍA FUERA DE LÍNEA"] }
    ],

    // Nombres de meses en español
    MESES_NOMBRES: {
        "1": "Enero", "2": "Febrero", "3": "Marzo", "4": "Abril",
        "5": "Mayo", "6": "Junio", "7": "Julio", "8": "Agosto",
        "9": "Setiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
    }
};

window.CONFIG = CONFIG;
