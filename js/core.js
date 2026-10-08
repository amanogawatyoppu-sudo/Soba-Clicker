// 越前そばクリッカー: state, production, rendering and player actions
// Loaded as classic scripts in order (data → core → systems → save), sharing one global scope.

// --- Game State ---
function createFreshState() {
    return {
        soba: 0,
        totalSoba: 0,
        allTimeSoba: 0,
        clicks: 0,
        goldenClicks: 0,
        feverCount: 0,
        prestigeCount: 0,
        souls: 0,
        buildings: {},
        buildingLevels: {},
        upgrades: [],
        achievements: [],
        startTime: Date.now(),
        lastSave: Date.now(),
        secretCounter: 0,
        lumps: 0,
        totalLumps: 0,
        lastLumpTime: Date.now(),
        heavenlyUpgrades: [],
        wrathClicks: 0,
        spirits: [],
        seasonsExperienced: [],
        seasonSobaClicks: 0,
        shadowAchievements: [],
        lastMasteryTier: 0,
        artisanPoints: 0,
        artisanAttempts: 0,
        artisanCrits: 0,
        lastArtisanTime: 0,
        challengesCompleted: [],
        challengeBonusPoints: 0,
        isChallengeRun: null,
        challengeStartTime: 0,
        regions: [],
        farm: createFreshFarm(),
        reputation: 0,
        ordersCompleted: 0,
        ordersFailed: 0,
        activeOrder: null,
        nextOrderTime: 0,
        loginStreak: 0,
        bestLoginStreak: 0,
        lastLoginDay: '',
        buildingsSold: 0
    };
}

let state = createFreshState();

function resetState() {
    BUILDINGS.forEach(b => {
        state.buildings[b.id] = 0;
        // Aging levels are paid for with lumps and are permanent: keep them through prestige
        if (state.buildingLevels[b.id] === undefined) state.buildingLevels[b.id] = 0;
    });
    state.soba = 0;
    state.totalSoba = 0;
    state.upgrades = [];
}
resetState();
if (!state.seasonsExperienced.includes(getSeasonByMonth().id)) state.seasonsExperienced.push(getSeasonByMonth().id);

let cps = 0;
let isResetting = false;
let clickPower = 1;
let buffMult = 1;
let buffTimer = 0;
let clickBuffMult = 1;
let clickBuffTimer = 0;
let lastUpdate = Date.now();
let clickTimestamps = [];
let buyAmount = 1;
let shopMode = 'buy'; // 'buy' or 'sell'
let selectedSeed = 'common';

// Per-device settings, stored apart from the save so challenges and save imports don't touch them
const SETTINGS_KEY = 'echizenSobaSettings';
const settings = { sound: true, reduceEffects: false, numberFormat: 'jp' };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* keep defaults */ }

function setBuyAmount(amt) {
    buyAmount = amt === 'max' ? 'max' : parseInt(amt, 10);
    render();
}

// --- Core Logic ---

function getDashiLevel() {
    return Math.floor(state.achievements.length / 7) + getRegionFlatBonus('dashiBonusFlat');
}

function getMasteryBonusMult() {
    // Hidden bonus: every 10 achievements permanently grants production, no purchase needed
    const tier = Math.floor(state.achievements.length / 10);
    const perTier = state.heavenlyUpgrades.includes('heav_13') ? 0.03 : 0.02;
    return 1 + tier * perTier;
}

function calculateCps() {
    let newCps = 0;
    BUILDINGS.forEach(b => {
        let count = state.buildings[b.id];
        let level = state.buildingLevels[b.id] || 0;
        let bCps = b.baseCps * count * Math.pow(1.01, level);
        UPGRADES.filter(u => u.type === 'building' && u.target === b.id && state.upgrades.includes(u.id))
                .forEach(u => bCps *= u.mult);
        newCps += bCps;
    });
    UPGRADES.filter(u => u.type === 'global' && state.upgrades.includes(u.id))
            .forEach(u => newCps *= u.mult);

    // Kitten/Dashi upgrades: each purchased kitten scales with current dashi level
    const dashiLevel = getDashiLevel();
    UPGRADES.filter(u => u.type === 'kitten' && state.upgrades.includes(u.id))
            .forEach(u => newCps *= (1 + u.kittenPercent * dashiLevel));

    // Heavenly upgrades: permanent global multipliers
    HEAVENLY_UPGRADES.filter(h => h.effect === 'globalMult' && state.heavenlyUpgrades.includes(h.id))
            .forEach(h => newCps *= h.mult);

    // Shrine spirits: net effect of all equipped spirits' globalMult entries (benefits and drawbacks both apply)
    newCps *= getSpiritEffectMult('globalMult');

    // Fukui branch-store regional bonuses (globalMult, e.g. Katsuyama's dinosaur bonus)
    newCps *= getRegionEffectMult('globalMult');

    // Seasonal event bonus
    const season = getCurrentSeason();
    if (season && season.effect === 'globalMult') newCps *= season.value;

    // Hidden mastery bonus tied to achievement count
    newCps *= getMasteryBonusMult();

    // Artisan points from the handmade soba workshop minigame (this game's original mechanic)
    newCps *= (1 + state.artisanPoints / 100);

    // Permanent bonus per completed challenge (+3% each)
    newCps *= (1 + (state.challengeBonusPoints || 0) * getChallengeBonusPerClear());

    // Reputation from customer orders, and the soba farm (mature crops + discovered strains)
    newCps *= (1 + state.reputation * REPUTATION_BONUS);
    newCps *= getFarmCpsMult();
    
    // Prestige Bonus: Each soul gives +1% bonus
    let prestigeMult = 1 + getEffectiveSouls() * getSoulBonusPerSoul();
    cps = newCps * buffMult * prestigeMult;
    
    let newClickPower = 1;
    UPGRADES.filter(u => u.type === 'click' && state.upgrades.includes(u.id))
            .forEach(u => newClickPower *= u.power);
    let clickBaseBonus = 0;
    HEAVENLY_UPGRADES.filter(h => h.effect === 'clickBase' && state.heavenlyUpgrades.includes(h.id))
            .forEach(h => clickBaseBonus += h.amount);
    let spiritClickMult = getSpiritEffectMult('clickMult') * getRegionEffectMult('clickMult') * (1 + getFarmEffectBonus('click'));
    if (season && season.effect === 'clickMult') spiritClickMult *= season.value;
    let clickCpsPercent = 0.04;
    UPGRADES.filter(u => u.type === 'clickCps' && state.upgrades.includes(u.id))
            .forEach(u => clickCpsPercent += u.cpsPercent);
    // The CPS-based part already includes the prestige bonus, so only the flat part gets it here
    clickPower = ((newClickPower + clickBaseBonus) * prestigeMult + cps * clickCpsPercent) * clickBuffMult * spiritClickMult;
    if (state.isChallengeRun === 'no_click') clickPower = 0;
}

function getChallengeBonusPerClear() {
    return state.heavenlyUpgrades.includes('heav_35') ? 0.06 : 0.03;
}

function getGoldenBonusMult() {
    let mult = getSpiritEffectMult('goldenBonus') * (1 + getFarmEffectBonus('golden'));
    if (state.heavenlyUpgrades.includes('heav_28')) mult *= 1.5;
    const season = getCurrentSeason();
    if (season && season.effect === 'goldenBonus') mult *= season.value;
    return mult;
}

function getSpawnFreqMult() {
    const season = getCurrentSeason();
    let mult = (season && season.effect === 'goldenFreq') ? season.value : 1;
    mult *= getSpiritEffectMult('goldenFreqMult');
    mult *= getRegionEffectMult('goldenFreqMult');
    return mult;
}

function getWrathChanceMult() {
    return getSpiritEffectMult('wrathChanceMult');
}

function getWrathShieldMult() {
    let mult = getSpiritEffectMult('wrathShield');
    if (state.heavenlyUpgrades.includes('heav_12')) mult *= 0.5;
    mult *= getRegionEffectMult('wrathShield');
    return mult;
}

// A gap this long between ticks means the loop was frozen (phone in the background, computer asleep)
// rather than just throttled, so it counts as time away instead of normal play.
const AWAY_THRESHOLD_SEC = 120;

// Production for time spent away from the game: only with まどろみの生産 (heav_11), capped, and at
// base production (a fever running when you left doesn't last the whole time away).
function creditTimeAway(sec) {
    if (sec <= 0 || !state.heavenlyUpgrades.includes('heav_11')) return 0;
    const base = getBaseCps();
    if (base <= 0) return 0;
    const gained = base * Math.min(sec, getMaxOfflineSec()) * getOfflineMult();
    state.soba += gained;
    state.totalSoba += gained;
    state.allTimeSoba += gained;
    return gained;
}

