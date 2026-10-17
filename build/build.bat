@echo off
chcp 65001 >nul
setlocal
rem Собирает из исходников:
rem   PomanRecorder.exe                    — переносная версия (один файл, лежит в корне папки)
rem   installer\PomanRecorder-Setup-1.0.exe     — установщик, который можно отправить другу
cd /d "%~dp0.."
set "ROOT=%CD%"
set "VENV=%LOCALAPPDATA%\SimpleRecorder\venv"
set "WORK=%TEMP%\recorder-build"
set "PY=%VENV%\Scripts\python.exe"

if not exist "%PY%" (
    echo Создаю окружение Python...
    python -m venv "%VENV%" || goto :fail
)
echo [1/5] Ставлю библиотеки для сборки...
"%PY%" -m pip install --disable-pip-version-check -q -r requirements.txt pyinstaller pillow || goto :fail

echo [2/5] Рисую иконку и картинки установщика...
"%PY%" build\make_icon.py || goto :fail

set PYI_ARGS=--noconfirm --clean --log-level WARN --windowed --name Recorder ^
    --icon "%ROOT%\build\icon.ico" --add-data "%ROOT%\ui;ui" ^
    --exclude-module tkinter --exclude-module PIL --exclude-module matplotlib ^
    --specpath "%WORK%"

echo [3/5] Собираю переносной exe...
"%PY%" -m PyInstaller %PYI_ARGS% --onefile --workpath "%WORK%\work1" --distpath "%WORK%\onefile" "%ROOT%\recorder.py" || goto :fail
copy /y "%WORK%\onefile\Recorder.exe" "%ROOT%\PomanRecorder.exe" >nul || goto :fail

echo [4/5] Собираю программу для установщика...
"%PY%" -m PyInstaller %PYI_ARGS% --onedir --workpath "%WORK%\work2" --distpath "%WORK%\onedir" "%ROOT%\recorder.py" || goto :fail

echo [5/5] Собираю установщик...
set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (
    echo Не найден Inno Setup. Установите его командой:  winget install JRSoftware.InnoSetup
    goto :fail
)
"%ISCC%" /Q "/DAppSource=%WORK%\onedir\Recorder" "%ROOT%\build\installer.iss" || goto :fail

echo.
echo Готово:
echo   %ROOT%\PomanRecorder.exe
echo   %ROOT%\installer\
pause
exit /b 0

:fail
echo.
echo Сборка не удалась — смотрите сообщения выше.
pause
exit /b 1
