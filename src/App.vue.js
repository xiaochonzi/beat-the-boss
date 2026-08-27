import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { GameEngine } from './game/GameEngine';
import { achievements, seededLook, weapons } from './game/data';
const page = ref('home');
const bossName = ref('王总');
const previewKey = ref(0);
const canvas = ref();
const selected = ref('whip');
const engine = ref();
const dialogue = ref('这个需求应该很简单吧？');
const bubbleVisible = ref(true);
const settingsOpen = ref(false);
const achievementsOpen = ref(false);
const helpOpen = ref(false);
const toast = ref('');
const impacts = ref([]);
const stats = reactive({ stress: 0, combo: 0, maxCombo: 0, destruction: 0, hits: 0, slipperHits: 0, bestWeapon: '巴掌', rage: false, rageRemaining: 0 });
const settings = reactive({ bgm: .35, sfx: .6, shake: true, slowmo: true, particles: 2, quality: 'high', fps: 60 });
const unlocked = reactive(JSON.parse(localStorage.getItem('beat-boss-achievements') || '{}'));
let impactId = 0, bubbleTimer = 0;
const look = computed(() => seededLook(bossName.value.trim() || '老板'));
const stressFace = computed(() => stats.stress >= 100 ? '😆' : stats.stress >= 75 ? '🤣' : stats.stress >= 50 ? '😃' : stats.stress >= 25 ? '🙂' : '😫');
const currentWeapon = computed(() => weapons.find(w => w.id === selected.value));
const availableWeapons = computed(() => weapons.filter(w => w.unlockStress <= stats.stress || (stats.rage && w.unlockStress === 100)));
const lookStyle = computed(() => ({ '--skin': `#${look.value.skin.toString(16).padStart(6, '0')}`, '--suit': `#${look.value.suit.toString(16).padStart(6, '0')}`, '--hair': `#${look.value.hair.toString(16).padStart(6, '0')}`, '--tie': `#${look.value.tie.toString(16).padStart(6, '0')}` }));
watch(settings, () => { localStorage.setItem('beat-boss-settings', JSON.stringify(settings)); engine.value?.setSettings(settings); }, { deep: true });
const saved = localStorage.getItem('beat-boss-settings');
if (saved)
    Object.assign(settings, JSON.parse(saved));
function randomBoss() { const names = ['王总', '李经理', '赵主管', '周老板', '钱总监', '孙总', '马老师', '陈老板']; bossName.value = names[Math.floor(Math.random() * names.length)]; previewKey.value++; }
function validateName() { bossName.value = [...(bossName.value.trim() || '老板')].slice(0, 12).join(''); }
async function startGame() { validateName(); resetStats(); page.value = 'game'; await nextTick(); if (!canvas.value)
    return; engine.value = new GameEngine(canvas.value, look.value, { onHit, onStats, onDialogue: showDialogue, onAchievement: unlock, onRageEnd: finish }); await engine.value.init(); engine.value.setSettings(settings); engine.value.setHeldWeapon('whip'); showDialogue('这个需求应该很简单吧？'); }
function resetStats() { Object.assign(stats, { stress: 0, combo: 0, maxCombo: 0, destruction: 0, hits: 0, slipperHits: 0, bestWeapon: '巴掌', rage: false, rageRemaining: 0 }); selected.value = 'whip'; }
function onStats(s) { const old = stats.stress; Object.assign(stats, s); if (old < 20 && s.stress >= 20)
    notify('🔓 已解锁：充气锤'); if (old < 30 && s.stress >= 30)
    notify('🔓 已解锁：棒球棍'); if (old < 40 && s.stress >= 40)
    notify('🔓 已解锁：咸鱼'); if (s.combo >= 10)
    unlock('combo-10', '部门团建'); if (s.combo >= 30)
    unlock('combo-30', '企业级事故'); if (s.destruction >= 70)
    unlock('flat', '公司完成扁平化管理'); }
function onHit(points, label, x, y) { unlock('first-hit', '打工人的问候'); const id = ++impactId; impacts.value.push({ id, x, y, label, points }); setTimeout(() => impacts.value = impacts.value.filter(i => i.id !== id), 800); }
function showDialogue(text) { dialogue.value = text; bubbleVisible.value = true; clearTimeout(bubbleTimer); bubbleTimer = window.setTimeout(() => bubbleVisible.value = false, 2800); }
function unlock(id, name) { if (unlocked[id])
    return; unlocked[id] = true; localStorage.setItem('beat-boss-achievements', JSON.stringify(unlocked)); notify(`🏆 成就解锁：${name}`); }
