from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
code = (root / 'js' / 'bootstrap.js').read_text(encoding='utf-8')
css = (root / 'css' / 'components.css').read_text(encoding='utf-8')
html = f'''<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1100, 'height': 760})
    page.set_content(html)
    page.evaluate("window.WONKUP_APP_ENTRY='data:text/javascript,throw new Error(%22Fallo%20controlado%209%22)'")
    page.evaluate('''async code => {
      const url = URL.createObjectURL(new Blob([code + '\\n//# sourceURL=bootstrap-test.js'], {type:'text/javascript'}));
      await import(url);
    }''', code)
    page.wait_for_selector('.startup-failure-card', timeout=10000)
    assert 'WonkUp no pudo iniciar' in page.locator('h1').inner_text()
    assert 'Fallo controlado 9' in page.locator('.startup-failure-detail').inner_text()
    page.screenshot(path=str(root / 'tests' / 'startup-fallback-ui-9.png'), full_page=True)
    browser.close()
print('STARTUP_FALLBACK_UI_9_OK')
