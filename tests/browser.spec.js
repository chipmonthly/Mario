import {test,expect} from '@playwright/test';

test('keyboard gameplay collects coins, pause freezes time, restart resets the run',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/墨境/);await page.locator('[data-mode="classic"]').click();
  await page.locator('#start-button').click();
  await expect(page.locator('#start-overlay')).toBeHidden();
  const stage=await page.locator('#game-viewport').boundingBox();expect(stage.y+stage.height).toBeLessThanOrEqual(1001);
  await page.keyboard.down('KeyD');await page.keyboard.down('Space');await page.waitForTimeout(450);await page.keyboard.up('Space');await page.waitForTimeout(200);await page.keyboard.up('KeyD');
  await expect(page.locator('#coin-count')).not.toHaveText('00');
  await page.keyboard.press('KeyP');await expect(page.locator('#status-title')).toHaveText('且听风吟');
  const clock=await page.locator('#time-count').textContent();await page.waitForTimeout(1100);await expect(page.locator('#time-count')).toHaveText(clock);
  await page.locator('#status-primary').click();await expect(page.locator('#status-overlay')).toBeHidden();
  await page.locator('#restart-button').click();await expect(page.locator('#coin-count')).toHaveText('00');await expect(page.locator('#life-count')).toHaveText('03');
  expect(errors).toEqual([]);
});

test('all eight regions, co-op, split-screen race and tide are selectable',async({page})=>{test.setTimeout(60000);
  await page.goto('/');
  await page.locator('[data-players="2"]').click();await expect(page.locator('#mode-status')).toContainText('双人');
  await page.locator('[data-mode="race"]').click();await expect(page.locator('[data-players="2"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#start-button').click();await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowUp');await page.waitForTimeout(250);await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  await expect(page.locator('#race-scores')).toBeVisible();
  await page.locator('[data-mode="tide"]').click();await expect(page.locator('#mode-status')).toContainText('墨潮追逐');
  for(const [chapter,title] of [[1,'云山问道'],[2,'月下听澜'],[3,'丹霞古寺'],[4,'不夜灯市'],[5,'听泉溶洞'],[6,'霜岭归灯'],[7,'星河旧卷'],[0,'竹林初晴']]){
    await page.locator(`[data-chapter="${chapter}"]`).click();await expect(page.locator('#chapter-title')).toHaveText(title);await page.locator('#start-button').click();await expect(page.locator('#game-status')).toHaveText('正在探索山河');
  }
});

test('guide is accessible, pauses an active run, and audio toggles',async({page})=>{
  await page.goto('/');await page.locator('#start-button').click();await page.locator('#nav-help').click();
  await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('#game-status')).toHaveText('片刻小憩');
  await page.locator('#help-play').click();await expect(page.getByRole('dialog')).toBeHidden();await expect(page.locator('#game-status')).toHaveText('正在探索山河');
  await page.locator('#sound-button').click();await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','true');
  await page.locator('#sound-button').click();await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','false');
});

test('mobile layout fits the screen and touch buttons drive gameplay',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();
  await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#mobile-controls')).toBeVisible();
  const dims=await page.locator('#game').evaluate(c=>({width:c.width,height:c.height,ratio:c.clientWidth/c.clientHeight}));expect(Math.abs(dims.width/dims.height-dims.ratio)).toBeLessThan(.01);
  await page.locator('#start-button').tap();
  await expect(page.locator('body')).toHaveClass(/touch-immersive/);
  const canvasBounds=await page.locator('#game').boundingBox(),dockBounds=await page.locator('#mobile-controls').boundingBox();
  expect(canvasBounds.y+canvasBounds.height).toBeLessThanOrEqual(dockBounds.y+1);
  const right=await page.locator('[data-touch-player="0"] [data-control="right"]').boundingBox(),jump=await page.locator('[data-touch-player="0"] [data-control="jump"]').boundingBox();
  const cdp=await context.newCDPSession(page);
  const r={x:right.x+right.width/2,y:right.y+right.height/2,id:1},j={x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r,j]});
  await page.waitForTimeout(450);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[j]});
  await page.waitForTimeout(200);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#coin-count')).not.toHaveText('00');
  await page.screenshot({path:'/tmp/mario-mobile.png',fullPage:true});await context.close();
});

