// Hand-drawn icons that replace emoji in the most visible places (buildings, upgrades, tabs).
// Each picture is a small SVG on a 64×64 grid, turned into a data: URL so it needs no extra file
// (and works offline). Anything without a picture here keeps its emoji, so this can grow bit by bit.
const ICON_ART = (() => {
    const K = '#2b1607'; // outline colour shared by every picture
    const o = (w = 2.5) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const steam = (x, y, c = '#f5e6c8') => `<path d="M${x} ${y} q-4 -5 0 -10 q4 -5 0 -10" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/>`;
    const star = (x, y, r, c = '#ffe9a0') => `<path d="M${x} ${y - r} L${x + r * .28} ${y - r * .28} L${x + r} ${y} L${x + r * .28} ${y + r * .28} L${x} ${y + r} L${x - r * .28} ${y + r * .28} L${x - r} ${y} L${x - r * .28} ${y - r * .28}Z" fill="${c}"/>`;
    // A small soba bowl, used inside several pictures
    const bowl = (cx, cy, s = 1, rim = '#c8361c') => `<g transform="translate(${cx} ${cy}) scale(${s})">
        <path d="M-16 -2 h32 q0 14 -16 16 q-16 -2 -16 -16z" fill="${rim}" ${o()}/>
        <path d="M-10 6 q10 5 20 0" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="0" cy="-2" rx="16" ry="4.5" fill="#6b3f15" ${o()}/>
        <path d="M-11 -2.5 q3 -2 6 0 t6 0 t6 0 t5 0" fill="none" stroke="#e6c98d" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M-6 13 h12 l-1 3 h-10z" fill="${rim}" ${o(2)}/></g>`;
    return {
        // ---------- buildings ----------
        student: `<path d="M14 60 q2 -16 18 -16 q16 0 18 16z" fill="#2c4a7a" ${o()}/>
            <path d="M26 44 l6 8 l6 -8" fill="#f5e6c8" ${o(2)}/>
            <circle cx="32" cy="28" r="15" fill="#f2c79a" ${o()}/>
            <path d="M17 26 q2 -15 15 -15 q13 0 15 15 q-6 -6 -15 -6 q-9 0 -15 6z" fill="#3a2410" ${o()}/>
            <path d="M16 22 q16 -6 32 0 v5 q-16 -6 -32 0z" fill="#f5f0e6" ${o(2)}/>
            <path d="M47 23 l7 -5 l-1 8z" fill="#f5f0e6" ${o(2)}/>
            <circle cx="26.5" cy="30" r="1.8" fill="${K}"/><circle cx="37.5" cy="30" r="1.8" fill="${K}"/>
            <path d="M28 36 q4 3 8 0" fill="none" ${o(2)}/>
            <circle cx="22" cy="34" r="2.5" fill="#f08a6a" opacity=".5"/><circle cx="42" cy="34" r="2.5" fill="#f08a6a" opacity=".5"/>`,
        kitchen: `${steam(26, 20)}${steam(38, 18)}
            <rect x="10" y="38" width="44" height="20" rx="2" fill="#9a5a34" ${o()}/>
            <path d="M10 45 h44 M10 52 h44 M22 38 v7 M40 38 v7 M16 45 v7 M32 45 v7 M48 45 v7" stroke="${K}" stroke-opacity=".45" stroke-width="1.5"/>
            <path d="M25 58 v-6 q7 -7 14 0 v6z" fill="#2b1607"/>
            <path d="M28 58 q4 -6 8 0z" fill="#ff8a2a"/><path d="M30 58 q2 -3 4 0z" fill="#ffe066"/>
            <path d="M14 38 q0 -14 18 -14 q18 0 18 14z" fill="#3b3b44" ${o()}/>
            <rect x="11" y="34" width="42" height="5" rx="2" fill="#55555f" ${o(2)}/>
            <path d="M20 30 q5 -4 10 -3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
        mill: `<path d="M44 14 l10 -6" fill="none" ${o(3)}/><rect x="40" y="14" width="5" height="12" rx="2" fill="#a0703c" ${o(2)}/>
            <ellipse cx="32" cy="44" rx="24" ry="9" fill="#7d7d84" ${o()}/>
            <path d="M8 44 v6 q0 9 24 9 q24 0 24 -9 v-6" fill="#66666e" ${o()}/>
            <ellipse cx="32" cy="30" rx="20" ry="7.5" fill="#a3a3ab" ${o()}/>
            <path d="M12 30 v8 q0 7.5 20 7.5 q20 0 20 -7.5 v-8" fill="#8b8b93" ${o()}/>
            <ellipse cx="32" cy="30" rx="4" ry="1.6" fill="${K}"/>
            <path d="M18 28 q6 -3 12 -3" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
            <path d="M52 47 q4 4 2 9" fill="none" stroke="#f5efe0" stroke-width="3" stroke-linecap="round"/>
            <circle cx="55" cy="58" r="1.6" fill="#f5efe0"/><circle cx="51" cy="60" r="1.2" fill="#f5efe0"/>`,
        shop: `<path d="M4 22 L32 8 L60 22z" fill="#3d3a48" ${o()}/>
            <path d="M4 22 h56" ${o(3)}/>
            <rect x="9" y="22" width="46" height="34" fill="#c9a26a" ${o()}/>
            <rect x="9" y="22" width="46" height="4" fill="#8a5a2b" ${o(2)}/>
            <path d="M12 26 h12 v20 l-6 -2 l-6 2z M26 26 h12 v20 l-6 -2 l-6 2z" fill="#2c4a7a" ${o(2)}/>
            <path d="M15 32 q3 -3 6 0 M29 32 q3 -3 6 0" fill="none" stroke="#f5e6c8" stroke-width="2" stroke-linecap="round"/>
            <path d="M47 26 v4" ${o(2)}/>
            <ellipse cx="47" cy="38" rx="6" ry="8" fill="#d8402a" ${o()}/>
            <path d="M42 34 h10 M41.5 38 h11 M42 42 h10" stroke="${K}" stroke-opacity=".4" stroke-width="1.3"/>
            <rect x="44" y="29" width="6" height="2.5" fill="${K}"/><rect x="44" y="45" width="6" height="2.5" fill="${K}"/>
            <path d="M4 56 h56" ${o(3)}/>`,
        factory: `<rect x="44" y="8" width="8" height="26" fill="#a8483a" ${o()}/>
            <path d="M46 6 q4 -4 8 -1" fill="none" stroke="#d9d9d9" stroke-width="3" stroke-linecap="round"/>
            <path d="M6 56 V30 l12 -8 v8 l12 -8 v8 l12 -8 v8 h12 V56z" fill="#7b8fa6" ${o()}/>
            <rect x="11" y="38" width="8" height="7" fill="#ffe08a" ${o(1.8)}/><rect x="24" y="38" width="8" height="7" fill="#ffe08a" ${o(1.8)}/>
            <rect x="37" y="38" width="8" height="7" fill="#ffe08a" ${o(1.8)}/>
            <rect x="4" y="52" width="56" height="6" rx="3" fill="#4a4a52" ${o(2)}/>
            <path d="M10 52 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0 q4 -5 8 0" fill="none" stroke="#e8cf98" stroke-width="2.2" stroke-linecap="round"/>`,
        festival: `<path d="M2 8 q30 12 60 0" fill="none" ${o(2)}/>
            ${[[10, 11, '#d8402a'], [22, 14, '#f5efe0'], [34, 14, '#d8402a'], [46, 12, '#f5efe0'], [56, 9, '#d8402a']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y + 4}" rx="3.6" ry="4.6" fill="${c}" ${o(1.6)}/>`).join('')}
            <path d="M18 60 l8 -14 M46 60 l-8 -14" ${o(3.5)}/><path d="M18 60 l8 -14 M46 60 l-8 -14" stroke="#a8743e" stroke-width="1.6"/>
            <circle cx="32" cy="40" r="16" fill="#9a3b1c" ${o()}/>
            <circle cx="32" cy="40" r="12" fill="#f3e2c0" ${o(2)}/>
            ${[0, 120, 240].map(a => `<path d="M32 40 m0 -7 a3.5 3.5 0 1 1 0 7 q-6 -1 -3 -9z" fill="#d8402a" transform="rotate(${a} 32 40)"/>`).join('')}
            ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<circle cx="32" cy="26" r="1.1" fill="#f5c842" transform="rotate(${a} 32 40)"/>`).join('')}
            <path d="M50 22 l10 -8 M54 26 l8 -4" ${o(3)}/><path d="M50 22 l10 -8 M54 26 l8 -4" stroke="#e8cf98" stroke-width="1.4"/>`,
        robot: `<path d="M32 6 v8" ${o()}/><circle cx="32" cy="6" r="3" fill="#ff5a5a" ${o(2)}/>
            <rect x="12" y="14" width="40" height="30" rx="8" fill="#b9c6d4" ${o()}/>
            <rect x="17" y="21" width="30" height="13" rx="6" fill="#1d2a3a" ${o(2)}/>
            <circle cx="25" cy="27.5" r="3" fill="#5ff0ff"/><circle cx="39" cy="27.5" r="3" fill="#5ff0ff"/>
            <path d="M26 39 h12" ${o(2)}/>
            <rect x="6" y="24" width="6" height="10" rx="2" fill="#8ea0b4" ${o(2)}/><rect x="52" y="24" width="6" height="10" rx="2" fill="#8ea0b4" ${o(2)}/>
            <path d="M18 60 v-12 h28 v12" fill="#8ea0b4" ${o()}/>
            <path d="M24 52 h16" stroke="#e8cf98" stroke-width="2.4" stroke-linecap="round"/>`,
        satellite: `${star(10, 12, 3)}${star(54, 10, 2.5)}${star(52, 30, 2)}
            <path d="M6 54 q26 -12 52 0 q-4 6 -26 6 q-22 0 -26 -6z" fill="#8a7a9a" ${o()}/>
            <circle cx="18" cy="55" r="2" fill="#6a5a7a"/><circle cx="44" cy="56" r="2.6" fill="#6a5a7a"/>
            <path d="M12 50 q0 -30 20 -30 q20 0 20 30z" fill="#9fe0ff" fill-opacity=".45" ${o()}/>
            <path d="M18 36 q4 -10 12 -12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M24 50 v-8 M32 50 v-11 M40 50 v-8" stroke="#3d7a2c" stroke-width="2"/>
            <path d="M24 43 q-4 -1 -4 -4 q4 0 4 4 M32 40 q4 -1 4 -4 q-4 0 -4 4 M40 43 q4 -1 4 -4 q-4 0 -4 4" fill="#6fbf4a"/>
            <circle cx="32" cy="38" r="1.8" fill="#fff"/><circle cx="24" cy="41" r="1.5" fill="#fff"/><circle cx="40" cy="41" r="1.5" fill="#fff"/>`,
        shrine: `<path d="M4 14 q28 -6 56 0 l-2 6 q-26 -5 -52 0z" fill="#d8402a" ${o()}/>
            <rect x="9" y="24" width="46" height="5" fill="#d8402a" ${o()}/>
            <rect x="15" y="18" width="6" height="42" fill="#d8402a" ${o()}/><rect x="43" y="18" width="6" height="42" fill="#d8402a" ${o()}/>
            <rect x="28" y="19" width="8" height="8" fill="#2b1607"/>
            <path d="M3 13 q29 -7 58 0" fill="none" ${o(3.5)}/>
            <rect x="12" y="56" width="12" height="4" fill="#2b1607"/><rect x="40" y="56" width="12" height="4" fill="#2b1607"/>`,
        timemachine: `<rect x="12" y="6" width="40" height="6" rx="2" fill="#c99a3a" ${o()}/>
            <rect x="12" y="52" width="40" height="6" rx="2" fill="#c99a3a" ${o()}/>
            <path d="M18 12 q0 14 12 20 q-12 6 -12 20 h28 q0 -14 -12 -20 q12 -6 12 -20z" fill="#d6f0ff" fill-opacity=".55" ${o()}/>
            <path d="M22 18 h20 q-2 8 -10 12 q-8 -4 -10 -12z" fill="#e8cf98"/>
            <path d="M32 32 v12" stroke="#e8cf98" stroke-width="2"/>
            <path d="M22 52 q10 -10 20 0z" fill="#e8cf98"/>
            <path d="M21 16 q1 8 6 12" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`,
        dimension: `<path d="M10 60 V28 q0 -20 22 -20 q22 0 22 20 V60z" fill="#5a5a66" ${o()}/>
            <path d="M16 60 V30 q0 -15 16 -15 q16 0 16 15 V60z" fill="#3a1866" ${o(2)}/>
            <path d="M32 40 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4" fill="none" stroke="#c38bff" stroke-width="2.6" stroke-linecap="round" transform="rotate(20 32 40)"/>
            <circle cx="32" cy="40" r="2.5" fill="#fff"/>
            ${star(22, 26, 2, '#e0c8ff')}${star(43, 52, 2, '#e0c8ff')}`,
        god: `<circle cx="32" cy="32" r="28" fill="#f5c842" fill-opacity=".16"/>
            ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M32 2 v5" stroke="#f5c842" stroke-opacity=".8" stroke-width="2.5" stroke-linecap="round" transform="rotate(${a} 32 32)"/>`).join('')}
            <path d="M44 14 A20 20 0 1 0 51 26" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/>
            <path d="M44 14 A20 20 0 1 0 51 26" fill="none" stroke="#f5e6c8" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M14 38 A20 20 0 0 0 30 52" fill="none" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="32" r="4.5" fill="#f5c842" ${o(2)}/>`,
        galaxy: `${star(8, 10, 2.5)}${star(26, 6, 2)}${star(56, 14, 3)}${star(44, 4, 1.6)}
            <path d="M2 58 q30 -6 60 -26" fill="none" stroke="#c38bff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="3 3"/>
            <rect x="8" y="30" width="34" height="18" rx="4" fill="#2a2a36" ${o()}/>
            <rect x="34" y="22" width="18" height="26" rx="2" fill="#2a2a36" ${o()}/>
            <rect x="38" y="26" width="10" height="8" fill="#ffe08a" ${o(1.8)}/>
            <rect x="14" y="20" width="7" height="10" fill="#3a3a48" ${o(2)}/>
            <path d="M12 16 q3 -4 8 -3 q2 -5 8 -3" fill="none" stroke="#e6e0ff" stroke-width="3" stroke-linecap="round"/>
            <rect x="8" y="36" width="26" height="3" fill="#d8402a"/>
            <circle cx="16" cy="50" r="5" fill="#d8402a" ${o(2)}/><circle cx="30" cy="50" r="5" fill="#d8402a" ${o(2)}/><circle cx="44" cy="50" r="5" fill="#d8402a" ${o(2)}/>
            <path d="M52 44 l8 4 v4 h-8z" fill="#7a7a86" ${o(2)}/>`,
        parallel: `<circle cx="22" cy="26" r="15" fill="#5aa6ff" fill-opacity=".55" ${o(2)}/>
            <circle cx="42" cy="26" r="15" fill="#ff6fae" fill-opacity=".55" ${o(2)}/>
            <circle cx="32" cy="42" r="15" fill="#ffd64a" fill-opacity=".55" ${o(2)}/>
            ${bowl(32, 33, .55)}`,
        quantum: `<g fill="none" stroke-width="2.6" stroke-linecap="round">
            <ellipse cx="32" cy="32" rx="27" ry="10" stroke="#5ff0ff"/>
            <ellipse cx="32" cy="32" rx="27" ry="10" stroke="#ff7ad9" transform="rotate(60 32 32)"/>
            <ellipse cx="32" cy="32" rx="27" ry="10" stroke="#ffe066" transform="rotate(120 32 32)"/></g>
            <circle cx="32" cy="32" r="7" fill="#e8cf98" ${o(2)}/>
            <path d="M27 31 q2.5 -2 5 0 t5 0" fill="none" stroke="#8a5a2b" stroke-width="1.6"/>
            <circle cx="59" cy="32" r="3" fill="#5ff0ff"/><circle cx="18.5" cy="8.6" r="3" fill="#ff7ad9"/><circle cx="18.5" cy="55.4" r="3" fill="#ffe066"/>`,
        blackhole: `<ellipse cx="32" cy="34" rx="29" ry="10" fill="none" stroke="#ff8a2a" stroke-width="5" transform="rotate(-14 32 34)"/>
            <ellipse cx="32" cy="34" rx="29" ry="10" fill="none" stroke="#ffe066" stroke-width="1.6" transform="rotate(-14 32 34)"/>
            <circle cx="32" cy="32" r="14" fill="#050308" stroke="#ffb347" stroke-width="2"/>
            <path d="M5 40 q27 -10 54 -14" fill="none" stroke="#ff8a2a" stroke-width="5" stroke-linecap="round" transform="rotate(-14 32 34)" opacity="0"/>
            <path d="M8.5 41 A29 10 -14 0 0 57 26" fill="none" stroke="#ffb347" stroke-width="5" stroke-linecap="round"/>
            <path d="M8.5 41 A29 10 -14 0 0 57 26" fill="none" stroke="#fff3c0" stroke-width="1.6" stroke-linecap="round"/>`,
        universe: `${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => `<path d="M32 32 L32 ${i % 2 ? 8 : 2}" stroke="${['#ffe066', '#ff7ad9', '#5ff0ff', '#ff8a2a'][i % 4]}" stroke-width="3" stroke-linecap="round" transform="rotate(${a} 32 32)"/>`).join('')}
            <circle cx="32" cy="32" r="13" fill="#fff6d0" ${o(2)}/>
            <circle cx="32" cy="32" r="7" fill="#ffd64a"/>
            ${star(12, 52, 3, '#fff')}${star(52, 12, 2.5, '#fff')}`,
        simulation: `<rect x="6" y="8" width="52" height="38" rx="4" fill="#3a3a44" ${o()}/>
            <rect x="11" y="13" width="42" height="28" fill="#0c2a1a"/>
            <path d="M11 20 h42 M11 27 h42 M11 34 h42 M18 13 v28 M25 13 v28 M32 13 v28 M39 13 v28 M46 13 v28" stroke="#2bd46a" stroke-opacity=".25" stroke-width="1"/>
            <path d="M22 26 h20 v3 q0 7 -10 8 q-10 -1 -10 -8z" fill="#2bd46a"/>
            <path d="M25 22 v-4 M32 22 v-5 M39 22 v-4" stroke="#2bd46a" stroke-width="2" stroke-linecap="round"/>
            <path d="M26 46 l-3 8 h18 l-3 -8" fill="#55555f" ${o()}/>
            <rect x="16" y="54" width="32" height="4" rx="2" fill="#55555f" ${o(2)}/>`,
        concept: `<circle cx="14" cy="54" r="3" fill="#f5efe0" ${o(1.8)}/><circle cx="20" cy="46" r="4.5" fill="#f5efe0" ${o(2)}/>
            <path d="M18 34 q-10 -2 -8 -12 q2 -10 12 -8 q4 -8 14 -6 q10 2 10 8 q10 0 10 10 q0 10 -10 10 q-4 6 -14 4 q-10 4 -14 -6z" fill="#f5efe0" ${o()}/>
            ${bowl(34, 24, .55, '#9a7ad0')}`,
        infinity: `<path d="M32 32 C24 18 8 18 8 32 C8 46 24 46 32 32 C40 18 56 18 56 32 C56 46 40 46 32 32z" fill="none" stroke="${K}" stroke-width="9" stroke-linejoin="round"/>
            <path d="M32 32 C24 18 8 18 8 32 C8 46 24 46 32 32 C40 18 56 18 56 32 C56 46 40 46 32 32z" fill="none" stroke="#e8cf98" stroke-width="5"/>
            <path d="M32 32 C24 18 8 18 8 32 C8 46 24 46 32 32 C40 18 56 18 56 32 C56 46 40 46 32 32z" fill="none" stroke="#fff6d0" stroke-width="1.4" stroke-dasharray="6 4"/>`,
        origin: `<circle cx="32" cy="36" r="24" fill="#bfff8a" fill-opacity=".14"/>
            <path d="M14 56 q18 -8 36 0" fill="#6b4320" ${o()}/>
            <path d="M32 54 v-22" ${o(3)}/><path d="M32 54 v-22" stroke="#6fbf4a" stroke-width="1.6"/>
            <path d="M32 40 q-16 2 -18 -12 q14 -2 18 12z" fill="#6fbf4a" ${o()}/>
            <path d="M32 34 q14 2 18 -12 q-16 -2 -18 12z" fill="#8fd65a" ${o()}/>
            <g fill="#fff" ${o(1.6)}><circle cx="32" cy="20" r="3.2"/><circle cx="27" cy="23" r="3.2"/><circle cx="37" cy="23" r="3.2"/><circle cx="29" cy="28" r="3.2"/><circle cx="35" cy="28" r="3.2"/></g>
            <circle cx="32" cy="24.5" r="2" fill="#f5c842"/>`,
        eternity: `<path d="M32 4 v6" ${o(3)}/><circle cx="32" cy="5" r="3.5" fill="#c99a3a" ${o(2)}/>
            <circle cx="32" cy="35" r="24" fill="#c99a3a" ${o()}/>
            <circle cx="32" cy="35" r="19" fill="#f5efe0" ${o(2)}/>
            ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<path d="M32 18 v${a % 90 ? 2 : 4}" stroke="${K}" stroke-width="2" transform="rotate(${a} 32 35)"/>`).join('')}
            <path d="M32 35 v-12 M32 35 l8 5" ${o(2.6)}/>
            <circle cx="32" cy="35" r="2.4" fill="#d8402a"/>
            <path d="M18 26 q4 -6 10 -8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`,
        omniscience: `<path d="M16 58 l4 -10 h24 l4 10z" fill="#8a5a2b" ${o()}/>
            <circle cx="32" cy="28" r="22" fill="#b98aff" fill-opacity=".35" ${o()}/>
            <circle cx="32" cy="28" r="14" fill="#e0c8ff" fill-opacity=".4"/>
            <path d="M20 18 q6 -8 14 -8" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3" stroke-linecap="round"/>
            ${bowl(32, 31, .5, '#c8361c')}
            ${star(46, 16, 2.5, '#fff')}`,
        ryujin: `<circle cx="47" cy="47" r="8" fill="#ffe066" ${o()}/>
            <path d="M44 44 q3 -2 5 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <path d="M10 58 q-6 -16 8 -22 q14 -6 10 -16 q-3 -8 6 -12" fill="none" stroke="${K}" stroke-width="12" stroke-linecap="round"/>
            <path d="M10 58 q-6 -16 8 -22 q14 -6 10 -16 q-3 -8 6 -12" fill="none" stroke="#3f9a6a" stroke-width="7.5" stroke-linecap="round"/>
            <path d="M10 58 q-6 -16 8 -22 q14 -6 10 -16 q-3 -8 6 -12" fill="none" stroke="#bfe8a0" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/>
            <path d="M30 4 q8 -2 14 2 l8 2 q4 2 2 6 l-6 2 q-2 6 -10 6 q-6 0 -9 -4z" fill="#3f9a6a" ${o()}/>
            <path d="M33 5 l-4 -5 M39 4 l0 -5" ${o(2.4)}/>
            <circle cx="43" cy="9" r="2" fill="#ffe066" stroke="${K}" stroke-width="1.2"/>
            <path d="M52 14 q8 2 10 8 M48 16 q4 6 2 12" fill="none" stroke="#f5efe0" stroke-width="1.8" stroke-linecap="round"/>`,
        kokuu: `<g fill="#b7b2cc" ${o(2)}>
            <path d="M6 22 h30 q4 0 4 -4 q0 -4 -4 -4 h-14"/>
            <path d="M22 42 h34 q4 0 4 -4 q0 -4 -4 -4 h-18"/>
            <path d="M4 56 h28 q4 0 4 -4 q0 -4 -4 -4 h-12"/></g>
            <rect x="14" y="27" width="40" height="5" rx="2.5" fill="#d9b27a" ${o(2)} transform="rotate(-12 34 30)"/>
            ${star(50, 14, 3, '#fff')}`,
        rinne: `<path d="M2 50 q8 -4 16 0 t16 0 t16 0 t14 0 V64 H2z" fill="#3f7fc4" ${o(2)}/>
            <circle cx="30" cy="30" r="22" fill="none" ${o(5)}/><circle cx="30" cy="30" r="22" fill="none" stroke="#a8743e" stroke-width="2.5"/>
            ${[0, 45, 90, 135].map(a => `<path d="M8 30 h44" ${o(3.2)} transform="rotate(${a} 30 30)"/><path d="M8 30 h44" stroke="#c99a5a" stroke-width="1.5" transform="rotate(${a} 30 30)"/>`).join('')}
            ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="27" y="4" width="6" height="7" fill="#a8743e" ${o(1.6)} transform="rotate(${a} 30 30)"/>`).join('')}
            <circle cx="30" cy="30" r="5" fill="#8a5a2b" ${o(2)}/>
            <path d="M54 8 v20 q0 6 -4 10" fill="none" stroke="#8fd0ff" stroke-width="4" stroke-linecap="round"/>
            <rect x="50" y="4" width="10" height="5" fill="#8a5a2b" ${o(2)}/>`,
        owarinaki: `<path d="M44 6 L18 30" stroke="#ffe066" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>
            ${star(46, 6, 6, '#fff3c0')}
            ${steam(26, 26)}${steam(36, 24)}
            ${bowl(32, 42, 1.3)}
            ${star(10, 18, 2.5, '#fff')}${star(56, 30, 2, '#fff')}`,
        you: `<path d="M12 60 q2 -16 20 -16 q18 0 20 16z" fill="#f5f5f0" ${o()}/>
            <path d="M24 44 l8 8 l8 -8" fill="none" ${o(2)}/>
            <path d="M14 52 q4 -6 8 -6" fill="none" stroke="#2c4a7a" stroke-width="4" stroke-linecap="round"/>
            <circle cx="32" cy="32" r="13" fill="#f2c79a" ${o()}/>
            <path d="M18 24 q-6 -12 6 -14 q4 -8 12 -4 q10 -4 12 6 q8 2 2 12 z" fill="#fff" ${o()}/>
            <rect x="18" y="20" width="28" height="6" rx="2" fill="#f0ece2" ${o(2)}/>
            <path d="M27 33 q1.5 -2 3 0 M34 33 q1.5 -2 3 0" fill="none" ${o(2)}/>
            <path d="M28 39 q4 3 8 0" fill="none" ${o(2)}/>`,

        // ---------- upgrade categories ----------
        hashi: `<rect x="12" y="6" width="5" height="54" rx="2.5" fill="#c97a3a" ${o()} transform="rotate(18 14 33)"/>
            <rect x="22" y="6" width="5" height="54" rx="2.5" fill="#c97a3a" ${o()} transform="rotate(30 24 33)"/>
            <path d="M28 48 q8 -2 12 6 q4 -10 14 -8" fill="none" stroke="#e8cf98" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M30 54 q8 -2 12 6" fill="none" stroke="#e8cf98" stroke-width="2.6" stroke-linecap="round"/>`,
        houcho: `<path d="M8 12 h40 v32 h-40z" fill="#d7dde3" ${o()}/>
            <path d="M8 40 h40" stroke="#fff" stroke-width="2.5"/>
            <path d="M20 12 v-4 h24 v4" fill="none" ${o()}/>
            <rect x="46" y="6" width="12" height="8" rx="2" fill="#5a3a1e" ${o(2)} transform="rotate(30 52 10)"/>
            <path d="M12 52 q6 -3 10 0 t10 0 t10 0 t10 0 M12 58 q6 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#e8cf98" stroke-width="2.4" stroke-linecap="round"/>`,
        inaho: `<path d="M32 60 v-30 M32 60 q-2 -16 -14 -26 M32 60 q2 -16 14 -26" fill="none" ${o(2.6)}/>
            ${[[32, 10], [32, 18], [32, 26], [16, 18], [19, 26], [48, 18], [45, 26]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="5.5" fill="#f5c842" ${o(1.8)}/>`).join('')}
            <path d="M24 58 h16" ${o(3)}/>`,
        neko: `<path d="M14 26 l2 -18 l12 10z M50 26 l-2 -18 l-12 10z" fill="#f5efe0" ${o()}/>
            <path d="M17 12 l1 8 l6 -3z" fill="#f08a9a"/>
            <circle cx="32" cy="34" r="20" fill="#f5efe0" ${o()}/>
            <path d="M38 16 q8 2 10 10 q-6 0 -10 -10z" fill="#e08a3a"/>
            <path d="M24 32 q2.5 -3 5 0 M35 32 q2.5 -3 5 0" fill="none" ${o(2.2)}/>
            <path d="M29 40 q3 3 3 0 q0 3 3 0" fill="none" ${o(1.8)}/>
            <path d="M8 36 h10 M8 41 h10 M46 36 h10 M46 41 h10" stroke="${K}" stroke-width="1.4"/>
            <path d="M22 52 q10 6 20 0" fill="none" stroke="#d8402a" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="32" cy="55" r="3" fill="#f5c842" ${o(1.6)}/>`,
        // ---------- tabs & small symbols ----------
        bowl: `${steam(26, 22)}${steam(38, 20)}${bowl(32, 38, 1.5)}`,
        sprout: `<path d="M14 56 q18 -8 36 0" fill="#6b4320" ${o()}/>
            <path d="M32 54 v-24" ${o(3)}/>
            <path d="M32 38 q-18 2 -20 -14 q16 -2 20 14z" fill="#6fbf4a" ${o()}/>
            <path d="M32 32 q16 2 20 -14 q-18 -2 -20 14z" fill="#8fd65a" ${o()}/>`,
        cloud: `<path d="M14 46 q-10 0 -10 -9 q0 -9 10 -9 q2 -12 15 -12 q11 0 14 10 q11 -1 13 9 q4 1 4 6 q0 5 -6 5z" fill="#f5efe0" ${o()}/>
            <path d="M20 38 q6 -4 12 0 t12 0" fill="none" stroke="#c8c0e0" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M8 56 h22 M36 56 h20" stroke="#f5efe0" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`,
        scroll: `<rect x="12" y="12" width="40" height="40" fill="#f5e6c8" ${o()}/>
            <rect x="8" y="8" width="48" height="7" rx="3.5" fill="#8a5a2b" ${o()}/>
            <rect x="8" y="49" width="48" height="7" rx="3.5" fill="#8a5a2b" ${o()}/>
            <path d="M20 22 v20 M28 22 v14 M36 22 v20 M44 22 v10" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="44" cy="40" r="3.5" fill="#d8402a"/>`,
        gear: `<g transform="translate(32 32)">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="-5" y="-27" width="10" height="12" rx="2" fill="#9aa3ad" ${o(2)} transform="rotate(${a})"/>`).join('')}
            <circle r="19" fill="#9aa3ad" ${o()}/><circle r="7" fill="#3b3b44" ${o(2)}/>
            <path d="M-12 -8 q4 -6 10 -7" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/></g>`,
        calendar: `<rect x="10" y="12" width="44" height="44" rx="4" fill="#f5efe0" ${o()}/>
            <path d="M10 16 q0 -4 4 -4 h36 q4 0 4 4 v8 h-44z" fill="#d8402a" ${o()}/>
            <path d="M22 8 v8 M42 8 v8" ${o(3)}/>
            <path d="M24 36 l6 6 l12 -12" fill="none" stroke="#3f9a6a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
        obi: `<path d="M10 60 l4 -40 q8 -8 18 -8 q10 0 18 8 l4 40z" fill="#f5f5f0" ${o()}/>
            <path d="M24 13 l8 22 l8 -22" fill="none" ${o(2.2)}/>
            <path d="M6 30 l8 -10 M58 30 l-8 -10" ${o(2.5)}/>
            <rect x="11" y="38" width="42" height="7" fill="#1d1d22" ${o(2)}/>
            <path d="M30 44 l-6 14 l5 0 l3 -12 M34 44 l6 14 l-5 0 l-3 -12" fill="#1d1d22" ${o(2)}/>
            <rect x="28" y="36" width="8" height="10" rx="2" fill="#2b2b32" ${o(2)}/>`,
        koinobori: `<path d="M10 6 v54" ${o(3)}/><circle cx="10" cy="6" r="3" fill="#f5c842" ${o(2)}/>
            <path d="M12 12 h34 q8 0 12 6 l-6 3 l6 3 q-4 6 -12 6 h-34z" fill="#2c4a7a" ${o()}/>
            <path d="M12 34 h30 q7 0 10 5 l-5 3 l5 3 q-3 5 -10 5 h-30z" fill="#d8402a" ${o()}/>
            <circle cx="18" cy="21" r="3" fill="#fff" ${o(1.5)}/><circle cx="18" cy="42" r="2.8" fill="#fff" ${o(1.5)}/>
            <path d="M26 16 q3 5 0 10 M33 16 q3 5 0 10 M28 37 q3 5 0 10 M35 37 q3 5 0 10" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`,
        ine: `<path d="M32 60 v-28 M32 60 q-4 -20 -16 -30 M32 60 q4 -20 16 -30" fill="none" stroke="#3f9a6a" stroke-width="3" stroke-linecap="round"/>
            ${[[32, 10], [32, 18], [32, 26], [16, 16], [19, 24], [48, 16], [45, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="5" fill="#d9b25a" ${o(1.6)}/>`).join('')}`,
        ebiten: `<path d="M10 52 q-4 -14 10 -20 q16 -6 30 -22 q4 -2 6 2 q-6 26 -28 38 q-10 6 -18 2z" fill="#e8b04a" ${o()}/>
            <path d="M18 40 l4 3 M26 34 l3 4 M34 28 l3 4 M42 20 l3 3" stroke="#a8742a" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M48 12 l6 -6 l2 6 l6 -2 l-4 6z" fill="#e8553a" ${o(2)}/>`,
        dango: `<path d="M32 4 v58" stroke="#c99a5a" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="32" cy="16" r="9.5" fill="#f5a3b8" ${o()}/><circle cx="32" cy="33" r="9.5" fill="#f5efe0" ${o()}/><circle cx="32" cy="50" r="9.5" fill="#8fc46a" ${o()}/>
            <path d="M27 13 q3 -3 6 -3" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`,
        map: `<path d="M6 14 l16 -6 l20 6 l16 -6 v42 l-16 6 l-20 -6 l-16 6z" fill="#f5e6c8" ${o()}/>
            <path d="M22 8 v42 M42 14 v42" stroke="${K}" stroke-opacity=".35" stroke-width="1.8"/>
            <path d="M14 40 q4 -14 14 -18 q8 -4 12 -12 q4 6 -2 12 q-4 10 -14 14 q-6 4 -10 4z" fill="#6fbf4a" ${o(2)}/>
            <circle cx="30" cy="28" r="3" fill="#d8402a" ${o(1.6)}/>`,
        swords: `<path d="M12 52 L50 10" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M12 52 L50 10" stroke="#e0e6ec" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M52 52 L14 10" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M52 52 L14 10" stroke="#e0e6ec" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M8 48 l10 10 M56 48 l-10 10" ${o(4)}/>
            <path d="M8 48 l10 10 M56 48 l-10 10" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>`,
        graph: `<rect x="8" y="8" width="48" height="48" rx="4" fill="#f5efe0" ${o()}/>
            <rect x="15" y="36" width="8" height="14" fill="#2c4a7a" ${o(1.8)}/><rect x="28" y="26" width="8" height="24" fill="#3f9a6a" ${o(1.8)}/><rect x="41" y="16" width="8" height="34" fill="#d8402a" ${o(1.8)}/>`,
        nafuda: `<path d="M32 4 v8" stroke="#d8402a" stroke-width="2.5"/><circle cx="32" cy="4" r="2.5" fill="#d8402a"/>
            <path d="M14 18 l18 -6 l18 6 v38 h-36z" fill="#c99a5a" ${o()}/>
            <path d="M19 21 l13 -4 l13 4 v31 h-26z" fill="#f5e6c8" ${o(1.8)}/>
            <path d="M26 26 h12 M32 26 v20 M26 34 h12 M26 46 h12" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="32" cy="16" r="1.8" fill="${K}"/>`,
        book: `<path d="M32 14 q-12 -6 -26 -2 v40 q14 -4 26 2 q12 -6 26 -2 v-40 q-14 -4 -26 2z" fill="#f5efe0" ${o()}/>
            <path d="M32 14 v40" ${o(2)}/>
            <path d="M12 22 q8 -2 14 1 M12 30 q8 -2 14 1 M12 38 q8 -2 14 1 M38 23 q6 -3 14 -1 M38 31 q6 -3 14 -1" fill="none" stroke="${K}" stroke-opacity=".45" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M44 12 v14 l3 -3 l3 3 v-15" fill="#d8402a" ${o(1.6)}/>`,
        golden: `<circle cx="32" cy="32" r="28" fill="#f5c842" fill-opacity=".25"/>
            ${bowl(32, 34, 1.5, '#e0a820')}
            ${star(14, 14, 5, '#fff6d0')}${star(52, 18, 4, '#fff6d0')}${star(50, 52, 3, '#fff6d0')}`
    };
})();

