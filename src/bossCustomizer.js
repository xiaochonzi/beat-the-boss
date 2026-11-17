// 👔 捏老板工坊：自定义老板姓名、口头禅与卡通形象（支持手机原生输入法与本地存档）

const STORAGE_KEY = 'niuma_custom_boss_v1'

export const BOSS_OPTIONS = {
  hair: [
    { id: 'combover', label: '地中海假发' },
    { id: 'slick', label: '油头大背头' },
    { id: 'afro', label: '暴躁爆炸头' },
    { id: 'bald', label: '强光光明顶' },
    { id: 'perm', label: '女魔头卷发' },
    { id: 'bun', label: '干练丸子头' }
  ],
  glasses: [
    { id: 'shades', label: '黑超墨镜' },
    { id: 'gold_rim', label: '斯文金丝镜' },
    { id: 'thick_frame', label: '黑框总监镜' },
    { id: 'monocle', label: '资本单片镜' },
    { id: 'sharp', label: '挑剔死鱼眼' }
  ],
  suit: [
    { id: 'navy_gold', label: '藏青金领带' },
    { id: 'burgundy', label: '骚包酒红装' },
    { id: 'polo', label: '爹味Polo衫' },
    { id: 'tech_vest', label: '大厂羽绒背心' },
    { id: 'queen_red', label: '女王红套装' },
    { id: 'white_chain', label: '白西装金链' }
  ],
  beard: [
    { id: 'mustache', label: '八字小胡子' },
    { id: 'goatee', label: '精明山羊胡' },
    { id: 'full_beard', label: '浓密络腮胡' },
    { id: 'lipstick', label: '烈焰红唇痣' },
    { id: 'clean', label: '白净双下巴' }
  ],
  bodyShape: [
    { id: 'chubby', label: '发福啤酒肚' },
    { id: 'normal', label: '精明干练型' },
    { id: 'wide', label: '魁梧宽肩型' }
  ]
}

export const PRESET_NAMES = ['王总', '张总', '李姐', '刘主管', '陈总', '周扒皮']
export const PRESET_QUOTES = [
  '今天简单讲两句！',
  '先把颗粒度对齐！',
  '年轻人别太看重钱！',
  '把公司当自己家！',
  '周末自愿来团建！'
]

const DEFAULT_PROFILE = {
  name: '王总',
  catchphrase: '今天简单讲两句！',
  hair: 'combover',
  glasses: 'shades',
  suit: 'navy_gold',
  beard: 'mustache',
  bodyShape: 'chubby'
}

