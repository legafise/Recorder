"""Рисует иконку приложения и картинки для мастера установки (в стиле логотипа из интерфейса)."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
STOPS = [(0.0, (34, 211, 238)), (0.55, (129, 140, 248)), (1.0, (244, 114, 182))]
FONTS = Path("C:/Windows/Fonts")


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def brand_color(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return STOPS[-1][1]


def logo(size):
    """Скруглённый квадрат с градиентом и белыми столбиками эквалайзера (RGBA)."""
    big = 1024
    bg = Image.new("RGB", (big, big))
    px = bg.load()
    for y in range(big):
        for x in range(big):
            px[x, y] = brand_color((x + y) / (2 * (big - 1)))
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.3), fill=255)
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)
    w = big * 0.075
    for cx, half in ((0.25, 0.08), (0.375, 0.2), (0.5, 0.28), (0.625, 0.15), (0.75, 0.05)):
        x, h = cx * big, half * big
        d.rounded_rectangle((x - w / 2, big / 2 - h - w / 2, x + w / 2, big / 2 + h + w / 2), radius=w / 2, fill="white")
    return img.resize((size, size), Image.LANCZOS)


def font(name, size):
    try:
        return ImageFont.truetype(str(FONTS / name), size)
    except OSError:
        return ImageFont.load_default()


def wizard_large(w, h):
    """Левая картинка мастера установки: тёмный «пульт» со свечением, логотип и название."""
    k = w / 164
    img = Image.new("RGB", (w, h), (8, 10, 15))
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((-w * 0.6, -h * 0.15, w * 0.9, h * 0.45), fill=(20, 110, 135))
    g.ellipse((w * 0.1, h * 0.6, w * 1.6, h * 1.25), fill=(85, 50, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(40 * k))
    img = Image.blend(img, glow, 0.55)

    d = ImageDraw.Draw(img)
    # декоративные столбики-волна внизу
    bars, base = 22, h * 0.86
    for i in range(bars):
        t = i / (bars - 1)
        hh = (0.25 + 0.75 * abs(((i * 7) % 11) / 10 - 0.5) * 2) * 26 * k
        x = w * 0.08 + t * w * 0.84
        d.rounded_rectangle((x - 1.6 * k, base - hh, x + 1.6 * k, base + hh), radius=1.6 * k, fill=brand_color(t))

    lg = logo(int(64 * k))
    img.paste(lg, ((w - lg.width) // 2, int(h * 0.27)), lg)
    title, sub = font("segoeuib.ttf", int(16 * k)), font("segoeui.ttf", int(8.5 * k))
    for text, f, y, fill in (("PomanRecorder", title, h * 0.27 + 76 * k, (238, 241, 247)),
                             ("A U D I O   S T U D I O", sub, h * 0.27 + 100 * k, (140, 150, 170))):
        tw = d.textlength(text, font=f)
        d.text(((w - tw) / 2, y), text, font=f, fill=fill)
    return img


def wizard_small(size):
    img = Image.new("RGB", (size, size), "white")
    lg = logo(int(size * 0.86))
    img.paste(lg, ((size - lg.width) // 2, (size - lg.height) // 2), lg)
    return img


def main():
    logo(256).save(HERE / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    for scale in (1, 2):
        wizard_large(164 * scale, 314 * scale).save(HERE / f"wizard_large_{scale}x.bmp")
        wizard_small(55 * scale).save(HERE / f"wizard_small_{scale}x.bmp")
    print("saved icon and wizard images to", HERE)


if __name__ == "__main__":
    main()