function formatAwayTime(sec) {
    sec = Math.min(sec, getMaxOfflineSec());
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    return h > 0 ? `${h}時間${m}分` : m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

function update() {
    let now = Date.now();
    let dt = (now - lastUpdate) / 1000;
    lastUpdate = now;
    if (dt < 0) dt = 0; // the system clock moved backwards: never take soba away
    let productionDt = dt;
    if (dt > AWAY_THRESHOLD_SEC) {
        productionDt = 0;
        const gained = creditTimeAway(dt);
        if (gained > 0) notify(`留守中 (${formatAwayTime(dt)}) の生産: +${fmt(gained)} 杯`, "😴");
    }

    const liveSeason = getCurrentSeason().id;
    if (!state.seasonsExperienced.includes(liveSeason)) state.seasonsExperienced.push(liveSeason);

    const newMasteryTier = Math.floor(state.achievements.length / 10);
    if (newMasteryTier > state.lastMasteryTier) {
        state.lastMasteryTier = newMasteryTier;
        const perTierPct = state.heavenlyUpgrades.includes('heav_13') ? 3 : 2;
        notify(`隠された熟練の力が目覚めた！(全生産+${newMasteryTier * perTierPct}%)`, "🧠", true);
    }

    if (cps > 0) {
        const gained = cps * productionDt;
        state.soba += gained;
        state.totalSoba += gained;
        state.allTimeSoba += gained;
    }

    if (buffTimer > 0) {
        buffTimer -= dt;
        if (buffTimer <= 0) {
            buffTimer = 0;
            buffMult = 1;
            document.getElementById('app').classList.remove('fever');
            calculateCps();
            notify("フィーバータイム終了！");
        }
    }

    if (clickBuffTimer > 0) {
        clickBuffTimer -= dt;
        if (clickBuffTimer <= 0) {
            clickBuffTimer = 0;
            clickBuffMult = 1;
            calculateCps();
            notify("クリックフィーバー終了！");
        }
    }

    accumulateLumps(now);
    orderTick(now);
    // Farm growth, season, etc. change multipliers over time: refresh them and run slower systems once a second
    if (now - lastSlowTick >= 1000) {
        lastSlowTick = now;
        farmTick(now);
        calculateCps();
        checkLoginBonus();
        checkHints();
    }
    checkChallengeProgress();

    clickTimestamps = clickTimestamps.filter(t => now - t < 1000);
    checkAchievements();
    checkShadowAchievements();
    render();
}

let lastSlowTick = 0;

function getLumpInterval() {
    const base = 20 * 60 * 1000; // 20 minutes real time per lump
    let speedUp = state.heavenlyUpgrades.includes('heav_6') ? 2 : 1;
    if (state.heavenlyUpgrades.includes('heav_14')) speedUp *= 1.5;
    return base / speedUp;
}

function accumulateLumps(now) {
    const interval = getLumpInterval();
    let elapsed = now - (state.lastLumpTime || now);
    if (elapsed < 0) elapsed = 0;
    const gained = Math.floor(elapsed / interval);
    if (gained > 0) {
        state.lumps += gained;
        state.totalLumps += gained;
        state.lastLumpTime += gained * interval;
    }
}

setInterval(update, 100);

// --- UI Rendering ---

function fmt(n) {
    if (n < 1000) return Math.floor(n).toLocaleString();
    if (settings.numberFormat === 'sci' && n >= 1e6) return n.toExponential(2).replace('e+', 'e');
    const units = ["", "万", "億", "兆", "京", "垓", "𥝱", "穣", "溝", "澗", "正", "載", "極", "恒河沙", "阿僧祇", "那由他", "不可思議", "無量大数"];
    let unitIdx = 0;
    let val = n;
    while (val >= 10000 && unitIdx < units.length - 1) {
        val /= 10000;
        unitIdx++;
    }
    return val.toFixed(2).replace(/\.00$/, "") + units[unitIdx];
}

function render() {
    document.getElementById('soba-count').textContent = fmt(state.soba) + " 杯";
    document.getElementById('soba-rate').textContent = `毎秒: ${fmt(cps)} 杯` + (buffMult > 1 ? ` (FEVER x${buffMult}!)` : "");
    document.getElementById('ach-count').textContent = `${state.achievements.length}/${ACHIEVEMENTS.length}`;
    document.getElementById('upg-count').textContent = `${state.upgrades.length}/${UPGRADES.length}`;
    document.getElementById('dashi-level').textContent = getDashiLevel();
    document.getElementById('lump-count').textContent = state.lumps;
    renderSeasonBar();
    renderWorkshopBar();
    
    renderTabs();
    renderStage();
    renderBuffBar();
    renderChallengeBanner();
    renderOrderBanner();
    if (activeView === 'farm') renderFarm();
    if (activeView === 'lump') renderLumpList();
    if (activeView === 'prestige') renderPrestigeView();

    renderShop();
    renderUpgrades();
    renderAchievements();
    renderStats();
    renderShrine();
    renderMap();
    renderAscensionScreen();
}

// render() runs 10 times a second; rebuilding every list each time is what made phones sluggish.
// Each panel computes a cheap signature of what it would show and only touches the DOM when it changes.
const renderCache = {};
function hasChanged(key, signature) {
    if (renderCache[key] === signature) return false;
    renderCache[key] = signature;
    return true;
}

function setHTMLIfChanged(el, html) {
    if (el._html === html) return;
    el._html = html;
    el.innerHTML = html;
}

function renderBuyAmountToggle() {
    if (!hasChanged('buyToggle', shopMode + '|' + buyAmount)) return;
    const toggle = document.getElementById('buy-amount-toggle');
    const options = [1, 10, 100, 'max'];
    const modes = `<button class="buy-amt-btn ${shopMode === 'buy' ? 'active' : ''}" onclick="setShopMode('buy')">購入</button>` +
        `<button class="buy-amt-btn ${shopMode === 'sell' ? 'active' : ''}" onclick="setShopMode('sell')" style="${shopMode === 'sell' ? 'background:#c44;border-color:#c44;color:#fff' : ''}">売却</button>` +
        `<span class="shop-mode-sep"></span>`;
    toggle.innerHTML = modes + options.map(opt =>
        `<button class="buy-amt-btn ${buyAmount === opt ? 'active' : ''}" onclick="setBuyAmount('${opt}')">${opt === 'max' ? (shopMode === 'sell' ? '全部' : 'MAX') : '×' + opt}</button>`
    ).join('');
}

const shopItemEls = {};

function getBuyItemView(b) {
    const locked = state.totalSoba < b.baseCost * 0.4 && state.buildings[b.id] === 0;
    const owned = state.buildings[b.id] || 0;
    if (locked) {
        return {
            className: 'building-item locked',
            html: `<div class="b-icon">❓</div><div class="b-info"><div class="b-name">???</div><div class="b-cost">---</div></div><div class="b-count">${owned}</div>`,
            action: null, tooltip: null
        };
    }
    let quantity, cost, canBuy;
    if (buyAmount === 'max') {
        const result = getMaxAffordable(b);
        canBuy = result.quantity > 0;
        quantity = result.quantity;
        cost = canBuy ? result.cost : getBuildingCost(b);
    } else {
        quantity = buyAmount;
        cost = getBulkCost(b, quantity);
        canBuy = state.soba >= cost;
    }
    const level = state.buildingLevels[b.id] || 0;
    const qtyLabel = buyAmount === 'max' ? ` (MAX: ${quantity})` : (quantity > 1 ? ` ×${quantity}` : '');
    return {
        className: `building-item ${canBuy ? 'can-buy' : ''}`,
        html: `<div class="b-icon">${b.icon}</div>
            <div class="b-info">
                <div class="b-name">${b.name}${level > 0 ? ` <span style="color:var(--accent); font-size:11px">Lv.${level}</span>` : ''}</div>
                <div class="b-cost">🍜 ${fmt(cost)}${qtyLabel}</div>
            </div>
            <div class="b-count">${owned}</div>`,
        action: () => buyBuilding(b.id),
        tooltip: [b.name, `${b.desc}<br>生産: ${fmt(b.baseCps)}/秒${level > 0 ? ` (熟成Lv.${level}: +${level}%)` : ''}`, cost]
    };
}

function getSellItemView(b) {
    const owned = state.buildings[b.id] || 0;
    if (owned === 0 && state.totalSoba < b.baseCost * 0.4) return { hidden: true }; // not discovered yet
    const quantity = getSellQuantity(b);
    const refund = quantity > 0 ? getSellRefund(b, quantity) : 0;
    return {
        className: `building-item ${quantity > 0 ? 'can-sell' : 'locked'}`,
        html: `<div class="b-icon">${b.icon}</div>
            <div class="b-info">
                <div class="b-name">${b.name}</div>
                <div class="b-cost" style="color:${quantity > 0 ? '#ff8a8a' : 'var(--muted)'}">${quantity > 0 ? `💸 +${fmt(refund)} (${quantity}個売却)` : '所有していません'}</div>
            </div>
            <div class="b-count">${owned}</div>`,
        action: quantity > 0 ? () => sellBuilding(b.id) : null,
        tooltip: [`${b.name}を売却`, `購入額の${SELL_REFUND_RATE * 100}%が戻ります。<br>所有: ${owned}個`, 0]
    };
}

function createShopItem() {
    const el = document.createElement('div');
    // Handlers read the element's latest view, so they stay correct without being re-attached
    el.onpointerdown = (e) => { e.preventDefault(); if (el._view && el._view.action) el._view.action(); };
    el.onmouseenter = (e) => { if (el._view && el._view.tooltip) showTooltip(e, ...el._view.tooltip); };
    el.onmouseleave = hideTooltip;
    return el;
}

function renderShop() {
    renderBuyAmountToggle();
    if (activeView !== 'shop') return;
    const list = document.getElementById('buildings-list');
    BUILDINGS.forEach(b => {
        let el = shopItemEls[b.id];
        if (!el) {
            el = shopItemEls[b.id] = createShopItem();
            list.appendChild(el);
        }
        const view = shopMode === 'sell' ? getSellItemView(b) : getBuyItemView(b);
        el._view = view;
        el.style.display = view.hidden ? 'none' : '';
        if (view.hidden) return;
        if (el.className !== view.className) el.className = view.className;
        setHTMLIfChanged(el, view.html);
    });
}

function renderUpgrades() {
    if (activeView !== 'shop') return;
    const visible = UPGRADES.filter(u => {
        if (state.upgrades.includes(u.id)) return false;
        if (u.req.totalSoba && state.totalSoba >= u.req.totalSoba * 0.5) return true;
        if (u.req.clicks && state.clicks >= u.req.clicks * 0.5) return true;
        if (u.req.buildings) {
            for (let bid in u.req.buildings) {
                if (state.buildings[bid] >= u.req.buildings[bid] * 0.5) return true;
            }
        }
        return false;
    });
    if (!hasChanged('upgrades', visible.map(u => u.id + (state.soba >= u.cost ? '+' : '-')).join())) return;
    const grid = document.getElementById('upgrades-grid');
    grid.innerHTML = '';
    visible.forEach(u => {
        const div = document.createElement('div');
        div.className = `upgrade-item ${state.soba >= u.cost ? '' : 'disabled'}`;
        div.innerHTML = u.icon;
        div.onpointerdown = (e) => { e.preventDefault(); buyUpgrade(u.id); };
        div.onmouseenter = (e) => showTooltip(e, u.name, u.desc, u.cost);
        div.onmouseleave = hideTooltip;
        grid.appendChild(div);
    });
}

function renderAchievements() {
    if (!hasChanged('achievements', state.achievements.length)) return;
    const list = document.getElementById('ach-list');
    list.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        const unlocked = state.achievements.includes(a.id);
        const div = document.createElement('div');
        div.className = `ach-icon-small ${unlocked ? 'unlocked' : ''}`;
        div.innerHTML = a.icon;
        div.onmouseenter = (e) => showTooltip(e, a.name, unlocked ? a.desc : '???', 0);
        div.onmouseleave = hideTooltip;
        list.appendChild(div);
    });
}

