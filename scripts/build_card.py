"""Builds assets/terminal.svg: a neofetch-style terminal card with an ASCII portrait,
profile info, live GitHub stats and language bars. Runs daily in GitHub Actions.

Usage: GITHUB_TOKEN=... python scripts/build_card.py
"""
import json
import os
import urllib.request
from html import escape
from pathlib import Path

USER = "PaoloJotaDotExe"
ROOT = Path(__file__).resolve().parent.parent
TOKEN = os.environ.get("GITHUB_TOKEN")

# Palette
BG, BORDER, BAR = "#0d0714", "#5a189a", "#1a0b2e"
KEY, VAL, DIM, PROMPT, WHITE = "#c77dff", "#e0aaff", "#7b6a93", "#9d4edd", "#f3e8ff"
FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace"


def api(path):
    req = urllib.request.Request(f"https://api.github.com{path}", headers={"Accept": "application/vnd.github+json"})
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def fetch_stats():
    user = api(f"/users/{USER}")
    repos = [r for r in api(f"/users/{USER}/repos?per_page=100&type=owner") if not r["fork"]]
    langs = {}
    for r in repos:
        for lang, size in api(f"/repos/{USER}/{r['name']}/languages").items():
            langs[lang] = langs.get(lang, 0) + size
    try:
        commits = api(f"/search/commits?q=author:{USER}&per_page=1")["total_count"]
    except Exception:
        commits = None
    return {
        "repos": user["public_repos"],
        "stars": sum(r["stargazers_count"] for r in repos),
        "commits": commits,
        "langs": sorted(langs.items(), key=lambda kv: -kv[1]),
    }


def row(key, value, width=58):
    """'. Key: ....... value' with dot leaders, like a neofetch readout."""
    dots = width - len(key) - len(value) - 4
    return [(". ", DIM), (key, KEY), (": ", DIM), ("." * max(dots, 2) + " ", DIM), (value, VAL)]


def header(title, width=58):
    return [("- ", DIM), (title, WHITE), (" " + "-" * (width - len(title) - 3), DIM)]


def build(stats):
    portrait = (ROOT / "assets" / "portrait.txt").read_text(encoding="utf-8").splitlines()
    fmt = lambda n: "—" if n is None else f"{n:,}"

    info = [
        [("joao", KEY), ("@", DIM), ("paolo", KEY), (" " + "-" * 47, DIM)],
        row("OS", "Windows 11, Linux (SSH)"),
        row("Uptime", "3 years in IT"),
        row("Host", "Brasília, Brazil"),
        row("Kernel", "Data Science, Data Analysis"),
        row("Shell", "Requirements Analysis"),
        row("Focus", "Cybersecurity: blue team → offense"),
        [],
        row("Languages.Code", "Python, SQL, Bash, PowerShell"),
        row("Languages.Real", "Portuguese, English"),
        row("ML", "scikit-learn, Random Forest, XGBoost"),
        row("Deep Learning", "TensorFlow, Keras"),
        row("OCR / Docs", "docTR, Docling"),
        row("Data", "pandas, NumPy, Matplotlib, Seaborn"),
        row("Tools", "Git, SAS Viya, SQL"),
        row("Hobbies", "Games, Soccer, Gym"),
        [],
        header("Now Playing"),
        row("Wargame", "OverTheWire Bandit"),
        row("Course", "Google Cybersecurity Cert."),
        [],
        header("GitHub Stats"),
        [(". ", DIM), ("Repos", KEY), (": ", DIM), (f"{fmt(stats['repos']):<8}", VAL), ("| ", DIM),
         ("Stars", KEY), (": ", DIM), (f"{fmt(stats['stars']):<8}", VAL), ("| ", DIM),
         ("Commits", KEY), (": ", DIM), (fmt(stats["commits"]), VAL)],
    ]

    lh, fs = 17, 13.5          # line height / font size for the info column
    pfs, plh = 10.2, 12.2        # font size / line height for the portrait
    top = 62
    pw = 300                   # portrait column width
    ix = 30 + pw + 26          # info column x

    total = sum(size for _, size in stats["langs"]) or 1
    top_langs = stats["langs"][:5]
    body_h = max(len(portrait) * plh, len(info) * lh)
    lang_y = top + body_h + 40
    H = int(lang_y + 24 + len(top_langs) * 22 + 42)
    W = 985

    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">',
           '<style>.cursor{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}</style>',
           '<defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0aaff"/>'
           '<stop offset=".6" stop-color="#c77dff"/><stop offset="1" stop-color="#7b2cbf"/></linearGradient></defs>',
           f'<rect x="1" y="1" width="{W-2}" height="{H-2}" rx="12" fill="{BG}" stroke="{BORDER}" stroke-width="2"/>',
           f'<rect x="2" y="2" width="{W-4}" height="30" rx="11" fill="{BAR}"/><rect x="2" y="20" width="{W-4}" height="12" fill="{BAR}"/>']
    for i, c in enumerate(["#ff5f87", "#ffd166", "#9d4edd"]):
        out.append(f'<circle cx="{22 + i * 20}" cy="17" r="6" fill="{c}"/>')
    out.append(f'<text x="{W/2}" y="21" text-anchor="middle" font-size="12" fill="{DIM}">joao@paolo: ~</text>')

    def prompt(y, cmd):
        return (f'<text x="30" y="{y}" font-size="{fs}" xml:space="preserve"><tspan fill="{PROMPT}">joao@paolo</tspan>'
                f'<tspan fill="{DIM}">:~$ </tspan><tspan fill="{WHITE}">{escape(cmd)}</tspan></text>')

    out.append(prompt(top - 8, "neofetch"))
    for i, line in enumerate(portrait):
        out.append(f'<text x="30" y="{top + 12 + i * plh}" font-size="{pfs}" fill="url(#pg)" xml:space="preserve">{escape(line)}</text>')
    for i, parts in enumerate(info):
        spans = "".join(f'<tspan fill="{c}">{escape(t)}</tspan>' for t, c in parts)
        out.append(f'<text x="{ix}" y="{top + 14 + i * lh}" font-size="{fs}" xml:space="preserve">{spans}</text>')

    out.append(prompt(lang_y, "languages --by-bytes"))
    for i, (lang, size) in enumerate(top_langs):
        pct = size / total * 100
        y = lang_y + 24 + i * 22
        bw = 380
        out.append(f'<text x="48" y="{y}" font-size="{fs}" fill="{KEY}" xml:space="preserve">{escape(lang):<12}</text>')
        out.append(f'<rect x="170" y="{y - 11}" width="{bw}" height="12" rx="2" fill="{BAR}" stroke="#3c096c"/>')
        out.append(f'<rect x="170" y="{y - 11}" width="{max(bw * pct / 100, 3):.1f}" height="12" rx="2" fill="{KEY}"/>')
        out.append(f'<text x="{170 + bw + 14}" y="{y}" font-size="{fs}" fill="{VAL}">{pct:5.1f}%</text>')
    cy = lang_y + 24 + len(top_langs) * 22 + 14
    out.append(prompt(cy, ""))
    out.append(f'<rect class="cursor" x="{30 + 16 * fs * 0.6}" y="{cy - 12}" width="8" height="15" fill="{KEY}"/>')
    out.append("</svg>")
    return "\n".join(out)


if __name__ == "__main__":
    svg = build(fetch_stats())
    (ROOT / "assets" / "terminal.svg").write_text(svg, encoding="utf-8")
    print("terminal.svg written")