test('story, journal, hunt and zen explain their goals and remember control preferences',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await page.locator('#auto-jump').check();await page.locator('#large-controls').check();
  await page.locator('[data-mode="hunt"]').click();await expect(page.locator('#quest-text')).toContainText('0/5');
  await page.locator('[data-mode="zen"]').click();await expect(page.locator('#life-count')).toHaveText('∞');
  await page.locator('#start-button').click();await expect(page.locator('#story-speaker')).toHaveText('纸鹤信使');await expect(page.locator('#story-text')).toContainText('纸狐阿砚');
  await page.locator('#journal-button').click();await expect(page.locator('#journal-dialog')).toBeVisible();await expect(page.locator('.journal-entry').first()).toContainText('画卷');
  await page.locator('#close-journal').click();await page.reload();await expect(page.locator('#auto-jump')).toBeChecked();await expect(page.locator('#large-controls')).toBeChecked();
  await page.locator('[data-mode="classic"]').click();await page.locator('[data-chapter="2"]').click();await expect(page.locator('#quest-text')).toContainText('灯台');
  await page.locator('[data-chapter="3"]').click();await expect(page.locator('#quest-text')).toContainText('古寺铜钟');expect(errors).toEqual([]);
});

test('tablet supports four simultaneous fingers and keeps player controls independent',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1180,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await page.locator('[data-players="2"]').click();await page.locator('#start-button').tap();
  await expect(page.locator('.touch-bank').nth(1)).toBeVisible();
  const point=async(player,control,id)=>{const r=await page.locator(`[data-touch-player="${player}"] [data-control="${control}"]`).boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);return {x:r.x+r.width/2,y:r.y+r.height/2,id};};
  const r=await point(0,'right',1),j=await point(0,'jump',2),l=await point(1,'left',3),k=await point(1,'jump',4);
  const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r,j,l,k]});
  await expect(page.locator('.is-held')).toHaveCount(4);await page.waitForTimeout(300);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[l,k]});
  await expect(page.locator('[data-touch-player="0"] .is-held')).toHaveCount(2);await expect(page.locator('[data-touch-player="1"] .is-held')).toHaveCount(0);
  await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('.is-held')).toHaveCount(0);
  await expect(page.locator('#coin-count')).not.toHaveText('00');
  await page.screenshot({path:'/tmp/ink-tablet-two-players.png'});
  await page.locator('#immersive-pause').tap();await expect(page.locator('#status-overlay')).toBeVisible();
  await page.locator('#leave-immersive').tap();await expect(page.locator('body')).not.toHaveClass(/touch-immersive/);
  expect(errors).toEqual([]);await context.close();
});

test('phone landscape resize preserves aspect, sliding reverses direction, and cancellation releases input',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();await page.goto('/');await page.locator('#start-button').tap();
  const canvas=await page.locator('#game').evaluate(c=>({width:c.width,height:c.height,ratio:c.clientWidth/c.clientHeight}));expect(canvas.height).toBe(420);expect(Math.abs(canvas.width/canvas.height-canvas.ratio)).toBeLessThan(.01);
  const box=async(control)=>{const b=await page.locator(`[data-touch-player="0"] [data-control="${control}"]`).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2,id:1};};
  const right=await box('right'),left=await box('left'),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});await expect(page.locator('[data-touch-player="0"] [data-control="right"]')).toHaveClass(/is-held/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left]});await expect(page.locator('[data-touch-player="0"] [data-control="left"]')).toHaveClass(/is-held/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await expect(page.locator('.is-held')).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
  const portrait=await page.locator('#game').evaluate(c=>({width:c.width,height:c.height,ratio:c.clientWidth/c.clientHeight}));expect(portrait.height).toBe(600);expect(Math.abs(portrait.width/portrait.height-portrait.ratio)).toBeLessThan(.01);
  await page.locator('#leave-immersive').tap();await page.locator('#large-controls').check();await page.locator('#touch-focus').tap();
  const key=await page.locator('[data-touch-player="0"] [data-control="jump"]').boundingBox();expect(key.width).toBeGreaterThanOrEqual(72);expect(key.height).toBeGreaterThanOrEqual(90);
  await context.close();
});

