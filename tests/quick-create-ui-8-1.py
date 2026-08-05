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
  window.WONKUP_API_CONFIG={mode:'mock',kanbanMode:'mock',canvasMode:'mock',deliverableMode:'mock',financeMode:'mock',reportMode:'aggregate',appsScriptUrl:'',demoCodesVisible:true,firebase:{}};
  window.confirm=()=>true;
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda err: errors.append(getattr(err,'stack',None) or str(err)))
    page.set_content(html)
    page.evaluate(storage_mock)
    page.evaluate('''async modules => {
      const imports={};
      for (const [name,code] of Object.entries(modules)) imports[name]=URL.createObjectURL(new Blob([code+'\\n//# sourceURL='+name],{type:'text/javascript'}));
      const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.appendChild(map);
      await import('@wonkup/js/app.js');
    }''',files)
    page.wait_for_selector('#access-code',timeout=15000)
    page.fill('#access-code','WONKUP-ADMIN')
    page.click('#access-submit')
    page.wait_for_selector('#app-shell:not(.auth-shell)',timeout=15000)

    # Alta rápida de cliente sin perder el formulario principal.
    page.evaluate("location.hash='#/w/w-agora/projects'")
    page.wait_for_selector('#new-project',timeout=15000)
    page.click('#new-project')
    page.wait_for_selector('#project-form')
    page.fill('#project-name','Proyecto Quick Create')
    page.click('#open-quick-client')
    page.wait_for_selector('#quick-client-panel:not([hidden])')
    page.fill('#quick-client-name','Cliente Quick 81')
    page.fill('#quick-client-contact','Contacto Quick')
    page.fill('#quick-client-email','cliente.quick81@example.com')
    page.press('#quick-client-email','Enter')
    page.wait_for_function("document.querySelector('#project-client-select').selectedOptions[0]?.textContent === 'Cliente Quick 81'")
    assert page.input_value('#project-name') == 'Proyecto Quick Create'
    assert page.locator('#quick-client-panel').get_attribute('hidden') is not None
    assert 'Cliente creado y seleccionado' in page.locator('.toast-stack').inner_text()
    print('QUICK_CLIENT_OK')
    page.click('[data-modal-close]')
    page.wait_for_selector('#wonkup-modal',state='detached')

    # Alta rápida de persona y asignación inmediata.
    page.evaluate("location.hash='#/w/w-agora/p/p-taxichurro/team'")
    page.wait_for_selector('#add-member',timeout=15000)
    page.click('#add-member')
    page.wait_for_selector('#member-form')
    page.click('#open-quick-user')
    page.wait_for_selector('#quick-user-panel:not([hidden])')
    page.fill('#quick-user-name','Persona Quick 81')
    page.fill('#quick-user-email','persona.quick81@example.com')
    page.click('#save-quick-user')
    page.wait_for_function("document.querySelector('#member-user-select').selectedOptions[0]?.textContent === 'Persona Quick 81'")
    assert page.locator('#quick-user-panel').get_attribute('hidden') is not None
    page.click('#member-submit')
    page.wait_for_selector('#wonkup-modal',state='detached')
    page.wait_for_function("document.querySelector('.team-list')?.textContent.includes('Persona Quick 81')")
    print('QUICK_USER_ASSIGN_OK')

    if errors:
        raise AssertionError(errors)
    page.screenshot(path=str(root/'tests'/'quick-create-ui-8-1.png'),full_page=True)
    browser.close()
print('QUICK_CREATE_UI_8_1_OK')
