// 越前そばクリッカー: language support (loaded first).
// Japanese is written directly in the code; other languages register translations in I18N (see lang-en.js).
// t('日本語の文 {0}', x) returns the translation of the template (or the Japanese itself) with {0}, {1}… filled in.

const SUPPORTED_LANGS = ['ja', 'en'];

// Chosen in settings; first visit follows the browser language
const LANG = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem('echizenSobaSettings') || '{}').lang;
        if (SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (e) { /* storage unavailable */ }
    return (navigator.language || 'ja').toLowerCase().startsWith('ja') ? 'ja' : 'en';
})();
document.documentElement.lang = LANG;

const I18N = { en: { text: {}, data: {} } };

function t(ja, ...args) {
    const dict = I18N[LANG] && I18N[LANG].text;
    const template = dict && dict[ja] !== undefined ? dict[ja] : ja;
    return args.length ? template.replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? args[i] : m)) : template;
}

// Overwrite translatable fields of game data entries, matched by id (or by index for lists without ids)
function localizeList(list, kind, keyOf = (item) => item.id) {
    const table = I18N[LANG] && I18N[LANG].data[kind];
    if (!table) return;
    list.forEach((item, i) => {
        const tr = table[keyOf(item, i)];
        if (tr) Object.assign(item, tr);
    });
}

// Static page text: replace text nodes and a few attributes whose (trimmed) Japanese has a translation
function translateDom(root = document) {
    const dict = I18N[LANG] && I18N[LANG].text;
    if (!dict || LANG === 'ja') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
        const raw = node.nodeValue;
        const key = raw.trim();
        if (key && dict[key] !== undefined) node.nodeValue = raw.replace(key, dict[key]);
    });
    root.querySelectorAll('[placeholder], [alt], meta[name="apple-mobile-web-app-title"]').forEach(el => {
        ['placeholder', 'alt', 'content'].forEach(attr => {
            const v = el.getAttribute(attr);
            if (v && dict[v.trim()] !== undefined) el.setAttribute(attr, dict[v.trim()]);
        });
    });
}