test('world map shows connected routes, gates unvisited fast travel and retains a real region transition',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('[data-mode="world"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#world-map-button').click();await expect(page.locator('#world-map-dialog')).toBeVisible();await expect(page.locator('.world-node')).toHaveCount(8);await expect(page.locator('#world-links line')).toHaveCount(13);
 await page.locator('[data-region="7"]').click();await expect(page.locator('#map-message')).toContainText('探索');await expect(page.locator('#chapter-title')).toHaveText('竹林初晴');await page.locator('#close-map').click();
 await page.locator('#start-button').click();await page.keyboard.down('KeyD');await expect(page.locator('#interaction-hint')).toContainText('不夜灯市');await page.keyboard.up('KeyD');
 await expect(page.locator('#interaction-hint')).toContainText('不夜灯市');await page.keyboard.press('KeyS');await expect(page.locator('#chapter-title')).toHaveText('不夜灯市');
 await page.locator('#world-map-button').click();await expect(page.locator('[data-region="4"]')).toHaveClass(/visited/);await page.locator('#close-map').click();
 await page.reload();await expect(page.locator('#chapter-title')).toHaveText('不夜灯市');
 await page.locator('#world-map-button').click();await page.locator('[data-region="0"]').click();await expect(page.locator('#chapter-title')).toHaveText('竹林初晴');expect(errors).toEqual([]);
});

test('paper bridge is a real resource, auto-save survives reload and journey can be exported',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#start-button').click();
 await page.keyboard.down('Space');await page.waitForTimeout(220);await page.keyboard.press('KeyQ');await page.keyboard.up('Space');
 await expect(page.locator('#toast')).toContainText('纸桥');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ink-kingdom-world')||'{}').paper)).toBe(3);
 await page.reload();await page.locator('#world-map-button').click();await expect(page.locator('#map-abilities')).toContainText('纸 3/6');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-world').click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe('ink-kingdom-journey.json');expect(errors).toEqual([]);
});

test('player can talk to a guide and return from a paused conversation without stuck movement',async({page})=>{
 await page.goto('/');await page.locator('#start-button').click();await page.keyboard.down('KeyD');await expect(page.locator('#interaction-hint')).toContainText('交谈');await page.keyboard.up('KeyD');
 await expect(page.locator('#interaction-hint')).toContainText('交谈');await page.keyboard.press('KeyS');await expect(page.locator('#npc-dialog')).toBeVisible();await expect(page.locator('#npc-speaker')).toContainText('纸鹤');
 await page.locator('[data-answer="rest"]').click();await expect(page.locator('#npc-dialog')).toBeHidden();await expect(page.locator('#game-status')).toHaveText('正在探索山河');await expect(page.locator('#life-count')).toHaveText('05');
});

test('phone map and all four action buttons remain reachable without hiding the game',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();await page.goto('/');await page.locator('#start-button').tap();
 const canvas=await page.locator('#game').boundingBox();
 for(const action of ['fire','build','dash','jump']){const box=await page.locator(`[data-touch-player="0"] [data-control="${action}"]`).boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(391);expect(box.y).toBeGreaterThanOrEqual(canvas.y+canvas.height-1);expect(box.y+box.height).toBeLessThanOrEqual(845);}
 await page.locator('#immersive-map').tap();await expect(page.locator('#world-map-dialog')).toBeVisible();expect(await page.locator('#world-map-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:'/tmp/ink-world-mobile-map.png'});await page.locator('#close-map').tap();await expect(page.locator('#game-status')).toHaveText('正在探索山河');await context.close();
});
