@echo off
chcp 65001 >nul
setlocal
set "VENV=%LOCALAPPDATA%\SimpleRecorder\venv"
cd /d "%~dp0"

if not exist "%VENV%\Scripts\pythonw.exe" (
    echo Первый запуск: устанавливаю необходимые библиотеки, это займёт 1-2 минуты...
    python -m venv "%VENV%" || goto :nopython
)

rem Ставим/обновляем библиотеки, если список в requirements.txt изменился
fc /b "requirements.txt" "%VENV%\requirements.txt" >nul 2>&1
if errorlevel 1 (
    echo Устанавливаю библиотеки...
    "%VENV%\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt || goto :piperror
    copy /y "requirements.txt" "%VENV%\requirements.txt" >nul
)

start "" "%VENV%\Scripts\pythonw.exe" "%~dp0recorder.py"
exit /b 0

:nopython
echo Не найден Python. Установите его с https://www.python.org/downloads/ (галочка "Add python.exe to PATH").
pause
exit /b 1

:piperror
echo Не удалось установить библиотеки. Проверьте подключение к интернету и запустите снова.
pause
exit /b 1
