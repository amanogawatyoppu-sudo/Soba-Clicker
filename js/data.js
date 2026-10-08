// 越前そばクリッカー: game data (buildings, upgrades, achievements, …)
// Loaded as classic scripts in order (data → core → systems → save), sharing one global scope.

// --- Game Data ---
// Later buildings pay back progressively slower (cost / production grows ~2.6x per step from the shrine on).
// Before, the top buildings grew in production almost as fast as in price, so a big prestige bonus
// climbed the whole list in minutes and the endgame was over within an hour.
const BUILDINGS = [
    { id: 'student', name: 'そば打ち見習い', icon: '👦', baseCost: 15, baseCps: 0.5, desc: '地元の若者が手伝いに来てくれた。' },
    { id: 'kitchen', name: '家庭用厨房', icon: '🏠', baseCost: 100, baseCps: 2, desc: '台所を改造して効率アップ。' },
    { id: 'mill', name: '石臼製粉機', icon: '⚙️', baseCost: 1100, baseCps: 12, desc: '挽きたての香りが客を呼ぶ。' },
    { id: 'shop', name: 'そば処', icon: '🏮', baseCost: 12000, baseCps: 55, desc: '越前の街角に店を構える。' },
    { id: 'factory', name: '製麺工場', icon: '🏭', baseCost: 130000, baseCps: 320, desc: 'オートメーション化された越前そば。' },
    { id: 'festival', name: '越前そば祭り', icon: '🎋', baseCost: 1400000, baseCps: 1800, desc: '県外からも大量の観光客が！' },
    { id: 'robot', name: 'AI製麺ロボ', icon: '🤖', baseCost: 20000000, baseCps: 9500, desc: '完璧な加水率を計算する。' },
    { id: 'satellite', name: '宇宙そば農場', icon: '🛸', baseCost: 330000000, baseCps: 55000, desc: '無重力で育つ究極のそば粉。' },
    { id: 'shrine', name: 'そばの聖地', icon: '⛩️', baseCost: 5100000000, baseCps: 320000, desc: '越前そばはもはや信仰の対象。' },
    { id: 'timemachine', name: '時間跳躍製麺機', icon: '⏳', baseCost: 75000000000, baseCps: 1.8e06, desc: '茹で上がる前に食べる。' },
    { id: 'dimension', name: '異次元そば門', icon: '🌀', baseCost: 1000000000000, baseCps: 9.3e06, desc: '別の宇宙からそばを召喚する。' },
    { id: 'god', name: 'そばの神髄', icon: '👁️', baseCost: 15000000000000, baseCps: 5.4e07, desc: 'もはや言葉では説明できない。' },
    { id: 'galaxy', name: '越前そば銀河鉄道', icon: '🚂', baseCost: 200000000000000, baseCps: 2.7e08, desc: '銀河中にそばを配達する。' },
    { id: 'parallel', name: '多次元そば並行世界', icon: '🌌', baseCost: 3000000000000000, baseCps: 1.6e09, desc: 'あらゆる可能性のそばを集める。' },
    { id: 'quantum', name: '量子もつれ製麺', icon: '⚛️', baseCost: 50000000000000000, baseCps: 1e10, desc: '観測するまで茹で上がらない。' },
    { id: 'blackhole', name: 'ブラックホール石臼', icon: '🕳️', baseCost: 800000000000000000, baseCps: 6.3e10, desc: '事象の地平線で粉を挽く。' },
    { id: 'universe', name: '宇宙創成そば', icon: '💥', baseCost: 10000000000000000000, baseCps: 3e11, desc: 'ビッグバンはそばから始まった。' },
    { id: 'simulation', name: 'シミュレーション越前', icon: '💻', baseCost: 150000000000000000000, baseCps: 1.7e12, desc: '世界そのものがそばである。' },
    { id: 'concept', name: '概念的そば打ち', icon: '💭', baseCost: 2000000000000000000000, baseCps: 9e12, desc: '「そば」という概念そのものを打つ。' },
    { id: 'infinity', name: '無限の越前', icon: '♾️', baseCost: 30000000000000000000000, baseCps: 5.2e13, desc: '終わりなきそばの輪廻。' },
    { id: 'origin', name: '起源のそば', icon: '🌱', baseCost: 500000000000000000000000, baseCps: 3.3e14, desc: '全てのそばの始まりに触れる。' },
    { id: 'eternity', name: '永劫の一杯', icon: '🕰️', baseCost: 8e25, baseCps: 2e16, desc: '茹で上がることも冷めることもない、永遠の一杯。' },
    { id: 'omniscience', name: '全知のそば', icon: '🧠', baseCost: 1e28, baseCps: 1e18, desc: 'そばを打つという行為そのものを理解し尽くした境地。' },
    { id: 'you', name: 'あなた', icon: '🧑‍🍳', baseCost: 1.5e30, baseCps: 5.8e19, desc: 'もはや誰が誰にそばを打たせているのかは分からない。生産の最後のピースは、あなた自身だった。' }
];

