@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo   TELESALUD - Servidor Local Automatico
echo ==================================================
echo.
echo Buscando un puerto libre (8080 - 8100)...

set "PORT="
for /L %%P in (8080,1,8100) do (
    if not defined PORT (
        netstat -ano -p tcp | findstr /R /C:":%%P .*LISTENING" >nul 2>&1
        if errorlevel 1 (
            set "PORT=%%P"
        ) else (
            echo   [OCUPADO] Puerto %%P en uso, probando siguiente...
        )
    )
)

if not defined PORT (
    echo [ERROR] No se encontro ningun puerto libre entre 8080 y 8100.
    pause
    exit /b 1
)

echo.
echo [OK] Puerto libre encontrado: %PORT%
echo Iniciando servidor en: http://127.0.0.1:%PORT%
echo (No cierres esta ventana mientras uses la pagina)
echo.

:: Abrir el navegador tras 1 segundo para dar tiempo a que arranque el servidor
start "" /b cmd /c "timeout /t 1 /nobreak >nul && start "" "http://127.0.0.1:%PORT%""

:: Iniciar servidor HTTP con Python
where python >nul 2>&1
if %errorlevel%==0 (
    python -m http.server %PORT% --bind 127.0.0.1
    goto :fin
)

where py >nul 2>&1
if %errorlevel%==0 (
    py -m http.server %PORT% --bind 127.0.0.1
    goto :fin
)

echo [ERROR] No se encontro Python instalado en el sistema.
pause

:fin
endlocal
