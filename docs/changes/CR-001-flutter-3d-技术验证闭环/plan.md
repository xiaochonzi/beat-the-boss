---
change: CR-001
title: Flutter 3D 技术验证闭环
status: approved
created_at: 2026-08-27
---

# Flutter 3D 技术验证闭环 实现计划

## 实施目标

在当前 Vue 网页项目旁建立独立的 Flutter 移动端验证工程，形成一个可在两类 iOS 16+ 真机上运行的竖屏 3D 验证样例，证明或否定 Flutter 3D 对本项目核心渲染、物理、手势、反馈、生命周期和性能要求的承载能力。

本 Plan 的完成边界是技术结论，不是完整游戏迁移。验证完成后必须能够明确选择继续 Flutter 3D，或停止继续投入并评估 Godot/Unity。

## 实现策略

- 在仓库内通过 Flutter 官方 CLI 命令新增独立 `mobile/` Flutter 工程：`flutter create --platforms=ios,android --org=com.beattheboss mobile`；保留现有 `src/` 网页项目不变，避免技术验证污染现有可运行版本。
- 采用 Flutter 3.47.1 stable 作为当前验证基线；采用已实际解析通过的 `flutter_scene` 0.19.0 与 `flutter_scene_rapier` 0.2.2 作为本次 3D/物理验证组合。`flutter_scene` 0.23.0 与 `flutter_scene_rapier` 0.5.0 当前存在 `scene` 主版本冲突，因此不作为本次组合；若当前组合在 iOS 真机无法稳定构建或运行，只记录为候选栈失败，不改变 Spec 的业务目标。
- 先建立最小纵向切片，再逐项叠加物理、手势、反馈和生命周期能力；每个 Task 都输出可运行或可验证的结果。
- 通过明确的领域事件隔离渲染/物理、手势、游戏规则、反馈和应用生命周期；验证工程不提前实现完整商业化。
- 使用真实 iOS 设备验证，不以桌面模拟、录屏或静态场景代替真机结果。
- 不采用 Flutter CustomPainter 从零实现 3D，也不在本 Change 内直接切换 Godot/Unity；只有在最终验证结论中记录是否需要切换。

## 技术设计

### 当前技术现状

#### 系统入口与调用链

```text
浏览器入口 /src/main.ts
  → Vue App /src/App.vue
  → startGame()
  → new GameEngine(canvas, look, events)
  → GameEngine.init()
  → buildScene() / bind() / loop()
  → Three.js Scene + Rapier World
  → pointer/click input
  → useWeapon() / beginCharge() / releaseCharge()
  → strikeTarget() / collision() / registerHit()
  → onStats / onHit / onDialogue / onRageEnd
```

当前网页入口通过 Vue 管理页面和 LocalStorage；`GameEngine` 负责 Three.js 场景、Rapier 世界、程序化几何体、道具动作、碰撞与渲染循环；`audio.ts` 负责 Web Audio 音调。当前代码没有 Flutter 工程，也没有移动端生命周期、触觉或真机性能入口。

#### 关键文件与符号

- `src/main.ts`：网页应用入口；说明当前实现只从 Vue 启动。
- `src/App.vue`：页面状态、老板输入、道具栏、设置、结果页、LocalStorage 和引擎生命周期；作为移动端入口行为参考。
- `src/game/GameEngine.ts`：`init`、`buildScene`、`createBoss`、`setHeldWeapon`、`useWeapon`、`beginCharge`、`releaseCharge`、`collision`、`registerHit`、`startRage`、`dispose`；作为渲染/物理/游戏事件的行为参考。
- `src/game/data.ts`：`weapons`、对白、成就、`hashName`、`seededLook`；作为验证样例数据和 Seed 行为参考。
- `src/game/types.ts`：`WeaponId`、`BossLook`、`GameStats`、`GameEvents`；作为跨模块事件和状态语义参考。
- `src/game/audio.ts`：`AudioManager.tone`；作为卡通音效反馈方向参考。
- `package.json`：当前网页依赖 Three.js、Rapier JS、GSAP 和 Vue；证明当前实现不是 Flutter 工程，且移动端需要独立依赖边界。

