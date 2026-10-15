// Browser tests for soba_clicker.html: run with `npm test`.
// Each test opens the game in a fresh browser context (empty save) and drives it through
// its own functions, so behaviour is checked without waiting for real time to pass.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const GAME_URL = 'file://' + path.resolve(__dirname, '..', 'soba_clicker.html');
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

async function openGame(viewport = { width: 1400, height: 900 }, lang = 'ja') {
    const context = await browser.newContext({ viewport });
    // Fix the language so results don't depend on the machine's locale
    await context.addInitScript((l) => { try { localStorage.setItem('echizenSobaSettings', JSON.stringify({ lang: l })); } catch (e) { /* ignore */ } }, lang);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept()); // confirm() for prestige, challenges, etc.
    await page.goto(GAME_URL);
    await page.waitForFunction(() => typeof state === 'object' && document.querySelectorAll('.main-tab').length > 0);
    await page.evaluate(() => { while (isModalOpen()) closeModal(); });
    return { page, errors, close: () => context.close() };
}

test('game data has unique ids and valid references', async () => {
    const { page, errors, close } = await openGame();
    const problems = await page.evaluate(() => {
        const out = [];
        const dupes = (list, name) => {
            const ids = list.map(x => x.id);
            if (new Set(ids).size !== ids.length) out.push(`duplicate ${name} id`);
        };
        dupes(BUILDINGS, 'building'); dupes(UPGRADES, 'upgrade'); dupes(ACHIEVEMENTS, 'achievement');
        dupes(HEAVENLY_UPGRADES, 'heavenly'); dupes(REGIONS, 'region'); dupes(CROPS, 'crop');
        HEAVENLY_UPGRADES.filter(h => h.requires && !HEAVENLY_UPGRADES.some(x => x.id === h.requires))
            .forEach(h => out.push(`heavenly ${h.id} requires missing ${h.requires}`));
        REGIONS.filter(r => r.requires && !REGIONS.some(x => x.id === r.requires))
            .forEach(r => out.push(`region ${r.id} requires missing ${r.requires}`));
        UPGRADES.filter(u => u.target && !BUILDINGS.some(b => b.id === u.target))
            .forEach(u => out.push(`upgrade ${u.id} targets missing ${u.target}`));
        CROP_RECIPES.forEach(r => [...r.parents, r.child].forEach(c => { if (!CROPS.some(x => x.id === c)) out.push(`recipe uses missing crop ${c}`); }));
        return out;
    });
    assert.deepEqual(problems, []);
    assert.deepEqual(errors, []);
    await close();
});

test('every tab opens without errors', async () => {
    const { page, errors, close } = await openGame();
    await page.evaluate(() => {
        state.allTimeSoba = state.totalSoba = 1e13; state.prestigeCount = 1;
        BUILDINGS.slice(0, 8).forEach(b => { state.buildings[b.id] = 60; });
        calculateCps(); render();
        TAB_GROUPS.forEach(g => g.views.forEach(v => switchTab(v.id)));
        openAscensionScreen(); closeAscensionScreen();
    });
    await page.waitForTimeout(300);
    assert.deepEqual(errors, []);
    await close();
});

test('buying and selling buildings', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.soba = 1000;
        const cost = getBuildingCost(BUILDINGS[0]);
        buyBuilding('student');
        const afterBuy = { owned: state.buildings.student, soba: state.soba };
        setShopMode('sell');
        sellBuilding('student');
        return { cost, afterBuy, afterSell: { owned: state.buildings.student, soba: state.soba } };
    });
    assert.equal(r.afterBuy.owned, 1);
    assert.equal(r.afterBuy.soba, 1000 - r.cost);
    assert.equal(r.afterSell.owned, 0);
    assert.equal(r.afterSell.soba, 1000 - r.cost + Math.floor(r.cost * 0.25));
    await close();
});

test('orders progress even when the all-time total is huge', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.allTimeSoba = 1e30; state.totalSoba = 5000; state.buildings.student = 20; calculateCps();
        state.nextOrderTime = 1; orderTick(Date.now());
        const order = state.activeOrder;
        for (let i = 0; i < 10; i++) clickBowl({ clientX: 0, clientY: 0 });
        return getOrderProgress(order);
    });
    assert.ok(r > 0, `progress stayed at ${r}`);
    await close();
});