// Which emoji each picture stands in for, so text labels ("🥋 段位") can switch too
const EMOJI_ICON = {
    '🏪': 'shop', '🌱': 'sprout', '☁️': 'cloud', '📊': 'graph', '⚙️': 'gear', '📅': 'calendar', '🥋': 'obi',
    '🎏': 'koinobori', '🌾': 'ine', '🍤': 'ebiten', '🍡': 'dango', '⛩️': 'shrine', '🗾': 'map', '⚔️': 'swords',
    '📛': 'nafuda', '📜': 'scroll', '📖': 'book', '🍜': 'bowl'
};

const iconUrlCache = {};
function iconUrl(key) {
    if (!ICON_ART[key]) return null;
    if (!iconUrlCache[key]) {
        iconUrlCache[key] = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${ICON_ART[key]}</svg>`);
    }
    return iconUrlCache[key];
}

// <img> for a picture, or the given emoji if there is no picture for it
function iconHTML(key, fallback = '', cls = 'ico') {
    const url = iconUrl(key);
    return url ? `<img class="${cls}" src="${url}" alt="" draggable="false">` : fallback;
}

function buildingIconHTML(b) {
    return iconHTML(b.id, b.icon);
}

const UPGRADE_TYPE_ICON = { click: 'hashi', clickCps: 'houcho', global: 'inaho', kitten: 'neko' };

// Upgrade badge: the building's own picture for building upgrades (like the shop list), a
// picture per kind for the rest, with a small number for its tier so neighbouring badges stay distinguishable.
function upgradeIconHTML(u) {
    let key = u.type === 'building' ? u.target : UPGRADE_TYPE_ICON[u.type];
    if (!ICON_ART[key]) return u.icon;
    let tier = 0;
    if (u.type === 'building') {
        const need = u.req.buildings ? u.req.buildings[u.target] : 0;
        tier = need >= 100 ? 4 : need >= 50 ? 3 : need >= 25 ? 2 : 1;
    } else {
        tier = UPGRADES.filter(x => x.type === u.type).indexOf(u) + 1;
    }
    return `${iconHTML(key)}<span class="ico-tier tier-${Math.min(tier, 4)}">${tier}</span>`;
}

// Swap a leading emoji in a label ("🥋 段位") for its picture
function iconizeLabel(label) {
    for (const emoji in EMOJI_ICON) {
        if (label.startsWith(emoji)) return iconHTML(EMOJI_ICON[emoji], emoji, 'ico ico-inline') + label.slice(emoji.length);
    }
    return label;
}