#### Current Behavior

当前网页可以输入老板名字并用 Seed 生成外观，进入 Three.js 办公室场景；用户通过鼠标点击、Pointer 事件、右键旋转和滚轮缩放操作道具，Rapier 产生动态物体碰撞，游戏层累计解压值、Combo、破坏度并触发暴走。当前网页的老板部件采用运动学姿态控制，网页没有移动端触摸契约，也没有 Flutter 原生 3D、iOS 真机 FPS、触觉、后台暂停恢复的证据。

### 目标技术设计

```text
Flutter App Shell
  → ValidationSession
      → GestureRouter → GameAction
      → SceneAdapter ↔ PhysicsAdapter
      → DomainEvent → FeedbackAdapter
      → LifecycleController → PauseState
      → ValidationRecorder → DeviceResult
```

- **App Shell**：提供竖屏页面、安全区域、启动/验证/暂停/完成状态和 iOS 生命周期通知。
- **ValidationSession**：维护验证样例的运行状态，接收动作并将场景事件转为验证结果；不拥有正式持久化存档。
- **SceneAdapter**：创建程序化几何体、材质、灯光、相机、老板和办公室样例，暴露渲染状态和命中查询。
- **PhysicsAdapter**：维护动态刚体、碰撞、冲量、射线和连锁反应，产生规范化物理事件。
- **GestureRouter**：将竖屏触摸手势转换为点击、蓄力、释放、老板拖拽/甩动、瞄准和相机动作，保证一次手势只有一个动作结果。
- **FeedbackAdapter**：消费统一反馈事件，驱动音频、粒子、镜头震动和触觉；单项设备能力失败时降级。
- **LifecycleController**：将 App 后台、锁屏和系统中断转换为暂停/恢复状态；后台期间禁止场景和规则推进。
- **ValidationRecorder**：记录设备、流程、能力、FPS、稳定性、降级和失败原因，输出最终技术结论。

#### Current → Target 对照

| 当前行为 | 目标行为 |
| --- | --- |
| Vue + Three.js 浏览器入口 | 独立 Flutter iOS 验证 App 入口 |
| 鼠标点击、右键和滚轮 | 竖屏触摸手势优先，包含点击、长按、松手、拖拽、滑动和双指 |
| Three.js 程序化办公室和老板 | Flutter 3D 程序化几何验证样例 |
| Rapier JS 动态刚体和碰撞 | Flutter 3D 物理候选栈中的动态刚体、碰撞和连锁事件 |
| Web Audio 音调 | 移动端卡通音频反馈，并验证不可用时降级 |
| 没有 App 生命周期暂停 | 后台/锁屏自动暂停，用户主动继续后恢复 |
| 没有 iOS 性能证据 | 两类代表性 iOS 真机分别记录渲染、物理、输入、稳定性和性能结果 |
| 网页 LocalStorage | 本 Change 不迁移存档，仅验证会话状态；正式离线数据属于后续阶段 |

## 全局不变量

- iOS 是本 Change 的首轮验证平台；iOS 通过不能表示 Android 已通过。
- 验证样例必须包含实时 3D 渲染和真实物理互动，不能用静态展示或固定动画替代。
- 竖屏核心手势必须可操作；桌面鼠标和键盘不能作为移动端通过依据。
- 渲染、物理、手势和生命周期是阻断性能力；任一代表性设备失败都不能宣布 iOS 整体通过。
- 音频、粒子、镜头震动和触觉可以按设备能力降级，但必须记录降级，不得阻塞核心操作。
- 后台期间不推进物理、计时、输入、命中或反馈；恢复必须由用户主动点击继续。
- 验证目标约为 30～60 个动态物理对象；不得通过删除核心物理能力降低验证门槛。
- 新设备以稳定 60 FPS 为目标，旧 iOS 16 设备至少约 30 FPS 可玩。
- 不引入联网、账号、云存档、商业化或真实伤害表现。
- 所有跨模块状态通过明确动作、事件或快照传递，不共享可变内部对象。

