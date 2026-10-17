"""PomanRecorder: окно приложения и мост между интерфейсом (ui/) и звуковым ядром (audio_core.py)."""

import ctypes
import json
import os
import sys
import threading
import traceback
import winreg
from ctypes import wintypes
from datetime import datetime
from pathlib import Path

import webview

import audio_core as core

FROZEN = getattr(sys, "frozen", False)
APP_DIR = Path(sys.executable).resolve().parent if FROZEN else Path(__file__).resolve().parent
# Файлы интерфейса: у .exe они лежат во внутренней папке сборки
UI_DIR = Path(getattr(sys, "_MEIPASS", APP_DIR)) / "ui"
TITLE = "PomanRecorder"


def documents_dir():
    """Папка «Документы» пользователя (в том числе перенесённая в OneDrive)."""
    class GUID(ctypes.Structure):
        _fields_ = [("Data1", wintypes.DWORD), ("Data2", wintypes.WORD),
                    ("Data3", wintypes.WORD), ("Data4", ctypes.c_ubyte * 8)]

    folder_id = GUID(0xFDD39AD0, 0x238F, 0x46AF, (ctypes.c_ubyte * 8)(0xAD, 0xB4, 0x6C, 0x85, 0x48, 0x03, 0x69, 0xC7))
    path = ctypes.c_wchar_p()
    if ctypes.windll.shell32.SHGetKnownFolderPath(ctypes.byref(folder_id), 0, None, ctypes.byref(path)) == 0:
        result = Path(path.value)
        ctypes.windll.ole32.CoTaskMemFree(path)
        return result
    return Path.home() / "Documents"


def data_locations():
    """Где хранить настройки и записи.

    Запуск из исходников и переносной exe, рядом с которым уже есть settings.json, — рядом с программой.
    Установленная программа — настройки в %APPDATA%\\PomanRecorder, записи в «Документы\\PomanRecorder».
    """
    if not FROZEN or (APP_DIR / "settings.json").exists():
        recordings = APP_DIR / "Recordings"
        legacy = APP_DIR / "Записи"  # так папка называлась в первых версиях
        if legacy.exists() and not recordings.exists():
            recordings = legacy
        return APP_DIR / "settings.json", recordings
    appdata = Path(os.environ.get("APPDATA") or Path.home()) / "PomanRecorder"
    return appdata / "settings.json", documents_dir() / "PomanRecorder"


SETTINGS_FILE, DEFAULT_REC_DIR = data_locations()


def load_settings():
    try:
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def system_is_dark():
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize") as key:
            return winreg.QueryValueEx(key, "AppsUseLightTheme")[0] == 0
    except OSError:
        return True


def find_own_window():
    user32 = ctypes.windll.user32
    pid, found = os.getpid(), []

    @ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    def callback(hwnd, _):
        owner = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(owner))
        if owner.value == pid and user32.IsWindowVisible(hwnd):
            buf = ctypes.create_unicode_buffer(256)
            user32.GetWindowTextW(hwnd, buf, 256)
            if buf.value == TITLE:
                found.append(hwnd)
        return True

    user32.EnumWindows(callback, 0)
    return found[0] if found else None


def style_title_bar(dark, bg_hex, fg_hex):
    """Красит заголовок окна Windows 11 в цвет приложения."""
    hwnd = find_own_window()
    if not hwnd:
        return

    def colorref(h):
        h = h.lstrip("#")
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return ctypes.c_int(r | (g << 8) | (b << 16))

    dwm = ctypes.windll.dwmapi
    results = []
    for attr, value in ((20, ctypes.c_int(1 if dark else 0)), (35, colorref(bg_hex)), (36, colorref(fg_hex))):
        results.append(dwm.DwmSetWindowAttribute(wintypes.HWND(hwnd), attr, ctypes.byref(value), 4))
    return results