export function createBossCustomizer({ onUpdate } = {}) {
  let profile = loadProfile()
  let open = false
  let previewBald = false
  let domModal = null

  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (raw && typeof raw === 'object') {
        return {
          ...DEFAULT_PROFILE,
          ...raw,
          name: String(raw.name || '王总').trim().slice(0, 8) || '王总',
          catchphrase: String(raw.catchphrase || DEFAULT_PROFILE.catchphrase).trim().slice(0, 18)
        }
      }
    } catch {}
    return { ...DEFAULT_PROFILE }
  }

  function saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {}
    onUpdate?.(profile)
  }

  // 将任意文案中的“王总”替换为玩家自定义的老板名字
  function replaceName(str) {
    if (!str || typeof str !== 'string') return str
    if (!profile.name || profile.name === '王总') return str
    return str.replaceAll('王总', profile.name)
  }

  // 将自定义老板姓名与口头禅注入当前关卡实例
  function applyToGame(game) {
    if (!game) return
    for (const g of game.guards || []) {
      if (g.role === 'boss') {
        g.baseName ??= g.name
        g.name = g.baseName.includes('王总')
          ? g.baseName.replaceAll('王总', profile.name)
          : profile.name
        if (profile.catchphrase && !g.customQuoteApplied) {
          g.thought = `${profile.catchphrase}`
          g.customQuoteApplied = true
        }
      }
    }
    for (const o of game.objects || []) {
      o.baseName ??= o.name
      if (o.baseName?.includes('王总')) {
        o.name = o.baseName.replaceAll('王总', profile.name)
      }
    }
  }

  function randomize() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)]
    const funNames = ['王总', '张总', '李姐', '刘主管', '马老板', '周扒皮', '赵总监', '孙老板', '吴太']
    profile = {
      name: pick(funNames),
      catchphrase: pick(PRESET_QUOTES),
      hair: pick(BOSS_OPTIONS.hair).id,
      glasses: pick(BOSS_OPTIONS.glasses).id,
      suit: pick(BOSS_OPTIONS.suit).id,
      beard: pick(BOSS_OPTIONS.beard).id,
      bodyShape: pick(BOSS_OPTIONS.bodyShape).id
    }
    // 若抽到女老板发型，优先搭配红唇与女王装增加趣味度
    if ((profile.hair === 'perm' || profile.hair === 'bun') && Math.random() < 0.7) {
      profile.beard = 'lipstick'
      if (Math.random() < 0.6) profile.suit = 'queen_red'
    }
    saveProfile()
  }

  // 弹出手机原生键盘友好的姓名/口头禅输入浮层
  function openInputOverlay() {
    if (domModal) domModal.remove()
    domModal = document.createElement('div')
    domModal.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:rgba(20,22,38,0.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"PingFang SC","Microsoft YaHei",sans-serif;'
    domModal.innerHTML = `
      <div style="width:min(340px,92vw);background:#fffdf5;border:3.5px solid #2b2d42;border-radius:22px;padding:18px 16px;box-shadow:0 14px 36px rgba(0,0,0,0.35);">
        <div style="font-size:17px;font-weight:900;color:#2b2d42;text-align:center;margin-bottom:12px;">✏️ 自定义你的怨种老板</div>
        <label style="display:block;font-size:12px;font-weight:800;color:#495057;margin-bottom:4px;">👑 老板称呼 / 名字（最多8字）：</label>
        <input id="boss-name-inp" type="text" maxlength="8" value="${profile.name.replace(/"/g, '&quot;')}" placeholder="例如：张总、李姐、老刘"
          style="width:100%;box-sizing:border-box;font-size:16px;font-weight:800;padding:10px 12px;border:2.5px solid #2b2d42;border-radius:12px;background:#ffffff;color:#2b2d42;outline:none;margin-bottom:10px;" />
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          ${PRESET_NAMES.map(n => `<button type="button" data-preset-name="${n}" style="font-size:12px;font-weight:800;padding:4px 9px;border-radius:10px;border:1.8px solid #2b2d42;background:#fff3b0;color:#2b2d42;cursor:pointer;">${n}</button>`).join('')}
        </div>
        <label style="display:block;font-size:12px;font-weight:800;color:#495057;margin-bottom:4px;">💬 老板经典画饼口头禅（最多18字）：</label>
        <input id="boss-quote-inp" type="text" maxlength="18" value="${profile.catchphrase.replace(/"/g, '&quot;')}" placeholder="例如：先把颗粒度对齐！"
          style="width:100%;box-sizing:border-box;font-size:16px;font-weight:800;padding:10px 12px;border:2.5px solid #2b2d42;border-radius:12px;background:#ffffff;color:#2b2d42;outline:none;margin-bottom:10px;" />
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;">
          ${PRESET_QUOTES.map(q => `<button type="button" data-preset-quote="${q}" style="font-size:11px;font-weight:800;padding:4px 8px;border-radius:9px;border:1.5px solid #2b2d42;background:#e0fbfc;color:#0077b6;cursor:pointer;">${q}</button>`).join('')}
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" id="boss-inp-cancel" style="flex:1;font-size:14px;font-weight:900;padding:10px;border-radius:14px;border:2.5px solid #2b2d42;background:#e9ecef;color:#2b2d42;cursor:pointer;">取消</button>
          <button type="button" id="boss-inp-ok" style="flex:1.4;font-size:15px;font-weight:900;padding:10px;border-radius:14px;border:2.5px solid #2b2d42;background:#38b000;color:#ffffff;cursor:pointer;">✅ 确认修改</button>
        </div>
      </div>
    `
    document.body.appendChild(domModal)
    const nameInp = domModal.querySelector('#boss-name-inp')
    const quoteInp = domModal.querySelector('#boss-quote-inp')
    setTimeout(() => nameInp?.focus(), 40)

    domModal.querySelectorAll('[data-preset-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        nameInp.value = btn.getAttribute('data-preset-name')
      })
    })
    domModal.querySelectorAll('[data-preset-quote]').forEach(btn => {
      btn.addEventListener('click', () => {
        quoteInp.value = btn.getAttribute('data-preset-quote')
      })
    })
    const closeDom = save => {
      if (save) {
        const nv = String(nameInp.value || '').trim().slice(0, 8)
        const qv = String(quoteInp.value || '').trim().slice(0, 18)
        if (nv) profile.name = nv
        if (qv) profile.catchphrase = qv
        saveProfile()
      }
      domModal?.remove()
      domModal = null
    }
    domModal.querySelector('#boss-inp-cancel').addEventListener('click', () => closeDom(false))
    domModal.querySelector('#boss-inp-ok').addEventListener('click', () => closeDom(true))
    nameInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') closeDom(true)
    })
    quoteInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') closeDom(true)
    })
  }

  // 按钮热区布局 (390 x 844 画布)
  const RECTS = {
    closeBtn: { x: 334, y: 44, w: 32, h: 32 },
    editNameBtn: { x: 28, y: 222, w: 230, h: 38 },
    baldToggleBtn: { x: 266, y: 222, w: 96, h: 38 },
    randomBtn: { x: 28, y: 740, w: 138, h: 50 },
    saveBtn: { x: 176, y: 740, w: 186, h: 50 }
  }

  function getPresetChips() {
    return PRESET_NAMES.map((n, i) => ({
      name: n,
      x: 28 + i * 56,
      y: 268,
      w: 52,
      h: 26
    }))
  }

  const ROW_KEYS = [
    { key: 'hair', title: '💇 发型' },
    { key: 'glasses', title: '👓 眼神' },
    { key: 'suit', title: '👔 穿搭' },
    { key: 'beard', title: '🧔 面相' },
    { key: 'bodyShape', title: '🏋️ 体型' }
  ]

  function getAttrRowRects() {
    const list = []
    ROW_KEYS.forEach((rk, rowIdx) => {
      const y = 304 + rowIdx * 84
      const opts = BOSS_OPTIONS[rk.key]
      const cols = opts.length <= 3 ? 3 : 3
      const cw = Math.floor((334 - (cols - 1) * 6) / cols)
      opts.forEach((opt, i) => {
        const col = i % 3
        const subRow = Math.floor(i / 3)
        list.push({
          cat: rk.key,
          id: opt.id,
          label: opt.label,
          x: 28 + col * (cw + 6),
          y: y + 18 + subRow * 29,
          w: cw,
          h: 25
        })
      })
    })
    return list
  }

  function handlePointerDown(p, sfxTap) {
    if (!open) return false
    const inR = r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

    if (inR(RECTS.closeBtn) || inR(RECTS.saveBtn)) {
      open = false
      sfxTap?.()
      saveProfile()
      return true
    }
    if (inR(RECTS.editNameBtn)) {
      sfxTap?.()
      openInputOverlay()
      return true
    }
    if (inR(RECTS.baldToggleBtn)) {
      previewBald = !previewBald
      sfxTap?.()
      return true
    }
    if (inR(RECTS.randomBtn)) {
      randomize()
      sfxTap?.()
      return true
    }
    for (const chip of getPresetChips()) {
      if (inR(chip)) {
        profile.name = chip.name
        if (chip.name === '李姐' && profile.hair === 'combover') {
          profile.hair = 'perm'
          profile.beard = 'lipstick'
          profile.suit = 'queen_red'
        }
        saveProfile()
        sfxTap?.()
        return true
      }
    }
    for (const item of getAttrRowRects()) {
      if (inR(item)) {
        profile[item.cat] = item.id
        saveProfile()
        sfxTap?.()
        return true
      }
    }
    return true // 拦截底层点击
  }

  function drawModal(ctx, renderer, { VW, VH, INK, rr, circle, text }, clock) {
    if (!open) return
    ctx.save()
    ctx.fillStyle = 'rgba(20, 22, 38, 0.78)'
    ctx.fillRect(0, 0, VW, VH)

    const x = 14
    const w = VW - 28
    rr(x, 32, w, 774, 24, '#fffdf5', INK, 3.5)
    rr(x, 32, w, 56, [24, 24, 0, 0], '#ff006e', INK, 3.5)
    text('👔 捏老板工坊：定制你的专属老板', x + 16, 66, {
      size: 16.5,
      color: '#ffffff',
      stroke: INK,
      sw: 4
    })

    // 右上关闭钮
    rr(RECTS.closeBtn.x, RECTS.closeBtn.y, RECTS.closeBtn.w, RECTS.closeBtn.h, 16, '#fffdf5', INK, 2.2)
    text('✕', RECTS.closeBtn.x + 16, RECTS.closeBtn.y + 22, { size: 15, align: 'center' })

    // 1) 顶部舞台预览区 (y: 96..214)
    rr(28, 96, 334, 118, 16, '#fff3b0', INK, 2.4)
    circle(92, 162, 42, '#ffe5ec', '#ff006e', 2.2)

    ctx.save()
    ctx.translate(92, 174)
    ctx.scale(1.58, 1.58)
    renderer.drawChibi(
      0,
      0,
      'boss',
      Math.PI / 2,
      {
        moving: true,
        mood: previewBald ? 'dizzy' : 'angry',
        wigLost: previewBald
      },
      clock
    )
    ctx.restore()

    // 预览区右侧：名字铭牌 + 口头禅气泡
    rr(148, 108, 202, 30, 10, '#2b2d42', '#ffd166', 2)
    text(`👑 怨种老板：${profile.name}`, 249, 128, {
      size: 13,
      color: '#ffd166',
      align: 'center',
      max: 188
    })

    rr(148, 146, 202, 56, 12, '#ffffff', INK, 2)
    text(`💬 “${profile.catchphrase}”`, 249, 169, {
      size: 10.5,
      color: '#d90429',
      align: 'center',
      max: 188
    })
    text('（全16关剧情、血条与台词自动同步此形象）', 249, 190, {
      size: 8.2,
      color: '#6c757d',
      align: 'center'
    })

    // 2) 改名/改语录输入框按钮 + 假发吹飞预览开关 (y: 222..260)
    rr(RECTS.editNameBtn.x, RECTS.editNameBtn.y, RECTS.editNameBtn.w, RECTS.editNameBtn.h, 12, '#e0fbfc', '#0077b6', 2.2)
    text(`✏️ 点击输入老板真名/语录 (${profile.name})`, RECTS.editNameBtn.x + RECTS.editNameBtn.w / 2, RECTS.editNameBtn.y + 24, {
      size: 10.8,
      color: '#0077b6',
      align: 'center',
      max: RECTS.editNameBtn.w - 12
    })

    rr(
      RECTS.baldToggleBtn.x,
      RECTS.baldToggleBtn.y,
      RECTS.baldToggleBtn.w,
      RECTS.baldToggleBtn.h,
      12,
      previewBald ? '#ff006e' : '#f1f3f5',
      INK,
      2
    )
    text(
      previewBald ? '✨ 秃头状态' : '💨 预览吹秃',
      RECTS.baldToggleBtn.x + RECTS.baldToggleBtn.w / 2,
      RECTS.baldToggleBtn.y + 24,
      {
        size: 10.2,
        color: previewBald ? '#ffffff' : INK,
        align: 'center'
      }
    )

    // 3) 快捷老板称呼标签行 (y: 268..294)
    getPresetChips().forEach(chip => {
      const sel = profile.name === chip.name
      rr(chip.x, chip.y, chip.w, chip.h, 8, sel ? '#ffbe0b' : '#f8f9fa', INK, sel ? 2.2 : 1.4)
      text(chip.name, chip.x + chip.w / 2, chip.y + 17, {
        size: 9.5,
        color: INK,
        align: 'center'
      })
    })

    // 4) 五大外观维度点选矩阵 (y: 304..724)
    ROW_KEYS.forEach((rk, rowIdx) => {
      const y = 304 + rowIdx * 84
      text(rk.title, 28, y + 12, { size: 10.5, color: '#2b2d42' })
    })

    getAttrRowRects().forEach(item => {
      const sel = profile[item.cat] === item.id
      rr(
        item.x,
        item.y,
        item.w,
        item.h,
        8,
        sel ? '#38b000' : '#f1f3f5',
        sel ? INK : 'rgba(43,45,66,0.35)',
        sel ? 2.2 : 1.3
      )
      text(item.label, item.x + item.w / 2, item.y + 16.5, {
        size: 9.2,
        color: sel ? '#ffffff' : '#2b2d42',
        align: 'center',
        max: item.w - 6
      })
    })

    // 5) 底部：🎲随机奇葩老板 | ✅保存并开整TA！
    rr(RECTS.randomBtn.x, RECTS.randomBtn.y, RECTS.randomBtn.w, RECTS.randomBtn.h, 22, '#ffd166', INK, 2.6)
    text('🎲 随机奇葩老板', RECTS.randomBtn.x + RECTS.randomBtn.w / 2, RECTS.randomBtn.y + 30, {
      size: 13,
      align: 'center',
      color: INK
    })

    rr(RECTS.saveBtn.x, RECTS.saveBtn.y, RECTS.saveBtn.w, RECTS.saveBtn.h, 22, '#38b000', INK, 2.8)
    text(`✅ 保存并开整【${profile.name}】`, RECTS.saveBtn.x + RECTS.saveBtn.w / 2, RECTS.saveBtn.y + 30, {
      size: 13.5,
      align: 'center',
      color: '#ffffff',
      stroke: INK,
      sw: 3,
      max: RECTS.saveBtn.w - 14
    })

    ctx.restore()
  }

  return {
    getProfile: () => ({ ...profile }),
    isOpen: () => open,
    openModal: () => {
      open = true
      previewBald = false
    },
    closeModal: () => {
      open = false
    },
    replaceName,
    applyToGame,
    handlePointerDown,
    drawModal
  }
}