## 条件技术设计

| 类别 | 是否适用 | 原因 | 对应设计或 Task |
| --- | --- | --- | --- |
| 状态机 | 是 | 验证样例需要区分启动、场景运行、暂停、继续、失败和完成 | 目标技术设计、Task 1、Task 5 |
| 错误策略 | 是 | 渲染/物理阻断失败与音频/触觉可降级失败必须区分 | Task 1、Task 2、Task 5、Task 6 |
| 并发与幂等 | 是 | 多指、重复生命周期事件和重复释放可能造成重复动作 | GestureRouter、Task 4 |
| 数据与事务 | 是 | 需要维护验证会话和不可丢失的验证记录，但不迁移正式存档 | Task 1、Task 6 |
| API / 事件 | 是 | 渲染、物理、手势、反馈和生命周期需要解耦 | 目标技术设计、Task 2～5 |
| 配置 | 是 | 需要设备、画质、粒子、FPS 和对象规模配置 | Task 1、Task 6 |
| 兼容与迁移 | 是 | 需要 iOS 16+ 两类设备，且保留未来切换引擎空间 | Task 1、Task 6 |
| 权限与安全 | 是 | 音频、触觉和生命周期能力需遵守平台授权，禁止无关权限 | Task 5 |
| 可观测性 | 是 | 最终必须输出逐项 PASS/FAIL、FPS、稳定性和降级记录 | Task 6 |
| 参考实现 | 是 | 现有网页行为和已调研 Flutter 3D 候选是验证输入，不是直接复用实现 | 当前技术现状、Task 2～4 |

## Tasks

### Task 1: 建立 Flutter iOS 验证工程与会话壳

- files: `mobile/pubspec.yaml`, `mobile/pubspec.lock`, `mobile/.metadata`, `mobile/analysis_options.yaml`, `mobile/.gitignore`, `mobile/android/**`, `mobile/ios/**`, `mobile/lib/main.dart`, `mobile/lib/app/validation_app.dart`, `mobile/lib/app/lifecycle_controller.dart`, `mobile/test/widget_test.dart`, `mobile/test/app/validation_app_test.dart`
- symbols: Flutter App 入口、ValidationApp、LifecycleController、ValidationSessionState
- read_first: `docs/changes/CR-001-flutter-3d-技术验证闭环/spec.md` 的 REQ-01/REQ-05/REQ-06；`docs/blueprint.md` 的应用壳与生命周期模块；`src/main.ts`；`src/App.vue` 的 `startGame` 和 `onBeforeUnmount`
- depends_on: 无
- interfaces: 输入为 App 启动、前后台生命周期和用户继续命令；输出为启动、运行、暂停、恢复、失败和完成状态；使用 Flutter 3.47.1 stable、iOS 16+、Android 平台工程配置，但本 Task 首先验证 iOS
- current_behavior: 当前只有浏览器入口和 Vue 页面，没有 Flutter 工程，也没有移动端生命周期状态
- target_behavior: 存在可在 iOS 16+ 真机启动的竖屏 Flutter 验证 App；App 能展示验证状态，后台/锁屏转为暂停，返回后保持暂停并等待继续命令
- implementation: 执行 `flutter create --platforms=ios,android --org=com.beattheboss mobile` 生成双平台工程；删除 CLI 生成的默认 `mobile/test/widget_test.dart`，避免默认 `MyApp` 测试与验证入口冲突；在生成工程中建立验证会话状态和应用生命周期监听；限制竖屏并处理安全区域；提供启动、验证、暂停、继续和完成状态；将原网页保留为行为参考而不接入移动端运行时
- invariants: 不修改 `src/` 网页核心；不引入联网和商业化依赖；后台期间不得推进尚未创建的游戏状态；符合 BR-01、BR-06、BR-09
- verify: `cd mobile && flutter pub get && dart analyze && flutter test`
- acceptance: 可在 iOS 16+ 模拟器或真机启动基础 App；生命周期测试证明后台后状态为暂停且继续前不恢复；覆盖 REQ-01、REQ-05、AC-01、AC-02、AC-07 的基础入口条件
- done: 基础 Flutter 工程可分析、测试并在 iOS 设备显示验证壳，暂停状态测试通过

