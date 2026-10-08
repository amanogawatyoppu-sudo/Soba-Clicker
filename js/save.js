// 越前そばクリッカー: saving, loading and startup (must load last)
// Loaded as classic scripts in order (data → core → systems → save), sharing one global scope.

function saveGame(silent = false) {
    if (isResetting) return;
    state.lastSave = Date.now();
    if (state.isChallengeRun) {
        localStorage.setItem('echizenSobaChallengeState', JSON.stringify(state));
        if (!silent) notify("挑戦の進行状況を保存しました。");
        return;
    }
    localStorage.setItem('echizenSobaSaveV2_2', JSON.stringify(state));
    if (!silent) notify("ゲームを保存しました。");
}

function loadGame() {
    const challengeBackup = localStorage.getItem('echizenSobaChallengeBackup');
    const challengeState = localStorage.getItem('echizenSobaChallengeState');
    if (challengeBackup && challengeState) {
        // A challenge was in progress when the tab closed - resume it instead of the main save
        state = { ...state, ...JSON.parse(challengeState) };
        normalizeState();
        calculateCps();
        return;
    }

    const saved = localStorage.getItem('echizenSobaSaveV2_2');
    if (saved) {
        const loadedState = JSON.parse(saved);
        state = { ...state, ...loadedState };
        normalizeState();
        calculateCps();

        // --- オフライン進行(天界の力「まどろみの生産」で解放) ---
        const offlineSec = (Date.now() - (state.lastSave || Date.now())) / 1000;
        if (offlineSec > 10) {
            const gained = creditTimeAway(offlineSec);
            if (gained > 0) setTimeout(() => notify(`留守中 (${formatAwayTime(offlineSec)}) の生産！ +${fmt(gained)} 杯`, "⏰"), 1000);
        }
        state.lastSave = Date.now();
        lastUpdate = state.lastSave;
    }
}

function normalizeState() {
    if (!state.buildingLevels) state.buildingLevels = {};
    BUILDINGS.forEach(b => {
        if (state.buildings[b.id] === undefined) state.buildings[b.id] = 0;
        if (state.buildingLevels[b.id] === undefined) state.buildingLevels[b.id] = 0;
    });
    if (!state.heavenlyUpgrades) state.heavenlyUpgrades = [];
    if (!state.spirits) state.spirits = [];
    delete state.currentSeason; // legacy field, no longer used (season is derived live, not stored)
    if (!state.seasonsExperienced) state.seasonsExperienced = [];
    if (!state.seasonsExperienced.includes(getCurrentSeason().id)) state.seasonsExperienced.push(getCurrentSeason().id);
    if (state.seasonSobaClicks === undefined) state.seasonSobaClicks = 0;
    delete state.wrinklers; // legacy field, feature removed
    delete state.wrinklersPopped;
    delete state.shinyWrinklersPopped;
    if (!state.shadowAchievements) state.shadowAchievements = [];
    if (state.lastMasteryTier === undefined) state.lastMasteryTier = Math.floor(state.achievements.length / 10);
    if (state.artisanPoints === undefined) state.artisanPoints = 0;
    if (state.artisanAttempts === undefined) state.artisanAttempts = 0;
    if (state.artisanCrits === undefined) state.artisanCrits = 0;
    if (state.lastArtisanTime === undefined) state.lastArtisanTime = 0;
    if (state.lumps === undefined) state.lumps = 0;
    if (state.totalLumps === undefined) state.totalLumps = 0;
    if (state.wrathClicks === undefined) state.wrathClicks = 0;
    if (!state.lastLumpTime) state.lastLumpTime = Date.now();
    if (!state.challengesCompleted) state.challengesCompleted = [];
    if (state.challengeBonusPoints === undefined) state.challengeBonusPoints = 0;
    if (state.isChallengeRun === undefined) state.isChallengeRun = null;
    if (state.challengeStartTime === undefined) state.challengeStartTime = 0;
    if (!state.regions) state.regions = [];
    if (!state.farm) state.farm = createFreshFarm();
    if (!Array.isArray(state.farm.plots) || state.farm.plots.length !== FARM_MAX_SIZE * FARM_MAX_SIZE) state.farm.plots = createFreshFarm().plots;
    if (!state.farm.discovered) state.farm.discovered = ['common'];
    if (state.farm.harvests === undefined) state.farm.harvests = 0;
    if (state.reputation === undefined) state.reputation = 0;
    if (state.ordersCompleted === undefined) state.ordersCompleted = 0;
    if (state.ordersFailed === undefined) state.ordersFailed = 0;
    if (state.activeOrder === undefined) state.activeOrder = null;
    if (state.activeOrder && state.activeOrder.startTotal === undefined) {
        state.activeOrder.startTotal = state.totalSoba - Math.max(0, state.allTimeSoba - (state.activeOrder.startAll || state.allTimeSoba));
        delete state.activeOrder.startAll;
    }
    if (state.nextOrderTime === undefined) state.nextOrderTime = 0;
    if (state.loginStreak === undefined) state.loginStreak = 0;
    if (state.bestLoginStreak === undefined) state.bestLoginStreak = 0;
    if (state.lastLoginDay === undefined) state.lastLoginDay = '';
    if (state.buildingsSold === undefined) state.buildingsSold = 0;
    if (state.seenHints === undefined) {
        // Saves from before hints existed: only explain features the player hasn't reached yet
        state.seenHints = HINTS.filter(h => h.id !== 'welcome' && h.when()).map(h => h.id);
    }
}

function getMaxOfflineSec() {
    return (state.heavenlyUpgrades.includes('heav_21') ? 72 : 24) * 60 * 60;
}

function getOfflineMult() {
    return state.heavenlyUpgrades.includes('heav_22') ? 1.5 : 1;
}

// タブが隠れたとき自動セーブ（次回起動時のオフライン計算のため）
document.addEventListener('visibilitychange', () => {
    if (isResetting) return;
    if (document.visibilityState === 'hidden') {
        saveGame(true);
    } else {
        // タブに戻ってきたとき：隠れていた間の分を加算(初回転生後にのみ解放)
        // Only the time the game loop hasn't already credited: desktop browsers keep running the loop
        // (throttled) in background tabs, so counting from the last save paid that time twice.
        const now = Date.now();
        const awaySec = (now - lastUpdate) / 1000;
        if (awaySec > 5) {
            const gained = creditTimeAway(awaySec);
            if (gained > 0) notify(`タブ離席中 (${formatAwayTime(awaySec)}) の生産: +${fmt(gained)} 杯`, "😴");
        }
        lastUpdate = now;
        state.lastSave = now;
    }
});

function resetGame() {
    state.secretCounter++;
    if (confirm("本当にリセットしますか？全ての進捗が失われます。")) {
        isResetting = true;
        localStorage.removeItem('echizenSobaSaveV2_2');
        localStorage.removeItem('echizenSobaChallengeBackup');
        localStorage.removeItem('echizenSobaChallengeState');
        location.reload();
    }
}

setInterval(() => saveGame(true), 60000);
loadGame();
calculateCps();
applySettings();
switchTab('shop');
render();
checkHints();
checkLoginBonus();