test('orders complete on time and fail after the deadline', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.buildings.student = 20; calculateCps();
        const add = (n) => { state.soba += n; state.totalSoba += n; state.allTimeSoba += n; };
        state.nextOrderTime = 1; orderTick(Date.now());
        add(state.activeOrder.target + 1); orderTick(Date.now());
        const completed = state.ordersCompleted;
        // an expired order must fail even if a lump of production lands after its deadline
        state.nextOrderTime = 1; orderTick(Date.now());
        state.activeOrder.deadline = Date.now() - 1000;
        add(state.activeOrder.target * 10); orderTick(Date.now());
        return { completed, completedAfter: state.ordersCompleted, failed: state.ordersFailed };
    });
    assert.equal(r.completed, 1);
    assert.equal(r.completedAfter, 1);
    assert.equal(r.failed, 1);
    await close();
});

test('prestige grants souls and keeps permanent progress', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.buildings.student = 5; state.lumps = 2; ageBuilding('student'); ageBuilding('student');
        state.heavenlyUpgrades = ['heav_16']; state.souls = 5; state.regions = ['katsuyama'];
        state.allTimeSoba = 1e12; state.totalSoba = 1e12;
        const expected = getSoulsToGet();
        prestige();
        return { expected, souls: state.souls, level: state.buildingLevels.student, students: state.buildings.student,
                 kitchens: state.buildings.kitchen, regions: state.regions, soba: state.soba, upgrades: state.upgrades.length };
    });
    assert.equal(r.souls, 5 + r.expected);
    assert.ok(r.expected >= 5, 'first prestige at 1e12 should give a useful number of souls');
    assert.equal(r.level, 2, 'aging levels are permanent');
    assert.equal(r.students, 10, 'starter kit');
    assert.equal(r.kitchens, 5, 'starter kit');
    assert.deepEqual(r.regions, ['katsuyama']);
    assert.equal(r.soba, 0);
    assert.equal(r.upgrades, 0);
    await close();
});

test('time away is credited only with まどろみの生産, at base production', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.buildings.student = 50; calculateCps();
        const base = cps;
        const frozenFor = (sec) => { const s0 = state.soba; lastUpdate = Date.now() - sec * 1000; update(); return state.soba - s0; };
        const without = frozenFor(3600);
        state.heavenlyUpgrades.push('heav_11');
        buffMult = 7; buffTimer = 30; calculateCps(); // a fever was running when the player left
        const withUpgrade = frozenFor(3600);
        const s0 = state.soba; lastUpdate = Date.now() + 3600 * 1000; update(); // clock moved backwards
        return { base, without, withUpgrade, clockBack: state.soba - s0 };
    });
    assert.equal(r.without, 0);
    assert.ok(Math.abs(r.withUpgrade / (r.base * 3600) - 1) < 0.01, `credited ${r.withUpgrade / (r.base * 3600)}x base`);
    assert.ok(r.clockBack >= 0, 'soba never goes down when the clock moves backwards');
    await close();
});

test('space key clicks the bowl but not while typing', async () => {
    const { page, close } = await openGame();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => state.clicks), 1);
    await page.evaluate(() => switchTab('settings'));
    await page.focus('#save-code');
    await page.keyboard.type('a b');
    assert.equal(await page.inputValue('#save-code'), 'a b');
    assert.equal(await page.evaluate(() => state.clicks), 1);
    await close();
});

test('save export decodes back to the same progress', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.soba = 12345; state.souls = 7; state.farm.discovered.push('maruoka');
        const data = decodeSave(getExportCode());
        return { soba: data.soba, souls: data.souls, discovered: data.farm.discovered };
    });
    assert.equal(r.soba, 12345);
    assert.equal(r.souls, 7);
    assert.deepEqual(r.discovered, ['common', 'maruoka']);
    await close();
});

test('farm: plant, grow, harvest and cross-breed', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.soba = 1e6; state.allTimeSoba = state.totalSoba = 1e6;
        [0, 1, 4, 5].forEach(i => onPlotTap(i));
        const planted = state.farm.plots.filter(Boolean).length;
        state.farm.plots.forEach(p => { if (p) p.plantedAt -= 60 * 60 * 1000; });
        const realRandom = Math.random; Math.random = () => 0; // force a mutation roll
        farmTick(Date.now() + 10000);
        Math.random = realRandom;
        const discovered = state.farm.discovered.slice();
        const s0 = state.soba; harvestPlot(0);
        return { planted, discovered, harvested: state.soba > s0, harvests: state.farm.harvests };
    });
    assert.equal(r.planted, 4);
    assert.ok(r.discovered.includes('maruoka'), 'two mature commons next to an empty plot sprout 丸岡在来');
    assert.ok(r.harvested);
    assert.equal(r.harvests, 1);
    await close();
});

