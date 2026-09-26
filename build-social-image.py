"""Build the default Open Graph image for ReviewRemoval pages."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
OUT = ROOT / "assets" / "reviewremoval-social.png"
NAVY = "#17353e"
CREAM = "#f7f3ec"
CORAL = "#e5a387"
PALE = "#d8e4df"


def font(filename, size):
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / filename), size)


image = Image.new("RGB", (1200, 630), NAVY)
draw = ImageDraw.Draw(image)

# A restrained editorial card that remains readable in small social previews.
draw.rectangle((0, 0, 17, 630), fill=CORAL)
draw.rectangle((71, 67, 132, 128), outline=CORAL, width=2)
draw.text((86, 69), "R", fill=CREAM, font=font("georgiab.ttf", 43))
draw.text((154, 76), "ReviewRemoval", fill=CREAM, font=font("georgiab.ttf", 34))
draw.line((72, 165, 1128, 165), fill="#55727a", width=2)

draw.text((72, 207), "Review concerns,", fill=CREAM, font=font("georgia.ttf", 80))
draw.text((72, 300), "handled for you.", fill=CREAM, font=font("georgia.ttf", 80))
draw.line((72, 467, 235, 467), fill=CORAL, width=5)
draw.text((72, 495), "REVIEW REPORTING SUPPORT ACROSS CANADA", fill=PALE, font=font("segoeuib.ttf", 21))
draw.text((72, 543), "reviewremoval.ca", fill=CREAM, font=font("segoeui.ttf", 24))

OUT.parent.mkdir(parents=True, exist_ok=True)
image.save(OUT, optimize=True)
print(f"Built {OUT.name} ({image.width} x {image.height})")