function notify(text) { toast.value = text; setTimeout(() => { if (toast.value === text)
    toast.value = ''; }, 2600); }
function selectWeapon(id) { selected.value = id; engine.value?.setHeldWeapon(id); notify(weapons.find(w => w.id === id)?.hint || ''); }
function canvasClick(e) { if (['slipper', 'hammer'].includes(selected.value))
    return; engine.value?.useWeapon(selected.value, e.clientX, e.clientY); }
function chargeStart(e) { if (['slipper', 'hammer'].includes(selected.value)) {
    canvas.value?.setPointerCapture(e.pointerId);
    engine.value?.beginCharge(selected.value);
} }
function chargeEnd(e) { if (['slipper', 'hammer'].includes(selected.value)) {
    engine.value?.releaseCharge(e.clientX, e.clientY);
    if (canvas.value?.hasPointerCapture(e.pointerId))
        canvas.value.releasePointerCapture(e.pointerId);
} }
function finish() { unlock('rage', '很有精神'); localStorage.setItem('beat-boss-best-combo', String(Math.max(stats.maxCombo, Number(localStorage.getItem('beat-boss-best-combo') || 0)))); engine.value?.dispose(); engine.value = undefined; page.value = 'result'; }
function exitHome() { engine.value?.dispose(); engine.value = undefined; page.value = 'home'; }
function replay() { startGame(); }
function downloadCard() { const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 1200, 630); g.addColorStop(0, '#f8d44f'); g.addColorStop(1, '#ff7c5e'); x.fillStyle = g; x.fillRect(0, 0, 1200, 630); x.fillStyle = '#182138'; x.font = 'bold 76px sans-serif'; x.fillText('今日解压完成！', 80, 125); x.font = '44px sans-serif'; x.fillText(`我把「${bossName.value}」打出了`, 80, 220); x.font = 'bold 64px sans-serif'; x.fillText(`COMBO × ${stats.maxCombo}`, 80, 325); x.fillText(`办公室破坏度 ${Math.round(stats.destruction)}%`, 80, 415); x.font = '38px sans-serif'; x.fillText('《今天又想打老板》· 卡通物理解压小游戏', 80, 525); const shareUrl = `${window.location.origin}${window.location.pathname}`; x.fillStyle = 'rgba(24,33,56,.78)'; x.font = '600 27px sans-serif'; x.fillText(`来这里一起解压：${shareUrl}`, 80, 582); const a = document.createElement('a'); a.download = `今日解压-${bossName.value}.png`; a.href = c.toDataURL('image/png'); a.click(); }
onBeforeUnmount(() => engine.value?.dispose());
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "app-shell" },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
if (__VLS_ctx.page === 'home') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "home" },
    });
    /** @type {__VLS_StyleScopedClasses['home']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "home-noise" },
    });
    /** @type {__VLS_StyleScopedClasses['home-noise']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.page === 'home'))
                    throw 0;
                return (__VLS_ctx.settingsOpen = true);
                // @ts-ignore
                [page, settingsOpen,];
            } },
        ...{ class: "round top-setting" },
        'aria-label': "设置",
    });
    /** @type {__VLS_StyleScopedClasses['round']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-setting']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "brand" },
    });
    /** @type {__VLS_StyleScopedClasses['brand']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "brand-kicker" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-kicker']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.em, __VLS_intrinsics.em)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-card" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "avatar-stage" },
        ...{ style: (__VLS_ctx.lookStyle) },
        key: (__VLS_ctx.previewKey),
    });
    /** @type {__VLS_StyleScopedClasses['avatar-stage']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "preview-boss" },
    });
    /** @type {__VLS_StyleScopedClasses['preview-boss']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "hair" },
    });
    /** @type {__VLS_StyleScopedClasses['hair']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "ear left" },
    });
    /** @type {__VLS_StyleScopedClasses['ear']} */ ;
    /** @type {__VLS_StyleScopedClasses['left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "ear right" },
    });
    /** @type {__VLS_StyleScopedClasses['ear']} */ ;
    /** @type {__VLS_StyleScopedClasses['right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "face" },
    });
    /** @type {__VLS_StyleScopedClasses['face']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "nose" },
    });
    /** @type {__VLS_StyleScopedClasses['nose']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "mouth" },
    });
    /** @type {__VLS_StyleScopedClasses['mouth']} */ ;
    if (__VLS_ctx.look.glasses) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "glasses" },
        });
        /** @type {__VLS_StyleScopedClasses['glasses']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "body" },
    });
    /** @type {__VLS_StyleScopedClasses['body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "shirt" },
    });
    /** @type {__VLS_StyleScopedClasses['shirt']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "tie" },
    });
    /** @type {__VLS_StyleScopedClasses['tie']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "float-note n1" },
    });
    /** @type {__VLS_StyleScopedClasses['float-note']} */ ;
    /** @type {__VLS_StyleScopedClasses['n1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "float-note n2" },
    });
    /** @type {__VLS_StyleScopedClasses['float-note']} */ ;
    /** @type {__VLS_StyleScopedClasses['n2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "start-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['start-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "name-row" },
    });
    /** @type {__VLS_StyleScopedClasses['name-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onBlur: (__VLS_ctx.validateName) },
        ...{ onKeyup: (__VLS_ctx.startGame) },
        maxlength: "24",
        'aria-label': "老板名字",
    });
    (__VLS_ctx.bossName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.randomBoss) },
        title: "随机老板",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "seed-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['seed-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.startGame) },
        ...{ class: "primary" },
    });
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.page === 'home'))
                    throw 0;
                return (__VLS_ctx.achievementsOpen = true);
                // @ts-ignore
                [lookStyle, previewKey, look, validateName, startGame, startGame, bossName, randomBoss, achievementsOpen,];
            } },
        ...{ class: "text-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['text-btn']} */ ;
    (Object.keys(__VLS_ctx.unlocked).length);
    (__VLS_ctx.achievements.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
else if (__VLS_ctx.page === 'game') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "game" },
        ...{ class: ({ rage: __VLS_ctx.stats.rage }) },
    });
    /** @type {__VLS_StyleScopedClasses['game']} */ ;
    /** @type {__VLS_StyleScopedClasses['rage']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.canvas, __VLS_intrinsics.canvas)({
        ...{ onClick: (__VLS_ctx.canvasClick) },
        ...{ onPointerdown: (__VLS_ctx.chargeStart) },
        ...{ onPointerup: (__VLS_ctx.chargeEnd) },
        ref: "canvas",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "hud" },
    });
    /** @type {__VLS_StyleScopedClasses['hud']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "boss-tag" },
    });
    /** @type {__VLS_StyleScopedClasses['boss-tag']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.stressFace);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    (__VLS_ctx.bossName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stress" },
    });
    /** @type {__VLS_StyleScopedClasses['stress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stress-title" },
    });
    /** @type {__VLS_StyleScopedClasses['stress-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    (Math.round(__VLS_ctx.stats.stress));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar" },
    });
    /** @type {__VLS_StyleScopedClasses['bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ style: ({ width: __VLS_ctx.stats.stress + '%' }) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hud-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['hud-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.page === 'home'))
                    throw 0;
                if (!(__VLS_ctx.page === 'game'))
                    throw 0;
                return (__VLS_ctx.helpOpen = true);
                // @ts-ignore
                [page, bossName, unlocked, achievements, stats, stats, stats, canvasClick, chargeStart, chargeEnd, stressFace, helpOpen,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.page === 'home'))
                    throw 0;
                if (!(__VLS_ctx.page === 'game'))
                    throw 0;
                return (__VLS_ctx.settingsOpen = true);
                // @ts-ignore
                [settingsOpen,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exitHome) },
    });
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        name: "pop",
    }));
    const __VLS_2 = __VLS_1({
        name: "pop",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    if (__VLS_ctx.bubbleVisible) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dialogue" },
        });
        /** @type {__VLS_StyleScopedClasses['dialogue']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
        (__VLS_ctx.bossName);
        (__VLS_ctx.dialogue);
    }
    // @ts-ignore
    [bossName, exitHome, bubbleVisible, dialogue,];
    var __VLS_3;
    if (__VLS_ctx.stats.combo > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "combo" },
        });
        /** @type {__VLS_StyleScopedClasses['combo']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (__VLS_ctx.stats.combo >= 30 ? '企业级事故' : __VLS_ctx.stats.combo >= 10 ? '混乱现场' : __VLS_ctx.stats.combo >= 5 ? '办公室事故' : '不错');
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
        (__VLS_ctx.stats.combo);
    }
    if (__VLS_ctx.stats.rage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rage-banner" },
        });
        /** @type {__VLS_StyleScopedClasses['rage-banner']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (Math.ceil(__VLS_ctx.stats.rageRemaining));
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "aim-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['aim-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.currentWeapon.icon);
    (__VLS_ctx.currentWeapon.hint);
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "weapon-dock" },
    });
    /** @type {__VLS_StyleScopedClasses['weapon-dock']} */ ;
    for (const [w] of __VLS_vFor((__VLS_ctx.availableWeapons))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.page === 'home'))
                        throw 0;
                    if (!(__VLS_ctx.page === 'game'))
                        throw 0;
                    return (__VLS_ctx.selectWeapon(w.id));
                    // @ts-ignore
                    [stats, stats, stats, stats, stats, stats, stats, currentWeapon, currentWeapon, availableWeapons, selectWeapon,];
                } },
            key: (w.id),
            ...{ class: ({ active: __VLS_ctx.selected === w.id }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (w.icon);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (w.name);
        if (w.unlockStress > 0 && !__VLS_ctx.stats.rage) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
            (w.unlockStress);
        }
        // @ts-ignore
        [stats, selected,];
    }
    for (const [i] of __VLS_vFor((__VLS_ctx.impacts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i.id),
            ...{ class: "impact" },
            ...{ style: ({ left: i.x + 'px', top: i.y + 'px' }) },
        });
        /** @type {__VLS_StyleScopedClasses['impact']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
        (i.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (i.points);
        // @ts-ignore
        [impacts,];
    }
    let __VLS_6;
    /** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        name: "toast",
    }));
    const __VLS_8 = __VLS_7({
        name: "toast",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    if (__VLS_ctx.toast) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toast" },
        });
        /** @type {__VLS_StyleScopedClasses['toast']} */ ;
        (__VLS_ctx.toast);
    }
    // @ts-ignore
    [toast, toast,];
    var __VLS_9;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "result" },
    });
    /** @type {__VLS_StyleScopedClasses['result']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confetti" },
    });
    /** @type {__VLS_StyleScopedClasses['confetti']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-card" },
    });
    /** @type {__VLS_StyleScopedClasses['result-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-face" },
    });
    /** @type {__VLS_StyleScopedClasses['result-face']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['result-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    (__VLS_ctx.stats.maxCombo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    (Math.round(__VLS_ctx.stats.destruction));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    (__VLS_ctx.stats.bestWeapon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "result-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['result-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.replay) },
        ...{ class: "primary" },
    });
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.exitHome) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadCard) },
    });
}
if (__VLS_ctx.settingsOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.settingsOpen))
                    throw 0;
                return (__VLS_ctx.settingsOpen = false);
                // @ts-ignore
                [settingsOpen, settingsOpen, stats, stats, stats, exitHome, replay, downloadCard,];
            } },
        ...{ class: "modal-back" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-back']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.settingsOpen))
                    throw 0;
                return (__VLS_ctx.settingsOpen = false);
                // @ts-ignore
                [settingsOpen,];
            } },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "range",
        min: "0",
        max: "1",
        step: ".1",
    });
    (__VLS_ctx.settings.bgm);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "range",
        min: "0",
        max: "1",
        step: ".1",
    });
    (__VLS_ctx.settings.sfx);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.settings.shake);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.settings.slowmo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.settings.particles),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (0),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (1),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (2),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.settings.fps),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (30),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: (60),
    });
}
if (__VLS_ctx.achievementsOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.achievementsOpen))
                    throw 0;
                return (__VLS_ctx.achievementsOpen = false);
                // @ts-ignore
                [achievementsOpen, achievementsOpen, settings, settings, settings, settings, settings, settings,];
            } },
        ...{ class: "modal-back" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-back']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal achievements" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['achievements']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.achievementsOpen))
                    throw 0;
                return (__VLS_ctx.achievementsOpen = false);
                // @ts-ignore
                [achievementsOpen,];
            } },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    for (const [a] of __VLS_vFor((__VLS_ctx.achievements))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: ({ locked: !__VLS_ctx.unlocked[a.id] }) },
        });
        /** @type {__VLS_StyleScopedClasses['locked']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.unlocked[a.id] ? '🏆' : '🔒');
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
        (a.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (a.desc);
        // @ts-ignore
        [unlocked, unlocked, achievements,];
    }
}
if (__VLS_ctx.helpOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.helpOpen))
                    throw 0;
                return (__VLS_ctx.helpOpen = false);
                // @ts-ignore
                [helpOpen, helpOpen,];
            } },
        ...{ class: "modal-back" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-back']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.helpOpen))
                    throw 0;
                return (__VLS_ctx.helpOpen = false);
                // @ts-ignore
                [helpOpen,];
            } },
        ...{ class: "close" },
    });
    /** @type {__VLS_StyleScopedClasses['close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.ol, __VLS_intrinsics.ol)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
