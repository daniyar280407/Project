@echo off
setlocal
chcp 65001 >nul

py -3 --version >nul 2>&1
if not errorlevel 1 (
    py -3 "%~dp0start_server.py" %*
    goto :finished
)

python -c "import sys; sys.exit(sys.version_info.major != 3)" >nul 2>&1
if not errorlevel 1 (
    python "%~dp0start_server.py" %*
    goto :finished
)

node --version >nul 2>&1
if not errorlevel 1 (
    node "%~dp0start_server.cjs" %*
    goto :finished
)

echo Python 3 or Node.js was not found. Install one of them and run this file again.
pause
exit /b 1

:finished
set "SERVER_EXIT=%ERRORLEVEL%"
if not "%SERVER_EXIT%"=="0" pause
endlocal & exit /b %SERVER_EXIT%
