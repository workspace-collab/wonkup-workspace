from pathlib import Path
from urllib.parse import urlsplit
import json, re, posixpath
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
files={}
for base in ('js','data'):
    for p in (root/base).rglob('*.js'):
        rel=p.relative_to(root).as_posix()
        code=p.read_text(encoding='utf-8')
        def repl(m):
            spec=m.group(1)
            if not spec.startswith('.'):
                return m.group(0)
            clean=urlsplit(spec).path
            resolved=posixpath.normpath(posixpath.join(posixpath.dirname(rel),clean))
            return m.group(0).replace(spec, '@wonkup/'+resolved)
        code=re.sub(r"from\s+['\"]([^'\"]+)['\"]", repl, code)
        code=re.sub(r"import\s+['\"]([^'\"]+)['\"]", repl, code)
        files['@wonkup/'+rel]=code

css='\n'.join(p.read_text(encoding='utf-8') for p in [root/'css/tokens.css',root/'css/themes.css',root/'css/layout.css',root/'css/components.css',root/'css/responsive.css'])
html=f'''<!doctype html><html lang="es" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>{css}</style></head><body><div id="app"></div><div id="status-region" class="sr-only" role="status" aria-live="polite"></div><div id="alert-region" class="sr-only" role="alert" aria-live="assertive"></div></body></html>'''

