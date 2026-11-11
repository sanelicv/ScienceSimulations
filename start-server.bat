@echo off
rem Abre las simulaciones en un servidor local (Windows). Requiere Python 3.
rem Opens the simulations on a local server (Windows). Requires Python 3.
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    py -3 start-server.py %*
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    python start-server.py %*
    goto :end
)

echo.
echo   No se encontro Python 3. Instalalo desde https://www.python.org/downloads/
echo   (marca la opcion "Add python.exe to PATH") y vuelve a ejecutar este archivo.
echo.
echo   Python 3 was not found. Install it from https://www.python.org/downloads/
echo   (tick "Add python.exe to PATH") and run this file again.
echo.

:end
pause
