import 'package:flutter/material.dart';
import 'package:flutter_scene/scene.dart';

import '../feedback/feedback_adapter.dart';

import 'lifecycle_controller.dart';
import '../game/validation_session.dart';
import '../input/gesture_router.dart';
import '../scene/scene_adapter.dart';

enum ValidationSessionState { idle, running, paused }

class ValidationApp extends StatefulWidget {
  const ValidationApp({
    super.key,
    this.enable3d = true,
    this.autoStart = const bool.fromEnvironment('FLUTTER_GPU_VALIDATION'),
  });

  final bool enable3d;
  final bool autoStart;

  @override
  ValidationAppState createState() => ValidationAppState();
}

class ValidationAppState extends State<ValidationApp>
    with WidgetsBindingObserver {
  final LifecycleController lifecycle = LifecycleController();
  final ValidationSession session = ValidationSession();
  final GestureRouter gestureRouter = GestureRouter();
  final FeedbackAdapter feedback = FeedbackAdapter();
  SceneAdapter? _sceneAdapter;
  bool _sceneReady = false;
  String _gestureLabel = '等待手势';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    lifecycle.addListener(_onLifecycleChanged);
    if (widget.autoStart) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _startValidation();
      });
    }
  }

  @override
  void dispose() {
    lifecycle.removeListener(_onLifecycleChanged);
    lifecycle.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _onLifecycleChanged() {
    if (lifecycle.state == ValidationLifecycle.paused) {
      session.pause();
    }
    setState(() {});
  }

  bool _hitBoss(Offset position, Size size) {
    return position.dx > size.width * 0.3 &&
        position.dx < size.width * 0.7 &&
        position.dy > size.height * 0.2 &&
        position.dy < size.height * 0.65;
  }

  void _pointerDown(PointerDownEvent event, Size size) {
    if (lifecycle.state != ValidationLifecycle.running) return;
    final intent = gestureRouter.pointerDown(
      pointer: event.pointer,
      x: event.localPosition.dx,
      y: event.localPosition.dy,
      hitsBoss: _hitBoss(event.localPosition, size),
    );
    if (intent is CameraIntent) setState(() => _gestureLabel = '相机手势');
  }

  void _pointerMove(PointerMoveEvent event) {
    gestureRouter.pointerMove(
      pointer: event.pointer,
      x: event.localPosition.dx,
      y: event.localPosition.dy,
    );
  }

  void _pointerUp(PointerUpEvent event) {
    final intent = gestureRouter.pointerUp(pointer: event.pointer);
    if (intent == null || !mounted) return;
    setState(() {
      _gestureLabel = intent is BossDragIntent ? '老板拖拽释放' : '点击攻击';
    });
    feedback.emit(
      intent is BossDragIntent ? FeedbackEvent.heavyHit : FeedbackEvent.hit,
    );
  }

  void _pointerCancel(PointerCancelEvent event) => gestureRouter.cancel();

  void _startValidation() {
    session.resume();
    lifecycle.start();
    if (widget.enable3d) _loadScene();
  }

  Future<void> _loadScene() async {
    final adapter = SceneAdapter();
    await adapter.initialize();
    if (!mounted) return;
    setState(() {
      _sceneAdapter = adapter;
      _sceneReady = true;
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    lifecycle.didChangeAppLifecycleState(state);
  }

  Widget _buildScene() {
    return LayoutBuilder(
      builder: (context, constraints) => Listener(
        onPointerDown: (event) => _pointerDown(event, constraints.biggest),
        onPointerMove: _pointerMove,
        onPointerUp: _pointerUp,
        onPointerCancel: _pointerCancel,
        child: Stack(
          fit: StackFit.expand,
          children: [
            SceneView(_sceneAdapter!.scene, camera: _sceneAdapter!.camera),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xAA101827), Colors.transparent],
                  stops: [0, .25],
                ),
              ),
              child: SizedBox.expand(),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 58,
                      child: _StatusChip(
                        icon: Icons.threed_rotation,
                        label: 'Flutter 3D',
                        value: '验证中',
                      ),
                    ),
                    SizedBox(
                      height: 58,
                      child: _StatusChip(
                        icon: Icons.touch_app,
                        label: '当前手势',
                        value: _gestureLabel,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: SafeArea(
                minimum: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: SizedBox(
                    height: 72,
                    child: _HintCard(
                      icon: Icons.pan_tool_alt_rounded,
                      title: '拖动老板，制造一点混乱',
                      subtitle: '点击攻击 · 长按蓄力 · 双指旋转镜头',
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcome() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFE18A), Color(0xFFFF8B6B)],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.view_in_ar_rounded,
                  size: 76,
                  color: Color(0xFF182138),
                ),
                const SizedBox(height: 22),
                const Text(
                  'Flutter 3D 技术验证',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF182138),
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  '移动端物理互动实验场',
                  style: TextStyle(color: Color(0xCC182138), fontSize: 16),
                ),
                const SizedBox(height: 42),
                FilledButton.icon(
                  onPressed: _startValidation,
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('开始验证'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF182138),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 28,
                      vertical: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isRunning = lifecycle.state == ValidationLifecycle.running;
    final isPaused = lifecycle.state == ValidationLifecycle.paused;

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '今天又想打老板',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFFC857)),
        scaffoldBackgroundColor: const Color(0xFF182138),
        useMaterial3: true,
      ),
      home: Scaffold(
        body: isRunning && _sceneReady && widget.enable3d
            ? _buildScene()
            : isPaused
            ? Stack(
                fit: StackFit.expand,
                children: [
                  if (_sceneReady) _buildScene(),
                  Container(color: const Color(0x99182138)),
                  Center(
                    child: Card(
                      margin: const EdgeInsets.all(28),
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.pause_circle_filled, size: 56),
                            const SizedBox(height: 12),
                            const Text(
                              '已暂停',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 20),
                            FilledButton(
                              onPressed: () {
                                session.resume();
                                lifecycle.continueSession();
                              },
                              child: const Text('继续'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              )
            : isRunning
            ? const Center(child: Text('验证场景'))
            : _buildWelcome(),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: const Color(0xDD182138),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0x55FFFFFF)),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFFFFD166), size: 19),
          const SizedBox(width: 7),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(color: Color(0xB3FFFFFF), fontSize: 10),
              ),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _HintCard extends StatelessWidget {
  const _HintCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: const Color(0xEEFFFFFF),
      borderRadius: BorderRadius.circular(20),
      boxShadow: const [
        BoxShadow(
          color: Color(0x66182138),
          blurRadius: 20,
          offset: Offset(0, 8),
        ),
      ],
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFEF624F), size: 26),
          const SizedBox(width: 11),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF182138),
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(color: Color(0xFF667085), fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}
