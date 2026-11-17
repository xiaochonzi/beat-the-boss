// 《牛马求生记：反坑大老板》 — 5大章节 · 16关多元爆笑职场战役配置
// 严格遵循 18x13 网格坐标系 (COLS=18, ROWS=13, TILE=40, MAP_X=24, MAP_Y=52)

export const TOTAL_LEVELS = 16

export const CHAPTERS = [
  {
    id: 1,
    title: '第1章 · 潜行摸鱼篇',
    subtitle: '卡点打卡、偷渡螺蛳粉与高管厕所突围',
    color: '#2a9d8f',
    levels: [1, 2, 3]
  },
  {
    id: 2,
    title: '第2章 · 花式整蛊篇',
    subtitle: '不躲了！吹飞地中海假发、转椅保龄球与暗黑特调',
    color: '#f77f00',
    levels: [4, 5, 6]
  },
  {
    id: 3,
    title: '第3章 · 物理狂欢篇',
    subtitle: '氮气改装椅漂移拆加班 & 平底锅反弹黑锅对决',
    color: '#e63946',
    levels: [7, 8, 9]
  },
  {
    id: 4,
    title: '第4章 · 脑洞反转篇',
    subtitle: '拍醒摸鱼队友、反客为主当王总、17:59工位塔防',
    color: '#8338ec',
    levels: [10, 11, 12]
  },
  {
    id: 5,
    title: '第5章 · 终极掀桌篇',
    subtitle: '粉碎降薪协议、智取年终奖、拉闸断电与炒掉王总',
    color: '#ffb703',
    levels: [13, 14, 15, 16]
  }
]

// 18列 x 13行 室内布局模板 ('#'=实墙, 'G'=透明玻璃, ','=响声地毯, 'H'=绿植掩体, 'D'=门禁闸机, '.'=地板)
export const LAYOUT_TEMPLATES = {
  classic: [
    '##################',
    '#H...#.....#H...H#',
    '#....G.....G.....#',
    '#....#..H........#',
    '###.###.GG###..###',
    '#................#',
    '#...,,..,,,..#...#',
    '#..H,,,,,H,,,....#',
    '#...,,..,,,..##.##',
    '#...........G....#',
    '#.H.........#....#',
    '#...........#....#',
    '##################'
  ],
  classic_2: [
    '##################',
    '#H...#.....#H...H#',
    '#....G.....G.....#',
    '#....#..H........#',
    '###.###.GG###..###',
    '#....#...........#',
    '#...,,..,,,..#...#',
    '#..H,,,,,H,,,..H.#',
    '#...,,..,,,..##.##',
    '#...........G....#',
    '#.H.........#....#',
    '#...........#....#',
    '##################'
  ],
  classic_3: [
    '##################',
    '#H...#.....#H...H#',
    '#....G.....G.....#',
    '#....#..H........#',
    '###.###.GG###..###',
    '#................#',
    '######D###D###...#',
    '#..H.........#...#',
    '#......,,....#H.##',
    '#......,,...G....#',
    '#.H....,,...#....#',
    '#...........#....#',
    '##################'
  ],
  open_arena: [
    '##################',
    '#H..............H#',
    '#................#',
    '#...,,......,,...#',
    '#...,,......,,...#',
    '#................#',
    '#....G.,,,,.G....#',
    '#................#',
    '#...,,......,,...#',
    '#...,,......,,...#',
    '#................#',
    '#H..............H#',
    '##################'
  ],
  conference: [
    '##################',
    '#H..#........#..H#',
    '#...G..,,,,..G...#',
    '#......,,,,......#',
    '###.GG......GG.###',
    '#................#',
    '#...,,,,,,,,,,...#',
    '#...,,,,,,,,,,...#',
    '#................#',
    '###.GG......GG.###',
    '#................#',
    '#H..............H#',
    '##################'
  ],
  cubicle_maze: [
    '##################',
    '#H..............H#',
    '#..##...##...##..#',
    '#................#',
    '#................#',
    '#..##........##..#',
    '#.......,,.......#',
    '#.......,,.......#',
    '#..##........##..#',
    '#................#',
    '#..##...##...##..#',
    '#H..............H#',
    '##################'
  ],
  vault_floor: [
    '##################',
    '#H...#......#...H#',
    '#....#..,,,,#....#',
    '#....#..,,,,#....#',
    '##.###GGDDGG###.##',
    '#................#',
    '#...,,......,,...#',
    '#................#',
    '#................#',
    '#...,,......,,...#',
    '#................#',
    '#H..............H#',
    '##################'
  ]
}