const UPGRADES = [
    { id: 'upg_click_1', name: '強化割り箸', icon: '🥢', cost: 100, type: 'click', power: 2, desc: 'クリックパワー2倍。', req: { totalSoba: 10 } },
    { id: 'upg_click_2', name: '大根おろし器', icon: '🥕', cost: 1000, type: 'click', power: 2, desc: 'さらにクリック強化。', req: { totalSoba: 500 } },
    { id: 'upg_click_3', name: 'チタン製麺棒', icon: '🥖', cost: 50000, type: 'click', power: 3, desc: 'クリックが驚異的な力を持つ。', req: { clicks: 500 } },
    { id: 'upg_click_4', name: '光速の麺棒', icon: '💫', cost: 10000000, type: 'click', power: 5, desc: 'クリックが光を追い越す。', req: { clicks: 5000 } },
    { id: 'upg_stud_1', name: 'やる気スイッチ', icon: '💡', cost: 500, type: 'building', target: 'student', mult: 3, desc: '見習いの効率3倍。', req: { buildings: { student: 10 } } },
    { id: 'upg_stud_2', name: '修行の成果', icon: '📜', cost: 5000, type: 'building', target: 'student', mult: 5, desc: '見習いの効率5倍。', req: { buildings: { student: 25 } } },
    { id: 'upg_global_1', name: '越前の名水', icon: '💧', cost: 1000000, type: 'global', mult: 1.2, desc: '全生産20%アップ。', req: { totalSoba: 100000 } },
    { id: 'upg_global_2', name: 'そば粉の革命', icon: '🌾', cost: 100000000, type: 'global', mult: 1.5, desc: '全生産50%アップ。', req: { totalSoba: 10000000 } },
    { id: 'upg_global_3', name: '究極の出汁', icon: '🐟', cost: 10000000000, type: 'global', mult: 2, desc: '全生産2倍。', req: { totalSoba: 1000000000 } },
    { id: 'upg_prestige_1', name: '魂の記憶', icon: '🌀', cost: 1e15, type: 'global', mult: 1.5, desc: '転生への渇望が生産を高める。', req: { totalSoba: 1e14 } },
    { id: 'upg_kitchen_1', name: '換気扇の改良', icon: '🍳', cost: 3000, type: 'building', target: 'kitchen', mult: 4, desc: '家庭用厨房の効率4倍。', req: { buildings: { kitchen: 10 } } },
    { id: 'upg_mill_1', name: '二枚刃の石臼', icon: '🪨', cost: 30000, type: 'building', target: 'mill', mult: 4, desc: '石臼製粉機の効率4倍。', req: { buildings: { mill: 10 } } },
    { id: 'upg_shop_1', name: '行列必至の看板', icon: '🎏', cost: 300000, type: 'building', target: 'shop', mult: 4, desc: 'そば処の効率4倍。', req: { buildings: { shop: 10 } } },
    { id: 'upg_factory_1', name: '全自動麺帯機', icon: '🔧', cost: 3000000, type: 'building', target: 'factory', mult: 4, desc: '製麺工場の効率4倍。', req: { buildings: { factory: 10 } } },
    { id: 'upg_festival_1', name: '全国区の宣伝', icon: '📢', cost: 30000000, type: 'building', target: 'festival', mult: 4, desc: '越前そば祭りの効率4倍。', req: { buildings: { festival: 10 } } },
    { id: 'upg_robot_1', name: '深層学習アルゴリズム', icon: '🧬', cost: 500000000, type: 'building', target: 'robot', mult: 4, desc: 'AI製麺ロボの効率4倍。', req: { buildings: { robot: 10 } } },
    { id: 'upg_satellite_1', name: '軌道上プラント拡張', icon: '🛰️', cost: 8000000000, type: 'building', target: 'satellite', mult: 4, desc: '宇宙そば農場の効率4倍。', req: { buildings: { satellite: 10 } } },
    { id: 'upg_shrine_1', name: '総本山の建立', icon: '🎴', cost: 1.5e11, type: 'building', target: 'shrine', mult: 4, desc: 'そばの聖地の効率4倍。', req: { buildings: { shrine: 10 } } },
    { id: 'upg_click_5', name: '次元断裂の一撃', icon: '💥', cost: 1000000000, type: 'click', power: 8, desc: 'クリックが次元を切り裂く。', req: { clicks: 20000 } },
    { id: 'upg_global_4', name: '大宇宙の摂理', icon: '🪐', cost: 1e18, type: 'global', mult: 1.6, desc: '全生産60%アップ。', req: { totalSoba: 1e17 } },
    { id: 'upg_global_5', name: '無限ループの真実', icon: '🔁', cost: 1e22, type: 'global', mult: 1.8, desc: '全生産80%アップ。', req: { totalSoba: 1e21 } },
    { id: 'upg_global_6', name: '起源への回帰', icon: '🌌', cost: 1e26, type: 'global', mult: 2, desc: '全生産2倍。', req: { totalSoba: 1e25 } },
    { id: 'upg_kitten_1', name: '段ボール猫', icon: '📦', cost: 9000, type: 'kitten', kittenPercent: 0.02, desc: 'だしLv.1につき全生産+2%。', req: { totalSoba: 5000 } },
    { id: 'upg_kitten_2', name: 'だし猫', icon: '🍲', cost: 90000, type: 'kitten', kittenPercent: 0.04, desc: 'だしLv.1につき全生産+4%。', req: { totalSoba: 50000 } },
    { id: 'upg_kitten_3', name: 'そば猫', icon: '🐈', cost: 900000, type: 'kitten', kittenPercent: 0.06, desc: 'だしLv.1につき全生産+6%。', req: { totalSoba: 500000 } },
    { id: 'upg_kitten_4', name: '越前招き猫', icon: '🐾', cost: 90000000, type: 'kitten', kittenPercent: 0.05, desc: 'だしLv.1につき全生産+5%。', req: { totalSoba: 50000000 } },
    { id: 'upg_kitten_5', name: '猫又そば師匠', icon: '😼', cost: 9000000000, type: 'kitten', kittenPercent: 0.06, desc: 'だしLv.1につき全生産+6%。', req: { totalSoba: 5000000000 } },
    { id: 'upg_kitchen_2', name: '薪窯の導入', icon: '🔥', cost: 40000, type: 'building', target: 'kitchen', mult: 3, desc: '家庭用厨房の効率さらに3倍。', req: { buildings: { kitchen: 25 } } },
    { id: 'upg_mill_2', name: '水車式石臼', icon: '🌊', cost: 400000, type: 'building', target: 'mill', mult: 3, desc: '石臼製粉機の効率さらに3倍。', req: { buildings: { mill: 25 } } },
    { id: 'upg_shop_2', name: '暖簾分けの拡大', icon: '🏯', cost: 4000000, type: 'building', target: 'shop', mult: 3, desc: 'そば処の効率さらに3倍。', req: { buildings: { shop: 25 } } },
    { id: 'upg_factory_2', name: '無人化ライン', icon: '🦾', cost: 40000000, type: 'building', target: 'factory', mult: 3, desc: '製麺工場の効率さらに3倍。', req: { buildings: { factory: 25 } } },
    { id: 'upg_festival_2', name: '越前そば万博', icon: '🎪', cost: 4e8, type: 'building', target: 'festival', mult: 3, desc: '越前そば祭りの効率さらに3倍。', req: { buildings: { festival: 25 } } },
    { id: 'upg_time_1', name: '因果律の書き換え', icon: '📖', cost: 2e12, type: 'building', target: 'timemachine', mult: 4, desc: '時間跳躍製麺機の効率4倍。', req: { buildings: { timemachine: 10 } } },
    { id: 'upg_dim_1', name: '扉の増設', icon: '🚪', cost: 3e13, type: 'building', target: 'dimension', mult: 4, desc: '異次元そば門の効率4倍。', req: { buildings: { dimension: 10 } } },
    { id: 'upg_god_1', name: '悟りの境地', icon: '🕉️', cost: 4e14, type: 'building', target: 'god', mult: 4, desc: 'そばの神髄の効率4倍。', req: { buildings: { god: 10 } } },
    { id: 'upg_galaxy_1', name: '路線の全拡張', icon: '🌠', cost: 6e15, type: 'building', target: 'galaxy', mult: 4, desc: '越前そば銀河鉄道の効率4倍。', req: { buildings: { galaxy: 10 } } },
    { id: 'upg_parallel_1', name: '並行意識の統合', icon: '🪞', cost: 9e16, type: 'building', target: 'parallel', mult: 4, desc: '多次元そば並行世界の効率4倍。', req: { buildings: { parallel: 10 } } },
    { id: 'upg_quantum_1', name: '波動関数の収束', icon: '🔬', cost: 1.5e18, type: 'building', target: 'quantum', mult: 4, desc: '量子もつれ製麺の効率4倍。', req: { buildings: { quantum: 10 } } },
    { id: 'upg_blackhole_1', name: '特異点の圧縮', icon: '🌑', cost: 2.5e19, type: 'building', target: 'blackhole', mult: 4, desc: 'ブラックホール石臼の効率4倍。', req: { buildings: { blackhole: 10 } } },
    { id: 'upg_universe_1', name: '第二のビッグバン', icon: '💫', cost: 3e20, type: 'building', target: 'universe', mult: 4, desc: '宇宙創成そばの効率4倍。', req: { buildings: { universe: 10 } } },
    { id: 'upg_simulation_1', name: '演算資源の増強', icon: '🖥️', cost: 4.5e21, type: 'building', target: 'simulation', mult: 4, desc: 'シミュレーション越前の効率4倍。', req: { buildings: { simulation: 10 } } },
    { id: 'upg_concept_1', name: '観念の純化', icon: '🌀', cost: 6e22, type: 'building', target: 'concept', mult: 4, desc: '概念的そば打ちの効率4倍。', req: { buildings: { concept: 10 } } },
    { id: 'upg_infinity_1', name: '無限階梯の突破', icon: '♾️', cost: 9e23, type: 'building', target: 'infinity', mult: 4, desc: '無限の越前の効率4倍。', req: { buildings: { infinity: 10 } } },
    { id: 'upg_origin_1', name: '始原への回帰', icon: '🌱', cost: 1.5e25, type: 'building', target: 'origin', mult: 4, desc: '起源のそばの効率4倍。', req: { buildings: { origin: 10 } } },
    { id: 'upg_eternity_1', name: '不変の一瞬', icon: '🕰️', cost: 2.5e27, type: 'building', target: 'eternity', mult: 4, desc: '永劫の一杯の効率4倍。', req: { buildings: { eternity: 10 } } },
    { id: 'upg_omniscience_1', name: '全知の到達点', icon: '🧠', cost: 3e29, type: 'building', target: 'omniscience', mult: 4, desc: '全知のそばの効率4倍。', req: { buildings: { omniscience: 10 } } },
    { id: 'upg_you_1', name: '自己複製のパラドックス', icon: '🪞', cost: 4.5e31, type: 'building', target: 'you', mult: 4, desc: 'あなたの効率4倍。', req: { buildings: { you: 10 } } },
    { id: 'upg_click_6', name: '悟りの一撃', icon: '🕊️', cost: 1e21, type: 'click', power: 10, desc: 'クリックが悟りの境地に達する。', req: { clicks: 50000 } },
    { id: 'upg_global_7', name: '概念そのものの生産', icon: '💭', cost: 1e30, type: 'global', mult: 2, desc: '全生産2倍。', req: { totalSoba: 1e29 } },
    { id: 'upg_global_b1', name: '越前の地酒', icon: '🍶', cost: 1e11, type: 'global', mult: 1.3, desc: '全生産30%アップ。', req: { totalSoba: 1e10 } },
    { id: 'upg_global_b2', name: 'そば湯の極意', icon: '♨️', cost: 1e12, type: 'global', mult: 1.3, desc: '全生産30%アップ。', req: { totalSoba: 1e11 } },
    { id: 'upg_global_b3', name: '北陸新幹線の開業', icon: '🚄', cost: 1e14, type: 'global', mult: 1.5, desc: '全生産50%アップ。', req: { totalSoba: 1e13 } },
    { id: 'upg_global_b4', name: '世界そば博覧会', icon: '🎌', cost: 1e17, type: 'global', mult: 1.5, desc: '全生産50%アップ。', req: { totalSoba: 1e16 } },
    { id: 'upg_global_mid', name: '越前ブランドの確立', icon: '🏷️', cost: 1e13, type: 'global', mult: 1.5, desc: '全生産50%アップ。', req: { totalSoba: 1e12 } },
    { id: 'upg_global_8', name: '全宇宙そば協定', icon: '📜', cost: 1e34, type: 'global', mult: 2, desc: '全生産2倍。', req: { totalSoba: 1e33 } },
    { id: 'upg_click_7', name: '無限の麺棒', icon: '🪄', cost: 1e27, type: 'click', power: 10, desc: 'クリックパワー10倍。', req: { clicks: 100000 } },
    { id: 'upg_clickcps_1', name: 'そば切り包丁の研ぎ直し', icon: '🔪', cost: 50000, type: 'clickCps', cpsPercent: 0.01, desc: 'クリックごとに、毎秒生産の1%分のそばを追加で獲得。', req: { clicks: 1000 } },
    { id: 'upg_clickcps_2', name: '職人の手首', icon: '🤲', cost: 5e7, type: 'clickCps', cpsPercent: 0.01, desc: 'クリックごとに、毎秒生産の1%分のそばをさらに追加で獲得。', req: { clicks: 5000 } },
    { id: 'upg_clickcps_3', name: '千本打ちの修行', icon: '🏋️', cost: 5e10, type: 'clickCps', cpsPercent: 0.01, desc: 'クリックごとに、毎秒生産の1%分のそばをさらに追加で獲得。', req: { clicks: 15000 } },
    { id: 'upg_clickcps_4', name: '無心の連打', icon: '🧘', cost: 5e14, type: 'clickCps', cpsPercent: 0.01, desc: 'クリックごとに、毎秒生産の1%分のそばをさらに追加で獲得。', req: { clicks: 30000 } },
    { id: 'upg_clickcps_5', name: '越前流・神速打ち', icon: '⚡', cost: 5e19, type: 'clickCps', cpsPercent: 0.01, desc: 'クリックごとに、毎秒生産の1%分のそばをさらに追加で獲得。', req: { clicks: 75000 } }
];

