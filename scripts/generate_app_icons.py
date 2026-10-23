import os
import base64
from collections import deque
import numpy as np
from PIL import Image

SRC_PATH = r"C:\Users\Francois.Gaborel\.gemini\antigravity\brain\a68bf6fb-509d-4c3a-b249-fe8f34e5057d\trace_outdoor_lion_rampant_icon_1792766111395.jpg"
PUBLIC_DIR = r"c:\Users\Francois.Gaborel\Downloads\Trace Outdoor\public"

print(f"Reading source icon: {SRC_PATH}")
img = Image.open(SRC_PATH).convert("RGBA")
arr = np.array(img)
h, w, _ = arr.shape

# BFS floodfill from the 4 outer corners to identify white pixels outside the squircle
visited = np.zeros((h, w), dtype=bool)
is_white = (arr[:, :, 0] > 230) & (arr[:, :, 1] > 230) & (arr[:, :, 2] > 230)

q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
for x, y in q:
    visited[y, x] = True

while q:
    x, y = q.popleft()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
            if is_white[ny, nx]:
                visited[ny, nx] = True
                q.append((nx, ny))

print(f"Identified {np.sum(visited)} exterior corner pixels.")

# 1. Transparent Corners version (for standard PWA icons)
transparent_arr = arr.copy()
transparent_arr[visited, 3] = 0  # Set Alpha = 0 in corners
transparent_img = Image.fromarray(transparent_arr, "RGBA")

# 2. Maskable / Full-Bleed version (fill corners with rich emerald green #064e3b for iOS / Android adaptive masks)
maskable_arr = arr.copy()
maskable_arr[visited, 0] = 6   # R
maskable_arr[visited, 1] = 78  # G (#064e3b)
maskable_arr[visited, 2] = 59  # B
maskable_arr[visited, 3] = 255
maskable_img = Image.fromarray(maskable_arr, "RGBA")

# Generate public/pwa-512x512.png (512x512 transparent corners)
pwa_512 = transparent_img.resize((512, 512), Image.Resampling.LANCZOS)
pwa_512_path = os.path.join(PUBLIC_DIR, "pwa-512x512.png")
pwa_512.save(pwa_512_path, "PNG", optimize=True)
print("Saved public/pwa-512x512.png")

# Generate public/pwa-192x192.png (192x192 transparent corners)
pwa_192 = transparent_img.resize((192, 192), Image.Resampling.LANCZOS)
pwa_192.save(os.path.join(PUBLIC_DIR, "pwa-192x192.png"), "PNG", optimize=True)
print("Saved public/pwa-192x192.png")

# Generate public/apple-touch-icon.png (180x180 full-bleed emerald corners for iOS Home Screen)
apple_180 = maskable_img.resize((180, 180), Image.Resampling.LANCZOS)
apple_180.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
print("Saved public/apple-touch-icon.png")

# Generate public/pwa-maskable-512x512.png (512x512 full-bleed emerald corners for Android adaptive icon)
maskable_512 = maskable_img.resize((512, 512), Image.Resampling.LANCZOS)
maskable_512.save(os.path.join(PUBLIC_DIR, "pwa-maskable-512x512.png"), "PNG", optimize=True)
print("Saved public/pwa-maskable-512x512.png")

# Generate public/icon.svg with embedded self-contained base64 PNG
with open(pwa_512_path, "rb") as f:
    b64_str = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <clipPath id="squircle">
      <rect width="512" height="512" rx="116" />
    </clipPath>
  </defs>
  <image width="512" height="512" href="data:image/png;base64,{b64_str}" clip-path="url(#squircle)" />
</svg>
'''

icon_svg_path = os.path.join(PUBLIC_DIR, "icon.svg")
with open(icon_svg_path, "w", encoding="utf-8") as f:
    f.write(svg_content)
print("Saved public/icon.svg (self-contained SVG with embedded high-res Roude Léiw)")

print("All app icon assets generated successfully!")
