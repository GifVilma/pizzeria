"""Verifica las familias WebP existentes, sin recodificar ni escribir archivos.
Los originales se conservan fuera del repositorio; el sitio usa solo optimized.
Se mantiene la entrada images:optimize por compatibilidad con el proyecto.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'img' / 'optimized'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def validate_preoptimized(entry, uses):
    """Comprueba las rutas y metadatos conocidos sin modificar los WebP."""
    source = {'path': entry['source'], 'width': entry['sourceWidth'],
              'height': entry['sourceHeight'], 'bytes': entry['bytes'], 'sha256': entry['sha256']}
    for asset in [source, *entry['variants']]:
        path = ROOT / asset['path'].lstrip('/')
        if path.parent != DEST or path.is_symlink():
            raise RuntimeError('Todos los recursos deben estar en img/optimized: ' + asset['path'])
        data = path.read_bytes()
        if len(data) != asset['bytes'] or digest(data) != asset['sha256']:
            raise RuntimeError('Recurso distinto del WebP aprobado: ' + asset['path'])
        with Image.open(path) as image:
            if image.format != 'WEBP' or image.size != (asset['width'], asset['height']):
                raise RuntimeError('Formato o dimensiones incorrectos: ' + asset['path'])
    return {**entry, 'uses': sorted(set(uses))}

def main():
    if DEST.is_symlink():
        raise RuntimeError('El directorio de recursos no puede ser un enlace simbólico.')
    manifest = json.loads((DEST / 'manifest.json').read_text())
    for entry in manifest.values():
        validate_preoptimized(entry, entry['uses'])
    print('Familias WebP existentes verificadas:', len(manifest))
    print('No se han optimizado fotografías ni escrito o eliminado recursos.')

if __name__ == '__main__':
    main()