// Tiered per-building upgrades, generated for every building so each one keeps scaling:
// 25 owned → x3 (only where no hand-made 25-tier exists), 50 owned → x2, 100 owned → x2.
// Cost is a multiple of the building's base cost, roughly the price of a unit well past the requirement.
const BUILDING_UPGRADE_TIERS = [
    { req: 25, mult: 3, costMult: 400, suffix: '熟練の技', desc: 'さらに3倍' },
    { req: 50, mult: 2, costMult: 20000, suffix: '極意', desc: 'さらに2倍' },
    { req: 100, mult: 2, costMult: 1e8, suffix: '奥義', desc: 'さらに2倍' }
];
BUILDINGS.forEach(b => {
    BUILDING_UPGRADE_TIERS.forEach(tier => {
        const exists = UPGRADES.some(u => u.type === 'building' && u.target === b.id && u.req.buildings && u.req.buildings[b.id] === tier.req);
        if (exists) return;
        UPGRADES.push({
            id: `upg_${b.id}_t${tier.req}`,
            name: `${b.name}・${tier.suffix}`,
            icon: b.icon,
            cost: b.baseCost * tier.costMult,
            type: 'building',
            target: b.id,
            mult: tier.mult,
            desc: `${b.name}の効率${tier.desc}。(${tier.req}個所有で出現)`,
            req: { buildings: { [b.id]: tier.req } }
        });
    });
});

const HEAVENLY_UPGRADES = [
    { id: 'heav_1', name: '越前の加護', icon: '🙏', cost: 5, desc: '施設のコスト上昇率が緩やかになる(1.15→1.13)。', effect: 'cheapBuild', requires: null },
    { id: 'heav_3', name: '魂の共鳴', icon: '💠', cost: 15, desc: '全生産が永続的に+10%される。', effect: 'globalMult', mult: 1.1, requires: null },
    { id: 'heav_2', name: '黄金の巡り', icon: '🌟', cost: 10, desc: 'ゴールデンそば・呪われしそばの出現率が上昇する。', effect: 'goldenFreq', requires: 'heav_1' },
    { id: 'heav_4', name: '開祖の記憶', icon: '🧓', cost: 25, desc: 'クリックパワーの基礎値が永続的に+50される。', effect: 'clickBase', amount: 50, requires: 'heav_1' },
    { id: 'heav_6', name: '熟成の秘技', icon: '🍡', cost: 30, desc: 'そば粉の塊がたまる速度が2倍になる。', effect: 'lumpSpeed', requires: 'heav_3' },
    { id: 'heav_5', name: '天界の加速', icon: '🚀', cost: 40, desc: '全生産が永続的に+25%される。', effect: 'globalMult', mult: 1.25, requires: 'heav_3' },
    { id: 'heav_8', name: '双子の精霊', icon: '👯', cost: 60, desc: '祭壇に祀れる精霊が1柱増える(2→3柱)。', effect: 'extraSpiritSlot', requires: 'heav_4' },
    { id: 'heav_9', name: '刻の加速', icon: '⏳', cost: 50, desc: '手打ちそば道場の休憩時間が半分になる。', effect: 'artisanCooldown', requires: 'heav_6' },
    { id: 'heav_7', name: '究極の悟り', icon: '☯️', cost: 100, desc: '全生産が永続的に1.5倍になる。', effect: 'globalMult', mult: 1.5, requires: 'heav_5' },
    { id: 'heav_10', name: '慈悲の解脱', icon: '🕊️', cost: 150, desc: '転生に必要な累計そば量が緩和され、越前魂が少し得やすくなる。', effect: 'prestigeBoost', requires: 'heav_7' },
    { id: 'heav_11', name: 'まどろみの生産', icon: '😴', cost: 10, desc: 'タブを閉じている間・離れている間もそばが生産されるようになる(オフライン生産解放)。', effect: 'offlineUnlock', requires: null },
    { id: 'heav_12', name: '厄除けの護符', icon: '🧿', cost: 35, desc: '呪われしそばで失うそばの量がさらに半分になる(精霊の効果と重複可)。', effect: 'wrathSafety', value: 0.5, requires: 'heav_2' },
    { id: 'heav_13', name: '越前の記憶', icon: '📿', cost: 45, desc: '隠された熟練の力の効果が実績10個ごとに+3%になる(通常は+2%)。', effect: 'masteryBoost', requires: 'heav_3' },
    { id: 'heav_14', name: '天界の慈雨', icon: '🌧️', cost: 70, desc: 'そば粉の塊がたまる速度がさらに1.5倍になる(熟成の秘技と重複)。', effect: 'lumpSpeed2', requires: 'heav_9' },
    { id: 'heav_15', name: '悟りの果て', icon: '🌌', cost: 300, desc: '全生産が永続的にさらに2倍になる。天界の頂点。', effect: 'globalMult', mult: 2, requires: 'heav_10' },
    { id: 'heav_16', name: '開店祝い', icon: '🎁', cost: 5, desc: '転生後、そば打ち見習い10人・家庭用厨房5つを持った状態で始まる。', effect: 'starterKit', requires: null },
    { id: 'heav_17', name: '二号店の暖簾', icon: '🏮', cost: 40, desc: '転生後、さらに石臼製粉機10台・そば処5軒を持った状態で始まる。', effect: 'starterKit', requires: 'heav_16' },
    { id: 'heav_18', name: '越前魂の覚醒', icon: '🔥', cost: 25, desc: '越前魂1個あたりの生産ボーナスが+1%から+1.5%になる。', effect: 'soulPower', requires: 'heav_3' },
    // --- Starting over faster ---
    { id: 'heav_19', name: '三号店の大繁盛', icon: '🏬', cost: 150, desc: '転生後、さらに製麺工場10棟・越前そば祭り5つを持った状態で始まる。', effect: 'starterKit', requires: 'heav_17' },
    { id: 'heav_20', name: '記憶のレシピ', icon: '📜', cost: 400, desc: '転生後も、クリック系のアップグレードを全て最初から持っている。', effect: 'keepClickUpgrades', requires: 'heav_19' },
    // --- Away from the game ---
    { id: 'heav_21', name: '夢見の職人', icon: '💤', cost: 60, desc: '留守中の生産がたまる上限が24時間から72時間になる。', effect: 'offlineCap', requires: 'heav_11' },
    { id: 'heav_22', name: '留守番の招き猫', icon: '🐈', cost: 250, desc: '留守中の生産が1.5倍になる。', effect: 'offlineMult', requires: 'heav_21' },
    // --- Customer orders ---
    { id: 'heav_23', name: '老舗の信用', icon: '🤝', cost: 30, desc: 'お客さんの注文の報酬が2倍になり、評判の上限が100から150になる。', effect: 'orderReward', requires: 'heav_16' },
    { id: 'heav_24', name: '行列の予感', icon: '🚶', cost: 120, desc: 'お客さんの注文が届く間隔が半分になる。', effect: 'orderFreq', requires: 'heav_23' },
    // --- Soba farm ---
    { id: 'heav_25', name: '土づくりの極意', icon: '🪱', cost: 45, desc: 'そば畑の作物が1.5倍の速さで育つ。', effect: 'farmSpeed', requires: 'heav_6' },
    { id: 'heav_26', name: '在来種の守り人', icon: '🧬', cost: 150, desc: 'そば畑で新しい在来種が芽吹く確率が2倍、収穫で得られるそばも2倍になる。', effect: 'farmMutation', requires: 'heav_25' },
    // --- Golden soba ---
    { id: 'heav_27', name: '黄金の余韻', icon: '🎐', cost: 50, desc: 'フィーバータイムとクリックフィーバーが1.5倍長く続く。', effect: 'feverTime', requires: 'heav_2' },
    { id: 'heav_28', name: '招福の鈴', icon: '🔔', cost: 180, desc: 'ゴールデンそば・季節限定そばの報酬が1.5倍になる。', effect: 'goldenReward', requires: 'heav_27' },
    // --- Workshop / shrine ---
    { id: 'heav_29', name: '名人の手', icon: '🙌', cost: 100, desc: '手打ちそば道場の職人ポイントの上限が50%から100%になり、獲得量も1.5倍になる。', effect: 'artisanMaster', requires: 'heav_9' },
    { id: 'heav_30', name: '四柱の神楽', icon: '🪭', cost: 400, desc: '祭壇に祀れる精霊がさらに1柱増える(最大4柱)。', effect: 'extraSpiritSlot2', requires: 'heav_8' },
    { id: 'heav_35', name: '挑戦者の誇り', icon: '⚔️', cost: 250, desc: '挑戦モードのクリア報酬が1つにつき+3%から+6%になる。', effect: 'challengeBonus', requires: 'heav_10' },
    // --- Late game ---
    { id: 'heav_31', name: '輪廻の果ての一杯', icon: '🍵', cost: 1000, desc: '全生産が永続的にさらに1.5倍になる。', effect: 'globalMult', mult: 1.5, requires: 'heav_15' },
    { id: 'heav_34', name: '天地開闢', icon: '🌅', cost: 20000, desc: '全生産が永続的にさらに2倍になる。天界の真の頂点。', effect: 'globalMult', mult: 2, requires: 'heav_31' },
    { id: 'heav_32', name: '越前魂の極致', icon: '💎', cost: 500, desc: '越前魂1個あたりの生産ボーナスが+2%になる。', effect: 'soulPower2', requires: 'heav_18' },
    { id: 'heav_33', name: '魂の器', icon: '🏺', cost: 3000, desc: '越前魂の効果がゆるやかになり始める個数が1000個から5000個になる。', effect: 'soulCap', requires: 'heav_32' }
];