test('challenge mode stashes and restores the main save', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.soba = 999; state.prestigeCount = 1; state.buildings.mill = 3;
        startChallenge('no_click');
        const during = { soba: state.soba, mill: state.buildings.mill, run: state.isChallengeRun, clickPower };
        abandonChallenge();
        return { during, after: { soba: state.soba, mill: state.buildings.mill, run: state.isChallengeRun } };
    });
    assert.equal(r.during.run, 'no_click');
    assert.equal(r.during.mill, 0);
    assert.equal(r.during.clickPower, 0);
    assert.equal(r.after.run, null);
    assert.equal(r.after.mill, 3);
    assert.ok(r.after.soba >= 999);
    await close();
});

test('phone layout has no horizontal scroll', async () => {
    const { page, errors, close } = await openGame({ width: 390, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false);
    assert.deepEqual(errors, []);
    await close();
});

test('limited-time events follow the calendar and count event orders', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        const on = (d) => { const e = getActiveEvent(new Date(d + 'T12:00')); return e && e.id; };
        const left = (d) => getEventInfo(getActiveEvent(new Date(d + 'T12:00')), new Date(d + 'T12:00'));
        const dates = { gw: on('2026-05-01'), obon: on('2026-08-15'), koyo: on('2026-10-08'), shinsoba: on('2026-11-30'),
                        nye: on('2026-12-31'), newYear: on('2027-01-03'), none: on('2026-06-15'), dec24: on('2026-12-24') };
        const nyeInfo = left('2026-12-31'), jan2Info = left('2027-01-02');
        // three completed event orders earn the event's achievement
        state.buildings.student = 20; calculateCps();
        for (let i = 0; i < 3; i++) {
            state.activeOrder = { customer: 0, target: 1, reward: 10, startTotal: state.totalSoba, deadline: Date.now() + 60000, event: 'koyo' };
            state.totalSoba += 5; orderTick(Date.now());
        }
        checkAchievements();
        return { dates, nyeInfo, jan2Info, count: state.eventOrders.koyo, ach: state.achievements.includes('ach_event_koyo') };
    });
    assert.deepEqual(r.dates, { gw: 'golden_week', obon: 'obon', koyo: 'koyo', shinsoba: 'shinsoba', nye: 'toshikoshi', newYear: 'toshikoshi', none: null, dec24: null });
    assert.deepEqual(r.nyeInfo, { daysLeft: 4, key: 'toshikoshi-2026' });
    assert.deepEqual(r.jan2Info, { daysLeft: 2, key: 'toshikoshi-2026' }, 'New Year days belong to the event that started in December');
    assert.equal(r.count, 3);
    assert.ok(r.ach);
    await close();
});

test('workshop critical hit pays five minutes of base production', async () => {
    const { page, close } = await openGame();
    const r = await page.evaluate(() => {
        state.buildings.student = 1000; calculateCps();
        const base = cps;
        buffMult = 7; calculateCps(); // a fever must not multiply the reward
        artisanRunning = true; artisanMarkerAnim = setInterval(() => {}, 1000);
        document.getElementById('workshop-marker').style.left = '50%';
        const s0 = state.soba;
        stopArtisanChallenge();
        return { ratio: (state.soba - s0) / (base * 300), points: state.artisanPoints, crits: state.artisanCrits };
    });
    assert.ok(Math.abs(r.ratio - 1) < 0.01, `paid ${r.ratio}x of 5 minutes`);
    assert.equal(r.points, 1.5);
    assert.equal(r.crits, 1);
    await close();
});

test('share image and BGM toggle work', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        const canvas = buildShareCanvas();
        openShareDialog();
        const preview = !!document.querySelector('#modal-box img');
        closeModal();
        toggleSetting('bgm');
        const savedOn = JSON.parse(localStorage.getItem('echizenSobaSettings')).bgm;
        toggleSetting('bgm');
        return { w: canvas.width, h: canvas.height, png: canvas.toDataURL('image/png').length, preview, savedOn, running: !!bgm.timer };
    });
    assert.equal(r.w, 1200);
    assert.equal(r.h, 630);
    assert.ok(r.png > 10000);
    assert.ok(r.preview);
    assert.equal(r.savedOn, true);
    assert.equal(r.running, false);
    assert.deepEqual(errors, []);
    await close();
});

