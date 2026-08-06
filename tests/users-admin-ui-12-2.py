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

files['@wonkup/js/services/managed-users-service.js'] = '''
const directory={
  workspaces:[{id:'w-agora',name:'Ágora Education'},{id:'w-wonkup',name:'WonkUp'}],
  projects:[{id:'p-taxichurro',workspaceId:'w-agora',name:'TaxiChurro',code:'AG-001'}]
};
let users=[
  {uid:'uid-admin',email:'admin@wonkup.pe',name:'Admin WonkUp',disabled:false,emailVerified:true,createdAt:'2026-08-01',lastSignInAt:'2026-08-06',profile:{name:'Admin WonkUp',email:'admin@wonkup.pe',role:'superadmin',roleLabel:'Superadministrador',status:'active',workspaceIds:['*'],projectIds:['*']}},
  {uid:'uid-colab',email:'colab@wonkup.pe',name:'Colaborador Demo',disabled:false,emailVerified:false,createdAt:'2026-08-05',lastSignInAt:'',profile:{name:'Colaborador Demo',email:'colab@wonkup.pe',role:'collaborator',roleLabel:'Colaborador',status:'active',workspaceIds:['w-agora'],projectIds:['p-taxichurro']}}
];
export const ManagedUsersService={
  list:async()=>({release:'12.2.0',users,directory}),
  invite:async input=>{users.push({uid:'uid-new',email:input.email,name:input.name,disabled:false,emailVerified:false,createdAt:new Date().toISOString(),lastSignInAt:'',profile:{...input,roleLabel:'Colaborador',status:'active'}});return {email:input.email};},
  update:async()=>({ok:true}),
  setStatus:async()=>({ok:true}),
  sendInvitationEmail:async()=>({ok:true})
};
'''

css='\n'.join(p.read_text(encoding='utf-8') for p in [root/'css/tokens.css',root/'css/themes.css',root/'css/layout.css',root/'css/components.css',root/'css/responsive.css'])
html=f'''<!doctype html><html lang="es" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>{css}</style></head><body><div id="app"></div><div id="status-region" class="sr-only" role="status" aria-live="polite"></div><div id="alert-region" class="sr-only" role="alert" aria-live="assertive"></div></body></html>'''
storage_mock='''() => {
  const makeStorage=()=>{const data=new Map();return {get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.has(String(k))?data.get(String(k)):null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),_data:data};};
  Object.defineProperty(window,'localStorage',{value:makeStorage(),configurable:true});
  Object.defineProperty(window,'sessionStorage',{value:makeStorage(),configurable:true});
  if (!window.BroadcastChannel) window.BroadcastChannel=class { addEventListener(){} postMessage(){} close(){} };
  window.WONKUP_API_CONFIG={mode:'mock',authMode:'mock',projectMode:'mock',kanbanMode:'mock',canvasMode:'mock',deliverableMode:'mock',financeMode:'mock',reportMode:'aggregate',foundationMode:'diagnostic',functionsRegion:'us-central1',appsScriptUrl:'',demoCodesVisible:true,firebaseSdkVersion:'12.16.0',firebase:{}};
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
    page.evaluate("location.hash='#/master/users'")
    page.wait_for_selector('.users-admin-page',timeout=15000)
    assert page.locator('.managed-user-card').count() == 2
    assert 'Usuarios e invitaciones' in page.locator('h1').inner_text()
    page.click('#invite-managed-user')
    page.fill('#managed-user-name','Nueva Colaboradora')
    page.fill('#managed-user-email','nueva@wonkup.pe')
    page.select_option('#managed-user-role','collaborator')
    page.check('[data-user-workspace][value="w-agora"]')
    page.check('[data-user-project][value="p-taxichurro"]')
    page.click('#managed-user-submit')
    page.wait_for_selector('#wonkup-modal',state='detached',timeout=15000)
    page.wait_for_function("document.querySelectorAll('.managed-user-card').length===3")
    assert not errors, errors
    page.screenshot(path=str(root/'tests'/'users-admin-ui-12-2.png'),full_page=True)
    browser.close()
print('USERS_ADMIN_UI_12_2_OK')