const SPIRITS = [
    { id: 'spirit_speed', name: '疾風の精霊', icon: '💨', desc: '全生産+15%。ただし気が急いて、ゴールデン/呪われしそばの出現率が-15%される。', effects: [{ type: 'globalMult', value: 1.15 }, { type: 'goldenFreqMult', value: 0.85 }] },
    { id: 'spirit_harvest', name: '豊穣の精霊', icon: '🌾', desc: 'ゴールデン/呪われしそばの報酬+30%。ただし収穫に気を取られ、クリックパワーが-8%される。', effects: [{ type: 'goldenBonus', value: 1.3 }, { type: 'clickMult', value: 0.92 }] },
    { id: 'spirit_guardian', name: '守護の精霊', icon: '🛡️', desc: '呪われしそばの被害半減。ただし守りに徹するあまり、全生産が-10%される。', effects: [{ type: 'wrathShield', value: 0.5 }, { type: 'globalMult', value: 0.9 }] },
    { id: 'spirit_wisdom', name: '知恵の精霊', icon: '📖', desc: 'クリックパワー+20%。ただし考え込みすぎて、全生産が-8%される。', effects: [{ type: 'clickMult', value: 1.2 }, { type: 'globalMult', value: 0.92 }] },
    { id: 'spirit_commerce', name: '商いの精霊', icon: '💴', desc: '施設のコストが少し安くなる。ただし値切り交渉に気を取られ、クリックパワーが-8%される。', effects: [{ type: 'cheaperBuild', value: 0.97 }, { type: 'clickMult', value: 0.92 }] },
    { id: 'spirit_chaos', name: '混沌の精霊', icon: '🌀', desc: '全生産+50%という破格の力を持つが、その代償として呪われしそばの出現率が2倍になる。上級者向け。', effects: [{ type: 'globalMult', value: 1.5 }, { type: 'wrathChanceMult', value: 2.0 }] }
];

function getSpiritEffectMult(type) {
    let mult = 1;
    SPIRITS.filter(s => state.spirits.includes(s.id)).forEach(s => {
        s.effects.forEach(e => { if (e.type === type) mult *= e.value; });
    });
    return mult;
}

function getRegionEffectMult(type) {
    let mult = 1;
    REGIONS.filter(r => state.regions.includes(r.id) && r.effect === type)
           .forEach(r => mult *= r.value);
    return mult;
}

function getRegionFlatBonus(type) {
    let bonus = 0;
    REGIONS.filter(r => state.regions.includes(r.id) && r.effect === type)
           .forEach(r => bonus += r.value);
    return bonus;
}

const SEASONS = [
    { id: 'spring', name: '桜そばの陣', icon: '🌸', months: [3, 4, 5], effect: 'globalMult', value: 1.05, effectDesc: '全生産+5%', specialName: '花見そば', specialIcon: '🌸🍜' },
    { id: 'summer', name: '冷やしそばの陣', icon: '🍧', months: [6, 7, 8], effect: 'goldenFreq', value: 1.25, effectDesc: 'ゴールデン/呪われしそばの出現率+25%', specialName: '冷やしそば', specialIcon: '🍧🍜' },
    { id: 'autumn', name: '新そば収穫の陣', icon: '🍁', months: [9, 10, 11], effect: 'clickMult', value: 1.1, effectDesc: 'クリックパワー+10%', specialName: '新そば', specialIcon: '🍁🍜' },
    { id: 'winter', name: '年越しそばの陣', icon: '❄️', months: [12, 1, 2], effect: 'goldenBonus', value: 1.2, effectDesc: 'ゴールデンそばの報酬+20%', specialName: '年越しそば', specialIcon: '❄️🍜' }
];

function getSeasonByMonth() {
    const m = new Date().getMonth() + 1;
    return SEASONS.find(s => s.months.includes(m)) || SEASONS[0];
}

function getCurrentSeason() {
    return getSeasonByMonth();
}

