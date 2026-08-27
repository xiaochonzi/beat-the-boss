import 'package:flutter/widgets.dart';

enum ValidationLifecycle { idle, running, paused }

class LifecycleController extends ChangeNotifier {
  ValidationLifecycle state = ValidationLifecycle.idle;

  void start() {
    state = ValidationLifecycle.running;
    notifyListeners();
  }

  void didChangeAppLifecycleState(AppLifecycleState lifecycleState) {
    if (lifecycleState == AppLifecycleState.paused ||
        lifecycleState == AppLifecycleState.inactive ||
        lifecycleState == AppLifecycleState.detached) {
      if (state == ValidationLifecycle.running) {
        state = ValidationLifecycle.paused;
        notifyListeners();
      }
    }
  }

  void continueSession() {
    if (state == ValidationLifecycle.paused) {
      state = ValidationLifecycle.running;
      notifyListeners();
    }
  }
}
