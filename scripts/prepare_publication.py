#!/usr/bin/env python3
"""Produce the MISTERA recipient-only Pages directory from private editable sources.

Never upload the source `public/` directly to production. The generated .deploy/public
contains only PUBLICADO days and removes the private planner, notes and future gifts.
No external packages or network access are required.
"""
from __future__ import annotations
import argparse
import copy
import json
import re
import shutil
import sys
from pathlib import Path

PROJECT=Path(__file__).resolve().parents[1]
PRIVATE=PROJECT/'public'
OUT=PROJECT/'.deploy'/'public'
BANNED_TOP={
  'editor','qa','README_V34.md','README_V35.md','QA_V34.json','QA_V35.json',
  'MANIFEST_V34.json','MANIFEST_V35.json','surprise-drafts.js','calibrar-chimeneas.js'
}
BANNED_FIELDS={'editorNotes','mediaPending','description','updatedBy','planningStatus','mediaLabel'}
EDITORIAL=re.compile(r'\b(?:pendiente(?:s)?|por elegir|por seleccionar|aún no|no se ha|sin comprar|idea (?:tentativa|provisional)|tentativ[oa]|propuesta|por configurar|referencia pendiente|no confirmad[oa]|falta(?:n)? por|preferencia:)\b',re.I)

def clean_user_text(v):
    return isinstance(v,str) and v.strip() and not EDITORIAL.search(v)

def clean_published(day):
    d=copy.deepcopy(day)
    for k in BANNED_FIELDS:d.pop(k,None)
    d['title']='' # only explicit text inside an approved scene belongs to the recipient
    for b in d.get('blocks',[]):
        for k in BANNED_FIELDS:b.pop(k,None)
        if b.get('displayTitle') is not True:b.pop('title',None)
        if 'body' in b and not clean_user_text(b['body']):b.pop('body',None)
        for k in ('mediaLabel','editorNotes','planningStatus'):b.pop(k,None)
        if isinstance(b.get('scenes'),list):
            for scene in b['scenes']:
                for k in ('description','title','editorNotes'):scene.pop(k,None)
    return d

def blank_day(day):
    return {
      'day':day['day'],'date':day.get('date',''),
      'unlockAt':day.get('unlockAt',''),
      'publicationStatus':'BORRADOR','blocks':[],
      'title':'','description':'','specialExperience':None,
      'mediaPending':[],
    }