- [x] Task 1

### Task 2: 建立程序化 3D 场景与渲染样例

- files: `mobile/pubspec.yaml`, `mobile/ios/Runner/Info.plist`, `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/lib/app/validation_app.dart`, `mobile/lib/scene/scene_adapter.dart`, `mobile/lib/scene/procedural_geometry.dart`, `mobile/lib/scene/material_palette.dart`, `mobile/lib/scene/camera_controller.dart`, `mobile/test/scene/procedural_geometry_test.dart`
- symbols: SceneAdapter、ProceduralGeometry、MaterialPalette、CameraController
- read_first: Task 1 的 App 入口和验证状态；`src/game/GameEngine.ts` 的 `buildScene`、`addRigid`、`createBoss`、`box` 和程序化模型方法；Spec 的 REQ-01、BR-02
- depends_on: Task 1
- interfaces: 输入为场景初始化、相机手势和画质配置；输出为可渲染的程序化老板、办公室、材质、灯光、相机和基础动画状态
- current_behavior: 网页通过 Three.js 几何体、材质、灯光和相机创建办公室与老板；移动端无对应场景
- target_behavior: iOS 验证样例显示可辨识的卡通办公室和老板，支持程序化几何体、材质、灯光、相机和基础动画，并可在竖屏场景观察
- implementation: 在已解析的 `flutter_scene` 0.19.0 基线上接入 Flutter 3D 场景候选；在 iOS `Info.plist` 开启 `FLTEnableFlutterGPU`，在 Android Manifest 开启 `io.flutter.embedding.android.EnableFlutterGPU`；建立低复杂度几何体和材质调色板；创建老板身体部件和办公室样例；在 `ValidationApp` 中挂载场景视图；提供竖屏相机默认姿态与双指相机控制入口；为目标动态对象规模预留场景容量配置；对创建失败输出阻断性验证错误
- invariants: 必须是真实实时渲染；不加载外部 GLB/GLTF 作为核心模型；不引入超出 Spec 的美术内容；符合 REQ-01、BR-02、BR-05
- verify: `cd mobile && dart analyze && flutter test`; 真机运行场景并记录 AC-01/AC-02
- acceptance: 两类代表性 iOS 真机均能进入竖屏 3D 场景，观察到程序化几何体、材质、灯光、相机和基础动画；静态画面不能单独通过；覆盖 AC-01、AC-02
- done: 两类 iOS 设备均可运行并观察到完整渲染样例，自动测试和人工记录均完成

- [x] Task 2

### Task 3: 接入物理样例与老板互动

