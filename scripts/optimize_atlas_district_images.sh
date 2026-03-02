#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${1:-$ROOT_DIR/public/images/districts_style_images}"
QUALITY="${ATLAS_WEBP_QUALITY:-74}"
MAX_WIDTH="${ATLAS_WEBP_MAX_WIDTH:-1280}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "missing source directory: $SRC_DIR" >&2
  exit 1
fi

python3 - "$SRC_DIR" "$QUALITY" "$MAX_WIDTH" <<'PY'
import pathlib
import sys
from PIL import Image

src_dir = pathlib.Path(sys.argv[1]).resolve()
quality = int(float(sys.argv[2]))
max_width = int(float(sys.argv[3]))

images = sorted(
    p for p in src_dir.iterdir()
    if p.is_file() and p.suffix.lower() in {'.png', '.jpg', '.jpeg'}
)

if not images:
    print(f"No district style images found under {src_dir}")
    raise SystemExit(0)

count = 0
before = 0
after = 0

for src in images:
    dst = src.with_suffix('.webp')
    before += src.stat().st_size
    with Image.open(src) as img:
        width, height = img.size
        if width > max_width:
            ratio = max_width / float(width)
            new_height = max(1, int(round(height * ratio)))
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Preserve alpha when present, otherwise use RGB for smaller files.
        if img.mode not in ('RGB', 'RGBA'):
            if 'A' in img.getbands():
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')

        img.save(
            dst,
            format='WEBP',
            quality=max(1, min(quality, 100)),
            method=6,
            lossless=False
        )

    after += dst.stat().st_size
    count += 1

saved = before - after
ratio = (saved / before * 100.0) if before else 0.0
print(f"Converted {count} images to WebP")
print(f"Before: {before} bytes ({before/1024/1024:.2f} MiB)")
print(f"After:  {after} bytes ({after/1024/1024:.2f} MiB)")
print(f"Saved:  {saved} bytes ({saved/1024/1024:.2f} MiB, {ratio:.1f}%)")
PY
