// 越前そばクリッカー: navigation, sound, settings, orders, farm, login bonus, visuals, hints
// Loaded as classic scripts in order (data → core → systems → save), sharing one global scope.

// ===================================================================
// Navigation: main groups along the top, sub tabs for the views inside a group
// ===================================================================
function getTotalBuildings() {
    return Object.values(state.buildings).reduce((a, b) => a + b, 0);
}

const TAB_GROUPS = [
    { id: 'shop', icon: '🏪', label: 'ショップ', views: [{ id: 'shop', label: 'ショップ' }] },
    { id: 'grow', icon: '🌱', label: '育成', views: [
        { id: 'farm', label: '🌾 そば畑', unlocked: () => state.allTimeSoba >= FARM_UNLOCK_SOBA || state.farm.discovered.length > 1 },
        { id: 'lump', label: '🍡 熟成' },
        { id: 'shrine', label: '⛩️ 祭壇', unlocked: () => getTotalBuildings() >= 50 || state.spirits.length > 0 },
        { id: 'map', label: '🗾 地図', unlocked: () => getTotalBuildings() >= 350 || state.regions.length > 0 }
    ] },
    { id: 'journey', icon: '☁️', label: '転生', views: [
        { id: 'prestige', label: '☁️ 転生', unlocked: () => state.allTimeSoba >= 1e12 || state.prestigeCount > 0 },
        { id: 'challenge', label: '⚔️ 挑戦', unlocked: () => state.prestigeCount >= 1 || !!state.isChallengeRun }
    ] },
    { id: 'record', icon: '📊', label: '記録', views: [{ id: 'stats', label: '📊 統計' }, { id: 'glossary', label: '📖 用語集' }] },
    { id: 'settings', icon: '⚙️', label: '設定', views: [{ id: 'settings', label: '設定' }] }
];

const VIEW_RENDERERS = {
    stats: () => renderStats(),
    shrine: () => renderShrine(),
    challenge: () => renderChallengeList(),
    map: () => renderMap(),
    glossary: () => renderGlossary(),
    farm: () => renderFarm(),
    lump: () => renderLumpList(),
    prestige: () => renderPrestigeView(),
    settings: () => renderSettings()
};

let activeView = 'shop';
const lastViewInGroup = {};
let tabSignature = '';

function isViewUnlocked(view) {
    return !view.unlocked || view.unlocked();
}

function findGroupOfView(viewId) {
    return TAB_GROUPS.find(g => g.views.some(v => v.id === viewId));
}

function renderTabs() {
    // Only rebuild when something visible changed; render() runs 10 times a second
    const signature = TAB_GROUPS.map(g => g.views.map(v => isViewUnlocked(v) ? 1 : 0).join('')).join('|') + ':' + activeView;
    if (signature === tabSignature) return;
    tabSignature = signature;

    const activeGroup = findGroupOfView(activeView);
    const main = document.getElementById('main-tabs');
    main.innerHTML = '';
    TAB_GROUPS.forEach(g => {
        const views = g.views.filter(isViewUnlocked);
        if (views.length === 0) return;
        const btn = document.createElement('button');
        btn.className = `main-tab ${g === activeGroup ? 'active' : ''}`;
        btn.innerHTML = `<span class="mt-icon">${g.icon}</span><span>${g.label}</span>`;
        btn.onclick = () => {
            const remembered = views.find(v => v.id === lastViewInGroup[g.id]);
            switchTab((remembered || views[0]).id);
        };
        main.appendChild(btn);
    });

    const sub = document.getElementById('sub-tabs');
    const views = activeGroup ? activeGroup.views.filter(isViewUnlocked) : [];
    sub.style.display = views.length > 1 ? 'flex' : 'none';
    sub.innerHTML = '';
    views.forEach(v => {
        const btn = document.createElement('button');
        btn.className = `sub-tab ${v.id === activeView ? 'active' : ''}`;
        btn.textContent = v.label;
        btn.onclick = () => switchTab(v.id);
        sub.appendChild(btn);
    });
}

function switchTab(viewId) {
    const group = findGroupOfView(viewId);
    if (!group) return;
    activeView = viewId;
    lastViewInGroup[group.id] = viewId;
    TAB_GROUPS.forEach(g => g.views.forEach(v => {
        const el = document.getElementById(v.id + '-view');
        if (el) el.style.display = 'none';
    }));
    document.getElementById(viewId + '-view').style.display = viewId === 'shop' ? 'flex' : 'block';
    hideTooltip();
    if (VIEW_RENDERERS[viewId]) VIEW_RENDERERS[viewId]();
    renderTabs();
}