function renderStats() {
    if (document.getElementById('stats-view').style.display !== 'block') return;
    const container = document.getElementById('stats-container');
    const playTime = Math.floor((Date.now() - state.startTime) / 1000);
    const h = Math.floor(playTime / 3600);
    const m = Math.floor((playTime % 3600) / 60);
    const s = playTime % 60;
    const html = `
        <div class="stat-row"><span class="stat-label">現在のそば</span><span>${fmt(state.soba)} 杯</span></div>
        <div class="stat-row"><span class="stat-label">今世の生産量</span><span>${fmt(state.totalSoba)} 杯</span></div>
        <div class="stat-row"><span class="stat-label">全世の生産量</span><span>${fmt(state.allTimeSoba)} 杯</span></div>
        <div class="stat-row"><span class="stat-label">総クリック数</span><span>${state.clicks} 回</span></div>
        <div class="stat-row"><span class="stat-label">ゴールデンそば</span><span>${state.goldenClicks} 回</span></div>
        <div class="stat-row"><span class="stat-label">転生回数</span><span>${state.prestigeCount} 回</span></div>
        <div class="stat-row"><span class="stat-label">獲得済みの越前魂</span><span>${state.souls} 個</span></div>
        <div class="stat-row"><span class="stat-label">プレイ時間</span><span>${h}時間${m}分${s}秒</span></div>
        <div class="stat-row"><span class="stat-label">現在のCPS</span><span>${fmt(cps)}</span></div>
        <div class="stat-row"><span class="stat-label">クリックパワー</span><span>${fmt(clickPower)}</span></div>
        <div class="stat-row"><span class="stat-label">だしレベル</span><span>🍲 Lv.${getDashiLevel()}</span></div>
        <div class="stat-row"><span class="stat-label">そば粉の塊 (総獲得)</span><span>${state.lumps} 個 (累計 ${state.totalLumps} 個)</span></div>
        <div class="stat-row"><span class="stat-label">呪われしそば遭遇</span><span>${state.wrathClicks} 回</span></div>
        <div class="stat-row"><span class="stat-label">天界の力</span><span>${state.heavenlyUpgrades.length}/${HEAVENLY_UPGRADES.length}</span></div>
        <div class="stat-row"><span class="stat-label">祀っている精霊</span><span>${state.spirits.length > 0 ? state.spirits.map(id => SPIRITS.find(s => s.id === id).icon).join(' ') : 'なし'}</span></div>
        <div class="stat-row"><span class="stat-label">季節限定そば発見数</span><span>${state.seasonSobaClicks} 回 (制覇: ${state.seasonsExperienced.length}/${SEASONS.length})</span></div>
        <div class="stat-row"><span class="stat-label">裏実績</span><span>🌑 ${state.shadowAchievements.length}/${SHADOW_ACHIEVEMENTS.length}</span></div>
        <div class="stat-row"><span class="stat-label">手打ちそば道場</span><span>${state.artisanAttempts}回挑戦 (会心${state.artisanCrits}回・職人ポイント+${state.artisanPoints.toFixed(1)}%)</span></div>
        <div class="stat-row"><span class="stat-label">挑戦モード</span><span>${(state.challengesCompleted || []).length}/${CHALLENGES.length} クリア (恒久ボーナス+${Math.round((state.challengeBonusPoints || 0) * getChallengeBonusPerClear() * 100)}%)</span></div>
        <div class="stat-row"><span class="stat-label">福井支店展開</span><span>${(state.regions || []).length}/${REGIONS.length} 箇所</span></div>
        <div class="stat-row"><span class="stat-label">お客さんの注文</span><span>達成 ${state.ordersCompleted} 回 / 失敗 ${state.ordersFailed} 回</span></div>
        <div class="stat-row"><span class="stat-label">評判</span><span>⭐ ${state.reputation} (全生産+${(state.reputation * REPUTATION_BONUS * 100).toFixed(1)}%)</span></div>
        <div class="stat-row"><span class="stat-label">そば畑</span><span>図鑑 ${state.farm.discovered.length}/${CROPS.length}・収穫 ${state.farm.harvests} 回</span></div>
        <div class="stat-row"><span class="stat-label">ログイン</span><span>連続 ${state.loginStreak} 日 (最高 ${state.bestLoginStreak} 日)</span></div>
        <div class="stat-row"><span class="stat-label">売却した施設</span><span>${state.buildingsSold} 個</span></div>
    `;
    setHTMLIfChanged(container, html);
}

function renderShrine() {
    if (document.getElementById('shrine-view').style.display !== 'block') return;
    if (!hasChanged('shrine', state.spirits.join() + '|' + getMaxSpiritSlots())) return;

    const slots = document.getElementById('shrine-slots');
    slots.innerHTML = '';
    const maxSlots = getMaxSpiritSlots();
    document.getElementById('shrine-slot-count').textContent = maxSlots;
    document.getElementById('shrine-slot-max').textContent = maxSlots;
    for (let i = 0; i < maxSlots; i++) {
        const spiritId = state.spirits[i];
        const spirit = spiritId ? SPIRITS.find(s => s.id === spiritId) : null;
        const div = document.createElement('div');
        div.className = `shrine-slot ${spirit ? 'filled' : ''}`;
        div.innerHTML = spirit
            ? `<div class="slot-icon">${spirit.icon}</div><div>${spirit.name}</div>`
            : `<div class="slot-icon">➕</div><div>空きの祭壇</div>`;
        if (spirit) {
            div.onpointerdown = (e) => { e.preventDefault(); toggleSpirit(spirit.id); };
            div.onmouseenter = (e) => showTooltip(e, spirit.name, spirit.desc + '<br><span style="color:var(--muted)">クリックで解任</span>', 0);
            div.onmouseleave = hideTooltip;
        }
        slots.appendChild(div);
    }

    const list = document.getElementById('shrine-list');
    list.innerHTML = '';
    SPIRITS.forEach(s => {
        const active = state.spirits.includes(s.id);
        const full = state.spirits.length >= getMaxSpiritSlots() && !active;
        const div = document.createElement('div');
        div.className = `spirit-item ${active ? 'active' : ''} ${full ? 'disabled' : ''}`;
        div.innerHTML = `
            <div class="b-icon">${s.icon}</div>
            <div class="b-info">
                <div class="b-name">${s.name}</div>
                <div class="b-cost" style="color:${active ? '#c77dff' : 'var(--muted)'}">${active ? '祀られています' : s.desc}</div>
            </div>
        `;
        if (!full) {
            div.onpointerdown = (e) => { e.preventDefault(); toggleSpirit(s.id); };
        }
        div.onmouseenter = (e) => showTooltip(e, s.name, s.desc, 0);
        div.onmouseleave = hideTooltip;
        list.appendChild(div);
    });
}

function getMaxSpiritSlots() {
    if (state.heavenlyUpgrades.includes('heav_30')) return 4;
    return state.heavenlyUpgrades.includes('heav_8') ? 3 : 2;
}

function getPrestigeDivisor() {
    return state.heavenlyUpgrades.includes('heav_10') ? 2.4e8 : 3e8;
}

