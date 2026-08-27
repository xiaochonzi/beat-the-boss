import 'device_result.dart';

import 'validation_report.dart';

enum Flutter3dDecision { continueFlutter, evaluateFallback }

class ValidationRecorder {
  final List<DeviceResult> devices = [];

  void add(DeviceResult result) => devices.add(result);

  bool get overallPass =>
      devices.length >= 2 && devices.every((result) => result.pass);

  Flutter3dDecision get decision => overallPass
      ? Flutter3dDecision.continueFlutter
      : Flutter3dDecision.evaluateFallback;

  ValidationReport buildReport() =>
      ValidationReport(devices: List.unmodifiable(devices), decision: decision);
}