function openSettingsFromPanel() {
    goToView('settings');
}

function renderPrestigeView() {
    const soulsToGet = Math.max(0, getSoulsToGet());
    document.getElementById('pv-souls').textContent = `${state.souls} 個 (+${getSoulBonusPercent()}%)`;
    document.getElementById('pv-available').textContent = `${getAvailableSouls()} 個`;
    document.getElementById('pv-gain').textContent = `${soulsToGet} 個`;
    document.getElementById('pv-count').textContent = `${state.prestigeCount} 回`;
}

// ===================================================================
// Sound effects (tiny WebAudio synth, no audio files needed)
// ===================================================================
const SOUNDS = {
    // [frequency, start offset (s), duration (s), waveform, volume]
    click: [[520, 0, 0.05, 'triangle', 0.035]],
    buy: [[660, 0, 0.06, 'square', 0.02], [880, 0.05, 0.08, 'square', 0.018]],
    golden: [[784, 0, 0.1, 'triangle', 0.05], [988, 0.08, 0.1, 'triangle', 0.05], [1319, 0.16, 0.2, 'triangle', 0.05]],
    achieve: [[659, 0, 0.12, 'sine', 0.06], [988, 0.1, 0.22, 'sine', 0.06]],
    wrath: [[110, 0, 0.35, 'sawtooth', 0.04]],
    order: [[523, 0, 0.1, 'sine', 0.05], [659, 0.1, 0.1, 'sine', 0.05], [784, 0.2, 0.22, 'sine', 0.05]],
    harvest: [[440, 0, 0.08, 'triangle', 0.05], [660, 0.06, 0.14, 'triangle', 0.05]],
    fail: [[330, 0, 0.15, 'sine', 0.05], [247, 0.12, 0.28, 'sine', 0.05]]
};
let audioCtx = null;

function playSound(kind) {
    if (!settings.sound || !SOUNDS[kind]) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        SOUNDS[kind].forEach(([freq, offset, dur, type, vol]) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t + offset);
            gain.gain.setValueAtTime(vol, t + offset);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t + offset);
            osc.stop(t + offset + dur + 0.02);
        });
    } catch (e) { /* audio not available: play silently */ }
}

// ===================================================================
// Settings
// ===================================================================
const NUMBER_FORMATS = { jp: '日本式 (1.2億)', sci: '指数 (1.2e8)' };

function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* storage unavailable */ }
    applySettings();
    renderSettings();
    render();
}

function applySettings() {
    document.body.classList.toggle('reduced', settings.reduceEffects);
}

function toggleSetting(key) {
    settings[key] = !settings[key];
    saveSettings();
}

function cycleNumberFormat() {
    settings.numberFormat = settings.numberFormat === 'jp' ? 'sci' : 'jp';
    saveSettings();
}

function renderSettings() {
    const setToggle = (id, on) => {
        const btn = document.getElementById(id);
        btn.classList.toggle('on', on);
        btn.textContent = on ? 'ON' : 'OFF';
    };
    setToggle('set-sound', settings.sound);
    setToggle('set-reduce', settings.reduceEffects);
    document.getElementById('set-numfmt').textContent = NUMBER_FORMATS[settings.numberFormat];
}

// ===================================================================
// Save export / import
// ===================================================================
const MAIN_SAVE_KEY = 'echizenSobaSaveV2_2';

function encodeSave(json) {
    return btoa(unescape(encodeURIComponent(json)));
}

function decodeSave(code) {
    const text = code.trim();
    if (text.startsWith('{')) return JSON.parse(text);
    return JSON.parse(decodeURIComponent(escape(atob(text.replace(/\s+/g, '')))));
}

function getExportCode() {
    if (state.isChallengeRun) {
        notify("挑戦中は書き出しできません。先に挑戦をクリアか中断してください。", "⚔️");
        return null;
    }
    saveGame(true);
    return encodeSave(localStorage.getItem(MAIN_SAVE_KEY));
}

function exportSave() {
    const code = getExportCode();
    if (!code) return;
    const area = document.getElementById('save-code');
    area.value = code;
    area.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
            .then(() => notify("セーブデータをコピーしました。メモ帳などに貼り付けて保管してください。", "📋"))
            .catch(() => notify("セーブデータを書き出しました。表示された文字列をコピーしてください。", "📋"));
    } else {
        notify("セーブデータを書き出しました。表示された文字列をコピーしてください。", "📋");
    }
}