test('home-screen files are present and consistent', () => {
    const fs = require('node:fs');
    const root = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
    manifest.icons.forEach(icon => assert.ok(fs.existsSync(path.join(root, icon.src)), `missing ${icon.src}`));
    assert.ok(fs.existsSync(path.join(root, manifest.start_url)));
    // every file the page loads must be precached under the same ?v= the page uses
    const html = fs.readFileSync(path.join(root, 'soba_clicker.html'), 'utf8');
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const swVersion = sw.match(/const V = '([^']+)'/)[1];
    const assets = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)\?v=([^"]+)"/g)];
    assert.ok(assets.length >= 5);
    assets.forEach(([, file, v]) => {
        assert.equal(v, swVersion, `${file} uses ?v=${v} but sw.js caches ?v=${swVersion}`);
        assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
        assert.ok(sw.includes(`./${file}?v=`), `${file} not precached`);
    });
});

test('map: branch names are visible and opened branches stay known', async () => {
    const { page, close } = await openGame({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
        state.regions = REGIONS.map(x => x.id); // all opened, but only a few buildings (as after a prestige)
        state.buildings.student = 400; calculateCps(); switchTab('map'); render();
        const labels = [...document.querySelectorAll('#fukui-map .region-marker-label')];
        document.getElementById('fukui-map').scrollIntoView();
        const covered = labels.filter(l => {
            const b = l.getBoundingClientRect();
            // labels ignore pointer events, so look for a marker drawn over the label's center
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            return !!(hit && hit.closest('.region-marker'));
        }).map(l => l.textContent);
        return { names: labels.map(l => l.textContent), covered };
    });
    assert.deepEqual(r.names.filter(n => n === '？？？'), [], 'opened branches must not show as ？？？');
    assert.deepEqual(r.covered, [], 'labels must not be hidden behind markers');
    await close();
});

test('English mode leaves no Japanese on screen', async () => {
    const { page, errors, close } = await openGame({ width: 1400, height: 900 }, 'en');
    const leftovers = await page.evaluate(async () => {
        const jp = /[\u3040-\u30ff\u4e00-\u9fff]/;
        const found = new Set();
        const scan = (where) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const n = walker.currentNode;
                // the language switch is deliberately labelled in both languages
                if (jp.test(n.nodeValue) && !n.nodeValue.includes('Language') && n.parentElement && n.parentElement.offsetParent !== null) {
                    found.add(`${where}: ${n.nodeValue.trim().slice(0, 60)}`);
                }
            }
        };
        scan('start');
        state.allTimeSoba = state.totalSoba = 5e16; state.soba = 1e16; state.prestigeCount = 2; state.souls = 300;
        BUILDINGS.slice(0, 14).forEach((b, i) => { state.buildings[b.id] = 120 - i * 5; });
        state.regions = ['katsuyama', 'ono']; state.spirits = ['spirit_speed']; state.lumps = 3; state.heavenlyUpgrades = ['heav_1', 'heav_3'];
        state.farm.discovered = ['common', 'maruoka']; state.farm.plots[0] = { crop: 'common', plantedAt: 0 };
        state.achievements = ACHIEVEMENTS.slice(0, 30).map(a => a.id); buffMult = 7; buffTimer = 30; clickBuffMult = 777; clickBuffTimer = 5;
        state.nextOrderTime = 1; orderTick(Date.now()); dailyTick(); calculateCps(); render();
        scan('main');
        TAB_GROUPS.forEach(g => g.views.forEach(v => { switchTab(v.id); render(); scan(v.id); }));
        setShopMode('sell'); switchTab('shop'); render(); scan('sell'); setShopMode('buy');
        openAscensionScreen(); scan('ascension'); closeAscensionScreen();
        showLoginBonusModal(7, 1e6, true); scan('login'); closeModal();
        state.seenHints = []; checkHints(); scan('hint'); closeModal();
        state.eventsSeen = []; checkEventAnnounce(); scan('event'); while (isModalOpen()) closeModal();
        openShareDialog(); scan('share'); closeModal();
        // every hint and daily task, not just the ones this state happens to show
        HINTS.forEach(h => { if (t(h.title) === h.title || t(h.text) === h.text) found.add(`hint: ${h.id}`); });
        DAILY_MISSIONS.forEach(m => { if (t(m.text) === m.text) found.add(`daily: ${m.id}`); });
        state.storySeen = STORY.map(c => c.id); switchTab('story'); render(); scan('story');
        STORY.forEach(c => { showStoryChapter(c.id); scan(`story ${c.id}`); closeModal(); });
        switchTab('stats'); render(); scan('stats breakdown');
        document.querySelectorAll('.building-item, .upgrade-item, .ach-icon-small').forEach(el => {
            if (!el.onmouseenter) return;
            el.onmouseenter({ clientX: 10, clientY: 10 });
            const tip = document.getElementById('tooltip').innerText;
            if (jp.test(tip)) found.add(`tooltip: ${tip.slice(0, 60)}`);
        });
        return [...found];
    });
    assert.deepEqual(leftovers, []);
    assert.deepEqual(errors, []);
    await close();
});

