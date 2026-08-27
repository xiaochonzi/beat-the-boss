export const weapons = [
    { id: 'whip', name: '皮鞭', icon: '〰️', power: 20, unlockStress: 0, hint: '移动瞄准，点击甩动皮鞭' },
    { id: 'slap', name: '巴掌', icon: '🖐️', power: 18, unlockStress: 0, hint: '点击老板来一巴掌' },
    { id: 'slipper', name: '拖鞋', icon: '🩴', power: 24, unlockStress: 0, hint: '按住蓄力，松开发射' },
    { id: 'keyboard', name: '键盘', icon: '⌨️', power: 30, unlockStress: 0, hint: '点击发射键盘，键帽会乱飞' },
    { id: 'chair', name: '办公椅', icon: '🪑', power: 36, unlockStress: 0, hint: '移动瞄准，点击把办公椅扔出去' },
    { id: 'hammer', name: '充气锤', icon: '🔨', power: 52, unlockStress: 20, hint: '按住蓄力，满蓄力有慢动作' },
    { id: 'bat', name: '棒球棍', icon: '⚾', power: 44, unlockStress: 30, hint: '移动瞄准，点击横向挥击' },
    { id: 'fish', name: '咸鱼', icon: '🐟', power: 30, unlockStress: 40, hint: '湿滑咸鱼，啪叽！' },
];
export const idleDialogues = ['这个需求应该很简单。', '今天大家稍微加一下班。', '这个方案还差点意思。', '年轻人不要太在意工资。', '我突然有一个想法。', '明早我要看到第一版。'];
export const hitDialogues = [
    '等等！这一下不算！',
    '就这点力气？KPI 都比这有劲！',
    '你是在给我挠痒痒吗？',
    '再来啊，刚才那下没感觉！',
    '动作快点，别耽误下班！',
    '这就是你的全部实力？',
    '准头呢？周报里找找？',
    '打偏了也算工时吗？',
    '年轻人，力气要用在加班上！',
    '我站着不动你都打不中？',
    '奖金可以谈，但你得先打中！',
    '明天放假——前提是你再来一下！',
    '这个需求可以延期，你可别停啊！',
    '再用点力，我差点就信了！',
    '你的连击就到这里了吗？',
    '办公室这么大，你只会打我？',
    '旁边显示器看你很久了！',
    '换个道具，让我看看创意！',
    '拖鞋不错，可惜火候不够！',
    '皮鞭甩得像没交的周报！',
    '椅子是用来坐的——算了，你继续！',
    '键盘敲方案不行，扔得倒挺准！',
    '别停，我还没批准你下班！',
    '有本事打出十连击！',
    '五十连击？我看你做不到！',
    '解压值还没满，你就累了？',
    '再来一下，我考虑取消早会！',
    '打得好，下个需求奖励你重做！',
    '这力度，转正答辩可过不了！',
    '继续，我倒要看看谁先下班！',
];
export const comboTaunts = [
    '有点意思，但离十连击还远！',
    '连起来！别让我看不起你！',
    '十连击了？有本事继续！',
    '办公室都乱了，你可别先怂！',
    '再来！离解压完成只差一点！',
];
export const recoverDialogues = ['刚才是谁扶我？', '有事可以好好商量。', '这个需求……下周做也可以。'];
export const achievements = [
    { id: 'first-hit', name: '打工人的问候', desc: '第一次击中老板' },
    { id: 'slipper-20', name: '拖鞋战神', desc: '拖鞋累计命中 20 次' },
    { id: 'printer', name: '打印机终于坏了', desc: '破坏打印机' },
    { id: 'flat', name: '公司完成扁平化管理', desc: '办公室破坏度达到 70%' },
    { id: 'combo-10', name: '部门团建', desc: '一次达到 Combo ×10' },
    { id: 'combo-30', name: '企业级事故', desc: '一次达到 Combo ×30' },
    { id: 'rage', name: '很有精神', desc: '完成第一次暴走模式' },
];
export function hashName(name) {
    let hash = 2166136261;
    for (const char of name) {
        hash ^= char.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
export function seededLook(name) {
    let n = hashName(name);
    const rnd = () => ((n = Math.imul(n ^ (n >>> 15), 1 | n)), ((n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n) >>> 0) / 4294967296;
    const skins = [0xf1b78d, 0xd7956c, 0x8f5a3b, 0xffca9e];
    const suits = [0x17233e, 0x203f72, 0x3e3d46, 0xeee9df];
    const hairs = [0x17130f, 0x5d3821, 0x2d2b2a, 0x9b8a72];
    const ties = [0xe94444, 0xf0b632, 0x5c61d6, 0x31a781];
    return { seed: hashName(name), skin: skins[Math.floor(rnd() * skins.length)], suit: suits[Math.floor(rnd() * suits.length)], hair: hairs[Math.floor(rnd() * hairs.length)], tie: ties[Math.floor(rnd() * ties.length)], glasses: rnd() > .5, body: .85 + rnd() * .35 };
}
