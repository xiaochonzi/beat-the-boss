# CR-001 Flutter 3D iOS 验证报告

## 验证时间

2026-08-27

## 设备覆盖

| 设备 | 系统 | 类型 |
| --- | --- | --- |
| iPhone SE（第 3 代） | iOS 18.3 | iOS Simulator |
| iPhone 16 | iOS 18.3 | iOS Simulator |

说明：当前环境提供的是两类 iOS Simulator，尚未连接物理 iPhone；因此本报告不能替代最终物理真机验收。

## 结果摘要

| 能力 | iPhone SE Simulator | iPhone 16 Simulator |
| --- | --- | --- |
| Flutter App 启动 | PASS | PASS |
| Impeller / Metal 启动 | PASS | PASS |
| Flutter GPU 配置 | PASS | PASS |
| 程序化 3D 场景 | PASS | PASS |
| 材质、灯光、相机 | PASS | PASS |
| Rapier 动态刚体 | PASS | PASS |
| 动态对象受重力运动 | PASS | PASS |
| SceneView 运行时挂载 | PASS | PASS |
| Dart MCP runtime errors | PASS：无错误 | PASS：无错误 |
| 手势 Listener 挂载 | PASS | PASS |
| 自动化测试 | PASS | PASS |
| iOS Release 构建 | PASS | PASS |
| 目标 FPS | 未测量 | 未测量 |
| 物理真机表现 | 未验证 | 未验证 |

## 证据

- `cd mobile && dart analyze`：通过。
- `cd mobile && flutter test`：通过，全部测试通过。
- `cd mobile && flutter build ios --no-codesign`：成功生成 iOS Release App。
- iPhone SE 模拟器启动日志显示：`Using the Impeller rendering backend (Metal)`。
- iPhone 16 模拟器启动日志显示：Flutter App 正常启动。
- Dart MCP `get_runtime_errors`：两台模拟器均返回 `No runtime errors found.`。
- Dart MCP Widget Inspector：两台模拟器均发现运行中的 `SceneView`，并确认外层 `Listener` 已挂载。
- 截图证据：iPhone 16 Simulator 最新截图显示全屏竖屏场景、顶部状态卡、底部手势提示卡、老板头发/眼睛/鼻子/领带/手臂、办公室桌椅和地面；视觉层级正常，未出现此前的全屏白色面板；物理接入后动态对象发生重力位移。

## 当前结论

Flutter 3D 在 iOS Simulator 上已证明能够运行程序化几何体、Flutter GPU/Impeller Metal、SceneView、Rapier 动态刚体、基础手势容器和生命周期壳；最新界面截图已完成视觉复核；当前没有 MCP 可见运行时错误。

本次没有测得 60 FPS、30 FPS 门槛、温度、内存和物理 iPhone 表现，因此不能宣布满足 CR-001 的最终 iOS 性能门槛。最终技术选型结论保留为：需要在代表性物理 iPhone 上完成 AC-08、AC-09 后，再决定继续 Flutter 3D 或评估 Godot/Unity。