const ACHIEVEMENTS = [
    { id: 'ach_1', name: '最初の一歩', icon: '👣', desc: 'そばを1杯打つ。', req: { totalSoba: 1 } },
    { id: 'ach_2', name: 'そば職人の卵', icon: '🥚', desc: 'そばを100杯打つ。', req: { totalSoba: 100 } },
    { id: 'ach_3', name: '越前の新星', icon: '🌟', desc: 'そばを1万杯打つ。', req: { totalSoba: 10000 } },
    { id: 'ach_4', name: 'そばマスター', icon: '👑', desc: 'そばを100万杯打つ。', req: { totalSoba: 1000000 } },
    { id: 'ach_5', name: 'そば神', icon: '😇', desc: 'そばを1億杯打つ。', req: { totalSoba: 100000000 } },
    { id: 'ach_6', name: '銀河の麺打ち', icon: '🌌', desc: 'そばを100億杯打つ。', req: { totalSoba: 10000000000 } },
    { id: 'ach_7', name: '次元の超越者', icon: '🌀', desc: 'そばを1兆杯打つ。', req: { totalSoba: 1000000000000 } },
    { id: 'ach_8', name: '越前の伝説', icon: '📜', desc: 'そばを100兆杯打つ。', req: { totalSoba: 100000000000000 } },
    { id: 'ach_9', name: '終焉の麺師', icon: '💀', desc: 'そばを1京杯打つ。', req: { totalSoba: 1e16 } },
    { id: 'ach_10', name: '無限のそば', icon: '♾️', desc: 'そばを1垓杯打つ。', req: { totalSoba: 1e20 } },
    { id: 'ach_click_1', name: 'クリックの始まり', icon: '🖱️', desc: '100回クリック。', req: { clicks: 100 } },
    { id: 'ach_click_2', name: 'クリックの達人', icon: '⚡', desc: '1000回クリック。', req: { clicks: 1000 } },
    { id: 'ach_click_3', name: '連打の鬼', icon: '👹', desc: '5000回クリック。', req: { clicks: 5000 } },
    { id: 'ach_click_4', name: 'クリック中毒', icon: '💉', desc: '1万回クリック。', req: { clicks: 10000 } },
    { id: 'ach_click_fast', name: '超速の麺棒', icon: '🏎️', desc: '1秒間に10回クリック。', req: { clickSpeed: 10 } },
    { id: 'ach_build_1', name: '雇い主', icon: '👔', desc: '施設合計50個。', req: { totalBuildings: 50 } },
    { id: 'ach_build_2', name: '越前の富豪', icon: '💰', desc: '施設合計200個。', req: { totalBuildings: 200 } },
    { id: 'ach_build_3', name: '産業の支配者', icon: '🏢', desc: '施設合計500個。', req: { totalBuildings: 500 } },
    { id: 'ach_build_4', name: '世界の麺工場', icon: '🌍', desc: '施設合計1000個。', req: { totalBuildings: 1000 } },
    { id: 'ach_golden_1', name: '幸運の持ち主', icon: '🍀', desc: 'ゴールデンそば1回。', req: { goldenClicks: 1 } },
    { id: 'ach_golden_2', name: '黄金の愛好家', icon: '🏅', desc: 'ゴールデンそば10回。', req: { goldenClicks: 10 } },
    { id: 'ach_golden_3', name: '黄金の守護者', icon: '🛡️', desc: 'ゴールデンそば50回。', req: { goldenClicks: 50 } },
    { id: 'ach_fever_1', name: '熱狂の始まり', icon: '🔥', desc: 'フィーバータイム1回。', req: { feverCount: 1 } },
    { id: 'ach_fever_2', name: '熱狂の嵐', icon: '🌪️', desc: 'フィーバータイム10回。', req: { feverCount: 10 } },
    { id: 'ach_prestige_1', name: '輪廻転生', icon: '♻️', desc: '1回以上転生する。', req: { prestigeCount: 1 } },
    { id: 'ach_all_build_1', name: '全施設制覇', icon: '🏰', desc: '全ての施設を1つ以上所有。', req: { allBuildings: 1 } },
    { id: 'ach_rich_1', name: 'そば大尽', icon: '🤑', desc: '1秒間に100万杯生産。', req: { cps: 1000000 } },
    { id: 'ach_rich_2', name: '経済の特異点', icon: '🌌', desc: '1秒間に1兆杯生産。', req: { cps: 1000000000000 } },
    { id: 'ach_rich_3', name: '神の生産力', icon: '🔱', desc: '1秒間に1京杯生産。', req: { cps: 1e16 } },
    { id: 'ach_secret_1', name: '隠し味', icon: '🤐', desc: 'リセットボタンを5回見る。', req: { secret: 5 } },
    { id: 'ach_secret_2', name: 'かくれんぼ上手', icon: '🙈', desc: 'リセットボタンを20回見る。', req: { secret: 20 } },
    { id: 'ach_soul_1', name: '越前魂の目覚め', icon: '👻', desc: '越前魂を1個獲得する。', req: { souls: 1 } },
    { id: 'ach_soul_2', name: '越前魂の収集家', icon: '🎐', desc: '越前魂を50個獲得する。', req: { souls: 50 } },
    { id: 'ach_soul_3', name: '越前魂の化身', icon: '👺', desc: '越前魂を500個獲得する。', req: { souls: 500 } },
    { id: 'ach_time_1', name: '一時間の旅', icon: '⏱️', desc: 'プレイ時間が1時間に到達。', req: { playTime: 3600 } },
    { id: 'ach_time_2', name: '一日の旅人', icon: '🌅', desc: 'プレイ時間が24時間に到達。', req: { playTime: 86400 } },
    { id: 'ach_clickpower_1', name: '一撃の重み', icon: '✊', desc: 'クリックパワーが1000に到達。', req: { clickPower: 1000 } },
    { id: 'ach_clickpower_2', name: '一撃必殺', icon: '💢', desc: 'クリックパワーが100万に到達。', req: { clickPower: 1000000 } },
    { id: 'ach_building_origin', name: '新境地の開拓者', icon: '🌱', desc: '起源のそばを1つ以上所有。', req: { buildings: { origin: 1 } } },
    { id: 'ach_building_omni', name: '全知への到達', icon: '🧠', desc: '全知のそばを1つ以上所有。', req: { buildings: { omniscience: 1 } } },
    { id: 'ach_building_you_1', name: '自分自身を見出す', icon: '🪞', desc: '「あなた」を1人以上雇う。', req: { buildings: { you: 1 } } },
    { id: 'ach_building_you_50', name: '無数のあなた', icon: '👥', desc: '「あなた」を50人雇う。', req: { buildings: { you: 50 } } },
    { id: 'ach_upgrade_all', name: '改良の極み', icon: '🏆', desc: '全てのアップグレードを購入する。', req: { allUpgrades: 1 } },
    { id: 'ach_rich_4', name: '想像を絶する生産', icon: '💫', desc: '1秒間に1穣杯生産。', req: { cps: 1e28 } },
    { id: 'ach_dashi_1', name: '初めてのだし', icon: '🍲', desc: 'だしレベル1に到達。', req: { dashiLevel: 1 } },
    { id: 'ach_dashi_2', name: '猫まみれ', icon: '🐱', desc: 'だしレベル5に到達。', req: { dashiLevel: 5 } },
    { id: 'ach_dashi_3', name: 'だしの海', icon: '🌊', desc: 'だしレベル10に到達。', req: { dashiLevel: 10 } },
    { id: 'ach_wrath_1', name: '凶兆との遭遇', icon: '😈', desc: '呪われしそばを1回クリック。', req: { wrathClicks: 1 } },
    { id: 'ach_wrath_2', name: '厄払いの達人', icon: '🧿', desc: '呪われしそばを20回クリック。', req: { wrathClicks: 20 } },
    { id: 'ach_lump_1', name: '塊の発見', icon: '🍡', desc: 'そば粉の塊を1個獲得。', req: { totalLumps: 1 } },
    { id: 'ach_lump_2', name: '塊職人', icon: '🧺', desc: 'そば粉の塊を10個獲得。', req: { totalLumps: 10 } },
    { id: 'ach_lump_3', name: '熟成の探求者', icon: '🏺', desc: 'そば粉の塊を50個獲得。', req: { totalLumps: 50 } },
    { id: 'ach_heavenly_1', name: '天界への一歩', icon: '☁️', desc: '天界の力を1つ購入。', req: { heavenlyCount: 1 } },
    { id: 'ach_heavenly_2', name: '天界の支配者', icon: '👼', desc: '天界の力を全て購入。', req: { heavenlyCount: HEAVENLY_UPGRADES.length } },
    { id: 'ach_heavenly_mid', name: '天界の住人', icon: '🕊️', desc: '天界の力を15個購入。', req: { heavenlyCount: 15 } },
    { id: 'ach_shrine_1', name: '祭壇の目覚め', icon: '⛩️', desc: '初めて精霊を祀る。', req: { spiritsCount: 1 } },
    { id: 'ach_shrine_2', name: '二柱の加護', icon: '🙏', desc: '2柱の精霊を同時に祀る。', req: { spiritsCount: 2 } },
    { id: 'ach_season_1', name: '特別な一杯', icon: '🎐', desc: '季節限定のそばを1回発見する。', req: { seasonSobaClicks: 1 } },
    { id: 'ach_season_2', name: '季節の探求者', icon: '🗓️', desc: '季節限定のそばを10回発見する。', req: { seasonSobaClicks: 10 } },
    { id: 'ach_season_all', name: '四季を制覇', icon: '🌗', desc: '春夏秋冬すべての季節を体験する。', req: { seasonsAll: 1 } },
    { id: 'ach_artisan_1', name: '初めての手打ち', icon: '🥢', desc: '手打ちそば道場に1回挑戦する。', req: { artisanAttempts: 1 } },
    { id: 'ach_artisan_crit', name: '会心の一撃', icon: '✨', desc: '手打ちそば道場で会心の一撃を出す。', req: { artisanCrits: 1 } },
    { id: 'ach_artisan_master', name: '職人の頂', icon: '🏔️', desc: '職人ポイントを上限(50%)まで極める。', req: { artisanPoints: 50 } },
    { id: 'ach_11', name: '数字を超えた者', icon: '🌠', desc: 'そばを1𥝱杯打つ。', req: { totalSoba: 1e24 } },
    { id: 'ach_12', name: '想像を絶する蓄積', icon: '🔆', desc: 'そばを1穣杯打つ。', req: { totalSoba: 1e28 } },
    { id: 'ach_13', name: '数の彼方', icon: '🕳️', desc: 'そばを1溝杯打つ。', req: { totalSoba: 1e32 } },
    { id: 'ach_click_5', name: '指の限界突破', icon: '🖐️', desc: '5万回クリック。', req: { clicks: 50000 } },
    { id: 'ach_click_6', name: '無限連打', icon: '♾️', desc: '10万回クリック。', req: { clicks: 100000 } },
    { id: 'ach_build_5', name: '越前コンツェルン', icon: '🏙️', desc: '施設合計2000個。', req: { totalBuildings: 2000 } },
    { id: 'ach_build_6', name: '宇宙規模の生産網', icon: '🛰️', desc: '施設合計5000個。', req: { totalBuildings: 5000 } },
    { id: 'ach_prestige_2', name: '五度目の輪廻', icon: '🔄', desc: '5回転生する。', req: { prestigeCount: 5 } },
    { id: 'ach_prestige_3', name: '転生の求道者', icon: '🕉️', desc: '25回転生する。', req: { prestigeCount: 25 } },
    { id: 'ach_soul_4', name: '越前魂の王', icon: '👑', desc: '越前魂を1000個獲得する。', req: { souls: 1000 } },
    { id: 'ach_dashi_4', name: 'だしの探究者', icon: '🍵', desc: 'だしレベル15に到達。', req: { dashiLevel: 15 } },
    { id: 'ach_dashi_5', name: 'だしの極み', icon: '🏆', desc: 'だしレベル20に到達。', req: { dashiLevel: 20 } },
    { id: 'ach_time_3', name: '一週間の求道', icon: '📅', desc: 'プレイ時間が1週間に到達。', req: { playTime: 604800 } },
    { id: 'ach_artisan_10', name: '通いの職人', icon: '🚶', desc: '手打ちそば道場に10回挑戦する。', req: { artisanAttempts: 10 } },
    { id: 'ach_artisan_50', name: '道場の主', icon: '🏯', desc: '手打ちそば道場に50回挑戦する。', req: { artisanAttempts: 50 } },
    { id: 'ach_artisan_crit10', name: '会心の連続', icon: '💥', desc: '会心の一撃を10回出す。', req: { artisanCrits: 10 } },
    { id: 'ach_golden_4', name: '幸運の化身', icon: '🎰', desc: 'ゴールデンそば100回。', req: { goldenClicks: 100 } },
    { id: 'ach_spirit_chaos', name: '混沌を愛する者', icon: '🌀', desc: '混沌の精霊を祀る。', req: { spiritEquipped: 'spirit_chaos' } },
    { id: 'ach_upgrade_click_all', name: 'クリック道の極意', icon: '🥢', desc: '全てのクリック系アップグレードを購入する。', req: { upgradeTypeAll: 'click' } },
    { id: 'ach_upgrade_kitten_all', name: '猫又の頂点', icon: '🐈‍⬛', desc: '全てのだし猫系アップグレードを購入する。', req: { upgradeTypeAll: 'kitten' } },
    { id: 'ach_upgrade_global_all', name: '全域生産の覇者', icon: '🌐', desc: '全てのグローバル系アップグレードを購入する。', req: { upgradeTypeAll: 'global' } },
    { id: 'ach_upgrade_building_all', name: '施設改良の達人', icon: '🔩', desc: '全ての施設専用アップグレードを購入する。', req: { upgradeTypeAll: 'building' } },
    { id: 'ach_challenge_1', name: '挑戦者', icon: '⚔️', desc: '挑戦モードを1つクリアする。', req: { challengesCompletedCount: 1 } },
    { id: 'ach_challenge_all', name: '挑戦の覇者', icon: '🏅', desc: '全ての挑戦モードをクリアする。', req: { challengesAll: 1 } },
    { id: 'ach_region_1', name: '地域開拓者', icon: '🗾', desc: '福井県内に支店を1つ設立する。', req: { regionsCount: 1 } },
    { id: 'ach_region_all', name: '越前制覇', icon: '🏯', desc: '福井県内の全ての支店を設立する。', req: { regionsAll: 1 } },
    { id: 'ach_14', name: '澗の彼方へ', icon: '🌊', desc: 'そばを1澗杯打つ。', req: { totalSoba: 1e36 } },
    { id: 'ach_rich_mid', name: '銀河規模の経済', icon: '🪙', desc: '1秒間に100垓杯生産。', req: { cps: 1e22 } },
    { id: 'ach_click_fast_2', name: '神速の麺棒', icon: '🌪️', desc: '1秒間に15回クリック。', req: { clickSpeed: 15 } },
    { id: 'ach_click_7', name: '連打の化身', icon: '🦾', desc: '25万回クリック。', req: { clicks: 250000 } },
    { id: 'ach_golden_5', name: '黄金郷の主', icon: '🏆', desc: 'ゴールデンそば250回。', req: { goldenClicks: 250 } },
    { id: 'ach_build_7', name: 'そば文明の礎', icon: '🗿', desc: '施設合計10000個。', req: { totalBuildings: 10000 } },
    { id: 'ach_upg_count_1', name: '改良の第一歩', icon: '🔧', desc: 'アップグレードを10個購入する。', req: { upgradesCount: 10 } },
    { id: 'ach_upg_count_2', name: '改良マニア', icon: '🛠️', desc: 'アップグレードを50個購入する。', req: { upgradesCount: 50 } },
    { id: 'ach_upg_count_3', name: '改良の鬼', icon: '⚙️', desc: 'アップグレードを100個購入する。', req: { upgradesCount: 100 } },
    { id: 'ach_fever_3', name: '終わらない祭り', icon: '🎆', desc: 'フィーバータイム50回。', req: { feverCount: 50 } },
    { id: 'ach_order_1', name: '初めてのご注文', icon: '📋', desc: 'お客さんの注文を1回達成する。', req: { ordersCompleted: 1 } },
    { id: 'ach_order_10', name: '評判の店', icon: '⭐', desc: 'お客さんの注文を10回達成する。', req: { ordersCompleted: 10 } },
    { id: 'ach_order_50', name: '行列のできる店', icon: '🏮', desc: 'お客さんの注文を50回達成する。', req: { ordersCompleted: 50 } },
    { id: 'ach_farm_1', name: '新種の芽吹き', icon: '🌾', desc: 'そば畑で新しい在来種を見つける。', req: { farmDiscovered: 2 } },
    { id: 'ach_farm_all', name: '在来種コンプリート', icon: '🏅', desc: 'そば畑の在来種を全て見つける。', req: { farmAll: 1 } },
    { id: 'ach_farm_harvest', name: '豊作の年', icon: '🧺', desc: 'そば畑で100回収穫する。', req: { farmHarvests: 100 } },
    { id: 'ach_login_3', name: '三日坊主卒業', icon: '📅', desc: '3日連続で遊ぶ。', req: { loginStreak: 3 } },
    { id: 'ach_login_7', name: '皆勤賞', icon: '🗓️', desc: '7日連続で遊ぶ。', req: { loginStreak: 7 } },
    { id: 'ach_login_30', name: '越前の常連', icon: '🎖️', desc: '30日連続で遊ぶ。', req: { loginStreak: 30 } },
    { id: 'ach_sell_1', name: '店じまい', icon: '💸', desc: '施設を売却する。', req: { buildingsSold: 1 } }
];

