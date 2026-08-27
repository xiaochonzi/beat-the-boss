import 'device_result.dart';

import 'validation_recorder.dart';

class ValidationReport {
  const ValidationReport({required this.devices, required this.decision});

  final List<DeviceResult> devices;
  final Flutter3dDecision decision;

  String toMarkdown() {
    final lines = <String>[
      '# Flutter 3D iOS 验证报告',
      '',
      '| 设备 | iOS | FPS | 核心能力 | 生命周期 | 稳定性 | 结果 |',
      '| --- | --- | ---: | --- | --- | --- | --- |',
      for (final result in devices)
        '| ${result.device} | ${result.iosVersion} | ${result.fps.toStringAsFixed(1)} | '
            '${result.coreCapabilitiesPass ? 'PASS' : 'FAIL'} | '
            '${result.lifecyclePass ? 'PASS' : 'FAIL'} | '
            '${result.stable ? 'PASS' : 'FAIL'} | '
            '${result.pass ? 'PASS' : 'FAIL'} |',
      '',
      '结论：${decision == Flutter3dDecision.continueFlutter ? '继续 Flutter 3D' : '评估 Godot/Unity'}',
    ];
    return lines.join('\n');
  }
}