export const CAMPAIGN_LEVELS = {
  // ==================== 第1章：潜行摸鱼篇 (Lv1 ~ Lv3) ====================
  1: {
    level: 1,
    id: 1,
    chapter: 1,
    mode: 'stealth',
    modeBadge: '潜行摸鱼',
    sceneTheme: 'full_office',
    sceneName: '全公司综合办公区全景',
    title: '卡点打卡',
    name: '第1关 · 卡点打卡',
    subtitle: '新手轻松潜入！趁王总转身去刷【⏰考勤机】，再溜回右上【💻7号工位】！',
    story: '08:59:00！只有画饼王总一个人在大厅晃悠抓迟到（本关无监控！）。直接贴着推车去打卡，或者按茶水间微波炉把他引开！',
    deadline: 9 * 3600,
    timeLimit: 75,
    parTime: 35,
    cartonUses: 3,
    layout: 'classic',
    template: LAYOUT_TEMPLATES.classic,
    hasCart: true,
    playerSpawn: { col: 2, row: 11 },
    playerStart: { col: 2, row: 11 },
    hints: [
      '第一关无监控！只需留意王总1个人的黄色视线扇区即可。',
      '去左上茶水间按【🔥微波炉】，2秒后炸炉会把王总彻底引开！',
      '刷完【⏰考勤机】后，顺着走廊溜进右上角【💻7号工位】即可过关！'
    ],
    objectives: [
      { id: 'clock_in', text: '前往大厅刷【⏰人脸识别考勤机】' },
      { id: 'workstation', text: '溜进右上【💻7号牛马工位】假装开工' }
    ],
    movingCart: { col: 4, row: 6, minCol: 3, maxCol: 12, dir: 1, speed: 54 },
    guards: [
      {
        id: 'boss',
        name: '画饼王总',
        role: 'boss',
        start: { col: 9, row: 6 },
        speed: 62,
        chaseSpeed: 122,
        fovDeg: 54,
        viewDist: 168,
        thought: '今天谁敢迟到？让我慢慢巡视看看...',
        waypoints: [
          { col: 9, row: 6, wait: 1.8 },
          { col: 11, row: 7, wait: 1.5 },
          { col: 6, row: 6, wait: 1.6 },
          { col: 7, row: 9, wait: 1.6 }
        ]
      }
    ],
    snitches: [
      { id: 'snitch_1', name: '低头干活小李', col: 13, row: 2, angles: [0, 0], period: 4.0, fovDeg: 34, viewDist: 86 }
    ],
    cameras: [],
    pickups: [
      { id: 'pk_soap_1', type: 'soap', col: 4, row: 1 },
      { id: 'pk_coffee_1', type: 'coffee', col: 1, row: 3 },
      { id: 'pk_frog_1', type: 'frog', col: 6, row: 10 }
    ],
    chairs: [
      { id: 'chair_1', col: 12, row: 5 },
      { id: 'chair_2', col: 5, row: 8 }
    ],
    objects: [
      { id: 'microwave', type: 'microwave', name: '茶水间微波炉', icon: '🔥', col: 2, row: 1, cooldown: 0, timer: 0 },
      { id: 'clock_in', type: 'clock_in', name: '人脸识别考勤机', icon: '⏰', col: 9, row: 5, done: false },
      { id: 'workstation', type: 'workstation', name: '7号牛马工位', icon: '💻', col: 15, row: 2, done: false },
      { id: 'phone_1', type: 'phone', name: '前台内线电话', icon: '☎️', col: 5, row: 10, cooldown: 0 },
      { id: 'thermos', type: 'thermos', name: '王总枸杞保温壶', icon: '🫖', col: 8, row: 2, spiked: false }
    ],
    modeConfig: {
      requireClockIn: true,
      requireWorkstation: true
    }
  },

  2: {
    level: 2,
    id: 2,
    chapter: 1,
    mode: 'stealth',
    modeBadge: '潜行摸鱼',
    sceneTheme: 'full_office',
    sceneName: '全公司综合办公区全景',
    title: '螺蛳粉刺客',
    name: '第2关 · 螺蛳粉刺客',
    subtitle: '首次出现1个监控！避开王总与摄像头拿【🍜螺蛳粉】，开【🌀排风扇】带回工位！',
    story: '你的加臭螺蛳粉到前台了！注意走廊新装了 1 台紫色监控探头，全场只有王总 1 人巡逻，打开排风扇散味就能轻松带回工位！',
    deadline: 13 * 3600,
    timeLimit: 75,
    parTime: 36,
    cartonUses: 3,
    layout: 'classic',
    template: LAYOUT_TEMPLATES.classic_2,
    hasCart: false,
    playerSpawn: { col: 14, row: 2 },
    playerStart: { col: 14, row: 2 },
    hints: [
      '本关只有 1 个老板 + 1 台监控探头（紫色扇区），等监控转开再通过！',
      '拿到螺蛳粉后会冒气味圈，顺手按旁边的【🌀前台排风扇开关】即可消除气味12秒！',
      '随时可套上【📦纸箱】静止隐身，安全溜回右上【💻7号工位】开炫！'
    ],
    objectives: [
      { id: 'takeout', text: '去左下前台取走【🍜豪华螺蛳粉外卖】' },
      { id: 'workstation', text: '开排风扇压住气味，溜回【💻7号工位】开吃' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '画饼王总',
        role: 'boss',
        start: { col: 8, row: 6 },
        speed: 66,
        chaseSpeed: 126,
        fovDeg: 60,
        viewDist: 155,
        thought: '哪来的螺蛳粉味？让我慢慢找找看...',
        waypoints: [
          { col: 8, row: 6, wait: 1.6 },
          { col: 8, row: 2, wait: 1.6 },
          { col: 11, row: 5, wait: 1.4 },
          { col: 6, row: 9, wait: 1.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [
      { id: 'cam_2a', col: 10, row: 4, baseAngle: Math.PI * 0.5, sweep: 0.65, speed: 0.72, fovDeg: 44, viewDist: 140 }
    ],
    pickups: [
      { id: 'pk_soap_2', type: 'soap', col: 15, row: 10 },
      { id: 'pk_frog_2', type: 'frog', col: 12, row: 3 },
      { id: 'pk_coffee_2', type: 'coffee', col: 3, row: 2 }
    ],
    chairs: [
      { id: 'chair_2a', col: 13, row: 5 },
      { id: 'chair_2b', col: 6, row: 7 }
    ],
    objects: [
      { id: 'takeout', type: 'takeout', name: '豪华螺蛳粉外卖', icon: '🍜', col: 2, row: 11, done: false },
      { id: 'fan_switch', type: 'fan_switch', name: '前台排风扇开关', icon: '🌀', col: 2, row: 9, cooldown: 0 },
      { id: 'workstation', type: 'workstation', name: '7号牛马工位', icon: '💻', col: 15, row: 2, done: false },
      { id: 'microwave', type: 'microwave', name: '茶水间微波炉', icon: '🔥', col: 2, row: 1, cooldown: 0, timer: 0 }
    ],
    modeConfig: {
      requireTakeout: true,
      odorRadius: 125
    }
  },

  3: {
    level: 3,
    id: 3,
    chapter: 1,
    mode: 'stealth',
    modeBadge: '潜行摸鱼',
    sceneTheme: 'full_office',
    sceneName: '全公司综合办公区全景',
    title: '高管厕所占坑王',
    name: '第3关 · 高管厕所占坑王',
    subtitle: '顺走总裁室【💳门禁卡】（或给王总下药）破开闸机冲进【🛗电梯】！',
    story: '王总锁死了下班感应闸机！去总裁室顺走他的高管门禁卡（或者去茶水间拿泻药放进他保温杯），打开闸门潇洒下班！',
    deadline: 18 * 3600 + 45,
    timeLimit: 80,
    parTime: 38,
    cartonUses: 1,
    layout: 'classic',
    template: LAYOUT_TEMPLATES.classic_3,
    hasCart: false,
    playerSpawn: { col: 14, row: 2 },
    playerStart: { col: 14, row: 2 },
    hints: [
      '直接去上方的王总办公室拿【💳高管门禁卡】即可自动打开全部红色闸机！',
      '或者去左上茶水间捡【🌶️泻药】投进王总【🫖枸杞壶】，王总会捂肚子冲向厕所并爆出门禁卡！',
      '保安在下半区慢慢巡逻，踢飞【🪑旋转椅】撞晕他即可直冲左下【🛗电梯】！'
    ],
    objectives: [
      { id: 'keycard', text: '顺走【💳高管门禁卡】或下药逼王总交出权限' },
      { id: 'elevator_exit', text: '穿过已解锁闸机冲进左下【🛗准点下班电梯】' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '画饼王总',
        role: 'boss',
        start: { col: 8, row: 3 },
        speed: 70,
        chaseSpeed: 132,
        fovDeg: 62,
        viewDist: 160,
        thought: '高管智能马桶和下班闸机都归我管！',
        waypoints: [
          { col: 8, row: 3, wait: 1.6 },
          { col: 9, row: 1, wait: 1.5 },
          { col: 8, row: 5, wait: 1.3 },
          { col: 12, row: 5, wait: 1.5 }
        ]
      },
      {
        id: 'guard',
        name: '保安大叔',
        role: 'guard',
        start: { col: 3, row: 8 },
        speed: 66,
        chaseSpeed: 126,
        fovDeg: 58,
        viewDist: 150,
        thought: '闸机锁死了，没门禁卡别想溜！',
        waypoints: [
          { col: 3, row: 8, wait: 1.5 },
          { col: 11, row: 8, wait: 1.5 },
          { col: 11, row: 11, wait: 1.3 },
          { col: 4, row: 11, wait: 1.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [
      { id: 'cam_3a', col: 12, row: 6, baseAngle: Math.PI * 0.75, sweep: 0.65, speed: 0.8, fovDeg: 45, viewDist: 145 }
    ],
    pickups: [
      { id: 'pk_lax_3', type: 'laxative', col: 3, row: 1 },
      { id: 'pk_soap_3', type: 'soap', col: 14, row: 8 },
      { id: 'pk_coffee_3', type: 'coffee', col: 11, row: 5 },
      { id: 'pk_frog_3', type: 'frog', col: 16, row: 5 },
      { id: 'pk_key_3', type: 'keycard', col: 9, row: 1 }
    ],
    chairs: [
      { id: 'chair_3a', col: 11, row: 3 },
      { id: 'chair_3b', col: 6, row: 7 },
      { id: 'chair_3c', col: 10, row: 10 }
    ],
    objects: [
      { id: 'thermos', type: 'thermos', name: '王总枸杞保温壶', icon: '🫖', col: 7, row: 2, spiked: false },
      { id: 'toilet', type: 'toilet', name: '高管恒温马桶坑位', icon: '🚻', col: 15, row: 10 },
      { id: 'phone_3', type: 'phone', name: '走廊内线电话', icon: '☎️', col: 5, row: 5, cooldown: 0 },
      { id: 'elevator_exit', type: 'elevator_exit', name: '准点下班电梯', icon: '🛗', col: 2, row: 11, done: false }
    ],
    modeConfig: {
      requireKeycardGate: true
    }
  },

  // ==================== 第2章：花式整蛊篇 (Lv4 ~ Lv6) ====================
  4: {
    level: 4,
    id: 4,
    chapter: 2,
    mode: 'prank_hunt',
    modeBadge: '花式整蛊',
    sceneTheme: 'boardroom',
    sceneName: '巨型高管会议室特写',
    title: '王总的假发危机',
    name: '第4关 · 王总的假发危机',
    subtitle: '聚焦【高管会议室】！启动【🌀大功率风扇】吹飞王总假发，近身【📸抓拍秃头】！',
    story: '镜头推进到高管大会议室！王总正在椭圆长桌前踱步准备发言，快打开会议室侧翼的大功率工业冷风机，把他的9块9包邮假发吹上天！',
    deadline: 10 * 3600 + 30,
    timeLimit: 75,
    parTime: 32,
    cartonUses: 2,
    layout: 'classic',
    template: LAYOUT_TEMPLATES.classic,
    hasCart: false,
    playerSpawn: { col: 2, row: 10 },
    playerStart: { col: 2, row: 10 },
    hints: [
      '本关聚焦高管会议室，只有王总 1 人！去按【🌀大功率工业风扇】吹出强风带。',
      '王总走到会议桌中央（第5~10列第6行）就会被狂风吹飞假发、原地捂头社死！',
      '趁王总秃头眩晕，跑过去按右下主按钮【📸抓拍秃头】直接通关！'
    ],
    objectives: [
      { id: 'blow_wig', text: '开【🌀大功率工业风扇】把王总的假发吹飞' },
      { id: 'snap_photo', text: '趁王总秃头眩晕，近身【📸抓拍高清社死照】' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '浓密秀发王总',
        role: 'boss',
        start: { col: 9, row: 6 },
        speed: 70,
        chaseSpeed: 130,
        fovDeg: 60,
        viewDist: 155,
        thought: '这间大会议室灯光真亮，显得我头发更浓密了！',
        waypoints: [
          { col: 10, row: 6, wait: 1.4 },
          { col: 6, row: 6, wait: 1.5 },
          { col: 8, row: 3, wait: 1.2 },
          { col: 8, row: 8, wait: 1.3 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_frog_4', type: 'frog', col: 7, row: 9 },
      { id: 'pk_soap_4', type: 'soap', col: 3, row: 3 },
      { id: 'pk_coffee_4', type: 'coffee', col: 2, row: 8 }
    ],
    chairs: [
      { id: 'chair_4a', col: 11, row: 5 },
      { id: 'chair_4b', col: 4, row: 8 }
    ],
    objects: [
      {
        id: 'fan_blower',
        type: 'fan_switch',
        subtype: 'industrial_fan',
        name: '大功率工业风扇',
        icon: '🌀',
        col: 4,
        row: 6,
        blowDir: { dx: 1, dy: 0 },
        blowCols: [5, 6, 7, 8, 9, 10],
        blowRow: 6,
        cooldown: 0
      },
      { id: 'phone_4', type: 'phone', name: '风口引诱电话', icon: '☎️', col: 8, row: 6, cooldown: 0 },
      { id: 'microwave', type: 'microwave', name: '茶歇角微波炉', icon: '🔥', col: 2, row: 1, cooldown: 0, timer: 0 }
    ],
    modeConfig: {
      subMode: 'wig_blow',
      targetPranks: 1,
      requirePhotoSnap: true,
      fanBlower: {
        objectId: 'fan_blower',
        col: 4,
        row: 6,
        dirX: 1,
        dirY: 0,
        rangePx: 250,
        activeDuration: 12.0,
        wigStunDuration: 10.0
      }
    }
  },

  5: {
    level: 5,
    id: 5,
    chapter: 2,
    mode: 'prank_hunt',
    modeBadge: '花式整蛊',
    sceneTheme: 'pantry_lounge',
    sceneName: '阳光茶水咖啡厅特写',
    title: '人体保龄球滑铁卢',
    name: '第5关 · 人体保龄球滑铁卢',
    subtitle: '聚焦【阳光茶水咖啡厅】！用【🧼肥皂水】与【🪑吧台转椅】击倒高管 3 次！',
    story: '镜头聚焦到刚打完蜡的阳光茶水咖啡厅！王总带着两位高管正端着架子巡视，把旋转椅当保龄球踹出去，让他们体验丝滑平摔！',
    deadline: 14 * 3600,
    timeLimit: 75,
    parTime: 32,
    cartonUses: 2,
    layout: 'open_arena',
    template: LAYOUT_TEMPLATES.open_arena,
    hasCart: false,
    playerSpawn: { col: 2, row: 10 },
    playerStart: { col: 2, row: 10 },
    hints: [
      '靠近【🪑旋转办公椅】面朝高管按交互键，椅子会高速滑行撞倒整条线上的高管！',
      '捡起地上的【🧼洗洁精】涂在必经之路，高管踩中即刻滑飞撞墙！',
      '茶水厅会自动刷新洗洁精与椅子，累计击倒 3 次即刻获胜！'
    ],
    objectives: [
      { id: 'bowl_3', text: '用旋转椅冲撞或肥皂水滑倒高管累计 3 次 (0/3)' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '画饼王总',
        role: 'boss',
        start: { col: 8, row: 3 },
        speed: 66,
        chaseSpeed: 125,
        fovDeg: 50,
        viewDist: 125,
        thought: '茶水厅这花砖擦得真亮，走路都带风！',
        waypoints: [
          { col: 4, row: 3, wait: 1.2 },
          { col: 13, row: 3, wait: 1.2 },
          { col: 13, row: 8, wait: 1.2 },
          { col: 4, row: 8, wait: 1.2 }
        ]
      },
      {
        id: 'hr',
        name: '考勤老张',
        role: 'hr',
        start: { col: 13, row: 5 },
        speed: 62,
        chaseSpeed: 120,
        fovDeg: 46,
        viewDist: 115,
        thought: '谁在茶水间喝咖啡超过5分钟了？',
        waypoints: [
          { col: 14, row: 5, wait: 1.2 },
          { col: 3, row: 5, wait: 1.2 },
          { col: 8, row: 9, wait: 1.2 }
        ]
      },
      {
        id: 'pm_lead',
        name: '甩锅李总监',
        role: 'guard',
        start: { col: 6, row: 9 },
        speed: 60,
        chaseSpeed: 118,
        fovDeg: 45,
        viewDist: 115,
        thought: '来杯手冲冰美式提提神！',
        waypoints: [
          { col: 3, row: 9, wait: 1.2 },
          { col: 14, row: 9, wait: 1.2 },
          { col: 9, row: 4, wait: 1.2 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_soap_5a', type: 'soap', col: 2, row: 5 },
      { id: 'pk_soap_5b', type: 'soap', col: 15, row: 5 },
      { id: 'pk_soap_5c', type: 'soap', col: 8, row: 10 },
      { id: 'pk_coffee_5', type: 'coffee', col: 2, row: 2 }
    ],
    chairs: [
      { id: 'chair_5a', col: 4, row: 6 },
      { id: 'chair_5b', col: 8, row: 6 },
      { id: 'chair_5c', col: 13, row: 6 },
      { id: 'chair_5d', col: 6, row: 10 },
      { id: 'chair_5e', col: 11, row: 2 }
    ],
    objects: [
      { id: 'phone_5', type: 'phone', name: '吧台聚怪呼叫铃', icon: '☎️', col: 8, row: 5, cooldown: 0 }
    ],
    modeConfig: {
      subMode: 'bowling_blitz',
      targetPranks: 3,
      respawnSoap: true,
      respawnSoapInterval: 5.0
    }
  },

  6: {
    level: 6,
    id: 6,
    chapter: 2,
    mode: 'prank_hunt',
    modeBadge: '花式整蛊',
    sceneTheme: 'boardroom',
    sceneName: '全员大会演讲厅特写',
    title: '演讲台暗黑特调',
    name: '第6关 · 演讲台暗黑特调',
    subtitle: '聚焦【全员大会演讲厅】！集齐 3 种暗黑配料塞进演讲保温杯，看王总当场崩盘！',
    story: '全员大会演讲厅内，王总准备在主舞台脱稿画饼3小时！收集会场三角的【辣椒素+冰美式+泻药】兑进他的演讲保温杯，终结这场折磨！',
    deadline: 15 * 3600 + 30,
    timeLimit: 80,
    parTime: 36,
    cartonUses: 2,
    layout: 'conference',
    template: LAYOUT_TEMPLATES.conference,
    hasCart: false,
    playerSpawn: { col: 8, row: 11 },
    playerStart: { col: 8, row: 11 },
    hints: [
      '分别前往演讲厅左上、右上与左下角拾取 3 种特调配料！',
      '靠近上方主舞台中央【🫖王总演讲保温杯】投入全部配料完成暗黑料理。',
      '按响讲台旁的【☎️催喝水铃】或等王总回讲台喝水，一秒触发百米冲刺奔厕！'
    ],
    objectives: [
      { id: 'collect_3', text: '收集辣椒素、浓缩冰美式、强效泻药 (0/3)' },
      { id: 'spike_podium', text: '潜上主舞台注入【🫖王总演讲保温杯】引爆全场' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '演讲狂魔王总',
        role: 'boss',
        start: { col: 8, row: 3 },
        speed: 70,
        chaseSpeed: 130,
        fovDeg: 62,
        viewDist: 155,
        thought: '今天在大会议厅简单讲两句，也就三个半小时吧！',
        waypoints: [
          { col: 8, row: 2, wait: 1.6 },
          { col: 6, row: 6, wait: 1.4 },
          { col: 11, row: 6, wait: 1.4 },
          { col: 9, row: 3, wait: 1.4 }
        ]
      }
    ],
    snitches: [],
    cameras: [
      { id: 'cam_6a', col: 6, row: 4, baseAngle: Math.PI * 0.5, sweep: 0.6, speed: 0.75, fovDeg: 44, viewDist: 140 }
    ],
    pickups: [
      { id: 'ing_chili', type: 'chili', name: '魔鬼辣椒素', icon: '🌶️', col: 2, row: 1 },
      { id: 'ing_americano', type: 'iced_americano', name: '隔夜冰美式', icon: '☕', col: 15, row: 1 },
      { id: 'ing_laxative', type: 'laxative', name: '强效泻药', icon: '💊', col: 2, row: 10 },
      { id: 'pk_soap_6', type: 'soap', col: 15, row: 10 },
      { id: 'pk_frog_6', type: 'frog', col: 8, row: 8 }
    ],
    chairs: [
      { id: 'chair_6a', col: 5, row: 5 },
      { id: 'chair_6b', col: 12, row: 5 }
    ],
    objects: [
      { id: 'podium_thermos', type: 'thermos', name: '王总演讲保温杯', icon: '🫖', col: 8, row: 2, spiked: false, ingredientsAdded: 0, requiredCount: 3 },
      { id: 'phone_6', type: 'phone', name: '讲台催喝水铃', icon: '☎️', col: 10, row: 2, cooldown: 0 },
      { id: 'toilet', type: 'toilet', name: '贵宾应急卫生间', icon: '🚻', col: 16, row: 11 }
    ],
    modeConfig: {
      subMode: 'dark_brew',
      requiredIngredients: ['chili', 'iced_americano', 'laxative'],
      targetIngredients: 3,
      podiumThermosId: 'podium_thermos'
    }
  },

  // ==================== 第3章：正面硬刚·物理狂欢篇 (Lv7 ~ Lv9) ====================
  7: {
    level: 7,
    id: 7,
    chapter: 3,
    mode: 'chair_derby',
    modeBadge: '飙椅拆家',
    sceneTheme: 'pantry_lounge',
    sceneName: '茶水休息室飙椅赛场',
    title: '工位秋名山：飙椅拆加班',
    name: '第7关 · 工位秋名山：飙椅拆加班',
    subtitle: '不用躲了！骑上氮气改装转椅漂移冲撞，粉碎全场 8 堆【📚周末加班合同山】！',
    story: '周五晚王总居然搬来8座比人还高的《自愿无偿加班承诺书》堆在茶水休息厅！改装好灭火器氮气办公椅，今晚我就是秋名山车神！',
    deadline: 18 * 3600 + 30,
    timeLimit: 65,
    parTime: 28,
    cartonUses: 0,
    layout: 'open_arena',
    template: LAYOUT_TEMPLATES.open_arena,
    hasCart: false,
    playerSpawn: { col: 8, row: 6 },
    playerStart: { col: 8, row: 6 },
    hints: [
      '本关全程骑乘氮气椅且不会被抓死！撞上合同山直接粉碎解压！',
      '按下【🚀氮气冲撞】喷射蓝火极速狂飙，正面把拦路的保安和王总直接撞飞！',
      '吃地上的【☕冰美式】可立即刷新氮气冷却并提升漂移极速！'
    ],
    objectives: [
      { id: 'smash_contracts', text: '飙椅撞碎全部 8 堆《周末加班合同山》 (0/8)' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '拦路王总',
        role: 'boss',
        start: { col: 8, row: 2 },
        speed: 108,
        chaseSpeed: 145,
        fovDeg: 90,
        viewDist: 240,
        thought: '快停下！！那都是下季度的福报合同啊！',
        waypoints: [
          { col: 4, row: 3, wait: 0.4 },
          { col: 13, row: 3, wait: 0.4 },
          { col: 13, row: 9, wait: 0.4 },
          { col: 4, row: 9, wait: 0.4 }
        ]
      },
      {
        id: 'guard_7a',
        name: '护纸保安阿强',
        role: 'guard',
        start: { col: 3, row: 6 },
        speed: 96,
        chaseSpeed: 135,
        fovDeg: 80,
        viewDist: 200,
        thought: '谁在走廊飙转椅？！超速啦！',
        waypoints: [
          { col: 3, row: 2, wait: 0.5 },
          { col: 3, row: 10, wait: 0.5 }
        ]
      },
      {
        id: 'guard_7b',
        name: '护纸保安阿壮',
        role: 'guard',
        start: { col: 14, row: 6 },
        speed: 96,
        chaseSpeed: 135,
        fovDeg: 80,
        viewDist: 200,
        thought: '拦住那辆喷火的人体工学椅！',
        waypoints: [
          { col: 14, row: 10, wait: 0.5 },
          { col: 14, row: 2, wait: 0.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_7a', type: 'coffee', col: 8, row: 4 },
      { id: 'pk_coffee_7b', type: 'coffee', col: 8, row: 8 }
    ],
    chairs: [],
    objects: [
      { id: 'cp_1', type: 'contract_pile', name: '加班合同山#1', icon: '📚', col: 3, row: 2, hp: 1, smashed: false },
      { id: 'cp_2', type: 'contract_pile', name: '加班合同山#2', icon: '📚', col: 8, row: 2, hp: 1, smashed: false },
      { id: 'cp_3', type: 'contract_pile', name: '加班合同山#3', icon: '📚', col: 14, row: 2, hp: 1, smashed: false },
      { id: 'cp_4', type: 'contract_pile', name: '加班合同山#4', icon: '📚', col: 2, row: 6, hp: 1, smashed: false },
      { id: 'cp_5', type: 'contract_pile', name: '加班合同山#5', icon: '📚', col: 15, row: 6, hp: 1, smashed: false },
      { id: 'cp_6', type: 'contract_pile', name: '加班合同山#6', icon: '📚', col: 3, row: 10, hp: 1, smashed: false },
      { id: 'cp_7', type: 'contract_pile', name: '加班合同山#7', icon: '📚', col: 8, row: 10, hp: 1, smashed: false },
      { id: 'cp_8', type: 'contract_pile', name: '加班合同山#8', icon: '📚', col: 14, row: 10, hp: 1, smashed: false }
    ],
    modeConfig: {
      ridingChair: true,
      targetType: 'contract_pile',
      targetCount: 8,
      baseChairSpeed: 195,
      nitroBoostSpeed: 330,
      nitroDuration: 1.35,
      nitroCooldown: 2.2,
      driftFriction: 0.92,
      bossBumpPenaltySec: 1.5
    }
  },

  8: {
    level: 8,
    id: 8,
    chapter: 3,
    mode: 'chair_derby',
    modeBadge: '飙椅拆家',
    sceneTheme: 'boardroom',
    sceneName: '狼性洗脑大会议厅特写',
    title: '砸烂洗脑投影仪',
    name: '第8关 · 砸烂洗脑投影仪',
    subtitle: '聚焦【洗脑大会议厅】！飙椅氮气冲锋撞碎会场 3 台巨型【📽️画饼投影仪】！',
    story: '大会议厅三台8K巨幕投影仪正在循环播放《感恩降薪·把公司当家》！开启氮气飙椅破拆隔断，把洗脑设备彻底干碎！',
    deadline: 19 * 3600,
    timeLimit: 65,
    parTime: 26,
    cartonUses: 0,
    layout: 'conference',
    template: LAYOUT_TEMPLATES.conference,
    hasCart: true,
    playerSpawn: { col: 8, row: 10 },
    playerStart: { col: 8, row: 10 },
    hints: [
      '开启【🚀氮气冲撞】高速撞击巨型投影仪，一台一下爽快爆机！',
      '会场两侧和主舞台各有一台【📽️画饼投影仪】，穿过中庭开口直捣黄龙！',
      '顺路撞碎场上的加班资料堆还能额外增加公司战损分！'
    ],
    objectives: [
      { id: 'smash_projectors', text: '氮气冲撞砸毁 3 台《洗脑画饼投影仪》 (0/3)' }
    ],
    movingCart: { col: 6, row: 5, minCol: 2, maxCol: 15, dir: 1, speed: 75 },
    guards: [
      {
        id: 'boss',
        name: '洗脑大师王总',
        role: 'boss',
        start: { col: 8, row: 3 },
        speed: 110,
        chaseSpeed: 150,
        fovDeg: 85,
        viewDist: 230,
        thought: '护住投影仪！我的百亿大饼PPT还在里面！',
        waypoints: [
          { col: 7, row: 3, wait: 0.5 },
          { col: 10, row: 3, wait: 0.5 },
          { col: 8, row: 6, wait: 0.5 }
        ]
      },
      {
        id: 'hr',
        name: '打了鸡血的HR',
        role: 'hr',
        start: { col: 4, row: 6 },
        speed: 100,
        chaseSpeed: 140,
        fovDeg: 75,
        viewDist: 195,
        thought: '不许破坏企业文化宣讲！',
        waypoints: [
          { col: 3, row: 6, wait: 0.5 },
          { col: 14, row: 6, wait: 0.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_8a', type: 'coffee', col: 3, row: 10 },
      { id: 'pk_coffee_8b', type: 'coffee', col: 14, row: 10 }
    ],
    chairs: [
      { id: 'chair_8a', col: 6, row: 8 },
      { id: 'chair_8b', col: 11, row: 8 }
    ],
    objects: [
      { id: 'proj_main', type: 'projector', name: '主舞台8K画饼投影仪', icon: '📽️', col: 8, row: 2, hp: 1, smashed: false },
      { id: 'proj_left', type: 'projector', name: '左翼感恩洗脑投影仪', icon: '📽️', col: 2, row: 6, hp: 1, smashed: false },
      { id: 'proj_right', type: 'projector', name: '右翼狼性打鸡血投影仪', icon: '📽️', col: 15, row: 6, hp: 1, smashed: false },
      { id: 'cp_8a', type: 'contract_pile', name: '洗脑语录宣传册堆', icon: '📚', col: 6, row: 6, hp: 1, smashed: false },
      { id: 'cp_8b', type: 'contract_pile', name: '福报心得体会山', icon: '📚', col: 11, row: 6, hp: 1, smashed: false }
    ],
    modeConfig: {
      ridingChair: true,
      targetType: 'projector',
      targetCount: 3,
      smashGlassAllowed: true,
      baseChairSpeed: 200,
      nitroBoostSpeed: 340,
      nitroDuration: 1.4,
      nitroCooldown: 2.1,
      bossBumpPenaltySec: 1.5
    }
  },

  9: {
    level: 9,
    id: 9,
    chapter: 3,
    mode: 'pot_pong',
    modeBadge: '甩锅反杀',
    sceneTheme: 'boardroom',
    sceneName: '董事局圆桌会议厅特写',
    title: '甩锅乒乓大战',
    name: '第9关 · 甩锅乒乓大战',
    subtitle: '聚焦【董事会议厅】！挥平底锅把飞来的【💣大黑锅】精准反弹砸回王总脸上（5格血）！',
    story: '复盘会议室里，王总和李主管排成一排隔着长桌疯狂朝你甩黑锅！亮出平底锅，谁甩的锅谁自己背！',
    deadline: 19 * 3600 + 30,
    timeLimit: 70,
    parTime: 32,
    cartonUses: 0,
    layout: 'open_arena',
    template: LAYOUT_TEMPLATES.open_arena,
    hasCart: false,
    playerSpawn: { col: 8, row: 10 },
    playerStart: { col: 8, row: 10 },
    hints: [
      '看准飞来的黑色铁锅【💣黑锅】，在靠近瞬间按主按钮【🍳挥锅反拍】！',
      '成功反拍的黑锅会化作金色暴击流星直轰王总，命中5次直接打空王总血条！',
      '辅助键可触发快速横移闪身，喝【☕冰美式】提升走位接锅容错率！'
    ],
    objectives: [
      { id: 'defeat_pot_boss', text: '挥锅反弹黑锅轰空王总 5 点血条 (5/5 HP)' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '甩锅宗师王总',
        role: 'boss',
        start: { col: 8, row: 2 },
        speed: 118,
        chaseSpeed: 130,
        fovDeg: 120,
        viewDist: 360,
        thought: '这口线上崩盘的大黑锅，必须扣你头上！看锅！',
        waypoints: [
          { col: 3, row: 2, wait: 0.35 },
          { col: 14, row: 2, wait: 0.35 },
          { col: 8, row: 3, wait: 0.35 }
        ]
      },
      {
        id: 'pot_helper',
        name: '背刺李主管',
        role: 'hr',
        start: { col: 13, row: 3 },
        speed: 104,
        chaseSpeed: 120,
        fovDeg: 110,
        viewDist: 340,
        thought: '明明是我乱改的代码，锅全甩给你！',
        waypoints: [
          { col: 14, row: 3, wait: 0.5 },
          { col: 4, row: 3, wait: 0.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_9a', type: 'coffee', col: 3, row: 9 },
      { id: 'pk_coffee_9b', type: 'coffee', col: 14, row: 9 }
    ],
    chairs: [],
    objects: [],
    modeConfig: {
      bossMaxHp: 5,
      projectileType: 'black_pot',
      fireInterval: 1.35,
      helperFireInterval: 2.4,
      potSpeed: 195,
      reflectSpeedMultiplier: 1.7,
      swingRadius: 64,
      swingDuration: 0.28,
      swingCooldown: 0.32,
      playerStunOnHit: 0.65,
      timePenaltyOnHit: 2.0
    }
  },

  // ==================== 第4章：脑洞反转篇 (Lv10 ~ Lv12) ====================
  10: {
    level: 10,
    id: 10,
    chapter: 4,
    mode: 'wake_coworkers',
    modeBadge: '拍醒队友',
    sceneTheme: 'cubicle_lab',
    sceneName: '研发部大平层工位区特写',
    title: '全员摸鱼大救援',
    name: '第10关 · 全员摸鱼大救援',
    subtitle: '聚焦【研发大平层】！在王总抓包前拍醒全场 6 名打瞌睡同事切回Excel，撑过 45 秒！',
    story: '下午两点半研发部大平层困意来袭，6个怨种同事全在工位趴桌流口水！王总已经在过道巡视，作为中国好队友快去拍醒他们！',
    deadline: 14 * 3600 + 30,
    timeLimit: 45,
    parTime: 45,
    cartonUses: 0,
    layout: 'cubicle_maze',
    template: LAYOUT_TEMPLATES.cubicle_maze,
    hasCart: false,
    playerSpawn: { col: 8, row: 6 },
    playerStart: { col: 8, row: 6 },
    hints: [
      '王总本关不抓走路的你，专抓瞌睡值满100%冒大鼻涕泡的摸鱼同事！',
      '盯紧谁头顶变红冒【zzZ】，冲过去按【👋拍醒切屏】秒切绿色Excel报表！',
      '一旦超过2名同事被抓现行就会触发团灭裁员，撑满45秒全员存活即胜！'
    ],
    objectives: [
      { id: 'save_team', text: '拍醒打瞌睡同事切回Excel，守护部门撑过 45 秒' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '查岗阎罗王总',
        role: 'boss',
        start: { col: 2, row: 4 },
        speed: 104,
        chaseSpeed: 135,
        fovDeg: 85,
        viewDist: 210,
        thought: '让我看看下午谁在工位带薪打呼噜！',
        waypoints: [
          { col: 2, row: 3, wait: 0.6 },
          { col: 15, row: 3, wait: 0.6 },
          { col: 15, row: 9, wait: 0.6 },
          { col: 2, row: 9, wait: 0.6 },
          { col: 8, row: 6, wait: 0.5 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_10a', type: 'coffee', col: 8, row: 4 },
      { id: 'pk_coffee_10b', type: 'coffee', col: 8, row: 9 },
      { id: 'pk_soap_10', type: 'soap', col: 11, row: 6 }
    ],
    chairs: [
      { id: 'chair_10a', col: 6, row: 6 },
      { id: 'chair_10b', col: 10, row: 6 }
    ],
    objects: [],
    modeConfig: {
      surviveDuration: 45,
      maxCaughtAllowed: 2,
      bossIgnoresPlayer: true,
      sleepRateMin: 14,
      sleepRateMax: 24,
      wakeInteractRadius: 58,
      coworkers: [
        { id: 'cw_1', name: '前端阿伟', col: 2, row: 2, slackingType: '趴桌流口水' },
        { id: 'cw_2', name: 'UI小美', col: 6, row: 2, slackingType: '偷刷猫咪视频' },
        { id: 'cw_3', name: '测试老哥', col: 15, row: 2, slackingType: '横屏打排位' },
        { id: 'cw_4', name: '后端老王', col: 2, row: 8, slackingType: '仰头打呼噜' },
        { id: 'cw_5', name: '运营圆圆', col: 15, row: 8, slackingType: '直播间抢鸡蛋' },
        { id: 'cw_6', name: '实习生小陈', col: 6, row: 10, slackingType: '梦游敲乱码' }
      ]
    }
  },

  11: {
    level: 11,
    id: 11,
    chapter: 4,
    mode: 'be_the_boss',
    modeBadge: '我当王总',
    sceneTheme: 'cubicle_lab',
    sceneName: '研发部大平层工位区特写',
    title: '反客为主：今天我当王总！',
    name: '第11关 · 反客为主：今天我当王总！',
    subtitle: '身份大反转！化身手持大喇叭的王总，在研发大平层掀翻掩体揪出 7 名摸鱼员工！',
    story: '风水轮流转！今天你穿上了王总的金边西装、拿起红色扩音大喇叭！怎么研发工位空无一人？原来全躲进纸箱、绿植和桌底摸鱼去了！',
    deadline: 16 * 3600,
    timeLimit: 65,
    parTime: 32,
    cartonUses: 0,
    layout: 'cubicle_maze',
    template: LAYOUT_TEMPLATES.cubicle_maze,
    hasCart: false,
    playerSpawn: { col: 8, row: 6 },
    playerStart: { col: 8, row: 6 },
    hints: [
      '今天你就是王总，全场横着走没人敢抓你！移速自带霸总加成！',
      '仔细观察微微发抖、冒小眼睛的可疑纸箱、发财树、桌底和隔间！',
      '靠近可疑掩体按下【📣大喇叭揪人】，抓齐全部 7 名奇葩摸鱼怪立刻过关！'
    ],
    objectives: [
      { id: 'catch_slackers', text: '用大喇叭从掩体中揪出 7 名奇葩摸鱼怪 (0/7)' }
    ],
    movingCart: null,
    guards: [],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_11a', type: 'coffee', col: 5, row: 6 },
      { id: 'pk_coffee_11b', type: 'coffee', col: 12, row: 6 }
    ],
    chairs: [],
    objects: [],
    modeConfig: {
      playerRole: 'boss',
      playerSpeedMultiplier: 1.25,
      targetSlackers: 7,
      hornRadius: 60,
      hidingSpots: [
        { id: 'hs_1', kind: 'plant', name: '狂抖的发财树', col: 1, row: 1, hasSlacker: true, slackerName: '抱树补觉的小李' },
        { id: 'hs_2', kind: 'plant', name: '安静的琴叶榕', col: 16, row: 1, hasSlacker: false, slackerName: '' },
        { id: 'hs_3', kind: 'under_desk', name: '塞满零食的桌底', col: 2, row: 3, hasSlacker: true, slackerName: '桌底炫薯片的阿伟' },
        { id: 'hs_4', kind: 'carton', name: '印着特惠的快递箱', col: 7, row: 3, hasSlacker: true, slackerName: '纸箱潜行老玩家' },
        { id: 'hs_5', kind: 'under_desk', name: '整齐的工位桌底', col: 11, row: 3, hasSlacker: false, slackerName: '' },
        { id: 'hs_6', kind: 'carton', name: '传出吃鸡声的纸箱', col: 15, row: 3, hasSlacker: true, slackerName: '决赛圈伏地魔阿强' },
        { id: 'hs_7', kind: 'carton', name: '空空如也的打印纸箱', col: 2, row: 6, hasSlacker: false, slackerName: '' },
        { id: 'hs_8', kind: 'plant', name: '冒热气的绿萝丛', col: 15, row: 6, hasSlacker: true, slackerName: '偷嗦泡面的圆圆' },
        { id: 'hs_9', kind: 'stall', name: '反锁的摸鱼隔间', col: 2, row: 9, hasSlacker: true, slackerName: '带薪蹲坑40分钟老王' },
        { id: 'hs_10', kind: 'under_desk', name: '堆满旧报表的桌底', col: 7, row: 9, hasSlacker: false, slackerName: '' },
        { id: 'hs_11', kind: 'carton', name: '漏出耳机线的纸箱', col: 12, row: 9, hasSlacker: true, slackerName: '追大结局的HR小美' },
        { id: 'hs_12', kind: 'stall', name: '放着拖把的储物桶', col: 16, row: 11, hasSlacker: false, slackerName: '' }
      ]
    }
  },

  12: {
    level: 12,
    id: 12,
    chapter: 4,
    mode: 'desk_defense',
    modeBadge: '下班塔防',
    sceneTheme: 'cubicle_lab',
    sceneName: '核心工位岛防线特写',
    title: '17:59 下班保卫战',
    name: '第12关 · 17:59 下班保卫战',
    subtitle: '聚焦【核心工位岛】！距18:00下班最后 45 秒，用键盘拍击与转椅击退需求怪！',
    story: '17:59:15！背包拉链都拉好了，产品经理、催周报HR和甲方爸爸突然从四面八方扑向你的核心工位塞需求！守住工位撑到18:00！',
    deadline: 18 * 3600,
    timeLimit: 45,
    parTime: 45,
    cartonUses: 0,
    layout: 'cubicle_maze',
    template: LAYOUT_TEMPLATES.cubicle_maze,
    hasCart: false,
    playerSpawn: { col: 8, row: 7 },
    playerStart: { col: 8, row: 7 },
    hints: [
      '绝不能让举着『改18版』牌子的需求怪碰到中央【💻我的黄金工位】！',
      '靠近敌人按主按钮【⌨️键盘拍飞】可直接击退，踢【🪑旋转椅】能保龄球式清掉一整排！',
      '捡地上刷新的【☕冰美式】或【🧼洗洁精】铺在工位四周形成减速滑倒防线！'
    ],
    objectives: [
      { id: 'defend_desk', text: '死守中央下班工位不被塞满需求，撑满 45 秒！' }
    ],
    movingCart: null,
    guards: [],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_soap_12a', type: 'soap', col: 6, row: 6 },
      { id: 'pk_soap_12b', type: 'soap', col: 11, row: 6 },
      { id: 'pk_coffee_12a', type: 'coffee', col: 8, row: 4 },
      { id: 'pk_coffee_12b', type: 'coffee', col: 8, row: 9 }
    ],
    chairs: [
      { id: 'chair_12a', col: 5, row: 6 },
      { id: 'chair_12b', col: 12, row: 6 },
      { id: 'chair_12c', col: 8, row: 3 },
      { id: 'chair_12d', col: 8, row: 9 }
    ],
    objects: [
      { id: 'golden_desk', type: 'workstation', subtype: 'golden_desk', name: '17:59黄金下班工位', icon: '💻', col: 8, row: 6, hp: 5, maxHp: 5 }
    ],
    modeConfig: {
      surviveDuration: 45,
      deskMaxHp: 5,
      goldenDesk: { col: 8, row: 6 },
      spawnInterval: 2.2,
      invaderSpeed: 62,
      smackRadius: 62,
      smackCooldown: 0.3,
      respawnChairInterval: 7.0,
      invaderTypes: [
        { role: 'pm', name: '提需求PM', tag: '改18版!', hp: 1, speed: 64 },
        { role: 'client', name: '夺命甲方', tag: '五彩斑斓黑!', hp: 1, speed: 56 },
        { role: 'hr', name: '催表HR', tag: '交30页复盘!', hp: 1, speed: 70 }
      ],
      spawnPoints: [
        { col: 1, row: 3 },
        { col: 16, row: 3 },
        { col: 1, row: 9 },
        { col: 16, row: 9 },
        { col: 6, row: 1 },
        { col: 11, row: 11 }
      ]
    }
  },

  // ==================== 第5章：终极掀桌篇 (Lv13 ~ Lv16) ====================
  13: {
    level: 13,
    id: 13,
    chapter: 5,
    mode: 'shredder_race',
    modeBadge: '碎纸狂飙',
    sceneTheme: 'pantry_lounge',
    sceneName: '行政茶歇与档案室特写',
    title: '碎纸机狂想曲',
    name: '第13关 · 碎纸机狂想曲',
    subtitle: '聚焦【行政档案茶歇厅】！赶在HR前抢走 6 份【📄降薪协议】塞进高速碎纸机！',
    story: '穿堂风把王总刚签好的8份《全员自愿降薪50%协议》吹散在行政茶歇厅！HR正在满地捡合同，快抱起合同统统喂进高速碎纸机！',
    deadline: 16 * 3600 + 30,
    timeLimit: 65,
    parTime: 28,
    cartonUses: 0,
    layout: 'vault_floor',
    template: LAYOUT_TEMPLATES.vault_floor,
    hasCart: false,
    playerSpawn: { col: 8, row: 8 },
    playerStart: { col: 8, row: 8 },
    hints: [
      '跑过地上的【📄降薪协议】即可自动叠抱在怀里（一次最多抱3份）！',
      '冲到场地中央或左下角的【🗑️高速碎纸机】按主按钮一键咔嚓粉碎！',
      '如果HR抢先捡走3份协议锁进右上档案柜就会失败，可踢椅子撞晕HR截胡！'
    ],
    objectives: [
      { id: 'shred_6', text: '抢夺并粉碎 6 份《全员降薪协议》 (0/6)' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'hr_runner',
        name: '抢合同HR总监',
        role: 'hr',
        start: { col: 14, row: 5 },
        speed: 96,
        chaseSpeed: 130,
        fovDeg: 72,
        viewDist: 175,
        thought: '快把降薪协议捡回档案柜锁好！',
        waypoints: [
          { col: 13, row: 6, wait: 0.5 },
          { col: 15, row: 2, wait: 0.6 },
          { col: 11, row: 10, wait: 0.5 },
          { col: 4, row: 6, wait: 0.5 }
        ]
      },
      {
        id: 'boss',
        name: '护合同王总',
        role: 'boss',
        start: { col: 5, row: 6 },
        speed: 94,
        chaseSpeed: 152,
        fovDeg: 76,
        viewDist: 185,
        thought: '谁敢动我的降本增效大计？！',
        waypoints: [
          { col: 4, row: 6, wait: 0.8 },
          { col: 12, row: 6, wait: 0.8 },
          { col: 8, row: 10, wait: 0.8 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'doc_1', type: 'paycut_contract', name: '全员降薪协议#1', icon: '📄', col: 2, row: 2 },
      { id: 'doc_2', type: 'paycut_contract', name: '全员降薪协议#2', icon: '📄', col: 4, row: 6 },
      { id: 'doc_3', type: 'paycut_contract', name: '全员降薪协议#3', icon: '📄', col: 13, row: 6 },
      { id: 'doc_4', type: 'paycut_contract', name: '全员降薪协议#4', icon: '📄', col: 2, row: 10 },
      { id: 'doc_5', type: 'paycut_contract', name: '全员降薪协议#5', icon: '📄', col: 7, row: 10 },
      { id: 'doc_6', type: 'paycut_contract', name: '全员降薪协议#6', icon: '📄', col: 11, row: 10 },
      { id: 'doc_7', type: 'paycut_contract', name: '全员降薪协议#7', icon: '📄', col: 15, row: 10 },
      { id: 'doc_8', type: 'paycut_contract', name: '全员降薪协议#8', icon: '📄', col: 15, row: 6 },
      { id: 'pk_coffee_13', type: 'coffee', col: 8, row: 5 }
    ],
    chairs: [
      { id: 'chair_13a', col: 6, row: 8 },
      { id: 'chair_13b', col: 11, row: 8 }
    ],
    objects: [
      { id: 'shredder_main', type: 'shredder', name: '中央高速碎纸机', icon: '🗑️', col: 8, row: 6 },
      { id: 'shredder_sub', type: 'shredder', name: '走廊备用碎纸机', icon: '🗑️', col: 3, row: 8 },
      { id: 'archive_cabinet', type: 'archive_cabinet', name: 'HR机密档案柜', icon: '🗄️', col: 15, row: 2 }
    ],
    modeConfig: {
      targetShredCount: 6,
      totalContracts: 8,
      maxHrStolen: 3,
      maxCarry: 3,
      archiveCabinetId: 'archive_cabinet'
    }
  },

  14: {
    level: 14,
    id: 14,
    chapter: 5,
    mode: 'vault_heist',
    modeBadge: '金库劫案',
    sceneTheme: 'ceo_suite',
    sceneName: '88楼总裁套房与私人金库特写',
    title: '年终奖大劫案',
    name: '第14关 · 年终奖大劫案',
    subtitle: '聚焦【88楼总裁套房】！将椅子推上 3 块【🟩重力板】开金库，夺回【💎年终奖宝箱】！',
    story: '十三薪和年终奖全被王总锁进了88楼豪华总裁套房的防弹金库！压住会客厅三块重力感应板打开激光电门，把血汗钱搬进电梯！',
    deadline: 19 * 3600 + 45,
    timeLimit: 70,
    parTime: 32,
    cartonUses: 1,
    layout: 'vault_floor',
    template: LAYOUT_TEMPLATES.vault_floor,
    hasCart: false,
    playerSpawn: { col: 8, row: 10 },
    playerStart: { col: 8, row: 10 },
    hints: [
      '顶层金库电门（第8、9列第4行）必须同时压住大厅 3 块【🟩绿色重力感应板】才会开启！',
      '对准附近的【🪑重型办公椅】按交互键推滑到感应板上即可锁定亮起绿灯！',
      '金库门一开立即冲进去抱走【💎百万年终奖宝箱】，直奔左下【🛗电梯】！'
    ],
    objectives: [
      { id: 'unlock_vault', text: '推椅子压住 3 块重力感应板打开金库闸门 (0/3)' },
      { id: 'steal_bonus', text: '夺取【💎年终奖宝箱】并冲进左下【🛗电梯】' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'vault_guard_1',
        name: '金库保安队长',
        role: 'guard',
        start: { col: 5, row: 5 },
        speed: 90,
        chaseSpeed: 150,
        fovDeg: 72,
        viewDist: 185,
        thought: '王总交代了，年终奖一分钱都不许流出去！',
        waypoints: [
          { col: 3, row: 5, wait: 1.0 },
          { col: 14, row: 5, wait: 1.0 },
          { col: 14, row: 9, wait: 0.9 },
          { col: 3, row: 9, wait: 0.9 }
        ]
      }
    ],
    snitches: [],
    cameras: [
      { id: 'cam_14a', col: 6, row: 5, baseAngle: Math.PI * 0.5, sweep: 0.75, speed: 1.0, fovDeg: 50, viewDist: 165 },
      { id: 'cam_14b', col: 11, row: 5, baseAngle: Math.PI * 0.5, sweep: 0.75, speed: 1.0, fovDeg: 50, viewDist: 165 }
    ],
    pickups: [
      { id: 'pk_coffee_14', type: 'coffee', col: 2, row: 6 },
      { id: 'pk_soap_14', type: 'soap', col: 15, row: 6 }
    ],
    chairs: [
      { id: 'chair_14a', col: 2, row: 7 },
      { id: 'chair_14b', col: 8, row: 5 },
      { id: 'chair_14c', col: 15, row: 7 },
      { id: 'chair_14d', col: 11, row: 10 }
    ],
    objects: [
      { id: 'pad_1', type: 'pressure_pad', name: '左翼重力感应板', icon: '🟩', col: 4, row: 7, activated: false },
      { id: 'pad_2', type: 'pressure_pad', name: '中枢重力感应板', icon: '🟩', col: 8, row: 7, activated: false },
      { id: 'pad_3', type: 'pressure_pad', name: '右翼重力感应板', icon: '🟩', col: 13, row: 7, activated: false },
      { id: 'vault_box', type: 'vault_box', name: '百万年终奖宝箱', icon: '💎', col: 8, row: 2, stolen: false },
      { id: 'elevator_exit', type: 'elevator_exit', name: '直达地下车库电梯', icon: '🛗', col: 2, row: 11, done: false }
    ],
    modeConfig: {
      requiredPads: 3,
      padSnapRadius: 34,
      gateCells: [
        { col: 8, row: 4 },
        { col: 9, row: 4 }
      ],
      vaultBoxId: 'vault_box',
      exitId: 'elevator_exit'
    }
  },

  15: {
    level: 15,
    id: 15,
    chapter: 5,
    mode: 'blackout_escape',
    modeBadge: '拉闸跑路',
    sceneTheme: 'full_office',
    sceneName: '全公司综合办公区夜景全景',
    title: '拉闸断电：准点下班',
    name: '第15关 · 拉闸断电：准点下班',
    subtitle: '全楼层全景！拉下 3 处【⚡总电闸】开启黑夜手电筒模式，借夜色冲进【🛗黄金电梯】！',
    story: '只要公司停了电，谁也没法逼我改PPT！潜往茶水间、工位区与走廊拉下三座总配电箱，让整层楼陷入伸手不见五指的快乐黑夜！',
    deadline: 20 * 3600,
    timeLimit: 70,
    parTime: 30,
    cartonUses: 2,
    layout: 'classic',
    template: LAYOUT_TEMPLATES.classic,
    hasCart: true,
    playerSpawn: { col: 8, row: 10 },
    playerStart: { col: 8, row: 10 },
    hints: [
      '依次前往左上茶水间、右上工位区与右下走廊拉下 3 个【⚡总配电闸箱】！',
      '三闸全拉瞬间触发全场大停电（监控全部瘫痪，王总视野缩成小小手电筒光圈），下班金电梯同步解锁！',
      '黑夜里扔一只【🐸发条青蛙】闪光呱呱叫，把巡逻手电筒全骗走再冲进电梯！'
    ],
    objectives: [
      { id: 'pull_switches', text: '拉下全楼层 3 处总配电闸切断电源 (0/3)' },
      { id: 'night_exit', text: '借黑夜掩护冲入左下【🛗下班黄金电梯】' }
    ],
    movingCart: { col: 5, row: 6, minCol: 3, maxCol: 12, dir: 1, speed: 62 },
    guards: [
      {
        id: 'boss',
        name: '摸黑抓人王总',
        role: 'boss',
        start: { col: 8, row: 5 },
        speed: 96,
        chaseSpeed: 162,
        fovDeg: 78,
        viewDist: 210,
        thought: '就算停电了用手电筒照，今晚也得给我把PPT肝完！',
        waypoints: [
          { col: 8, row: 5, wait: 1.0 },
          { col: 4, row: 5, wait: 0.9 },
          { col: 12, row: 5, wait: 0.9 },
          { col: 7, row: 9, wait: 1.0 }
        ]
      },
      {
        id: 'guard_15',
        name: '夜巡保安老刘',
        role: 'guard',
        start: { col: 11, row: 9 },
        speed: 88,
        chaseSpeed: 150,
        fovDeg: 70,
        viewDist: 190,
        thought: '谁在乱拉公司电闸？！',
        waypoints: [
          { col: 11, row: 9, wait: 1.0 },
          { col: 4, row: 9, wait: 1.0 },
          { col: 4, row: 11, wait: 0.8 },
          { col: 11, row: 11, wait: 0.8 }
        ]
      }
    ],
    snitches: [],
    cameras: [
      { id: 'cam_15a', col: 6, row: 5, baseAngle: Math.PI * 0.5, sweep: 0.85, speed: 1.1, fovDeg: 52, viewDist: 175 },
      { id: 'cam_15b', col: 13, row: 4, baseAngle: Math.PI * 0.5, sweep: 0.75, speed: 1.1, fovDeg: 50, viewDist: 170 }
    ],
    pickups: [
      { id: 'pk_frog_15a', type: 'frog', col: 5, row: 10 },
      { id: 'pk_coffee_15', type: 'coffee', col: 8, row: 7 },
      { id: 'pk_soap_15', type: 'soap', col: 12, row: 7 }
    ],
    chairs: [
      { id: 'chair_15a', col: 11, row: 5 },
      { id: 'chair_15b', col: 5, row: 8 }
    ],
    objects: [
      { id: 'sw_1', type: 'power_switch', name: '茶水间一号电闸', icon: '⚡', col: 2, row: 1, pulled: false },
      { id: 'sw_2', type: 'power_switch', name: '工位区二号电闸', icon: '⚡', col: 15, row: 2, pulled: false },
      { id: 'sw_3', type: 'power_switch', name: '走廊三号总电闸', icon: '⚡', col: 15, row: 10, pulled: false },
      { id: 'elevator_exit', type: 'elevator_exit', name: '下班黄金电梯', icon: '🛗', col: 2, row: 11, done: false, lockedUntilBlackout: true }
    ],
    modeConfig: {
      requiredSwitches: 3,
      startInDarkness: false,
      blackoutOnComplete: true,
      blackoutGuardViewDist: 92,
      playerFlashlightDist: 165,
      disableCamerasOnBlackout: true
    }
  },

  16: {
    level: 16,
    id: 16,
    chapter: 5,
    mode: 'final_boss',
    modeBadge: '终极掀桌',
    sceneTheme: 'ceo_suite',
    sceneName: '88楼董事长豪华顶层套房特写',
    title: '终极决战：炒掉画饼王总！',
    name: '第16关 · 终极决战：炒掉画饼王总！',
    subtitle: '聚焦【88楼董事长套房】！反弹黑锅、躲大饼弹幕、引王总撞碎纸机，拍下《炒老板鱿鱼书》！',
    story: '直捣88楼董事长豪华套房！画饼王总开启红温狂暴形态，一边发射芝麻巨型大饼弹幕一边甩黑锅冲锋！今天不是你炒我，是我把老板炒了！',
    deadline: 21 * 3600,
    timeLimit: 90,
    parTime: 42,
    cartonUses: 0,
    layout: 'vault_floor',
    template: LAYOUT_TEMPLATES.vault_floor,
    hasCart: false,
    playerSpawn: { col: 8, row: 10 },
    playerStart: { col: 8, row: 10 },
    hints: [
      '【阶段一~三综合反杀】：看准飞来的【💣黑锅】挥拍反弹轰王总，注意走位躲开金黄【🫓巨型画饼弹幕】！',
      '当王总红温暴走直线冲锋时，引诱他一头撞上两侧【🗑️高速碎纸机】或踢飞【🪑旋转椅】可重创2格血并震飞假发！',
      '打空 9 点血条后王总彻底瘫坐在地秃头反光，冲上前按下【📄拍下炒鱿鱼通知书】荣耀通关！'
    ],
    objectives: [
      { id: 'boss_hp_zero', text: '反弹黑锅 + 碎纸机/转椅连击打空王总 9 格血条' },
      { id: 'fire_the_boss', text: '上前将《炒老板鱿鱼通知书》拍在王总秃头上！' }
    ],
    movingCart: null,
    guards: [
      {
        id: 'boss',
        name: '终极红温画饼王总',
        role: 'boss',
        start: { col: 8, row: 6 },
        speed: 122,
        chaseSpeed: 235,
        fovDeg: 140,
        viewDist: 420,
        thought: '反了反了！吃我满汉全席十万吨大饼弹幕！！',
        waypoints: [
          { col: 8, row: 5, wait: 0.4 },
          { col: 4, row: 6, wait: 0.4 },
          { col: 13, row: 6, wait: 0.4 },
          { col: 8, row: 7, wait: 0.4 }
        ]
      }
    ],
    snitches: [],
    cameras: [],
    pickups: [
      { id: 'pk_coffee_16a', type: 'coffee', col: 2, row: 6 },
      { id: 'pk_coffee_16b', type: 'coffee', col: 15, row: 6 },
      { id: 'pk_soap_16a', type: 'soap', col: 6, row: 9 },
      { id: 'pk_soap_16b', type: 'soap', col: 11, row: 9 }
    ],
    chairs: [
      { id: 'chair_16a', col: 5, row: 9 },
      { id: 'chair_16b', col: 12, row: 9 },
      { id: 'chair_16c', col: 8, row: 8 }
    ],
    objects: [
      { id: 'shredder_left', type: 'shredder', name: '左翼眩晕碎纸机机关', icon: '🗑️', col: 2, row: 8 },
      { id: 'shredder_right', type: 'shredder', name: '右翼眩晕碎纸机机关', icon: '🗑️', col: 15, row: 8 }
    ],
    modeConfig: {
      bossMaxHp: 9,
      allowReflectPot: true,
      allowDash: true,
      shredderTrapDamage: 2,
      chairHitDamage: 1,
      reflectPotDamage: 1,
      finisherRequired: true,
      finisherLabel: '📄 拍下《炒鱿鱼通知书》',
      phases: [
        { phase: 1, minHp: 7, potInterval: 1.4, pieInterval: 2.6, pieSpread: 3, chargeInterval: 0 },
        { phase: 2, minHp: 4, potInterval: 1.2, pieInterval: 2.1, pieSpread: 4, chargeInterval: 5.5, chargeSpeed: 245 },
        { phase: 3, minHp: 1, potInterval: 0.95, pieInterval: 1.7, pieSpread: 5, chargeInterval: 4.2, chargeSpeed: 275 }
      ]
    }
  }
}

export function getCampaignLevel(levelNum) {
  return CAMPAIGN_LEVELS[levelNum] || CAMPAIGN_LEVELS[1]
}