// Per-building milestone achievements, generated for every building
const BUILDING_ACHIEVEMENT_TIERS = [
    { count: 50, title: 'の達人', icon: '🥉' },
    { count: 100, title: 'の支配者', icon: '🥈' },
    { count: 200, title: 'の頂点', icon: '🥇' }
];
BUILDINGS.forEach(b => {
    BUILDING_ACHIEVEMENT_TIERS.forEach(tier => {
        ACHIEVEMENTS.push({
            id: `ach_b_${b.id}_${tier.count}`,
            name: `${b.name}${tier.title}`,
            icon: b.icon,
            desc: `${b.name}を${tier.count}個所有する。${tier.icon}`,
            req: { buildings: { [b.id]: tier.count } }
        });
    });
});

// Secret/shadow achievements - not counted in the normal achievement total, quirky unlock conditions
const SHADOW_ACHIEVEMENTS = [
    { id: 'shadow_pacifist', name: 'そばを打たない主義', icon: '🧘', desc: '一度もクリックせずに累計5万杯に到達する。' },
    { id: 'shadow_equal', name: '均等分配', icon: '⚖️', desc: '全ての施設をちょうど1つずつ所有する。' },
    { id: 'shadow_reset_addict', name: 'リセット常習犯', icon: '🌀', desc: 'リセットボタンを50回見る。' },
    { id: 'shadow_midnight', name: '満月の夜', icon: '🌕', desc: '深夜0時〜4時の間にプレイする。' }
];

const CHALLENGES = [
    { id: 'no_click', name: '不動の一杯', icon: '🧘', desc: 'クリックせずに施設の力だけで累計1000万杯を目指す。挑戦中はクリックパワーが常に0になる。', goal: 1e7, modifier: 'noClick' },
    { id: 'no_golden', name: '幸運を捨てし者', icon: '🚫', desc: 'ゴールデンそば・呪われしそば・季節限定そばが一切出現しない状態で累計1億杯を目指す。', goal: 1e8, modifier: 'noGolden' },
    { id: 'expensive', name: '高騰の時代', icon: '📈', desc: '施設のコストが常に1.5倍の状態で累計1000万杯を目指す。', goal: 1e7, modifier: 'expensiveBuildings' }
];

