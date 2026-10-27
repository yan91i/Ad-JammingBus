from pathlib import Path
import json, glob
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
report={"layouts":[],"levels":[],"errors":[]}
with sync_playwright() as p:
    choices=glob.glob('/opt/pw-browsers/chromium-*/**/chrome',recursive=True)
    kwargs={"headless":True,"args":["--no-sandbox"]}
    if choices: kwargs['executable_path']=choices[0]
    browser=p.chromium.launch(**kwargs)
    page=browser.new_page(viewport={"width":430,"height":932},device_scale_factor=2)
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.goto((ROOT/'index.html').as_uri())
    page.wait_for_function('window.BusLoop')
    for w,h in [(320,568),(390,844),(430,932),(757,1248),(1440,900),(844,390)]:
        page.set_viewport_size({"width":w,"height":h})
        page.wait_for_timeout(100)
        rect=page.locator('canvas').bounding_box()
        assert rect['x']>=-1 and rect['x']+rect['width']<=w+1,rect
        assert abs(rect['width']/rect['height']-480/820)<.005,rect
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        report['layouts'].append({"viewport":[w,h],"canvas":rect,"passed":True})
    page.set_viewport_size({"width":430,"height":932})
    page.evaluate('BusLoop.setFast(true)')
    for n in range(12):
        page.evaluate('(n)=>BusLoop.reset(n)',n)
        ids=page.evaluate('BusLoop.state.solution')
        for id in ids:
            assert page.evaluate('(id)=>BusLoop.clear(id)',id)
            assert page.evaluate('(id)=>BusLoop.dispatch(id)',id)
        st=page.evaluate('BusLoop.state')
        assert st['status']=='won' and not st['queue'] and all(x is None for x in st['slots'])
        report['levels'].append({"level":n+1,"buses":len(ids),"delivered":st['delivered'],"passed":True})
    page.evaluate('BusLoop.reset(4)')
    before=page.evaluate('BusLoop.state')
    page.evaluate('BusLoop.dispatch(BusLoop.state.solution[0])')
    page.evaluate('BusLoop.undo()')
    assert page.evaluate('BusLoop.state')==before
    report['undo']=True
    blocked=page.evaluate('BusLoop.state.buses.find(b=>!BusLoop.clear(b.id))?.id')
    if blocked is not None:
        assert page.evaluate('(id)=>BusLoop.dispatch(id)',blocked)==False
        assert page.evaluate('BusLoop.state')==before
    report['blocking']=blocked is not None
    page.evaluate('BusLoop.setFast(false)')
    id=page.evaluate('BusLoop.state.solution[0]')
    page.evaluate('(id)=>{window.action=BusLoop.dispatch(id)}',id)
    assert page.evaluate('BusLoop.busy')
    assert page.evaluate('(id)=>BusLoop.dispatch(id)',id)==False
    page.wait_for_function('!BusLoop.busy')
    report['animation_and_input_lock']=True
    page.evaluate('BusLoop.reset(9)')
    page.wait_for_timeout(150)
    page.screenshot(path=str(ROOT.parent/'BusLoop_V4_preview.png'))
    assert not report['errors'],report['errors']
    browser.close()
(ROOT/'tests/report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