function downloadSave() {
    const code = getExportCode();
    if (!code) return;
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `echizen-soba-save-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("セーブデータをファイルに保存しました。", "💾");
}

function importSave(code) {
    if (!code || !code.trim()) {
        notify("読み込むセーブデータを貼り付けてください。", "📥");
        return;
    }
    let data;
    try {
        data = decodeSave(code);
    } catch (e) {
        data = null;
    }
    if (!data || typeof data !== 'object' || typeof data.soba !== 'number' || typeof data.buildings !== 'object') {
        notify("セーブデータを読み取れませんでした。文字列が途中で切れていないか確認してください。", "⚠️", true);
        return;
    }
    const summary = `累計 ${fmt(data.allTimeSoba || 0)} 杯 / 転生 ${data.prestigeCount || 0} 回 / 実績 ${(data.achievements || []).length} 個`;
    if (!confirm(`このセーブデータを読み込みますか？\n${summary}\n\n今の進行状況は上書きされます(挑戦中のデータも破棄されます)。`)) return;
    isResetting = true; // stop autosaves from overwriting the imported data before the reload
    delete data.isChallengeRun;
    localStorage.setItem(MAIN_SAVE_KEY, JSON.stringify(data));
    localStorage.removeItem('echizenSobaChallengeBackup');
    localStorage.removeItem('echizenSobaChallengeState');
    location.reload();
}

function importSaveFile(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importSave(String(reader.result));
    reader.onerror = () => notify("ファイルを読み込めませんでした。", "⚠️", true);
    reader.readAsText(file);
}

// ===================================================================
// Selling buildings
// ===================================================================
function setShopMode(mode) {
    shopMode = mode;
    render();
}

function getSellQuantity(b) {
    const owned = state.buildings[b.id] || 0;
    return buyAmount === 'max' ? owned : Math.min(buyAmount, owned);
}

function getSellRefund(b, quantity) {
    const params = getBuildingCostParams();
    const owned = state.buildings[b.id] || 0;
    let total = 0;
    for (let i = 0; i < quantity; i++) total += getBuildingCost(b, owned - 1 - i, params);
    return Math.floor(total * SELL_REFUND_RATE);
}

function sellBuilding(id) {
    const b = BUILDINGS.find(x => x.id === id);
    const quantity = getSellQuantity(b);
    if (quantity <= 0) return;
    const refund = getSellRefund(b, quantity);
    state.soba += refund;
    state.buildings[id] -= quantity;
    state.buildingsSold += quantity;
    playSound('buy');
    calculateCps();
    render();
}



// ===================================================================
// Customer orders: make N soba within a time limit for money and reputation
// ===================================================================
function getBaseCps() {
    // Production without a running fever, so orders and rewards don't scale off a temporary buff
    return buffMult > 0 ? cps / buffMult : cps;
}

// Soba made since the order arrived. Measured on this life's total, not the all-time total: after
// many prestiges the all-time total is so large that a new run's small gains vanish in floating
// point when added to it, and the order could never progress.
function getOrderProgress(order) {
    return Math.max(0, state.totalSoba - order.startTotal);
}

function orderTick(now) {
    if (state.activeOrder) {
        const order = state.activeOrder;
        // Deadline first: production credited in one lump after it (time away, a background tab)
        // must not complete an order that had already expired
        if (now >= order.deadline) failOrder();
        else if (getOrderProgress(order) >= order.target) completeOrder();
        return;
    }
    if (!state.nextOrderTime) { state.nextOrderTime = now + ORDER_FIRST_DELAY; return; }
    if (now < state.nextOrderTime || getBaseCps() <= 0) return;
    startOrder(now);
}

function getReputationMax() {
    return state.heavenlyUpgrades.includes('heav_23') ? 150 : REPUTATION_MAX;
}

function scheduleNextOrder() {
    const gapMult = state.heavenlyUpgrades.includes('heav_24') ? 0.5 : 1;
    state.nextOrderTime = Date.now() + (ORDER_MIN_GAP + Math.random() * (ORDER_MAX_GAP - ORDER_MIN_GAP)) * gapMult;
}

function startOrder(now) {
    const customerIdx = Math.floor(Math.random() * ORDER_CUSTOMERS.length);
    const customer = ORDER_CUSTOMERS[customerIdx];
    const baseCps = getBaseCps();
    const baseClick = clickPower / (clickBuffMult || 1);
    const duration = Math.round((60 + Math.random() * 60) * getRegionEffectMult('orderTime'));
    // Idle production alone falls a little short: steady clicking (about 3 per second), buying
    // buildings or a golden soba closes the gap. Tuned with a simulation to succeed most of the time.
    const target = Math.max(200, baseCps * duration * (1 + Math.random() * 0.15) + baseClick * duration * 1.5);
    const reward = Math.max(500, baseCps * duration * 2) * (state.heavenlyUpgrades.includes('heav_23') ? 2 : 1);
    state.activeOrder = { customer: customerIdx, target, reward, startTotal: state.totalSoba, deadline: now + duration * 1000 };
    notify(`${customer.name}から注文！${duration}秒以内に${fmt(target)}杯を作ろう。`, customer.icon, true);
    playSound('order');
}

function completeOrder() {
    const order = state.activeOrder;
    const customer = ORDER_CUSTOMERS[order.customer];
    state.soba += order.reward;
    state.totalSoba += order.reward;
    state.allTimeSoba += order.reward;
    state.ordersCompleted++;
    const repUp = state.reputation < getReputationMax();
    state.reputation = Math.min(getReputationMax(), state.reputation + 1);
    state.activeOrder = null;
    scheduleNextOrder();
    calculateCps();
    notify(`${customer.name}の注文を達成！報酬 ${fmt(order.reward)} 杯${repUp ? '・評判+1' : ''}`, "🎉", true);
    playSound('order');
}

function failOrder() {
    const customer = ORDER_CUSTOMERS[state.activeOrder.customer];
    state.ordersFailed++;
    state.activeOrder = null;
    scheduleNextOrder();
    notify(`${customer.name}の注文は時間切れ…。次は頑張ろう。`, "⌛");
    playSound('fail');
}

function declineOrder() {
    if (!state.activeOrder) return;
    state.activeOrder = null;
    scheduleNextOrder();
    notify("注文を断りました。", "🙇");
    render();
}

function renderOrderBanner() {
    const banner = document.getElementById('order-banner');
    const order = state.activeOrder;
    if (!order) { banner.style.display = 'none'; return; }
    const customer = ORDER_CUSTOMERS[order.customer];
    const made = getOrderProgress(order);
    const ratio = Math.min(1, made / order.target);
    const secLeft = Math.max(0, Math.ceil((order.deadline - Date.now()) / 1000));
    banner.style.display = 'block';
    document.getElementById('order-customer').textContent = `${customer.icon} ${customer.name}の注文`;
    document.getElementById('order-bar-fill').style.width = (ratio * 100).toFixed(1) + '%';
    document.getElementById('order-progress').textContent = `${fmt(made)} / ${fmt(order.target)} 杯`;
    const timeEl = document.getElementById('order-time');
    timeEl.textContent = `残り ${secLeft} 秒`;
    timeEl.className = secLeft <= 15 ? 'urgent' : '';
}

// ===================================================================
// Soba farm
// ===================================================================
function getFarmSize() {
    return state.farm.discovered.includes('ono') ? 4 : 3;
}

function isPlotActive(i) {
    const size = getFarmSize();
    return Math.floor(i / FARM_MAX_SIZE) < size && i % FARM_MAX_SIZE < size;
}

function getCrop(id) {
    return CROPS.find(c => c.id === id);
}

function getCropGrowMs(crop) {
    const heavenly = state.heavenlyUpgrades.includes('heav_25') ? 1.5 : 1;
    return crop.growMin * 60000 / (getRegionEffectMult('farmSpeed') * heavenly);
}

function getPlotProgress(plot) {
    return Math.min(1, (Date.now() - plot.plantedAt) / getCropGrowMs(getCrop(plot.crop)));
}

function isPlotMature(plot) {
    return !!plot && getPlotProgress(plot) >= 1;
}

function getFarmEffectBonus(type) {
    let bonus = 0;
    state.farm.plots.forEach((plot, i) => {
        if (!plot || !isPlotActive(i) || !isPlotMature(plot)) return;
        const crop = getCrop(plot.crop);
        if (crop.effect.type === type) bonus += crop.effect.value;
    });
    return bonus;
}

function getFarmCpsMult() {
    // Mature crops' production bonus, plus a permanent +2% for every strain discovered beyond the first
    return (1 + getFarmEffectBonus('cps')) * (1 + (state.farm.discovered.length - 1) * 0.02);
}

function getSeedCost(crop) {
    return Math.max(crop.minCost, getBaseCps() * crop.costSec);
}

function selectSeed(id) {
    selectedSeed = id;
    renderFarm();
}

function plantSeed(i) {
    const crop = getCrop(selectedSeed);
    if (!crop || !state.farm.discovered.includes(crop.id)) return;
    const cost = getSeedCost(crop);
    if (state.soba < cost) {
        notify(`${crop.name}の種を買うには ${fmt(cost)} 杯必要です。`, "🌱");
        return;
    }
    state.soba -= cost;
    state.farm.plots[i] = { crop: crop.id, plantedAt: Date.now() };
    playSound('buy');
    render();
}

function getHarvestAmount(crop) {
    const mult = state.heavenlyUpgrades.includes('heav_26') ? 2 : 1;
    return Math.max(crop.minCost * 2, getBaseCps() * crop.harvestSec) * mult;
}

function harvestPlot(i, silent) {
    const plot = state.farm.plots[i];
    if (!isPlotMature(plot)) return 0;
    const crop = getCrop(plot.crop);
    const gain = getHarvestAmount(crop);
    state.soba += gain;
    state.totalSoba += gain;
    state.allTimeSoba += gain;
    state.farm.plots[i] = null;
    state.farm.harvests++;
    if (!silent) {
        notify(`${crop.name}を収穫！${fmt(gain)} 杯を獲得。`, crop.icon);
        playSound('harvest');
        calculateCps();
        render();
    }
    return gain;
}

function harvestAll() {
    let total = 0, count = 0;
    state.farm.plots.forEach((plot, i) => {
        if (isPlotActive(i) && isPlotMature(plot)) { total += harvestPlot(i, true); count++; }
    });
    if (count === 0) { notify("実っている作物はまだありません。", "🌱"); return; }
    notify(`${count}株をまとめて収穫！${fmt(total)} 杯を獲得。`, "🧺");
    playSound('harvest');
    calculateCps();
    render();
}

function onPlotTap(i) {
    const plot = state.farm.plots[i];
    if (!plot) plantSeed(i);
    else if (isPlotMature(plot)) harvestPlot(i);
}

function getMatureNeighbors(i) {
    const r = Math.floor(i / FARM_MAX_SIZE), c = i % FARM_MAX_SIZE;
    const found = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nc < 0 || nr >= FARM_MAX_SIZE || nc >= FARM_MAX_SIZE) continue;
            const j = nr * FARM_MAX_SIZE + nc;
            if (isPlotActive(j) && isPlotMature(state.farm.plots[j])) found.push(state.farm.plots[j].crop);
        }
    }
    return found;
}

let lastFarmMutationCheck = 0;

function farmTick(now) {
    // Cross-breeding: an empty plot next to the right mature parents may sprout a new strain
    if (now - lastFarmMutationCheck < 3000) return;
    lastFarmMutationCheck = now;
    state.farm.plots.forEach((plot, i) => {
        if (plot || !isPlotActive(i)) return;
        const neighbors = getMatureNeighbors(i);
        if (neighbors.length < 2) return;
        for (const recipe of CROP_RECIPES) {
            const [a, b] = recipe.parents;
            const ok = a === b
                ? neighbors.filter(n => n === a).length >= 2
                : neighbors.includes(a) && neighbors.includes(b);
            if (!ok || Math.random() >= recipe.chance * (state.heavenlyUpgrades.includes('heav_26') ? 2 : 1)) continue;
            state.farm.plots[i] = { crop: recipe.child, plantedAt: now };
            const crop = getCrop(recipe.child);
            if (!state.farm.discovered.includes(crop.id)) {
                state.farm.discovered.push(crop.id);
                notify(`新種発見！そば畑に「${crop.name}」が芽吹いた！(全生産+2%)`, crop.icon, true);
                playSound('achieve');
                if (crop.id === 'ono') notify("そば畑が4×4に広がった！", "🌾");
            } else {
                notify(`そば畑に${crop.name}が芽吹いた。`, crop.icon);
            }
            break;
        }
    });
}

function formatDuration(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return `${h}時間${m}分`;
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
}

function renderFarm() {
    if (activeView !== 'farm') return;
    const size = getFarmSize();
    const farmSig = [
        selectedSeed, size, state.farm.discovered.join(),
        CROPS.filter(c => state.farm.discovered.includes(c.id)).map(c => fmt(getSeedCost(c)) + (state.soba >= getSeedCost(c))).join(),
        state.farm.plots.map(pl => pl ? pl.crop + Math.floor(getPlotProgress(pl) * 50) : '-').join()
    ].join('|');
    if (!hasChanged('farm', farmSig)) return;

    const seeds = document.getElementById('farm-seeds');
    seeds.innerHTML = '';
    CROPS.filter(c => state.farm.discovered.includes(c.id)).forEach(crop => {
        const cost = getSeedCost(crop);
        const div = document.createElement('div');
        div.className = `seed-btn ${selectedSeed === crop.id ? 'selected' : ''} ${state.soba < cost ? 'poor' : ''}`;
        div.innerHTML = `<span style="font-size:18px">${crop.icon}</span><span>${crop.name}<br><span class="seed-cost">🍜 ${fmt(cost)}</span></span>`;
        div.onpointerdown = (e) => { e.preventDefault(); selectSeed(crop.id); };
        div.onmouseenter = (e) => showTooltip(e, crop.name, `${crop.desc}<br>成長: ${formatDuration(getCropGrowMs(crop))}<br>${crop.effectDesc}`, cost);
        div.onmouseleave = hideTooltip;
        seeds.appendChild(div);
    });

    const grid = document.getElementById('farm-grid');
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    state.farm.plots.forEach((plot, i) => {
        if (!isPlotActive(i)) return;
        const div = document.createElement('div');
        if (!plot) {
            div.className = 'farm-plot empty';
            div.textContent = '＋';
            div.onmouseenter = (e) => showTooltip(e, '空き地', '選んだ種をタップで植えられます。<br>実った作物の隣では新種が芽吹くことも。', 0);
        } else {
            const crop = getCrop(plot.crop);
            const progress = getPlotProgress(plot);
            const mature = progress >= 1;
            div.className = `farm-plot ${mature ? 'mature' : 'growing'}`;
            div.innerHTML = `<span class="plot-icon">${crop.icon}</span>` +
                (mature ? '' : `<div class="plot-bar"><div style="width:${(progress * 100).toFixed(1)}%"></div></div>`);
            // Computed on hover: the grid is only rebuilt every 2% of growth
            div.onmouseenter = (e) => showTooltip(e, crop.name, isPlotMature(plot)
                ? `実りました！タップで収穫(約${fmt(getHarvestAmount(crop))}杯)<br>${crop.effectDesc}`
                : `成長中… あと${formatDuration(getCropGrowMs(crop) * (1 - getPlotProgress(plot)))}`, 0);
        }
        div.onpointerdown = (e) => { e.preventDefault(); onPlotTap(i); };
        div.onmouseleave = hideTooltip;
        grid.appendChild(div);
    });

    document.getElementById('farm-dex-count').textContent = `${state.farm.discovered.length}/${CROPS.length}`;
    const dex = document.getElementById('farm-dex');
    dex.innerHTML = '';
    CROPS.forEach(crop => {
        const found = state.farm.discovered.includes(crop.id);
        const recipe = CROP_RECIPES.find(r => r.child === crop.id);
        let desc;
        if (found) desc = `${crop.desc}<br><span style="color:#9ccc65">${crop.effectDesc}</span>`;
        else if (recipe && recipe.parents.every(p => state.farm.discovered.includes(p))) {
            const [a, b] = recipe.parents.map(p => getCrop(p).name);
            desc = `ヒント: ${a === b ? `実った${a}を2株` : `実った${a}と${b}`}の隣の空き地に芽吹くらしい…`;
        } else desc = 'まだ誰も知らない在来種。';
        const div = document.createElement('div');
        div.className = 'dex-item';
        div.innerHTML = `
            <div class="dex-icon" style="${found ? '' : 'filter:grayscale(1) brightness(0.4)'}">${found ? crop.icon : '❓'}</div>
            <div><div class="dex-name">${found ? crop.name : '？？？'}</div><div class="dex-desc">${desc}</div></div>
        `;
        dex.appendChild(div);
    });
}

// ===================================================================
// Daily login bonus
// ===================================================================
function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkLoginBonus() {
    if (state.isChallengeRun || isResetting) return;
    const now = new Date();
    const today = localDateStr(now);
    if (state.lastLoginDay === today) return;
    if (!state.lastLoginDay && state.allTimeSoba === 0) {
        // Very first launch: the welcome hint is enough; the streak starts today and pays out tomorrow
        state.lastLoginDay = today;
        state.loginStreak = state.bestLoginStreak = 1;
        return;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    state.loginStreak = state.lastLoginDay === localDateStr(yesterday) ? state.loginStreak + 1 : 1;
    state.lastLoginDay = today;
    state.bestLoginStreak = Math.max(state.bestLoginStreak, state.loginStreak);

    const day = ((state.loginStreak - 1) % 7) + 1;
    const reward = Math.max(1000 * day, getBaseCps() * 600 * day);
    state.soba += reward;
    state.totalSoba += reward;
    state.allTimeSoba += reward;
    const lumpBonus = day === 7;
    if (lumpBonus) { state.lumps++; state.totalLumps++; }
    saveGame(true);
    showLoginBonusModal(day, reward, lumpBonus);
}

function showLoginBonusModal(day, reward, lumpBonus) {
    let cells = '';
    for (let d = 1; d <= 7; d++) {
        const cls = d < day ? 'done' : (d === day ? 'today' : '');
        cells += `<div class="login-day ${cls}"><span class="ld-icon">${d === 7 ? '🎁' : (d <= day ? '🍜' : '・')}</span>${d}日目</div>`;
    }
    showModal(`
        <div class="modal-title">🎁 ログインボーナス</div>
        <div style="font-size:13px; color:var(--muted)">連続 ${state.loginStreak} 日目のご来店、ありがとうございます！</div>
        <div class="login-days">${cells}</div>
        <div style="font-size:18px; font-weight:900; color:var(--accent); margin-bottom:4px">+${fmt(reward)} 杯</div>
        ${lumpBonus ? '<div style="font-size:13px; margin-bottom:4px">＋ 🍡 そば粉の塊 1個</div>' : ''}
        <div style="font-size:11px; color:var(--muted); margin-bottom:16px">毎日遊ぶと報酬が増え、7日目には特別なおまけがもらえます。</div>
        <button class="prestige-btn" style="margin:0; padding:12px; background:linear-gradient(135deg,#6b4a00,#2a1800); border-color:var(--accent)" onclick="closeModal()">受け取る</button>
    `);
    playSound('golden');
}

const modalQueue = [];

function isModalOpen() {
    return document.getElementById('modal-overlay').style.display === 'flex';
}

function showModal(html) {
    // One dialog at a time: later ones (e.g. a hint right after the login bonus) wait their turn
    if (isModalOpen()) { modalQueue.push(html); return; }
    document.getElementById('modal-box').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    if (modalQueue.length) showModal(modalQueue.shift());
}

// ===================================================================
// Visual growth: scenery stages, buff display, purchase pops
// ===================================================================
const SHOP_STAGES = [
    { min: 0, name: '🏮 小さなそば屋', bg: 'radial-gradient(circle at center, #2a1800 0%, #1a0f00 100%)' },
    { min: 1e6, name: '🏘️ 越前の人気店', bg: 'radial-gradient(circle at 50% 40%, #3d2206 0%, #1a0f00 100%)' },
    { min: 1e9, name: '🏙️ そばの街', bg: 'radial-gradient(circle at 50% 40%, #243240 0%, #120d08 100%)' },
    { min: 1e15, name: '🌍 世界に広がるそば', bg: 'radial-gradient(circle at 50% 40%, #0f2b45 0%, #07121f 100%)', stars: true },
    { min: 1e21, name: '🌌 宇宙そば時代', bg: 'radial-gradient(circle at 50% 40%, #2a1450 0%, #0a0518 100%)', stars: true },
    { min: 1e27, name: '♾️ 概念のそば', bg: 'radial-gradient(circle at 50% 40%, #4a0f3a 0%, #12030e 100%)', stars: true }
];
let currentStageIdx = -1;

function renderStage() {
    let idx = 0;
    SHOP_STAGES.forEach((st, i) => { if (state.totalSoba >= st.min) idx = i; });
    if (idx === currentStageIdx) return;
    const grew = currentStageIdx >= 0 && idx > currentStageIdx;
    currentStageIdx = idx;
    const stage = SHOP_STAGES[idx];
    const panel = document.getElementById('left-panel');
    panel.style.setProperty('--stage-bg', stage.bg);
    panel.classList.toggle('starry', !!stage.stars);
    document.getElementById('stage-label').textContent = stage.name;
    if (grew) {
        notify(`お店が成長した！「${stage.name}」`, "🎊", true);
        playSound('achieve');
    }
}

function renderBuffBar() {
    let html = '';
    if (buffMult > 1 && buffTimer > 0) html += `<span class="buff-chip">🔥 FEVER ×${buffMult} 残り${Math.ceil(buffTimer)}秒</span>`;
    if (clickBuffMult > 1 && clickBuffTimer > 0) html += `<span class="buff-chip click">👆 クリック×${clickBuffMult} 残り${Math.ceil(clickBuffTimer)}秒</span>`;
    setHTMLIfChanged(document.getElementById('buff-bar'), html);
    document.getElementById('fever-overlay').classList.toggle('on', buffMult > 1);
}

function spawnBuyPop(buildingId, text) {
    if (settings.reduceEffects) return;
    const el = shopItemEls[buildingId];
    if (!el || !el.offsetParent) return;
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'buy-pop';
    pop.textContent = text;
    pop.style.left = (rect.right - 90) + 'px';
    pop.style.top = (rect.top + rect.height / 2 - 14) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

// ===================================================================
// First-time hints: a short explanation the first time each feature appears
// ===================================================================
function getViewDef(viewId) {
    for (const g of TAB_GROUPS) {
        const v = g.views.find(x => x.id === viewId);
        if (v) return v;
    }
    return null;
}

function viewUnlocked(viewId) {
    const v = getViewDef(viewId);
    return !!v && isViewUnlocked(v);
}

const HINTS = [
    { id: 'welcome', icon: '🍜', title: '越前そばクリッカーへようこそ！', text: '真ん中のそばをクリック(スペースキーでもOK)して、そばを打とう。<br>たまったそばでショップの「施設」を買うと、自動でそばが増えていきます。', when: () => state.allTimeSoba === 0 && state.clicks === 0 },
    { id: 'upgrade', icon: '⭐', title: 'アップグレードが登場', text: 'ショップの上段に並ぶアイコンは「アップグレード」。一度買えば、クリックや施設の効率がずっと上がります。<br>カーソルを合わせる(スマホは長押し)と効果が見られます。', when: () => state.allTimeSoba >= 50 },
    { id: 'order', icon: '📋', title: 'お客さんから注文が来た！', text: '左に出ている注文を制限時間内に達成すると、報酬と「評判」(全生産アップ)がもらえます。<br>クリックや施設の購入で追い込もう。失敗しても罰はありません。', when: () => !!state.activeOrder },
    { id: 'lump', view: 'lump', icon: '🍡', title: 'そば粉の塊が手に入った', text: '「育成 → 熟成」で、持っている施設を塊1個につき永続+1%強化できます。<br>塊は20分に1個、遊んでいない間もたまります。', when: () => state.totalLumps > 0 },
    { id: 'farm', view: 'farm', icon: '🌾', title: 'そば畑が解放された', text: '「育成 → そば畑」で種をまくと、現実の時間で育ちます。実っている間は効果が続き、収穫するとそばが手に入ります。<br>実った作物の隣の空き地には、福井の在来種が芽吹くことも…。', when: () => viewUnlocked('farm') },
    { id: 'shrine', view: 'shrine', icon: '⛩️', title: 'そばの祭壇が解放された', text: '「育成 → 祭壇」で、そばの精霊を2柱まで祀れます。<br>精霊は強い恩恵と引き換えにデメリットも持つので、組み合わせを考えよう。', when: () => viewUnlocked('shrine') },
    { id: 'map', view: 'map', icon: '🗾', title: '福井ご当地MAPが解放された', text: '「育成 → 地図」で、福井県内の各地に支店を出せます。<br>支店ごとに、その土地ならではの永続ボーナスがもらえます。', when: () => viewUnlocked('map') },
    { id: 'prestige', view: 'prestige', icon: '☁️', title: '転生できるようになった', text: '累計1兆杯に到達しました。転生すると施設やそばはリセットされますが、「越前魂」を得て全生産がずっと強化されます。<br>越前魂は多く貯めてから転生するほど多くもらえるので、急がなくても大丈夫です。', when: () => viewUnlocked('prestige') },
    { id: 'challenge', view: 'challenge', icon: '⚔️', title: '挑戦モードが解放された', text: '「転生 → 挑戦」で、特殊なルールのもとで目標を目指せます。今の進行状況は安全に退避されます。<br>クリアするごとに恒久ボーナス+3%。', when: () => viewUnlocked('challenge') }
];

function checkHints() {
    if (state.isChallengeRun || isResetting || isModalOpen()) return;
    if (!state.seenHints) state.seenHints = [];
    const hint = HINTS.find(h => !state.seenHints.includes(h.id) && h.when());
    if (!hint) return;
    state.seenHints.push(hint.id);
    const buttons = hint.view
        ? `<div class="btn-row" style="justify-content:center">
               <button class="action-btn" onclick="closeModal()">あとで</button>
               <button class="action-btn" style="background:var(--accent); color:#1a0f00; border-color:var(--accent)" onclick="closeModal(); goToView('${hint.view}')">見に行く</button>
           </div>`
        : `<button class="action-btn" style="background:var(--accent); color:#1a0f00; border-color:var(--accent); min-width:140px" onclick="closeModal()">わかった</button>`;
    showModal(`
        <div class="hint-icon">${hint.icon}</div>
        <div class="modal-title">${hint.title}</div>
        <div class="hint-text">${hint.text}</div>
        ${buttons}
    `);
}

function goToView(viewId) {
    switchTab(viewId);
    // On phones the panels are stacked, so bring the tab into view
    if (window.innerWidth <= 900) document.getElementById('right-panel').scrollIntoView({ behavior: 'smooth' });
}