const REGIONS = [
    { id: 'katsuyama', name: '勝山', icon: '🦕', x: 45, y: 20, unlockBuildings: 500, cost: 5e9, bonusName: '恐竜ボーナス', bonusDesc: '太古の地層から呼び覚まされた力で、全生産が+10%される。', effect: 'globalMult', value: 1.10, requires: null, flavor: '恐竜博物館で知られる勝山に支店を開いた。地元の子供たちがそば打ちを恐竜の骨掘りのように楽しんでいる。' },
    { id: 'tsuruga', name: '敦賀', icon: '⚓', x: 55, y: 62, unlockBuildings: 1200, cost: 5e14, bonusName: '港町ボーナス', bonusDesc: '港からそば粉を安く仕入れられるようになり、施設のコストが-5%される。', effect: 'cheaperBuild', value: 0.95, requires: 'katsuyama', flavor: '古くから港町として栄えた敦賀に支店を開いた。海を渡ってきた上質なそば粉が手に入るようになった。' },
    { id: 'obama', name: '小浜', icon: '🐟', x: 25, y: 78, unlockBuildings: 2500, cost: 5e19, bonusName: '御食国ボーナス', bonusDesc: 'かつて都に食を献上した御食国の技が、だしの実効レベルを+3する。', effect: 'dashiBonusFlat', value: 3, requires: 'tsuruga', flavor: '御食国として知られた小浜に支店を開いた。鯖街道の記憶が、極上のだしを生み出す。' },
    { id: 'takefu', name: '武生(越前市)', icon: '⚔️', x: 40, y: 48, unlockBuildings: 4500, cost: 5e24, bonusName: '打刃物ボーナス', bonusDesc: '越前打刃物の伝統的な切れ味で、クリックパワーが+15%される。', effect: 'clickMult', value: 1.15, requires: 'obama', flavor: '越前打刃物と越前和紙の町、武生に支店を開いた。鍛え抜かれた刃物が、そば切りの一撃を鋭くする。' },
    { id: 'ono', name: '大野', icon: '💧', x: 64, y: 36, unlockBuildings: 800, cost: 5e11, bonusName: '名水ボーナス', bonusDesc: '御清水(おしょうず)の名水で、そば畑の作物が25%早く育つ。', effect: 'farmSpeed', value: 1.25, requires: 'katsuyama', flavor: '名水の城下町・大野に支店を開いた。' },
    { id: 'eiheiji', name: '永平寺', icon: '🧘', x: 34, y: 28, unlockBuildings: 1600, cost: 5e16, bonusName: '精進ボーナス', bonusDesc: '禅の修行で鍛えた集中力で、お客さんの注文の制限時間が30%延びる。', effect: 'orderTime', value: 1.3, requires: 'ono', flavor: '禅の里・永平寺の門前に支店を開いた。' },
    { id: 'sabae', name: '鯖江', icon: '👓', x: 27, y: 40, unlockBuildings: 2000, cost: 5e18, bonusName: 'メガネボーナス', bonusDesc: 'よく見えるメガネのおかげで、ゴールデンそば等の出現率が+20%。', effect: 'goldenFreqMult', value: 1.2, requires: 'tsuruga', flavor: 'メガネの聖地・鯖江に支店を開いた。' },
    { id: 'tojinbo', name: '東尋坊', icon: '🌊', x: 20, y: 12, unlockBuildings: 3200, cost: 5e22, bonusName: '度胸ボーナス', bonusDesc: '断崖絶壁で鍛えた度胸で、呪われしそばで失うそばが40%減る。', effect: 'wrathShield', value: 0.6, requires: 'obama', flavor: '断崖の名所・東尋坊のそばに支店を開いた。' },
    { id: 'echizen_coast', name: '越前海岸', icon: '🦀', x: 16, y: 58, unlockBuildings: 6000, cost: 5e28, bonusName: '越前ガニボーナス', bonusDesc: '冬の味覚・越前ガニとの合わせ技で、全生産が+25%。', effect: 'globalMult', value: 1.25, requires: 'takefu', flavor: '越前ガニの本場・越前海岸に支店を開いた。' }
];

// --- Soba farm crops: Fukui's native buckwheat strains, discovered by cross-breeding ---
const FARM_UNLOCK_SOBA = 1e5;
const FARM_MAX_SIZE = 4; // plots are stored as a 4x4 grid; only the top-left size x size is usable
const CROPS = [
    { id: 'common', name: '普通そば', icon: '🌱', growMin: 2, costSec: 30, minCost: 100, harvestSec: 90, effect: { type: 'cps', value: 0.01 }, effectDesc: '実っている間、全生産+1%', desc: 'どこでも育つ基本のそば。まずはこれを並べて育てよう。' },
    { id: 'maruoka', name: '丸岡在来', icon: '🌾', growMin: 5, costSec: 120, minCost: 1000, harvestSec: 400, effect: { type: 'click', value: 0.03 }, effectDesc: '実っている間、クリックパワー+3%', desc: '丸岡の地で受け継がれてきた在来種。香りが強い。' },
    { id: 'ono', name: '大野在来', icon: '💧', growMin: 10, costSec: 300, minCost: 5000, harvestSec: 1000, effect: { type: 'cps', value: 0.03 }, effectDesc: '実っている間、全生産+3%', desc: '名水の里・大野の在来種。ほのかな甘みがある。発見すると畑が4×4に広がる。' },
    { id: 'imajo', name: '今庄在来', icon: '❄️', growMin: 20, costSec: 600, minCost: 20000, harvestSec: 2500, effect: { type: 'golden', value: 0.05 }, effectDesc: '実っている間、ゴールデンそば等の報酬+5%', desc: '豪雪の今庄で育つ、寒さに強い在来種。' },
    { id: 'miyama', name: '美山在来', icon: '🍂', growMin: 40, costSec: 1200, minCost: 100000, harvestSec: 6000, effect: { type: 'cps', value: 0.05 }, effectDesc: '実っている間、全生産+5%', desc: '山あいの美山で守られてきた希少な在来種。' },
    { id: 'maboroshi', name: '幻の越前在来', icon: '✨', growMin: 90, costSec: 3000, minCost: 1000000, harvestSec: 20000, effect: { type: 'cps', value: 0.12 }, effectDesc: '実っている間、全生産+12%', desc: '見た者はほとんどいないという、伝説のそば。' }
];
function createFreshFarm() {
    return { plots: new Array(FARM_MAX_SIZE * FARM_MAX_SIZE).fill(null), discovered: ['common'], harvests: 0 };
}

// Rarest first, so a plot next to rare parents tries the rare child before the common ones
const CROP_RECIPES = [
    { parents: ['miyama', 'imajo'], child: 'maboroshi', chance: 0.0008 },
    { parents: ['imajo', 'ono'], child: 'miyama', chance: 0.002 },
    { parents: ['ono', 'maruoka'], child: 'imajo', chance: 0.003 },
    { parents: ['maruoka', 'common'], child: 'ono', chance: 0.004 },
    { parents: ['common', 'common'], child: 'maruoka', chance: 0.006 }
];

// --- Customer orders ---
const ORDER_CUSTOMERS = [
    { icon: '🧳', name: '県外からの観光客' },
    { icon: '👵', name: '近所の常連さん' },
    { icon: '♨️', name: '芦原温泉の旅館' },
    { icon: '🦖', name: '恐竜博物館の見学団' },
    { icon: '🏯', name: '一乗谷のお殿様' },
    { icon: '🎓', name: '修学旅行生の団体' },
    { icon: '🚄', name: '北陸新幹線の乗客' },
    { icon: '⛩️', name: '永平寺の修行僧' }
];
const ORDER_FIRST_DELAY = 90 * 1000;
const ORDER_MIN_GAP = 180 * 1000;
const ORDER_MAX_GAP = 360 * 1000;
const REPUTATION_MAX = 100; // raised to 150 by the heavenly upgrade 老舗の信用 (see getReputationMax)
const REPUTATION_BONUS = 0.005; // +0.5% production per reputation point
const SELL_REFUND_RATE = 0.25;

