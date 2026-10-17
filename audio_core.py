"""Звуковое ядро рекордера: запись, воспроизведение, фильтры, анализ и работа с файлами."""

import ctypes
import os
import queue
import subprocess
import threading
import wave
from ctypes import wintypes
from pathlib import Path

import numpy as np
import sounddevice as sd
from scipy import signal
from scipy.io import wavfile

SYSTEM_DEFAULT = "Системный микрофон по умолчанию"


# ----------------------------------------------------------------- файлы

def unique_path(path):
    path = Path(path)
    if not path.exists():
        return path
    i = 2
    while True:
        candidate = path.with_name(f"{path.stem} ({i}){path.suffix}")
        if not candidate.exists():
            return candidate
        i += 1


def wav_info(path):
    """(длительность, частота, каналы) по заголовку WAV, без чтения данных."""
    try:
        with wave.open(str(path), "rb") as w:
            return w.getnframes() / w.getframerate(), w.getframerate(), w.getnchannels()
    except Exception:
        return None, None, None


def read_audio(path):
    """Читает WAV и возвращает (float32 массив [кадры, каналы], частота)."""
    sr, data = wavfile.read(str(path))
    if data.dtype == np.uint8:
        data = (data.astype(np.float32) - 128) / 128
    elif data.dtype == np.int16:
        data = data.astype(np.float32) / 32768
    elif data.dtype == np.int32:
        data = data.astype(np.float32) / 2147483648
    else:
        data = data.astype(np.float32)
    if data.ndim == 1:
        data = data[:, None]
    return data, sr


def write_audio(path, data, sr):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    wavfile.write(str(path), sr, pcm[:, 0] if pcm.shape[1] == 1 else pcm)


def send_to_recycle_bin(path):
    """Удаляет файл в Корзину (можно восстановить)."""

    class SHFILEOPSTRUCTW(ctypes.Structure):
        _fields_ = [
            ("hwnd", wintypes.HWND),
            ("wFunc", wintypes.UINT),
            ("pFrom", wintypes.LPCWSTR),
            ("pTo", wintypes.LPCWSTR),
            ("fFlags", ctypes.c_ushort),
            ("fAnyOperationsAborted", wintypes.BOOL),
            ("hNameMappings", ctypes.c_void_p),
            ("lpszProgressTitle", wintypes.LPCWSTR),
        ]

    buf = ctypes.create_unicode_buffer(str(Path(path).resolve()) + "\0\0")
    op = SHFILEOPSTRUCTW()
    op.wFunc = 3  # FO_DELETE
    op.pFrom = ctypes.cast(buf, wintypes.LPCWSTR)
    op.fFlags = 0x40 | 0x10 | 0x4 | 0x400  # ALLOWUNDO | NOCONFIRMATION | SILENT | NOERRORUI
    result = ctypes.windll.shell32.SHFileOperationW(ctypes.byref(op))
    if result != 0:
        raise OSError(f"Не удалось удалить файл (код {result})")


def show_in_explorer(path):
    subprocess.Popen(f'explorer /select,"{Path(path).resolve()}"')


def _powershell(command, value):
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", command],
        env={**os.environ, "RECORDER_ARG": value},
        creationflags=subprocess.CREATE_NO_WINDOW,
        check=True,
    )


def copy_file_to_clipboard(path):
    """Кладёт сам файл в буфер обмена — его можно вставить в Проводник, мессенджер и т.п."""
    _powershell("Set-Clipboard -LiteralPath $env:RECORDER_ARG", str(Path(path).resolve()))


def copy_text_to_clipboard(text):
    _powershell("Set-Clipboard -Value $env:RECORDER_ARG", text)


# ----------------------------------------------------------------- анализ

def compute_peaks(data, n=2000):
    """Пики для отрисовки волны: (максимумы, минимумы) по n колонкам."""
    if data is None or len(data) == 0:
        return [], []
    mono = data.mean(axis=1) if data.shape[1] > 1 else data[:, 0]
    n = min(n, len(mono))
    edges = np.linspace(0, len(mono), n + 1).astype(int)[:-1]
    hi = np.maximum.reduceat(mono, edges)
    lo = np.minimum.reduceat(mono, edges)
    return np.round(hi, 3).tolist(), np.round(lo, 3).tolist()


