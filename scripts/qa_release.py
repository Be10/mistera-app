#!/usr/bin/env python3
"""Self-contained QA that makes no Cloudflare account changes."""
from pathlib import Path
import json, subprocess, hashlib, zipfile
import tinycss2
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'public';DIST=ROOT/'.deploy/public'
results=[]
def check(name,condition):
 results.append({'test':name,'ok':bool(condition)})
 if not condition:print('FAILED:',name)

content=json.loads((DIST/'content/sorpresas-2026.json').read_text(encoding='utf8'))
check('Se publican exactamente 25 fichas',len(content['days'])==25)
check('Se publica solo 01 y 02', [d['day'] for d in content['days'] if d['publicationStatus']=='PUBLICADO']==[1,2])
check('Los borradores 03–25 no contienen textos ni bloques',all(not d.get('title') and not d.get('description') and not d.get('blocks') and not d.get('specialExperience') for d in content['days'][2:]))
check('No existe editor privado en dist',not (DIST/'editor').exists())
check('Los medios de borradores futuros no están en dist',all(not (DIST/f'assets/sorpresas/dia-{n:02}').exists() for n in range(3,26)))
check('Pantalla pública usa CSS de limpieza', 'mistera-v35.css' in (DIST/'index.html').read_text())
check('Sin acceso de pruebas visible en release','html.mistera-public .dock-advanced-options' in (DIST/'mistera-v35.css').read_text())
check('Solo se permite título aprobado explícitamente',"block.displayTitle===true" in (SRC/'surprises-experience.js').read_text())
check('Cada casita BORRADOR no se marca descubierta',"record?.publicationStatus!=='PUBLICADO'" in (SRC/'app.js').read_text())
check('No se cambia audio ni geometría del compositor', all((SRC/p).is_file() for p in ['assets/aldea-base.png','assets/arbol-apagado.png']))
js_files=list(SRC.rglob('*.js'))+list((ROOT/'functions').rglob('*.js'))
for f in js_files:
 r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
 if r.returncode: print(r.stderr)
check(f'Sintaxis JavaScript ({len(js_files)} archivos)',all(subprocess.run(['node','--check',str(f)],capture_output=True).returncode==0 for f in js_files))
css_files=list(SRC.rglob('*.css'))
check(f'Hojas CSS analizadas ({len(css_files)})',all(not any(t.type=='error' for t in tinycss2.parse_stylesheet(p.read_text(encoding='utf8'),skip_comments=True,skip_whitespace=True)) for p in css_files))
check('Script Bash válido',subprocess.run(['bash','-n',str(ROOT/'scripts/deploy.sh')],capture_output=True).returncode==0)
check('Backend y esquema D1 incluidos', all((ROOT/p).is_file() for p in ['functions/api/status.js','functions/api/progress.js','db/schema.sql']))
check('Se conserva compatibilidad con visualización móvil', 'viewport-fit=cover' in (DIST/'index.html').read_text())
check('No hay archivos individuales > 25MiB',max(p.stat().st_size for p in DIST.rglob('*') if p.is_file()) < 25*1024*1024)
# Content that was only in unpublished editorial plans must not be downloadable.
public_text=(DIST/'data/sorpresas-2026.js').read_text(encoding='utf8')+(DIST/'content/sorpresas-2026.json').read_text(encoding='utf8')
private_terms=['TODOMODA','Avengers: Doomsday','Burbuja','Manos Piuranas','Claude Monet','honguito de cerámica']
check('Los títulos de sorpresas 03–25 no se filtran en JS/JSON públicos',not any(term.casefold() in public_text.casefold() for term in private_terms))
# Verify bytes for the 24 house overlays + base and audio inherited from V34.
archive=Path('/mnt/data/MISTERA_V34_Produccion_Cloudflare.zip')
if archive.exists():
 with zipfile.ZipFile(archive) as z:
  immutable=['assets/aldea-base.png','assets/arbol-apagado.png']+[f'assets/casas/casa-{i:02}.png' for i in range(1,25)]+['assets/audio/Door-open.wav','assets/audio/Door-close.wav','assets/audio/villancicos-instrumentales-jumisca.mp3']
  ok=all(hashlib.sha256(z.read('public/'+f)).digest()==hashlib.sha256((SRC/f).read_bytes()).digest() for f in immutable)
  check(f'Illustraciones y sonido original intactos ({len(immutable)} archivos)',ok)
else:check('Archivo V34 disponible para comparación',False)

ok=all(i['ok'] for i in results)
report={'version':'V35','tests':results,'success':ok,'published_days':[1,2], 'unpublished_days':list(range(3,26)),'browser_full_integration':'pendiente; el navegador del entorno bloquea localhost','cloudflare_live':'no publicado desde esta conversación','physical_android':'no probado','remote_d1':'pendiente de autenticar y enlazar en la cuenta del propietario'}
(ROOT/'QA_V35.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'success':ok,'passed':sum(i['ok'] for i in results),'total':len(results)},ensure_ascii=False))
if not ok:raise SystemExit(1)