// Total souls earned so far is the cube root of all-time production (per 3e8); a prestige grants the difference.
// Was per 1e12, which left the first prestige at 1-2 souls and made later runs no faster. Tuned with a
// simulation: first prestige around 1e12 gives ~14 souls, and each following run reaches 1e12 sooner.
function getSoulsToGet() {
    return Math.floor(Math.pow(state.allTimeSoba / getPrestigeDivisor(), 1 / 3)) - state.souls;
}

function getSoulBonusPerSoul() {
    if (state.heavenlyUpgrades.includes('heav_32')) return 0.02;
    return state.heavenlyUpgrades.includes('heav_18') ? 0.015 : 0.01;
}

// Beyond the soft cap the bonus grows with the square root, so late prestiges keep paying off
// without the production -> souls -> production loop running away into absurd numbers within hours.
function getSoulSoftcap() {
    return state.heavenlyUpgrades.includes('heav_33') ? 5000 : 1000;
}

function getEffectiveSouls() {
    const souls = state.souls, cap = getSoulSoftcap();
    return souls <= cap ? souls : cap * Math.sqrt(souls / cap);
}

function getSoulBonusPercent() {
    return Math.round(getEffectiveSouls() * getSoulBonusPerSoul() * 1000) / 10;
}

// Starter buildings from the heavenly upgrades, applied right after a prestige
function applyStarterKit() {
    const kit = [];
    if (state.heavenlyUpgrades.includes('heav_16')) kit.push(['student', 10], ['kitchen', 5]);
    if (state.heavenlyUpgrades.includes('heav_17')) kit.push(['mill', 10], ['shop', 5]);
    if (state.heavenlyUpgrades.includes('heav_19')) kit.push(['factory', 10], ['festival', 5]);
    kit.forEach(([id, n]) => { state.buildings[id] = Math.max(state.buildings[id] || 0, n); });
    if (state.heavenlyUpgrades.includes('heav_20')) {
        UPGRADES.filter(u => u.type === 'click' && !state.upgrades.includes(u.id)).forEach(u => state.upgrades.push(u.id));
    }
}

function toggleSpirit(id) {
    const idx = state.spirits.indexOf(id);
    if (idx >= 0) {
        state.spirits.splice(idx, 1);
    } else {
        const maxSlots = getMaxSpiritSlots();
        if (state.spirits.length >= maxSlots) {
            notify(`祭壇は${maxSlots}柱までしか祀れません。`, "⛩️");
            return;
        }
        state.spirits.push(id);
        const spirit = SPIRITS.find(s => s.id === id);
        notify(`${spirit.name}を祀りました。`, spirit.icon);
    }
    calculateCps();
    render();
}

function renderSeasonBar() {
    const season = getCurrentSeason();
    document.getElementById('season-label').textContent = `${season.icon} ${season.name}`;
}

// --- 手打ちそば道場: this game's original minigame (not derived from any other clicker) ---
const ARTISAN_STAGES = ['💧 水回し中...', '👐 こね中...', '🪵 延し中...', '📖 たたみ中...', '🔪 切りどき！今だ！'];
const ARTISAN_BASE_COOLDOWN = 5 * 60 * 1000; // 5 minutes
let artisanRunning = false;
let artisanMarkerAnim = null;
let artisanStageTimer = null;

function getArtisanCooldown() {
    return state.heavenlyUpgrades.includes('heav_9') ? ARTISAN_BASE_COOLDOWN / 2 : ARTISAN_BASE_COOLDOWN;
}

function getArtisanCooldownLeft() {
    return Math.max(0, getArtisanCooldown() - (Date.now() - (state.lastArtisanTime || 0)));
}

function startArtisanChallenge() {
    if (artisanRunning) return;
    const cooldownLeft = getArtisanCooldownLeft();
    if (cooldownLeft > 0) {
        notify(`職人はまだ休憩中です。(あと${Math.ceil(cooldownLeft / 1000)}秒)`, "🥢");
        return;
    }
    artisanRunning = true;
    document.getElementById('workshop-idle').style.display = 'none';
    document.getElementById('workshop-active').style.display = 'block';
    const label = document.getElementById('workshop-stage-label');
    const marker = document.getElementById('workshop-marker');
    marker.style.left = '0%';
    let i = 0;
    label.textContent = ARTISAN_STAGES[0];
    artisanStageTimer = setInterval(() => {
        i++;
        if (i < ARTISAN_STAGES.length) {
            label.textContent = ARTISAN_STAGES[i];
        } else {
            clearInterval(artisanStageTimer);
            artisanStageTimer = null;
            beginArtisanTiming();
        }
    }, 500);
}

function beginArtisanTiming() {
    const marker = document.getElementById('workshop-marker');
    let pos = 0;
    let dir = 1;
    artisanMarkerAnim = setInterval(() => {
        pos += dir * 2.2;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        marker.style.left = pos + '%';
    }, 16);
}

function stopArtisanChallenge() {
    if (!artisanRunning) return;
    if (artisanStageTimer) { clearInterval(artisanStageTimer); artisanStageTimer = null; }
    if (!artisanMarkerAnim) { artisanRunning = false; return; }
    clearInterval(artisanMarkerAnim);
    artisanMarkerAnim = null;

    const marker = document.getElementById('workshop-marker');
    const pos = parseFloat(marker.style.left) || 0;

    state.lastArtisanTime = Date.now();
    state.artisanAttempts++;

    let bonus, pointsGain;
    if (pos >= 45 && pos <= 55) {
        state.artisanCrits++;
        bonus = Math.max(1000, cps * 1200);
        pointsGain = 1.0;
        notify(`会心の一撃！極上の一杯が打てた！${fmt(bonus)}杯獲得。(職人ポイント+1.0%)`, "🥢✨");
    } else if (pos >= 25 && pos <= 75) {
        bonus = Math.max(400, cps * 400);
        pointsGain = 0.4;
        notify(`上手に打てた！${fmt(bonus)}杯獲得。(職人ポイント+0.4%)`, "🥢");
    } else {
        bonus = Math.max(50, cps * 50);
        pointsGain = 0.1;
        notify(`ちょっと不揃いになったが、${fmt(bonus)}杯は打てた。(職人ポイント+0.1%)`, "🥢💦");
    }
    state.soba += bonus;
    state.totalSoba += bonus;
    state.allTimeSoba += bonus;
    const artisanMaster = state.heavenlyUpgrades.includes('heav_29');
    state.artisanPoints = Math.min(artisanMaster ? 100 : 50, state.artisanPoints + pointsGain * (artisanMaster ? 1.5 : 1));

    calculateCps();
    artisanRunning = false;
    document.getElementById('workshop-active').style.display = 'none';
    document.getElementById('workshop-idle').style.display = 'flex';
    render();
}

function renderWorkshopBar() {
    document.getElementById('artisan-points-display').textContent = state.artisanPoints.toFixed(1);
    if (artisanRunning) return;
    const btn = document.getElementById('workshop-btn');
    const cooldownLeft = getArtisanCooldownLeft();
    if (cooldownLeft > 0) {
        btn.disabled = true;
        btn.textContent = `休憩中 (${Math.ceil(cooldownLeft / 1000)}s)`;
        btn.style.opacity = '0.5';
    } else {
        btn.disabled = false;
        btn.textContent = '挑戦する';
        btn.style.opacity = '1';
    }
}

function getAvailableSouls() {
    const spent = HEAVENLY_UPGRADES.filter(h => state.heavenlyUpgrades.includes(h.id))
                                    .reduce((sum, h) => sum + h.cost, 0);
    return state.souls - spent;
}

// --- Challenge Mode: a temporary alternate save with special rules, backed up and restored via localStorage ---
function startChallenge(id) {
    if (state.isChallengeRun) {
        notify("既に挑戦中です。先に完了か中断をしてください。", "⚔️");
        return;
    }
    const challenge = CHALLENGES.find(c => c.id === id);
    if (!challenge) return;
    if (!confirm(`「${challenge.name}」に挑戦しますか？\n現在の進行状況は安全に退避され、挑戦を終える（または中断する）といつでも戻せます。`)) return;

    // An order in progress would sit in the backup past its deadline and count as a failure on return
    if (state.activeOrder) { state.activeOrder = null; scheduleNextOrder(); }
    localStorage.setItem('echizenSobaChallengeBackup', JSON.stringify(state));

    state = createFreshState();
    resetState();
    state.isChallengeRun = id;
    state.challengeStartTime = Date.now();
    lastUpdate = Date.now();
    calculateCps();
    saveGame(true);
    switchTab('shop');
    notify(`挑戦開始: ${challenge.name}`, challenge.icon);
    render();
}

function checkChallengeProgress() {
    if (!state.isChallengeRun) return;
    const challenge = CHALLENGES.find(c => c.id === state.isChallengeRun);
    if (!challenge) return;
    if (state.allTimeSoba >= challenge.goal) completeChallenge();
}