storage_mock='''() => {
  const makeStorage=()=>{const data=new Map();return {get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.has(String(k))?data.get(String(k)):null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),_data:data};};
  Object.defineProperty(window,'localStorage',{value:makeStorage(),configurable:true});
  Object.defineProperty(window,'sessionStorage',{value:makeStorage(),configurable:true});
  if (!window.BroadcastChannel) window.BroadcastChannel=class { addEventListener(){} postMessage(){} close(){} };
  window.WONKUP_API_CONFIG={mode:'mock',kanbanMode:'mock',canvasMode:'mock',appsScriptUrl:'',demoCodesVisible:true,firebase:{}};
  window.confirm=()=>true;
  if (!HTMLElement.prototype.requestFullscreen) HTMLElement.prototype.requestFullscreen=async function(){Object.defineProperty(document,'fullscreenElement',{value:this,configurable:true}); document.dispatchEvent(new Event('fullscreenchange'));};
  if (!document.exitFullscreen) document.exitFullscreen=async function(){Object.defineProperty(document,'fullscreenElement',{value:null,configurable:true}); document.dispatchEvent(new Event('fullscreenchange'));};
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1600,'height':1100})
    console=[]; errors=[]
    page.on('console',lambda msg: console.append(f'{msg.type}: {msg.text}'))
    page.on('pageerror',lambda err: errors.append(getattr(err,'stack',None) or str(err)))
    page.set_content(html)
    page.evaluate(storage_mock)
    page.evaluate('''async modules => {
      const imports={};
      for (const [name,code] of Object.entries(modules)) imports[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.appendChild(map);
      await import('@wonkup/js/app.js');
    }''',files)
    page.wait_for_selector('#access-code',timeout=15000)
    page.fill('#access-code','WONKUP-ADMIN')
    page.click('#access-submit')
    page.wait_for_selector('#app-shell:not(.auth-shell)',timeout=15000)
    # Reproduce el flujo real del usuario: proyecto -> pestaña Canvases -> Abrir.
    page.evaluate("location.hash='#/w/w-agora/p/p-taxichurro/innovation'")
    page.wait_for_selector('.toolkit-embedded .canvas-instance-card', timeout=15000)
    page.locator('a[href="#/w/w-agora/p/p-taxichurro/canvas/canvas-taxi-lean"]').click()
    page.wait_for_selector('[data-canvas-id="canvas-taxi-lean"]',timeout=15000)
    route=page.evaluate('location.hash')
    print('ROUTE_START',route)
    assert route=='#/w/w-agora/p/p-taxichurro/canvas/canvas-taxi-lean'
    page.wait_for_selector('.canvas-build-version', timeout=10000)
    assert page.locator('.canvas-build-version').inner_text()=='Motor 5.6.0'

    # Add 20 notes through the real modal flow. Use global add button, selecting sections cyclically.
    page.click('#canvas-fullscreen')
    page.wait_for_timeout(150)
    assert page.evaluate('Boolean(document.fullscreenElement)')
    print('FULLSCREEN_ACTIVE')

    initial=page.locator('.canvas-note').count()
    for i in range(20):
        page.click('#canvas-add-note')
        page.wait_for_selector('#canvas-note-form')
        page.fill('#canvas-note-text',f'Prueba estable {i+1}')
        # Open options every few iterations and choose a deterministic section.
        if i%3==0:
            page.locator('.note-advanced-options summary').click()
            options=page.locator('#canvas-note-section option').count()
            page.select_option('#canvas-note-section',index=i%options)
        page.click('#canvas-note-form button[type="submit"]')
        page.wait_for_selector('#wonkup-modal',state='detached',timeout=10000)
        page.wait_for_timeout(30)
        current=page.evaluate('location.hash')
        if current!=route:
            raise AssertionError(f'Route changed after add {i+1}: {current}')
        if page.locator('[data-canvas-id="canvas-taxi-lean"]').count()!=1:
            raise AssertionError(f'Canvas missing after add {i+1}')
    final=page.locator('.canvas-note').count()
    print('ADD_COUNTS',initial,final)
    assert final==initial+20,(initial,final)

    # Repeated drag across two visible sections using real pointer events.
    handle=page.locator('[data-drag-note]').first
    note_id=handle.get_attribute('data-drag-note')
    stacks=page.locator('[data-drop-section]')
    stack_count=stacks.count()
    assert stack_count>=2
    for i in range(20):
        handle=page.locator(f'[data-drag-note="{note_id}"]')
        target=stacks.nth((i+1)%stack_count)
        hb=handle.bounding_box(); tb=target.bounding_box()
        if not hb or not tb:
            target.scroll_into_view_if_needed(); handle.scroll_into_view_if_needed(); hb=handle.bounding_box(); tb=target.bounding_box()
        page.mouse.move(hb['x']+12,hb['y']+10)
        page.mouse.down()
        page.mouse.move(tb['x']+min(100,tb['width']/2),tb['y']+min(120,tb['height']/2),steps=10)
        page.mouse.up()
        page.wait_for_timeout(120)
        current=page.evaluate('location.hash')
        if current!=route:
            raise AssertionError(f'Route changed after drag {i+1}: {current}')
        if page.locator('[data-canvas-id="canvas-taxi-lean"]').count()!=1:
            raise AssertionError(f'Canvas missing after drag {i+1}')
    print('DRAG_20_OK',note_id)

    # Edit after movement.
    page.locator(f'.canvas-note[data-note-id="{note_id}"] [data-open-note]').click()
    page.wait_for_selector('#note-detail-form')
    page.fill('#note-detail-text','Nota editada después de veinte movimientos')
    page.click('#note-detail-form button[type="submit"]')
    page.wait_for_selector('#wonkup-modal',state='detached',timeout=10000)
    assert page.evaluate('location.hash')==route
    assert 'Nota editada después' in page.locator(f'.canvas-note[data-note-id="{note_id}"] p').inner_text()
    print('EDIT_AFTER_DRAG_OK')

    # Persistence: re-render route and ensure note remains.
    page.evaluate("window.dispatchEvent(new HashChangeEvent('hashchange'))")
    page.wait_for_selector('[data-canvas-id="canvas-taxi-lean"]',timeout=10000)
    assert page.evaluate('location.hash')==route
    assert page.locator(f'.canvas-note[data-note-id="{note_id}"]').count()==1
    print('PERSISTENCE_RERENDER_OK')

    print('PAGE_ERRORS',errors)
    if errors:
        raise AssertionError(errors)
    output = root / 'tests' / 'canvas-engine-smoke.png'
    page.screenshot(path=str(output), full_page=True)
    browser.close()
print('FULL_APP_CANVAS_SMOKE_OK')