test('number formats: Japanese myriads and English short scale', async () => {
    const ja = await openGame();
    const en = await openGame({ width: 1400, height: 900 }, 'en');
    const sample = () => [999, 12345, 1.5e8, 2.5e12].map(n => fmt(n));
    assert.deepEqual(await ja.page.evaluate(sample), ['999', '1.23万', '1.50億', '2.50兆']);
    assert.deepEqual(await en.page.evaluate(sample), ['999', '12.35K', '150M', '2.5T']);
    await ja.close(); await en.close();
});

test('daily tasks: same three for a date, progress, rewards and a new set the next day', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        state.allTimeSoba = state.totalSoba = 1e6; state.soba = 0; calculateCps();
        const a = rollDailyMissions('2026-10-14').missions.map(m => m.id).join();
        const b = rollDailyMissions('2026-10-14').missions.map(m => m.id).join();
        const other = ['2026-10-15', '2026-10-16', '2026-10-17'].some(d => rollDailyMissions(d).missions.map(m => m.id).join() !== a);
        dailyTick();
        const today = state.daily.day;
        // force a known set to drive each kind of progress
        state.daily.missions = [{ id: 'click', target: 3, progress: 0 }, { id: 'buy', target: 5, progress: 0 }, { id: 'produce', target: 5000, progress: 0 }];
        const lumps = state.lumps;
        clickBowl({ clientX: 0, clientY: 0 }); clickBowl({ clientX: 0, clientY: 0 }); clickBowl({ clientX: 0, clientY: 0 });
        const afterClicks = state.soba;
        buyAmount = 1; state.soba += 1e9; for (let i = 0; i < 5; i++) buyBuilding('student');
        const beforeProduce = state.daily.missions[2].progress;
        state.totalSoba += 2000; dailyTick();
        const partial = state.daily.missions[2].progress;
        state.totalSoba += 4000; dailyTick();
        const full = state.daily.missions.every(m => m.progress >= m.target);
        checkAchievements();
        // a new day brings new tasks
        state.daily.day = '2000-01-01'; dailyTick();
        return { a, b, other, count: a.split(',').length, today, afterClicks, beforeProduce, partial, full,
                 lumpGain: state.lumps - lumps, fullDays: state.dailyFullDays, ach: state.achievements.includes('ach_daily_1'),
                 newDay: state.daily.day === today && state.daily.missions.every(m => m.progress === 0) };
    });
    assert.equal(r.a, r.b);
    assert.ok(r.other, 'different dates give different tasks');
    assert.equal(r.count, 3);
    assert.ok(r.afterClicks >= 1000, 'a finished task pays at least the minimum reward');
    assert.equal(r.beforeProduce, 0, 'rewards are not counted as production');
    assert.ok(r.partial >= 2000 && r.partial < 2100, `produce progress ${r.partial}`); // plus a moment of idle production
    assert.ok(r.full);
    assert.equal(r.lumpGain, 1);
    assert.equal(r.fullDays, 1);
    assert.ok(r.ach);
    assert.ok(r.newDay);
    assert.deepEqual(errors, []);
    await close();
});

