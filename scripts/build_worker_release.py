#!/usr/bin/env python3
"""V36: construye TEST seguro / TEST privado / PRD sin tocar datos remotos.
TEST con borradores exige indicador de Access en el equipo; no prueba la politica en Cloudflare.
"""
from __future__ import annotations
import argparse, json, os, re, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public'
OUT=ROOT/'.deploy'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('environment',choices=['test','prd'])
    parser.add_argument('--drafts',action='store_true')
    args=parser.parse_args()
    if args.drafts and args.environment!='test':parser.error('--drafts solo se permite en TEST')
    # This is the existing V35 sanitiser; its approved-days guard remains mandatory.
    result=subprocess.run([sys.executable,str(ROOT/'scripts/prepare_publication.py')],cwd=str(ROOT))
    if result.returncode:raise SystemExit(result.returncode)
    sanitized=OUT/'public'
    target=OUT/args.environment
    if target.exists():shutil.rmtree(target)
    if args.environment=='test' and args.drafts:
        marker=ROOT/'scripts/TEST_ACCESS_CONFIRMED'
        locally_confirmed=marker.is_file() and marker.read_text(encoding='utf8').strip()=='ACCESO_TEST_CONFIGURADO'
        build_confirmed=os.environ.get('MISTERA_ACCESS_VERIFIED')=='ACCESO_TEST_CONFIGURADO'
        if not (locally_confirmed or build_confirmed):
            raise SystemExit('ERROR: primero protege TEST con Cloudflare Access y verifica en incógnito; después configura MISTERA_ACCESS_VERIFIED=ACCESO_TEST_CONFIGURADO en Workers Builds.')
        shutil.copytree(SOURCE,target,ignore=shutil.ignore_patterns('qa'))
        # The editor is only allowed on a deliberately access-protected TEST Worker.
    else:
        shutil.copytree(sanitized,target)
    page=target/'index.html'
    html=page.read_text(encoding='utf8')
    if args.environment=='prd':
        # Do not allow URL query flags to enable test-only behaviour in PRD.
        js=target/'app.js'
        src=js.read_text(encoding='utf8')
        needle="const MISTERA_TEST_MODE = new URLSearchParams(location.search).get('mistera-pruebas')==='1';"
        if needle not in src:raise SystemExit('ERROR: no se encontro guardia del modo Pruebas; revisar app.js antes de publicar PRD')
        js.write_text(src.replace(needle,'const MISTERA_TEST_MODE = false;',1),encoding='utf8')
        # Also disable simulation flags in secondary modules so a PRD query string
        # can never redirect persistence into -test keys or disable cloud sync.
        sim_expr="new URLSearchParams(location.search).get('mistera-pruebas')==='1'"
        for mod in ('surprises-store.js','mistera-cloud-sync.js'):
            path=target/mod
            original=path.read_text(encoding='utf8')
            if sim_expr not in original:raise SystemExit('ERROR: control de PRD ausente en '+mod)
            path.write_text(original.replace(sim_expr,'false'),encoding='utf8')
        # Remove the TEST entry in Settings; retain a hidden inert node for existing JS listeners.
        html,replaced=re.subn(r'<details class="dock-advanced-options">\s*<summary>Opciones avanzadas</summary>[\s\S]*?</details>', '<span id="settings-button" hidden aria-hidden="true"></span>',html,count=1)
        if replaced!=1:raise SystemExit('ERROR: no se localizo boton Pruebas de Ajustes')
        # An explicit build marker without modifying the visual identity.
        html=html.replace('class="mistera-public"','class="mistera-public mistera-prd"',1)
        page.write_text(html,encoding='utf8')
        if (target/'editor').exists():raise SystemExit('ERROR: editor privado presente en paquete PRD')
        if (target/'surprise-drafts.js').exists():raise SystemExit('ERROR: surprise-drafts.js privado presente en paquete PRD')
    else:
        # TEST keeps the original setting access. Safe mode has only public days.
        html=html.replace('class="mistera-public"','class="mistera-test"',1)
        if 'mistera-test' not in html:
            html=html.replace('<html lang="es">','<html lang="es" class="mistera-test">',1)
        page.write_text(html,encoding='utf8')
        # Restore source JS test mode when TEST comes from sanitised release.
        if not args.drafts:
            dev_script=SOURCE/'surprise-drafts.js'
            # Do not publish editorial draft code until Access is configured.
            # The test panel still permits clock/day simulation.
            # It can be upgraded by passing --drafts after Access is configured.
    content=json.loads((target/'content'/'sorpresas-2026.json').read_text(encoding='utf8'))
    if args.environment=='prd' or not args.drafts:
        assert all((d.get('blocks')==[] and not d.get('specialExperience')) for d in content['days'] if d.get('publicationStatus')!='PUBLICADO')
    # No admin or database files may be stored in the public website, even for test.
    assert not (target/'db').exists() and not (target/'functions').exists()
    print('OK:',args.environment,'archivos:',sum(p.is_file() for p in target.rglob('*')),'borradores:',args.drafts)
    print('Destino:',target)
if __name__=='__main__':main()