def thumbnail(path, n=40):
    """Мини-волна для списка записей. Читает файл выборочно, не загружая целиком."""
    sr, data = wavfile.read(str(path), mmap=True)
    try:
        if data.ndim > 1:
            data = data[:, 0]
        if len(data) == 0:
            return [0.0] * n
        step = max(1, len(data) // (n * 400))
        sub = np.asarray(data[::step], dtype=np.float32)
        if data.dtype == np.uint8:
            sub -= 128
        sub = np.abs(sub)
    finally:
        del data
    vals = np.array([c.max() if len(c) else 0.0 for c in np.array_split(sub, n)])
    top = vals.max()
    return np.round(vals / top if top > 0 else vals, 3).tolist()


_BAND_CACHE = {}


def spectrum(mono, sr, bands=48, n_fft=4096):
    """Спектр в логарифмических полосах, значения 0..1 (−90…−10 дБ)."""
    if len(mono) < n_fft:
        mono = np.pad(mono, (n_fft - len(mono), 0))
    mono = mono[-n_fft:]
    key = (sr, bands, n_fft)
    if key not in _BAND_CACHE:
        freqs = np.fft.rfftfreq(n_fft, 1 / sr)
        idx = np.searchsorted(freqs, np.geomspace(30, min(16000, sr / 2 - 1), bands + 1))
        for i in range(1, len(idx)):
            idx[i] = max(idx[i], idx[i - 1] + 1)
        _BAND_CACHE[key] = (np.hanning(n_fft).astype(np.float32), np.minimum(idx[:-1], n_fft // 2))
    win, starts = _BAND_CACHE[key]
    mag = np.abs(np.fft.rfft(mono * win)) / (n_fft / 4)
    vals = np.maximum.reduceat(mag, starts)
    db = 20 * np.log10(vals + 1e-9)
    return np.round(np.clip((db + 90) / 80, 0, 1), 3).tolist()


# ----------------------------------------------------------------- фильтры

FILTER_DEFAULTS = {
    "trim": False, "trim_db": -45,
    "highpass": False, "highpass_hz": 80,
    "lowpass": False, "lowpass_hz": 8000,
    "denoise": False, "denoise_strength": 60,
    "gain": False, "gain_db": 6.0,
    "fade": False, "fade_ms": 300,
    "normalize": True, "normalize_db": -1.0,
}
FILTER_FLAGS = ("trim", "highpass", "lowpass", "denoise", "gain", "fade", "normalize")


def trim_silence(data, sr, threshold_db):
    frame = max(1, sr // 100)  # 10 мс
    mono = np.abs(data).max(axis=1)
    n = len(mono) // frame
    if n == 0:
        return data
    peaks = mono[: n * frame].reshape(n, frame).max(axis=1)
    loud = np.nonzero(peaks > 10 ** (threshold_db / 20))[0]
    if len(loud) == 0:
        return data
    margin = sr // 10
    start = max(0, loud[0] * frame - margin)
    end = min(len(data), (loud[-1] + 1) * frame + margin)
    return data[start:end]


def butter_filter(data, sr, hz, kind):
    hz = min(max(10.0, float(hz)), sr / 2 * 0.95)
    sos = signal.butter(4, hz, btype=kind, fs=sr, output="sos")
    if len(data) < 64:
        return data
    return signal.sosfiltfilt(sos, data, axis=0).astype(np.float32)


def denoise_channel(x, strength):
    """Шумоподавление спектральным вычитанием: профиль шума берётся по самым тихим участкам."""
    n_fft, hop = 2048, 1024
    if len(x) < n_fft * 4:
        return x
    win = np.sqrt(np.hanning(n_fft + 1)[:-1]).astype(np.float32)
    total = len(x) + 2 * n_fft
    total += (-total) % hop
    xp = np.zeros(total, dtype=np.float32)
    xp[n_fft:n_fft + len(x)] = x
    n_frames = total // hop - 1
    frames = np.lib.stride_tricks.sliding_window_view(xp, n_fft)[::hop][:n_frames]

    # Профиль шума: 10% самых тихих кадров
    block_energy = (xp.reshape(-1, hop) ** 2).sum(axis=1)
    frame_energy = block_energy[:-1] + block_energy[1:]
    voiced = np.nonzero(frame_energy > 0)[0]
    if len(voiced) < 10:
        return x
    k = max(5, len(voiced) // 10)
    quiet = voiced[np.argsort(frame_energy[voiced])[:k]]
    noise = np.abs(np.fft.rfft(frames[quiet] * win, axis=1)).mean(axis=0)

    s = strength / 100.0
    alpha = 1.0 + 3.0 * s           # насколько агрессивно вычитать шум
    floor = 1.0 - 0.9 * s           # минимальный остаток (чтобы не было «бульканья»)
    out = np.zeros((n_frames + 1, hop), dtype=np.float32)
    chunk = 2000
    for a in range(0, n_frames, chunk):
        b = min(n_frames, a + chunk)
        spec = np.fft.rfft(frames[a:b] * win, axis=1)
        mag2 = np.abs(spec) ** 2
        gain = mag2 / (mag2 + alpha * noise ** 2 + 1e-12)
        gain = np.maximum(gain, floor)
        y = np.fft.irfft(spec * gain, n=n_fft, axis=1).astype(np.float32) * win
        out[a:b] += y[:, :hop]
        out[a + 1:b + 1] += y[:, hop:]
    return out.reshape(-1)[n_fft:n_fft + len(x)]


def apply_filters(data, sr, p):
    data = data.astype(np.float32, copy=True)
    if p["trim"]:
        data = trim_silence(data, sr, p["trim_db"])
    if p["highpass"]:
        data = butter_filter(data, sr, p["highpass_hz"], "highpass")
    if p["lowpass"]:
        data = butter_filter(data, sr, p["lowpass_hz"], "lowpass")
    if p["denoise"]:
        data = np.stack([denoise_channel(data[:, c], p["denoise_strength"]) for c in range(data.shape[1])], axis=1)
    if p["gain"]:
        data *= 10 ** (p["gain_db"] / 20)
    if p["fade"]:
        n = min(len(data) // 2, int(sr * p["fade_ms"] / 1000))
        if n > 0:
            ramp = np.linspace(0, 1, n, dtype=np.float32)[:, None]
            data[:n] *= ramp
            data[-n:] *= ramp[::-1]
    if p["normalize"]:
        peak = np.abs(data).max() if len(data) else 0
        if peak > 1e-6:
            data *= 10 ** (p["normalize_db"] / 20) / peak
    return np.clip(data, -1, 1)


# ----------------------------------------------------------------- устройства

def reinit_audio():
    """Переинициализация PortAudio, чтобы увидеть микрофоны, подключённые после запуска."""
    try:
        sd._terminate()
        sd._initialize()
    except Exception:
        pass


def list_input_devices():
    """Микрофоны через WASAPI (полные имена, без дублей). Возвращает {имя: индекс}."""
    devices = {SYSTEM_DEFAULT: None}
    try:
        apis = sd.query_hostapis()
        wasapi = next((i for i, a in enumerate(apis) if "WASAPI" in a["name"]), None)
        for i, d in enumerate(sd.query_devices()):
            if d["max_input_channels"] > 0 and (wasapi is None or d["hostapi"] == wasapi):
                devices[d["name"]] = i
    except Exception:
        pass
    return devices


# ----------------------------------------------------------------- запись

class Recorder:
    """Входной поток. Может просто показывать уровень (проверка микрофона) или ещё и писать в файл."""

    RING = 4096

    def __init__(self):
        self.stream = None
        self.writing = False
        self.paused = False
        self.lock = threading.Lock()
        self.queue = None
        self.writer = None
        self.frames_written = 0
        self.samplerate = 0
        self.channels = 1
        self.in_channels = 1
        self.tmp_path = None
        self.final_path = None
        self.error = None
        self._reset_meters()

    def _reset_meters(self):
        self.peaks = np.zeros(2, dtype=np.float32)
        self.history = []
        self.ring = np.zeros(self.RING, dtype=np.float32)

    @property
    def is_open(self):
        return self.stream is not None

    @property
    def elapsed(self):
        return self.frames_written / self.samplerate if self.samplerate else 0

    def _open_stream(self, device):
        attempts = []
        if device is None:
            attempts.append((None, sd.query_devices(kind="input")))
        else:
            info = sd.query_devices(device)
            attempts.append((device, info))
            # Запасной вариант: то же устройство через MME (оно само подстраивает формат)
            for i, d in enumerate(sd.query_devices()):
                api = sd.query_hostapis(d["hostapi"])["name"]
                if api == "MME" and d["max_input_channels"] > 0 and info["name"].startswith(d["name"]):
                    attempts.append((i, d))
        last_error = None
        for dev, d in attempts:
            max_ch = int(d["max_input_channels"])
            for ch in dict.fromkeys([min(2, max_ch), max_ch, 1]):
                try:
                    sr = int(d["default_samplerate"])
                    stream = sd.InputStream(device=dev, samplerate=sr, channels=ch,
                                            dtype="float32", callback=self._callback)
                    return stream, sr, ch
                except Exception as e:
                    last_error = e
        raise RuntimeError(f"Не удалось открыть микрофон: {last_error}")

    def open(self, device, want_channels):
        self.close()
        self.stream, self.samplerate, self.in_channels = self._open_stream(device)
        self.channels = min(want_channels, self.in_channels)
        with self.lock:
            self._reset_meters()
        self.stream.start()

    def close(self):
        if self.writing:
            self.stop_writing()
        if self.stream is not None:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass
            self.stream = None
        with self.lock:
            self._reset_meters()

    def start_writing(self, path):
        self.final_path = Path(path)
        self.tmp_path = self.final_path.with_suffix(".wav.part")
        self.frames_written = 0
        self.paused = False
        self.error = None
        self.queue = queue.Queue()
        self.writer = threading.Thread(target=self._write_loop, daemon=True)
        self.writer.start()
        self.writing = True

    def stop_writing(self):
        if not self.writing:
            return None
        self.writing = False
        self.queue.put(None)
        self.writer.join()
        if self.frames_written == 0:
            self.tmp_path.unlink(missing_ok=True)
            return None
        final = unique_path(self.final_path)
        os.replace(self.tmp_path, final)
        return final

    def _callback(self, indata, frames, time_info, status):
        block = indata.copy()
        if self.channels == 1 and block.shape[1] > 1:
            block = block.mean(axis=1, keepdims=True)
        else:
            block = block[:, : self.channels]
        if not len(block):
            return
        pk = np.abs(block).max(axis=0)
        mono = block[:, 0] if block.shape[1] == 1 else block.mean(axis=1)
        with self.lock:
            self.peaks[: len(pk)] = np.maximum(self.peaks[: len(pk)], pk)
            if not (self.writing and self.paused):
                self.history.append(float(np.abs(mono).max()))
                del self.history[:-2000]
            self.ring = np.concatenate((self.ring, mono))[-self.RING:]
        if self.writing and not self.paused:
            self.queue.put(block)

    def _write_loop(self):
        try:
            with wave.open(str(self.tmp_path), "wb") as w:
                w.setnchannels(self.channels)
                w.setsampwidth(2)
                w.setframerate(self.samplerate)
                while True:
                    block = self.queue.get()
                    if block is None:
                        break
                    w.writeframes((np.clip(block, -1, 1) * 32767).astype(np.int16).tobytes())
                    self.frames_written += len(block)
        except Exception as e:
            self.error = e

    def read_meters(self):
        """Пики по каналам с прошлого вызова, новые точки живой волны и последние сэмплы для спектра."""
        with self.lock:
            peaks = self.peaks.copy()
            self.peaks[:] = 0
            history, self.history = self.history, []
            ring = self.ring.copy()
        if self.channels == 1:
            peaks[1] = peaks[0]
        return peaks, history, ring


# ----------------------------------------------------------------- воспроизведение

class Player:
    def __init__(self):
        self.data = None
        self.sr = 44100
        self.pos = 0
        self.stream = None

    @property
    def playing(self):
        return self.stream is not None and self.stream.active

    @property
    def duration(self):
        return len(self.data) / self.sr if self.data is not None else 0

    @property
    def position(self):
        return self.pos / self.sr if self.data is not None else 0

    def load(self, data, sr):
        self.stop()
        self.data, self.sr, self.pos = data, sr, 0

    def unload(self):
        self.stop()
        self.data = None
        self.pos = 0

    def _callback(self, outdata, frames, time_info, status):
        chunk = self.data[self.pos:self.pos + frames]
        n = len(chunk)
        outdata[:n] = chunk
        outdata[n:] = 0
        self.pos += n
        if n < frames:
            raise sd.CallbackStop

    def play(self):
        if self.data is None:
            return
        self._close()
        if self.pos >= len(self.data):
            self.pos = 0
        self.stream = sd.OutputStream(samplerate=self.sr, channels=self.data.shape[1],
                                      dtype="float32", callback=self._callback)
        self.stream.start()

    def pause(self):
        self._close()

    def stop(self):
        self._close()
        self.pos = 0

    def seek(self, seconds):
        if self.data is not None:
            self.pos = int(min(max(0, seconds), self.duration) * self.sr)

    def analysis(self):
        """(пики L/R, моно-фрагмент) вокруг текущей позиции — для индикаторов при воспроизведении."""
        data, pos = self.data, self.pos
        if data is None or not self.playing:
            return None
        seg = data[max(0, pos - 4096):pos]
        if len(seg) < 16:
            return None
        peaks = np.abs(seg[-max(16, self.sr // 25):]).max(axis=0)
        if len(peaks) == 1:
            peaks = np.array([peaks[0], peaks[0]])
        mono = seg[:, 0] if seg.shape[1] == 1 else seg.mean(axis=1)
        return peaks[:2], mono

    def _close(self):
        if self.stream is not None:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass
            self.stream = None
