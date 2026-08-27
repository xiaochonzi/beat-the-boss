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

  @override
  Widget build(BuildContext context) {
    final isRunning = lifecycle.state == ValidationLifecycle.running;
    final isPaused = lifecycle.state == ValidationLifecycle.paused;

    return MaterialApp(
      title: '今天又想打老板',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.amber),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(title: const Text('Flutter 3D 技术验证')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                isPaused
                    ? '已暂停'
                    : isRunning
                    ? '验证场景'
                    : '等待开始',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 24),
              if (isRunning && _sceneReady && widget.enable3d)
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) => Listener(
                      onPointerDown: (event) =>
                          _pointerDown(event, constraints.biggest),
                      onPointerMove: _pointerMove,
                      onPointerUp: _pointerUp,
                      onPointerCancel: _pointerCancel,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          SceneView(
                            _sceneAdapter!.scene,
                            camera: _sceneAdapter!.camera,
                          ),
                          Align(
                            alignment: Alignment.topCenter,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: DecoratedBox(
                                decoration: const BoxDecoration(
                                  color: Color(0xCC182138),
                                ),
                                child: Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  child: Text(
                                    '手势：$_gestureLabel',
                                    style: TextStyle(color: Colors.white),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (!isRunning && !isPaused)
                FilledButton(
                  onPressed: _startValidation,
                  child: const Text('开始验证'),
                ),
              if (isPaused)
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
    );
  }
}