class Api:
    """Методы этого класса вызываются из JavaScript: window.pywebview.api.<метод>()."""

    def __init__(self):
        self._settings = load_settings()
        self._folder = Path(self._settings.get("folder", DEFAULT_REC_DIR))
        self._folder.mkdir(parents=True, exist_ok=True)
        self._rec = core.Recorder()
        self._player = core.Player()
        self._devices = core.list_input_devices()
        self._current = None
        self._preview = False
        self._monitor = False
        self._window = None
        self._lock = threading.RLock()

    # ---------- служебное
    def _save(self):
        try:
            SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
            SETTINGS_FILE.write_text(json.dumps(self._settings, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _device_name(self):
        name = self._settings.get("device")
        return name if name in self._devices else core.SYSTEM_DEFAULT

    def _channels(self):
        value = self._settings.get("channels", 1)
        return 2 if value in (2, "2", "Стерео") else 1

    def _folder_stamp(self):
        try:
            return self._folder.stat().st_mtime_ns
        except OSError:
            return 0

    def _load_result(self, data, sr):
        hi, lo = core.compute_peaks(data)
        return {"ok": True, "duration": len(data) / sr, "sr": sr, "channels": int(data.shape[1]),
                "hi": hi, "lo": lo, "preview": self._preview}

    def log(self, message):
        if sys.stderr:  # у .exe без консоли stderr нет
            print("[ui]", message, file=sys.stderr)

    # ---------- начальное состояние и настройки
    def init(self):
        return {
            "devices": list(self._devices),
            "device": self._device_name(),
            "channels": self._channels(),
            "theme": self._settings.get("theme", "auto"),
            "folder": str(self._folder),
            "filters": {**core.FILTER_DEFAULTS, **self._settings.get("filters", {})},
            "filterDefaults": core.FILTER_DEFAULTS,
            "sort": self._settings.get("sort", {"key": "date", "dir": -1}),
        }

    def set_pref(self, key, value):
        if key in ("theme", "sort", "channels"):
            self._settings[key] = value
            self._save()
        return True

    def title_bar(self, dark, bg, fg):
        try:
            style_title_bar(dark, bg, fg)
        except Exception:
            pass
        return True

    # ---------- устройства
    def refresh_devices(self):
        with self._lock:
            if not self._rec.is_open and not self._player.playing:
                core.reinit_audio()
            self._devices = core.list_input_devices()
        return {"devices": list(self._devices), "device": self._device_name()}

    def set_device(self, name):
        self._settings["device"] = name
        self._save()
        return self._restart_monitor()

    def set_channels(self, n):
        self._settings["channels"] = int(n)
        self._save()
        return self._restart_monitor()

    def _restart_monitor(self):
        if self._monitor and not self._rec.writing:
            return self.set_monitor(True)
        return {"ok": True}

    def set_monitor(self, on):
        with self._lock:
            if self._rec.writing:
                return {"ok": True}
            self._monitor = bool(on)
            try:
                if on:
                    self._rec.open(self._devices.get(self._device_name()), self._channels())
                else:
                    self._rec.close()
            except Exception as e:
                self._monitor = False
                return {"ok": False, "error": str(e)}
            return {"ok": True, "samplerate": self._rec.samplerate}

    # ---------- запись
    def start_record(self):
        with self._lock:
            self._player.stop()
            name = datetime.now().strftime("Запись %Y-%m-%d %H-%M-%S.wav")
            want = self._channels()
            try:
                self._rec.open(self._devices.get(self._device_name()), want)
                self._rec.start_writing(self._folder / name)
            except Exception as e:
                self._rec.close()
                return {"ok": False, "error": str(e)}
            return {"ok": True, "samplerate": self._rec.samplerate, "channels": self._rec.channels,
                    "device": self._device_name(), "monoFallback": want == 2 and self._rec.channels == 1}

    def stop_record(self):
        with self._lock:
            path = self._rec.stop_writing()
            error = self._rec.error
            if not self._monitor:
                self._rec.close()
            return {"path": str(path) if path else None, "error": str(error) if error else None}

    def pause_record(self, paused):
        self._rec.paused = bool(paused)
        return self._rec.paused

    # ---------- список записей
    def list_files(self):
        files = []
        for p in self._folder.glob("*.wav"):
            try:
                st = p.stat()
            except OSError:
                continue
            dur, sr, ch = core.wav_info(p)
            files.append({"path": str(p), "name": p.stem, "mtime": st.st_mtime, "size": st.st_size,
                          "duration": dur, "sr": sr, "channels": ch})
        return {"folder": str(self._folder), "files": files, "stamp": self._folder_stamp()}

    def thumb(self, path):
        try:
            return core.thumbnail(path)
        except Exception:
            return None

    def load(self, path):
        with self._lock:
            self._preview = False
            try:
                data, sr = core.read_audio(path)
            except Exception as e:
                self._player.unload()
                self._current = None
                return {"ok": False, "error": str(e)}
            self._player.load(data, sr)
            self._current = Path(path)
            return self._load_result(data, sr)

    def unload(self):
        with self._lock:
            self._player.unload()
            self._current = None
            self._preview = False
        return True

    # ---------- воспроизведение
    def play(self):
        try:
            self._player.play()
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def pause(self):
        self._player.pause()
        return True

    def stop(self):
        self._player.stop()
        return True

    def seek(self, seconds):
        self._player.seek(float(seconds))
        return self._player.position

    def state(self):
        """Опрашивается интерфейсом ~25 раз в секунду: уровни, спектр, позиция, состояние записи."""
        rec, player = self._rec, self._player
        out = {"levels": [0, 0], "spectrum": None, "history": [], "folder": self._folder_stamp()}
        if rec.is_open:
            peaks, history, ring = rec.read_meters()
            out["levels"] = [round(float(peaks[0]), 4), round(float(peaks[1]), 4)]
            out["history"] = [round(v, 3) for v in history]
            out["spectrum"] = core.spectrum(ring, rec.samplerate)
        else:
            res = player.analysis()
            if res is not None:
                peaks, mono = res
                out["levels"] = [round(float(peaks[0]), 4), round(float(peaks[1]), 4)]
                out["spectrum"] = core.spectrum(mono, player.sr)
        out["rec"] = {"open": rec.is_open, "writing": rec.writing, "paused": rec.paused,
                      "elapsed": rec.elapsed, "sr": rec.samplerate, "monitor": self._monitor}
        out["play"] = {"playing": player.playing, "pos": player.position, "dur": player.duration,
                       "preview": self._preview}
        return out

    # ---------- файлы
    def reveal(self, path):
        core.show_in_explorer(path)
        return True

    def open_folder(self):
        os.startfile(self._folder)
        return True

    def choose_folder(self):
        result = self._window.create_file_dialog(webview.FileDialog.FOLDER, directory=str(self._folder))
        if not result:
            return None
        folder = Path(result[0] if isinstance(result, (list, tuple)) else result)
        self._folder = folder
        self._settings["folder"] = str(folder)
        self._save()
        self.unload()
        return str(folder)

    def copy_file(self, path):
        try:
            core.copy_file_to_clipboard(path)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def copy_path(self, path):
        try:
            core.copy_text_to_clipboard(str(path))
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def rename(self, path, new_name):
        path = Path(path)
        new_name = "".join(c for c in str(new_name).strip() if c not in '<>:"/\\|?*').strip(" .")
        if not new_name:
            return {"ok": False, "error": "Пустое название"}
        target = path.with_name(new_name + ".wav")
        if target == path:
            return {"ok": True, "path": str(path)}
        if target.exists():
            return {"ok": False, "error": "Запись с таким названием уже есть"}
        with self._lock:
            if self._current == path:
                self._player.stop()
            try:
                path.rename(target)
            except OSError as e:
                return {"ok": False, "error": str(e)}
            if self._current == path:
                self._current = target
        return {"ok": True, "path": str(target)}

    def delete(self, path):
        path = Path(path)
        with self._lock:
            if self._current == path:
                self.unload()
            try:
                core.send_to_recycle_bin(path)
            except OSError as e:
                return {"ok": False, "error": str(e)}
        return {"ok": True}

    # ---------- эффекты
    def _process(self, path, params):
        p = {**core.FILTER_DEFAULTS, **params}
        self._settings["filters"] = p
        self._save()
        data, sr = core.read_audio(path)
        return core.apply_filters(data, sr, p), sr

    def preview(self, path, params):
        with self._lock:
            try:
                data, sr = self._process(path, params)
            except Exception as e:
                return {"ok": False, "error": str(e)}
            self._preview = True
            self._player.load(data, sr)
            self._player.play()
            return self._load_result(data, sr)

    def end_preview(self):
        if not self._preview or self._current is None:
            return None
        return self.load(str(self._current))

    def save_fx(self, path, params, overwrite):
        path = Path(path)
        with self._lock:
            try:
                data, sr = self._process(path, params)
                self._player.unload()
                self._preview = False
                if overwrite:
                    tmp = path.with_name(path.stem + ".tmp")
                    core.write_audio(tmp, data, sr)
                    core.send_to_recycle_bin(path)
                    os.replace(tmp, path)
                    target = path
                else:
                    target = core.unique_path(path.with_name(f"{path.stem} (обработано).wav"))
                    core.write_audio(target, data, sr)
            except Exception as e:
                return {"ok": False, "error": str(e)}
        return {"ok": True, "path": str(target)}

    # ---------- закрытие
    def _shutdown(self):
        try:
            if self._rec.writing:
                self._rec.stop_writing()
            self._rec.close()
            self._player.stop()
        except Exception:
            if sys.stderr:
                traceback.print_exc()


def activate_running_copy():
    """Если программа уже открыта — показывает её окно и возвращает True."""
    kernel32, user32 = ctypes.windll.kernel32, ctypes.windll.user32
    kernel32.CreateMutexW.restype = wintypes.HANDLE
    activate_running_copy.mutex = kernel32.CreateMutexW(None, False, "SimpleRecorder.SingleInstance")
    if kernel32.GetLastError() != 183:  # ERROR_ALREADY_EXISTS
        return False
    hwnd = user32.FindWindowW(None, TITLE)
    if hwnd:
        user32.ShowWindow(hwnd, 9)  # SW_RESTORE
        user32.SetForegroundWindow(hwnd)
    return True


def main():
    if activate_running_copy():
        return
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        pass
    api = Api()
    theme = api._settings.get("theme", "auto")
    dark = system_is_dark() if theme == "auto" else theme == "dark"
    window = webview.create_window(
        TITLE, url=str(UI_DIR / "index.html"), js_api=api,
        width=1320, height=860, min_size=(1060, 700),
        background_color="#07090d" if dark else "#e9edf3",
    )
    api._window = window
    window.events.closing += api._shutdown
    webview.start(debug="--debug" in sys.argv)


if __name__ == "__main__":
    main()
