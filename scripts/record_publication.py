#!/usr/bin/env python3
"""Record approved days only after Wrangler reports a successful deployment."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
p=root/'scripts/published-history.json'
source=root/'public/content/sorpresas-2026.json'
d=json.loads(source.read_text(encoding='utf8'))
old=json.loads(p.read_text(encoding='utf8')) if p.exists() else {'days':[1,2]}
now={x['day'] for x in d['days'] if x.get('publicationStatus')=='PUBLICADO'}
old['days']=sorted(set(old.get('days',[]))|now)
p.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Historial local de días publicados actualizado:',old['days'])
