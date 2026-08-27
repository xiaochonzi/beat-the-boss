import 'package:flutter/material.dart';
import 'package:flutter_scene/scene.dart';

import 'lifecycle_controller.dart';
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
  SceneAdapter? _sceneAdapter;
  bool _sceneReady = false;

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

  void _onLifecycleChanged() => setState(() {});

  void _startValidation() {
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
                  child: SceneView(
                    _sceneAdapter!.scene,
                    camera: _sceneAdapter!.camera,
                  ),
                ),
              if (!isRunning && !isPaused)
                FilledButton(
                  onPressed: _startValidation,
                  child: const Text('开始验证'),
                ),
              if (isPaused)
                FilledButton(
                  onPressed: lifecycle.continueSession,
                  child: const Text('继续'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
