import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/validation/device_result.dart';
import 'package:mobile/validation/validation_recorder.dart';

void main() {
  test('requires every representative device to pass before overall pass', () {
    final recorder = ValidationRecorder();
    recorder.add(
      DeviceResult(
        device: 'new iPhone',
        iosVersion: '18.3',
        fps: 60,
        coreCapabilitiesPass: true,
        lifecyclePass: true,
        stable: true,
      ),
    );
    recorder.add(
      DeviceResult(
        device: 'old iPhone',
        iosVersion: '16.7',
        fps: 29,
        coreCapabilitiesPass: true,
        lifecyclePass: true,
        stable: true,
      ),
    );

    expect(recorder.overallPass, isFalse);
    expect(recorder.decision, Flutter3dDecision.evaluateFallback);
  });
}
