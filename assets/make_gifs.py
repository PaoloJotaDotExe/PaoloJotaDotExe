"""Normalizes the profile GIFs: outer white background -> page color, trimmed, centered, same size.
Usage: python assets/make_gifs.py   (reads the originals from ~/Downloads)"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageSequence
from scipy import ndimage

SRC = Path.home() / "Downloads"
OUT = Path(__file__).resolve().parent
BG = (13, 17, 23)          # GitHub dark theme page color (#0d1117)
SIZE, BOX = 200, 184        # canvas and max content box

JOBS = [  # (source, output, resample)
    ("majorasGif.webp", "majora.gif", Image.NEAREST),     # pixel art stays crisp
    ("GhostBoo.gif", "ghost_boo.gif", Image.LANCZOS),
    ("GhostDroppingGif.gif", "ghost_dropping.gif", Image.LANCZOS),
]


def outer_background(rgba):
    """Mask of near-white/transparent pixels connected to the image border."""
    a = np.asarray(rgba).astype(int)
    light = ((a[..., :3].min(axis=2) > 215) | (a[..., 3] < 30))
    labels, _ = ndimage.label(light)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    return np.isin(labels, border[border > 0])


for src, out, resample in JOBS:
    im = Image.open(SRC / src)
    frames, durations, masks = [], [], []
    for f in ImageSequence.Iterator(im):
        rgba = f.convert("RGBA")
        frames.append(rgba)
        masks.append(outer_background(rgba))
        durations.append(f.info.get("duration") or im.info.get("duration") or 80)

    # union bounding box of the content across all frames, so the animation doesn't jump
    content = ~np.logical_and.reduce(masks)
    ys, xs = np.where(content)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    w, h = box[2] - box[0], box[3] - box[1]
    scale = BOX / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))

    result = []
    for rgba, mask in zip(frames, masks):
        a = np.asarray(rgba).copy()
        a[mask] = (*BG, 255)
        a[..., 3] = 255
        piece = Image.fromarray(a, "RGBA").crop(box).resize((nw, nh), resample)
        canvas = Image.new("RGB", (SIZE, SIZE), BG)
        canvas.paste(piece.convert("RGB"), ((SIZE - nw) // 2, (SIZE - nh) // 2))
        result.append(canvas.convert("P", palette=Image.ADAPTIVE, colors=255))

    result[0].save(OUT / out, save_all=True, append_images=result[1:], duration=durations, loop=0, disposal=1, optimize=True)
    print(f"{out}: {len(result)} frames, content {w}x{h} -> {nw}x{nh}, {(OUT / out).stat().st_size // 1024} KB")
