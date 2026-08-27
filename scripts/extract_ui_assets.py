from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "outputs" / "guangying-6-ui-strict" / "01-strict-ui.png"
OUT = ROOT / "public" / "assets" / "ui"


def save_crop(image: Image.Image, name: str, box: tuple[int, int, int, int]) -> None:
    crop = image.crop(box)
    crop.save(OUT / name, quality=95)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image = Image.open(SOURCE).convert("RGB")

    save_crop(image, "season-spring.png", (64, 437, 229, 611))
    save_crop(image, "season-summer.png", (254, 437, 423, 611))
    save_crop(image, "season-autumn.png", (443, 437, 611, 611))
    save_crop(image, "season-winter.png", (628, 437, 796, 611))
    save_crop(image, "route-cover-spring.png", (84, 704, 247, 900))

    print(OUT)


if __name__ == "__main__":
    main()
