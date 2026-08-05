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
  window.WONKUP_API_CONFIG={mode:'mock',authMode:'mock',projectMode:'mock',kanbanMode:'mock',canvasMode:'mock',deliverableMode:'mock',financeMode:'mock',reportMode:'aggregate',foundationMode:'diagnostic',appsScriptUrl:'',demoCodesVisible:true,firebaseSdkVersion:'12.16.0',firebase:{}};
  window.confirm=()=>true;
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1500,'height':1100})
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
    page.evaluate("location.hash='#/master/cloud'")
    page.wait_for_selector('.cloud-foundation-page',timeout=15000)
    assert 'Cloud Foundation' in page.locator('h1').inner_text()
    assert page.locator('#cloud-migration-counts .cloud-count').count() == 6
    assert 'Completa primero la configuración' in page.locator('#cloud-account-content').inner_text()
    page.click('#preview-cloud-migration')
    assert 'Simulación preparada' in page.locator('#cloud-operation-result').inner_text()
    page.fill('#activation-uid','FirebaseUID123')
    page.fill('#activation-email','usuario.cloud@wonkup.pe')
    page.fill('#activation-name','Usuario Cloud')
    page.check('[data-activation-workspace][value="w-agora"]')
    page.check('[data-activation-project][value="p-taxichurro"]')
    page.click('#preview-user-activation')
    assert 'Plan de permisos preparado' in page.locator('#cloud-activation-result').inner_text()
    assert page.locator('#cloud-activation-counts .cloud-activation-count').count() == 5
    page.click('#run-cloud-diagnostics')
    page.wait_for_function("document.querySelector('#cloud-diagnostics-results')?.textContent.includes('Configuración pública')")
    assert 'Faltan:' in page.locator('#cloud-diagnostics-results').inner_text()
    if errors:
        raise AssertionError(errors)
    page.screenshot(path=str(root/'tests'/'cloud-foundation-ui-9.png'),full_page=True)
    browser.close()
print('CLOUD_FOUNDATION_UI_9_OK')
