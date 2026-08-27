import 'package:flutter/material.dart';

import 'lifecycle_controller.dart';

enum ValidationSessionState { idle, running, paused }

class ValidationApp extends StatefulWidget {
  const ValidationApp({super.key});

  @override
  ValidationAppState createState() => ValidationAppState();
}

class ValidationAppState extends State<ValidationApp>
    with WidgetsBindingObserver {
  final LifecycleController lifecycle = LifecycleController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    lifecycle.addListener(_onLifecycleChanged);
  }

  @override
  void dispose() {
    lifecycle.removeListener(_onLifecycleChanged);
    lifecycle.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _onLifecycleChanged() => setState(() {});

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
              if (!isRunning && !isPaused)
                FilledButton(
                  onPressed: lifecycle.start,
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