function completeChallenge() {
    const challengeId = state.isChallengeRun;
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    const backupRaw = localStorage.getItem('echizenSobaChallengeBackup');
    if (!backupRaw) return;
    const backup = JSON.parse(backupRaw);
    normalizeStateObject(backup);
    backup.achievements = Array.from(new Set([...backup.achievements, ...state.achievements]));
    backup.shadowAchievements = Array.from(new Set([...backup.shadowAchievements, ...state.shadowAchievements]));
    backup.farm.discovered = Array.from(new Set([...backup.farm.discovered, ...state.farm.discovered]));

    let rewardMsg = '';
    if (!backup.challengesCompleted.includes(challengeId)) {
        backup.challengesCompleted.push(challengeId);
        backup.challengeBonusPoints = (backup.challengeBonusPoints || 0) + 1;
        rewardMsg = ` 恒久ボーナス+${Math.round(getChallengeBonusPerClear() * 100)}%を獲得！`;
    } else {
        rewardMsg = '(再挑戦のため追加ボーナスなし)';
    }

    state = backup;
    state.isChallengeRun = null;
    state.challengeStartTime = 0;
    localStorage.removeItem('echizenSobaChallengeBackup');
    localStorage.removeItem('echizenSobaChallengeState');
    calculateCps();
    saveGame(true);
    switchTab('challenge');
    notify(`挑戦クリア: ${challenge.name}！${rewardMsg}`, "🏆");
    render();
}

function abandonChallenge() {
    if (!state.isChallengeRun) return;
    if (!confirm("挑戦を中断しますか？(挑戦中の進行は失われますが、元のセーブデータは無事です)")) return;
    const backupRaw = localStorage.getItem('echizenSobaChallengeBackup');
    if (!backupRaw) {
        notify("元のセーブデータが見つかりません。念のため中断を取り消しました。ページを再読み込みしてから再度お試しください。", "⚠️", true);
        return;
    }
    const backup = JSON.parse(backupRaw);
    normalizeStateObject(backup);
    backup.achievements = Array.from(new Set([...backup.achievements, ...state.achievements]));
    backup.shadowAchievements = Array.from(new Set([...backup.shadowAchievements, ...state.shadowAchievements]));
    backup.farm.discovered = Array.from(new Set([...backup.farm.discovered, ...state.farm.discovered]));
    state = backup;
    state.isChallengeRun = null;
    state.challengeStartTime = 0;
    localStorage.removeItem('echizenSobaChallengeBackup');
    localStorage.removeItem('echizenSobaChallengeState');
    calculateCps();
    saveGame(true);
    switchTab('shop');
    notify("挑戦を中断し、元の進行状況に戻りました。", "↩️");
    render();
}

function normalizeStateObject(obj) {
    const prevState = state;
    state = obj;
    normalizeState();
    state = prevState;
}