- files: `mobile/pubspec.yaml`, `mobile/lib/app/validation_app.dart`, `mobile/lib/scene/scene_adapter.dart`, `mobile/lib/physics/physics_adapter.dart`, `mobile/lib/game/boss_interaction.dart`, `mobile/lib/game/game_action.dart`, `mobile/test/physics/physics_adapter_test.dart`, `mobile/test/game/boss_interaction_test.dart`
- symbols: PhysicsAdapter、BossInteraction、GameAction、PhysicsEvent
- read_first: Task 2 的 SceneAdapter 和场景对象；`src/game/GameEngine.ts` 的 `addRigid`、`pickBoss`、`pickScene`、`strikeTarget`、`collision`、`throwChair` 和 `projectile`；Spec 的 REQ-02、BR-04、BR-05
- depends_on: Task 2
- interfaces: 输入为道具动作、老板抓取/释放和物理配置；输出为命中、拖拽、投掷、冲量、碰撞和连锁反应事件；PhysicsEvent 不直接修改 UI 或持久化数据
- current_behavior: 网页使用 Rapier JS 创建刚体、射线检测和碰撞事件；老板受击主要通过运动学姿态程序模拟，移动端能力尚未验证
- target_behavior: iOS 验证样例中，至少一种道具和老板身体能够产生真实命中、拖拽、投掷、冲量、刚体碰撞和连锁反应，并支持约 30 个动态物理对象作为最低验证规模
- implementation: 接入 Flutter 物理候选后建立动态/静态刚体和碰撞过滤；将 RapierWorld 挂载到 SceneAdapter 的场景根节点，并由 ValidationApp 的场景生命周期统一初始化；将场景实体与物理实体关联；实现老板身体命中查询、抓取/拖动/释放和道具投掷；将碰撞归一化为 PhysicsEvent；实现动态对象规模配置和超限安全降级；物理初始化或核心事件失败时报告阻断错误
- invariants: 不用固定动画替代真实物理；物理模块不计算解压值和 Combo；至少 30 个动态对象参与验证；符合 REQ-02、BR-04、BR-05、BR-06
- verify: `cd mobile && dart analyze && flutter test`; 两类 iOS 真机执行命中、拖拽、投掷和连锁流程并记录 AC-03/AC-04
- acceptance: 两类设备均观察到真实命中、刚体碰撞和冲量；目标规模内至少发生一次连锁反应；覆盖 AC-03、AC-04
- done: 物理自动测试通过，且两类 iOS 真机的物理和连锁记录均完成

- [x] Task 3

### Task 4: 实现竖屏手势路由与游戏会话动作

- files: `mobile/lib/app/validation_app.dart`, `mobile/lib/scene/scene_adapter.dart`, `mobile/lib/input/gesture_router.dart`, `mobile/lib/input/gesture_state.dart`, `mobile/lib/game/validation_session.dart`, `mobile/test/input/gesture_router_test.dart`, `mobile/test/game/validation_session_test.dart`
- symbols: GestureRouter、GestureState、ValidationSession、GameAction
- read_first: Task 1 的 LifecycleController；Task 3 的 GameAction、BossInteraction 和 PhysicsEvent；`src/App.vue` 的 `canvasClick`、`chargeStart`、`chargeEnd`；Spec 的 REQ-03、BR-03
- depends_on: Task 3
- interfaces: 输入为竖屏点击、长按、松手、单指拖拽/滑动和双指手势；输出为一次性 GameAction（攻击、蓄力、释放、老板拖拽/甩动、瞄准、相机操作）和取消/失败事件
- current_behavior: 网页通过 click 和 PointerEvent 区分普通攻击与拖鞋/充气锤蓄力，老板抓取并未形成完整实现；右键和滚轮是桌面交互
- target_behavior: 在竖屏下手势优先完成点击攻击、长按蓄力、松手释放、老板抓取拖拽甩动、滑动瞄准和双指相机控制；一次手势只产生一个动作，冲突手势有明确取消结果
- implementation: 定义手势状态和优先级；将起始触点命中场景对象后路由为老板交互或道具动作；在 `ValidationApp` 和 `SceneAdapter` 中挂载手势路由与场景输入入口；实现长按计时与松手释放；实现多指进入后锁定相机手势并取消冲突的单指动作；在 App 暂停或触摸取消时清理所有临时状态；向会话层发送动作而不直接写规则数据
- invariants: 不接受鼠标/键盘替代；重复 pointer/touch up 不得重复释放；暂停时禁止接受核心动作；符合 REQ-03、BR-03、BR-06
- verify: `cd mobile && dart analyze && flutter test`; 两类 iOS 真机按 AC-05 操作并记录每个手势结果
- acceptance: 六类核心手势均能产生预期动作；长按只释放一次；暂停或触摸取消后不产生攻击；覆盖 AC-05
- done: 手势单元测试和两类 iOS 真机人工验证均通过，冲突/取消结果有记录

