#!/usr/bin/env python3
"""Zip an existing Next.js export with index.html at the archive root."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
out = root / "out"
if not (out / "index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")

class Metadata(HTMLParser):
    preview = False
    canonical = None
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag == "meta" and props.get("name") == "robots" and "noindex" in props.get("content", ""):
            self.preview = True
        if tag == "link" and props.get("rel") == "canonical":
            self.canonical = props.get("href")

meta = Metadata()
meta.feed((out / "index.html").read_text())
if not meta.preview and not meta.canonical:
    raise SystemExit("Indexable build has no canonical URL; check SITE_URL and rebuild.")
label = "preview-noindex" if meta.preview else "production"
destination = root / "artifacts" / f"sajin-matchum-{label}.zip"
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for path in sorted(out.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(out))
with ZipFile(destination) as archive:
    if archive.testzip() or "index.html" not in archive.namelist():
        raise SystemExit("ZIP verification failed.")
print(f"Archive: {destination}")
print(f"Mode: {label}")
print(f"Canonical: {meta.canonical or 'not configured; preview is noindex'}")
print(f"SHA-256: {sha256(destination.read_bytes()).hexdigest()}")
