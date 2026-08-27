import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/widgets.dart';

import 'package:mobile/app/lifecycle_controller.dart';

void main() {
  test('lifecycle pauses only an active session and resumes explicitly', () {
    final controller = LifecycleController();

    controller.start();
    controller.didChangeAppLifecycleState(AppLifecycleState.paused);
    expect(controller.state, ValidationLifecycle.paused);

    controller.didChangeAppLifecycleState(AppLifecycleState.resumed);
    expect(controller.state, ValidationLifecycle.paused);

    controller.continueSession();
    expect(controller.state, ValidationLifecycle.running);
  });
}