def main():
    p=argparse.ArgumentParser(description='Crea los archivos públicos de MISTERA sin revelar borradores.')
    p.add_argument('--audit-only',action='store_true',help='No genera archivos; audita el contenido.')
    args=p.parse_args()
    source=PRIVATE/'content'/'sorpresas-2026.json'
    content=json.loads(source.read_text(encoding='utf8'))
    days=content.get('days') or []
    if len(days)!=25 or any(d.get('day')!=i for i,d in enumerate(days,1)):
        raise SystemExit('ERROR: calendario editorial inválido; deben existir exactamente los días 01–25.')
    published=[d['day'] for d in days if d.get('publicationStatus')=='PUBLICADO']
    # Days 1 and 2 are already approved. Do not accidentally unpublish them.
    if not {1,2}.issubset(set(published)):
        raise SystemExit('ERROR: los días aprobados 01 y 02 deben seguir como PUBLICADO.')
    # Preserve access to days that were already deployed to the recipient.
    history_path=PROJECT/'scripts'/'published-history.json'
    history=json.loads(history_path.read_text(encoding='utf8')) if history_path.exists() else {'days':[1,2]}
    previously=set(history.get('days') or [])
    unpublished=sorted(previously-set(published))
    if unpublished:
        raise SystemExit('ERROR: no debes despublicar días ya entregados: '+', '.join(f'{n:02}' for n in unpublished)+'. Devuélvelos a PUBLICADO; el progreso se conservará.')

    # The local planner may store user-uploaded images only in IndexedDB. Such
    # references must be converted to real public asset paths before deployment.
    def validate_media(value,day):
        if isinstance(value,dict):
            for item in value.values():validate_media(item,day)
        elif isinstance(value,list):
            for item in value:validate_media(item,day)
        elif isinstance(value,str):
            if value.startswith(('asset:','blob:','file:')):
                raise SystemExit(f'ERROR: día {day:02}: recurso local {value[:52]!r}. Guarda el archivo en public/assets/ y cambia la ruta antes de publicar.')
            if value.startswith('assets/') and not (PRIVATE/value).is_file():
                raise SystemExit(f'ERROR: día {day:02}: no existe el recurso public/{value}.')
    for item in days:
        if item['day'] in published:validate_media(item,item['day'])
    print('Días con contenido publicado:', ', '.join(f'{d:02}' for d in published))
    print('Días con borrador privado:', ', '.join(f'{d:02}' for d in range(1,26) if d not in published))
    if args.audit_only:return
    if OUT.exists():shutil.rmtree(OUT)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    shutil.copytree(PRIVATE,OUT,ignore=shutil.ignore_patterns(*BANNED_TOP))
    # Assets for future days are kept in the private copy only, even if previously uploaded.
    future=OUT/'assets'/'sorpresas'
    if future.is_dir():
        for sub in future.iterdir():
            if not sub.is_dir():continue
            m=re.fullmatch(r'dia-(\d{2})',sub.name)
            if m and int(m.group(1)) not in published:shutil.rmtree(sub)
    sanitized={k:copy.deepcopy(v) for k,v in content.items() if k not in {'privacy','updatedBy','editorNotes'}}
    sanitized['revision']='V35-publico'
    sanitized['environment']='PRODUCCION'
    sanitized['days']=[clean_published(d) if d['day'] in published else blank_day(d) for d in days]
    (OUT/'content'/'sorpresas-2026.json').write_text(json.dumps(sanitized,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (OUT/'data'/'sorpresas-2026.js').write_text('/* MISTERA V35: calendario público sin borradores privados. */\nwindow.MISTERA_SURPRISES_SEED = '+json.dumps(sanitized,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
    html=(OUT/'index.html').read_text(encoding='utf8')
    html=html.replace('<html lang="es">','<html lang="es" class="mistera-public">',1)
    html=re.sub(r'^\s*<script\s+src="surprise-drafts\.js"\s+defer></script>\s*\n','\n',html,flags=re.M)
    # This is a recipient release: the private test panel stays in the developer
    # sources but it has no visible entry point on the published site.
    (OUT/'index.html').write_text(html,encoding='utf8')
    css=OUT/'mistera-v35.css'
    css.write_text(css.read_text(encoding='utf8')+'\n/* Public-only: hidden test tools remain available exclusively in the private project. */\nhtml.mistera-public .dock-advanced-options,html.mistera-public #settings{display:none!important;}\n',encoding='utf8')
    headers=OUT/'_headers'
    headers.write_text('''/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-cache, must-revalidate

/content/*
  Cache-Control: no-store, max-age=0

/assets/*
  Cache-Control: public, max-age=3600
''',encoding='utf8')
    assert not (OUT/'editor').exists(), 'Se detectó un editor dentro del paquete público.'
    assert all(x.get('blocks')==[] and not x.get('specialExperience') for x in sanitized['days'] if x['day'] not in published), 'Un borrador se filtró.'
    for day in range(1,26):
        if day not in published and any(OUT.glob(f'assets/sorpresas/dia-{day:02}/**/*')):
            raise SystemExit(f'ERROR: contenido privado del día {day} en la publicación')
    print(f'\nPublicación lista: {OUT}')
    print('Nota: las sorpresas PUBLICADAS tienen sus recursos visibles técnicamente en el sitio;')
    print('para mantener otras sorpresas secretas, no las marques PUBLICADO antes de tiempo.')
if __name__=='__main__':main()