const GLOSSARY = [
    { category: '基本', term: 'そば', icon: '🍜', desc: 'このゲームの基本通貨。クリックや施設で増える。' },
    { category: '基本', term: '毎秒(CPS)', icon: '⏱️', desc: '1秒間に自動で生産されるそばの量。施設やアップグレードで伸ばせる。' },
    { category: '基本', term: 'クリックパワー', icon: '👆', desc: 'ボウルを1回クリック(またはスペースキー)した時に得られるそばの量。' },
    { category: '基本', term: '施設', icon: '🏠', desc: '購入すると自動でそばを生産し続けてくれる建物。買うたびに次の値段が上がっていく。ショップ上部の×1/×10/×100/MAXボタンで、一度に複数まとめて購入できる。' },
    { category: '基本', term: 'アップグレード', icon: '⭐', desc: '施設やクリックの効率を倍増させる一度きりの購入。特定の条件を満たすと出現する。各施設には所有数10・25・50・100個で段階的な強化が用意されている。' },
    { category: '基本', term: '実績', icon: '🏆', desc: '特定の条件を満たすと解除される。実績の数が「だし」レベルに影響する。' },
    { category: '特殊出現物', term: 'ゴールデンそば', icon: '✨', desc: '画面にランダムで出現。クリックするとフィーバー・ボーナス・クリックフィーバー・大量ボーナスのいずれかが発生する。' },
    { category: '特殊出現物', term: '呪われしそば', icon: '😈', desc: 'ゴールデンそばの代わりに稀に出現する黒いそば。クリックするとそばを失うか、逆に大量ボーナスを得るかの賭け。' },
    { category: '特殊出現物', term: '季節限定そば', icon: '🎐', desc: '現在の季節に応じた特別なそばが稀に出現し、大きな一括ボーナスをくれる。' },
    { category: '特殊出現物', term: 'フィーバータイム', icon: '🔥', desc: 'ゴールデンそばの効果の一つ。一定時間、全生産量が7倍になる。' },
    { category: '転生システム', term: '転生(プレステージ)', icon: '♻️', desc: '累計そば生産量が1兆杯を超えると可能。施設やそばをリセットする代わりに「越前魂」を獲得する。オフライン中の生産は自動では発生せず、天界の力「まどろみの生産」を取得することで解放される。' },
    { category: '転生システム', term: '越前魂', icon: '👻', desc: '転生で得られる永続通貨。1個につき全生産+1%(天界の力で+1.5%)される他、天界の力の購入にも使える。もらえる数は全世の累計生産量で決まり、1兆杯で約15個、1000兆杯で約150個。1000個を超えた分は効果がゆるやかになる。' },
    { category: '転生システム', term: '天界の力', icon: '☁️', desc: '転生タブで越前魂を使って買う恒久アップグレード。買っても越前魂によるボーナス(%)は減らない。スキルツリー式になっており、一部の項目は前提の項目を先に取得する必要がある。' },
    { category: '転生システム', term: 'そば粉の塊', icon: '🍡', desc: '20分ごとに1個たまる資源(現実時間で進行)。既に所有している施設を「熟成」させて永続+1%できる。' },
    { category: '育成要素', term: 'だし', icon: '🍲', desc: '実績7個ごとに1レベル上がる。「だし猫」系アップグレードの効果を強化する。' },
    { category: '育成要素', term: '祭壇・そばの精霊', icon: '⛩️', desc: '施設合計50個で解放。6柱の精霊から最大2柱(天界の力で3柱・4柱)を選んで祀れる。それぞれ強力な恩恵と引き換えのデメリットを持つので、組み合わせを考える必要がある。' },
    { category: '育成要素', term: '季節イベント', icon: '🌸', desc: '現実の日付に応じて春夏秋冬が自動で切り替わり、季節ごとに異なる永続ボーナスがかかる。' },
    { category: 'ミニゲーム', term: '手打ちそば道場', icon: '🥢', desc: '5分に1回挑戦できるタイミングゲーム。真ん中で「切る！」を押せるほど「職人ポイント」(永続の生産ボーナス)がたくさん貯まる。' },
    { category: '隠し要素', term: '隠された熟練の力', icon: '🧠', desc: '実績10個ごとに自動で発動する非公開の生産ボーナス。ショップには表示されない。' },
    { category: 'ミニゲーム', term: '挑戦モード', icon: '⚔️', desc: '初回転生後に解放。特殊なルール(クリック不可・特殊出現物なし・施設コスト1.5倍など)の中で目標達成を目指す。開始すると今の進行状況は安全に退避され、クリアか中断でいつでも戻せる。クリアすると永久に+3%(天界の力「挑戦者の誇り」で+6%)の生産ボーナスがもらえる。' },
    { category: '育成要素', term: '福井ご当地MAP・支店', icon: '🗾', desc: '施設合計350個で「育成 → 地図」が解放。勝山・大野・永平寺・敦賀・鯖江・小浜・東尋坊・武生・越前海岸に、施設数の条件を満たしそばを払うことで支店を設立できる(前の支店が必要な、かなり長期的な目標)。支店ごとに恐竜ボーナス・名水ボーナスなど、その土地ならではの永続効果が手に入る。' },
    { category: '育成要素', term: 'そば畑・在来種', icon: '🌾', desc: '累計10万杯で「育成 → そば畑」が解放。種をまくと現実の時間で育ち、実っている間は作物ごとの効果が続く。収穫するとそばが手に入る。実った作物の隣の空き地には、組み合わせ次第で丸岡在来・大野在来など福井の在来種が芽吹くことがある。新種を見つけるたびに全生産が永続+2%。' },
    { category: '育成要素', term: '評判', icon: '⭐', desc: 'お客さんの注文を達成するたびに1上がる(最大100)。評判1につき全生産+0.5%(天界の力で上限150)。転生してもなくならない。' },
    { category: 'ミニゲーム', term: 'お客さんの注文', icon: '📋', desc: '数分おきにお客さんから注文が届く。制限時間内に指定の杯数を作る(注文中に増えたそばの量で判定)と、報酬と「評判」がもらえる。失敗しても罰はないので気軽に挑戦しよう。' },
    { category: '基本', term: '売却', icon: '💸', desc: 'ショップの「売却」モードで施設を売れる。購入額の25%が戻る。' },
    { category: '基本', term: 'ログインボーナス', icon: '🎁', desc: '1日1回、その日最初に遊んだときにそばがもらえる。連続で遊ぶほど増え、7日目にはそば粉の塊ももらえる。' },
    { category: '基本', term: '設定・引き継ぎ', icon: '⚙️', desc: '「設定」タブで効果音・演出・数字の表示を変えられる。セーブデータを文字列やファイルで書き出し、別の端末で読み込むこともできる。' },
    { category: '隠し要素', term: '裏実績', icon: '🌑', desc: '通常の実績数にはカウントされない、少し変わった条件で解除される隠し実績。統計タブで確認できる。' }
];

const NEWS = [
    "越前そばの香りが街中に漂っています。",
    "大根おろしの辛さがクセになると評判です。",
    "「ここのそばを食べないと一日が始まらない」と語る常連客。",
    "そば打ち見習い、驚異的な成長を見せる。",
    "最新の石臼製粉機、導入。摩擦熱を抑えて香りをキープ。",
    "越前そば祭り、過去最高の動員数を記録！",
    "AIロボットが打つそば、人間と区別がつかないレベルに。",
    "宇宙で打たれたそば、驚きのコシの強さ。",
    "時間跳躍製麺機により、茹で時間はマイナスへ。",
    "見習いたちが「越前そば革命」を宣言。生産性が大幅アップ。",
    "異次元から届くそば、その味は「宇宙の真理」と評される。",
    "銀河鉄道により、アンドロメダ星雲までそばが届くように。",
    "ブラックホールの重力で粉を挽くと、味が濃縮されることが判明。",
    "宇宙創成の瞬間、そこには既にそばがあったという新説。",
    "転生を繰り返すそば職人、ついに「究極の麺」に到達か？",
    "そばの神髄、ついに一般家庭でも体験可能に（要異次元契約）。",
    "謎の黒猫が厨房に住み着いた。だしの香りがそばを引き立てるらしい。",
    "夜な夜な現れる「呪われしそば」に注意――触れる者に幸運と災いを等しくもたらすという。",
    "そば粉の塊が発見された。これを使えば古い施設も生まれ変わるとの噂。",
    "転生を経た者だけが辿り着ける「天界」。そこには更なる力が眠っているという。",
    "越前おろしそば、県外の高校生の間で「映える」と話題に。",
    "専門家「大根おろしは辛いほど良い」、甘口派と激しい論争に。",
    "製麺工場の見学ツアー、予約が3年先まで埋まる。",
    "石臼を回し続けた見習い、ついに「石臼と会話できる」と主張。",
    "そば祭りの行列、ついに県境を越える。",
    "AI製麺ロボ、自らそば打ち段位の取得に挑戦。",
    "宇宙そば農場の作業員「地球のそばが恋しい」とコメント。",
    "時間跳躍製麺機の副作用で、昨日のそばが明日届く事案が発生。",
    "異次元そば門から「つゆが薄い」とクレームが届く。",
    "そばの神髄に触れた者、全員が無言でうなずくのみ。",
    "銀河鉄道の車内販売、そば以外の商品がすべて廃止に。",
    "量子そば、食べたかどうか観測するまで満腹にならないと判明。",
    "「そばは飲み物」派と「そばは噛むもの」派、国会で討論へ。",
    "越前そばの海外進出、現地語で「ECHIZEN SOBA」が流行語に。",
    "天気予報「明日は晴れ時々そば、所によりおろし」。"
];
