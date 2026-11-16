"""Crea derivados WebP de los recursos utilizados; nunca modifica originales.
Requiere Pillow con soporte WebP. Ejecutar desde cualquier directorio.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, features
from io import BytesIO
import hashlib
import json
import math
import re

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'img' / 'optimized'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def validate_preoptimized(entry, uses):
    """Inventaría archivos ya preparados sin volver a codificarlos ni moverlos."""
    assets = [{'path': entry['source'], **{key: entry[key] for key in ['width', 'height', 'bytes', 'sha256']}}, *entry['variants']]
    for asset in assets:
        path = ROOT / asset['path'].lstrip('/')
        if path.parent not in (ROOT / 'img', DEST) or path.is_symlink():
            raise RuntimeError('Referencia preoptimizada no admitida: ' + asset['path'])
        data = path.read_bytes()
        with Image.open(path) as image:
            if image.format != 'WEBP' or image.size != (asset['width'], asset['height']):
                raise RuntimeError('Formato o dimensiones incorrectos: ' + asset['path'])
        if len(data) != asset['bytes'] or digest(data) != asset['sha256']:
            raise RuntimeError('Actualizar el inventario antes de usar la imagen: ' + asset['path'])
    return {**entry, 'uses': sorted(set(uses))}

def main():
    if not features.check('webp'):
        raise RuntimeError('Pillow necesita soporte WebP; no se instala nada automáticamente.')
    if DEST.is_symlink():
        raise RuntimeError('El directorio de salida no puede ser un enlace simbólico.')
    previous_manifest = DEST / 'manifest.json'
    previous = {}
    previous_paths = set()
    if previous_manifest.exists():
        previous = json.loads(previous_manifest.read_text())
        previous_paths = {v['path'] for e in previous.values() for v in e['variants']}
    sources = [*sorted((ROOT / 'js' / 'pages').glob('*.js')), ROOT / 'css/styles.css', ROOT / 'templates/base.html']
    used = {'favicon-logo.png': ['templates/base.html']}
    for source in sources:
        for name in re.findall(r'''["'](?:\.\./|/)?img/([^"']+)["']''', source.read_text()):
            if name.startswith('optimized/') or '${' in name:
                continue
            used.setdefault(name, []).append(str(source.relative_to(ROOT)))
    # Conservar las familias archivadas y las aportadas ya optimizadas. Nunca
    # retirar estos archivos automáticamente aunque dejen de tener referencias.
    entries = {key: {**entry, 'uses': []} for key, entry in previous.items()
               if entry.get('retained') or entry.get('preoptimized')}
    for name in sorted(used):
        key = '/img/' + name
        if previous.get(key, {}).get('preoptimized'):
            entries[key] = validate_preoptimized(previous[key], used[name])
            print(name, '→ WebP aportados, sin recodificar', flush=True)
            continue
        original = ROOT / 'img' / name
        if original.parent != ROOT / 'img' or original.is_symlink():
            raise RuntimeError('Referencia de imagen no admitida: ' + name)
        data = original.read_bytes()
        with Image.open(original) as image:
            if image.getexif().get(274, 1) != 1:
                raise RuntimeError('Revisar orientación antes de optimizar: ' + name)
            width, height = image.size
            if name == 'favicon-logo.png':
                widths = [64]
            elif name == 'bg.jpg':
                widths = [width]
            else:
                widths = sorted({min(width, 480), min(width, 960)})
            entry = {'source': '/img/' + name, 'width': width, 'height': height,
                     'format': image.format, 'bytes': len(data), 'sha256': digest(data),
                     'uses': sorted(set(used[name])), 'variants': []}
            candidates = []
            for target_width in widths:
                target_height = round(height * target_width / width)
                resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS) if target_width != width else image.copy()
                chosen = None
                for quality in ([100] if name == 'favicon-logo.png' else [90, 88, 86, 84, 82, 80, 78]):
                    buffer = BytesIO()
                    resized.save(buffer, format='WEBP', quality=quality, method=6,
                                 lossless=name == 'favicon-logo.png', icc_profile=image.info.get('icc_profile', b''))
                    encoded = buffer.getvalue()
                    # Conservar solo variantes que ahorren al menos 8% y 4 KiB.
                    if len(encoded) <= len(data) * .92 and len(data) - len(encoded) >= 4096:
                        chosen = (encoded, quality)
                        break
                if chosen is None:
                    candidates = []
                    entry['reason'] = 'No se conserva un conjunto WebP sin ahorro apreciable en todos los tamaños.'
                    break
                encoded, quality = chosen
                with Image.open(BytesIO(encoded)) as decoded:
                    rms = ImageStat.Stat(ImageChops.difference(resized.convert('RGB'), decoded.convert('RGB'))).rms
                    mse = sum(v*v for v in rms) / 3
                candidates.append((f'{original.stem}-{target_width}.webp', encoded, {
                    'width': target_width, 'height': target_height, 'bytes': len(encoded), 'quality': quality,
                    'lossless': name == 'favicon-logo.png', 'sha256': digest(encoded),
                    'psnr': round(10 * math.log10(255**2 / mse), 2) if mse else None
                }))
            # Evitar duplicar un recurso casi del mismo peso: conservar el mayor
            # y solo tamaños pequeños con al menos 10% y 4 KiB de ahorro extra.
            if len(candidates) > 1:
                largest = candidates[-1]
                candidates = [c for c in candidates[:-1]
                              if len(c[1]) <= len(largest[1]) * .90 and len(largest[1]) - len(c[1]) >= 4096] + [largest]
            DEST.mkdir(exist_ok=True)
            for filename, encoded, variant in candidates:
                target = DEST / filename
                if target.is_symlink():
                    raise RuntimeError('La salida no puede ser un enlace simbólico: ' + filename)
                target.write_bytes(encoded)
                entry['variants'].append({'path': '/img/optimized/' + filename, **variant})
            if digest(original.read_bytes()) != entry['sha256']:
                raise RuntimeError('Se ha alterado un original: ' + name)
            entries['/img/' + name] = entry
            print(name, len(data), '→', [(v['width'], v['bytes'], v['quality']) for v in entry['variants']], flush=True)
    manifest = DEST / 'manifest.json'
    if manifest.is_symlink():
        raise RuntimeError('El manifiesto no puede ser un enlace simbólico.')
    current_paths = {v['path'] for e in entries.values() for v in e['variants']}
    # Solo se retiran derivados gestionados por el manifiesto anterior; nunca
    # originales ni otros archivos que alguien haya colocado en el directorio.
    for old_path in sorted(previous_paths - current_paths):
        old_file = ROOT / old_path.lstrip('/')
        if old_file.parent != DEST or old_file.suffix != '.webp' or old_file.is_symlink():
            raise RuntimeError('No se puede retirar un derivado fuera del directorio optimizado.')
        old_file.unlink(missing_ok=True)
    manifest.write_text(json.dumps(dict(sorted(entries.items())), ensure_ascii=False, indent=2) + '\n')
    print('Originales utilizados:', len(entries), 'Derivados:', sum(len(e['variants']) for e in entries.values()))

if __name__ == '__main__':
    main()