test('divinity: offers souls and heavenly powers for lasting virtue', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        state.souls = 999; state.prestigeCount = 5;
        const tooFew = getDivinityToGet();
        state.souls = 1000; state.allTimeSoba = 3e17; state.heavenlyUpgrades = ['heav_1', 'heav_8', 'heav_3'];
        state.spirits = ['spirit_speed', 'spirit_harvest', 'spirit_guardian'];
        state.achievements = ['ach_1']; state.buildingLevels.student = 4; state.reputation = 20;
        BUILDINGS.forEach(b => { state.buildings[b.id] = 10; }); calculateCps();
        const gain = getDivinityToGet();
        const prodBefore = getDivinityProdMult();
        performDivinity();
        checkAchievements();
        // virtue follows the record: offering fewer souls again adds nothing, beating it adds the difference
        state.souls = 1000; const repeat = getDivinityToGet();
        state.souls = 8000; const record = getDivinityToGet();
        const nextNeeded = (state.souls = 0, getNextDivinitySouls());
        state.allTimeSoba = 3e8 * 1001; // a little over 10 souls' worth
        return { tooFew, gain, prodBefore, prod: getDivinityProdMult(), souls: state.souls, heavenly: state.heavenlyUpgrades.length,
                 spirits: state.spirits.length, ach: state.achievements.includes('ach_1') && state.achievements.includes('ach_divine_1'),
                 level: state.buildingLevels.student, rep: state.reputation, buildings: getTotalBuildings(), soba: state.soba,
                 past: state.pastSoba, soulsToGet: getSoulsToGet(), prestiges: state.prestigeCount, repeat, record, nextNeeded };
    });
    assert.equal(r.tooFew, 0);
    assert.equal(r.gain, 10);
    assert.equal(r.prodBefore, 1);
    assert.equal(r.prod, 11);
    assert.equal(r.souls, 0);
    assert.equal(r.heavenly, 0);
    assert.equal(r.spirits, 2, 'spirits beyond the base slots are released');
    assert.ok(r.ach);
    assert.equal(r.level, 4);
    assert.equal(r.rep, 20);
    assert.equal(r.buildings, 0);
    assert.equal(r.soba, 0);
    assert.equal(r.past, 3e17);
    assert.equal(r.soulsToGet, 10, 'souls start over from the new all-time total');
    assert.equal(r.prestiges, 5);
    assert.equal(r.repeat, 0);
    assert.equal(r.record, 10);
    assert.equal(r.nextNeeded, 1331);
    assert.deepEqual(errors, []);
    await close();
});

test('late-game challenges: locked early, no upgrades, and the time limit fails the run', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        const speed = CHALLENGES.find(c => c.id === 'speedrun');
        state.prestigeCount = 1; state.souls = 50; state.allTimeSoba = 5e12;
        const lockedEarly = !isChallengeUnlocked(speed);
        startChallenge('speedrun');
        const notStarted = state.isChallengeRun === null;
        state.prestigeCount = 3; saveGame(true);
        startChallenge('no_upgrade');
        const inRun = state.isChallengeRun;
        state.soba = 1e12; state.totalSoba = 1e6;
        const u = UPGRADES[0]; buyUpgrade(u.id);
        const blocked = !state.upgrades.includes(u.id);
        abandonChallenge();
        startChallenge('speedrun');
        const unlockedInRun = isChallengeUnlocked(speed);
        state.challengeStartTime = Date.now() - 61 * 60 * 1000;
        checkChallengeProgress();
        return { lockedEarly, notStarted, inRun, blocked, unlockedInRun, after: state.isChallengeRun, souls: state.souls,
                 cleared: state.challengesCompleted.includes('speedrun') };
    });
    assert.ok(r.lockedEarly);
    assert.ok(r.notStarted);
    assert.equal(r.inRun, 'no_upgrade');
    assert.ok(r.blocked);
    assert.ok(r.unlockedInRun);
    assert.equal(r.after, null, 'time limit sends the player back');
    assert.equal(r.souls, 50);
    assert.equal(r.cleared, false);
    assert.deepEqual(errors, []);
    await close();
});

