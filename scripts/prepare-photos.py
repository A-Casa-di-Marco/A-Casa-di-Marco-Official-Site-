"""Create smaller WebP derivatives without changing the original photographs."""
from pathlib import Path
import re
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
total_before = total_after = 0
for source in (root / 'assets').glob('*.jpg'):
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        image.thumbnail((1600, 1600))
        destination = source.with_suffix('.webp')
        image.save(destination, 'WEBP', quality=82, method=6)
        total_before += source.stat().st_size
        total_after += destination.stat().st_size
for name in ['index.html', 'script.js']:
    path = root / name
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'(assets/[a-z0-9-]+)\.jpg', r'\1.webp', text)
    if name == 'index.html':
        text = re.sub(r'<img(?![^>]*fetchpriority)(?![^>]*loading)([^>]*src="assets/[^"/]+\.webp"[^>]*)>', r'<img loading="lazy" decoding="async"\1>', text)
    path.write_text(text, encoding='utf-8')
print(f'Photos: {total_before / 1e6:.1f} MB -> {total_after / 1e6:.1f} MB')
