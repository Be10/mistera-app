from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html='''<!doctype html><html><body><dialog id="surprise-dialog"><div id="dialog-title"></div><p id="dialog-copy"></p><div id="surprise-draft-content"></div></dialog></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844})
 issues=[];page.on('pageerror',lambda e:issues.append(str(e)))
 page.set_content(html)
 for f in ['data/sorpresas-2026.js','surprises-store.js','mistera-special-days.js','surprises-experience.js']:
    page.add_script_tag(content=(root/'public'/f).read_text(encoding='utf8'))
 # published day 20: story should have arrow icons but no editorial title.
 page.evaluate('''() => {const d=window.MisteraSurprises.get(20); d.publicationStatus='PUBLICADO'; window.MisteraExperience.mount(20,document.getElementById('surprise-draft-content'));}''')
 assert page.locator('.mx-block-title').count()==0, 'Un encabezado editorial aparece en día 20'
 assert page.locator('.mx-story-nav .mx-story-icon').count()==2, 'Navegación de historia rota'
 # day 19 voucher: should show the actual user-facing voucher but not block title.
 page.evaluate('''() => {const d=window.MisteraSurprises.get(19); d.publicationStatus='PUBLICADO'; window.MisteraExperience.mount(19,document.getElementById('surprise-draft-content'));}''')
 assert page.locator('.mx-block-title').count()==0
 assert page.locator('.mx-voucher-label').count()==1
 # Day 11 unpublished: no private title or details even after attempting to mount.
 page.evaluate('''() => window.MisteraExperience.mount(11,document.getElementById('surprise-draft-content'))''')
 assert page.locator('.mx-private-wait').count()==1
 assert 'travesura' not in page.locator('#surprise-draft-content').inner_text().lower()
 # The editor preview may still inspect all work-in-progress blocks.
 page.evaluate('''() => window.MisteraExperience.mount(11,document.getElementById('surprise-draft-content'),{preview:true})''')
 assert page.locator('.mx-block-title').count()==1
 assert not issues, f'Errores JS: {issues}'
 print(json.dumps({'status':'passed','checks':['Historia 20 sin título editorial, flechas intactas','Vale 19 sin encabezado genérico','Día 11 privado oculto','Editor conserva títulos y borradores','Sin errores JS'], 'viewport':'390x844'},ensure_ascii=False))
 browser.close()