test('story: a chapter shows once when reached, and old saves unlock reached chapters quietly', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        while (isModalOpen()) closeModal();
        state.storySeen = []; state.clicks = 0;
        checkStory();
        const none = isModalOpen();
        state.clicks = 10; checkStory();
        const shown = isModalOpen() && document.getElementById('modal-box').innerText.includes(STORY[0].title);
        closeModal(); checkStory(); // nothing new
        const once = !isModalOpen() && state.storySeen.length === 1;
        // a save from before the story existed
        const old = JSON.parse(JSON.stringify(state)); delete old.storySeen;
        old.allTimeSoba = 2e9; old.buildings.student = 5; old.clicks = 100;
        normalizeStateObject(old);
        return { none, shown, once, oldSeen: old.storySeen };
    });
    assert.equal(r.none, false);
    assert.ok(r.shown);
    assert.ok(r.once);
    assert.deepEqual(r.oldSeen, ['ch_open', 'ch_kenta', 'ch_gen', 'ch_popular', 'ch_city']);
    assert.deepEqual(errors, []);
    await close();
});

test('production breakdown and payback times add up', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        state.buildings.student = 10; state.buildings.kitchen = 5; state.reputation = 10; state.artisanPoints = 5;
        calculateCps();
        const raw = Object.values(buildingRawCps).reduce((a, b) => a + b, 0);
        const product = cpsFactors.reduce((m, f) => m * f[1], 1);
        const student = BUILDINGS.find(b => b.id === 'student');
        const unit = getBuildingUnitCps(student);
        const cost = getBuildingCost(student);
        state.allTimeSoba = state.totalSoba = 1000;
        switchTab('stats'); render();
        const statsText = document.getElementById('stats-container').innerText;
        return { raw, product, base: getBaseCps(), unitTimesCount: unit * 10, studentShare: buildingRawCps.student * product,
                 payback: getPaybackSec(student, 1, cost), expected: cost / unit, best: getBestValueBuilding(),
                 hasBreakdown: statsText.includes('生産の内訳') && statsText.includes('評判') };
    });
    assert.ok(Math.abs(r.raw * r.product - r.base) < 1e-9 * r.base);
    assert.ok(Math.abs(r.unitTimesCount - r.studentShare) < 1e-9 * r.studentShare);
    assert.ok(Math.abs(r.payback - r.expected) < 1e-9);
    assert.ok(['student', 'kitchen', 'mill'].includes(r.best), String(r.best));
    assert.ok(r.hasBreakdown);
    assert.deepEqual(errors, []);
    await close();
});

test('side stories, event music and celebrations', async () => {
    const { page, errors, close } = await openGame();
    const r = await page.evaluate(() => {
        while (isModalOpen()) closeModal();
        state.storySeen = STORY.filter(c => !c.side).map(c => c.id);
        state.regions = ['katsuyama']; checkStory();
        const region = isModalOpen() && document.getElementById('modal-box').innerText.includes(STORY.find(c => c.id === 'rg_katsuyama').title);
        closeModal();
        state.spirits = ['spirit_chaos']; checkStory();
        const spiritSpeaker = document.getElementById('modal-box').innerText.includes(SPIRITS.find(s => s.id === 'spirit_chaos').name);
        closeModal();
        // a save from v2.7 (story but no side stories yet): reached ones unlock quietly
        const old = JSON.parse(JSON.stringify(state)); delete old.storyVersion;
        old.storySeen = ['ch_open']; old.regions = ['katsuyama', 'ono']; old.spirits = [];
        normalizeStateObject(old);
        // event music follows the running event
        const realEvent = getActiveEvent;
        getActiveEvent = () => EVENTS.find(e => e.id === 'obon');
        const eventStyle = getBgmStyle() === EVENT_BGM_STYLES.obon;
        getActiveEvent = () => null;
        const stageStyle = BGM_STYLES.includes(getBgmStyle());
        getActiveEvent = realEvent;
        settings.reduceEffects = false;
        showCelebration('♻️', 'test', 'sub', 'prestige');
        const celebrating = document.querySelectorAll('.celebration').length === 1 && document.querySelectorAll('.burst-particle').length > 0;
        return { region, spiritSpeaker, oldSeen: old.storySeen, oldVersion: old.storyVersion, eventStyle, stageStyle, celebrating,
                 scenery: document.getElementById('stage-scenery').children.length };
    });
    assert.ok(r.region);
    assert.ok(r.spiritSpeaker);
    assert.deepEqual(r.oldSeen, ['ch_open', 'rg_katsuyama', 'rg_ono']);
    assert.equal(r.oldVersion, 2);
    assert.ok(r.eventStyle);
    assert.ok(r.stageStyle);
    assert.ok(r.celebrating);
    assert.ok(r.scenery >= 5);
    assert.deepEqual(errors, []);
    await close();
});