function renderChallengeBanner() {
    const banner = document.getElementById('challenge-banner');
    if (!state.isChallengeRun) {
        banner.style.display = 'none';
        return;
    }
    const challenge = CHALLENGES.find(c => c.id === state.isChallengeRun);
    if (!challenge) { banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    document.getElementById('challenge-banner-name').textContent = `${challenge.icon} ${challenge.name}`;
    document.getElementById('challenge-banner-progress').textContent = `${fmt(state.allTimeSoba)} / ${fmt(challenge.goal)} 杯`;
}

function renderChallengeList() {
    const list = document.getElementById('challenge-list');
    list.innerHTML = '';
    CHALLENGES.forEach(c => {
        const completed = state.challengesCompleted && state.challengesCompleted.includes(c.id);
        const active = state.isChallengeRun === c.id;
        const div = document.createElement('div');
        div.className = `building-item ${active ? '' : (state.isChallengeRun ? 'locked' : 'can-buy')}`;
        div.style.opacity = state.isChallengeRun && !active ? '0.4' : '1';
        div.innerHTML = `
            <div class="b-icon">${c.icon}</div>
            <div class="b-info">
                <div class="b-name">${c.name} ${completed ? '<span style="color:gold">✓クリア済</span>' : ''}</div>
                <div class="b-cost">${c.desc}</div>
            </div>
        `;
        if (!state.isChallengeRun) {
            div.onpointerdown = (e) => { e.preventDefault(); startChallenge(c.id); };
        } else if (active) {
            div.onpointerdown = (e) => { e.preventDefault(); switchTab('shop'); };
        }
        list.appendChild(div);
    });
}

function renderMap() {
    if (document.getElementById('map-view').style.display !== 'block') return;
    const totalBuildingsOwned = Object.values(state.buildings).reduce((a, b) => a + b, 0);
    const mapSig = REGIONS.map(r => {
        const unlocked = totalBuildingsOwned >= r.unlockBuildings && (!r.requires || state.regions.includes(r.requires));
        return `${state.regions.includes(r.id) ? 1 : 0}${unlocked ? 1 : 0}${state.soba >= r.cost ? 1 : 0}`;
    }).join();
    if (!hasChanged('map', mapSig)) return;
    const mapEl = document.getElementById('fukui-map');
    mapEl.querySelectorAll('.region-marker, .region-marker-label').forEach(el => el.remove());

    REGIONS.forEach(r => {
        const established = state.regions.includes(r.id);
        const prereqMet = !r.requires || state.regions.includes(r.requires);
        const unlocked = totalBuildingsOwned >= r.unlockBuildings && prereqMet;

        const marker = document.createElement('div');
        marker.className = `region-marker ${established ? 'established' : (unlocked ? 'available' : 'locked')}`;
        marker.style.left = r.x + '%';
        marker.style.top = r.y + '%';
        marker.textContent = unlocked ? r.icon : '❓';
        if (unlocked && !established) {
            marker.onpointerdown = (e) => { e.preventDefault(); establishBranch(r.id); };
        }
        let tipDesc = established ? `✅ 支店設立済み<br>${r.bonusName}: ${r.bonusDesc}` : (unlocked ? `${r.bonusName}: ${r.bonusDesc}<br>費用: 🍜 ${fmt(r.cost)}杯` : `施設合計${r.unlockBuildings}個で解禁`);
        marker.onmouseenter = (e) => showTooltip(e, unlocked ? r.name : '？？？', tipDesc, 0);
        marker.onmouseleave = hideTooltip;
        mapEl.appendChild(marker);

        const label = document.createElement('div');
        label.className = 'region-marker-label';
        label.style.left = r.x + '%';
        label.style.top = r.y + '%';
        label.textContent = unlocked ? r.name : '？？？';
        mapEl.appendChild(label);
    });

    const list = document.getElementById('region-list');
    list.innerHTML = '';
    REGIONS.forEach(r => {
        const established = state.regions.includes(r.id);
        const prereqMet = !r.requires || state.regions.includes(r.requires);
        const unlocked = totalBuildingsOwned >= r.unlockBuildings && prereqMet;
        const canBuy = unlocked && !established && state.soba >= r.cost;

        const div = document.createElement('div');
        div.className = `building-item ${established ? '' : (canBuy ? 'can-buy' : 'locked')}`;
        div.style.opacity = established ? '0.6' : (unlocked ? '1' : '0.4');
        div.innerHTML = `
            <div class="b-icon">${unlocked ? r.icon : '❓'}</div>
            <div class="b-info">
                <div class="b-name">${unlocked ? r.name : '？？？'}</div>
                <div class="b-cost">${established ? `✅ ${r.bonusName} 取得済み` : (unlocked ? `🍜 ${fmt(r.cost)} で設立 (${r.bonusName})` : `施設合計${r.unlockBuildings}個で解禁`)}</div>
            </div>
        `;
        if (unlocked && !established) {
            div.onpointerdown = (e) => { e.preventDefault(); establishBranch(r.id); };
        }
        list.appendChild(div);
    });
}

function renderGlossary() {
    const list = document.getElementById('glossary-list');
    list.innerHTML = '';
    const categories = [...new Set(GLOSSARY.map(g => g.category))];
    const ordered = categories.flatMap(cat => GLOSSARY.filter(g => g.category === cat));
    let lastCategory = null;
    ordered.forEach(g => {
        if (g.category !== lastCategory) {
            const catDiv = document.createElement('div');
            catDiv.className = 'glossary-category';
            catDiv.textContent = g.category;
            list.appendChild(catDiv);
            lastCategory = g.category;
        }
        const item = document.createElement('div');
        item.className = 'glossary-item';
        item.innerHTML = `
            <div class="glossary-icon">${g.icon}</div>
            <div>
                <div class="glossary-term">${g.term}</div>
                <div class="glossary-desc">${g.desc}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function computeSkillTreeLayout() {
    // Radial tree: each branch gets an angle proportional to how many leaves it has,
    // so big branches don't crowd while small ones leave empty wedges
    const childrenMap = {};
    HEAVENLY_UPGRADES.forEach(h => {
        if (h.requires) (childrenMap[h.requires] = childrenMap[h.requires] || []).push(h.id);
    });
    const weight = {};
    const weigh = (id) => {
        const kids = childrenMap[id] || [];
        return (weight[id] = kids.length ? kids.reduce((sum, k) => sum + weigh(k), 0) : 1);
    };
    const roots = HEAVENLY_UPGRADES.filter(h => !h.requires).map(h => h.id);
    const total = roots.reduce((sum, r) => sum + weigh(r), 0);

    const positions = {};
    const baseRadius = 130;
    const radiusStep = 115;
    function place(id, startAngle, span, depth) {
        const angle = startAngle + span / 2;
        const radius = baseRadius + depth * radiusStep;
        positions[id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, depth };
        let cursor = startAngle;
        (childrenMap[id] || []).forEach(kid => {
            const kidSpan = span * weight[kid] / weight[id];
            place(kid, cursor, kidSpan, depth + 1);
            cursor += kidSpan;
        });
    }
    let cursor = -Math.PI / 2 - Math.PI * weight[roots[0]] / total;
    roots.forEach(r => {
        const span = 2 * Math.PI * weight[r] / total;
        place(r, cursor, span, 0);
        cursor += span;
    });
    return positions;
}

function renderSkillTree(available) {
    const canvas = document.getElementById('skill-tree-canvas');
    const svg = document.getElementById('skill-tree-svg');
    if (!canvas || !svg) return;
    if (!hasChanged('skillTree', state.heavenlyUpgrades.join() + '|' + available + '|' + state.souls)) return;

    const layout = computeSkillTreeLayout();
    // Size the canvas to the tree (it grows as upgrades are added) with room for labels
    const extent = Math.max(...Object.values(layout).map(p => Math.hypot(p.x, p.y))) + 110;
    const size = Math.ceil(extent * 2);
    const centerX = size / 2, centerY = size / 2;
    canvas.style.width = canvas.style.height = size + 'px';
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    // Clear previous nodes (keep the svg element itself)
    canvas.querySelectorAll('.skill-node, .skill-hub').forEach(el => el.remove());

    // Draw connecting lines
    let svgLines = '';
    HEAVENLY_UPGRADES.forEach(h => {
        const pos = layout[h.id];
        if (!pos) return;
        const owned = state.heavenlyUpgrades.includes(h.id);
        const parentPos = h.requires ? layout[h.requires] : { x: 0, y: 0 };
        const lineColor = owned ? '#ffd700' : (h.requires ? '#444' : '#00d4ff55');
        const lineWidth = owned ? 3 : 2;
        const dash = owned ? '' : 'stroke-dasharray="4,4"';
        svgLines += `<line x1="${centerX + parentPos.x}" y1="${centerY + parentPos.y}" x2="${centerX + pos.x}" y2="${centerY + pos.y}" stroke="${lineColor}" stroke-width="${lineWidth}" ${dash}/>`;
    });
    svg.innerHTML = svgLines;

    // Central hub
    const hub = document.createElement('div');
    hub.className = 'skill-hub';
    hub.style.left = centerX + 'px';
    hub.style.top = centerY + 'px';
    hub.textContent = '🍜';
    hub.onmouseenter = (e) => showTooltip(e, '転生の中枢', `現在のプレステージボーナス: +${getSoulBonusPercent()}%<br>使用可能な越前魂: ${available} 個`, 0);
    hub.onmouseleave = hideTooltip;
    canvas.appendChild(hub);

    // Nodes
    HEAVENLY_UPGRADES.forEach(h => {
        const pos = layout[h.id];
        if (!pos) return;
        const owned = state.heavenlyUpgrades.includes(h.id);
        const prereqMet = !h.requires || state.heavenlyUpgrades.includes(h.requires);
        const affordable = available >= h.cost;

        const div = document.createElement('div');
        let cls = 'skill-node';
        if (owned) cls += ' owned';
        else if (!prereqMet) cls += ' locked';
        else if (affordable) cls += ' available';
        else cls += ' unaffordable';
        div.className = cls;
        div.style.left = (centerX + pos.x) + 'px';
        div.style.top = (centerY + pos.y) + 'px';
        div.textContent = h.icon;

        if (!prereqMet) {
            const lockBadge = document.createElement('div');
            lockBadge.className = 'skill-node-lock-badge';
            lockBadge.textContent = '🔒';
            div.appendChild(lockBadge);
        }

        if (!owned) {
            const costTag = document.createElement('div');
            costTag.className = 'skill-node-cost';
            costTag.textContent = `👻${h.cost}`;
            div.appendChild(costTag);
        }

        const label = document.createElement('div');
        label.className = `skill-node-label ${prereqMet ? '' : 'locked-label'}`;
        label.textContent = prereqMet ? h.name : '？？？';
        div.appendChild(label);

        if (!owned && prereqMet) {
            div.onpointerdown = (e) => { e.preventDefault(); buyHeavenly(h.id); };
        }
        let tipDesc = h.desc;
        if (!prereqMet) {
            const prereq = HEAVENLY_UPGRADES.find(x => x.id === h.requires);
            tipDesc = `🔒 先に「${prereq.name}」が必要<br>${h.desc}`;
        } else if (owned) {
            tipDesc = `✅ 取得済み<br>${h.desc}`;
        }
        div.onmouseenter = (e) => showTooltip(e, prereqMet ? h.name : '？？？', tipDesc, owned || !prereqMet ? 0 : h.cost);
        div.onmouseleave = hideTooltip;
        canvas.appendChild(div);
    });
}


function openAscensionScreen() {
    document.getElementById('ascension-screen').style.display = 'flex';
    renderAscensionScreen();
    // The tree grows outward from the center of a large canvas: start the view there
    const wrap = document.getElementById('skill-tree-wrap');
    wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
    wrap.scrollTop = (wrap.scrollHeight - wrap.clientHeight) / 2;
}

function closeAscensionScreen() {
    document.getElementById('ascension-screen').style.display = 'none';
}

function renderAscensionScreen() {
    if (document.getElementById('ascension-screen').style.display !== 'flex') return;
    const btn = document.getElementById('ascension-transcend-btn');
    const soulsToGet = getSoulsToGet();
    const canPrestige = soulsToGet > 0;
    
    btn.disabled = !canPrestige;
    btn.innerHTML = `転生して ${Math.max(0, soulsToGet)} 個の「越前魂」を獲得`;
    document.getElementById('ascension-souls').textContent = state.souls;
    document.getElementById('ascension-bonus').textContent = `+${getSoulBonusPercent()}%`;
    const available = getAvailableSouls();
    document.getElementById('ascension-available').textContent = available;

    renderSkillTree(available);
}

function renderLumpList() {
    const lList = document.getElementById('lump-list');
    if (!lList) return;
    document.getElementById('lump-view-count').textContent = state.lumps;
    if (!hasChanged('lumps', (state.lumps > 0) + '|' + BUILDINGS.map(b => (state.buildings[b.id] > 0 ? state.buildingLevels[b.id] : '-')).join())) return;
    lList.innerHTML = '';
    const ownedBuildings = BUILDINGS.filter(b => (state.buildings[b.id] || 0) > 0);
    if (ownedBuildings.length === 0) {
        lList.innerHTML = '<p style="font-size:12px; color:var(--muted)">まだ施設を所有していません。</p>';
    } else {
        ownedBuildings.forEach(b => {
            const level = state.buildingLevels[b.id] || 0;
            const canAge = state.lumps > 0;
            const div = document.createElement('div');
            div.className = `building-item ${canAge ? 'can-buy' : 'locked'}`;
            div.innerHTML = `
                <div class="b-icon">${b.icon}</div>
                <div class="b-info">
                    <div class="b-name">${b.name} <span style="color:var(--accent)">Lv.${level}</span></div>
                    <div class="b-cost">${canAge ? '🍡 塊1個で熟成 (+1%)' : '塊が足りません'}</div>
                </div>
            `;
            if (canAge) {
                div.onpointerdown = (e) => { e.preventDefault(); ageBuilding(b.id); };
            }
            lList.appendChild(div);
        });
    }
}

function buyHeavenly(id) {
    const h = HEAVENLY_UPGRADES.find(x => x.id === id);
    if (!h || state.heavenlyUpgrades.includes(id)) return;
    if (h.requires && !state.heavenlyUpgrades.includes(h.requires)) {
        const prereq = HEAVENLY_UPGRADES.find(x => x.id === h.requires);
        notify(`先に「${prereq.name}」を取得する必要があります。`, "🔒");
        return;
    }
    if (getAvailableSouls() >= h.cost) {
        state.heavenlyUpgrades.push(id);
        calculateCps();
        render();
        notify(`天界の力を獲得: ${h.name}`, "☁️");
    }
}

function establishBranch(id) {
    const r = REGIONS.find(x => x.id === id);
    if (!r || state.regions.includes(id)) return;
    const totalBuildingsOwned = Object.values(state.buildings).reduce((a, b) => a + b, 0);
    if (totalBuildingsOwned < r.unlockBuildings) {
        notify(`施設合計${r.unlockBuildings}個が必要です。`, "🗾");
        return;
    }
    if (r.requires && !state.regions.includes(r.requires)) {
        const prereq = REGIONS.find(x => x.id === r.requires);
        notify(`先に「${prereq.name}」に支店を設立する必要があります。`, "🔒");
        return;
    }
    if (state.soba < r.cost) return;
    if (!confirm(`${r.name}に支店を設立しますか？\n費用: 🍜 ${fmt(r.cost)}杯\n効果: ${r.bonusName}(${r.bonusDesc})`)) return;
    state.soba -= r.cost;
    state.regions.push(id);
    calculateCps();
    render();
    notify(`${r.name}に支店を設立！${r.bonusName}を獲得。`, r.icon);
}

function ageBuilding(id) {
    if (state.lumps <= 0) return;
    if (!state.buildings[id]) return;
    state.lumps--;
    state.buildingLevels[id] = (state.buildingLevels[id] || 0) + 1;
    calculateCps();
    render();
}

// --- Actions ---

function clickBowl(e) {
    state.soba += clickPower;
    state.totalSoba += clickPower;
    state.allTimeSoba += clickPower;
    state.clicks++;
    clickTimestamps.push(Date.now());
    playSound('click');
    if (settings.reduceEffects) { calculateCps(); return; }
    
    const pop = document.createElement('div');
    pop.className = 'click-pop';
    pop.textContent = `+${fmt(clickPower)}`;
    pop.style.left = (e.clientX - 20) + 'px';
    pop.style.top = (e.clientY - 20) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 900);

    const recentClicks = clickTimestamps.filter(t => Date.now() - t < 1000).length;
    if (recentClicks >= 5 && recentClicks % 5 === 0) {
        const combo = document.createElement('div');
        combo.className = 'combo-text';
        combo.textContent = `COMBO x${recentClicks}!`;
        combo.style.left = (e.clientX - 40) + 'px';
        combo.style.top = (e.clientY - 60) + 'px';
        document.body.appendChild(combo);
        setTimeout(() => combo.remove(), 600);
    }
    
    calculateCps();
}

document.getElementById('bowl').onpointerdown = (e) => { e.preventDefault(); clickBowl(e); };

document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    // Let Space type into text fields and press focused buttons as usual
    const t = e.target;
    if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName))) return;
    e.preventDefault();
    const bowl = document.getElementById('bowl');
    const rect = bowl.getBoundingClientRect();
    clickBowl({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
    bowl.style.transform = 'scale(0.92)';
    setTimeout(() => { bowl.style.transform = ''; }, 100);
});

// Cost multipliers are the same for every unit of a building, so compute them once per lookup
// instead of re-scanning spirits/regions for each unit in bulk/MAX calculations.
function getBuildingCostParams() {
    const rate = state.heavenlyUpgrades.includes('heav_1') ? 1.13 : 1.15;
    let mult = getSpiritEffectMult('cheaperBuild') * getRegionEffectMult('cheaperBuild');
    if (state.isChallengeRun === 'expensive') mult *= 1.5;
    return { rate, mult };
}

function getBuildingCost(b, atCount, params) {
    const { rate, mult } = params || getBuildingCostParams();
    const count = atCount !== undefined ? atCount : (state.buildings[b.id] || 0);
    return Math.floor(b.baseCost * Math.pow(rate, count) * mult);
}

function getBulkCost(b, quantity) {
    const params = getBuildingCostParams();
    const startCount = state.buildings[b.id] || 0;
    let total = 0;
    for (let i = 0; i < quantity; i++) {
        total += getBuildingCost(b, startCount + i, params);
    }
    return total;
}

function getMaxAffordable(b) {
    const params = getBuildingCostParams();
    const startCount = state.buildings[b.id] || 0;
    const CAP = 100000; // safety cap against runaway loops
    let total = 0;
    let n = 0;
    while (n < CAP) {
        const nextCost = getBuildingCost(b, startCount + n, params);
        if (total + nextCost > state.soba) break;
        total += nextCost;
        n++;
    }
    return { quantity: n, cost: total };
}

function buyBuilding(id) {
    const b = BUILDINGS.find(x => x.id === id);
    let quantity, cost;
    if (buyAmount === 'max') {
        const result = getMaxAffordable(b);
        quantity = result.quantity;
        cost = result.cost;
        if (quantity <= 0) return;
    } else {
        quantity = buyAmount;
        cost = getBulkCost(b, quantity);
        if (state.soba < cost) return;
    }
    state.soba -= cost;
    state.buildings[id] = (state.buildings[id] || 0) + quantity;
    playSound('buy');
    spawnBuyPop(id, `+${quantity} ${b.icon}`);
    calculateCps();
    render();
}

function buyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id);
    if (state.soba >= u.cost && !state.upgrades.includes(id)) {
        state.soba -= u.cost;
        state.upgrades.push(id);
        playSound('buy');
        calculateCps();
        render();
        notify(`アップグレード購入: ${u.name}`);
    }
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (state.achievements.includes(a.id)) return;
        let met = true;
        if (a.req.totalSoba && state.allTimeSoba < a.req.totalSoba) met = false;
        if (a.req.clicks && state.clicks < a.req.clicks) met = false;
        if (a.req.goldenClicks && state.goldenClicks < a.req.goldenClicks) met = false;
        if (a.req.feverCount && state.feverCount < a.req.feverCount) met = false;
        if (a.req.clickSpeed && clickTimestamps.length < a.req.clickSpeed) met = false;
        if (a.req.prestigeCount && state.prestigeCount < a.req.prestigeCount) met = false;
        if (a.req.cps && cps < a.req.cps) met = false;
        if (a.req.buildings) {
            for (let bid in a.req.buildings) {
                if (state.buildings[bid] < a.req.buildings[bid]) met = false;
            }
        }
        if (a.req.totalBuildings) {
            let totalB = Object.values(state.buildings).reduce((a, b) => a + b, 0);
            if (totalB < a.req.totalBuildings) met = false;
        }
        if (a.req.allBuildings) {
            if (BUILDINGS.some(b => (state.buildings[b.id] || 0) === 0)) met = false;
        }
        if (a.req.secret && state.secretCounter < a.req.secret) met = false;
        if (a.req.souls && state.souls < a.req.souls) met = false;
        if (a.req.playTime) {
            const playedSec = (Date.now() - state.startTime) / 1000;
            if (playedSec < a.req.playTime) met = false;
        }
        if (a.req.clickPower && clickPower < a.req.clickPower) met = false;
        if (a.req.allUpgrades && state.upgrades.length < UPGRADES.length) met = false;
        if (a.req.upgradesCount && state.upgrades.length < a.req.upgradesCount) met = false;
        if (a.req.ordersCompleted && state.ordersCompleted < a.req.ordersCompleted) met = false;
        if (a.req.farmDiscovered && state.farm.discovered.length < a.req.farmDiscovered) met = false;
        if (a.req.farmAll && state.farm.discovered.length < CROPS.length) met = false;
        if (a.req.farmHarvests && state.farm.harvests < a.req.farmHarvests) met = false;
        if (a.req.loginStreak && state.bestLoginStreak < a.req.loginStreak) met = false;
        if (a.req.buildingsSold && state.buildingsSold < a.req.buildingsSold) met = false;
        if (a.req.dashiLevel && getDashiLevel() < a.req.dashiLevel) met = false;
        if (a.req.wrathClicks && state.wrathClicks < a.req.wrathClicks) met = false;
        if (a.req.totalLumps && state.totalLumps < a.req.totalLumps) met = false;
        if (a.req.heavenlyCount && state.heavenlyUpgrades.length < a.req.heavenlyCount) met = false;
        if (a.req.spiritsCount && state.spirits.length < a.req.spiritsCount) met = false;
        if (a.req.seasonSobaClicks && state.seasonSobaClicks < a.req.seasonSobaClicks) met = false;
        if (a.req.seasonsAll && state.seasonsExperienced.length < SEASONS.length) met = false;
        if (a.req.artisanAttempts && state.artisanAttempts < a.req.artisanAttempts) met = false;
        if (a.req.artisanCrits && state.artisanCrits < a.req.artisanCrits) met = false;
        if (a.req.artisanPoints && state.artisanPoints < a.req.artisanPoints) met = false;
        if (a.req.spiritEquipped && !state.spirits.includes(a.req.spiritEquipped)) met = false;
        if (a.req.upgradeTypeAll) {
            const typeUpgrades = UPGRADES.filter(u => u.type === a.req.upgradeTypeAll);
            if (!typeUpgrades.every(u => state.upgrades.includes(u.id))) met = false;
        }
        if (a.req.challengesCompletedCount && (!state.challengesCompleted || state.challengesCompleted.length < a.req.challengesCompletedCount)) met = false;
        if (a.req.challengesAll && (!state.challengesCompleted || state.challengesCompleted.length < CHALLENGES.length)) met = false;
        if (a.req.regionsCount && (!state.regions || state.regions.length < a.req.regionsCount)) met = false;
        if (a.req.regionsAll && (!state.regions || state.regions.length < REGIONS.length)) met = false;

        if (met) {
            state.achievements.push(a.id);
            notify(`実績解除: ${a.name}`, "🏆", true);
            playSound('achieve');
        }
    });
}

function unlockShadowAchievement(id) {
    if (state.shadowAchievements.includes(id)) return;
    const a = SHADOW_ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    state.shadowAchievements.push(id);
    notify(`裏実績解除: ${a.name}`, "🌑", true);
}

function checkShadowAchievements() {
    if (state.clicks === 0 && state.allTimeSoba >= 50000) unlockShadowAchievement('shadow_pacifist');
    if (BUILDINGS.every(b => (state.buildings[b.id] || 0) === 1)) unlockShadowAchievement('shadow_equal');
    if (state.secretCounter >= 50) unlockShadowAchievement('shadow_reset_addict');
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) unlockShadowAchievement('shadow_midnight');
}

function prestige() {
    const soulsToGet = getSoulsToGet();
    if (soulsToGet <= 0) return;
    
    if (confirm(`本当に転生しますか？\n獲得する越前魂: ${soulsToGet} 個\n(施設やアップグレードはリセットされますが、生産ボーナスが得られます)`)) {
        state.souls += soulsToGet;
        state.prestigeCount++;
        resetState();
        applyStarterKit();
        state.activeOrder = null;
        scheduleNextOrder();
        calculateCps();
        closeAscensionScreen();
        switchTab('shop');
        notify("輪廻転生しました。新たな人生の始まりです。", "♻️");
    }
}

let goldenHideTimer = null;

function spawnGoldenSoba() {
    const gs = document.getElementById('golden-soba');
    const rand = Math.random();
    const season = getCurrentSeason();
    const wrathThreshold = Math.min(0.6, 0.20 * getWrathChanceMult());
    let type;
    if (rand < wrathThreshold) type = 'wrath';
    else if (rand < wrathThreshold + 0.12) type = 'season';
    else type = 'golden';

    gs.dataset.type = type;
    if (type === 'wrath') {
        gs.textContent = '😈🍜';
        gs.style.filter = 'drop-shadow(0 0 10px #a00) hue-rotate(300deg)';
    } else if (type === 'season') {
        gs.textContent = season.specialIcon;
        gs.style.filter = 'drop-shadow(0 0 12px #c77dff)';
    } else {
        gs.textContent = '🍜✨';
        gs.style.filter = 'drop-shadow(0 0 10px gold)';
    }
    const panel = document.getElementById('left-panel');
    const rect = panel.getBoundingClientRect();
    const margin = 60;
    const x = Math.random() * Math.max(0, rect.width - margin * 2) + margin - 45;
    const y = Math.random() * Math.max(0, rect.height - margin * 2) + margin - 45;
    gs.style.left = x + 'px';
    gs.style.top = y + 'px';
    gs.style.display = 'flex';
    gs.style.fontSize = '45px';
    gs.style.alignItems = 'center';
    gs.style.justifyContent = 'center';
    if (goldenHideTimer) clearTimeout(goldenHideTimer);
    goldenHideTimer = setTimeout(() => { gs.style.display = 'none'; goldenHideTimer = null; }, 12000);
}

document.getElementById('golden-soba').onpointerdown = function(e) {
    e.preventDefault();
    const type = this.dataset.type || 'golden';
    this.style.display = 'none';
    if (goldenHideTimer) { clearTimeout(goldenHideTimer); goldenHideTimer = null; }

    if (type === 'wrath') {
        state.wrathClicks++;
        if (Math.random() < 0.55) {
            const lost = state.soba * 0.15 * getWrathShieldMult();
            playSound('wrath');
            state.soba = Math.max(0, state.soba - lost);
            notify(`呪われしそば...そばを${fmt(lost)}杯失った。`, "😈");
            flashWrath();
        } else {
            const bonus = Math.max(500, cps * 666) * getGoldenBonusMult();
            state.soba += bonus;
            state.totalSoba += bonus;
            state.allTimeSoba += bonus;
            notify(`怨念の一撃！リスクを乗り越え${fmt(bonus)}杯を獲得！`, "🩸");
        }
        calculateCps();
        return;
    }

    if (type === 'season') {
        const season = getCurrentSeason();
        state.seasonSobaClicks++;
        if (!state.seasonsExperienced.includes(season.id)) state.seasonsExperienced.push(season.id);
        playSound('golden');
        const bonus = Math.max(2000, cps * 3000) * getGoldenBonusMult();
        state.soba += bonus;
        state.totalSoba += bonus;
        state.allTimeSoba += bonus;
        notify(`${season.specialName}を発見！${fmt(bonus)}杯の特別ボーナス！`, season.icon);
        calculateCps();
        return;
    }

    state.goldenClicks++;
    playSound('golden');
    const goldenBonusMult = getGoldenBonusMult();
    const rand = Math.random();
    if (rand < 0.35) {
        buffMult = 7;
        buffTimer = 77 * getFeverTimeMult();
        state.feverCount++;
        document.getElementById('app').classList.add('fever');
        notify(`フィーバータイム！${Math.round(buffTimer)}秒間、生産力が7倍！`, "🔥");
    } else if (rand < 0.60) {
        const bonus = Math.max(777, cps * 900) * goldenBonusMult;
        state.soba += bonus;
        state.totalSoba += bonus;
        state.allTimeSoba += bonus;
        notify(`ゴールデンそば！${fmt(bonus)}杯のそばを獲得！`, "✨");
    } else if (rand < 0.85) {
        clickBuffMult = 777;
        clickBuffTimer = 13 * getFeverTimeMult();
        notify(`クリックフィーバー！${Math.round(clickBuffTimer)}秒間、クリックパワーが777倍！`, "👆");
    } else {
        const bonus = Math.max(1000, cps * 7200) * goldenBonusMult;
        state.soba += bonus;
        state.totalSoba += bonus;
        state.allTimeSoba += bonus;
        notify(`黄金の豊作！大量の${fmt(bonus)}杯を獲得！`, "🌾");
    }
    calculateCps();
};

function getFeverTimeMult() {
    return state.heavenlyUpgrades.includes('heav_27') ? 1.5 : 1;
}

function flashWrath() {
    const el = document.getElementById('wrath-flash');
    el.classList.remove('show');
    void el.offsetWidth; // restart animation
    el.classList.add('show');
}

setInterval(() => {
    if (state.isChallengeRun === 'no_golden') return;
    const freqBonus = state.heavenlyUpgrades.includes('heav_2') ? 1.6 : 1;
    if (Math.random() < 0.05 * freqBonus * getSpawnFreqMult()) spawnGoldenSoba();
}, 10000);

function showTooltip(e, name, desc, cost) {
    const tt = document.getElementById('tooltip');
    tt.innerHTML = `
        <div class="tt-name">${name}</div>
        <div class="tt-desc">${desc}</div>
        ${cost > 0 ? `<div class="tt-cost">🍜 ${fmt(cost)}</div>` : ''}
    `;
    tt.style.display = 'block';
    // Keep the tooltip inside the viewport (matters on narrow phone screens)
    const margin = 8;
    let left = e.clientX + 15;
    let top = e.clientY + 15;
    if (left + tt.offsetWidth > window.innerWidth - margin) left = Math.max(margin, e.clientX - tt.offsetWidth - 15);
    if (top + tt.offsetHeight > window.innerHeight - margin) top = Math.max(margin, e.clientY - tt.offsetHeight - 15);
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
}

let touchTooltipTimer = null;

function hideTooltip(e) {
    // Mouse boundary events emulated after a touch must not close a tooltip opened by that touch
    if (e && e.type === 'mouseleave' && (touchTooltipTimer || touchPress)) return;
    if (touchTooltipTimer) { clearTimeout(touchTooltipTimer); touchTooltipTimer = null; }
    document.getElementById('tooltip').style.display = 'none';
}

function showTouchTooltip(el, e) {
    el.onmouseenter(e);
    if (touchTooltipTimer) clearTimeout(touchTooltipTimer);
    touchTooltipTimer = setTimeout(hideTooltip, 2500);
}

// Touch screens have no hover, so a long press shows the element's hover tooltip instead.
// Touches on elements with a tooltip are intercepted in the capture phase: a short tap runs the
// element's own pointerdown action on release, a long press only shows the tooltip, and a touch
// that turns into a scroll (pointercancel) does nothing. Elements without an action (e.g.
// achievement icons) show their tooltip on a plain tap too.
const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;
let touchPress = null;

function cancelTouchPress() {
    if (touchPress) clearTimeout(touchPress.timer);
    touchPress = null;
}

document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cancelTouchPress();
    let el = e.target;
    while (el && el !== document.body && !el.onmouseenter) el = el.parentElement;
    if (!el || el === document.body || !el.onmouseenter) { hideTooltip(); return; }
    // Stop the element's own handler; it runs on release if this turns out to be a short tap.
    // The element may be re-rendered while the finger is down, so keep its handlers now.
    e.stopPropagation();
    e.preventDefault();
    const press = { el, action: el.onpointerdown, x: e.clientX, y: e.clientY, longPressed: false };
    press.timer = setTimeout(() => {
        press.longPressed = true;
        showTouchTooltip(press.el, { clientX: press.x, clientY: press.y });
    }, LONG_PRESS_MS);
    touchPress = press;
}, true);

document.addEventListener('pointermove', (e) => {
    if (!touchPress || e.pointerType !== 'touch' || touchPress.longPressed) return;
    if (Math.hypot(e.clientX - touchPress.x, e.clientY - touchPress.y) > LONG_PRESS_MOVE_TOLERANCE) cancelTouchPress();
}, true);

document.addEventListener('pointerup', (e) => {
    if (!touchPress || e.pointerType !== 'touch') return;
    const press = touchPress;
    cancelTouchPress();
    if (press.longPressed) return;
    hideTooltip();
    if (press.action) press.action.call(press.el, e);
    else showTouchTooltip(press.el, e);
}, true);

document.addEventListener('pointercancel', cancelTouchPress, true);

// Suppress the browser's long-press context menu while a press is being tracked
document.addEventListener('contextmenu', (e) => { if (touchPress) e.preventDefault(); }, true);

function notify(msg, icon = "🔔", flash = false) {
    const container = document.getElementById('notif-container');
    const div = document.createElement('div');
    div.className = flash ? 'notif ach-flash' : 'notif';
    div.innerHTML = `${icon} ${msg}`;
    container.appendChild(div);
    // Keep bursts (e.g. many achievements at once) from covering the whole screen
    while (container.children.length > 4) container.firstElementChild.remove();
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(120%)';
        div.style.transition = '0.5s';
        setTimeout(() => div.remove(), 500);
    }, 4500);
}

function updateTicker() {
    const text = document.getElementById('news-text');
    text.textContent = NEWS[Math.floor(Math.random() * NEWS.length)];
}
setInterval(updateTicker, 30000);
updateTicker();