- [ ] Task 4

### Task 5: 接入反馈能力与生命周期暂停恢复

- files: `mobile/lib/app/validation_app.dart`, `mobile/lib/feedback/feedback_adapter.dart`, `mobile/lib/feedback/audio_feedback.dart`, `mobile/lib/feedback/haptic_feedback.dart`, `mobile/lib/feedback/visual_feedback.dart`, `mobile/lib/app/lifecycle_controller.dart`, `mobile/test/feedback/feedback_adapter_test.dart`, `mobile/test/app/lifecycle_controller_test.dart`
- symbols: FeedbackAdapter、AudioFeedback、HapticFeedback、VisualFeedback、LifecycleController
- read_first: Task 1 的生命周期状态；Task 3 的 PhysicsEvent；Task 4 的 GameAction；`src/game/audio.ts` 的 `AudioManager.tone`；Spec 的 REQ-04/REQ-05、BR-09/BR-10
- depends_on: Task 4
- interfaces: 输入为命中、强力攻击、碰撞、倒地、暴走、暂停和恢复事件；输出为音频、粒子、镜头震动、触觉和 UI 反馈；反馈能力失败返回降级状态，不改变核心游戏状态
- current_behavior: 网页有 Web Audio、粒子和 GSAP 镜头震动，但没有移动端触觉和前后台暂停恢复
- target_behavior: 关键游戏事件在 iOS 设备上产生卡通音频、视觉反馈、镜头反馈和触觉；后台/锁屏立即暂停所有推进，恢复后显示暂停并由用户点击继续
- implementation: 建立统一反馈事件；接入移动端音频和触觉能力；按反馈设置启停粒子、震动和镜头效果；监听生命周期并冻结会话、物理、计时、输入和反馈事件；恢复后只展示暂停状态，继续命令再恢复；将单项设备不可用记录为降级而非核心失败
- invariants: 反馈模块不修改物理和规则；后台期间没有命中、Combo 或计时变化；触觉/音频失败不崩溃；核心渲染/物理失败不能静默通过；符合 REQ-04、REQ-05、BR-09、BR-10
- verify: `cd mobile && dart analyze && flutter test`; 两类 iOS 真机执行 AC-06/AC-07 并记录降级和暂停恢复结果
- acceptance: 关键事件反馈可观察；后台返回后保持暂停，继续前不推进，继续后恢复且无补算；覆盖 AC-06、AC-07
- done: 反馈和生命周期自动测试通过，两类 iOS 真机记录完成且无阻断性生命周期问题

- [ ] Task 5

### Task 6: 真机性能、稳定性观测与技术结论

