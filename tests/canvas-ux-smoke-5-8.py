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
  Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});
  window.WONKUP_API_CONFIG={mode:'mock',kanbanMode:'mock',canvasMode:'mock',appsScriptUrl:'',demoCodesVisible:true,firebase:{}};
  window.confirm=()=>true;
  window.__printCalls=0;
  window.print=()=>{window.__printCalls+=1; setTimeout(()=>window.dispatchEvent(new Event('afterprint')),20)};
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copiedText=text}},configurable:true});
  window.__timerToneStarts=0;
  window.AudioContext=class {
    constructor(){this.state='running';this.currentTime=0;this.destination={};}
    resume(){}
    createOscillator(){return {type:'sine',frequency:{setValueAtTime(){}},connect(){},start(){window.__timerToneStarts+=1},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  };
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1600,'height':1100})
    errors=[]
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
    page.evaluate("location.hash='#/w/w-agora/p/p-taxichurro/canvas/canvas-taxi-lean'")
    page.wait_for_selector('[data-canvas-id="canvas-taxi-lean"]',timeout=15000)
    route=page.evaluate('location.hash')
    assert page.locator('.canvas-build-version').inner_text()=='Motor 5.8.0'

    # Menú lateral colapsable en escritorio.
    assert page.locator('#menu-toggle').count()==1
    assert not page.locator('#app-shell').evaluate("el=>el.classList.contains('sidebar-collapsed')")
    page.click('#menu-toggle')
    assert page.locator('#app-shell').evaluate("el=>el.classList.contains('sidebar-collapsed')")
    page.click('#menu-toggle')
    assert not page.locator('#app-shell').evaluate("el=>el.classList.contains('sidebar-collapsed')")
    print('DESKTOP_SIDEBAR_TOGGLE_OK')

    # El encabezado usa color de marca y no presenta el botón Modo enfoque.
    style=page.locator('.canvas-editor-header').get_attribute('style') or ''
    assert '--canvas-brand:' in style
    assert page.locator('#canvas-focus').count()==0
    print('BRANDED_HEADER_OK')

    # Nueva nota inline: no debe abrir modal.
    initial=page.locator('.canvas-note[data-note-id]').count()
    first_add=page.locator('[data-add-note]').first
    first_add.click()
    page.wait_for_selector('[data-draft-note] .canvas-inline-note-input')
    assert page.locator('#wonkup-modal').count()==0
    page.fill('[data-draft-note] .canvas-inline-note-input','Nota rápida 5.8')
    page.locator('[data-draft-note] .canvas-inline-note-input').press('Control+Enter')
    page.wait_for_function(f"document.querySelectorAll('.canvas-note[data-note-id]').length === {initial+1}")
    assert page.evaluate('location.hash')==route
    assert page.locator('[data-draft-note]').count()==0
    print('INLINE_ADD_OK')

    # Colores rápidos: no debe mostrar nombre del color en la tarjeta.
    quick_note=page.locator('.canvas-note[data-note-id]').filter(has_text='Nota rápida 5.8')
    quick_note.hover()
    color_button=quick_note.locator('[data-note-color="rose"]')
    color_button.click()
    page.wait_for_timeout(80)
    quick_note=page.locator('.canvas-note[data-note-id]').filter(has_text='Nota rápida 5.8')
    assert 'Coral' not in quick_note.inner_text()
    assert page.evaluate('location.hash')==route
    print('QUICK_COLOR_OK')

    # Arrastre estable.
    note_id=quick_note.get_attribute('data-note-id')
    handle=page.locator(f'[data-drag-note="{note_id}"]')
    target=page.locator('[data-drop-section]').nth(2)
    handle.scroll_into_view_if_needed(); target.scroll_into_view_if_needed()
    hb=handle.bounding_box(); tb=target.bounding_box()
    page.mouse.move(hb['x']+8,hb['y']+8); page.mouse.down()
    page.mouse.move(tb['x']+80,tb['y']+100,steps=10); page.mouse.up()
    page.wait_for_timeout(150)
    assert page.evaluate('location.hash')==route
    assert page.locator(f'.canvas-note[data-note-id="{note_id}"]').count()==1
    print('DRAG_OK')

    # Pantalla completa estable y Escape cierra primero el modal.
    page.click('#canvas-fullscreen')
    assert page.evaluate("document.body.classList.contains('canvas-immersive-mode')")
    assert not page.evaluate('Boolean(document.fullscreenElement)')
    page.click('#canvas-history')
    page.wait_for_selector('#wonkup-modal')
    page.keyboard.press('Escape')
    page.wait_for_selector('#wonkup-modal',state='detached')
    assert page.evaluate("document.body.classList.contains('canvas-immersive-mode')")
    print('ESC_MODAL_PRESERVES_IMMERSIVE_OK')

    # Compartir: debe preparar automáticamente un enlace y copiarlo.
    page.click('#canvas-share')
    page.wait_for_selector('#copy-canvas-link',timeout=10000)
    assert page.locator('#share-create-form').count()==1
    page.click('#copy-canvas-link')
    page.wait_for_function("document.querySelector('#copy-feedback').textContent.includes('Enlace copiado')")
    assert '#/share/canvas/' in page.evaluate('window.__copiedText')
    page.click('[data-expand-qr]')
    page.wait_for_selector('.qr-zoom-overlay')
    page.locator('.qr-zoom-close').click()
    page.locator('[data-modal-close]').first.click()
    page.wait_for_selector('#wonkup-modal',state='detached')
    assert page.evaluate("document.body.classList.contains('canvas-immersive-mode')")
    print('SHARE_ONE_STEP_OK')

    # Imprimir/PDF directo: sin modal intermedio.
    page.click('#canvas-print')
    page.wait_for_function('window.__printCalls === 1')
    assert page.locator('#wonkup-modal').count()==0
    page.wait_for_timeout(50)
    assert page.evaluate("document.body.classList.contains('canvas-immersive-mode')")
    print('DIRECT_PRINT_OK')

    # El timer emite tres tonos y muestra una señal visual al terminar.
    page.evaluate("""() => {
      const key='wonkup.canvas.teamTimer';
      localStorage.setItem(key, JSON.stringify({'canvas-taxi-lean':{duration:60,remaining:1,running:true,endsAt:Date.now()+350}}));
      sessionStorage.removeItem(key+'.finished.canvas-taxi-lean');
    }""")
    page.wait_for_function("window.__timerToneStarts === 3",timeout=5000)
    assert page.locator('#canvas-team-timer').evaluate("el=>el.classList.contains('is-finished')")
    assert 'Tiempo terminado' in page.locator('.toast-stack').inner_text()
    print('TIMER_ALARM_OK')

    # Detalle de nota con paleta y códigos hexadecimales.
    quick_note=page.locator(f'.canvas-note[data-note-id="{note_id}"]')
    quick_note.locator('[data-open-note]').click()
    page.wait_for_selector('#wonkup-modal .note-detail-color-palette')
    assert page.locator('#wonkup-modal [name="note-detail-color"]').count()==6
    assert page.locator('#wonkup-modal .note-detail-color-copy code').first.inner_text().startswith('#')
    page.locator('#wonkup-modal [data-modal-close]').first.click()
    page.wait_for_selector('#wonkup-modal',state='detached')
    print('DETAIL_COLOR_PALETTE_OK')

    # Eliminar rápido.
    quick_note=page.locator(f'.canvas-note[data-note-id="{note_id}"]')
    quick_note.hover()
    quick_note.locator('[data-delete-note]').click()
    page.wait_for_function(f"document.querySelectorAll('.canvas-note[data-note-id]').length === {initial}")
    assert page.evaluate('location.hash')==route
    print('QUICK_DELETE_OK')

    # Escape sin modal sale del modo inmersivo.
    page.keyboard.press('Escape')
    assert not page.evaluate("document.body.classList.contains('canvas-immersive-mode')")
    print('ESC_EXITS_IMMERSIVE_OK')

    print('PAGE_ERRORS',errors)
    if errors:
        raise AssertionError(errors)
    page.screenshot(path=str(root/'tests'/'canvas-ux-smoke-5-8.png'),full_page=True)
    browser.close()
print('CANVAS_UX_5_8_OK')