- files: `mobile/lib/validation/validation_recorder.dart`, `mobile/lib/validation/device_result.dart`, `mobile/lib/validation/validation_report.dart`, `mobile/test/validation/validation_recorder_test.dart`, `docs/changes/CR-001-flutter-3d-技术验证闭环/validation-report.md`
- symbols: ValidationRecorder、DeviceResult、ValidationReport、Flutter3dDecision
- read_first: Task 1～5 的公开接口和验证记录；Spec 全部 REQ/BR/AC；Blueprint 的成功标准、风险与非功能要求；`docs/roadmap.md` 阶段一
- depends_on: Task 5
- interfaces: 输入为两类 iOS 设备、目标场景、动态对象规模、完整验证流程的观测结果；输出为按设备和能力分类的 PASS/FAIL/DEGRADED 记录，以及继续 Flutter 3D/评估 Godot-Unity 的技术结论
- current_behavior: 当前项目没有移动端 FPS、内存、温度、稳定性或真机验证报告
- target_behavior: 两类代表性 iOS 真机均有完整验证记录；新设备以稳定 60 FPS 为目标，旧设备至少约 30 FPS 可玩；报告明确记录所有能力、问题、降级和总体决策
- implementation: 建立设备结果模型和验证记录格式；记录渲染、物理、手势、反馈、生命周期、FPS、崩溃/黑屏、触摸失效、核心物理失效和发热异常；执行目标规模和完整验证流程；按 BR-06～BR-12 汇总分项结果；只有两类设备和全部阻断能力满足门槛时才输出 iOS 整体通过；否则输出评估 Godot/Unity 的结论，不删除核心能力降低门槛
- invariants: iOS 结论不代表 Android 通过；缺少任一代表性设备或分项记录不得整体通过；性能、稳定性和核心能力结果不得用主观描述替代；覆盖 REQ-06、BR-06～BR-12
- verify: `cd mobile && dart analyze && flutter test`; `flutter devices`; `flutter build ios --no-codesign`; 在两类 iOS 真机执行完整流程并填写 `validation-report.md`
- acceptance: AC-08、AC-09 的设备目标和稳定性条件均有 PASS/FAIL 结果；AC-10 报告包含两类设备的全部分项记录及唯一技术结论；若未达标，报告明确切换评估，不宣布 Flutter 通过
- done: 自动检查、iOS 构建、两类真机测试和验证报告均完成，结论可供阶段二决策使用

- [ ] Task 6

## 验收标准映射

| Spec 契约（REQ/BR/AC） | 覆盖任务 | 最终验证 |
| --- | --- | --- |
| REQ-01、BR-01、BR-02、BR-06、AC-01、AC-02 | Task 1、Task 2、Task 6 | 两类 iOS 真机渲染记录与验证报告 |
| REQ-02、BR-04、BR-05、BR-06、AC-03、AC-04 | Task 3、Task 6 | 物理测试、目标对象规模测试与真机记录 |
| REQ-03、BR-03、BR-06、AC-05 | Task 4、Task 6 | 手势自动测试与两类真机操作记录 |
| REQ-04、BR-10、BR-11、AC-06 | Task 5、Task 6 | 反馈能力记录、降级记录与验证报告 |
| REQ-05、BR-09、BR-06、AC-07 | Task 1、Task 5、Task 6 | 生命周期测试与真机后台恢复记录 |
| REQ-06、BR-05、BR-06、BR-07、BR-08、BR-11、BR-12、AC-08、AC-09、AC-10 | Task 6 | 双设备性能/稳定性记录和最终技术结论 |
| BR-10、BR-12 | Task 5、Task 6 | 降级行为与 Flutter/Godot/Unity 决策记录 |

## Constitution 规范映射清单

当前 `docs/constitution.md` 仍为初始化草稿，各章节没有已批准的项目规则，因此没有可引用的具体 Constitution 约束。本 Plan 以已批准的 CR-001 Spec 和 Blueprint 作为当前有效契约；后续 Constitution 建立后，`verify-plan` 需要重新检查本 Change 是否受新增规则影响。

| 规则来源 | 适用文件/任务 | 验证方式 | 最终验收 |
| --- | --- | --- | --- |
| `CR-001/spec.md`：移动端、离线、卡通内容和性能边界 | Task 1～6 | Spec 编号映射、代码审查、真机验证 | AC-01～AC-10 全部有结果 |
| `docs/blueprint.md`：模块边界和数据权威 | Task 1～5 | 事件方向审查、依赖检查 | UI/反馈不直接拥有物理或持久化权威 |
| `docs/blueprint.md`：离线核心和商业化隔离 | Task 1、Task 6 | 依赖清单和离线启动检查 | 无商业化/网络依赖仍可验证核心 |
| `docs/constitution.md` 当前草稿 | Task 1～6 | `verify-plan` 复查 | 后续规则变化时重新评估 |

## 最终验证

- Task 1 记录（2026-08-27）：`flutter create --platforms=ios,android --org=com.beattheboss mobile` 成功生成 75 个文件；`cd mobile && dart analyze && flutter test` 通过；`flutter build ios --no-codesign` 成功生成 `build/ios/iphoneos/Runner.app`；iPhone SE（第 3 代）iOS 18.3 模拟器启动并运行验证壳成功。Task 1 的后续真机验收仍由 Task 6 统一完成。
- Task 2 记录（2026-08-27）：加入 `flutter_scene` 0.19.0、`flutter_scene_rapier` 0.2.2 和 `vector_math` 2.4.2；`dart analyze`、`flutter test` 和 `flutter build ios --no-codesign` 通过；iPhone SE（第 3 代）iOS 18.3 模拟器启动后点击“开始验证”成功显示程序化办公室和老板场景；Dart MCP Widget Inspector 发现 `SceneView`，Dart MCP runtime errors 返回 `No runtime errors found`。
- Task 3 记录（2026-08-27）：新增 RapierWorld 挂载、静态/动态刚体和 BossInteraction 释放动作模型；`dart analyze`、`flutter test` 和 `flutter build ios --no-codesign` 通过；带 Flutter GPU 配置的 iPhone SE（第 3 代）iOS 18.3 模拟器自动进入场景，截图显示动态对象受重力产生位移；Dart MCP runtime errors 返回 `No runtime errors found`，Widget Inspector 确认 SceneView 正常运行。触摸端到端动作将在 Task 4 统一验证。
- Spec 验收标准：先执行 `cd mobile && dart analyze && flutter test`，再执行 `flutter build ios --no-codesign`；在两类 iOS 16+ 代表性真机完成 AC-01～AC-09，并检查 `validation-report.md` 是否覆盖 AC-10。
- Constitution 规范：当前无已批准具体规则；执行 Blueprint 边界审查、依赖审查、离线启动检查、生命周期检查和真机结果复核。
- MCP 运行时复核（2026-08-27）：Dart MCP 已连接 iPhone SE（第 3 代）上的 Flutter App；`get_runtime_errors` 返回 `No runtime errors found`；Widget Inspector 返回运行中的 `SceneView`。
- 失败结论：任一阻断能力或任一代表性设备不满足 BR-06，报告必须标记 iOS 整体未通过，并给出评估 Godot/Unity 的结论；不得通过删减 Spec 能力来通过。

## 非目标

- 不完整迁移现有网页游戏。
- 不在本 Change 中实现全部 8 种道具、完整成就、本地历史和正式结算产品体验。
- 不验证 Android 真机最终通过；Android 属于后续双端发布目标。
- 不实现广告、统计、分享、去广告内购、账号、云端存档或跨设备同步。
- 不迁移现有网页 LocalStorage。
- 不提交正式 App Store / Google Play 发布材料。
- 不引入血腥、死亡、击杀或写实伤害表现。

## 未决问题

无

## 修订记录

- 2026-08-27：根据 Flutter CLI 实际生成结果，补充 `mobile/test/widget_test.dart` 的删除范围，避免默认测试入口与验证入口冲突。
- 2026-08-27：实测发现 `flutter_scene` 0.23.0 与 `flutter_scene_rapier` 0.5.0 依赖冲突；改用已解析通过的 `flutter_scene` 0.19.0 与 `flutter_scene_rapier` 0.2.2 作为验证基线。
- 2026-08-27：根据 Task 2 实施前检查，补充 `ValidationApp` 作为场景视图集成点。
- 2026-08-27：根据 iOS 真机运行错误，补充 iOS Info.plist 与 Android Manifest 的 Flutter GPU 开关配置范围。
- 2026-08-27：根据 Task 3 集成检查，补充 SceneAdapter 与 ValidationApp 的 RapierWorld 挂载和生命周期集成范围。
- 2026-08-27：为使手势和反馈形成可运行验证闭环，补充 Task 4/5 对 ValidationApp 与 SceneAdapter 的集成范围。
